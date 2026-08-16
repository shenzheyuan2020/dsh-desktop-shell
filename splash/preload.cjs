// Startup page preload: logs, status, probe, deploy, locale. No Node for the page.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshShell', {
  onLog: callback => ipcRenderer.on('backend-log', (_event, line) => callback(line)),
  onStatus: callback => ipcRenderer.on('backend-status', (_event, status) => callback(status)),
  onLocale: callback => ipcRenderer.on('locale-changed', (_event, bundle) => callback(bundle)),
  restart: () => ipcRenderer.invoke('restart-backend'),
  getSnapshot: () => ipcRenderer.invoke('get-snapshot'),
  probe: () => ipcRenderer.invoke('probe-environment'),
  deployOfficial: () => ipcRenderer.invoke('deploy-official'),
  openNodejs: () => ipcRenderer.invoke('open-nodejs'),
  openConfig: () => ipcRenderer.invoke('open-config'),
  reprobeAndStart: () => ipcRenderer.invoke('reprobe-and-start'),
  getUi: () => ipcRenderer.invoke('get-ui'),
  setLocale: locale => ipcRenderer.invoke('set-locale', locale),
});
