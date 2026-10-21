// Blueforte Notes – Desktop-App (Electron)
const {
  app, BrowserWindow, protocol, ipcMain, dialog, globalShortcut, session, systemPreferences, shell,
  Tray, Menu, nativeImage, screen, Notification, desktopCapturer
} = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(__dirname, 'assets');
const SHORTCUT = 'CommandOrControl+Shift+D';
const SHORTCUT_LABEL = process.platform === 'darwin' ? '⌘⇧D' : 'Strg+Umschalt+D';
const OVERLAY_HIDE_MS = 8000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

// Eigenes, sicheres Protokoll: Modul-Worker, Mikrofon und Cache funktionieren wie im Browser
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

// ---------- Einstellungen ----------
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch { return {}; }
}
function writeSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
}
function updateSettings(patch) { writeSettings({ ...readSettings(), ...patch }); }

/** Liefert einen freien Dateinamen: "Name.md", "Name 2.md", "Name 3.md" … */
function uniquePath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  for (let i = 2; fs.existsSync(candidate); i++) candidate = path.join(dir, `${base} ${i}${ext}`);
  return candidate;
}

/**
 * Kann dieses System den Systemton aufnehmen (Meeting-Modus)?
 * Windows: Loopback. macOS: ab 14.2 über Core Audio Tap. Linux: nicht im Umfang.
 */
function systemAudioSupport() {
  if (process.env.BFN_SYSTEM_AUDIO === '1') return { ok: true };   // nur für automatische Tests
  if (process.platform === 'win32') return { ok: true };
  if (process.platform === 'darwin') {
    const [major, minor] = process.getSystemVersion().split('.').map(Number);
    if (major > 14 || (major === 14 && minor >= 2)) return { ok: true };
    return { ok: false, reason: 'Der Meeting-Modus braucht macOS 14.2 oder neuer.' };
  }
  return { ok: false, reason: 'Der Meeting-Modus ist nur unter macOS und Windows verfügbar.' };
}

let win = null;
let overlay = null;
let tray = null;
let shortcutOk = false;
let quitting = false;

// Letzter Zustand aus der Oberfläche (app.js). Das Aufnahme-Fenster zeigt nur an, was hier steht.
let state = { recording: false, pending: 0, dirty: false, elapsedMs: 0, words: 0 };
let overlayWanted = false;      // Aufnahme lief ohne aktives Hauptfenster
let overlayHideTimer = null;
let overlayMessage = '';

// ---------- Hauptfenster ----------

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 900,
    minWidth: 480,
    minHeight: 600,
    title: 'Blueforte Notes',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false   // Aufnahme läuft auch im versteckten Fenster weiter
    }
  });
  win.loadURL('app://local/index.html');
  // Externe Links im Standardbrowser öffnen
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // Schließen versteckt das Fenster nur. Beenden geht über das Menü oder Cmd+Q.
  win.on('close', e => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
    firstCloseHint();
  });
  win.on('show', hideOverlay);
  win.on('focus', hideOverlay);
  win.on('closed', () => { win = null; });
}

function showMain() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  hideOverlay();
}

function mainIsActive() {
  return !!(win && win.isVisible() && !win.isMinimized() && win.isFocused());
}

function firstCloseHint() {
  if (readSettings().closeHintShown) return;
  updateSettings({ closeHintShown: true });
  if (!Notification.isSupported()) return;
  const where = process.platform === 'darwin' ? 'in der Menüleiste' : 'im Infobereich der Taskleiste';
  new Notification({
    title: 'Blueforte Notes läuft weiter',
    body: `Die App ist jetzt ${where}. ${SHORTCUT_LABEL} startet die Aufnahme. Beenden über das Symbol.`
  }).show();
}

// ---------- Aufnahme steuern ----------

function toggleRecording() {
  if (!win) createWindow();
  win.webContents.send('toggle-recording');
}

// ---------- Symbol in der Menüleiste ----------

function trayImage(recording) {
  const file = process.platform === 'darwin'
    ? (recording ? 'trayRecTemplate.png' : 'trayTemplate.png')
    : (recording ? 'tray-win-rec.png' : 'tray-win.png');
  const img = nativeImage.createFromPath(path.join(ASSETS, file));
  if (process.platform === 'darwin') img.setTemplateImage(true);
  return img;
}

function trayMenuTemplate() {
  return [
    { id: 'toggle', label: state.recording ? 'Aufnahme beenden' : 'Aufnahme starten', accelerator: SHORTCUT, registerAccelerator: false, click: toggleRecording },
    { id: 'open', label: 'Blueforte Notes öffnen', click: showMain },
    { type: 'separator' },
    { id: 'quit', label: 'Beenden', click: () => app.quit() }
  ];
}

function updateTray() {
  if (!tray) return;
  tray.setImage(trayImage(state.recording));
  tray.setToolTip(state.recording ? 'Blueforte Notes · Aufnahme läuft' : 'Blueforte Notes');
  tray.setContextMenu(Menu.buildFromTemplate(trayMenuTemplate()));
}

function createTray() {
  tray = new Tray(trayImage(false));
  // macOS: Klick öffnet das Menü. Windows: Linksklick öffnet das Fenster, Rechtsklick das Menü.
  if (process.platform !== 'darwin') tray.on('click', showMain);
  updateTray();
}

// ---------- Aufnahme-Fenster ----------

function createOverlay() {
  overlay = new BrowserWindow({
    width: 320,
    height: 76,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,     // nimmt der gerade genutzten App nicht den Fokus
    hasShadow: false,
    title: 'Blueforte Notes · Aufnahme',
    webPreferences: {
      preload: path.join(__dirname, 'overlay-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  overlay.setAlwaysOnTop(true, 'floating');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.loadURL('app://local/overlay.html');
  overlay.webContents.on('did-finish-load', sendOverlayState);
  overlay.on('closed', () => { overlay = null; });
}

function showOverlay() {
  if (!overlay) createOverlay();
  const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const [w] = overlay.getSize();
  overlay.setPosition(Math.round(workArea.x + (workArea.width - w) / 2), workArea.y + 12);
  if (!overlay.isVisible()) overlay.showInactive();
  sendOverlayState();
}

function hideOverlay() {
  overlayWanted = false;
  overlayMessage = '';
  clearTimeout(overlayHideTimer);
  if (overlay && overlay.isVisible()) overlay.hide();
}

function scheduleOverlayHide() {
  clearTimeout(overlayHideTimer);
  overlayHideTimer = setTimeout(hideOverlay, OVERLAY_HIDE_MS);
}

function sendOverlayState() {
  if (!overlay) return;
  overlay.webContents.send('overlay:state', { ...state, message: overlayMessage, shortcut: SHORTCUT_LABEL });
}

function onStateFromUI(next) {
  const wasRecording = state.recording;
  const wasBusy = state.recording || state.pending > 0;
  state = { ...state, ...next };
  if (state.recording !== wasRecording) updateTray();

  // Aufnahme startet ohne aktives Hauptfenster → Aufnahme-Fenster zeigen
  if (state.recording && !wasRecording) {
    overlayMessage = '';
    clearTimeout(overlayHideTimer);
    if (!mainIsActive()) { overlayWanted = true; showOverlay(); }
  }
  if (overlayWanted) {
    sendOverlayState();
    const busy = state.recording || state.pending > 0;
    if (wasBusy && !busy) scheduleOverlayHide();   // „Fertig“ → nach 8 Sekunden ausblenden
  }
}

// ---------- Beenden ----------

function needsConfirm() {
  return state.recording || state.pending > 0 || state.dirty;
}

async function confirmQuit() {
  const what = state.recording ? 'Eine Aufnahme läuft noch.'
    : state.pending > 0 ? 'Die Transkription ist noch nicht fertig.'
    : 'Der Text ist noch nicht als Notiz gespeichert.';
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Beenden', 'Abbrechen'],
    defaultId: 1,
    cancelId: 1,
    message: 'Blueforte Notes beenden?',
    detail: `${what} Beim Beenden geht der Text verloren.`
  });
  if (response === 0) { quitting = true; app.quit(); }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showMain);

  app.whenReady().then(() => {
    // Dateien der App ausliefern (auch aus dem asar-Archiv)
    protocol.handle('app', async request => {
      const { pathname } = new URL(request.url);
      const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT)) return new Response('Nicht gefunden', { status: 404 });
      try {
        const data = await fs.promises.readFile(file);
        return new Response(data, { headers: { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' } });
      } catch {
        return new Response('Nicht gefunden', { status: 404 });
      }
    });

    // Mikrofon und Zwischenablage für die eigene Oberfläche erlauben
    const allowed = new Set(['media', 'clipboard-sanitized-write', 'notifications', 'display-capture']);
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)));
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

    // Meeting-Modus: Systemton über die Bildschirmfreigabe (Loopback). Die Videospur stoppt app.js sofort.
    session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        if (!sources.length) { callback({}); return; }
        callback({ video: sources[0], audio: 'loopback' });
      } catch {
        callback({});
      }
    });

    // ---------- Schnittstelle für die Oberfläche ----------
    ipcMain.handle('app:info', () => ({
      platform: process.platform,
      shortcut: shortcutOk ? SHORTCUT_LABEL : null,
      shortcutLabel: SHORTCUT_LABEL,
      systemAudio: systemAudioSupport()
    }));

    ipcMain.on('win:show', showMain);

    ipcMain.handle('folder:get', () => {
      const folder = readSettings().folder;
      return folder ? { path: folder, exists: fs.existsSync(folder) } : null;
    });

    ipcMain.handle('folder:choose', async () => {
      const result = await dialog.showOpenDialog(win, {
        title: 'Notizordner wählen',
        buttonLabel: 'Als Notizordner verwenden',
        properties: ['openDirectory', 'createDirectory']
      });
      if (result.canceled || !result.filePaths.length) return null;
      updateSettings({ folder: result.filePaths[0] });
      return { path: result.filePaths[0], exists: true };
    });

    ipcMain.handle('note:save', (_e, { filename, content }) => {
      const folder = readSettings().folder;
      if (!folder) return { ok: false, reason: 'no-folder' };
      if (!fs.existsSync(folder)) return { ok: false, reason: 'missing', folder };
      const safeName = String(filename).replace(/[\\/:*?"<>|]/g, '-');
      const target = uniquePath(folder, safeName);
      fs.writeFileSync(target, String(content), { encoding: 'utf8', flag: 'wx' }); // wx: niemals überschreiben
      return { ok: true, path: target, name: path.basename(target) };
    });

    ipcMain.handle('mic:ensure', async () => {
      if (process.platform !== 'darwin') return true;
      if (systemPreferences.getMediaAccessStatus('microphone') === 'granted') return true;
      return systemPreferences.askForMediaAccess('microphone');
    });

    // Zustand und Pegel aus der Oberfläche
    ipcMain.on('ui:state', (_e, next) => onStateFromUI(next || {}));
    ipcMain.on('ui:level', (_e, level) => {
      if (overlay && overlay.isVisible()) overlay.webContents.send('overlay:level', level);
    });
    // Ergebnis von „Speichern“ aus dem Aufnahme-Fenster
    ipcMain.on('ui:saved', (_e, res) => {
      if (res && res.ok) {
        overlayMessage = 'Im Notizordner gespeichert';
        sendOverlayState();
        scheduleOverlayHide();
      } else {
        showMain();   // ohne Notizordner: Hauptfenster mit Hinweis
      }
    });

    // Befehle aus dem Aufnahme-Fenster
    ipcMain.on('overlay:action', (_e, action) => {
      if (action === 'stop' && state.recording) toggleRecording();
      else if (action === 'save' && win) { scheduleOverlayHide(); win.webContents.send('save-note', { fromOverlay: true }); }
      else if (action === 'open') showMain();
      else if (action === 'hide') hideOverlay();
      if (action !== 'open' && action !== 'hide' && !state.recording) scheduleOverlayHide();
    });

    createWindow();
    createTray();

    // Nur für automatische Tests (BFN_DEBUG=1): Einblick in Zustand, Tray-Menü und Aufnahme-Fenster
    if (process.env.BFN_DEBUG === '1') {
      global.bfnDebug = {
        state: () => state,
        trayMenu: () => (tray ? trayMenuTemplate().filter(i => i.label).map(i => i.label) : null),
        overlayVisible: () => !!(overlay && overlay.isVisible()),
        mainVisible: () => !!(win && win.isVisible()),
        toggleRecording,
        showMain
      };
    }

    try { shortcutOk = globalShortcut.register(SHORTCUT, toggleRecording); } catch { shortcutOk = false; }

    app.on('activate', showMain);   // macOS: Klick auf das Dock-Symbol
  });

  app.on('before-quit', e => {
    if (quitting) return;
    if (needsConfirm()) { e.preventDefault(); confirmQuit(); return; }
    quitting = true;
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  // Fenster werden nur versteckt; die App läuft in der Menüleiste weiter
  app.on('window-all-closed', () => {});
}
