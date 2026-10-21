// Schmale, sichere Brücke zwischen Oberfläche und Desktop-Funktionen (contextIsolation).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bfnDesktop', {
  info: () => ipcRenderer.invoke('app:info'),
  getFolder: () => ipcRenderer.invoke('folder:get'),
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  saveNote: (filename, content) => ipcRenderer.invoke('note:save', { filename, content }),
  ensureMic: () => ipcRenderer.invoke('mic:ensure'),
  onToggleRecording: callback => ipcRenderer.on('toggle-recording', () => callback()),
  // Menüleiste und Aufnahme-Fenster
  sendState: state => ipcRenderer.send('ui:state', state),
  sendLevel: level => ipcRenderer.send('ui:level', level),
  onSaveNote: callback => ipcRenderer.on('save-note', (_e, opts) => callback(opts || {})),
  noteSaved: result => ipcRenderer.send('ui:saved', result)
});
