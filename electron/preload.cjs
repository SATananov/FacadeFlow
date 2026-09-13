const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('facadeFlowDesktop', {
  checkForUpdates: () => ipcRenderer.invoke('facadeflow:check-for-updates'),
  openUpdatePage: () => ipcRenderer.invoke('facadeflow:open-update-page'),
  downloadUpdate: (version) => ipcRenderer.invoke('facadeflow:download-update', version),
  installDownloadedUpdate: (version) => ipcRenderer.invoke('facadeflow:install-downloaded-update', version),
  showDownloadedUpdate: (version) => ipcRenderer.invoke('facadeflow:show-downloaded-update', version),
})
