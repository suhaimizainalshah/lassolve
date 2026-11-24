/* Lassolve capture editor: annotate, crop, blur, copy and download. Also the captures library. */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#111827", "#ffffff"];
let out = null, cropAspect = null, cap = null, img = null, objs = [], crop = null, hist = [], fut = [], tool = "arrow", color = COLORS[0], drag = null, view = 1;
const cv = $("#cv"), ctx = cv.getContext("2d");
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }
const db = () => new Promise((res, rej) => { const r = indexedDB.open("lassoft", 1) /* internal name kept, so captures saved before the rename to Lassolve stay */; r.onupgradeneeded = () => r.result.createObjectStore("caps", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function all() { const d = await db(); return new Promise(res => { const q = d.transaction("caps").objectStore("caps").getAll(); q.onsuccess = () => res(q.result.sort((a, b) => b.id - a.id)); }); }
async function get(id) { const d = await db(); return new Promise(res => { const q = d.transaction("caps").objectStore("caps").get(id); q.onsuccess = () => res(q.result); }); }
async function del(id) { const d = await db(); return new Promise(res => { const tx = d.transaction("caps", "readwrite"); tx.objectStore("caps").delete(id); tx.oncomplete = res; }); }
async function put(rec) { const d = await db(); return new Promise(res => { const tx = d.transaction("caps", "readwrite"); tx.objectStore("caps").put(rec); tx.oncomplete = res; }); }

/* ---------- toolbar ---------- */
$("#colors").innerHTML = COLORS.map((c, i) => `<button class="sw" data-c="${c}" style="background:${c}" aria-label="Colour ${c}" aria-pressed="${i === 0}"></button>`).join("");
$("#colors").onclick = e => { const b = e.target.closest("[data-c]"); if (!b) return; color = b.dataset.c; $$("#colors .sw").forEach(x => x.setAttribute("aria-pressed", x === b)); };
function setTool(t) { const was = tool; tool = t; if ((was === "crop") !== (t === "crop") && img) { layout(); draw(); syncCrop(); } $$("#tools .tb").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t)); cv.style.cursor = t === "text" ? "text" : "crosshair"; }
$("#tools").onclick = e => { const b = e.target.closest("[data-t]"); if (b) setTool(b.dataset.t); };
const snap = () => JSON.stringify({ objs, crop, out });
function commit() { hist.push(snap()); if (hist.length > 60) hist.shift(); fut = []; sync(); }
function sync() { $("#undo").disabled = !hist.length; $("#redo").disabled = !fut.length; }
function undo() { if (!hist.length) return; fut.push(snap()); ({ objs, crop, out = null } = JSON.parse(hist.pop())); sync(); layout(); draw(); syncCrop(); }
function redo() { if (!fut.length) return; hist.push(snap()); ({ objs, crop, out = null } = JSON.parse(fut.pop())); sync(); layout(); draw(); syncCrop(); }
$("#undo").onclick = undo; $("#redo").onclick = redo;

/* ---------- drawing ---------- */
const full = () => ({ x: 0, y: 0, w: img.width, h: img.height });
const area = () => (tool === "crop" ? full() : crop || full());
function layout() {
  const a = area(), st = $("#stage"), maxW = st.clientWidth - 48, maxH = st.clientHeight - 48;
  const dpr0 = cap?.dpr || 1, natural = 1 / dpr0;
  view = Math.min(natural, maxW / a.w); if (a.h / a.w < 2) view = Math.min(view, maxH / a.h); view = Math.max(view, Math.min(natural, 280 / a.w));
  const dpr = devicePixelRatio || 1; cv.width = Math.round(a.w * view * dpr); cv.height = Math.round(a.h * view * dpr); cv.style.width = a.w * view + "px"; cv.style.height = a.h * view + "px";
}
function render(c, k, a, preview) {
  const x = c.getContext("2d"); x.save(); x.scale(k, k); x.translate(-a.x, -a.y); x.drawImage(img, 0, 0);
  for (const o of objs) paint(x, o);
  if (preview) paint(x, preview);
  x.restore();
}
function arrowHead(x, x1, y1, x2, y2, w) { const a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(14, w * 3.2); x.beginPath(); x.moveTo(x2, y2); x.lineTo(x2 - L * Math.cos(a - .45), y2 - L * Math.sin(a - .45)); x.lineTo(x2 - L * Math.cos(a + .45), y2 - L * Math.sin(a + .45)); x.closePath(); x.fill(); }
function paint(x, o) {
  x.save(); x.strokeStyle = x.fillStyle = o.c; x.lineWidth = o.w; x.lineCap = x.lineJoin = "round";
  if (o.t === "arrow") { x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 4; const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1), back = Math.max(10, o.w * 2.4); x.beginPath(); x.moveTo(o.x1, o.y1); x.lineTo(o.x2 - back * Math.cos(a), o.y2 - back * Math.sin(a)); x.stroke(); arrowHead(x, o.x1, o.y1, o.x2, o.y2, o.w); }
  if (o.t === "rect" || o.t === "ellipse") x.lineWidth = o.lw || 6;
  if (o.t === "rect") { x.beginPath(); x.roundRect(Math.min(o.x, o.x + o.w), Math.min(o.y, o.y + o.h), Math.abs(o.w), Math.abs(o.h), 6); x.stroke(); }
  if (o.t === "ellipse") { x.beginPath(); x.ellipse(o.x + o.w / 2, o.y + o.h / 2, Math.abs(o.w / 2), Math.abs(o.h / 2), 0, 0, Math.PI * 2); x.stroke(); }
  if (o.t === "pen" || o.t === "hl") { if (o.t === "hl") { x.globalAlpha = .35; x.lineWidth = o.w * 3.5; x.lineCap = "square"; } x.beginPath(); o.pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
  if (o.t === "text") { const size = o.size || 22; x.font = `700 ${size}px system-ui, sans-serif`; x.textBaseline = "top"; x.lineWidth = size / 6; x.strokeStyle = o.c === "#ffffff" ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.9)"; o.text.split("\n").forEach((l, i) => { x.strokeText(l, o.x, o.y + i * size * 1.2); x.fillText(l, o.x, o.y + i * size * 1.2); }); }
  if (o.t === "num") { const r = 15 + o.w; x.beginPath(); x.arc(o.x, o.y, r, 0, Math.PI * 2); x.fill(); x.fillStyle = o.c === "#ffffff" ? "#111" : "#fff"; x.font = `800 ${r * 1.1}px system-ui`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(o.n), o.x, o.y + 1); }
  if (o.t === "blur") { const rx = Math.min(o.x, o.x + o.w), ry = Math.min(o.y, o.y + o.h), rw = Math.abs(o.w), rh = Math.abs(o.h); if (rw > 2 && rh > 2) { const b = Math.max(6, Math.round(Math.min(rw, rh) / 8)), t = new OffscreenCanvas(Math.max(1, Math.ceil(rw / b)), Math.max(1, Math.ceil(rh / b))); t.getContext("2d").drawImage(img, rx, ry, rw, rh, 0, 0, t.width, t.height); x.imageSmoothingEnabled = false; x.drawImage(t, rx, ry, rw, rh); } }
  if (o.t === "crop") { x.setLineDash([8, 6]); x.lineWidth = 2; x.strokeStyle = "#fff"; x.fillStyle = "rgba(0,0,0,.45)"; const W = img.width, H = img.height, rx = Math.min(o.x, o.x + o.w), ry = Math.min(o.y, o.y + o.h), rw = Math.abs(o.w), rh = Math.abs(o.h); x.beginPath(); x.rect(0, 0, W, H); x.rect(rx, ry, rw, rh); x.fill("evenodd"); x.strokeRect(rx, ry, rw, rh); x.setLineDash([]);
    // live size, inside the top-left corner so it is never cut off
    const u = (devicePixelRatio || 1) / x.getTransform().a, fs = 13 * u, label = `${Math.round(rw)} × ${Math.round(rh)} px${out ? `  →  ${out.w} × ${out.h}` : ""}`; x.font = `700 ${fs}px system-ui, sans-serif`; const tw = x.measureText(label).width, pad = 6 * u, bx = rx + pad, by = rh > fs * 3 ? ry + pad : Math.max(0, ry - fs - pad * 3);
    x.fillStyle = "rgba(10,12,14,.82)"; x.beginPath(); x.roundRect(bx, by, tw + pad * 2, fs + pad * 1.6, 5 * u); x.fill(); x.fillStyle = "#fff"; x.textBaseline = "middle"; x.fillText(label, bx + pad, by + (fs + pad * 1.6) / 2); }
  x.restore();
}
function draw(preview) { const a = area(); render(cv, cv.width / a.w, a, preview || (tool === "crop" && crop ? { t: "crop", ...crop } : null)); }
const pt = e => { const r = cv.getBoundingClientRect(), a = area(); return [a.x + (e.clientX - r.left) / r.width * a.w, a.y + (e.clientY - r.top) / r.height * a.h]; };
cv.addEventListener("pointerdown", e => {
  if (!img) return; const [x, y] = pt(e), w = +$("#width").value;
  if (tool === "text") { e.preventDefault(); return textAt(e, x, y); }
  if (tool === "num") { commit(); objs.push({ t: "num", x, y, n: objs.filter(o => o.t === "num").length + 1, c: color, w }); return draw(); }
  cv.setPointerCapture(e.pointerId);
  const o = tool === "pen" || tool === "hl" ? { t: tool, pts: [[x, y]], c: color, w } : tool === "arrow" ? { t: "arrow", x1: x, y1: y, x2: x, y2: y, c: color, w } : { t: tool, x, y, w: 0, h: 0, c: color, lw: w };
  drag = { x, y, o };
});
cv.addEventListener("pointermove", e => {
  if (!drag) return; const [x, y] = pt(e), o = drag.o;
  if (o.t === "pen" || o.t === "hl") o.pts.push([x, y]);
  else if (o.t === "arrow") { o.x2 = x; o.y2 = y; }
  else { o.x = drag.x; o.y = drag.y; o.w = x - drag.x; o.h = y - drag.y; if (o.t === "crop") { const fa = full(); o.w = Math.max(-drag.x, Math.min(fa.w - drag.x, o.w)); o.h = Math.max(-drag.y, Math.min(fa.h - drag.y, o.h)); if (cropAspect) { o.h = Math.sign(o.h || 1) * Math.abs(o.w) / cropAspect; if (drag.y + o.h > fa.h || drag.y + o.h < 0) { o.h = (o.h > 0 ? fa.h - drag.y : -drag.y); o.w = Math.sign(o.w || 1) * Math.abs(o.h) * cropAspect; } } syncCrop(o); } if (e.shiftKey && (o.t === "rect" || o.t === "ellipse")) { const s = Math.max(Math.abs(o.w), Math.abs(o.h)); o.w = Math.sign(o.w || 1) * s; o.h = Math.sign(o.h || 1) * s; } }
  draw(o);
});
cv.addEventListener("pointerup", () => {
  if (!drag) return; const o = drag.o; drag = null;
  if ((o.t === "rect" || o.t === "ellipse" || o.t === "blur" || o.t === "crop") && (Math.abs(o.w) < 4 || Math.abs(o.h) < 4)) return draw();
  if (o.t === "arrow" && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 6) return draw();
  commit();
  if (o.t === "crop") { crop = { x: Math.max(0, Math.min(o.x, o.x + o.w)), y: Math.max(0, Math.min(o.y, o.y + o.h)), w: Math.abs(o.w), h: Math.abs(o.h) }; crop.w = Math.min(crop.w, img.width - crop.x); crop.h = Math.min(crop.h, img.height - crop.y); roundCrop(); syncCrop(); draw(); toast(out ? `Crop set. The download will be exactly ${out.w} × ${out.h} px.` : `Crop set: ${Math.round(crop.w)} × ${Math.round(crop.h)} px. Choose another tool to see it.`); return; toast("Cropped. Undo to restore."); }
  else objs.push(o);
  draw();
});
function textAt(e, x, y) {
  const t = document.createElement("textarea"); t.className = "txtin"; t.rows = 1; const st = $("#stage").getBoundingClientRect();
  t.style.left = e.clientX - st.left + $("#stage").scrollLeft + "px"; t.style.top = e.clientY - st.top + $("#stage").scrollTop - 12 + "px"; t.style.color = color === "#ffffff" ? "#111" : color;
  $("#stage").appendChild(t); t.focus(); requestAnimationFrame(() => t.focus());
  const fin = () => { const v = t.value.trim(); t.remove(); if (!v) return; commit(); objs.push({ t: "text", x, y: y - 10, text: v, c: color, size: 16 + +$("#width").value * 2 }); draw(); };
  t.addEventListener("keydown", ev => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); t.blur(); } if (ev.key === "Escape") { t.value = ""; t.blur(); } ev.stopPropagation(); });
  t.addEventListener("input", () => { t.style.width = Math.max(120, t.value.split("\n").reduce((m, l) => Math.max(m, l.length), 0) * 12 + 20) + "px"; t.rows = t.value.split("\n").length; });
  t.addEventListener("blur", fin, { once: true });
}

/* ---------- PDF (built in the browser, no uploads) ---------- */
const enc = new TextEncoder();
async function jpegOf(canvas, q = .92) { const b = await new Promise(r => canvas.toBlob(r, "image/jpeg", q)); return new Uint8Array(await b.arrayBuffer()); }
/* pages: [{ jpg: Uint8Array, iw, ih, pw, ph, x, y, w, h }] in points (1/72 inch) */
function buildPdf(pages, title = "Lassolve capture") {
  const parts = [], offsets = []; let len = 0;
  const push = d => { const u = typeof d === "string" ? enc.encode(d) : d; parts.push(u); len += u.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push(`\nendobj\n`); };
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const N = pages.length, kids = pages.map((_, i) => `${4 + i * 3} 0 R`).join(" ");
  const esc = t => t.replace(/[\\()]/g, m => "\\" + m).replace(/[^\x20-\x7e]/g, "");
  obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${N} >>`));
  obj(3, () => push(`<< /Title (${esc(title)}) /Producer (Lassolve) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}) >>`));
  pages.forEach((pg, i) => {
    const P = 4 + i * 3, C = P + 1, I = P + 2, f = v => (+v).toFixed(2);
    const content = `q ${f(pg.w)} 0 0 ${f(pg.h)} ${f(pg.x)} ${f(pg.ph - pg.y - pg.h)} cm /Im0 Do Q`;
    obj(P, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pg.pw)} ${f(pg.ph)}] /Resources << /XObject << /Im0 ${I} 0 R >> >> /Contents ${C} 0 R >>`));
    obj(C, () => { push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); });
    obj(I, () => { push(`<< /Type /XObject /Subtype /Image /Width ${pg.iw} /Height ${pg.ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpg.length} >>\nstream\n`); push(pg.jpg); push("\nendstream"); });
  });
  const xref = len, total = 4 + N * 3;
  push(`xref\n0 ${total}\n0000000000 65535 f \n`); for (let n = 1; n < total; n++) push(String(offsets[n]).padStart(10, "0") + " 00000 n \n");
  push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}
function whiteCanvas(src) { const c = document.createElement("canvas"); c.width = src.width; c.height = src.height; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0); return c; }
/* one page sized to the image (shrunk if taller than PDF's 200-inch page limit) */
async function pdfPagesSingle(canvas, dpr = 1) {
  let pw = canvas.width / dpr * .75, ph = canvas.height / dpr * .75; const max = 14400; if (ph > max) { pw *= max / ph; ph = max; } if (pw > max) { ph *= max / pw; pw = max; }
  return [{ jpg: await jpegOf(whiteCanvas(canvas)), iw: canvas.width, ih: canvas.height, pw, ph, x: 0, y: 0, w: pw, h: ph }];
}
/* A4 portrait (or landscape for wide captures), split across pages with margins */
async function pdfPagesA4(canvas) {
  const land = canvas.width > canvas.height * 1.15, PW = land ? 841.89 : 595.28, PH = land ? 595.28 : 841.89, M = 28, cw = PW - M * 2, chMax = PH - M * 2;
  const k = cw / canvas.width, sliceH = Math.max(1, Math.floor(chMax / k)), out = [];
  for (let y = 0; y < canvas.height; y += sliceH) {
    const h = Math.min(sliceH, canvas.height - y), c = document.createElement("canvas"); c.width = canvas.width; c.height = h;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, h); x.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    out.push({ jpg: await jpegOf(c), iw: c.width, ih: h, pw: PW, ph: PH, x: M, y: M, w: cw, h: h * k });
  }
  return out;
}

/* ---------- export ---------- */
function exportCanvas() { const a = crop || full(), c = document.createElement("canvas"); if (out) { c.width = out.w; c.height = out.h; render(c, out.w / a.w, a); } else { c.width = Math.round(a.w); c.height = Math.round(a.h); render(c, 1, a); } return c; }
async function finalBlob() {
  const c = exportCanvas();
  const fmt = $("#fmt").value;
  if (fmt === "pdf") return buildPdf(await pdfPagesSingle(c, cap?.dpr || 1), cap?.title || "Lassolve capture");
  if (fmt === "pdfa4") return buildPdf(await pdfPagesA4(c), cap?.title || "Lassolve capture"); if (fmt === "jpeg") { const x = c.getContext("2d"); x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }
  return new Promise(r => c.toBlob(r, "image/" + fmt, .92));
}
const extOf = f => (f === "jpeg" ? "jpg" : f.startsWith("pdf") ? "pdf" : f);
const fname = () => `${cap?.host || "capture"}-${new Date(cap?.id || Date.now()).toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${extOf($("#fmt").value)}`;
async function save() {
  const f = $("#fmt").value; if (f.startsWith("pdf")) toast("Making your PDF…");
  const b = await finalBlob(), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = fname(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(f.startsWith("pdf") ? "PDF saved to your downloads" : "Saved to your downloads"); persist(); try { localStorage.setItem("lassoft-fmt" /* internal setting name kept */, f); } catch {}
}
try { const f = localStorage.getItem("lassoft-fmt" /* internal setting name kept */); if (f && [...$("#fmt").options].some(o => o.value === f)) $("#fmt").value = f; } catch {}
async function copy() { try { const c = exportCanvas(); const b = await new Promise(r => c.toBlob(r, "image/png")); await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); toast("Copied. Paste it anywhere."); } catch { toast("Couldn’t copy. Try Download instead."); } }
$("#save").onclick = save; $("#copy").onclick = copy;
async function persist() { if (!cap) return; cap.edits = { objs, crop, out }; await put(cap); }

/* ---------- library ---------- */
async function library(currentId) {
  const caps = await all(); $("#lib").innerHTML = caps.map(c => `<button data-id="${c.id}" aria-current="${c.id === currentId}" title="${(c.title || "").replace(/"/g, "&quot;")}"><img src="${c.thumb}" alt=""><span>${new Date(c.id).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span></button>`).join("") || `<p style="color:var(--muted);font-size:12.5px;margin:0">No captures yet.</p>`;
  $("#lib").onclick = e => { const b = e.target.closest("button"); if (b) location.search = "?id=" + b.dataset.id; };
  return caps;
}
$("#delCur").onclick = async () => { if (!cap || !confirm("Delete this capture?")) return; await del(cap.id); const caps = await all(); location.search = caps[0] ? "?id=" + caps[0].id : ""; };
async function gallery() {
  const caps = await all(); $(".side").hidden = true; $(".work").style.gridTemplateColumns = "1fr"; $$("#tools, #colors, #width, #undo, #redo, #fmt, #copy, #save").forEach(x => (x.closest(".grp") || x).hidden = true);
  const st = $("#stage"); st.style.placeItems = "start center";
  st.innerHTML = caps.length ? `<div style="width:100%;max-width:1100px"><h1 style="margin:0 0 4px;font-size:22px">My captures</h1><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px"><p style="margin:0;color:var(--muted)">Your last ${caps.length} capture${caps.length > 1 ? "s" : ""}, stored only in this browser. Click one to edit or download it.</p><button class="btn primary" id="allPdf">Save all as one PDF</button></div></div><div class="gallery">${caps.map(c => `<div class="card"><button class="open" data-id="${c.id}"><img src="${c.thumb}" alt=""></button><div class="meta"><span title="${(c.title || "").replace(/"/g, "&quot;")}">${(c.host || "Capture").replace(/</g, "")} · ${new Date(c.id).toLocaleDateString()}</span><button class="del" data-del="${c.id}" aria-label="Delete">Delete</button></div></div>`).join("")}</div>`
    : `<div class="empty" style="margin:auto"><h1>No captures yet</h1><p>Click the Lassolve icon on any page and choose Capture area, Full page or Element. Captures appear here so you can edit and download them.</p></div>`;
  $("#allPdf")?.addEventListener("click", async () => {
    const b = $("#allPdf"); b.disabled = true; b.textContent = "Making PDF…"; const pages = [];
    for (const c of [...caps].reverse()) {
      const bmp = await createImageBitmap(c.blob), cv2 = document.createElement("canvas"); cv2.width = bmp.width; cv2.height = bmp.height; const x = cv2.getContext("2d");
      x.drawImage(bmp, 0, 0); if (c.edits) { const keep = { objs, crop, img }; img = bmp; objs = c.edits.objs || []; crop = c.edits.crop || null; out = c.edits.out || null; const a = area(); cv2.width = Math.round(a.w); cv2.height = Math.round(a.h); render(cv2, 1, a); ({ objs, crop, img } = keep); }
      pages.push(...await pdfPagesA4(cv2));
    }
    const pdf = buildPdf(pages, "Lassolve captures"), a = document.createElement("a"); a.href = URL.createObjectURL(pdf); a.download = `lassolve-captures-${new Date().toISOString().slice(0, 10)}.pdf`; a.click();
    b.disabled = false; b.textContent = "Save all as one PDF"; toast(`PDF saved with ${caps.length} capture${caps.length > 1 ? "s" : ""}`);
  });
  st.onclick = async e => { const o = e.target.closest("[data-id]"), d = e.target.closest("[data-del]"); if (d) { if (confirm("Delete this capture?")) { await del(+d.dataset.del); gallery(); } return; } if (o) location.search = "?id=" + o.dataset.id; };
  document.title = "Lassolve captures";
}

/* ---------- start ---------- */
(async () => {
  const id = +new URLSearchParams(location.search).get("id");
  if (!id) return gallery();
  cap = await get(id); if (!cap) return gallery();
  img = await createImageBitmap(cap.blob); if (cap.edits) { objs = cap.edits.objs || []; crop = cap.edits.crop || null; out = cap.edits.out || null; }
  const d = cap.dpr || 1;
  $("#info").innerHTML = `<h2>This capture</h2><div><strong>${(cap.title || "Untitled").replace(/</g, "")}</strong></div>${cap.url ? `<a href="${cap.url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${cap.url.replace(/</g, "").slice(0, 120)}</a>` : ""}<div style="color:var(--muted)">${img.width} × ${img.height} px${d > 1 ? ` (${Math.round(img.width / d)} × ${Math.round(img.height / d)} on screen)` : ""} · ${new Date(cap.id).toLocaleString()}</div>`;
  document.title = `Lassolve: ${cap.title || "capture"}`; setTimeout(() => syncCrop(), 0);
  layout(); draw(); library(id); setTool("arrow");
  addEventListener("resize", () => { layout(); draw(); });
  addEventListener("beforeunload", persist);
})();
addEventListener("keydown", e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; } if (mod && k === "y") { e.preventDefault(); redo(); return; }
  if (mod && k === "s") { e.preventDefault(); save(); return; } if (mod && k === "c") { e.preventDefault(); copy(); return; }
  const map = { a: "arrow", r: "rect", o: "ellipse", p: "pen", h: "hl", t: "text", n: "num", b: "blur", c: "crop" }; if (!mod && map[k]) setTool(map[k]);
  if (k === "escape" && drag) { drag = null; draw(); }
});


/* ---------- Crop and size panel: exact numbers, aspect lock, exact output size ---------- */
const PRESETS = [[1280, 800], [1920, 1080], [1080, 1080], [1080, 1350], [1200, 630], [1584, 396]];
$("#csPresets").innerHTML = PRESETS.map(([w, h]) => `<button class="chip" data-pw="${w}" data-ph="${h}">${w} × ${h}</button>`).join("");
function roundCrop() { if (!crop) return; for (const k of ["x", "y", "w", "h"]) crop[k] = Math.round(crop[k]); }
function syncCrop(live) {
  if (!img) return; $("#cropSec").hidden = false; const a = live ? { x: Math.min(live.x, live.x + live.w), y: Math.min(live.y, live.y + live.h), w: Math.abs(live.w), h: Math.abs(live.h) } : crop || full();
  const set = (id, v) => { const el = $(id); if (document.activeElement !== el) el.value = Math.round(v); };
  set("#csW", a.w); set("#csH", a.h); set("#csX", a.x); set("#csY", a.y);
  $("#csNow").innerHTML = `Image <b>${img.width} × ${img.height}</b> px · ${crop || live ? "crop" : "no crop"} <b>${Math.round(a.w)} × ${Math.round(a.h)}</b>${out ? ` · download <b>${out.w} × ${out.h}</b>` : ""}`;
  $("#csNote").textContent = out && (out.w > a.w + 1 || out.h > a.h + 1) ? `Your crop is smaller than ${out.w} × ${out.h}, so the download will be enlarged and may look soft. Capture a larger area if you can.` : "";
  $("#csClear").hidden = !crop && !out; $$("#csAspect .chip").forEach(c => c.setAttribute("aria-pressed", (c.dataset.a === "free" && !cropAspect) || +c.dataset.a === cropAspect));
}
function applyNumbers() {
  if (!img) return; const W = img.width, H = img.height; let w = Math.max(4, Math.min(W, +$("#csW").value || W)), h = Math.max(4, Math.min(H, +$("#csH").value || H));
  const x = Math.max(0, Math.min(W - w, +$("#csX").value || 0)), y = Math.max(0, Math.min(H - h, +$("#csY").value || 0));
  commit(); crop = { x, y, w, h }; roundCrop(); layout(); draw(); syncCrop(); persist();
}
function cropToSize(w, h) {
  if (!img) return; commit(); const W = img.width, H = img.height, a = w / h; let cw = W, ch = W / a; if (ch > H) { ch = H; cw = H * a; }
  crop = { x: (W - cw) / 2, y: (H - ch) / 2, w: cw, h: ch }; roundCrop(); out = { w, h }; cropAspect = a; setTool("crop"); layout(); draw(); syncCrop(); persist();
  toast(`Move or redraw the box to choose what to keep. The download will be exactly ${w} × ${h} px.`);
}
["#csW", "#csH", "#csX", "#csY"].forEach(id => $(id).addEventListener("change", applyNumbers));
$("#csPresets").onclick = e => { const b = e.target.closest("[data-pw]"); if (b) cropToSize(+b.dataset.pw, +b.dataset.ph); };
$("#csUse").onclick = () => { const w = Math.round(+$("#csOW").value), h = Math.round(+$("#csOH").value); if (!(w >= 16 && h >= 16 && w <= 10000 && h <= 10000)) return toast("Type a width and height between 16 and 10,000 pixels."); cropToSize(w, h); };
$("#csAspect").onclick = e => { const b = e.target.closest("[data-a]"); if (!b) return; cropAspect = b.dataset.a === "free" ? null : +b.dataset.a; out = null; setTool("crop"); syncCrop(); toast(cropAspect ? "Draw a box: it keeps this shape." : "Draw any box shape."); };
$("#csClear").onclick = () => { commit(); crop = null; out = null; cropAspect = null; layout(); draw(); syncCrop(); persist(); toast("Crop removed"); };
// Mark for feedback: hand the finished image to the marking page through this extension's own database
document.getElementById("markBtn").onclick = async () => { const blob = await finalBlob(), fr = new FileReader();
  fr.onload = () => { const q = indexedDB.open("lassolve-mark", 1); q.onupgradeneeded = () => q.result.createObjectStore("kv");
    q.onsuccess = () => { const t = q.result.transaction("kv", "readwrite"); t.objectStore("kv").put({ src: fr.result, name: document.title }, "image"); t.oncomplete = () => chrome.tabs.create({ url: chrome.runtime.getURL("marking.html") }); }; };
  fr.readAsDataURL(blob); };
