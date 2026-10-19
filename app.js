/* Blueforte Notes – Version 2: lokale Transkription mit Whisper. Audio verlässt das Gerät nicht. */
(() => {
  'use strict';

  // ---------- Reine Funktionen (ohne Mikrofon testbar) ----------

  const DEFAULT_GLOSSARY = [
    { from: 'blue forte', to: 'Blueforte' },
    { from: 'open spec', to: 'OpenSpec' },
    { from: 'obsidian', to: 'Obsidian' },
    { from: 'cloud code', to: 'Claude Code' },
    { from: 'codecs', to: 'Codex' }
  ];

  const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /** Ersetzt Glossar-Begriffe: ganze Wörter, ohne Groß-/Kleinschreibung, beliebige Leerzeichen. */
  function applyGlossary(text, entries) {
    return entries.reduce((acc, { from, to }) => {
      const words = from.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
      if (!words.length) return acc;
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${words.join('\\s+')}(?![\\p{L}\\p{N}])`, 'giu');
      return acc.replace(re, to);
    }, text);
  }

  const pad = n => String(n).padStart(2, '0');

  function formatDuration(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(s / 60)}:${pad(s % 60)}`;
  }

  function noteFilename(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}${pad(date.getMinutes())} Diktat.md`;
  }

  function buildNote(text, date, durationMs) {
    const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const human = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${time} Uhr`;
    return [
      '---',
      `datum: ${iso}`,
      `uhrzeit: "${time}"`,
      `dauer: "${formatDuration(durationMs)}"`,
      'tags: [diktat]',
      '---',
      '',
      `# Diktat ${human}`,
      '',
      text.trim(),
      ''
    ].join('\n');
  }

  const CLAUDE_PROMPT = 'Mach aus diesem Diktat eine kurze Notiz mit Zusammenfassung und Action Items:';
  const buildClaudePrompt = text => `${CLAUDE_PROMPT}\n\n${text.trim()}`;

  function appendText(existing, addition) {
    const add = addition.trim();
    if (!add) return existing;
    if (!existing) return add;
    return /\s$/.test(existing) ? existing + add : `${existing} ${add}`;
  }

  /** Lautstärke eines Puffers (Effektivwert). */
  function rms(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return buf.length ? Math.sqrt(sum / buf.length) : 0;
  }

  /** Rechnet Audio auf die Zielrate herunter (Mittelwert je Fenster). */
  function downsample(buf, fromRate, toRate = 16000) {
    if (fromRate === toRate) return Float32Array.from(buf);
    const ratio = fromRate / toRate;
    const out = new Float32Array(Math.floor(buf.length / ratio));
    for (let i = 0; i < out.length; i++) {
      const start = Math.floor(i * ratio), end = Math.min(buf.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let j = start; j < end; j++) sum += buf[j];
      out[i] = end > start ? sum / (end - start) : 0;
    }
    return out;
  }

  function concat(chunks) {
    const len = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Float32Array(len);
    let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }

  /**
   * Zerlegt einen Audiostrom in Abschnitte: nach Sprache und kurzer Stille, spätestens nach maxSec.
   * Abschnitte ohne Sprache werden verworfen (kein Text bei Stille).
   */
  class Segmenter {
    constructor({ sampleRate, threshold = 0.012, minSilenceSec = 0.8, maxSec = 20, minSpeechSec = 0.3, prerollSec = 0.3 }) {
      Object.assign(this, { sampleRate, threshold });
      this.minSilence = minSilenceSec * sampleRate;
      this.max = maxSec * sampleRate;
      this.minSpeech = minSpeechSec * sampleRate;
      this.preroll = prerollSec * sampleRate;
      this.reset();
    }
    reset() { this.chunks = []; this.total = 0; this.speech = 0; this.silence = 0; }
    push(buf) {
      const loud = rms(buf) >= this.threshold;
      this.chunks.push(buf); this.total += buf.length;
      if (loud) { this.speech += buf.length; this.silence = 0; } else { this.silence += buf.length; }
      if (this.speech === 0) {
        // Noch keine Sprache: nur einen kurzen Vorlauf behalten
        while (this.chunks.length > 1 && this.total - this.chunks[0].length >= this.preroll) this.total -= this.chunks.shift().length;
        return [];
      }
      if (this.speech >= this.minSpeech && (this.silence >= this.minSilence || this.total >= this.max)) {
        const seg = concat(this.chunks); this.reset(); return [seg];
      }
      return [];
    }
    flush() {
      const seg = this.speech >= this.minSpeech ? concat(this.chunks) : null;
      this.reset();
      return seg;
    }
  }

  /** Bekannte Whisper-Halluzinationen, die bei Stille oder Rauschen entstehen. */
  const HALLUCINATIONS = [
    /untertitel(ung)? (im auftrag|des zdf|der amara|von)/i,
    /vielen dank (fürs|für's|für das|für ihre aufmerksamkeit)/i,
    /^\s*(danke\.?|tschüss\.?|\.+|…)\s*$/i,
    /copyright .*(wdr|zdf|ard|swr)/i,
    /^\s*\[?(musik|music|stille|silence|applaus)\]?\s*$/i
  ];
  function isHallucination(text) {
    const t = text.trim();
    return !t || HALLUCINATIONS.some(re => re.test(t));
  }

  // Für Tests im Browser verfügbar machen
  window.BFN = {
    applyGlossary, formatDuration, noteFilename, buildNote, buildClaudePrompt, appendText,
    rms, downsample, Segmenter, isHallucination, DEFAULT_GLOSSARY
  };

  // ---------- Glossar-Speicher ----------

  const GLOSSARY_KEY = 'bfn-glossar';
  function loadGlossary() {
    try {
      const raw = localStorage.getItem(GLOSSARY_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_GLOSSARY.slice();
    } catch { return DEFAULT_GLOSSARY.slice(); }
  }
  function saveGlossary(entries) {
    try { localStorage.setItem(GLOSSARY_KEY, JSON.stringify(entries)); } catch { /* privat-Modus: nur für diese Sitzung */ }
  }

  // ---------- Oberfläche ----------

  const $ = id => document.getElementById(id);
  const ui = {
    rec: $('recBtn'), recLabel: $('recLabel'), status: $('statusText'), timer: $('timer'),
    text: $('text'), interim: $('interim'), problem: $('problem'),
    model: $('modelStatus'), modelBar: $('modelBar'), engine: $('engine'),
    file: $('fileInput'), translate: $('translate'),
    copy: $('copyBtn'), note: $('noteBtn'), claude: $('claudeBtn'), clear: $('clearBtn'), toast: $('toast'),
    gList: $('glossaryList'), gCount: $('glossaryCount'), gForm: $('glossaryForm'), gFrom: $('gFrom'), gTo: $('gTo')
  };

  let glossary = loadGlossary();
  let toastTimer = null;

  function toast(msg) {
    ui.toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.textContent = ''; }, 2500);
  }

  function showProblem(msg) {
    ui.problem.textContent = msg;
    ui.problem.hidden = !msg;
  }

  function updateButtons() {
    const empty = !ui.text.value.trim();
    ui.copy.disabled = empty;
    ui.note.disabled = empty;
    ui.claude.disabled = empty;
  }

  function renderGlossary() {
    ui.gList.innerHTML = '';
    glossary.forEach((g, i) => {
      const li = document.createElement('li');
      const from = document.createElement('span'); from.className = 'from'; from.textContent = g.from;
      const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.setAttribute('aria-hidden', 'true');
      const to = document.createElement('span'); to.className = 'to'; to.textContent = g.to;
      const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Entfernen';
      del.setAttribute('aria-label', `${g.from} entfernen`);
      del.addEventListener('click', () => { glossary.splice(i, 1); saveGlossary(glossary); renderGlossary(); });
      li.append(from, arrow, to, del);
      ui.gList.append(li);
    });
    ui.gCount.textContent = `(${glossary.length})`;
  }

  ui.gForm.addEventListener('submit', e => {
    e.preventDefault();
    const from = ui.gFrom.value.trim(), to = ui.gTo.value.trim();
    if (!from || !to) return;
    glossary = glossary.filter(g => g.from.toLowerCase() !== from.toLowerCase());
    glossary.push({ from, to });
    saveGlossary(glossary);
    ui.gFrom.value = ''; ui.gTo.value = '';
    renderGlossary();
    toast('Glossar gespeichert');
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = text; document.body.append(helper); helper.select();
      try { document.execCommand('copy'); } finally { helper.remove(); }
    }
    toast('Kopiert');
  }

  ui.copy.addEventListener('click', () => copyText(ui.text.value.trim()));
  ui.claude.addEventListener('click', () => copyText(buildClaudePrompt(ui.text.value)));
  ui.note.addEventListener('click', () => {
    const now = new Date();
    const blob = new Blob([buildNote(ui.text.value, now, totalMs())], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = noteFilename(now);
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Notiz gespeichert');
  });
  ui.clear.addEventListener('click', () => {
    ui.text.value = ''; recordedMs = 0; renderTimer(); updateButtons();
  });
  ui.text.addEventListener('input', updateButtons);

  // ---------- Whisper im Worker ----------

  const worker = new Worker('whisper-worker.js', { type: 'module' });
  const progress = new Map();
  let modelReady = false;
  let nextId = 1;
  let pending = 0;

  function renderStatus() {
    if (recording) ui.status.textContent = pending ? `Hört zu … · ${pending} in Arbeit` : 'Hört zu …';
    else ui.status.textContent = pending ? `Transkribiert (${pending}) …` : 'Bereit';
    ui.interim.textContent = pending ? (modelReady ? 'Text wird verarbeitet …' : 'Wartet auf das Modell …') : '';
  }

  worker.addEventListener('message', ({ data }) => {
    switch (data.type) {
      case 'loading':
        ui.model.textContent = 'Modell wird geladen …';
        break;
      case 'progress': {
        progress.set(data.file, { loaded: data.loaded || 0, total: data.total || 0 });
        let loaded = 0, total = 0;
        progress.forEach(p => { loaded += p.loaded; total += p.total; });
        const pct = total ? Math.min(100, Math.round(loaded / total * 100)) : 0;
        ui.model.textContent = `Modell wird geladen: ${pct} %`;
        ui.modelBar.style.width = `${pct}%`;
        break;
      }
      case 'ready':
        modelReady = true;
        ui.modelBar.style.width = '100%';
        ui.model.textContent = data.device === 'webgpu'
          ? 'Modell bereit · Grafikkarte'
          : 'Modell bereit · Prozessor';
        ui.engine.textContent = 'Lokal · Whisper base';
        if (data.device !== 'webgpu') {
          showProblem('Dieser Browser bietet keine Grafikbeschleunigung (WebGPU). Die Transkription läuft auf dem Prozessor und dauert länger.');
        }
        renderStatus();
        break;
      case 'load-error':
        ui.model.textContent = 'Modell nicht geladen';
        showProblem('Das Spracherkennungsmodell konnte nicht geladen werden. Für den ersten Start ist einmalig eine Internetverbindung nötig. Danach funktioniert die App auch offline.');
        break;
      case 'result': {
        pending = Math.max(0, pending - 1);
        if (!isHallucination(data.text)) {
          ui.text.value = appendText(ui.text.value, applyGlossary(data.text, glossary));
          ui.text.scrollTop = ui.text.scrollHeight;
          updateButtons();
        }
        renderStatus();
        break;
      }
      case 'error':
        pending = Math.max(0, pending - 1);
        // Ohne Modell steht der Hinweis zum Laden bereits da
        if (!data.modelMissing) showProblem(`Ein Abschnitt konnte nicht transkribiert werden: ${data.message}`);
        renderStatus();
        break;
    }
  });

  /** Schickt Audio (beliebige Rate) als 16-kHz-Mono an den Worker. */
  function transcribe(samples, sampleRate) {
    const audio = downsample(samples, sampleRate, 16000);
    pending++;
    renderStatus();
    worker.postMessage({ type: 'transcribe', id: nextId++, audio, translate: ui.translate.checked }, [audio.buffer]);
  }

  // ---------- Aufnahme ----------

  let recording = false;
  let stream = null, ctx = null, processor = null, segmenter = null;
  let recordedMs = 0, segmentStart = 0, tick = null;

  const totalMs = () => recordedMs + (recording && segmentStart ? Date.now() - segmentStart : 0);
  const renderTimer = () => { ui.timer.textContent = formatDuration(totalMs()); };

  function setRecordingUI(on) {
    ui.rec.setAttribute('aria-pressed', String(on));
    ui.recLabel.textContent = on ? 'Stopp' : 'Aufnahme';
    renderStatus();
  }

  async function startRecording() {
    showProblem('');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        showProblem('Kein Zugriff auf das Mikrofon. Bitte in den Browser-Einstellungen für diese Seite das Mikrofon erlauben (Schloss-Symbol in der Adresszeile) und die App über localhost öffnen.');
      } else {
        showProblem('Kein Mikrofon gefunden. Bitte ein Mikrofon anschließen.');
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    // ScriptProcessorNode: veraltet, aber überall verfügbar und für diese Größe ausreichend (siehe design.md)
    processor = ctx.createScriptProcessor(4096, 1, 1);
    segmenter = new Segmenter({ sampleRate: ctx.sampleRate });
    processor.onaudioprocess = e => {
      if (!recording) return;
      const buf = Float32Array.from(e.inputBuffer.getChannelData(0));
      segmenter.push(buf).forEach(seg => transcribe(seg, ctx.sampleRate));
    };
    source.connect(processor);
    processor.connect(ctx.destination);

    recording = true;
    segmentStart = Date.now();
    clearInterval(tick); tick = setInterval(renderTimer, 500);
    setRecordingUI(true);
  }

  function stopRecording() {
    if (recording && segmentStart) recordedMs += Date.now() - segmentStart;
    recording = false;
    segmentStart = 0;
    clearInterval(tick); renderTimer();
    if (segmenter && ctx) {
      const rest = segmenter.flush();
      if (rest) transcribe(rest, ctx.sampleRate);
    }
    try { processor && processor.disconnect(); } catch { /* bereits getrennt */ }
    stream && stream.getTracks().forEach(t => t.stop());
    ctx && ctx.close();
    stream = ctx = processor = segmenter = null;
    setRecordingUI(false);
  }

  ui.rec.addEventListener('click', () => (recording ? stopRecording() : startRecording()));

  // ---------- Audiodatei hochladen ----------

  ui.file.addEventListener('change', async () => {
    const file = ui.file.files && ui.file.files[0];
    if (!file) return;
    showProblem('');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const decoder = new AudioCtx();
    try {
      const decoded = await decoder.decodeAudioData(await file.arrayBuffer());
      const mono = new Float32Array(decoded.length);
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const data = decoded.getChannelData(c);
        for (let i = 0; i < data.length; i++) mono[i] += data[i] / decoded.numberOfChannels;
      }
      if (rms(mono) < 0.002) { toast('Datei enthält nur Stille'); return; }
      transcribe(mono, decoded.sampleRate);
      toast(`„${file.name}“ wird transkribiert`);
    } catch {
      showProblem(`Die Datei „${file.name}“ konnte nicht gelesen werden. Bitte eine Audiodatei wie m4a, mp3, wav oder webm wählen.`);
    } finally {
      decoder.close();
      ui.file.value = '';
    }
  });

  // ---------- Start ----------

  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || typeof WebAssembly === 'undefined') {
    ui.rec.disabled = true;
    showProblem('Dieser Browser kann nicht auf das Mikrofon zugreifen. Bitte eine aktuelle Version von Chrome, Edge, Safari oder Firefox verwenden und die App über localhost öffnen.');
  }

  renderGlossary();
  updateButtons();
  renderTimer();
  renderStatus();
})();
