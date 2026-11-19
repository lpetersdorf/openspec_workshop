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

// ---------- Sprache automatisch erkennen ----------
// transformers.js nimmt ohne Sprachvorgabe Englisch an. Deshalb ein eigener Schritt:
// Encoder + ein Decoder-Schritt mit dem Start-Token, dann das wahrscheinlichste Sprach-Token
// unter den angebotenen Sprachen (siehe design.md).
const AUTO_LANGUAGES = { de: 'german', en: 'english', fr: 'french', es: 'spanish', it: 'italian' };

/** IEEE-754-Halbgenauigkeit → Zahl (Logits kommen bei fp16-Modellen als Uint16Array). */
function halfToFloat(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + f / 1024);
}

async function detectLanguage(audio) {
  try {
    const { model, processor } = transcriber;
    const cfg = model.generation_config;
    const sample = audio.length > 30 * 16000 ? audio.subarray(0, 30 * 16000) : audio;   // erste 30 s reichen
    const { input_features } = await processor(sample);
    const decoder_input_ids = new lib.Tensor('int64', BigInt64Array.from([BigInt(cfg.decoder_start_token_id)]), [1, 1]);
    const { logits } = await model({ input_features, decoder_input_ids });
    const vocab = logits.dims[logits.dims.length - 1];
    const offset = logits.data.length - vocab;   // letzter (einziger) Decoder-Schritt
    const half = logits.type === 'float16' && !(logits.data instanceof Float32Array);
    let best = null, bestScore = -Infinity;
    for (const [code, name] of Object.entries(AUTO_LANGUAGES)) {
      const tokenId = cfg.lang_to_id && cfg.lang_to_id[`<|${code}|>`];
      if (tokenId === undefined) continue;
      const raw = logits.data[offset + tokenId];
      const score = half ? halfToFloat(raw) : Number(raw);
      if (score > bestScore) { bestScore = score; best = name; }
    }
    if (!best) throw new Error('keine Sprach-Tokens im Modell');
    self.postMessage({ type: 'language', language: best });
    return best;
  } catch (err) {
    console.warn('Spracherkennung fehlgeschlagen, es bleibt bei Deutsch:', err);
    return 'german';
  }
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
      const language = data.language === 'auto' ? await detectLanguage(data.audio)
        : (data.language || 'german');
      const out = await transcriber(data.audio, {
        language,
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
