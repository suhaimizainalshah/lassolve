/* Lassoft page toolkit. Injected only when you use Lassoft on a page. All UI lives in a closed
   Shadow DOM so it can't clash with the site's styles, and everything runs on your device. */
(() => {
  if (window.__lassoft) return;
  const send = m => new Promise(res => { try { chrome.runtime.sendMessage(m, r => { void chrome.runtime.lastError; res(r); }); } catch { res(null); } });
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const host = location.hostname.replace(/^www\./, "") || "page";

  /* ---------- shadow UI ---------- */
  const root = document.createElement("lassoft-ui"); root.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none";
  const sh = root.attachShadow({ mode: "closed" });
  sh.innerHTML = `<style>
  :host{--bg:#fff;--panel:#f6f7fb;--ink:#14161c;--muted:#5f6675;--line:#e3e6ef;--accent:#4f46e5;--accent2:#06b6d4;--ok:#16a34a;--warn:#ea580c;color-scheme:light}
  @media (prefers-color-scheme:dark){:host{--bg:#16181f;--panel:#1e2129;--ink:#eef0f6;--muted:#9aa1b2;--line:#2c303b;--accent:#818cf8;--accent2:#22d3ee;color-scheme:dark}}
  *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  .layer{position:fixed;inset:0;pointer-events:auto;cursor:crosshair}
  .shade{position:fixed;inset:0;background:rgba(10,12,20,.38)}
  .rect{position:fixed;border:2px solid #fff;box-shadow:0 0 0 1px var(--accent),0 0 0 9999px rgba(10,12,20,.45);border-radius:3px}
  .dims{position:fixed;padding:3px 8px;border-radius:6px;background:var(--ink);color:var(--bg);font:600 12px/1.4 ui-monospace,monospace;pointer-events:none}
  svg.lasso{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
  .pick{position:fixed;border:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent);border-radius:4px;pointer-events:none;transition:all .06s}
  .pick-label{position:fixed;padding:3px 8px;border-radius:6px;background:var(--accent);color:#fff;font:600 11.5px/1.4 ui-monospace,monospace;pointer-events:none;white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis}
  .hint{position:fixed;top:16px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;padding:9px 14px;border-radius:12px;background:var(--ink);color:var(--bg);font:600 13px/1.4 system-ui;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);pointer-events:none}
  kbd{font:600 11px ui-monospace,monospace;padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--bg) 18%,transparent)}
  .bar{position:fixed;display:flex;gap:4px;padding:5px;border-radius:12px;background:var(--bg);border:1px solid var(--line);box-shadow:0 14px 34px -12px rgba(0,0,0,.45);pointer-events:auto}
  .bar button,.btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 11px;border:0;border-radius:8px;background:transparent;color:var(--ink);font:600 13px system-ui;cursor:pointer;white-space:nowrap}
  .bar button:hover,.btn:hover{background:var(--panel)}
  .bar button.primary,.btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
  .bar svg,.btn svg{width:16px;height:16px}
  .toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,10px);opacity:0;padding:10px 14px;border-radius:12px;background:var(--ink);color:var(--bg);font:600 13px system-ui;box-shadow:0 14px 30px -12px rgba(0,0,0,.5);transition:.18s;pointer-events:none;max-width:80vw;text-align:center}
  .toast.on{opacity:1;transform:translate(-50%,0)}
  .drawer{position:fixed;top:12px;right:12px;bottom:12px;width:min(440px,calc(100vw - 24px));display:flex;flex-direction:column;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 60px -20px rgba(0,0,0,.5);pointer-events:auto;overflow:hidden;font-size:13.5px}
  .dh{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
  .dh h2{margin:0;font-size:15px;flex:1}
  .x{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--muted);cursor:pointer;font-size:18px}
  .x:hover{background:var(--panel);color:var(--ink)}
  .tabs{display:flex;gap:2px;margin:10px 14px 0;padding:3px;border-radius:10px;background:var(--panel);overflow-x:auto}
  .tabs button{flex:1;height:30px;border:0;border-radius:7px;background:transparent;color:var(--muted);font:650 12.5px system-ui;cursor:pointer;white-space:nowrap;padding:0 8px}
  .tabs button[aria-selected=true]{background:var(--bg);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
  .db{flex:1;overflow:auto;padding:12px 14px;display:grid;gap:10px;align-content:start}
  .df{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--line)}
  .df .btn{border:1px solid var(--line)}
  .card{border:1px solid var(--line);border-radius:12px;padding:10px;display:grid;gap:8px;background:var(--bg)}
  .card h3{margin:0;font-size:13.5px;display:flex;justify-content:space-between;gap:8px}
  .muted{color:var(--muted);font-size:12.5px;margin:0}
  .tw{overflow:auto;max-height:220px;border:1px solid var(--line);border-radius:8px}
  table{border-collapse:collapse;width:100%;font-size:12px}
  th,td{padding:5px 7px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  th{position:sticky;top:0;background:var(--panel);font-weight:700}
  .chips{display:flex;gap:5px;flex-wrap:wrap}
  .chip{height:28px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);font:600 12px system-ui;cursor:pointer}
  .chip[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
  .tile{position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel);cursor:pointer;display:grid}
  .tile .th{aspect-ratio:1;display:grid;place-items:center;background:repeating-conic-gradient(color-mix(in srgb,var(--line) 70%,transparent) 0 25%,transparent 0 50%) 0 0/16px 16px;overflow:hidden}
  .tile img,.tile video{max-width:100%;max-height:100%;object-fit:contain;display:block}
  .tile .ic{font:700 13px system-ui;color:var(--muted);text-transform:uppercase}
  .tile .meta{padding:5px 7px;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tile input{position:absolute;top:6px;left:6px;width:18px;height:18px;accent-color:var(--accent)}
  .tile[data-on=true]{outline:2px solid var(--accent);outline-offset:-2px}
  .tag{position:absolute;top:6px;right:6px;padding:1px 6px;border-radius:6px;background:rgba(0,0,0,.65);color:#fff;font:700 10px system-ui}
  .list{display:grid;gap:4px}
  .row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:12.5px}
  .row a{color:var(--accent);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
  .row code{font:12px ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
  input[type=search],input[type=number]{height:32px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:13px system-ui;width:100%}
  .insp{position:fixed;min-width:240px;max-width:320px;padding:10px 12px;border-radius:12px;background:var(--ink);color:var(--bg);font:12.5px/1.5 system-ui;box-shadow:0 14px 34px -12px rgba(0,0,0,.55);pointer-events:none}
  .insp b{font-weight:700}.insp .k{opacity:.65}
  .sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(255,255,255,.4);vertical-align:-2px;margin-right:4px}
  .pal{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px}
  .pal button{height:54px;border:1px solid var(--line);border-radius:10px;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding:3px;font:600 10.5px ui-monospace,monospace}
  .fx-halo{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(250,204,21,.35);border:2px solid rgba(250,204,21,.8);pointer-events:none;transition:transform .08s}
  .fx-ripple{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid var(--accent);pointer-events:none;animation:rip .55s ease-out forwards}
  @keyframes rip{to{transform:scale(4.2);opacity:0}}
  .fx-spot{position:fixed;inset:0;pointer-events:none}
  .fx-ruler{position:fixed;left:0;right:0;height:46px;margin-top:-23px;pointer-events:none;box-shadow:0 0 0 9999px rgba(10,12,20,.42)}
  .fx-lens{position:fixed;width:220px;height:220px;margin:-110px 0 0 -110px;border-radius:50%;border:3px solid #fff;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none;background-repeat:no-repeat}
  .fx-keys{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:8px 14px;border-radius:12px;background:rgba(20,22,28,.85);color:#fff;font:700 16px ui-monospace,monospace;pointer-events:none}
  .prog{position:fixed;left:50%;top:16px;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:var(--ink);color:var(--bg);font:600 13px system-ui;pointer-events:none}
  @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
  </style><div id="app"></div>`;
  const app = sh.getElementById("app");
  document.documentElement.appendChild(root);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function toast(msg, ms = 2600) { let t = sh.querySelector(".toast"); if (!t) { t = el("div", "toast"); t.setAttribute("role", "status"); app.appendChild(t); } t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), ms); }
  const ICON = {
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/></svg>',
  };

  /* ---------- selection: rectangle, lasso, element ---------- */
  let selecting = null;
  function select(mode) {
    stopAll();
    return new Promise(resolve => {
      const layer = el("div", "layer"), hint = el("div", "hint");
      hint.innerHTML = { rect: "Drag to select an area", lasso: "Draw around what you want", element: "Click an element to select it" }[mode] + ` <kbd>Esc</kbd> to cancel`;
      app.append(layer, hint); selecting = { cancel: () => done(null) };
      let start = null, box = null, dims = null, path = [], svg = null, poly = null, pick = null, pickLbl = null, target = null;
      const done = r => { layer.remove(); hint.remove(); box?.remove(); dims?.remove(); svg?.remove(); pick?.remove(); pickLbl?.remove(); removeEventListener("keydown", key, true); selecting = null; resolve(r); };
      const key = e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(null); } if (e.key === "Enter" && mode === "element" && target) { e.preventDefault(); finishEl(); } };
      addEventListener("keydown", key, true);
      if (mode === "element") {
        layer.style.cursor = "pointer"; layer.style.background = "transparent";
        pick = el("div", "pick"); pickLbl = el("div", "pick-label"); app.append(pick, pickLbl); pick.style.display = pickLbl.style.display = "none";
        layer.addEventListener("mousemove", e => {
          layer.style.pointerEvents = "none"; const t = document.elementFromPoint(e.clientX, e.clientY); layer.style.pointerEvents = "auto";
          if (!t || t === document.documentElement || t === root) return; target = t; showPick(t);
        });
        layer.addEventListener("wheel", e => { if (!target) return; e.preventDefault(); target = e.deltaY < 0 ? (target.parentElement && target.parentElement !== document.documentElement ? target.parentElement : target) : (target.firstElementChild || target); showPick(target); }, { passive: false });
        layer.addEventListener("click", e => { e.preventDefault(); if (target) finishEl(); });
        hint.innerHTML = `Click an element to select it. Scroll to pick its parent or child. <kbd>Esc</kbd> to cancel`;
        return;
      }
      function showPick(t) { const r = t.getBoundingClientRect(); Object.assign(pick.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); pickLbl.style.display = "block"; pickLbl.textContent = `${t.tagName.toLowerCase()}${t.id ? "#" + t.id : ""}${t.classList.length ? "." + [...t.classList].slice(0, 2).join(".") : ""}  ${Math.round(r.width)} × ${Math.round(r.height)}`; pickLbl.style.left = r.left + "px"; pickLbl.style.top = Math.max(4, r.top - 26) + "px"; }
      function finishEl() { const r = target.getBoundingClientRect(); done({ mode, el: target, rect: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }); }
      layer.appendChild(el("div", "shade"));
      layer.addEventListener("pointerdown", e => {
        layer.setPointerCapture(e.pointerId); start = { x: e.clientX, y: e.clientY }; layer.firstChild.style.display = "none";
        if (mode === "rect") { box = el("div", "rect"); dims = el("div", "dims"); app.append(box, dims); }
        else { path = [[e.clientX, e.clientY]]; svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "lasso"); svg.innerHTML = `<defs><mask id="m"><rect width="100%" height="100%" fill="#fff"/><polygon id="hole" fill="#000"/></mask></defs><rect width="100%" height="100%" fill="rgba(10,12,20,.45)" mask="url(#m)"/><polygon id="line" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 4"/>`; app.appendChild(svg); poly = [svg.querySelector("#hole"), svg.querySelector("#line")]; }
      });
      layer.addEventListener("pointermove", e => {
        if (!start) return;
        if (mode === "rect") { const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY), w = Math.abs(e.clientX - start.x), h = Math.abs(e.clientY - start.y); Object.assign(box.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" }); dims.textContent = `${Math.round(w)} × ${Math.round(h)}`; dims.style.left = x + "px"; dims.style.top = (y > 30 ? y - 28 : y + h + 6) + "px"; }
        else { const last = path[path.length - 1]; if (Math.hypot(e.clientX - last[0], e.clientY - last[1]) > 3) path.push([e.clientX, e.clientY]); const pts = path.map(p => p.join(",")).join(" "); poly.forEach(p => p.setAttribute("points", pts)); }
      });
      layer.addEventListener("pointerup", e => {
        if (!start) return;
        if (mode === "rect") { const x = Math.min(start.x, e.clientX), y = Math.min(start.y, e.clientY), w = Math.abs(e.clientX - start.x), h = Math.abs(e.clientY - start.y); if (w < 6 || h < 6) return done(null); done({ mode, rect: { x: x + scrollX, y: y + scrollY, w, h } }); }
        else { if (path.length < 8) return done(null); const xs = path.map(p => p[0]), ys = path.map(p => p[1]), x = Math.min(...xs), y = Math.min(...ys); done({ mode, rect: { x: x + scrollX, y: y + scrollY, w: Math.max(...xs) - x, h: Math.max(...ys) - y }, points: path.map(([px, py]) => [px + scrollX, py + scrollY]) }); }
      });
    });
  }
  /* after selecting: action bar */
  function actionBar(sel) {
    return new Promise(resolve => {
      const r = sel.rect, bar = el("div", "bar"), vx = r.x - scrollX, vy = r.y - scrollY;
      const outline = el("div", "pick"); Object.assign(outline.style, { left: vx + "px", top: vy + "px", width: r.w + "px", height: r.h + "px" }); app.appendChild(outline);
      bar.innerHTML = `<button class="primary" data-a="capture">${ICON.cam}Capture</button><button data-a="text">${ICON.copy}Copy text</button><button data-a="media">${ICON.media}Media inside</button>${sel.mode === "element" ? `<button data-a="similar">${ICON.table}Scrape similar</button>` : ""}<button data-a="cancel" aria-label="Cancel">✕</button>`;
      app.appendChild(bar); const bw = bar.offsetWidth, bh = bar.offsetHeight;
      bar.style.left = clamp(vx + r.w / 2 - bw / 2, 8, innerWidth - bw - 8) + "px"; bar.style.top = (vy + r.h + bh + 14 < innerHeight ? vy + r.h + 10 : Math.max(8, vy - bh - 10)) + "px";
      bar.querySelector("button").focus();
      const finish = a => { bar.remove(); outline.remove(); removeEventListener("keydown", k, true); resolve(a); };
      const k = e => { if (e.key === "Escape") { e.preventDefault(); finish("cancel"); } else if (e.key === "Enter") { e.preventDefault(); finish(sh.activeElement?.dataset?.a || "capture"); } };
      addEventListener("keydown", k, true);
      bar.addEventListener("click", e => { const b = e.target.closest("button"); if (b) finish(b.dataset.a); });
    });
  }
  const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  function textIn(sel) {
    if (sel.el) return sel.el.innerText.trim();
    const r = sel.rect, out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() && !n.parentElement.closest("lassoft-ui,script,style,noscript") ? 1 : 2) }); let n;
    while ((n = tw.nextNode())) { const range = document.createRange(); range.selectNodeContents(n); const b = range.getBoundingClientRect(); const cx = b.left + scrollX + b.width / 2, cy = b.top + scrollY + b.height / 2; if (b.width && cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h && (!sel.points || inPoly(cx, cy, sel.points))) out.push(n.nodeValue.trim()); }
    return out.join(" ").replace(/\s+\n/g, "\n");
  }
  async function runSelection(mode) {
    const sel = await select(mode); if (!sel) return;
    const a = await actionBar(sel);
    if (a === "capture") return capture(sel.rect, sel.points, sel.mode === "element" ? "element" : sel.mode);
    if (a === "text") { const t = textIn(sel); if (!t) return toast("No text found there"); try { await navigator.clipboard.writeText(t); toast(`Copied ${t.split(/\s+/).length} words`); } catch { toast("Couldn’t copy. Click the page once and try again."); } return; }
    if (a === "media") return openMedia({ within: sel });
    if (a === "similar") return openScraper({ pickFrom: sel.el });
  }

  /* ---------- capture (coordinated by the background script) ---------- */
  async function capture(rect, points, kind) {
    stopAll(true); hideUi(true);
    const r = await send({ type: "captureRect", rect, points, kind, title: document.title });
    hideUi(false); if (r?.error) toast(r.error, 4500);
  }
  let hidden = [];
  function hideUi(on) { root.style.visibility = on ? "hidden" : ""; }
  function prepare() { hideUi(true); document.documentElement.classList.add("__lassoft-cap"); if (!document.getElementById("__lassoft-style")) { const s = document.createElement("style"); s.id = "__lassoft-style"; s.textContent = "html.__lassoft-cap{scrollbar-width:none!important}html.__lassoft-cap::-webkit-scrollbar{display:none!important}html.__lassoft-cap,html.__lassoft-cap *{scroll-behavior:auto!important}"; document.head.appendChild(s); } return metrics(); }
  function hideFixed() { if (hidden.length) return; document.querySelectorAll("body *").forEach(e => { const p = getComputedStyle(e).position; if ((p === "fixed" || p === "sticky") && e !== root) { hidden.push([e, e.style.visibility]); e.style.setProperty("visibility", "hidden", "important"); } }); }
  function restore(scroll) { hidden.forEach(([e, v]) => (e.style.visibility = v)); hidden = []; document.documentElement.classList.remove("__lassoft-cap"); hideUi(false); if (scroll) scrollTo(scroll.x, scroll.y); }
  function metrics() { const d = document.documentElement, b = document.body; return { vw: d.clientWidth || innerWidth, vh: innerHeight, dpr: devicePixelRatio || 1, sx: scrollX, sy: scrollY, docW: Math.max(d.scrollWidth, b?.scrollWidth || 0, d.clientWidth), docH: Math.max(d.scrollHeight, b?.scrollHeight || 0, d.clientHeight) }; }

  /* ---------- page effects ---------- */
  const fx = {}; let fxMouse = { x: innerWidth / 2, y: innerHeight / 2 }, lensShot = null;
  const onMove = e => { fxMouse = { x: e.clientX, y: e.clientY }; drawFx(); };
  const onDown = e => { if (fx.ripple) { const r = el("div", "fx-ripple"); r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; app.appendChild(r); setTimeout(() => r.remove(), 600); } if (fx.halo) fx.halo.style.transform = "scale(.8)"; };
  const onUp = () => { if (fx.halo) fx.halo.style.transform = ""; };
  let keyT; const onKey = e => { if (!fx.keys) return; if (["Shift", "Control", "Alt", "Meta"].includes(e.key) && !e.repeat) return; const k = [e.ctrlKey && "Ctrl", e.metaKey && "⌘", e.altKey && "Alt", e.shiftKey && e.key.length > 1 && "Shift", e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key].filter(Boolean).join(" + "); fx.keys.textContent = k; fx.keys.style.display = "block"; clearTimeout(keyT); keyT = setTimeout(() => (fx.keys.style.display = "none"), 1200); };
  function drawFx() {
    const { x, y } = fxMouse;
    if (fx.halo) { fx.halo.style.left = x + "px"; fx.halo.style.top = y + "px"; }
    if (fx.spot) fx.spot.style.background = `radial-gradient(circle 150px at ${x}px ${y}px, transparent 0, transparent 140px, rgba(8,10,16,.7) 160px)`;
    if (fx.ruler) fx.ruler.style.top = y + "px";
    if (fx.lens && lensShot) { const z = 2.2, d = lensShot.dpr; fx.lens.style.left = x + "px"; fx.lens.style.top = y + "px"; fx.lens.style.backgroundImage = `url(${lensShot.url})`; fx.lens.style.backgroundSize = `${lensShot.w / d * z}px ${lensShot.h / d * z}px`; fx.lens.style.backgroundPosition = `${-x * z + 110}px ${-y * z + 110}px`; }
  }
  const PAGE_FX = { gray: "grayscale(1)", dark: "invert(.92) hue-rotate(180deg)", blur: "" };
  let lensT;
  async function refreshLens() { if (!fx.lens) return; fx.lens.style.visibility = "hidden"; const r = await send({ type: "snap" }); if (r?.url) lensShot = { url: r.url, w: r.w, h: r.h, dpr: devicePixelRatio || 1 }; if (fx.lens) { fx.lens.style.visibility = ""; drawFx(); } }
  async function setFx(name, on) {
    if (on && !Object.keys(fx).length) { addEventListener("mousemove", onMove, true); addEventListener("mousedown", onDown, true); addEventListener("mouseup", onUp, true); addEventListener("keydown", onKey, true); }
    if (!on) { const n = fx[name]; if (n instanceof HTMLElement) n.remove(); delete fx[name]; }
    if (on) {
      if (name === "halo") { fx.halo = el("div", "fx-halo"); app.appendChild(fx.halo); }
      if (name === "ripple") fx.ripple = true;
      if (name === "spot") { fx.spot = el("div", "fx-spot"); app.appendChild(fx.spot); }
      if (name === "ruler") { fx.ruler = el("div", "fx-ruler"); app.appendChild(fx.ruler); }
      if (name === "keys") { fx.keys = el("div", "fx-keys"); fx.keys.style.display = "none"; app.appendChild(fx.keys); }
      if (name === "lens") { fx.lens = el("div", "fx-lens"); app.appendChild(fx.lens); await refreshLens(); addEventListener("scroll", lensScroll, true); }
      if (name === "xray") { fx.xray = true; styleTag("xray", "body *{outline:1px solid rgba(79,70,229,.45)!important;outline-offset:-1px}"); }
      if (name === "calm") { fx.calm = true; styleTag("calm", "*,*::before,*::after{animation-play-state:paused!important;transition:none!important}video[autoplay]{visibility:hidden}"); }
      if (PAGE_FX[name] !== undefined && name !== "blur") { fx[name] = true; }
    }
    if (name === "xray" && !on) styleTag("xray", null);
    if (name === "calm" && !on) styleTag("calm", null);
    if (name === "lens" && !on) removeEventListener("scroll", lensScroll, true);
    const filters = Object.keys(PAGE_FX).filter(k => fx[k] && PAGE_FX[k]).map(k => PAGE_FX[k]).join(" ");
    document.documentElement.style.filter = filters; if (fx.dark) styleTag("dark", "img,video,picture,canvas,svg image,[style*='background-image']{filter:invert(1) hue-rotate(180deg)!important}"); else styleTag("dark", null);
    if (!Object.keys(fx).length) { removeEventListener("mousemove", onMove, true); removeEventListener("mousedown", onDown, true); removeEventListener("mouseup", onUp, true); removeEventListener("keydown", onKey, true); }
    drawFx(); return Object.keys(fx);
  }
  function lensScroll() { clearTimeout(lensT); lensT = setTimeout(refreshLens, 250); }
  function styleTag(id, css) { let s = document.getElementById("__lassoft-" + id); if (!css) { s?.remove(); return; } if (!s) { s = document.createElement("style"); s.id = "__lassoft-" + id; document.head.appendChild(s); } s.textContent = css; }
  function stopFx() { Object.keys(fx).forEach(k => setFx(k, false)); }

  /* ---------- visual inspector, eyedropper and page palette ---------- */
  let insp = null;
  const rgbHex = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (a === 0) return "transparent"; return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("") + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, "0") : ""); };
  function inspector(on) {
    if (!on) { insp?.stop(); insp = null; return; }
    stopAll(); const card = el("div", "insp"), box = el("div", "pick"); app.append(box, card); card.style.display = box.style.display = "none";
    let cur = null, pinned = false;
    const move = e => {
      if (pinned) return; const t = document.elementFromPoint(e.clientX, e.clientY); if (!t || t === root || t === document.documentElement) return; cur = t;
      const r = t.getBoundingClientRect(), cs = getComputedStyle(t); Object.assign(box.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, ""), col = rgbHex(cs.color), bg = rgbHex(cs.backgroundColor);
      card.innerHTML = `<b>${t.tagName.toLowerCase()}${t.classList.length ? "." + [...t.classList].slice(0, 2).join(".") : ""}</b> <span class="k">${Math.round(r.width)} × ${Math.round(r.height)}</span><br>
        <span class="k">Font</span> ${esc(fam)}, ${cs.fontSize} / ${cs.lineHeight}, ${cs.fontWeight}<br>
        <span class="k">Text</span> <span class="sw" style="background:${col}"></span>${col} &nbsp; <span class="k">Fill</span> <span class="sw" style="background:${bg}"></span>${bg}<br>
        <span class="k">Padding</span> ${cs.padding} &nbsp; <span class="k">Radius</span> ${cs.borderRadius}<br><span class="k">Click to pin and copy CSS · Esc to exit</span>`;
      card.style.display = "block"; const w = card.offsetWidth, h = card.offsetHeight; card.style.left = clamp(e.clientX + 16, 8, innerWidth - w - 8) + "px"; card.style.top = (e.clientY + 16 + h > innerHeight ? e.clientY - h - 12 : e.clientY + 16) + "px";
    };
    const click = async e => { if (!cur || e.target === root) return; e.preventDefault(); e.stopPropagation(); pinned = !pinned; if (pinned) { const cs = getComputedStyle(cur); const css = `font-family: ${cs.fontFamily};\nfont-size: ${cs.fontSize};\nfont-weight: ${cs.fontWeight};\nline-height: ${cs.lineHeight};\ncolor: ${rgbHex(cs.color)};\nbackground-color: ${rgbHex(cs.backgroundColor)};\npadding: ${cs.padding};\nborder-radius: ${cs.borderRadius};`; try { await navigator.clipboard.writeText(css); toast("Styles copied. Click again to unpin."); } catch { toast("Pinned. Click again to unpin."); } } };
    const key = e => { if (e.key === "Escape") { e.preventDefault(); inspector(false); toast("Inspector off"); } };
    addEventListener("mousemove", move, true); addEventListener("click", click, true); addEventListener("keydown", key, true);
    insp = { stop: () => { removeEventListener("mousemove", move, true); removeEventListener("click", click, true); removeEventListener("keydown", key, true); card.remove(); box.remove(); } };
    toast("Hover anything to see its fonts, colours and size");
  }
  function eyedropper() {
    if (!window.EyeDropper) return toast("The colour picker needs Chrome 95 or later.");
    stopAll(); const bar = el("div", "bar"); bar.style.cssText = "left:50%;top:16px;transform:translateX(-50%)";
    bar.innerHTML = `<button class="primary" data-a="go">Pick a colour</button><button data-a="x" aria-label="Cancel">✕</button>`; app.appendChild(bar); bar.querySelector("button").focus();
    bar.onclick = async e => { const b = e.target.closest("button"); if (!b) return; bar.remove(); if (b.dataset.a !== "go") return;
      try { const { sRGBHex } = await new EyeDropper().open(); await navigator.clipboard.writeText(sRGBHex).catch(() => {}); toast(`${sRGBHex} copied`); } catch {} };
  }
  function palette() {
    const colors = new Map(), fonts = new Map(); let n = 0;
    for (const e of document.querySelectorAll("body *")) {
      if (++n > 4000) break; const cs = getComputedStyle(e); if (cs.display === "none") continue; const area = Math.min(e.offsetWidth * e.offsetHeight, 2e5) || 1;
      for (const c of [cs.color, cs.backgroundColor, cs.borderTopColor]) { const h = rgbHex(c); if (!/^#[0-9a-f]{6}$/i.test(h)) continue; colors.set(h, (colors.get(h) || 0) + (c === cs.backgroundColor ? area : 50)); }
      if (e.childNodes.length && [...e.childNodes].some(c => c.nodeType === 3 && c.nodeValue.trim())) { const f = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(); fonts.set(f, (fonts.get(f) || 0) + 1); }
    }
    return { colors: [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(x => x[0]), fonts: [...fonts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) };
  }

  /* ---------- drawers ---------- */
  let drawer = null;
  function openDrawer(title, tabs, footer) {
    drawer?.remove(); stopAll();
    const d = el("div", "drawer"); d.setAttribute("role", "dialog"); d.setAttribute("aria-label", title);
    d.innerHTML = `<div class="dh"><h2>${esc(title)}</h2><button class="x" aria-label="Close" title="Close (Esc)">✕</button></div>${tabs.length > 1 ? `<div class="tabs" role="tablist">${tabs.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-t="${i}">${esc(t.name)}</button>`).join("")}</div>` : ""}<div class="db"></div><div class="df"></div>`;
    app.appendChild(d); drawer = d; const body = d.querySelector(".db"), foot = d.querySelector(".df");
    const show = i => { d.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", +b.dataset.t === i)); body.innerHTML = ""; foot.innerHTML = ""; tabs[i].render(body, foot); };
    d.querySelector(".x").onclick = closeDrawer; d.querySelectorAll(".tabs button").forEach(b => (b.onclick = () => show(+b.dataset.t)));
    d.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); e.stopPropagation(); });
    show(0); d.querySelector(".x").focus(); return d;
  }
  function closeDrawer() { drawer?.remove(); drawer = null; revealHidden(false); }
  const btn = (label, cls = "") => `<button class="btn ${cls}">${label}</button>`;
  function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.style.display = "none"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); toast("Saved " + name); }
  const csv = rows => "\ufeff" + rows.map(r => r.map(v => { v = String(v ?? ""); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(",")).join("\r\n");
  const tsv = rows => rows.map(r => r.map(v => String(v ?? "").replace(/[\t\n]+/g, " ")).join("\t")).join("\n");
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  function tableCard(title, cols, rows, note = "") {
    const c = el("div", "card"); c.innerHTML = `<h3><span>${esc(title)}</span><span class="muted">${rows.length} rows</span></h3>${note ? `<p class="muted">${esc(note)}</p>` : ""}<div class="tw"><table><thead><tr>${cols.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.slice(0, 40).map(r => `<tr>${r.map(v => `<td title="${esc(v)}">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="chips"><button class="chip" data-x="csv">CSV</button><button class="chip" data-x="json">JSON</button><button class="chip" data-x="copy">Copy for Sheets</button></div>`;
    c.addEventListener("click", async e => { const b = e.target.closest("[data-x]"); if (!b) return; const all = [cols, ...rows], base = `${host}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp()}`;
      if (b.dataset.x === "csv") download(base + ".csv", csv(all), "text/csv"); if (b.dataset.x === "json") download(base + ".json", JSON.stringify(rows.map(r => Object.fromEntries(cols.map((h, i) => [h, r[i]]))), null, 2), "application/json");
      if (b.dataset.x === "copy") { try { await navigator.clipboard.writeText(tsv(all)); toast("Copied. Paste into Google Sheets or Excel."); } catch { toast("Couldn’t copy"); } } });
    return c;
  }

  /* ---------- scraper ---------- */
  const abs = u => { try { return new URL(u, location.href).href; } catch { return u || ""; } };
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const txt = e => (e?.innerText || e?.textContent || "").replace(/\s+/g, " ").trim();
  function tables() {
    return [...document.querySelectorAll("table")].filter(t => t.rows.length >= 2 && vis(t)).slice(0, 12).map((t, i) => {
      const rows = [...t.rows].map(r => [...r.cells].map(c => { const a = c.querySelector("a[href]"); return txt(c) || (a ? abs(a.href) : ""); }));
      let head = t.tHead?.rows[0] ? [...t.tHead.rows[0].cells].map(txt) : null; let body = head ? rows.slice(t.tHead.rows.length) : rows;
      if (!head) { head = body[0].every(v => v && v.length < 40) && [...t.rows[0].cells].some(c => c.tagName === "TH") ? body.shift() : body[0].map((_, k) => `Column ${k + 1}`); }
      const w = Math.max(head.length, ...body.map(r => r.length)); head = [...head, ...Array(Math.max(0, w - head.length)).fill("")].map((h, k) => h || `Column ${k + 1}`);
      return { title: t.caption ? txt(t.caption) : `Table ${i + 1}`, cols: head, rows: body.map(r => [...r, ...Array(Math.max(0, w - r.length)).fill("")]) };
    });
  }
  const sig = e => e.tagName + "." + [...e.classList].filter(c => !/\d{3,}|active|selected|hover|odd|even|first|last/i.test(c)).sort().join(".");
  function fieldsOf(item) {
    const f = [], seen = new Set();
    const walk = (n, path) => {
      for (const c of n.children) {
        const p = path + "/" + c.tagName + (c.classList[0] ? "." + c.classList[0] : "");
        if (c.matches("a[href]")) { const k = p + "@href"; if (!seen.has(k)) { seen.add(k); f.push([k, "link", abs(c.getAttribute("href"))]); } }
        if (c.matches("img")) { const k = p + "@src"; if (!seen.has(k)) { seen.add(k); f.push([k, "image", abs(c.currentSrc || c.src || c.dataset.src || "")]); } }
        const own = [...c.childNodes].filter(x => x.nodeType === 3).map(x => x.nodeValue).join(" ").replace(/\s+/g, " ").trim();
        if (own && !seen.has(p)) { seen.add(p); f.push([p, "text", c.children.length ? own : txt(c)]); }
        if (c.children.length && !c.matches("svg")) walk(c, p);
      }
    };
    walk(item, ""); if (!item.children.length) f.push(["/", "text", txt(item)]); return f;
  }
  function nameCol(kind, vals, i) {
    if (kind === "link") return i ? `Link ${i + 1}` : "Link"; if (kind === "image") return i ? `Image ${i + 1}` : "Image";
    const s = vals.filter(Boolean); if (s.length && s.filter(v => /^[£$€¥₹]|\b(USD|SGD|GBP|EUR|RM|S\$)\b|[0-9][.,][0-9]{2}\b/.test(v)).length / s.length > .6) return "Price";
    if (s.length && s.filter(v => /\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2})\b/i.test(v)).length / s.length > .6) return "Date";
    if (s.length && s.filter(v => /^[\d.,]+\s*(stars?|reviews?|ratings?)?$|★/i.test(v)).length / s.length > .6) return "Rating";
    if (i > 0 && s.length && s.reduce((a, v) => a + v.length, 0) / s.length > 28) return i === 1 ? "Description" : `Description ${i}`;
    return i === 0 ? "Title" : `Text ${i + 1}`;
  }
  function itemsToTable(items) {
    const fl = items.map(fieldsOf), counts = new Map(); fl.forEach(fs => new Set(fs.map(x => x[0])).forEach(k => counts.set(k, (counts.get(k) || 0) + 1)));
    const keys = [...counts.entries()].filter(([, c]) => c >= Math.max(2, items.length * .45)).map(([k]) => k).slice(0, 12);
    const kinds = keys.map(k => fl.find(fs => fs.find(x => x[0] === k)).find(x => x[0] === k)[1]);
    const rows = fl.map(fs => keys.map(k => fs.find(x => x[0] === k)?.[2] || ""));
    const used = { text: 0, link: 0, image: 0 }; const cols = keys.map((k, i) => nameCol(kinds[i], rows.map(r => r[i]), used[kinds[i]]++));
    const keep = cols.map((_, i) => rows.some(r => r[i])); return { cols: cols.filter((_, i) => keep[i]), rows: rows.map(r => r.filter((_, i) => keep[i])) };
  }
  function repeatedGroups() {
    const groups = [];
    document.querySelectorAll("body *").forEach(p => {
      if (p.closest("lassoft-ui,nav,footer,header,select,table") || p.children.length < 3) return; const by = new Map();
      for (const c of p.children) { if (!vis(c)) continue; const s = sig(c); by.set(s, [...(by.get(s) || []), c]); }
      for (const [, items] of by) { if (items.length < 3) continue; const avg = items.reduce((a, c) => a + txt(c).length, 0) / items.length; if (avg < 12 || avg > 1500) continue; groups.push({ items, score: items.length * Math.min(avg, 300) * (items[0].querySelector("a[href]") ? 1.4 : 1) * (items[0].querySelector("img") ? 1.2 : 1) }); }
    });
    groups.sort((a, b) => b.score - a.score); const out = [];
    for (const g of groups) { if (out.some(o => o.items[0].contains(g.items[0]) || g.items[0].contains(o.items[0]))) continue; out.push(g); if (out.length >= 5) break; }
    return out;
  }
  function similarTo(elm) {
    let e = elm; for (let up = 0; up < 6 && e && e.parentElement; up++, e = e.parentElement) { const s = sig(e), sib = [...e.parentElement.children].filter(c => sig(c) === s); if (sib.length >= 2) return sib; }
    return [elm];
  }
  function contacts() {
    const html = document.body.innerText + " " + [...document.querySelectorAll("a[href^='mailto:'],a[href^='tel:']")].map(a => a.getAttribute("href")).join(" ");
    const emails = [...new Set((html.match(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g) || []).map(e => e.replace(/^mailto:/, "").replace(/[.,;]+$/, "")))].slice(0, 200);
    const phones = [...new Set((html.match(/(?:tel:)?\+?\d[\d ()-]{7,}\d/g) || []).map(p => p.replace(/^tel:/, "").trim()).filter(p => p.replace(/\D/g, "").length >= 8 && p.replace(/\D/g, "").length <= 15))].slice(0, 200);
    const socials = [...new Set([...document.querySelectorAll("a[href]")].map(a => a.href).filter(h => /(twitter|x|facebook|instagram|linkedin|youtube|tiktok|github|threads|bsky)\.(com|app)\//i.test(h)))].slice(0, 100);
    return { emails, phones, socials };
  }
  function metadata() {
    const rows = [["Title", document.title], ["URL", location.href], ["Language", document.documentElement.lang || ""]];
    document.querySelectorAll("meta[name],meta[property]").forEach(m => { const k = m.getAttribute("name") || m.getAttribute("property"); if (m.content) rows.push([k, m.content]); });
    document.querySelectorAll("link[rel=canonical],link[rel=alternate][hreflang]").forEach(l => rows.push([l.rel + (l.hreflang ? " " + l.hreflang : ""), l.href]));
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch { return null; } }).filter(Boolean);
    const heads = [...document.querySelectorAll("h1,h2,h3")].filter(vis).slice(0, 60).map(h => [h.tagName, txt(h)]);
    return { rows, ld, heads };
  }
  function openScraper(opts = {}) {
    const tabs = [];
    if (opts.pickFrom) tabs.push({ name: "Picked items", render: (b, f) => { const items = similarTo(opts.pickFrom), t = itemsToTable(items); b.appendChild(tableCard(`Items like your pick`, t.cols, t.rows, `${items.length} matching items found on this page.`)); f.innerHTML = btn("Pick again"); f.querySelector("button").onclick = () => { closeDrawer(); pickToScrape(); }; } });
    tabs.push({ name: "Auto-detect", render: (b, f) => {
      const T = tables(), G = repeatedGroups();
      if (!T.length && !G.length) b.innerHTML = `<p class="muted">No tables or repeated lists found. Try “Point and pick”.</p>`;
      G.forEach((g, i) => { const t = itemsToTable(g.items); if (t.cols.length) b.appendChild(tableCard(i === 0 ? "Main list" : `List ${i + 1}`, t.cols, t.rows, `Repeated items detected on the page.`)); });
      T.forEach(t => b.appendChild(tableCard(t.title, t.cols, t.rows)));
      f.innerHTML = btn("Point and pick", "primary"); f.querySelector("button").onclick = () => { closeDrawer(); pickToScrape(); };
    } });
    tabs.push({ name: "Links", render: (b) => {
      const all = [...document.querySelectorAll("a[href]")].map(a => [txt(a) || a.getAttribute("aria-label") || "", abs(a.getAttribute("href"))]).filter(([, h]) => /^https?:/.test(h));
      const uniq = [...new Map(all.map(r => [r[1], r])).values()], here = location.hostname;
      const S = el("input"); S.type = "search"; S.placeholder = "Filter links"; b.appendChild(S);
      const holder = el("div"); b.appendChild(holder);
      const draw = q => { holder.innerHTML = ""; const f = uniq.filter(r => !q || (r[0] + r[1]).toLowerCase().includes(q)); const int = f.filter(r => new URL(r[1]).hostname === here), ext = f.filter(r => new URL(r[1]).hostname !== here); holder.append(tableCard("Links on this site", ["Text", "URL"], int), tableCard("Links to other sites", ["Text", "URL"], ext)); };
      S.oninput = () => draw(S.value.toLowerCase()); draw("");
    } });
    tabs.push({ name: "Contacts", render: (b) => { const c = contacts(); b.append(tableCard("Emails", ["Email"], c.emails.map(e => [e])), tableCard("Phone numbers", ["Phone"], c.phones.map(e => [e])), tableCard("Social profiles", ["URL"], c.socials.map(e => [e]))); b.appendChild(el("p", "muted", "Please respect people’s privacy and anti-spam laws when using contact details.")); } });
    tabs.push({ name: "Page info", render: (b) => { const m = metadata(); b.append(tableCard("Meta tags", ["Name", "Value"], m.rows), tableCard("Headings", ["Level", "Text"], m.heads)); if (m.ld.length) { const c = el("div", "card", `<h3><span>Structured data (JSON-LD)</span><span class="muted">${m.ld.length} block${m.ld.length > 1 ? "s" : ""}</span></h3><div class="tw"><pre style="margin:0;padding:8px;font:11.5px ui-monospace,monospace;white-space:pre-wrap">${esc(JSON.stringify(m.ld, null, 2).slice(0, 6000))}</pre></div><div class="chips"><button class="chip">JSON</button></div>`); c.querySelector(".chip").onclick = () => download(`${host}-structured-data-${stamp()}.json`, JSON.stringify(m.ld, null, 2), "application/json"); b.appendChild(c); } } });
    openDrawer("Scrape data", tabs);
  }
  async function pickToScrape() { toast("Click one item in a list (a product, a result, a row)", 3500); const s = await select("element"); if (s) openScraper({ pickFrom: s.el }); }

  /* ---------- media and files finder ---------- */
  const EXT = { image: /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?)(\?|#|$)/i, video: /\.(mp4|webm|mov|m4v|ogv|mkv)(\?|#|$)/i, audio: /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba)(\?|#|$)/i, doc: /\.(pdf|docx?|xlsx?|pptx?|csv|txt|rtf|odt|ods|odp|epub|zip|rar|7z|json|xml)(\?|#|$)/i, stream: /\.(m3u8|mpd)(\?|#|$)/i };
  const bestSrc = img => { const ss = img.srcset || img.getAttribute("data-srcset"); if (ss) { const c = ss.split(",").map(s => s.trim().split(/\s+/)).map(([u, d]) => [u, parseFloat(d) || 1]).sort((a, b) => b[1] - a[1]); if (c[0]?.[0]) return abs(c[0][0]); } return abs(img.currentSrc || img.src || img.dataset.src || img.dataset.original || img.getAttribute("data-lazy-src") || ""); };
  function findMedia(within) {
    const map = new Map(); const add = (url, kind, extra = {}) => { if (!url || url.startsWith("data:image/gif;base64,R0lGOD") || url === location.href) return; const k = url.split("#")[0]; if (!map.has(k)) map.set(k, { url: k, kind, ...extra }); else { const cur = map.get(k); for (const [f, v] of Object.entries(extra)) if (cur[f] == null || cur[f] === "" || (f !== "hidden" && !cur[f])) cur[f] = v; if (extra.hidden === false) cur.hidden = false; } };
    const inside = e => { if (!within) return true; const r = e.getBoundingClientRect(), cx = r.left + scrollX + r.width / 2, cy = r.top + scrollY + r.height / 2, s = within.rect; if (within.el) return within.el.contains(e); return cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h && (!within.points || inPoly(cx, cy, within.points)); };
    const isHidden = e => !vis(e) || getComputedStyle(e).visibility === "hidden";
    document.querySelectorAll("img").forEach(i => { if (!inside(i)) return; add(bestSrc(i), "image", { w: i.naturalWidth, h: i.naturalHeight, alt: i.alt, hidden: isHidden(i) }); });
    document.querySelectorAll("picture source[srcset], source[type^='image']").forEach(s => inside(s.parentElement) && add(abs(s.srcset.split(",").pop().trim().split(/\s+/)[0]), "image"));
    document.querySelectorAll("video").forEach(v => { if (!inside(v)) return; const u = v.currentSrc || v.src; if (u?.startsWith("blob:") || (!u && v.querySelector("source") === null)) add(location.href + "#stream" + map.size, "stream", { label: "Streaming video", poster: v.poster ? abs(v.poster) : "" }); else if (u) add(abs(u), "video", { poster: v.poster ? abs(v.poster) : "", w: v.videoWidth, h: v.videoHeight }); v.querySelectorAll("source[src]").forEach(s => add(abs(s.getAttribute("src")), "video", { poster: v.poster ? abs(v.poster) : "" })); if (v.poster) add(abs(v.poster), "image", { label: "Video poster" }); });
    document.querySelectorAll("audio").forEach(a => { if (!inside(a)) return; const u = a.currentSrc || a.src; if (u && !u.startsWith("blob:")) add(abs(u), "audio"); a.querySelectorAll("source[src]").forEach(s => add(abs(s.getAttribute("src")), "audio")); });
    document.querySelectorAll("a[href], [data-src], [data-href], embed[src], object[data], iframe[src]").forEach(a => { if (!inside(a)) return; const u = abs(a.getAttribute("href") || a.getAttribute("data-src") || a.getAttribute("data-href") || a.getAttribute("src") || a.getAttribute("data")); for (const [kind, re] of Object.entries(EXT)) if (re.test(u)) { add(u, kind === "stream" ? "stream" : kind, { label: txt(a).slice(0, 60), hidden: isHidden(a) }); break; } });
    if (!within) {
      document.querySelectorAll("meta[property='og:image'],meta[name='twitter:image'],meta[property='og:video'],meta[property='og:audio']").forEach(m => { const p = m.getAttribute("property") || m.getAttribute("name"); add(abs(m.content), /video/.test(p) ? "video" : /audio/.test(p) ? "audio" : "image", { label: "Share image (" + p + ")", hidden: true }); });
      document.querySelectorAll("link[rel~='icon'],link[rel='apple-touch-icon']").forEach(l => add(abs(l.href), "image", { label: "Site icon", hidden: true }));
      document.querySelectorAll("noscript").forEach(n => (n.textContent.match(/src=["']([^"']+)["']/g) || []).forEach(m => add(abs(m.slice(5, -1)), "image", { hidden: true, label: "Inside <noscript>" })));
      document.querySelectorAll("svg").forEach((s, i) => { if (i > 60 || s.closest("lassoft-ui") || s.getBoundingClientRect().width < 24) return; const code = new XMLSerializer().serializeToString(s); if (code.length < 200000) add("data:image/svg+xml;charset=utf-8," + encodeURIComponent(code), "image", { label: "Inline SVG", svg: true }); });
    }
    let n = 0; for (const e of document.querySelectorAll("body *")) { if (++n > 3000) break; if (!inside(e)) continue; const bg = getComputedStyle(e).backgroundImage; if (bg && bg !== "none") (bg.match(/url\(["']?([^"')]+)["']?\)/g) || []).forEach(m => { const u = m.replace(/^url\(["']?|["']?\)$/g, ""); if (!u.startsWith("data:")) add(abs(u), "image", { label: "Background image", hidden: isHidden(e) }); }); }
    try { if (!within) performance.getEntriesByType("resource").forEach(r => { for (const [kind, re] of Object.entries(EXT)) if (re.test(r.name)) { add(r.name, kind === "stream" ? "stream" : kind, { label: "Loaded by the page", hidden: true, size: r.encodedBodySize || r.transferSize || 0 }); break; } }); } catch {}
    return [...map.values()];
  }
  const nameFromUrl = (u, kind, i) => { if (u.startsWith("data:image/svg")) return `${host}-svg-${i + 1}.svg`; try { const p = decodeURIComponent(new URL(u).pathname.split("/").pop() || ""); if (p && /\.[a-z0-9]{2,5}$/i.test(p)) return p.replace(/[^\w.\-]+/g, "_").slice(-90); } catch {} return `${host}-${kind}-${i + 1}${kind === "audio" ? ".mp3" : kind === "video" ? ".mp4" : kind === "doc" ? "" : ".jpg"}`; };
  function openMedia(opts = {}) {
    const items = findMedia(opts.within); const sel = new Set();
    let filter = "all", minSize = 0, showHidden = true;
    const counts = k => items.filter(i => i.kind === k).length;
    const render = (b, f) => {
      const chipsHtml = [["all", "All", items.length], ["image", "Images", counts("image")], ["video", "Video", counts("video")], ["audio", "Audio", counts("audio")], ["doc", "Files", counts("doc")], ["stream", "Streams", counts("stream")]].filter(c => c[0] === "all" || c[2]).map(([k, l, n]) => `<button class="chip" data-f="${k}" aria-pressed="${filter === k}">${l} ${n}</button>`).join("");
      b.innerHTML = `<div class="chips">${chipsHtml}</div><div style="display:flex;gap:8px;align-items:center"><label class="muted" style="display:flex;gap:6px;align-items:center;white-space:nowrap">Min width <input type="number" min="0" step="50" value="${minSize}" style="width:80px" id="min"></label><label class="muted" style="display:flex;gap:6px;align-items:center;white-space:nowrap"><input type="checkbox" id="hid" ${showHidden ? "checked" : ""}> Include hidden</label></div><div class="grid"></div>`;
      const grid = b.querySelector(".grid");
      const list = items.filter(i => (filter === "all" || i.kind === filter) && (showHidden || !i.hidden) && (!minSize || i.kind !== "image" || !i.w || i.w >= minSize));
      if (!list.length) grid.outerHTML = `<p class="muted">Nothing found${opts.within ? " in your selection" : ""}.</p>`;
      list.forEach((it, i) => {
        const t = el("div", "tile"); t.dataset.on = sel.has(it.url); t.title = it.label || it.url;
        const thumb = it.kind === "image" ? `<img loading="lazy" src="${esc(it.url)}" alt="">` : it.poster ? `<img loading="lazy" src="${esc(it.poster)}" alt="">` : `<span class="ic">${it.kind === "doc" ? (it.url.match(/\.([a-z0-9]+)(\?|#|$)/i)?.[1] || "file") : it.kind}</span>`;
        t.innerHTML = `<div class="th">${thumb}</div>${it.kind !== "stream" ? `<input type="checkbox" ${sel.has(it.url) ? "checked" : ""} aria-label="Select">` : ""}${it.kind !== "image" ? `<span class="tag">${it.kind === "stream" ? "Stream" : it.kind.toUpperCase()}</span>` : it.hidden ? `<span class="tag">Hidden</span>` : ""}<div class="meta">${esc(it.kind === "stream" ? "Can’t be saved (streaming)" : it.w ? `${it.w} × ${it.h}` : it.label || nameFromUrl(it.url, it.kind, i))}</div>`;
        t.onclick = e => { if (it.kind === "stream") return toast("Streaming video is delivered in protected pieces and can’t be saved. Use Record instead."); if (e.target.tagName !== "INPUT" && (e.metaKey || e.ctrlKey)) return window.open(it.url, "_blank"); sel.has(it.url) ? sel.delete(it.url) : sel.add(it.url); t.dataset.on = sel.has(it.url); t.querySelector("input").checked = sel.has(it.url); sync(); };
        grid.appendChild(t);
      });
      b.querySelectorAll("[data-f]").forEach(c => (c.onclick = () => { filter = c.dataset.f; render(b, f); }));
      b.querySelector("#min").onchange = e => { minSize = +e.target.value || 0; render(b, f); }; b.querySelector("#hid").onchange = e => { showHidden = e.target.checked; render(b, f); };
      f.innerHTML = `${btn("Select all")}${btn("Copy links")}${btn("Download", "primary")}`;
      const [all, cp, dl] = f.querySelectorAll("button");
      const sync = () => { dl.textContent = sel.size ? `Download ${sel.size}` : "Download"; dl.disabled = !sel.size; };
      all.onclick = () => { const v = list.filter(x => x.kind !== "stream"); const every = v.every(x => sel.has(x.url)); v.forEach(x => (every ? sel.delete(x.url) : sel.add(x.url))); render(b, f); };
      cp.onclick = async () => { const urls = (sel.size ? [...sel] : list.map(x => x.url)).filter(u => !u.startsWith("data:")).join("\n"); try { await navigator.clipboard.writeText(urls); toast("Links copied"); } catch { toast("Couldn’t copy"); } };
      dl.onclick = async () => { const chosen = items.filter(x => sel.has(x.url)); if (chosen.length > 25 && !confirm(`Download ${chosen.length} files?`)) return; for (const [i, it] of chosen.entries()) await send({ type: "download", url: it.url, filename: `Lassoft/${host}/${nameFromUrl(it.url, it.kind, i)}` }); toast(`${chosen.length} download${chosen.length > 1 ? "s" : ""} started. Only save what you have the right to use.`, 4000); };
      sync();
    };
    openDrawer(opts.within ? "Media in your selection" : "Media and files", [{ name: "All media", render }]);
  }

  /* ---------- hidden items ---------- */
  let revealed = [];
  function revealHidden(on) {
    revealed.forEach(([e, s]) => e.setAttribute("style", s || "")); revealed = []; if (!on) return 0;
    document.querySelectorAll("body *:not(script):not(style):not(noscript):not(template):not(lassoft-ui)").forEach(e => { if (revealed.length > 400) return; const cs = getComputedStyle(e); if ((cs.display === "none" || cs.visibility === "hidden") && (e.textContent.trim() || e.querySelector("img,video"))) { const prev = e.getAttribute("style"); revealed.push([e, prev]); e.style.setProperty("display", cs.display === "none" ? (/^(SPAN|A|B|I|EM|STRONG|LABEL)$/.test(e.tagName) ? "inline" : "block") : cs.display, "important"); e.style.setProperty("visibility", "visible", "important"); e.style.setProperty("outline", "2px dashed #a855f7", "important"); e.style.setProperty("background", "rgba(168,85,247,.08)", "important"); } });
    return revealed.length;
  }
  function openHidden() {
    const comments = []; const tw = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT); let n; while ((n = tw.nextNode()) && comments.length < 200) { const t = n.nodeValue.trim(); if (t && t.length > 2) comments.push([t.slice(0, 400)]); }
    const inputs = [...document.querySelectorAll("input[type=hidden]")].map(i => [i.name || i.id || "(no name)", i.value.length > 60 ? i.value.slice(0, 24) + "… (" + i.value.length + " characters)" : i.value]);
    const frames = [...document.querySelectorAll("iframe")].map(f => [f.title || "(untitled)", abs(f.src || "about:blank")]);
    const hiddenEls = [...document.querySelectorAll("body *:not(script):not(style):not(noscript):not(template)")].filter(e => { const cs = getComputedStyle(e); return (cs.display === "none" || cs.visibility === "hidden") && e.textContent.trim().length > 15; });
    const hiddenText = hiddenEls.filter(e => !hiddenEls.some(o => o !== e && o.contains(e))).slice(0, 80).map(e => [e.tagName.toLowerCase(), txt(e).slice(0, 200) || e.textContent.trim().slice(0, 200)]);
    openDrawer("Hidden items", [
      { name: "Hidden content", render: (b, f) => { b.append(el("p", "muted", "Text and media the page has hidden, such as collapsed sections, menus and pop-ups.")); b.appendChild(tableCard("Hidden text", ["Element", "Text"], hiddenText)); f.innerHTML = btn("Show hidden on page", "primary"); const bt = f.querySelector("button"); let on = false; bt.onclick = () => { on = !on; const c = revealHidden(on); bt.textContent = on ? "Hide them again" : "Show hidden on page"; toast(on ? `${c} hidden element${c === 1 ? "" : "s"} revealed with purple outlines` : "Hidden again"); }; } },
      { name: "Comments", render: b => { b.append(el("p", "muted", "Notes developers left in the page source.")); b.appendChild(tableCard("HTML comments", ["Comment"], comments)); } },
      { name: "Form fields", render: b => { b.append(el("p", "muted", "Hidden form values the page sends. Long tokens are shortened.")); b.appendChild(tableCard("Hidden inputs", ["Name", "Value"], inputs)); } },
      { name: "Embeds", render: b => { b.appendChild(tableCard("Embedded frames", ["Title", "Address"], frames)); } },
    ]);
  }

  /* ---------- public API ---------- */
  function stopAll(keepFx) { selecting?.cancel(); inspector(false); if (!keepFx) {} }
  window.__lassoft = {
    select: runSelection, capture, prepare, hideFixed, restore, metrics, toast, setFx, stopFx, fxState: () => Object.keys(fx),
    inspector, eyedropper, palette, openScraper, pickToScrape, openMedia, openHidden, findMedia, tables, repeatedGroups, itemsToTable,
    progress: (t) => { let p = sh.querySelector(".prog"); if (!t) { p?.remove(); return; } if (!p) { p = el("div", "prog"); app.appendChild(p); } p.textContent = t; },
  };
  try {
    chrome.runtime.onMessage.addListener((m, _s, reply) => {
      const L = window.__lassoft; let r;
      switch (m.type) {
        case "tool": {
          const t = m.tool;
          if (t === "area") L.select("rect"); else if (t === "lasso") L.select("lasso"); else if (t === "element") L.select("element");
          else if (t === "visible") L.capture({ x: scrollX, y: scrollY, w: innerWidth, h: innerHeight }, null, "visible");
          else if (t === "fullpage") { const mm = metrics(); L.capture({ x: 0, y: 0, w: mm.docW, h: mm.docH }, null, "fullpage"); }
          else if (t === "scrape") L.openScraper(); else if (t === "pick") L.pickToScrape(); else if (t === "media") L.openMedia(); else if (t === "hidden") L.openHidden();
          else if (t === "inspect") L.inspector(true); else if (t === "eyedropper") L.eyedropper();
          else if (t === "palette") { const p = L.palette(); openDrawer("Colours and fonts", [{ name: "Palette", render: (b) => { b.innerHTML = `<p class="muted">The most-used colours and fonts on this page. Click a colour to copy it.</p><div class="pal">${p.colors.map(c => `<button style="background:${c};color:${parseInt(c.slice(1, 3), 16) * .3 + parseInt(c.slice(3, 5), 16) * .59 + parseInt(c.slice(5, 7), 16) * .11 > 150 ? "#000" : "#fff"}" data-c="${c}">${c}</button>`).join("")}</div>`; b.appendChild(tableCard("Fonts", ["Font", "Used in elements"], p.fonts)); b.querySelector(".pal").onclick = async e => { const c = e.target.dataset.c; if (c) { await navigator.clipboard.writeText(c).catch(() => {}); toast(c + " copied"); } }; } }]); }
          r = { ok: true }; break;
        }
        case "fx": L.setFx(m.name, m.on).then(reply); return true;
        case "fxState": r = L.fxState(); break;
        case "prepare": r = L.prepare(); break;
        case "hideFixed": L.hideFixed(); r = { ok: true }; break;
        case "scrollTo": scrollTo(m.x, m.y); setTimeout(() => reply({ sx: scrollX, sy: scrollY }), m.wait || 120); return true;
        case "restore": L.restore(m.scroll); r = { ok: true }; break;
        case "progress": L.progress(m.text); r = { ok: true }; break;
        case "toast": L.toast(m.text, m.ms); r = { ok: true }; break;
        case "metrics": r = metrics(); break;
      }
      reply(r);
    });
  } catch {}
})();
