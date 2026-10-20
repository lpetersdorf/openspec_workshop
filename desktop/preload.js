// Schmale, sichere Brücke zwischen Oberfläche und Desktop-Funktionen (contextIsolation).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bfnDesktop', {
  info: () => ipcRenderer.invoke('app:info'),
  getFolder: () => ipcRenderer.invoke('folder:get'),
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  saveNote: (filename, content) => ipcRenderer.invoke('note:save', { filename, content }),
  ensureMic: () => ipcRenderer.invoke('mic:ensure'),
  onToggleRecording: callback => ipcRenderer.on('toggle-recording', () => callback())
});
