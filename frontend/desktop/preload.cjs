const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apexDesktop', {
  isElectron: true,
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
});
