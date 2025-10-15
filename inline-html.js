const fs = require('fs');
const path = require('path');

// Função para criar HTML completo com recursos inline
function createInlineHTML() {
    const cssPath = path.join(__dirname, 'public', 'styles.css');
    const jsPath = path.join(__dirname, 'public', 'script.js');
    
    let cssContent = '';
    let jsContent = '';
    
    try {
        if (fs.existsSync(cssPath)) {
            cssContent = fs.readFileSync(cssPath, 'utf8');
        }
        if (fs.existsSync(jsPath)) {
            jsContent = fs.readFileSync(jsPath, 'utf8');
        }
    } catch (error) {
        console.error('❌ Erro ao ler recursos:', error.message);
    }
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WSA APK Installer</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
    ${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1><i class="fab fa-android"></i> WSA APK Installer</h1>
            <p>Instale aplicativos Android no Windows usando o WSA</p>
        </header>

        <!-- Status do WSA -->
        <section class="status-section">
            <h2><i class="fas fa-info-circle"></i> Status do Sistema</h2>
            <div class="status-grid">
                <div class="status-card" id="wsa-status">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>WSA Status</h3>
                    <p id="wsa-status-text">Verificando...</p>
                    <div class="loading-spinner" id="wsa-loading"></div>
                </div>
                <div class="status-card" id="adb-status">
                    <i class="fas fa-usb"></i>
                    <h3>ADB Status</h3>
                    <p id="adb-status-text">Verificando...</p>
                    <div class="loading-spinner" id="adb-loading"></div>
                </div>
            </div>
            <div class="status-actions">
                <button id="start-wsa-btn" class="btn btn-primary">
                    <i class="fas fa-play"></i> Iniciar WSA
                </button>
                <button id="connect-wsa-btn" class="btn btn-secondary">
                    <i class="fas fa-link"></i> Conectar ADB
                </button>
                <button id="refresh-status-btn" class="btn btn-info">
                    <i class="fas fa-sync"></i> Atualizar Status
                </button>
            </div>
        </section>

        <!-- Upload de APK -->
        <section class="upload-section">
            <h2><i class="fas fa-upload"></i> Instalar APK</h2>
            <div class="upload-area" id="upload-area">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Arraste um arquivo APK aqui ou clique para selecionar</p>
                <input type="file" id="apk-file" accept=".apk" hidden>
                <button id="select-file-btn" class="btn btn-primary">Selecionar APK</button>
            </div>
        </section>

        <!-- Aplicativos Instalados -->
        <section class="apps-section">
            <h2><i class="fas fa-list"></i> Aplicativos Instalados</h2>
            <div class="apps-controls">
                <button id="refresh-apps-btn" class="btn btn-info">
                    <i class="fas fa-sync"></i> Atualizar Lista
                </button>
            </div>
            <div id="apps-list" class="apps-list">
                <p>Carregando aplicativos...</p>
            </div>
        </section>

        <!-- Logs -->
        <section class="logs-section">
            <h2><i class="fas fa-terminal"></i> Logs do Sistema</h2>
            <div class="logs-controls">
                <button id="clear-logs-btn" class="btn btn-secondary">
                    <i class="fas fa-trash"></i> Limpar Logs
                </button>
            </div>
            <div id="logs" class="logs"></div>
        </section>
    </div>

    <!-- Modal de Confirmação -->
    <div id="confirmation-modal" class="modal">
        <div class="modal-content">
            <h3>Confirmação</h3>
            <p id="confirm-message"></p>
            <div class="modal-buttons">
                <button id="confirm-yes" class="btn btn-danger">Sim</button>
                <button id="confirm-no" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    </div>

    <script>
    // Definir se estamos no Electron
    window.isElectron = true;
    
    ${jsContent}
    
    // Inicializar aplicação
    document.addEventListener('DOMContentLoaded', () => {
        new WSAInstaller();
    });
    </script>
</body>
</html>`;
}

module.exports = { createInlineHTML };