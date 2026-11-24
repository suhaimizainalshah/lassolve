/* MarkKit: on-screen marking for teachers, shared by Lassolve (screenshots) and If Leaves Weave (PDFs).
   Ideas from open-source and common marking tools (Moodle’s PDF feedback plugins, comment libraries, stamp sets and
   voice comments), written from scratch. Everything stays on this device. Pages are images; marks are drawn over them. */
(function () {
const NS = "http://www.w3.org/2000/svg", uid = () => Math.random().toString(36).slice(2, 9);
const INKS = [["#d0021b", "Red"], ["#1a7f37", "Green"], ["#1f4fd1", "Blue"], ["#e8590c", "Orange"], ["#7b2fb3", "Purple"], ["#16181d", "Black"]];
const STAMPS = { tick: "✓", cross: "✗", q: "?", star: "★", smile: "☺", great: "Great!", see: "See me" };
const BANK = ["Good explanation", "Show your working", "Check your units", "Spelling", "Needs evidence", "Well structured", "Add a reference", "Excellent!", "Look again at the question", "Careful with the sign"];
const TOOLS = [["select", "Select and move", "V"], ["pen", "Pen", "P"], ["hl", "Highlighter", "H"], ["line", "Line", "L"], ["arrow", "Arrow", "A"], ["rect", "Box", "R"], ["ellipse", "Circle", "O"], ["strike", "Strike through", "K"], ["text", "Text comment", "T"], ["stamp", "Stamp", "S"], ["mark", "Marks", "M"], ["audio", "Audio comment", "U"], ["erase", "Eraser", "E"]];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const CSS = `.mk{display:grid;grid-template-columns:auto minmax(0,1fr) 270px;height:100%;min-height:0;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--mk-ink,#16181d);background:var(--mk-bg,#eef0f4)}
@media (max-width:900px){.mk{grid-template-columns:1fr;height:auto}.mk-side{order:3}}
.mk-tools{display:flex;flex-direction:column;gap:4px;padding:8px;background:var(--mk-card,#fff);border-right:1px solid var(--mk-line,#d7dbe3);overflow:auto}
@media (max-width:900px){.mk-tools{flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--mk-line,#d7dbe3)}}
.mk button{font:inherit;color:inherit;cursor:pointer}.mk-t{width:44px;height:40px;border:1px solid transparent;border-radius:10px;background:none;font-size:18px;display:grid;place-items:center}
.mk-t:hover{background:var(--mk-soft,#eef0f4)}.mk-t[aria-pressed=true]{background:#fde8ea;border-color:#d0021b;color:#a00016}
.mk-sep{height:1px;background:var(--mk-line,#d7dbe3);margin:4px 0}.mk-ink{width:26px;height:26px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px var(--mk-line,#bbb);margin:2px auto}.mk-ink[aria-pressed=true]{box-shadow:0 0 0 3px #16181d}
.mk-pages{overflow:auto;padding:18px;display:grid;gap:18px;justify-items:center;align-content:start}
.mk-page{position:relative;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.12);max-width:100%;touch-action:none;user-select:none}.mk-page img{display:block;width:100%;height:auto;pointer-events:none}
.mk-page svg{position:absolute;inset:0;width:100%;height:100%}.mk-page .lbl{position:absolute;right:8px;top:-22px;font-size:12px;color:var(--mk-muted,#5a6272)}
.mk-side{background:var(--mk-card,#fff);border-left:1px solid var(--mk-line,#d7dbe3);padding:12px;overflow:auto;display:grid;gap:12px;align-content:start}
.mk-side h3{margin:0 0 6px;font-size:13px;color:var(--mk-muted,#5a6272);text-transform:uppercase;letter-spacing:.04em}.mk-side .box{border:1px solid var(--mk-line,#d7dbe3);border-radius:12px;padding:10px}
.mk-b{border:1px solid var(--mk-line,#cfd4dd);background:var(--mk-card,#fff);border-radius:9px;padding:6px 10px;font-weight:600}.mk-b:hover{border-color:#d0021b}.mk-b.pri{background:#d0021b;border-color:#d0021b;color:#fff}
.mk-chips{display:flex;flex-wrap:wrap;gap:6px}.mk-chip{border:1px solid var(--mk-line,#cfd4dd);border-radius:999px;padding:4px 10px;background:var(--mk-card,#fff);font-size:13px}.mk-chip[aria-pressed=true]{background:#fde8ea;border-color:#d0021b}
.mk-total{font-size:28px;font-weight:800}.mk-side input,.mk-side textarea,.mk-side select{font:inherit;width:100%;border:1px solid var(--mk-line,#cfd4dd);border-radius:8px;padding:6px 8px;background:var(--mk-card,#fff);color:inherit}
.mk-edit{position:absolute;z-index:5;min-width:160px;font:16px system-ui;border:2px solid #d0021b;border-radius:6px;padding:4px 6px;background:#fff;color:#16181d;resize:both}
.mk-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.mk-hint{font-size:12px;color:var(--mk-muted,#5a6272);margin:0}.mk-audio{display:grid;gap:6px}.mk-audio div{display:flex;gap:6px;align-items:center;font-size:13px}
.mk :focus-visible{outline:3px solid #1f4fd1;outline-offset:2px}.mk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (prefers-color-scheme:dark){.mk{--mk-ink:#edf0f6;--mk-bg:#12141a;--mk-card:#1b1e26;--mk-line:#2d323e;--mk-soft:#232733;--mk-muted:#a3abbb}.mk-t[aria-pressed=true]{background:#4a1018;color:#ffb3bd}.mk-chip[aria-pressed=true]{background:#4a1018;color:#ffd7dc;border-color:#ff8a96}}`;

function mount(root, opts) {
  if (!document.getElementById("mk-css")) { const st = document.createElement("style"); st.id = "mk-css"; st.textContent = CSS; document.head.append(st); }
  const S = { tool: "pen", ink: INKS[0][0], width: 4, stamp: "tick", markVal: 1, bankPick: null, pages: opts.pages, annots: opts.annots || [], sel: null, outOf: opts.outOf || "", student: opts.student || "", overall: opts.overall || "", title: opts.title || "Marked work" };
  let bank; try { bank = JSON.parse(localStorage.getItem("markkit-bank")) || BANK; } catch { bank = BANK; }
  const hist = [JSON.stringify(S.annots)], fut = [];
  const commit = () => { hist.push(JSON.stringify(S.annots)); if (hist.length > 150) hist.shift(); fut.length = 0; draw(); opts.onChange?.(state()); };
  const undo = () => { if (hist.length < 2) return; fut.push(hist.pop()); S.annots = JSON.parse(hist[hist.length - 1]); S.sel = null; draw(); say("Undone"); opts.onChange?.(state()); };
  const redo = () => { if (!fut.length) return; const n = fut.pop(); hist.push(n); S.annots = JSON.parse(n); draw(); say("Redone"); opts.onChange?.(state()); };
  root.innerHTML = `<div class="mk"><nav class="mk-tools" aria-label="Marking tools">${TOOLS.map(([k, n, key]) => `<button class="mk-t" data-tool="${k}" title="${n} (${key})" aria-label="${n}" aria-pressed="${k === S.tool}">${{ select: "⬚", pen: "✎", hl: "▬", line: "╱", arrow: "➚", rect: "▭", ellipse: "◯", strike: "S̶", text: "T", stamp: "✓", mark: "+1", audio: "🎙", erase: "⌫" }[k]}</button>`).join("")}
      <div class="mk-sep"></div>${INKS.map(([c, n], i) => `<button class="mk-ink" data-ink="${c}" style="background:${c}" aria-label="${n} ink" title="${n} ink${i ? "" : " (default)"}" aria-pressed="${!i}"></button>`).join("")}
      <div class="mk-sep"></div><button class="mk-t" data-w="2" title="Thin" aria-label="Thin line">·</button><button class="mk-t" data-w="4" title="Medium" aria-label="Medium line" aria-pressed="true">•</button><button class="mk-t" data-w="8" title="Thick" aria-label="Thick line">●</button>
      <div class="mk-sep"></div><button class="mk-t" data-a="undo" title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button class="mk-t" data-a="redo" title="Redo (Ctrl+Y)" aria-label="Redo">↷</button></nav>
    <div class="mk-pages" aria-label="Pages of the work" tabindex="0" role="region"></div>
    <aside class="mk-side" aria-label="Marking panel">
      <div class="box"><h3>Marks</h3><div class="mk-total" aria-live="polite"><span data-total>0</span><small style="font-size:15px;font-weight:600"> / <input data-outof style="width:62px;display:inline-block" value="${esc(S.outOf)}" placeholder="out of" aria-label="Total marks available"></small></div>
        <div class="mk-row"><span class="mk-hint">Marks tool adds</span>${[-1, 0.5, 1, 2, 3].map(v => `<button class="mk-chip" data-mv="${v}" aria-pressed="${v === 1}">${v > 0 ? "+" : ""}${v}</button>`).join("")}</div><p class="mk-hint" data-perpage></p></div>
      <div class="box" data-stampbox><h3>Stamps</h3><div class="mk-chips">${Object.entries(STAMPS).map(([k, v]) => `<button class="mk-chip" data-st="${k}" aria-pressed="${k === S.stamp}">${esc(v)}</button>`).join("")}</div>
        <div class="mk-row" style="margin-top:6px"><input data-custom placeholder="Custom stamp, e.g. 7/10" aria-label="Custom stamp text"><button class="mk-b" data-a="custom">Use</button></div></div>
      <div class="box"><h3>Comment bank</h3><p class="mk-hint">Choose a comment, then click the work to place it.</p><div class="mk-chips" data-bank></div>
        <div class="mk-row" style="margin-top:6px"><input data-newc placeholder="Add a comment to the bank" aria-label="New comment"><button class="mk-b" data-a="addc">Add</button></div></div>
      <div class="box"><h3>Audio comments</h3><p class="mk-hint">Choose 🎙, click where it applies, and speak (up to 2 minutes). Students can play it on the feedback page.</p><div class="mk-audio" data-audio></div></div>
      <div class="box"><h3>For the student</h3><label class="mk-hint">Student name<input data-student value="${esc(S.student)}"></label><label class="mk-hint">Overall comment<textarea data-overall rows="3">${esc(S.overall)}</textarea></label></div>
      <div class="box"><h3>Save and send</h3><div class="mk-row">${(opts.exports || []).map((e, i) => `<button class="mk-b ${i ? "" : "pri"}" data-exp="${i}">${esc(e.label)}</button>`).join("")}</div><p class="mk-hint" data-msg aria-live="polite"></p></div>
      <p class="mk-hint">Keys: V select · P pen · H highlighter · L line · A arrow · R box · O circle · K strike · T text · S stamp · M marks · U audio · E eraser · [ ] ink colour · Delete removes the selected mark.</p>
    </aside><p class="mk-sr" data-live aria-live="polite"></p></div>`;
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)], pagesBox = $(".mk-pages");
  const say = t => { const l = $("[data-live]"); l.textContent = ""; setTimeout(() => l.textContent = t, 20); };
  const msg = (t) => { $("[data-msg]").textContent = t; };

  /* ---------- pages and drawing ---------- */
  pagesBox.innerHTML = S.pages.map((p, i) => `<div class="mk-page" data-p="${i}" style="width:${Math.min(p.w, opts.maxWidth || 980)}px"><span class="lbl">Page ${i + 1}</span><img src="${p.src}" alt="Page ${i + 1} of the work"><svg viewBox="0 0 ${p.w} ${p.h}" role="group" aria-label="Marks on page ${i + 1}"></svg></div>`).join("");
  const svgOf = i => pagesBox.querySelector(`[data-p="${i}"] svg`);
  function shape(a) {
    const c = a.color || S.ink, w = a.width || 4, sel = S.sel === a.id ? ` stroke-dasharray="6 4"` : "";
    if (a.type === "pen" || a.type === "hl") return `<polyline points="${a.pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="${a.type === "hl" ? (a.color === "#d0021b" ? "#ffe066" : c) : c}" stroke-opacity="${a.type === "hl" ? .45 : 1}" stroke-width="${a.type === "hl" ? Math.max(14, w * 4) : w}" stroke-linecap="round" stroke-linejoin="round"${sel}/>`;
    if (a.type === "line" || a.type === "arrow" || a.type === "strike") { const head = a.type === "arrow" ? (() => { const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), L = 10 + w * 2.5; return `<polygon points="${a.x2},${a.y2} ${a.x2 - L * Math.cos(ang - .45)},${a.y2 - L * Math.sin(ang - .45)} ${a.x2 - L * Math.cos(ang + .45)},${a.y2 - L * Math.sin(ang + .45)}" fill="${c}"/>`; })() : "";
      return `<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${c}" stroke-width="${a.type === "strike" ? Math.max(2, w * .7) : w}" stroke-linecap="round"${sel}/>${head}`; }
    if (a.type === "rect") return `<rect x="${Math.min(a.x, a.x + a.w)}" y="${Math.min(a.y, a.y + a.h)}" width="${Math.abs(a.w)}" height="${Math.abs(a.h)}" fill="none" stroke="${c}" stroke-width="${w}" rx="4"${sel}/>`;
    if (a.type === "ellipse") return `<ellipse cx="${a.x + a.w / 2}" cy="${a.y + a.h / 2}" rx="${Math.abs(a.w / 2)}" ry="${Math.abs(a.h / 2)}" fill="none" stroke="${c}" stroke-width="${w}"${sel}/>`;
    if (a.type === "text") { const lines = String(a.text).split("\n"), fs = a.size || 22; return `<g${sel ? ' opacity=".7"' : ""}>${lines.map((l, i) => `<text x="${a.x}" y="${a.y + fs + i * fs * 1.25}" font-size="${fs}" font-family="system-ui,sans-serif" font-weight="600" fill="${c}" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(l)}</text>`).join("")}</g>`; }
    if (a.type === "stamp") { const t = STAMPS[a.kind] || a.text || "", big = t.length <= 2, fs = (a.size || 34) * (big ? 1.4 : .8);
      return `<text x="${a.x}" y="${a.y}" font-size="${fs}" font-weight="800" font-family="system-ui,sans-serif" fill="${c}" text-anchor="middle" dominant-baseline="central"${sel ? ' opacity=".6"' : ""} ${big ? "" : `paint-order="stroke" stroke="#fff" stroke-width="3"`}>${esc(t)}</text>`; }
    if (a.type === "mark") return `<g${sel ? ' opacity=".6"' : ""}><circle cx="${a.x}" cy="${a.y}" r="20" fill="#fff" stroke="${c}" stroke-width="3"/><text x="${a.x}" y="${a.y}" font-size="17" font-weight="800" font-family="system-ui,sans-serif" fill="${c}" text-anchor="middle" dominant-baseline="central">${a.value > 0 ? "+" : ""}${a.value}</text></g>`;
    if (a.type === "audio") { const n = S.annots.filter(x => x.type === "audio").indexOf(a) + 1; return `<g${sel ? ' opacity=".6"' : ""}><circle cx="${a.x}" cy="${a.y}" r="19" fill="${c}"/><text x="${a.x}" y="${a.y + 1}" font-size="16" fill="#fff" text-anchor="middle" dominant-baseline="central">🔊</text><circle cx="${a.x + 15}" cy="${a.y - 15}" r="10" fill="#fff" stroke="${c}" stroke-width="2"/><text x="${a.x + 15}" y="${a.y - 14}" font-size="12" font-weight="800" fill="${c}" text-anchor="middle" dominant-baseline="central">${n}</text></g>`; }
    return "";
  }
  function draw() {
    S.pages.forEach((p, i) => { svgOf(i).innerHTML = S.annots.filter(a => a.page === i).map(a => `<g data-id="${a.id}">${shape(a)}</g>`).join(""); });
    const total = S.annots.filter(a => a.type === "mark").reduce((t, a) => t + a.value, 0); $("[data-total]").textContent = +total.toFixed(2);
    const per = S.pages.map((_, i) => S.annots.filter(a => a.type === "mark" && a.page === i).reduce((t, a) => t + a.value, 0)); $("[data-perpage]").textContent = S.pages.length > 1 ? per.map((v, i) => `Page ${i + 1}: ${+v.toFixed(2)}`).join(" · ") : "";
    const au = S.annots.filter(a => a.type === "audio"); $("[data-audio]").innerHTML = au.length ? au.map((a, i) => `<div><b>${i + 1}</b> Page ${a.page + 1} · ${a.dur ? a.dur.toFixed(0) + " s" : ""}<button class="mk-b" data-play="${a.id}">▶ Play</button><button class="mk-b" data-del="${a.id}" aria-label="Delete audio comment ${i + 1}">✕</button></div>`).join("") : `<p class="mk-hint">None yet.</p>`;
    $("[data-bank]").innerHTML = bank.map((c, i) => `<button class="mk-chip" data-bk="${i}" aria-pressed="${S.bankPick === i}" title="Shift-click to remove">${esc(c)}</button>`).join("");
  }
  const pt = (e, i) => { const sv = svgOf(i), r = sv.getBoundingClientRect(), p = S.pages[i]; return [Math.round((e.clientX - r.left) / r.width * p.w), Math.round((e.clientY - r.top) / r.height * p.h)]; };
  const hitId = e => e.target.closest("[data-id]")?.dataset.id;

  /* ---------- interacting with the pages ---------- */
  pagesBox.addEventListener("pointerdown", async e => {
    const pg = e.target.closest(".mk-page"); if (!pg || e.button > 0) return; const i = +pg.dataset.p, [x, y] = pt(e, i); e.preventDefault();
    const t = S.tool, base = { id: uid(), page: i, color: S.ink, width: S.width };
    if (t === "erase") { const id = hitId(e); if (id) { S.annots = S.annots.filter(a => a.id !== id); commit(); say("Removed"); } return; }
    if (t === "select") { const id = hitId(e); S.sel = id || null; draw(); if (!id) return; const a = S.annots.find(z => z.id === id), start = [x, y], orig = JSON.parse(JSON.stringify(a));
      const mv = m => { const [mx, my] = pt(m, i), dx = mx - start[0], dy = my - start[1]; if (a.pts) a.pts = orig.pts.map(([px, py]) => [px + dx, py + dy]); else if ("x1" in a) { a.x1 = orig.x1 + dx; a.y1 = orig.y1 + dy; a.x2 = orig.x2 + dx; a.y2 = orig.y2 + dy; } else { a.x = orig.x + dx; a.y = orig.y + dy; } draw(); };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); commit(); }; addEventListener("pointermove", mv); addEventListener("pointerup", up); return; }
    if (t === "stamp") { S.annots.push({ ...base, type: "stamp", kind: S.stamp, text: S.customStamp, x, y }); commit(); say("Stamp added"); return; }
    if (t === "mark") { S.annots.push({ ...base, type: "mark", value: S.markVal, x, y }); commit(); say(`${S.markVal > 0 ? "Plus " : ""}${S.markVal} added. Total ${$("[data-total]").textContent}`); return; }
    if (t === "text") return editText(i, x, y, S.bankPick != null ? bank[S.bankPick] : "");
    if (t === "audio") return recordAt(i, x, y);
    // drawn shapes: pen, highlighter, line, arrow, box, circle, strike
    const a = t === "pen" || t === "hl" ? { ...base, type: t, pts: [[x, y]] } : t === "rect" || t === "ellipse" ? { ...base, type: t, x, y, w: 0, h: 0 } : { ...base, type: t, x1: x, y1: y, x2: x, y2: y };
    S.annots.push(a);
    const mv = m => { const [mx, my] = pt(m, i); if (a.pts) a.pts.push([mx, my]); else if ("w" in a) { a.w = mx - a.x; a.h = my - a.y; } else { a.x2 = mx; a.y2 = t === "strike" ? a.y1 : my; } draw(); };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); const tiny = a.pts ? a.pts.length < 2 : "w" in a ? Math.abs(a.w) + Math.abs(a.h) < 6 : Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 6; if (tiny) S.annots.pop(); commit(); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
  function editText(i, x, y, initial) { // a small box typed straight onto the page
    const pg = pagesBox.querySelector(`[data-p="${i}"]`), p = S.pages[i], r = pg.getBoundingClientRect(), k = r.width / p.w, ta = document.createElement("textarea");
    ta.className = "mk-edit"; ta.value = initial; ta.style.left = x * k + "px"; ta.style.top = y * k + "px"; ta.style.color = S.ink; ta.setAttribute("aria-label", "Comment text"); ta.rows = 2; pg.append(ta); ta.focus(); ta.select();
    let finished = false; // Enter, Esc and losing focus can all finish the box: only the first counts
    const done = keep => { if (finished) return; finished = true; const v = ta.value.trim(); ta.remove(); if (keep && v) { S.annots.push({ id: uid(), page: i, type: "text", text: v, x, y, color: S.ink, size: 22 }); commit(); say("Comment added"); } };
    ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); done(true); } if (e.key === "Escape") done(false); }; ta.onblur = () => done(true);
  }
  let rec = null;
  async function recordAt(i, x, y) { // a short audio comment, pinned where it applies
    if (rec) { rec.stop(); return; }
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(t => window.MediaRecorder?.isTypeSupported?.(t)) || "";
      const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined), parts = [], t0 = Date.now(); rec = mr; mr.ondataavailable = e => parts.push(e.data);
      const limit = setTimeout(() => mr.state === "recording" && mr.stop(), 120000);
      mr.onstop = () => { clearTimeout(limit); stream.getTracks().forEach(t => t.stop()); rec = null; msg(""); const blob = new Blob(parts, { type: mr.mimeType || "audio/webm" }), fr = new FileReader();
        fr.onload = () => { S.annots.push({ id: uid(), page: i, type: "audio", x, y, color: S.ink, src: fr.result, mime: blob.type, dur: (Date.now() - t0) / 1000 }); commit(); say("Audio comment added"); }; fr.readAsDataURL(blob); };
      mr.start(); msg("● Recording… click the page again, or press Esc, to stop."); say("Recording");
    } catch { msg("The microphone couldn’t be used. Allow it for this page, then try again."); }
  }
  addEventListener("keydown", e => { if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (e.key === "Escape" && rec) { rec.stop(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && S.sel) { S.annots = S.annots.filter(a => a.id !== S.sel); S.sel = null; commit(); return; }
    if (e.key === "[" || e.key === "]") { const i = INKS.findIndex(([c]) => c === S.ink), n = INKS[(i + (e.key === "]" ? 1 : INKS.length - 1)) % INKS.length]; setInk(n[0]); say(n[1] + " ink"); return; }
    const k = TOOLS.find(([, , key]) => key.toLowerCase() === e.key.toLowerCase()); if (k && !e.ctrlKey && !e.metaKey && !e.altKey) setTool(k[0]); });
  const setTool = t => { S.tool = t; $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === t))); if (t !== "text") S.bankPick = null; draw(); };
  const setInk = c => { S.ink = c; $$("[data-ink]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ink === c))); };
  root.addEventListener("click", async e => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool); if (b.dataset.ink) setInk(b.dataset.ink);
    if (b.dataset.w) { S.width = +b.dataset.w; $$("[data-w]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }
    if (b.dataset.a === "undo") undo(); if (b.dataset.a === "redo") redo();
    if (b.dataset.mv) { S.markVal = +b.dataset.mv; $$("[data-mv]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); setTool("mark"); }
    if (b.dataset.st) { S.stamp = b.dataset.st; S.customStamp = ""; $$("[data-st]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); setTool("stamp"); }
    if (b.dataset.a === "custom") { const v = $("[data-custom]").value.trim(); if (!v) return; S.stamp = "custom"; S.customStamp = v; $$("[data-st]").forEach(x => x.setAttribute("aria-pressed", "false")); setTool("stamp"); say(`Stamp “${v}” ready: click the work`); }
    if (b.dataset.bk) { const i = +b.dataset.bk; if (e.shiftKey) { bank.splice(i, 1); saveBank(); draw(); return; } S.bankPick = S.bankPick === i ? null : i; setTool("text"); S.bankPick = i; draw(); say(`“${bank[i]}”: click the work to place it`); }
    if (b.dataset.a === "addc") { const v = $("[data-newc]").value.trim(); if (v) { bank.push(v); $("[data-newc]").value = ""; saveBank(); draw(); } }
    if (b.dataset.play) { const a = S.annots.find(x => x.id === b.dataset.play); if (a) new Audio(a.src).play(); }
    if (b.dataset.del) { S.annots = S.annots.filter(x => x.id !== b.dataset.del); commit(); }
    if (b.dataset.exp) { const ex = opts.exports[+b.dataset.exp]; msg("Preparing…"); try { await ex.run(api); msg("Saved: " + ex.label); } catch (err) { msg("Couldn’t save: " + err.message); } }
  });
  const saveBank = () => { try { localStorage.setItem("markkit-bank", JSON.stringify(bank)); } catch {} };
  for (const [sel, key] of [["[data-outof]", "outOf"], ["[data-student]", "student"], ["[data-overall]", "overall"]]) $(sel).addEventListener("input", e => { S[key] = e.target.value; opts.onChange?.(state()); });

  /* ---------- outputs: marked pages, and a feedback page students can open anywhere ---------- */
  function state() { return { title: S.title, student: S.student, overall: S.overall, outOf: S.outOf, total: S.annots.filter(a => a.type === "mark").reduce((t, a) => t + a.value, 0), annots: S.annots }; }
  async function renderPage(i, scale = 1, withAudioPins = true) { // the page image with its marks, as a PNG
    const p = S.pages[i], c = document.createElement("canvas"); c.width = Math.round(p.w * scale); c.height = Math.round(p.h * scale); const g = c.getContext("2d");
    const img = await load(p.src); g.drawImage(img, 0, 0, c.width, c.height);
    const svg = `<svg xmlns="${NS}" viewBox="0 0 ${p.w} ${p.h}" width="${c.width}" height="${c.height}">${S.annots.filter(a => a.page === i && (withAudioPins || a.type !== "audio")).map(shape).join("")}</svg>`;
    const over = await load("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)); g.drawImage(over, 0, 0, c.width, c.height); return c;
  }
  async function renderOverlay(i, scale = 2) { // only the marks, on a transparent layer, to place over a PDF page
    const p = S.pages[i], c = document.createElement("canvas"); c.width = Math.round(p.w * scale); c.height = Math.round(p.h * scale);
    const svg = `<svg xmlns="${NS}" viewBox="0 0 ${p.w} ${p.h}" width="${c.width}" height="${c.height}">${S.annots.filter(a => a.page === i).map(shape).join("")}</svg>`;
    c.getContext("2d").drawImage(await load("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)), 0, 0, c.width, c.height); return c; }
  const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  async function feedbackHTML() {
    const st = state(), pages = []; for (let i = 0; i < S.pages.length; i++) pages.push((await renderPage(i, Math.min(1, 1400 / S.pages[i].w))).toDataURL("image/jpeg", .88));
    const au = S.annots.filter(a => a.type === "audio"), texts = S.annots.filter(a => a.type === "text");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Feedback: ${esc(st.title)}</title>
<style>body{margin:0;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f2f4f8;color:#16181d}main{max-width:1000px;margin:0 auto;padding:18px}header{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 2px 10px rgba(0,0,0,.06)}
h1{margin:0 0 4px;font-size:22px}.score{font-size:30px;font-weight:800;color:#a00016}.page{position:relative;margin:18px 0;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.1)}.page img{display:block;width:100%;height:auto}
.pin{position:absolute;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;border:3px solid #fff;background:#d0021b;color:#fff;font:700 16px system-ui;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.3)}.pin:focus-visible{outline:4px solid #1f4fd1}
.list{background:#fff;border-radius:16px;padding:16px 20px}audio{width:100%;max-width:420px}.muted{color:#5a6272;font-size:14px}@media (prefers-color-scheme:dark){body{background:#12141a;color:#edf0f6}header,.list{background:#1b1e26}.muted{color:#a3abbb}}</style></head>
<body><main><header><h1>${esc(st.title)}</h1>${st.student ? `<p class="muted">For ${esc(st.student)}</p>` : ""}${S.annots.some(a => a.type === "mark") ? `<p class="score">${+st.total.toFixed(2)}${st.outOf ? ` / ${esc(st.outOf)}` : ""} marks</p>` : ""}${st.overall ? `<p>${esc(st.overall).replace(/\n/g, "<br>")}</p>` : ""}${au.length ? `<p class="muted">Press a red 🔊 button on the work, or use the list below, to hear your teacher’s comments.</p>` : ""}</header>
${pages.map((src, i) => `<section class="page" aria-label="Page ${i + 1}"><img src="${src}" alt="Page ${i + 1} with your teacher’s marks">${au.filter(a => a.page === i).map(a => `<button class="pin" style="left:${a.x / S.pages[i].w * 100}%;top:${a.y / S.pages[i].h * 100}%" data-a="${au.indexOf(a)}" aria-label="Play audio comment ${au.indexOf(a) + 1}">🔊${au.indexOf(a) + 1}</button>`).join("")}</section>`).join("")}
${au.length || texts.length ? `<section class="list"><h2 style="font-size:18px;margin-top:0">Comments</h2>${au.map((a, i) => `<p><b>Audio ${i + 1}</b> <span class="muted">(page ${a.page + 1})</span><br><audio id="a${i}" controls preload="metadata" src="${a.src}"></audio></p>`).join("")}${texts.length ? `<ul>${texts.map(t => `<li>${esc(t.text)} <span class="muted">(page ${t.page + 1})</span></li>`).join("")}</ul>` : ""}</section>` : ""}
<p class="muted">Marked with ${esc(opts.app || "MarkKit")}. This page works offline in any browser.</p></main>
<script>document.querySelectorAll(".pin").forEach(b=>b.onclick=()=>{document.querySelectorAll("audio").forEach(x=>x.pause());const a=document.getElementById("a"+b.dataset.a);a.currentTime=0;a.play();a.scrollIntoView({block:"nearest"});});<\/script></body></html>`;
  }
  const api = { setTitle: t => { S.title = t; }, state, renderPage, renderOverlay, feedbackHTML, undo, redo, setTool, setInk, get annots() { return S.annots; }, pages: S.pages };
  draw(); return api;
}
window.MarkKit = { mount, STAMPS, BANK };
})();
