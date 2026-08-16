// 启动页预加载：日志、状态、探测、部署官方包。不暴露 Node。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshShell', {
  onLog: callback => ipcRenderer.on('backend-log', (_event, line) => callback(line)),
  onStatus: callback => ipcRenderer.on('backend-status', (_event, status) => callback(status)),
  restart: () => ipcRenderer.invoke('restart-backend'),
  getSnapshot: () => ipcRenderer.invoke('get-snapshot'),
  probe: () => ipcRenderer.invoke('probe-environment'),
  deployOfficial: () => ipcRenderer.invoke('deploy-official'),
  openNodejs: () => ipcRenderer.invoke('open-nodejs'),
});
