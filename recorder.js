/* Lassolve recorder: records a tab, window or screen with optional system sound, microphone and camera bubble. */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let surface = "browser", rec = null, chunks = [], streams = [], t0 = 0, paused = 0, pauseStart = 0, tick = 0, mime = "", blob = null, micTrack = null, camVideo = null, ac = null;
$$(".seg button").forEach(b => b.onclick = () => { surface = b.dataset.s; $$(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b)); });
chrome.storage?.local.get({ rec: {} }).then(({ rec: s }) => { if (s.surface) $(`[data-s="${s.surface}"]`)?.click(); ["sysAudio", "mic", "cam", "countdown"].forEach(k => { if (k in s) $("#" + k).checked = s[k]; }); if (s.quality != null) $("#quality").value = s.quality; if (s.fps) $("#fps").value = s.fps; });
/* ---------- modes: Record screen, or Video to GIF (also opened directly with #gif) ---------- */
function setMode(m) {
  if (rec) return;                                                      // never switch mid-recording
  $$("#modes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === m));
  const gif = m === "gif"; stopMicTest();
  $("#setup").hidden = gif || !$("#done").hidden; $("#convert").hidden = !gif; if (gif) $("#done").hidden = true;
  $("#title").textContent = gif ? "Video to GIF" : "Record your screen";
  $("#sub").textContent = gif ? "Turn part of any video into an animated GIF, on this device." : "Choose what to record. Chrome will ask you to pick it next.";
  history.replaceState(null, "", gif ? "#gif" : location.pathname);
}
$$("#modes button").forEach(b => b.onclick = () => setMode(b.dataset.mode));

/* ---------- your voice: a check before recording, and a meter while recording ---------- */
let testStream = null, testCtx = null, liveCtx = null;
function meter(stream, bar) {
  const ctx = new AudioContext(), an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
  ctx.resume().catch(() => {});                                         // Chrome can start an audio context suspended
  const buf = new Uint8Array(an.fftSize);
  let shown = 0;
  (function loop() { if (ctx.state === "closed") return; an.getByteTimeDomainData(buf);
    let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
    const db = 20 * Math.log10(Math.sqrt(sum / buf.length) + 1e-9);                 // loudness in decibels, as it is heard
    const level = Math.max(0, Math.min(1, (db + 60) / 54));                          // -60 dB (silence) to -6 dB (loud)
    shown = level > shown ? level : shown * 0.9 + level * 0.1;                       // rise at once, fall gently
    bar.style.width = (shown * 100).toFixed(0) + "%"; requestAnimationFrame(loop); })();
  return ctx;
}
async function startMicTest() {
  stopMicTest(); $("#micTest").hidden = false; $("#micTestMsg").textContent = "Speak to test your microphone";
  try { testStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); testCtx = meter(testStream, $("#micTestBar"));
    const label = testStream.getAudioTracks()[0]?.label; if (label) $("#micTestMsg").textContent = "Speak to test: " + label; }
  catch { $("#micTestMsg").textContent = "Chrome blocked the microphone. Allow it in the address bar, or your voice won’t be recorded."; }
}
function stopMicTest() { testStream?.getTracks().forEach(t => t.stop()); testStream = null; testCtx?.close(); testCtx = null; $("#micTestBar").style.width = "0"; $("#micTest").hidden = true; }
$("#mic").addEventListener("change", () => $("#mic").checked ? startMicTest() : stopMicTest());

const fmt = ms => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
const showErr = m => { $("#err").hidden = false; $("#err").textContent = m; };
function pickMime() { return ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(m => MediaRecorder.isTypeSupported(m)) || ""; }
async function startCamBubble() {
  try {
    const cam = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640, facingMode: "user" } }); streams.push(cam);
    camVideo = document.createElement("video"); camVideo.srcObject = cam; camVideo.muted = true; camVideo.playsInline = true; await camVideo.play();
    if (document.pictureInPictureEnabled) await camVideo.requestPictureInPicture();
  } catch { showErr("Couldn’t open the camera. Recording continues without the bubble."); }
}
$("#start").onclick = async () => {
  $("#err").hidden = true; stopMicTest();
  const q = +$("#quality").value, fps = +$("#fps").value;
  chrome.storage?.local.set({ rec: { surface, sysAudio: $("#sysAudio").checked, mic: $("#mic").checked, cam: $("#cam").checked, countdown: $("#countdown").checked, quality: q, fps } });
  if ($("#cam").checked) await startCamBubble();
  let display;
  try {
    display = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: surface, frameRate: { ideal: fps, max: fps }, ...(q ? { height: { ideal: q, max: q } } : {}), cursor: "always" },
      audio: $("#sysAudio").checked ? { suppressLocalAudioPlayback: false } : false, selfBrowserSurface: "exclude", surfaceSwitching: "include", systemAudio: "include",
    });
  } catch (e) { stopAll(); return showErr(e.name === "NotAllowedError" ? "Recording was cancelled. Click Start recording to try again." : "Chrome couldn’t start the recording: " + e.message); }
  streams.push(display);
  const tracks = [...display.getVideoTracks()];
  const sys = display.getAudioTracks(); let mic = null;
  if ($("#mic").checked) { try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); streams.push(mic); micTrack = mic.getAudioTracks()[0]; } catch { showErr("Microphone was blocked, so it won’t be recorded."); } }
  if (sys.length && mic) { ac = new AudioContext(); const dest = ac.createMediaStreamDestination(); ac.createMediaStreamSource(new MediaStream(sys)).connect(dest); ac.createMediaStreamSource(mic).connect(dest); tracks.push(dest.stream.getAudioTracks()[0]); }
  else if (sys.length) tracks.push(sys[0]); else if (mic) tracks.push(micTrack);
  if ($("#countdown").checked) { const c = $("#count"); c.hidden = false; for (let n = 3; n > 0; n--) { c.textContent = n; await new Promise(r => setTimeout(r, 900)); } c.hidden = true; }
  mime = pickMime(); chunks = [];
  rec = new MediaRecorder(new MediaStream(tracks), mime ? { mimeType: mime, videoBitsPerSecond: q === 720 ? 4e6 : 8e6 } : undefined);
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.onstop = finish;
  display.getVideoTracks()[0].addEventListener("ended", () => rec?.state !== "inactive" && rec.stop());
  rec.start(1000); t0 = Date.now(); paused = 0;
  $("#setup").hidden = true; $("#modes").hidden = true; $("#live").hidden = false; $("#muteMic").hidden = !micTrack;
  $("#micLive").hidden = !micTrack; if (micTrack) liveCtx = meter(new MediaStream([micTrack]), $("#micLiveBar")); $("#title").textContent = "Recording"; $("#sub").textContent = "Lassolve is recording what you chose.";
  tick = setInterval(() => { const now = rec.state === "paused" ? pauseStart : Date.now(); $("#timer").textContent = fmt(now - t0 - paused); document.title = `● ${$("#timer").textContent} Lassolve recorder`; }, 250);
};
$("#pause").onclick = () => {
  if (!rec) return;
  if (rec.state === "recording") { rec.pause(); pauseStart = Date.now(); $("#pause").textContent = "Resume"; $("#state").textContent = "Paused"; $("#dot").style.animation = "none"; }
  else if (rec.state === "paused") { rec.resume(); paused += Date.now() - pauseStart; $("#pause").textContent = "Pause"; $("#state").textContent = "Recording"; $("#dot").style.animation = ""; }
};
$("#muteMic").onclick = () => { if (!micTrack) return; micTrack.enabled = !micTrack.enabled; $("#muteMic").textContent = micTrack.enabled ? "Mute mic" : "Unmute mic"; $("#micLive").style.opacity = micTrack.enabled ? 1 : .45; };
$("#stop").onclick = () => rec?.state !== "inactive" && rec.stop();
function stopAll() { liveCtx?.close(); liveCtx = null; $("#micLive").hidden = true; streams.forEach(s => s.getTracks().forEach(t => t.stop())); streams = []; if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {}); ac?.close(); ac = null; }
function finish() {
  clearInterval(tick); $("#modes").hidden = false; const dur = Date.now() - t0 - paused; stopAll();
  const type = (rec.mimeType || mime || "video/webm").split(";")[0]; blob = new Blob(chunks, { type }); rec = null;
  $("#live").hidden = true; $("#done").hidden = false; $("#title").textContent = "Your recording"; $("#sub").textContent = "Watch it back, then download the video, or make a GIF from part of it."; document.title = "Lassolve recorder";
  $("#preview").src = URL.createObjectURL(blob);
  $("#meta").innerHTML = `<span>${fmt(dur)}</span><span>${(blob.size / 1048576).toFixed(1)} MB</span><span>${type.includes("mp4") ? "MP4" : "WebM"}</span>`;
  $("#download").focus();
}
$("#download").onclick = () => { if (!blob) return; const a = document.createElement("a"); a.href = $("#preview").src; a.download = `lassolve-recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${blob.type.includes("mp4") ? "mp4" : "webm"}`; a.click(); };
$("#again").onclick = () => { $("#done").hidden = true; $("#setup").hidden = false; $("#modes").hidden = false; if ($("#mic").checked) startMicTest(); $("#title").textContent = "Record your screen"; $("#sub").textContent = "Choose what to record. Chrome will ask you to pick it next."; $("#start").focus(); };
addEventListener("keydown", e => { if (e.key === " " && !$("#live").hidden && document.activeElement.tagName !== "BUTTON") { e.preventDefault(); $("#pause").click(); } });
addEventListener("beforeunload", e => { if (rec) { e.preventDefault(); e.returnValue = ""; } });

if (location.hash === "#gif") setMode("gif");          // last, once everything it uses exists
