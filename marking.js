/* Lassolve marking: the screenshot from the editor, marked with MarkKit. Outputs: the marked image, and a feedback
   page with playable audio comments that students can open in any browser. */
const get = () => new Promise(res => { const q = indexedDB.open("lassolve-mark", 1); q.onupgradeneeded = () => q.result.createObjectStore("kv"); q.onsuccess = () => { const g = q.result.transaction("kv").objectStore("kv").get("image"); g.onsuccess = () => res(g.result); g.onerror = () => res(null); }; q.onerror = () => res(null); });
const download = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const slug = () => (document.getElementById("title").value || "feedback").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "feedback";
get().then(d => { if (!d) { document.getElementById("mk").innerHTML = "<p style='padding:20px'>No screenshot to mark. Open one in the Lassolve editor and choose Mark for feedback.</p>"; return; }
  const im = new Image(); im.onload = () => {
    const kit = MarkKit.mount(document.getElementById("mk"), { app: "Lassolve", title: document.getElementById("title").value, pages: [{ src: d.src, w: im.naturalWidth, h: im.naturalHeight }],
      exports: [
        { label: "Feedback page for the student", run: async k => download(new Blob([await k.feedbackHTML()], { type: "text/html" }), slug() + ".html") },
        { label: "Marked image (PNG)", run: async k => { const c = await k.renderPage(0, 1); download(await new Promise(r => c.toBlob(r, "image/png")), slug() + ".png"); } },
        { label: "Copy the marked image", run: async k => { const c = await k.renderPage(0, 1); await navigator.clipboard.write([new ClipboardItem({ "image/png": await new Promise(r => c.toBlob(r, "image/png")) })]); } }] });
    document.getElementById("title").oninput = e => kit.setTitle(e.target.value); window.__kit = kit;
  }; im.src = d.src; });
