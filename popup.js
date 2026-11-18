/* Lassoft popup */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const PAGE_ONLY = ["area", "fullpage", "visible", "lasso", "element", "scrape", "pick", "media", "hidden", "inspect", "eyedropper", "palette"];
let tab;
(async () => {
  $("#ver").textContent = "v" + chrome.runtime.getManifest().version;
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const ok = /^(https?|file):/.test(tab?.url || "");
  if (!ok) { $("#blocked").hidden = false; $$("[data-tool], [data-fx]").forEach(b => { if (PAGE_ONLY.includes(b.dataset.tool) || b.dataset.fx) b.disabled = true, (b.style.opacity = .45); }); }
  else { try { const on = await chrome.tabs.sendMessage(tab.id, { type: "fxState" }); (on || []).forEach(n => $(`[data-fx="${n}"]`)?.setAttribute("aria-pressed", "true")); } catch {} }
  recent();
})();
$$("[data-tool]").forEach(b => b.addEventListener("click", async () => {
  const r = await chrome.runtime.sendMessage({ type: "run", tool: b.dataset.tool });
  if (r?.error) { const n = $("#blocked"); n.hidden = false; n.textContent = r.error; return; }
  window.close();
}));
$$("[data-fx]").forEach(b => b.addEventListener("click", async () => {
  const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on);
  const r = await chrome.runtime.sendMessage({ type: "fx", name: b.dataset.fx, on });
  if (Array.isArray(r)) $$("[data-fx]").forEach(x => x.setAttribute("aria-pressed", r.includes(x.dataset.fx)));
}));
function recent() {
  const q = indexedDB.open("lassoft", 1); q.onupgradeneeded = () => q.result.createObjectStore("caps", { keyPath: "id" });
  q.onsuccess = () => { const all = q.result.transaction("caps").objectStore("caps").getAll(); all.onsuccess = () => {
    const list = all.result.sort((a, b) => b.id - a.id).slice(0, 6); if (!list.length) return; $("#recentSec").hidden = false;
    $("#recent").innerHTML = list.map(c => `<button data-id="${c.id}" title="${(c.title || "").replace(/"/g, "&quot;")}"><img src="${c.thumb}" alt=""><span>${(c.host || "Capture").replace(/</g, "")}</span></button>`).join("");
    $("#recent").onclick = e => { const b = e.target.closest("button"); if (b) { chrome.tabs.create({ url: `editor.html?id=${b.dataset.id}` }); window.close(); } };
  }; };
}
