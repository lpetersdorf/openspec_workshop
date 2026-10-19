/* Blueforte Notes – Version 1: Diktieren mit der Spracherkennung des Browsers */
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

  // Für Tests im Browser verfügbar machen
  window.BFN = { applyGlossary, formatDuration, noteFilename, buildNote, buildClaudePrompt, appendText, DEFAULT_GLOSSARY };

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
    ui.text.value = ''; ui.interim.textContent = ''; recordedMs = 0; renderTimer(); updateButtons();
  });
  ui.text.addEventListener('input', updateButtons);

  // ---------- Aufnahme ----------

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let wantsRecording = false;
  let recordedMs = 0;
  let segmentStart = 0;
  let tick = null;

  const totalMs = () => recordedMs + (wantsRecording && segmentStart ? Date.now() - segmentStart : 0);
  const renderTimer = () => { ui.timer.textContent = formatDuration(totalMs()); };

  function setRecordingUI(on) {
    ui.rec.setAttribute('aria-pressed', String(on));
    ui.recLabel.textContent = on ? 'Stopp' : 'Aufnahme';
    ui.status.textContent = on ? 'Hört zu …' : 'Bereit';
  }

  function startRecording() {
    showProblem('');
    wantsRecording = true;
    segmentStart = Date.now();
    setRecordingUI(true);
    clearInterval(tick); tick = setInterval(renderTimer, 500);
    try { recognition.start(); } catch { /* läuft bereits */ }
  }

  function stopRecording() {
    if (wantsRecording && segmentStart) recordedMs += Date.now() - segmentStart;
    wantsRecording = false;
    segmentStart = 0;
    clearInterval(tick); renderTimer();
    setRecordingUI(false);
    ui.interim.textContent = '';
    try { recognition.stop(); } catch { /* bereits gestoppt */ }
  }

  if (!Recognition) {
    ui.rec.disabled = true;
    showProblem('Dieser Browser unterstützt keine Spracherkennung. Bitte Chrome, Edge oder Safari verwenden.');
  } else {
    recognition = new Recognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.addEventListener('result', e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const transcript = r[0].transcript;
        if (r.isFinal) {
          ui.text.value = appendText(ui.text.value, applyGlossary(transcript, glossary));
          ui.text.scrollTop = ui.text.scrollHeight;
        } else {
          interim += transcript;
        }
      }
      ui.interim.textContent = applyGlossary(interim, glossary);
      updateButtons();
    });

    recognition.addEventListener('error', e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stopRecording();
        showProblem('Kein Zugriff auf das Mikrofon. Bitte in den Browser-Einstellungen für diese Seite das Mikrofon erlauben (Schloss-Symbol in der Adresszeile) und die App über localhost öffnen.');
      } else if (e.error === 'network') {
        stopRecording();
        showProblem('Keine Verbindung zum Erkennungsdienst des Browsers. Bitte Internetverbindung prüfen.');
      } else if (e.error === 'audio-capture') {
        stopRecording();
        showProblem('Kein Mikrofon gefunden. Bitte ein Mikrofon anschließen.');
      }
      // "no-speech" und "aborted": kein Problem, die Aufnahme startet bei "end" neu
    });

    // Die Browser-Erkennung beendet sich nach Stille selbst. Solange nicht "Stopp" geklickt wurde: neu starten.
    recognition.addEventListener('end', () => {
      ui.interim.textContent = '';
      if (wantsRecording) {
        setTimeout(() => { if (wantsRecording) { try { recognition.start(); } catch { /* läuft bereits */ } } }, 150);
      }
    });
  }

  ui.rec.addEventListener('click', () => (wantsRecording ? stopRecording() : startRecording()));

  renderGlossary();
  updateButtons();
  renderTimer();
})();
