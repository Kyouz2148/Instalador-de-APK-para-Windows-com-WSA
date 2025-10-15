class WSAInstaller {
    constructor() {
        this.init();
        this.checkStatus();
        this.loadInstalledApps();
        this.setupEventListeners();
    }

    init() {
        this.log('Sistema inicializado', 'info');
    }

    setupEventListeners() {
        // Status buttons
        document.getElementById('start-wsa-btn').addEventListener('click', () => this.startWSA());
        document.getElementById('connect-wsa-btn').addEventListener('click', () => this.connectWSA());
        document.getElementById('refresh-status-btn').addEventListener('click', () => this.checkStatus());

        // Upload functionality
        const apkFile = document.getElementById('apk-file');
        const uploadArea = document.getElementById('upload-area');

        apkFile.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.toLowerCase().endsWith('.apk')) {
                this.handleFile(files[0]);
            } else {
                this.log('Por favor, selecione apenas arquivos APK', 'error');
            }
        });

        // Apps list
        document.getElementById('refresh-apps-btn').addEventListener('click', () => this.loadInstalledApps());

        // Logs
        document.getElementById('clear-logs-btn').addEventListener('click', () => this.clearLogs());

        // Modal
        document.getElementById('confirm-no').addEventListener('click', () => this.hideModal());
    }

    async checkStatus() {
        this.log('Verificando status do WSA...', 'info');
        this.setStatusLoading();

        try {
            const response = await fetch('/api/wsa-status');
            const status = await response.json();

            this.updateStatusDisplay(status);
            this.log(`Status: WSA ${status.installed ? 'instalado' : 'não instalado'}, ADB ${status.adbConnected ? 'conectado' : 'desconectado'}`, 'info');
        } catch (error) {
            this.log('Erro ao verificar status: ' + error.message, 'error');
            this.setStatusError();
        }
    }

    setStatusLoading() {
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach(item => {
            item.className = 'status-item';
            item.querySelector('.status-text').textContent = 'Verificando...';
            item.querySelector('.status-icon').className = 'fas fa-circle status-icon';
        });
    }

    setStatusError() {
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach(item => {
            item.className = 'status-item offline';
            item.querySelector('.status-text').textContent = 'Erro';
            item.querySelector('.status-icon').className = 'fas fa-circle status-icon offline';
        });
    }

    updateStatusDisplay(status) {
        // WSA Status
        const wsaStatus = document.getElementById('wsa-status');
        wsaStatus.className = `status-item ${status.installed ? 'online' : 'offline'}`;
        wsaStatus.querySelector('.status-text').textContent = status.installed ? 'Instalado' : 'Não instalado';
        wsaStatus.querySelector('.status-icon').className = `fas fa-circle status-icon ${status.installed ? 'online' : 'offline'}`;

        // ADB Status
        const adbStatus = document.getElementById('adb-status');
        adbStatus.className = `status-item ${status.running ? 'online' : 'offline'}`;
        adbStatus.querySelector('.status-text').textContent = status.running ? 'Disponível' : 'Não disponível';
        adbStatus.querySelector('.status-icon').className = `fas fa-circle status-icon ${status.running ? 'online' : 'offline'}`;

        // Connection Status
        const connectionStatus = document.getElementById('connection-status');
        connectionStatus.className = `status-item ${status.adbConnected ? 'online' : 'offline'}`;
        connectionStatus.querySelector('.status-text').textContent = status.adbConnected ? 'Conectado' : 'Desconectado';
        connectionStatus.querySelector('.status-icon').className = `fas fa-circle status-icon ${status.adbConnected ? 'online' : 'offline'}`;

        // Update button states
        document.getElementById('start-wsa-btn').disabled = status.installed && status.running;
        document.getElementById('connect-wsa-btn').disabled = !status.running || status.adbConnected;
    }

    async startWSA() {
        this.log('Iniciando WSA...', 'info');
        const btn = document.getElementById('start-wsa-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/start-wsa', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.log('WSA iniciado com sucesso', 'success');
                setTimeout(() => this.checkStatus(), 3000);
            } else {
                this.log('Erro ao iniciar WSA: ' + result.error, 'error');
            }
        } catch (error) {
            this.log('Erro ao iniciar WSA: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async connectWSA() {
        this.log('Conectando ao WSA via ADB...', 'info');
        const btn = document.getElementById('connect-wsa-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/connect-wsa', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.log('Conectado ao WSA com sucesso', 'success');
                this.checkStatus();
            } else {
                this.log('Erro ao conectar: ' + result.error, 'error');
            }
        } catch (error) {
            this.log('Erro ao conectar: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.apk')) {
            this.log('Arquivo inválido. Apenas arquivos APK são aceitos.', 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            this.log('Arquivo muito grande. Máximo 100MB.', 'error');
            return;
        }

        this.uploadAndInstallAPK(file);
    }

    async uploadAndInstallAPK(file) {
        this.log(`Iniciando instalação de ${file.name}...`, 'info');
        
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Enviando...';

        const formData = new FormData();
        formData.append('apkFile', file);

        try {
            const response = await fetch('/api/install-apk', {
                method: 'POST',
                body: formData
            });

            progressFill.style.width = '100%';
            progressText.textContent = 'Instalando...';

            const result = await response.json();

            if (response.ok && result.success) {
                this.log(`${file.name} instalado com sucesso!`, 'success');
                this.loadInstalledApps();
            } else {
                this.log(`Erro na instalação: ${result.error}`, 'error');
            }
        } catch (error) {
            this.log(`Erro na instalação: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                progressContainer.style.display = 'none';
                document.getElementById('apk-file').value = '';
            }, 2000);
        }
    }

    async loadInstalledApps() {
        this.log('Carregando lista de aplicativos...', 'info');
        const appsList = document.getElementById('apps-list');
        appsList.innerHTML = '<p class="loading">Carregando aplicativos...</p>';

        try {
            const response = await fetch('/api/installed-apps');
            const result = await response.json();

            if (result.success) {
                this.displayApps(result.packages);
                this.log(`${result.packages.length} aplicativos carregados`, 'info');
            } else {
                appsList.innerHTML = '<p class="loading">Erro ao carregar aplicativos</p>';
                this.log('Erro ao carregar aplicativos: ' + result.error, 'error');
            }
        } catch (error) {
            appsList.innerHTML = '<p class="loading">Erro ao carregar aplicativos</p>';
            this.log('Erro ao carregar aplicativos: ' + error.message, 'error');
        }
    }

    displayApps(packages) {
        const appsList = document.getElementById('apps-list');
        
        if (packages.length === 0) {
            appsList.innerHTML = '<p class="loading">Nenhum aplicativo Android instalado</p>';
            return;
        }

        appsList.innerHTML = packages.map(pkg => `
            <div class="app-item">
                <div class="app-info">
                    <div class="app-icon">
                        <i class="fab fa-android"></i>
                    </div>
                    <div class="app-details">
                        <h4>${this.getAppName(pkg)}</h4>
                        <p>${pkg}</p>
                    </div>
                </div>
                <div class="app-actions">
                    <button class="btn btn-danger" onclick="wsaInstaller.confirmUninstall('${pkg}')">
                        <i class="fas fa-trash"></i> Desinstalar
                    </button>
                </div>
            </div>
        `).join('');
    }

    getAppName(packageName) {
        // Extract app name from package name
        const parts = packageName.split('.');
        return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    }

    confirmUninstall(packageName) {
        const modal = document.getElementById('confirm-modal');
        const message = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('confirm-yes');

        message.textContent = `Tem certeza que deseja desinstalar ${this.getAppName(packageName)}?`;
        
        confirmBtn.onclick = () => {
            this.uninstallApp(packageName);
            this.hideModal();
        };

        modal.style.display = 'block';
    }

    hideModal() {
        document.getElementById('confirm-modal').style.display = 'none';
    }

    async uninstallApp(packageName) {
        this.log(`Desinstalando ${packageName}...`, 'info');

        try {
            const response = await fetch(`/api/uninstall-app/${encodeURIComponent(packageName)}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                this.log(`${packageName} desinstalado com sucesso`, 'success');
                this.loadInstalledApps();
            } else {
                this.log(`Erro ao desinstalar: ${result.error}`, 'error');
            }
        } catch (error) {
            this.log(`Erro ao desinstalar: ${error.message}`, 'error');
        }
    }

    log(message, type = 'info') {
        const logsContainer = document.getElementById('logs-container');
        const timestamp = new Date().toLocaleTimeString();
        const logItem = document.createElement('p');
        logItem.className = `log-item ${type}`;
        logItem.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        
        logsContainer.appendChild(logItem);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    clearLogs() {
        document.getElementById('logs-container').innerHTML = '';
        this.log('Logs limpos', 'info');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wsaInstaller = new WSAInstaller();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('confirm-modal');
    if (event.target === modal) {
        wsaInstaller.hideModal();
    }
});