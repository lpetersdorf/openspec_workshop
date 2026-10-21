/* Blueforte Notes – kleines Aufnahme-Fenster. Zeigt nur an, was die Desktop-App schickt. */
(() => {
  'use strict';
  const api = window.bfnOverlay;
  if (!api) return;   // nur in der Desktop-App

  const $ = id => document.getElementById(id);
  const ui = { pill: $('pill'), status: $('status'), time: $('time'), level: $('level'), stop: $('stop'), save: $('save'), open: $('open') };

  let current = { recording: false, pending: 0, elapsedMs: 0, words: 0, message: '' };
  let receivedAt = Date.now();
  let tick = null;

  const pad = n => String(n).padStart(2, '0');
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  const wordsLabel = n => (n === 1 ? '1 neues Wort' : `${n} neue Wörter`);

  function renderTime() {
    const ms = current.recording ? current.elapsedMs + (Date.now() - receivedAt) : current.elapsedMs;
    ui.time.textContent = fmt(ms);
  }

  function render() {
    const s = current;
    ui.pill.classList.toggle('rec', s.recording);
    if (s.recording) {
      ui.status.textContent = s.pending ? `Hört zu … · ${s.pending} in Arbeit` : 'Hört zu …';
    } else if (s.pending) {
      ui.status.textContent = 'Transkribiert …';
    } else if (s.message) {
      ui.status.textContent = s.message;
    } else {
      ui.status.textContent = s.words > 0 ? `Fertig · ${wordsLabel(s.words)}` : 'Fertig · kein neuer Text';
    }
    const done = !s.recording && !s.pending;
    ui.stop.hidden = !s.recording;
    ui.save.hidden = !done || !s.dirty || !!s.message;
    if (!s.recording) ui.level.style.width = '0%';
    ui.time.hidden = done;
    clearInterval(tick);
    if (s.recording) tick = setInterval(renderTime, 250);
    renderTime();
  }

  api.onState(state => { current = state; receivedAt = Date.now(); render(); });
  api.onLevel(level => {
    // Effektivwert → gut sichtbare Skala (Sprache liegt meist zwischen 0,01 und 0,2)
    const pct = Math.min(100, Math.round(Math.sqrt(Math.max(0, level) / 0.2) * 100));
    ui.level.style.width = `${pct}%`;
  });

  ui.stop.addEventListener('click', () => api.action('stop'));
  ui.save.addEventListener('click', () => api.action('save'));
  ui.open.addEventListener('click', () => api.action('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') api.action('hide'); });

  render();
})();
