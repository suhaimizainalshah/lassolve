/* Lassolve recorder: the GIF panels. One under each recording; one in Video to GIF, for any video file. Nothing is uploaded. */
import { mountGifPanel } from "./gifpanel.js";

mountGifPanel(document.getElementById("gifRec"), document.getElementById("preview"), { baseName: "lassolve-recording", note: "Your voice stays in the video download." });

const src = document.getElementById("srcVideo"), drop = document.getElementById("drop"), file = document.getElementById("file");
const wrap = document.getElementById("convWrap"), err = document.getElementById("convErr");
let url = "", base = "lassolve-gif";
mountGifPanel(document.getElementById("gifConv"), src, { baseName: () => base });

function open(f) {
  err.hidden = true;
  if (!f) return;
  if (!/^video\//.test(f.type) && !/\.(mp4|webm|mov|m4v|mkv|ogv)$/i.test(f.name)) { err.hidden = false; err.textContent = "That file isn’t a video. Choose an MP4, WebM or MOV file."; return; }
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(f); base = f.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 60) || "lassolve-gif";
  src.src = url; wrap.hidden = false; drop.hidden = true;
  document.getElementById("srcMeta").innerHTML = `<span>${f.name.replace(/[<>&"]/g, "")}</span><span>${f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB"}</span>`;
}
src.addEventListener("error", () => { if (!src.getAttribute("src")) return; err.hidden = false; err.textContent = "Chrome can’t play this video, so it can’t become a GIF. MP4 (H.264) and WebM work best."; wrap.hidden = true; drop.hidden = false; });
file.addEventListener("change", () => open(file.files[0]));
["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => open(e.dataTransfer.files[0]));
document.getElementById("another").onclick = () => { src.pause(); src.removeAttribute("src"); src.load(); wrap.hidden = true; drop.hidden = false; file.value = ""; file.focus(); };
