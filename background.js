/* Lassoft service worker: runs tools, captures and stitches screenshots, stores captures,
   and handles downloads. Nothing is uploaded anywhere. */
const TOOLS_NEED_PAGE = ["area", "lasso", "element", "visible", "fullpage", "scrape", "pick", "media", "hidden", "inspect", "eyedropper", "palette"];
async function inject(tabId) { await chrome.scripting.executeScript({ target: { tabId }, files: ["toolkit.js"] }); }
async function runTool(tab, tool) {
  if (tool === "record") return chrome.tabs.create({ url: "recorder.html" });
  if (tool === "library") return chrome.tabs.create({ url: "editor.html" });
  if (!/^(https?|file):/.test(tab?.url || "")) return { error: "Chrome doesn’t allow extensions on this page. Try it on a normal website." };
  try { await inject(tab.id); await chrome.tabs.sendMessage(tab.id, { type: "tool", tool }); return { ok: true }; } catch (e) { return { error: String(e.message || e) }; }
}

/* ---------- storage of captures (IndexedDB) ---------- */
const db = () => new Promise((res, rej) => { const r = indexedDB.open("lassoft", 1); r.onupgradeneeded = () => r.result.createObjectStore("caps", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function saveCapture(rec) {
  const d = await db(); await new Promise((res, rej) => { const tx = d.transaction("caps", "readwrite"); tx.objectStore("caps").put(rec); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  const all = await new Promise(res => { const q = d.transaction("caps").objectStore("caps").getAllKeys(); q.onsuccess = () => res(q.result); });
  if (all.length > 30) { const tx = d.transaction("caps", "readwrite"); all.sort().slice(0, all.length - 30).forEach(k => tx.objectStore("caps").delete(k)); }
}
async function thumbOf(canvas) { const k = Math.min(1, 240 / canvas.width), t = new OffscreenCanvas(Math.max(1, Math.round(canvas.width * k)), Math.max(1, Math.round(canvas.height * k))); t.getContext("2d").drawImage(canvas, 0, 0, t.width, t.height); const b = await t.convertToBlob({ type: "image/jpeg", quality: .7 }); return await blobToDataUrl(b); }
function blobToDataUrl(b) { return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }

/* ---------- screenshots ---------- */
let lastShot = 0; const wait = ms => new Promise(r => setTimeout(r, ms));
async function shot(windowId) {
  const gap = Date.now() - lastShot; if (gap < 560) await wait(560 - gap);
  const url = await chrome.tabs.captureVisibleTab(windowId, { format: "png" }); lastShot = Date.now();
  return createImageBitmap(await (await fetch(url)).blob());
}
async function captureRect(tab, rect, points, kind, title) {
  const send = m => chrome.tabs.sendMessage(tab.id, m), m = await send({ type: "prepare" }), dpr = m.dpr;
  rect = { x: Math.max(0, rect.x), y: Math.max(0, rect.y), w: Math.min(rect.w, m.docW - Math.max(0, rect.x)), h: Math.min(rect.h, m.docH - Math.max(0, rect.y)) };
  let W = rect.w * dpr, H = rect.h * dpr, scale = 1; if (H > 30000) scale = 30000 / H; if (W * H * scale * scale > 2.4e8) scale = Math.sqrt(2.4e8 / (W * H));
  const cv = new OffscreenCanvas(Math.max(1, Math.round(W * scale)), Math.max(1, Math.round(H * scale))), x = cv.getContext("2d");
  const orig = { x: m.sx, y: m.sy };
  try {
    await wait(60);
    const fits = rect.x >= m.sx && rect.y >= m.sy && rect.x + rect.w <= m.sx + m.vw + 1 && rect.y + rect.h <= m.sy + m.vh + 1;
    const steps = []; if (fits) steps.push([m.sx, m.sy]); else for (let y = rect.y; y < rect.y + rect.h; y += m.vh) for (let xx = rect.x; xx < rect.x + rect.w; xx += m.vw) steps.push([xx, y]);
    for (let i = 0; i < steps.length; i++) {
      let pos = { sx: m.sx, sy: m.sy };
      if (!fits) { pos = await send({ type: "scrollTo", x: steps[i][0], y: steps[i][1], wait: 200 }); if (i > 0) await send({ type: "hideFixed" }); }
      if (steps.length > 1) chrome.action.setBadgeText({ tabId: tab.id, text: `${i + 1}/${steps.length}` });
      const bmp = await shot(tab.windowId);
      const vx0 = Math.max(rect.x, pos.sx), vy0 = Math.max(rect.y, pos.sy), vx1 = Math.min(rect.x + rect.w, pos.sx + m.vw), vy1 = Math.min(rect.y + rect.h, pos.sy + m.vh);
      if (vx1 > vx0 && vy1 > vy0) x.drawImage(bmp, (vx0 - pos.sx) * dpr, (vy0 - pos.sy) * dpr, (vx1 - vx0) * dpr, (vy1 - vy0) * dpr, (vx0 - rect.x) * dpr * scale, (vy0 - rect.y) * dpr * scale, (vx1 - vx0) * dpr * scale, (vy1 - vy0) * dpr * scale);
      bmp.close();
    }
  } finally { await send({ type: "restore", scroll: orig }).catch(() => {}); chrome.action.setBadgeText({ tabId: tab.id, text: "" }); }
  let out = cv;
  if (points?.length > 2) {
    out = new OffscreenCanvas(cv.width, cv.height); const o = out.getContext("2d"), k = dpr * scale;
    o.beginPath(); points.forEach(([px, py], i) => o[i ? "lineTo" : "moveTo"]((px - rect.x) * k, (py - rect.y) * k)); o.closePath(); o.clip(); o.drawImage(cv, 0, 0);
  }
  const blob = await out.convertToBlob({ type: "image/png" }), id = Date.now();
  let host = ""; try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch {}
  await saveCapture({ id, blob, w: out.width, h: out.height, title: title || tab.title || "", url: tab.url, host, kind, dpr, thumb: await thumbOf(out) });
  await chrome.tabs.create({ url: `editor.html?id=${id}`, index: tab.index + 1 });
  return { ok: true, id };
}

/* ---------- messages ---------- */
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (m.type === "run") { (async () => { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); reply(await runTool(tab, m.tool)); })(); return true; }
  if (m.type === "captureRect" && sender.tab) { captureRect(sender.tab, m.rect, m.points, m.kind, m.title).then(reply).catch(e => reply({ error: "Couldn’t capture this page: " + (e.message || e) })); return true; }
  if (m.type === "snap" && sender.tab) { (async () => { try { const url = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "jpeg", quality: 85 }); const b = await createImageBitmap(await (await fetch(url)).blob()); reply({ url, w: b.width, h: b.height }); } catch { reply(null); } })(); return true; }
  if (m.type === "download") { chrome.downloads.download({ url: m.url, filename: m.filename?.replace(/[\\:*?"<>|]+/g, "_"), conflictAction: "uniquify" }).then(id => reply({ id })).catch(e => reply({ error: String(e) })); return true; }
  if (m.type === "fx") { (async () => { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); try { await inject(tab.id); reply(await chrome.tabs.sendMessage(tab.id, m)); } catch (e) { reply({ error: String(e) }); } })(); return true; }
});

/* ---------- menus and shortcuts ---------- */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  const add = (id, title, contexts = ["page", "selection", "image", "link", "video", "audio"]) => chrome.contextMenus.create({ id, title, contexts });
  chrome.contextMenus.create({ id: "lassoft", title: "Lassoft", contexts: ["page", "selection", "image", "link", "video", "audio"] });
  [["area", "Capture an area"], ["fullpage", "Capture the full page"], ["element", "Capture an element"], ["scrape", "Scrape data from this page"], ["media", "Find media and files"], ["hidden", "Show hidden items"]].forEach(([id, t]) => chrome.contextMenus.create({ id, parentId: "lassoft", title: t, contexts: ["page", "selection", "image", "link", "video", "audio"] }));
  void add; if (reason === "install") chrome.tabs.create({ url: "welcome.html" });
});
chrome.contextMenus.onClicked.addListener((info, tab) => runTool(tab, info.menuItemId));
chrome.commands.onCommand.addListener(async cmd => { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); runTool(tab, { "capture-area": "area", "capture-full": "fullpage", "scrape-page": "scrape" }[cmd] || cmd); });
