const { app, BrowserWindow, Menu, ipcMain, dialog, shell, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configurações
const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

// Variáveis globais
let mainWindow;
let serverProcess;
let tray;

// Configurar nome da aplicação
app.setName('WSA APK Installer');

// Função para criar a janela principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: getIconPath(),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'electron-preload.js')
        },
        titleBarStyle: 'default',
        frame: true,
        show: false,
        autoHideMenuBar: false
    });

    // Configurar eventos da janela
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Mostrar notificação de inicialização
        if (Notification.isSupported()) {
            new Notification({
                title: 'WSA APK Installer',
                body: 'Aplicativo iniciado com sucesso!',
                icon: getIconPath()
            }).show();
        }
        
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Interceptar tentativas de navegação
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== `http://localhost:${PORT}`) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Aguardar servidor e carregar aplicação
    if (isDev) {
        mainWindow.loadURL(`http://localhost:${PORT}`);
    } else {
        setTimeout(() => {
            mainWindow.loadURL(`http://localhost:${PORT}`);
        }, 3000);
    }
}

// Função para iniciar servidor interno
function startServer() {
    if (serverProcess) return;

    console.log('🚀 Iniciando servidor interno...');
    
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn('node', [serverPath], {
        stdio: 'pipe',
        env: { ...process.env, PORT: PORT }
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`📡 Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`❌ Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
        console.log(`🔴 Servidor fechado com código ${code}`);
        serverProcess = null;
    });
}

// Função para parar servidor
function stopServer() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
        console.log('🔴 Servidor parado');
    }
}

// Função para obter caminho do ícone
function getIconPath() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    return fs.existsSync(iconPath) ? iconPath : null;
}

// Função para criar menu da aplicação
function createMenu() {
    const template = [
        {
            label: '📁 Arquivo',
            submenu: [
                {
                    label: '📦 Instalar APK...',
                    accelerator: 'Ctrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: 'Selecionar arquivo APK',
                            filters: [
                                { name: 'Arquivos APK', extensions: ['apk'] },
                                { name: 'Todos os arquivos', extensions: ['*'] }
                            ],
                            properties: ['openFile', 'multiSelections']
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            result.filePaths.forEach(filePath => {
                                mainWindow.webContents.send('file-selected', filePath);
                            });
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '📂 Abrir Pasta de Uploads',
                    click: () => {
                        const uploadsPath = path.join(__dirname, 'uploads');
                        shell.openPath(uploadsPath);
                    }
                },
                { type: 'separator' },
                {
                    label: '❌ Sair',
                    accelerator: 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '📱 WSA',
            submenu: [
                {
                    label: '🔄 Verificar Status',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.webContents.send('refresh-status');
                    }
                },
                {
                    label: '▶️ Iniciar WSA',
                    click: () => {
                        mainWindow.webContents.send('start-wsa');
                    }
                },
                {
                    label: '🔗 Conectar ADB',
                    click: () => {
                        mainWindow.webContents.send('connect-adb');
                    }
                },
                { type: 'separator' },
                {
                    label: '📋 Aplicativos Instalados',
                    accelerator: 'Ctrl+L',
                    click: () => {
                        mainWindow.webContents.send('show-installed-apps');
                    }
                }
            ]
        },
        {
            label: '🛠️ Ferramentas',
            submenu: [
                {
                    label: '🔍 DevTools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.openDevTools();
                    }
                },
                {
                    label: '🔄 Recarregar',
                    accelerator: 'Ctrl+R',
                    click: () => {
                        mainWindow.webContents.reload();
                    }
                },
                { type: 'separator' },
                {
                    label: '🗑️ Limpar Cache',
                    click: async () => {
                        await mainWindow.webContents.session.clearCache();
                        if (Notification.isSupported()) {
                            new Notification({
                                title: 'Cache Limpo',
                                body: 'Cache da aplicação foi limpo com sucesso!'
                            }).show();
                        }
                    }
                }
            ]
        },
        {
            label: '❓ Ajuda',
            submenu: [
                {
                    label: 'ℹ️ Sobre',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre WSA APK Installer',
                            message: 'WSA APK Installer',
                            detail: `Versão: ${app.getVersion()}\nAutor: Alan Godois\n\n🚀 Aplicativo para instalar APKs no Windows Subsystem for Android\n\n🔧 Recursos:\n• Interface nativa do Windows\n• Drag & Drop de arquivos APK\n• Notificações do sistema\n• Ícone na bandeja\n• Instalação automática`,
                            buttons: ['OK'],
                            defaultId: 0
                        });
                    }
                },
                {
                    label: '📖 Documentação',
                    click: () => {
                        shell.openExternal('https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA#readme');
                    }
                },
                {
                    label: '🐛 Reportar Bug',
                    click: () => {
                        shell.openExternal('https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/issues/new');
                    }
                },
                { type: 'separator' },
                {
                    label: '⭐ Dar Estrela no GitHub',
                    click: () => {
                        shell.openExternal('https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Função para criar tray (ícone na bandeja)
function createTray() {
    const iconPath = getIconPath();
    
    if (iconPath) {
        const icon = nativeImage.createFromPath(iconPath);
        tray = new Tray(icon.resize({ width: 16, height: 16 }));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '🏠 Mostrar WSA APK Installer',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    } else {
                        createMainWindow();
                    }
                }
            },
            { type: 'separator' },
            {
                label: '📦 Instalar APK...',
                click: async () => {
                    const result = await dialog.showOpenDialog({
                        title: 'Selecionar arquivo APK',
                        filters: [{ name: 'Arquivos APK', extensions: ['apk'] }],
                        properties: ['openFile']
                    });

                    if (!result.canceled && result.filePaths.length > 0 && mainWindow) {
                        mainWindow.webContents.send('file-selected', result.filePaths[0]);
                        mainWindow.show();
                    }
                }
            },
            {
                label: '🔄 Verificar Status WSA',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('refresh-status');
                        mainWindow.show();
                    }
                }
            },
            { type: 'separator' },
            {
                label: '❌ Sair',
                click: () => {
                    app.quit();
                }
            }
        ]);
        
        tray.setContextMenu(contextMenu);
        tray.setToolTip('WSA APK Installer - Clique duplo para abrir');
        
        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            } else {
                createMainWindow();
            }
        });
    }
}

// Eventos principais do Electron
app.whenReady().then(() => {
    createMainWindow();
    createMenu();
    createTray();
    
    if (!isDev) {
        startServer();
    }

    console.log('✅ WSA APK Installer iniciado com sucesso!');
});

app.on('window-all-closed', () => {
    // No Windows, manter app rodando mesmo com janelas fechadas (ficar no tray)
    if (process.platform !== 'darwin') {
        // Não fechar automaticamente, deixar no tray
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

app.on('before-quit', () => {
    stopServer();
});

// Manipuladores IPC
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('show-notification', async (event, options) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: options.title || 'WSA APK Installer',
            body: options.body || '',
            icon: getIconPath()
        });
        notification.show();
        return true;
    }
    return false;
});

// Manipulação de erros
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});

// Configurações de segurança
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});