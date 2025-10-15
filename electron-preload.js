const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Informações da aplicação
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Diálogos
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // Eventos do menu
    onFileSelected: (callback) => ipcRenderer.on('file-selected', callback),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
    onRefreshStatus: (callback) => ipcRenderer.on('refresh-status', callback),
    onStartWSA: (callback) => ipcRenderer.on('start-wsa', callback),
    onConnectADB: (callback) => ipcRenderer.on('connect-adb', callback),
    onShowInstalledApps: (callback) => ipcRenderer.on('show-installed-apps', callback),
    
    // Remover listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // Verificar se está rodando no Electron
    isElectron: true,
    
    // Plataforma
    platform: process.platform
});