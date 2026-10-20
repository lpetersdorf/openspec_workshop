// Blueforte Notes – Desktop-App (Electron)
const {
  app, BrowserWindow, protocol, ipcMain, dialog, globalShortcut, session, systemPreferences, shell
} = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SHORTCUT = 'CommandOrControl+Shift+D';
const SHORTCUT_LABEL = process.platform === 'darwin' ? '⌘⇧D' : 'Strg+Umschalt+D';
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

/** Liefert einen freien Dateinamen: "Name.md", "Name 2.md", "Name 3.md" … */
function uniquePath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  for (let i = 2; fs.existsSync(candidate); i++) candidate = path.join(dir, `${base} ${i}${ext}`);
  return candidate;
}

let win = null;
let shortcutOk = false;

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
      sandbox: true
    }
  });
  win.loadURL('app://local/index.html');
  // Externe Links im Standardbrowser öffnen
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.on('closed', () => { win = null; });
}

function showAndToggleRecording() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  win.webContents.send('toggle-recording');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

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
    const allowed = new Set(['media', 'clipboard-sanitized-write']);
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)));
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

    // ---------- Schnittstelle für die Oberfläche ----------
    ipcMain.handle('app:info', () => ({
      platform: process.platform,
      shortcut: shortcutOk ? SHORTCUT_LABEL : null,
      shortcutLabel: SHORTCUT_LABEL
    }));

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
      const settings = readSettings();
      settings.folder = result.filePaths[0];
      writeSettings(settings);
      return { path: settings.folder, exists: true };
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

    createWindow();

    try { shortcutOk = globalShortcut.register(SHORTCUT, showAndToggleRecording); } catch { shortcutOk = false; }

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
