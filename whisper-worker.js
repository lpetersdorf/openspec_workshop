/* Blueforte Notes – Whisper läuft lokal in diesem Web Worker. Audio verlässt das Gerät nicht. */
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
const MODEL = 'Xenova/whisper-base';

let transcriber = null;

async function hasWebGPU() {
  try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch { return false; }
}

/** Desktop-App (und nach "npm install"): Bibliothek lokal aus vendor/, sonst vom CDN. */
async function loadLibrary() {
  try {
    const lib = await import('./vendor/transformers.min.js');
    lib.env.backends.onnx.wasm.wasmPaths = new URL('./vendor/', self.location.href).href;
    return lib;
  } catch {
    return import(CDN);
  }
}

async function load() {
  const { pipeline, env } = await loadLibrary();
  env.allowLocalModels = false;   // Modell von Hugging Face laden …
  env.useBrowserCache = true;     // … und danach aus dem Cache
  const webgpu = await hasWebGPU();
  const device = webgpu ? 'webgpu' : 'wasm';
  const dtype = webgpu
    ? { encoder_model: 'fp32', decoder_model_merged: 'q4' }
    : { encoder_model: 'q8', decoder_model_merged: 'q8' };
  self.postMessage({ type: 'loading', device, model: MODEL });
  transcriber = await pipeline('automatic-speech-recognition', MODEL, {
    device,
    dtype,
    progress_callback: p => {
      if (p.status === 'progress') self.postMessage({ type: 'progress', file: p.file, loaded: p.loaded, total: p.total });
    }
  });
  self.postMessage({ type: 'ready', device, model: MODEL });
}

const ready = load();
ready.catch(err => self.postMessage({ type: 'load-error', message: String((err && err.message) || err) }));

// Aufträge der Reihe nach abarbeiten; Aufträge vor Ende des Ladens warten auf das Modell
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  if (data.type !== 'transcribe') return;
  queue = queue.then(async () => {
    try {
      await ready;
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
