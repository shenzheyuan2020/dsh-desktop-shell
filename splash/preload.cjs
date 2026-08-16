// 启动页预加载：只暴露日志流、状态流、快照与重启四个能力，不暴露任何 Node 接口。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshShell', {
  onLog: callback => ipcRenderer.on('backend-log', (_event, line) => callback(line)),
  onStatus: callback => ipcRenderer.on('backend-status', (_event, status) => callback(status)),
  restart: () => ipcRenderer.invoke('restart-backend'),
  getSnapshot: () => ipcRenderer.invoke('get-snapshot'),
});
