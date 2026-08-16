// Startup page preload: logs, status, probe, deploy, locale. No Node for the page.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshShell', {
  onLog: callback => ipcRenderer.on('backend-log', (_event, line) => callback(line)),
  onStatus: callback => ipcRenderer.on('backend-status', (_event, status) => callback(status)),
  onLocale: callback => ipcRenderer.on('locale-changed', (_event, bundle) => callback(bundle)),
  onProbe: callback => ipcRenderer.on('probe-updated', (_event, probe) => callback(probe)),
  onIdentity: callback => ipcRenderer.on('identity-updated', (_event, identity) => callback(identity)),
  restart: () => ipcRenderer.invoke('restart-backend'),
  getSnapshot: () => ipcRenderer.invoke('get-snapshot'),
  probe: () => ipcRenderer.invoke('probe-environment'),
  deployOfficial: () => ipcRenderer.invoke('deploy-official'),
  pickHarness: () => ipcRenderer.invoke('pick-harness'),
  openNodejs: () => ipcRenderer.invoke('open-nodejs'),
  openConfig: () => ipcRenderer.invoke('open-config'),
  reprobeAndStart: () => ipcRenderer.invoke('reprobe-and-start'),
  getUi: () => ipcRenderer.invoke('get-ui'),
  getIdentity: () => ipcRenderer.invoke('get-identity'),
  setLocale: locale => ipcRenderer.invoke('set-locale', locale),
});
