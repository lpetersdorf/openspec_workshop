// Brücke für das kleine Aufnahme-Fenster: nur anzeigen und Befehle schicken.
const { contextBridge, ipcRenderer } = require('electron');

const ACTIONS = new Set(['stop', 'save', 'open', 'hide']);

contextBridge.exposeInMainWorld('bfnOverlay', {
  onState: callback => ipcRenderer.on('overlay:state', (_e, state) => callback(state)),
  onLevel: callback => ipcRenderer.on('overlay:level', (_e, level) => callback(level)),
  action: name => { if (ACTIONS.has(name)) ipcRenderer.send('overlay:action', name); }
});
