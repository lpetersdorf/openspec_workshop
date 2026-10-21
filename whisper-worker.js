/* Blueforte Notes – Whisper läuft lokal in diesem Web Worker. Audio verlässt das Gerät nicht. */
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

let lib = null;           // transformers.js
let transcriber = null;   // aktives Modell
let activeKey = null;

async function capabilities() {
  try {
    const adapter = navigator.gpu && await navigator.gpu.requestAdapter();
    return { webgpu: !!adapter, f16: !!(adapter && adapter.features.has('shader-f16')) };
  } catch { return { webgpu: false, f16: false }; }
}

/** Desktop-App (und nach "npm install"): Bibliothek lokal aus vendor/, sonst vom CDN. */
async function loadLibrary() {
  if (lib) return lib;
  try {
    lib = await import('./vendor/transformers.min.js');
    lib.env.backends.onnx.wasm.wasmPaths = new URL('./vendor/', self.location.href).href;
  } catch {
    lib = await import(CDN);
  }
  lib.env.allowLocalModels = false;   // Modell von Hugging Face laden …
  lib.env.useBrowserCache = true;     // … und danach aus dem Cache
  return lib;
}

/** Lädt ein Modell. Das bisherige bleibt aktiv, bis das neue bereit ist. */
async function load({ key, id, device, dtype }) {
  const { pipeline } = await loadLibrary();
  self.postMessage({ type: 'loading', key, device, model: id });
  const next = await pipeline('automatic-speech-recognition', id, {
    device,
    dtype,
    progress_callback: p => {
      if (p.status === 'progress') self.postMessage({ type: 'progress', key, file: p.file, loaded: p.loaded, total: p.total });
    }
  });
  const previous = transcriber;
  transcriber = next;
  activeKey = key;
  if (previous) { try { await previous.dispose(); } catch { /* bereits freigegeben */ } }
  self.postMessage({ type: 'ready', key, device, model: id });
}

// Aufträge warten auf das gerade ladende Modell. Bis zum ersten "load" wartet alles.
let resolveFirst;
let ready = new Promise(resolve => { resolveFirst = resolve; });
let queue = Promise.resolve();

capabilities().then(caps => self.postMessage({ type: 'caps', ...caps }));

self.onmessage = ({ data }) => {
  if (data.type === 'load') {
    const loading = load(data);
    // Bei Fehler arbeitet das bisherige Modell weiter (falls vorhanden)
    const settled = loading.catch(err => {
      self.postMessage({ type: 'load-error', key: data.key, keptPrevious: !!transcriber, previous: activeKey, message: String((err && err.message) || err) });
    });
    resolveFirst(settled);
    ready = settled;
    return;
  }
  if (data.type !== 'transcribe') return;
  queue = queue.then(async () => {
    try {
      await ready;
      if (!transcriber) throw new Error('Kein Modell geladen');
      const out = await transcriber(data.audio, {
        language: 'german',
        task: data.translate ? 'translate' : 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5
      });
      self.postMessage({ type: 'result', id: data.id, text: (out && out.text) || '' });
    } catch (err) {
      self.postMessage({ type: 'error', id: data.id, message: String((err && err.message) || err), modelMissing: !transcriber });
    }
  });
};
