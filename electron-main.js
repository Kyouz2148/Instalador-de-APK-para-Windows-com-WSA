const { app, BrowserWindow, Menu, ipcMain, dialog, shell, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configurações
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 3000;

// Variáveis globais
let mainWindow;
let serverProcess;
let tray;

// Configurar nome da aplicação
app.setName('WSA APK Installer');

// Função para carregar página de erro
async function loadErrorPage() {
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Erro - WSA APK Installer</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }
            .container { max-width: 500px; padding: 40px; }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
            p { font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; }
            button { 
                background: #fff; 
                color: #667eea; 
                border: none; 
                padding: 15px 30px; 
                font-size: 1.1em; 
                border-radius: 25px; 
                cursor: pointer;
                font-weight: bold;
                margin: 10px;
            }
            button:hover { background: #f0f0f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔧 Iniciando...</h1>
            <p>O WSA APK Installer está carregando. Se esta tela persistir, tente fechar e abrir novamente o aplicativo.</p>
            <button onclick="window.location.reload()">🔄 Recarregar</button>
            <button onclick="window.close()">❌ Fechar</button>
        </div>
    </body>
    </html>
    `;
    
    await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
}

// Função para carregar aplicação com retry
async function loadAppWithRetry() {
    const maxRetries = 10;
    let currentRetry = 0;
    
    while (currentRetry < maxRetries) {
        try {
            console.log(`🔄 Tentativa ${currentRetry + 1}/${maxRetries} de conectar ao servidor...`);
            
            // Testar se o servidor está respondendo
            const response = await fetch(`http://localhost:${PORT}/api/wsa-status`).catch(() => null);
            
            if (response && response.ok) {
                console.log('✅ Servidor respondendo! Carregando aplicação...');
                await mainWindow.loadURL(`http://localhost:${PORT}`);
                console.log('✅ Aplicação carregada com sucesso!');
                return;
            }
        } catch (error) {
            console.log(`❌ Tentativa ${currentRetry + 1} falhou:`, error.message);
        }
        
        currentRetry++;
        if (currentRetry < maxRetries) {
            console.log(`⏳ Aguardando 1 segundo antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.error('❌ Falha ao conectar ao servidor após todas as tentativas');
    
    // Tentar carregar arquivo local diretamente como fallback
    console.log('🔄 Tentando carregar arquivo local como fallback...');
    try {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log('📄 Carregando index.html diretamente...');
            await mainWindow.loadFile(indexPath);
            console.log('✅ Aplicação carregada diretamente!');
            return;
        } else {
            console.error('❌ Arquivo index.html não encontrado!');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar arquivo local:', error.message);
    }
    
    // Carregar página de erro local
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Erro - WSA APK Installer</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }
            .container { max-width: 500px; padding: 40px; }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
            p { font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; }
            button { 
                background: #fff; 
                color: #667eea; 
                border: none; 
                padding: 15px 30px; 
                font-size: 1.1em; 
                border-radius: 25px; 
                cursor: pointer;
                font-weight: bold;
            }
            button:hover { background: #f0f0f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔧 Servidor Iniciando...</h1>
            <p>O servidor interno está iniciando. Aguarde alguns segundos e clique em recarregar.</p>
            <button onclick="window.location.reload()">🔄 Recarregar</button>
        </div>
    </body>
    </html>
    `;
    
    await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
}

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

    // Carregar aplicação diretamente do arquivo local
    loadAppDirectly();
}

// Função para carregar aplicação diretamente
async function loadAppDirectly() {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log(`📄 Carregando arquivo local: ${indexPath}`);
    
    if (fs.existsSync(indexPath)) {
        try {
            await mainWindow.loadFile(indexPath);
            console.log('✅ Aplicação carregada diretamente do arquivo!');
        } catch (error) {
            console.error('❌ Erro ao carregar arquivo local:', error.message);
            await loadErrorPage();
        }
    } else {
        console.error('❌ Arquivo index.html não encontrado!');
        await loadErrorPage();
    }
}

// Função para iniciar servidor interno
function startServer() {
    if (serverProcess) {
        console.log('🔄 Servidor já está rodando');
        return Promise.resolve();
    }

    console.log('🚀 Iniciando servidor interno...');
    
    // Verificar se os arquivos necessários existem
    const serverPath = path.join(__dirname, 'server.js');
    const publicPath = path.join(__dirname, 'public');
    
    console.log(`🔍 Verificando arquivos necessários...`);
    console.log(`📄 Server.js existe: ${fs.existsSync(serverPath)}`);
    console.log(`📁 Pasta public existe: ${fs.existsSync(publicPath)}`);
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ Arquivo server.js não encontrado!');
        return Promise.reject(new Error('Arquivo server.js não encontrado'));
    }
    
    if (!fs.existsSync(publicPath)) {
        console.error('❌ Pasta public não encontrada!');
        return Promise.reject(new Error('Pasta public não encontrada'));
    }
    
    return new Promise((resolve, reject) => {
        const serverPath = path.join(__dirname, 'server.js');
        
        // Configuração diferente para produção vs desenvolvimento
        const spawnOptions = {
            stdio: 'pipe',
            env: { 
                ...process.env, 
                PORT: PORT,
                NODE_ENV: isDev ? 'development' : 'production'
            },
            cwd: __dirname
        };
        
        // Em produção, pode precisar de um shell
        if (!isDev && process.platform === 'win32') {
            spawnOptions.shell = true;
        }
        
        console.log(`🚀 Iniciando servidor em modo: ${isDev ? 'desenvolvimento' : 'produção'}`);
        console.log(`📁 Caminho do servidor: ${serverPath}`);
        console.log(`📂 Diretório de trabalho: ${__dirname}`);
        
        serverProcess = spawn('node', [serverPath], spawnOptions);

        let serverStarted = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`📡 Server: ${output}`);
            
            // Verifica se o servidor iniciou com sucesso
            if (output.includes('Servidor rodando') || output.includes(`localhost:${PORT}`)) {
                if (!serverStarted) {
                    serverStarted = true;
                    console.log('✅ Servidor iniciado com sucesso!');
                    resolve();
                }
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.error(`❌ Server Error: ${error}`);
            
            // Se for erro crítico, rejeita a promise
            if (error.includes('EADDRINUSE') || error.includes('listen EADDRINUSE')) {
                console.error('🔴 Porta já está em uso!');
                if (!serverStarted) {
                    reject(new Error(`Porta ${PORT} já está em uso`));
                }
            }
        });

        serverProcess.on('close', (code) => {
            console.log(`🔴 Servidor fechado com código ${code}`);
            serverProcess = null;
            if (!serverStarted) {
                reject(new Error(`Servidor falhou ao iniciar, código: ${code}`));
            }
        });

        // Timeout de 10 segundos para inicialização
        setTimeout(() => {
            if (!serverStarted) {
                console.error('⏰ Timeout: Servidor demorou muito para iniciar');
                reject(new Error('Timeout na inicialização do servidor'));
            }
        }, 10000);
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
app.whenReady().then(async () => {
    createMainWindow();
    createMenu();
    createTray();
    
    try {
        // Iniciar servidor (tanto em dev quanto produção)
        console.log('🔄 Aguardando servidor iniciar...');
        await startServer();
        console.log('✅ Servidor iniciado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error.message);
        // Continua mesmo se o servidor falhar
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