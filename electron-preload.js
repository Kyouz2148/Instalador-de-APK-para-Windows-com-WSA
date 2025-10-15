const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Informações do app
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Diálogos
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // Notificações
    showNotification: (options) => ipcRenderer.invoke('show-notification', options),
    
    // Eventos do main process
    onFileSelected: (callback) => {
        ipcRenderer.on('file-selected', (event, filePath) => callback(filePath));
    },
    
    onRefreshStatus: (callback) => {
        ipcRenderer.on('refresh-status', () => callback());
    },
    
    onStartWSA: (callback) => {
        ipcRenderer.on('start-wsa', () => callback());
    },
    
    onConnectADB: (callback) => {
        ipcRenderer.on('connect-adb', () => callback());
    },
    
    onShowInstalledApps: (callback) => {
        ipcRenderer.on('show-installed-apps', () => callback());
    },
    
    // Remover listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// Verificar se estamos no Electron
contextBridge.exposeInMainWorld('isElectron', true);

// Informações do sistema
contextBridge.exposeInMainWorld('systemInfo', {
    platform: process.platform,
    version: process.version,
    chrome: process.versions.chrome,
    electron: process.versions.electron
});