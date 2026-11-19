/* Blueforte Notes – lokale Transkription mit Whisper, im Browser oder als Desktop-App. Audio verlässt das Gerät nicht. */
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

  /** Zeitmarke im Meeting-Protokoll: „12:34“, ab einer Stunde „1:02:15“. */
  function formatTimestamp(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  }

  function noteFilename(date, { meeting = false } = {}) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}${pad(date.getMinutes())} ${meeting ? 'Meeting' : 'Diktat'}.md`;
  }

  function buildNote(text, date, durationMs, { meeting = false } = {}) {
    const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const human = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${time} Uhr`;
    return [
      '---',
      `datum: ${iso}`,
      `uhrzeit: "${time}"`,
      `dauer: "${formatDuration(durationMs)}"`,
      meeting ? 'tags: [diktat, meeting]' : 'tags: [diktat]',
      '---',
      '',
      `# ${meeting ? 'Meeting' : 'Diktat'} ${human}`,
      '',
      text.trim(),
      ''
    ].join('\n');
  }

  const CLAUDE_PROMPT = 'Mach aus diesem Diktat eine kurze Notiz mit Zusammenfassung und Action Items:';
  const buildClaudePrompt = text => `${CLAUDE_PROMPT}\n\n${text.trim()}`;

  /** Zählt Wörter (für „Fertig · 12 neue Wörter“ im Aufnahme-Fenster). */
  const countWords = text => (text.trim() ? text.trim().split(/\s+/).length : 0);

  function appendText(existing, addition) {
    const add = addition.trim();
    if (!add) return existing;
    if (!existing) return add;
    return /\s$/.test(existing) ? existing + add : `${existing} ${add}`;
  }

  /** Meeting-Modus: Mikrofon = „Ich“, Systemton = „Gegenüber“. */
  const SPEAKERS = { me: 'Ich', them: 'Gegenüber' };

  /**
   * Hängt einen Abschnitt eines Sprechers an: gleicher Sprecher → an seinen Absatz,
   * neuer Sprecher → neuer Absatz mit Kennzeichnung, mit atMs (Aufnahmezeit) davor als „[12:34]“.
   * Liefert Text und letzten Sprecher.
   */
  function appendTurn(existing, speaker, addition, lastSpeaker, atMs) {
    const add = addition.trim();
    if (!add) return { text: existing, last: lastSpeaker };
    if (speaker === lastSpeaker && existing.trim()) return { text: appendText(existing, add), last: speaker };
    const stamp = typeof atMs === 'number' ? `[${formatTimestamp(atMs)}] ` : '';
    const turn = `**${stamp}${SPEAKERS[speaker]}:** ${add}`;
    return { text: existing.trim() ? `${existing.replace(/\s+$/, '')}\n\n${turn}` : turn, last: speaker };
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

  // ---------- Modelle ----------

  /** Die vier Stufen. Größen in MB aus den ONNX-Dateien auf Hugging Face (Encoder + Decoder). */
  const MODELS = {
    tiny: { label: 'Schnell', name: 'Whisper tiny', id: 'Xenova/whisper-tiny', mb: { gpu: 120, cpu: 40 } },
    base: { label: 'Standard', name: 'Whisper base', id: 'Xenova/whisper-base', mb: { gpu: 210, cpu: 80 } },
    small: { label: 'Genau', name: 'Whisper small', id: 'Xenova/whisper-small', mb: { gpu: 590, cpu: 250 }, slowOnCpu: true },
    turbo: { label: 'Sehr genau', name: 'Whisper large-v3-turbo', id: 'onnx-community/whisper-large-v3-turbo', mb: { gpuF16: 1620, gpu: 760, cpu: null }, gpuOnly: true, noTranslate: true }
  };
  const DEFAULT_MODEL = 'base';

  /** Nächstschnellere Stufe (turbo → small → base → tiny), null bei „Schnell“. */
  function fasterModel(key) {
    const keys = Object.keys(MODELS);
    const i = keys.indexOf(key);
    return i > 0 ? keys[i - 1] : null;
  }
  const DTYPE_SUFFIX = { fp32: '', fp16: '_fp16', q4: '_q4', q8: '_quantized' };

  /** Gerät und Datentypen für ein Modell auf diesem Rechner. null = hier nicht nutzbar. */
  function modelDtype(key, caps) {
    const m = MODELS[key];
    if (!m || !caps) return null;
    if (!caps.webgpu) return m.gpuOnly ? null : { device: 'wasm', dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' } };
    if (key === 'turbo') return { device: 'webgpu', dtype: { encoder_model: caps.f16 ? 'fp16' : 'q4', decoder_model_merged: 'q4' } };
    return { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } };
  }

  /** Modelldateien, die dieser Rechner lädt (für „geladen“). */
  function modelFiles(key, caps) {
    const d = modelDtype(key, caps);
    if (!d) return [];
    return [
      `${MODELS[key].id}/resolve/main/onnx/encoder_model${DTYPE_SUFFIX[d.dtype.encoder_model]}.onnx`,
      `${MODELS[key].id}/resolve/main/onnx/decoder_model_merged${DTYPE_SUFFIX[d.dtype.decoder_model_merged]}.onnx`
    ];
  }

  /** Download-Größe in MB auf diesem Rechner, null = nicht verfügbar. */
  function modelSize(key, caps) {
    const mb = MODELS[key].mb;
    if (!caps.webgpu) return mb.cpu;
    return caps.f16 && mb.gpuF16 ? mb.gpuF16 : mb.gpu;
  }

  function sizeLabel(mb) {
    return mb >= 1000 ? `${(mb / 1000).toFixed(1).replace('.', ',')} GB` : `${mb} MB`;
  }

  // Gesprochene Sprache. Die Oberfläche bleibt deutsch; 'auto' erkennt je Abschnitt (siehe whisper-worker.js).
  const LANGUAGES = {
    german: 'Deutsch', english: 'Englisch', french: 'Französisch', spanish: 'Spanisch', italian: 'Italienisch',
    auto: 'Automatisch erkennen'
  };
  const DEFAULT_LANGUAGE = 'german';
  const LANGUAGE_KEY = 'bfn-sprache';

  /** Gespeicherte Sprache, bei fehlendem oder unbekanntem Wert Deutsch. */
  function savedLanguage(storage) {
    let v = null;
    try { v = (storage || localStorage).getItem(LANGUAGE_KEY); } catch { /* privat-Modus */ }
    return Object.prototype.hasOwnProperty.call(LANGUAGES, v) ? v : DEFAULT_LANGUAGE;
  }

  // Für Tests im Browser verfügbar machen
  window.BFN = {
    applyGlossary, formatDuration, formatTimestamp, fasterModel, noteFilename, buildNote, buildClaudePrompt, appendText, countWords, appendTurn,
    rms, downsample, Segmenter, isHallucination, DEFAULT_GLOSSARY,
    MODELS, modelDtype, modelFiles, modelSize, sizeLabel, LANGUAGES, savedLanguage
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
    text: $('text'), interim: $('interim'), problem: $('problem'), backlog: $('backlogHint'),
    draft: $('draftBar'), draftInfo: $('draftInfo'), draftRestore: $('draftRestore'), draftDiscard: $('draftDiscard'),
    model: $('modelStatus'), modelBar: $('modelBar'), engine: $('engine'),
    file: $('fileInput'), translate: $('translate'),
    copy: $('copyBtn'), note: $('noteBtn'), claude: $('claudeBtn'), clear: $('clearBtn'), toast: $('toast'),
    gList: $('glossaryList'), gCount: $('glossaryCount'), gForm: $('glossaryForm'), gFrom: $('gFrom'), gTo: $('gTo'),
    folderRow: $('folderRow'), folderPath: $('folderPath'), folderBtn: $('folderBtn'), shortcutHint: $('shortcutHint'),
    modelSelect: $('modelSelect'), modelHint: $('modelHint'), translateHint: $('translateHint'),
    langSelect: $('langSelect'), langHint: $('langHint'),
    meetingBox: $('meetingBox'), meeting: $('meeting'), meetingDetails: $('meetingDetails'), consent: $('consent'), meetingUnavailable: $('meetingUnavailable')
  };

  // In der Desktop-App stellt preload.js diese Schnittstelle bereit, im Browser fehlt sie
  const desktop = window.bfnDesktop || null;
  let folder = null;
  let savedText = '';          // zuletzt gespeicherter Stand, für „ungespeicherter Text“
  let sessionStartWords = 0;   // Wörter vor der laufenden Aufnahme
  let desktopInfo = null;
  let lastSpeaker = null;      // Meeting-Modus: wer hat zuletzt gesprochen?
  let meetingContent = false;  // Text enthält Meeting-Abschnitte → Meeting-Notiz
  let meetingRecording = false;

  /** Meldet den Zustand an die Desktop-App (Menüleiste, Aufnahme-Fenster, Nachfrage beim Beenden). */
  function pushState() {
    if (!desktop) return;
    const text = ui.text.value.trim();
    desktop.sendState({
      recording,
      pending,
      dirty: !!text && text !== savedText,
      elapsedMs: totalMs(),
      meeting: meetingRecording,
      words: Math.max(0, countWords(ui.text.value) - sessionStartWords)
    });
  }

  let glossary = loadGlossary();
  let toastTimer = null;

  function toast(msg, ms = 2500) {
    ui.toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.textContent = ''; }, ms);
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
    renderNewNote();
    pushState();
    scheduleDraft();
  }

  /** „Neue Notiz“: gesperrt während Aufnahme/Transkription und wenn nichts zurückzusetzen ist. */
  function renderNewNote() {
    const nothing = !ui.text.value.trim() && totalMs() === 0;
    ui.clear.disabled = recording || pending > 0 || nothing;
  }

  // ---------- Entwurf (nur Desktop-App) ----------
  // Ungespeicherter Text wird spätestens DRAFT_MS nach einer Änderung in den App-Daten gesichert
  // und nach einem Absturz beim nächsten Start angeboten. Nach Speichern oder „Neue Notiz“ wird er gelöscht.

  const DRAFT_MS = 30000;
  let draftTimer = null;
  let draftWarned = false;     // Hinweis bei Schreibfehler nur einmal
  let draftOffer = null;       // Entwurf vom letzten Start, noch nicht beantwortet

  function scheduleDraft() {
    if (!desktop || draftTimer) return;
    draftTimer = setTimeout(writeDraft, DRAFT_MS);
  }

  async function writeDraft() {
    clearTimeout(draftTimer); draftTimer = null;
    if (!desktop || draftOffer) return;   // alten Entwurf nicht überschreiben, bevor die Person entschieden hat
    const text = ui.text.value.trim();
    if (!text || text === savedText) { desktop.clearDraft(); return; }
    let res;
    try {
      res = await desktop.saveDraft({ text: ui.text.value, meeting: meetingContent, lastSpeaker, recordedMs: totalMs() });
    } catch (err) { res = { ok: false, message: String((err && err.message) || err) }; }
    if (!res.ok && !draftWarned) {
      draftWarned = true;
      showProblem(`Der Entwurf konnte nicht gesichert werden (${res.message}). Die Aufnahme läuft weiter, den Text bitte zwischendurch als Notiz speichern.`);
    }
  }

  function dropDraft() {
    clearTimeout(draftTimer); draftTimer = null;
    if (desktop && !draftOffer) desktop.clearDraft();
  }

  function offerDraft(draft) {
    draftOffer = draft;
    const d = new Date(draft.savedAt);
    const when = isNaN(d) ? '' : ` vom ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;
    const kind = draft.meeting ? 'Meeting-Entwurf' : 'Entwurf';
    ui.draftInfo.textContent = `Ungespeicherter ${kind}${when} · ${countWords(draft.text) === 1 ? '1 Wort' : `${countWords(draft.text)} Wörter`},${formatDuration(draft.recordedMs || 0)} Aufnahme.`;
    ui.draft.hidden = false;
  }

  function closeDraftOffer() {
    draftOffer = null;
    ui.draft.hidden = true;
  }

  if (desktop) {
    ui.draftRestore.addEventListener('click', () => {
      const d = draftOffer;
      if (!d) return;
      closeDraftOffer();
      if (ui.text.value.trim()) {
        // Inzwischen neuer Text: Entwurf davor setzen, nichts überschreiben
        ui.text.value = `${d.text.trim()}\n\n${ui.text.value.trim()}`;
        meetingContent = meetingContent || !!d.meeting;
      } else {
        ui.text.value = d.text;
        meetingContent = !!d.meeting;
        lastSpeaker = d.lastSpeaker || null;
        recordedMs = Number(d.recordedMs) || 0;
        renderTimer();
      }
      toast('Entwurf wiederhergestellt');
      updateButtons();
      writeDraft();
    });
    ui.draftDiscard.addEventListener('click', () => {
      closeDraftOffer();
      desktop.clearDraft();
      updateButtons();
    });
    desktop.loadDraft().then(d => { if (d) offerDraft(d); });
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
  function downloadNote(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function markSaved() { savedText = ui.text.value.trim(); dropDraft(); pushState(); }

  function clearText() {
    ui.text.value = ''; recordedMs = 0; sessionStartWords = 0;
    lastSpeaker = null; meetingContent = false;
    ui.consent.checked = false;   // nächstes Meeting neu bestätigen
    renderTimer(); updateButtons(); dropDraft();
  }

  const NEW_NOTE_CONFIRM = 'Der Text ist noch nicht als Notiz gespeichert. Trotzdem verwerfen und neu beginnen?';

  /** Knopf „Neue Notiz“: setzt alles zurück, fragt bei ungespeichertem Text vorher nach. */
  function newNote() {
    if (recording || pending > 0) return;
    const text = ui.text.value.trim();
    if (text && text !== savedText && !window.confirm(NEW_NOTE_CONFIRM)) return;
    clearText();
    toast('Neue Notiz · Zeit steht auf 0:00');
  }

  const SAVED_HINT = '„Neue Notiz“ setzt Text und Zeit für die nächste Aufnahme zurück';

  /**
   * Speichert die Notiz: in der Desktop-App in den Notizordner, sonst als Download.
   * Aus dem Aufnahme-Fenster (fromOverlay) gibt es keinen Download; ohne Ordner zeigt das Hauptfenster einen Hinweis.
   */
  async function saveNote({ fromOverlay = false } = {}) {
    if (!ui.text.value.trim()) return { ok: false, reason: 'empty' };
    const now = new Date();
    const filename = noteFilename(now, { meeting: meetingContent });
    const content = buildNote(ui.text.value, now, totalMs(), { meeting: meetingContent });
    if (desktop && folder) {
      const res = await desktop.saveNote(filename, content);
      if (res.ok) {
        showProblem('');
        if (fromOverlay) { toast(`Gespeichert: ${res.name}`); clearText(); }
        else { toast(`Gespeichert: ${res.name} · ${SAVED_HINT}`, 6000); markSaved(); }
        return res;
      }
      if (res.reason === 'missing') {
        showProblem(`Der Notizordner „${res.folder}“ wurde nicht gefunden. Bitte über „Ordner wählen“ neu auswählen.`);
        renderFolder({ path: res.folder, exists: false });
        return res;
      }
    }
    if (fromOverlay) {
      showProblem('Zum Speichern aus dem Aufnahme-Fenster bitte zuerst über „Ordner wählen“ einen Notizordner festlegen. Der Text ist noch da.');
      return { ok: false, reason: 'no-folder' };
    }
    downloadNote(filename, content);
    toast(`Notiz gespeichert · ${SAVED_HINT}`, 6000);
    markSaved();
    return { ok: true, name: filename };
  }

  ui.note.addEventListener('click', () => saveNote());
  ui.clear.addEventListener('click', newNote);
  ui.text.addEventListener('input', updateButtons);

  // ---------- Whisper im Worker ----------

  const worker = new Worker('whisper-worker.js', { type: 'module' });
  const progress = new Map();
  let modelReady = false;
  let nextId = 1;
  let pending = 0;

  // Rückstau: ab BACKLOG_HINT wartenden Abschnitten Hinweis zeigen, erst bei 0 wieder ausblenden
  const BACKLOG_HINT = 10;
  let backlogShown = false;

  function renderBacklog() {
    if (recording && pending >= BACKLOG_HINT) backlogShown = true;
    else if (pending === 0) backlogShown = false;
    ui.backlog.hidden = !backlogShown;
    if (!backlogShown) { ui.backlog.textContent = ''; return; }
    const faster = fasterModel(activeModel);
    ui.backlog.textContent = `Die Transkription hängt hinterher (${pending} Abschnitte warten). Der Text erscheint verzögert, es geht nichts verloren.`
      + (faster ? ` Für die nächste Aufnahme besser die schnellere Stufe „${MODELS[faster].label}“ wählen.` : '');
  }

  function renderStatus() {
    renderBacklog();
    if (recording) ui.status.textContent = pending ? `Hört zu … · ${pending} in Arbeit` : 'Hört zu …';
    else ui.status.textContent = pending ? `Transkribiert (${pending}) …` : 'Bereit';
    ui.interim.textContent = pending ? (modelReady ? 'Text wird verarbeitet …' : 'Wartet auf das Modell …') : '';
    lockModelSelect();
    renderNewNote();
    pushState();
  }

  // ---------- Modellwahl ----------

  const MODEL_KEY = 'bfn-modell';
  let caps = null;              // { webgpu, f16 } vom Worker
  let activeModel = null;       // Modell, mit dem gerade transkribiert wird
  let loadingModel = null;      // Modell, das gerade lädt
  let cachedKeys = new Set();

  function savedModel() {
    try { return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
  }

  async function findCached() {
    try {
      if (typeof caches === 'undefined') return new Set();
      const cache = await caches.open('transformers-cache');
      const urls = (await cache.keys()).map(r => r.url);
      return new Set(Object.keys(MODELS).filter(k => {
        const files = modelFiles(k, caps);
        return files.length && files.every(f => urls.some(u => u.endsWith(f)));
      }));
    } catch { return new Set(); }
  }

  function renderModelSelect() {
    if (!caps) return;
    const selected = loadingModel || activeModel || savedModel();
    ui.modelSelect.innerHTML = '';
    Object.entries(MODELS).forEach(([key, m]) => {
      const opt = document.createElement('option');
      opt.value = key;
      const usable = !!modelDtype(key, caps);
      const extra = !usable ? 'nur mit Grafikkarte'
        : cachedKeys.has(key) ? 'geladen'
        : sizeLabel(modelSize(key, caps));
      opt.textContent = `${m.label} · ${m.name.replace('Whisper ', '')} · ${extra}`;
      opt.disabled = !usable;
      ui.modelSelect.append(opt);
    });
    ui.modelSelect.value = selected;
    renderModelHints();
  }

  function renderModelHints() {
    const m = MODELS[loadingModel || activeModel];
    const slow = !!(m && m.slowOnCpu && caps && !caps.webgpu);
    ui.modelHint.textContent = slow
      ? `„${m.label}“ läuft ohne Grafikkarte auf dem Prozessor und braucht deutlich länger. Für dieses Gerät sind „Schnell“ oder „Standard“ besser geeignet.`
      : '';
    ui.modelHint.hidden = !slow;
    const noTranslate = !!(m && m.noTranslate);
    if (noTranslate) ui.translate.checked = false;
    ui.translate.disabled = noTranslate;
    ui.translateHint.hidden = !noTranslate;
    ui.translateHint.textContent = noTranslate ? `„${m.label}“ übersetzt nicht. Zum Übersetzen „Standard“ oder „Genau“ wählen.` : '';
  }

  function lockModelSelect() {
    ui.modelSelect.disabled = !caps || recording || pending > 0 || !!loadingModel;
  }

  function requestModel(key) {
    const d = modelDtype(key, caps);
    if (!d) return;
    loadingModel = key;
    progress.clear();
    ui.modelBar.style.width = '0%';
    worker.postMessage({ type: 'load', key, id: MODELS[key].id, device: d.device, dtype: d.dtype });
    renderModelSelect();
    lockModelSelect();
  }

  ui.modelSelect.addEventListener('change', () => {
    const key = ui.modelSelect.value;
    if (key === activeModel || key === loadingModel) return;
    showProblem('');
    requestModel(key);
  });

  // ---------- Sprache ----------
  // Gilt ab dem nächsten Abschnitt, deshalb auch während der Aufnahme wählbar (siehe design.md).

  let language = savedLanguage();

  function renderLanguage() {
    if (!ui.langSelect.options.length) {
      Object.entries(LANGUAGES).forEach(([key, label]) => {
        const opt = document.createElement('option');
        opt.value = key; opt.textContent = label;
        ui.langSelect.append(opt);
      });
    }
    ui.langSelect.value = language;
    const auto = language === 'auto';
    ui.langHint.hidden = !auto;
    ui.langHint.textContent = auto
      ? 'Die Sprache wird je Abschnitt erkannt (Deutsch, Englisch, Französisch, Spanisch, Italienisch). Bei sehr kurzen Abschnitten kann sie danebenliegen, und die Transkription braucht etwas länger. Steht die Sprache fest, ist die feste Wahl zuverlässiger.'
      : '';
  }

  ui.langSelect.addEventListener('change', () => {
    language = Object.prototype.hasOwnProperty.call(LANGUAGES, ui.langSelect.value) ? ui.langSelect.value : DEFAULT_LANGUAGE;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* privat-Modus: nur für diese Sitzung */ }
    renderLanguage();
  });
  renderLanguage();

  function modelLabel(key) {
    const m = MODELS[key];
    return m ? `„${m.label}“ (${m.name})` : 'Modell';
  }

  worker.addEventListener('message', ({ data }) => {
    switch (data.type) {
      case 'caps': {
        caps = { webgpu: !!data.webgpu, f16: !!data.f16 };
        let key = savedModel();
        if (!modelDtype(key, caps)) key = DEFAULT_MODEL;   // z. B. „Sehr genau“ ohne Grafikkarte
        findCached().then(set => { cachedKeys = new Set([...set, ...cachedKeys]); renderModelSelect(); });
        requestModel(key);
        break;
      }
      case 'loading': {
        const mb = caps ? modelSize(data.key, caps) : null;
        const size = cachedKeys.has(data.key) || !mb ? '' : ` (ca. ${sizeLabel(mb)})`;
        ui.model.textContent = `${modelLabel(data.key)} wird geladen${size} …`;
        break;
      }
      case 'progress': {
        progress.set(data.file, { loaded: data.loaded || 0, total: data.total || 0 });
        let loaded = 0, total = 0;
        progress.forEach(p => { loaded += p.loaded; total += p.total; });
        const pct = total ? Math.min(100, Math.round(loaded / total * 100)) : 0;
        ui.model.textContent = `${modelLabel(data.key)} wird geladen: ${pct} %`;
        ui.modelBar.style.width = `${pct}%`;
        break;
      }
      case 'ready': {
        modelReady = true;
        activeModel = data.key || activeModel || DEFAULT_MODEL;
        loadingModel = null;
        cachedKeys.add(activeModel);
        try { localStorage.setItem(MODEL_KEY, activeModel); } catch { /* privat-Modus */ }
        ui.modelBar.style.width = '100%';
        ui.model.textContent = data.device === 'webgpu' ? 'Modell bereit · Grafikkarte' : 'Modell bereit · Prozessor';
        ui.engine.textContent = `${desktop ? 'Desktop' : 'Lokal'} · ${MODELS[activeModel].name}`;
        if (data.device !== 'webgpu') {
          showProblem('Dieser Browser bietet keine Grafikbeschleunigung (WebGPU). Die Transkription läuft auf dem Prozessor und dauert länger.');
        }
        renderModelSelect();
        lockModelSelect();
        renderStatus();
        break;
      }
      case 'load-error': {
        loadingModel = null;
        if (data.keptPrevious && activeModel) {
          ui.model.textContent = 'Modell bereit';
          ui.modelBar.style.width = '100%';
          showProblem(`${modelLabel(data.key)} konnte nicht geladen werden. Für den ersten Download eines Modells ist eine Internetverbindung nötig. Es bleibt bei ${modelLabel(activeModel)}.`);
        } else {
          ui.model.textContent = 'Modell nicht geladen';
          showProblem('Das Spracherkennungsmodell konnte nicht geladen werden. Für den ersten Start ist einmalig eine Internetverbindung nötig. Danach funktioniert die App auch offline.');
        }
        renderModelSelect();
        lockModelSelect();
        break;
      }
      case 'result': {
        pending = Math.max(0, pending - 1);
        const job = speakers.get(data.id);
        speakers.delete(data.id);
        if (!isHallucination(data.text)) {
          const clean = applyGlossary(data.text, glossary);
          if (job) {
            const turn = appendTurn(ui.text.value, job.speaker, clean, lastSpeaker, job.atMs);
            ui.text.value = turn.text; lastSpeaker = turn.last; meetingContent = true;
          } else {
            ui.text.value = appendText(ui.text.value, clean); lastSpeaker = null;
          }
          ui.text.scrollTop = ui.text.scrollHeight;
          updateButtons();
        }
        renderStatus();
        break;
      }
      case 'error':
        pending = Math.max(0, pending - 1);
        speakers.delete(data.id);
        // Ohne Modell steht der Hinweis zum Laden bereits da
        if (!data.modelMissing) showProblem(`Ein Abschnitt konnte nicht transkribiert werden: ${data.message}`);
        renderStatus();
        break;
    }
  });

  const speakers = new Map();   // Auftrag → { speaker, atMs } (Meeting-Modus)

  /** Schickt Audio (beliebige Rate) als 16-kHz-Mono an den Worker. */
  function transcribe(samples, sampleRate, speaker) {
    // Beginn des Abschnitts in der Aufnahmezeit, für die Zeitmarke beim Sprecherwechsel
    const atMs = Math.max(0, totalMs() - samples.length / sampleRate * 1000);
    const audio = downsample(samples, sampleRate, 16000);
    const id = nextId++;
    if (speaker) speakers.set(id, { speaker, atMs });
    pending++;
    renderStatus();
    worker.postMessage({ type: 'transcribe', id, audio, language, translate: ui.translate.checked }, [audio.buffer]);
  }

  // ---------- Aufnahme ----------

  let recording = false;
  let starting = false;
  let streams = [], ctx = null, processor = null, segmenters = null;
  let recordedMs = 0, segmentStart = 0, tick = null;

  const totalMs = () => recordedMs + (recording && segmentStart ? Date.now() - segmentStart : 0);
  const renderTimer = () => { ui.timer.textContent = formatDuration(totalMs()); };

  function setRecordingUI(on) {
    ui.rec.setAttribute('aria-pressed', String(on));
    ui.recLabel.textContent = on ? 'Stopp' : 'Aufnahme';
    ui.meeting.disabled = on || !(desktopInfo && desktopInfo.systemAudio && desktopInfo.systemAudio.ok);
    renderStatus();
  }

  const MIC_HINT = desktop
    ? 'Kein Zugriff auf das Mikrofon. Bitte in den Systemeinstellungen unter Datenschutz › Mikrofon „Blueforte Notes“ erlauben und die App neu starten.'
    : 'Kein Zugriff auf das Mikrofon. Bitte in den Browser-Einstellungen für diese Seite das Mikrofon erlauben (Schloss-Symbol in der Adresszeile) und die App über localhost öffnen.';

  const CONSENT_HINT = 'Für eine Meeting-Aufnahme bitte zuerst bestätigen, dass alle Beteiligten von der Aufnahme wissen und einverstanden sind.';

  function systemAudioHint() {
    return desktopInfo && desktopInfo.platform === 'darwin'
      ? 'Der Systemton konnte nicht aufgenommen werden. Bitte unter Systemeinstellungen › Datenschutz & Sicherheit › „Bildschirm- & Systemaudioaufnahme“ Blueforte Notes erlauben. Danach die App über das Symbol in der Menüleiste › „Beenden“ schließen und aus dem Programme-Ordner neu starten. Das Schließen des Fensters reicht nicht, die App läuft sonst im Hintergrund weiter.'
      : 'Der Systemton konnte nicht aufgenommen werden. Bitte prüfen, ob ein Lautsprecher oder Headset als Wiedergabegerät aktiv ist, und die App neu starten.';
  }

  function stopStreams(list) { list.forEach(s => s && s.getTracks().forEach(t => t.stop())); }

  /** Zeigt ein Problem und holt das Hauptfenster nach vorn (Start per Tastenkürzel oder Menü). */
  function problemInWindow(msg) {
    showProblem(msg);
    if (desktop) desktop.showWindow();
  }

  async function startRecording() {
    if (recording || starting) return;
    starting = true;
    try { await beginRecording(); } finally { starting = false; }
  }

  async function beginRecording() {
    showProblem('');
    const meeting = !!(desktop && ui.meeting.checked);
    if (meeting && !ui.consent.checked) { problemInWindow(CONSENT_HINT); ui.consent.focus(); return; }
    if (desktop && !(await desktop.ensureMic())) { problemInWindow(MIC_HINT); return; }
    let mic;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      problemInWindow(err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
        ? MIC_HINT
        : 'Kein Mikrofon gefunden. Bitte ein Mikrofon anschließen.');
      return;
    }

    // Meeting-Modus: Systemton über die Bildschirmfreigabe, nur die Tonspur wird gebraucht
    let system = null;
    if (meeting) {
      try { system = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); } catch { system = null; }
      if (system) system.getVideoTracks().forEach(t => t.stop());
      if (!system || !system.getAudioTracks().length) {
        stopStreams([mic, system]);
        problemInWindow(systemAudioHint());
        return;
      }
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    const rate = ctx.sampleRate;
    streams = [mic, system].filter(Boolean);
    // ScriptProcessorNode: veraltet, aber überall verfügbar und für diese Größe ausreichend (siehe design.md)
    if (meeting) {
      // Kanal 0 = Mikrofon („Ich“), Kanal 1 = Systemton („Gegenüber“), je eigener Segmentierer
      const merger = ctx.createChannelMerger(2);
      ctx.createMediaStreamSource(mic).connect(merger, 0, 0);
      ctx.createMediaStreamSource(system).connect(merger, 0, 1);
      processor = ctx.createScriptProcessor(4096, 2, 1);
      segmenters = { me: new Segmenter({ sampleRate: rate }), them: new Segmenter({ sampleRate: rate }) };
      processor.onaudioprocess = e => {
        if (!recording) return;
        const me = Float32Array.from(e.inputBuffer.getChannelData(0));
        const them = Float32Array.from(e.inputBuffer.getChannelData(1));
        if (desktop) desktop.sendLevel({ me: rms(me), them: rms(them) });
        segmenters.me.push(me).forEach(seg => transcribe(seg, rate, 'me'));
        segmenters.them.push(them).forEach(seg => transcribe(seg, rate, 'them'));
      };
      merger.connect(processor);
    } else {
      processor = ctx.createScriptProcessor(4096, 1, 1);
      segmenters = { solo: new Segmenter({ sampleRate: rate }) };
      processor.onaudioprocess = e => {
        if (!recording) return;
        const buf = Float32Array.from(e.inputBuffer.getChannelData(0));
        if (desktop) desktop.sendLevel(rms(buf));
        segmenters.solo.push(buf).forEach(seg => transcribe(seg, rate));
      };
      ctx.createMediaStreamSource(mic).connect(processor);
    }
    processor.connect(ctx.destination);

    meetingRecording = meeting;
    recording = true;
    segmentStart = Date.now();
    sessionStartWords = countWords(ui.text.value);
    clearInterval(tick); tick = setInterval(renderTimer, 500);
    setRecordingUI(true);
  }

  function stopRecording() {
    if (!recording) return;
    if (segmentStart) recordedMs += Date.now() - segmentStart;
    recording = false;
    segmentStart = 0;
    clearInterval(tick); renderTimer();
    if (segmenters && ctx) {
      Object.entries(segmenters).forEach(([who, seg]) => {
        const rest = seg.flush();
        if (rest) transcribe(rest, ctx.sampleRate, who === 'solo' ? undefined : who);
      });
    }
    try { processor && processor.disconnect(); } catch { /* bereits getrennt */ }
    stopStreams(streams);
    ctx && ctx.close();
    streams = []; ctx = processor = segmenters = null;
    setRecordingUI(false);
    writeDraft();   // Stand beim Stoppen sofort sichern
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

  // ---------- Desktop-App ----------

  function renderFolder(f) {
    folder = f && f.exists ? f.path : null;
    ui.folderPath.textContent = f ? f.path + (f.exists ? '' : ' (nicht gefunden)') : 'nicht gewählt, Notizen werden heruntergeladen';
  }

  if (desktop) {
    ui.folderRow.hidden = false;
    desktop.getFolder().then(f => {
      renderFolder(f);
      if (f && !f.exists) showProblem(`Der Notizordner „${f.path}“ wurde nicht gefunden. Bitte über „Ordner wählen“ neu auswählen.`);
    });
    ui.folderBtn.addEventListener('click', async () => {
      const f = await desktop.chooseFolder();
      if (f) { renderFolder(f); showProblem(''); toast('Notizordner gespeichert'); }
    });
    desktop.info().then(info => {
      desktopInfo = info;
      renderMeetingBox();
      if (!activeModel) ui.engine.textContent = 'Desktop · Whisper';
      ui.shortcutHint.textContent = info.shortcut
        ? `Tastenkürzel ${info.shortcut} startet und stoppt die Aufnahme, auch bei geschlossenem Fenster.`
        : `Das Tastenkürzel ${info.shortcutLabel} ist bereits von einem anderen Programm belegt und steht nicht zur Verfügung.`;
    });
    desktop.onToggleRecording(() => (recording ? stopRecording() : startRecording()));
    desktop.onSaveNote(async opts => desktop.noteSaved(await saveNote(opts)));
  }

  // ---------- Meeting-Modus (nur Desktop-App) ----------

  function renderMeetingBox() {
    if (!desktop || !desktopInfo) return;
    const support = desktopInfo.systemAudio || { ok: false };
    ui.meetingBox.hidden = false;
    ui.meeting.disabled = !support.ok || recording;
    if (!support.ok) ui.meeting.checked = false;
    ui.meetingUnavailable.hidden = support.ok;
    ui.meetingUnavailable.textContent = support.ok ? '' : support.reason || 'Der Meeting-Modus ist auf diesem System nicht verfügbar.';
    ui.meetingDetails.hidden = !ui.meeting.checked;
  }

  ui.meeting.addEventListener('change', () => {
    if (!ui.meeting.checked) ui.consent.checked = false;   // nächstes Meeting neu bestätigen
    showProblem('');
    renderMeetingBox();
  });
  ui.consent.addEventListener('change', () => { if (ui.consent.checked) showProblem(''); });

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
