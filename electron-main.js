const { app, BrowserWindow, Menu, ipcMain, dialog, shell, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Variáveis globais
let mainWindow;
let serverProcess;
let tray;
const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

// Configurações do aplicativo
app.setName('WSA APK Installer');

// Função para criar a janela principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'electron-preload.js')
        },
        titleBarStyle: 'default',
        frame: true,
        show: false // Não mostrar até estar pronto
    });

    // Eventos da janela
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevenir navegação externa
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== `http://localhost:${PORT}`) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Carregar a aplicação
    if (isDev) {
        mainWindow.loadURL(`http://localhost:${PORT}`);
    } else {
        // Em produção, esperar o servidor interno iniciar
        setTimeout(() => {
            mainWindow.loadURL(`http://localhost:${PORT}`);
        }, 2000);
    }
}

// Função para iniciar o servidor interno
function startServer() {
    if (serverProcess) return;

    console.log('Iniciando servidor interno...');
    
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn('node', [serverPath], {
        stdio: 'pipe',
        env: { ...process.env, PORT: PORT }
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
        console.log(`Servidor fechado com código ${code}`);
        serverProcess = null;
    });
}

// Função para parar o servidor
function stopServer() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
    }
}

// Função para criar o menu da aplicação
function createMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Instalar APK...',
                    accelerator: 'Ctrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: 'Selecionar arquivo APK',
                            filters: [
                                { name: 'Arquivos APK', extensions: ['apk'] },
                                { name: 'Todos os arquivos', extensions: ['*'] }
                            ],
                            properties: ['openFile']
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            // Enviar arquivo para a janela principal
                            mainWindow.webContents.send('file-selected', result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Configurações',
                    accelerator: 'Ctrl+,',
                    click: () => {
                        // Abrir modal de configurações na interface web
                        mainWindow.webContents.send('open-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'WSA',
            submenu: [
                {
                    label: 'Verificar Status',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.webContents.send('refresh-status');
                    }
                },
                {
                    label: 'Iniciar WSA',
                    click: () => {
                        mainWindow.webContents.send('start-wsa');
                    }
                },
                {
                    label: 'Conectar ADB',
                    click: () => {
                        mainWindow.webContents.send('connect-adb');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Aplicativos Instalados',
                    accelerator: 'Ctrl+L',
                    click: () => {
                        mainWindow.webContents.send('show-installed-apps');
                    }
                }
            ]
        },
        {
            label: 'Ferramentas',
            submenu: [
                {
                    label: 'Abrir DevTools',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.openDevTools();
                    }
                },
                {
                    label: 'Recarregar',
                    accelerator: 'Ctrl+R',
                    click: () => {
                        mainWindow.webContents.reload();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Abrir Pasta de Uploads',
                    click: () => {
                        const uploadsPath = path.join(__dirname, 'uploads');
                        shell.openPath(uploadsPath);
                    }
                }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre o WSA APK Installer',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre',
                            message: 'WSA APK Installer',
                            detail: `Versão: ${app.getVersion()}\nAutor: Alan Godois\n\nAplicativo para instalar APKs no Windows Subsystem for Android.`,
                            buttons: ['OK']
                        });
                    }
                },
                {
                    label: 'Documentação',
                    click: () => {
                        shell.openExternal('https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Reportar Bug',
                    click: () => {
                        shell.openExternal('https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/issues');
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
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    
    // Verificar se o ícone existe
    if (fs.existsSync(iconPath)) {
        const icon = nativeImage.createFromPath(iconPath);
        tray = new Tray(icon.resize({ width: 16, height: 16 }));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Mostrar WSA APK Installer',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Verificar Status WSA',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('refresh-status');
                        mainWindow.show();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Sair',
                click: () => {
                    app.quit();
                }
            }
        ]);
        
        tray.setContextMenu(contextMenu);
        tray.setToolTip('WSA APK Installer');
        
        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    }
}

// Eventos do Electron
app.whenReady().then(() => {
    createMainWindow();
    createMenu();
    createTray();
    
    if (!isDev) {
        startServer();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopServer();
        app.quit();
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

// IPC Events
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

// Tratar erro não capturado
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada:', reason);
});