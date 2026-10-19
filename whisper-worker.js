/* Blueforte Notes – Whisper läuft lokal in diesem Web Worker. Audio verlässt das Gerät nicht. */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

const MODEL = 'Xenova/whisper-base';
env.allowLocalModels = false;   // Modell von Hugging Face laden …
env.useBrowserCache = true;     // … und danach aus dem Browser-Cache

let transcriber = null;
let ready = null;

async function hasWebGPU() {
  try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch { return false; }
}

async function load() {
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

ready = load();
ready.catch(err => self.postMessage({ type: 'load-error', message: String(err && err.message || err) }));

// Aufträge der Reihe nach abarbeiten
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
      self.postMessage({ type: 'error', id: data.id, message: String(err && err.message || err), modelMissing: !transcriber });
    }
  });
};
