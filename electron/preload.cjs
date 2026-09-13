const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('facadeFlowDesktop', {
  checkForUpdates: () => ipcRenderer.invoke('facadeflow:check-for-updates'),
  openUpdatePage: () => ipcRenderer.invoke('facadeflow:open-update-page'),
})
