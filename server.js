const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Função para encontrar o caminho do ADB
async function getAdbPath() {
  try {
    // Tenta encontrar o ADB no PATH
    const { stdout } = await execAsync('where adb');
    return 'adb'; // Se encontrou no PATH, usa comando simples
  } catch {
    // Se não encontrou no PATH, tenta o caminho padrão do WinGet
    const wingetPath = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages', 'Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe', 'platform-tools', 'adb.exe');
    try {
      await fs.access(wingetPath);
      return `"${wingetPath}"`;
    } catch {
      throw new Error('ADB não encontrado');
    }
  }
}

let ADB_PATH = 'adb'; // Inicializa com comando padrão

// Criar diretório uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do multer para upload de APKs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        file.originalname.toLowerCase().endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos APK são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Função para verificar se o WSA está instalado e funcionando
async function checkWSAStatus() {
  try {
    // Inicializa o caminho do ADB
    try {
      ADB_PATH = await getAdbPath();
    } catch (adbError) {
      return { installed: false, running: false, adbConnected: false, error: 'ADB não encontrado' };
    }

    // Verifica se o WSA está instalado
    const { stdout: wsaCheck } = await execAsync('powershell -Command "Get-AppxPackage MicrosoftCorporationII.WindowsSubsystemForAndroid"');
    
    if (!wsaCheck.trim()) {
      return { installed: false, running: false, adbConnected: false };
    }

    // Verifica se há dispositivos conectados
    const { stdout: devices } = await execAsync(`${ADB_PATH} devices`);
    const adbConnected = devices.includes('127.0.0.1:58526') && devices.includes('device');

    return { 
      installed: true, 
      running: true, 
      adbConnected: adbConnected,
      devices: devices 
    };
  } catch (error) {
    return { 
      installed: false, 
      running: false, 
      adbConnected: false, 
      error: error.message 
    };
  }
}

// Função para conectar ao WSA via ADB
async function connectToWSA() {
  try {
    await execAsync(`${ADB_PATH} connect 127.0.0.1:58526`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para instalar APK
async function installAPK(apkPath, forceReplace = false) {
  try {
    // Primeiro tenta instalação normal
    let command = `${ADB_PATH} install "${apkPath}"`;
    
    // Se forceReplace for true, usa -r (replace) e -d (allow downgrade)
    if (forceReplace) {
      command = `${ADB_PATH} install -r -d "${apkPath}"`;
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.includes('INSTALL_FAILED')) {
      // Se falhou e não era com force, tenta com force
      if (!forceReplace && (stderr.includes('VERSION_DOWNGRADE') || stderr.includes('ALREADY_EXISTS'))) {
        return await installAPK(apkPath, true);
      }
      throw new Error(stderr);
    }
    
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para listar aplicativos instalados
async function listInstalledApps() {
  try {
    const { stdout } = await execAsync(`${ADB_PATH} shell pm list packages -3`);
    const packages = stdout.split('\n')
      .filter(line => line.startsWith('package:'))
      .map(line => line.replace('package:', '').trim())
      .filter(pkg => pkg);
    
    return { success: true, packages };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para desinstalar aplicativo
async function uninstallApp(packageName) {
  try {
    const { stdout } = await execAsync(`${ADB_PATH} uninstall ${packageName}`);
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Rotas da API

// Status do WSA
app.get('/api/wsa-status', async (req, res) => {
  const status = await checkWSAStatus();
  res.json(status);
});

// Conectar ao WSA
app.post('/api/connect-wsa', async (req, res) => {
  const result = await connectToWSA();
  res.json(result);
});

// Upload e instalação de APK
app.post('/api/install-apk', upload.single('apkFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo APK foi enviado' });
  }

  try {
    // Verifica o status do WSA primeiro
    const wsaStatus = await checkWSAStatus();
    if (!wsaStatus.adbConnected) {
      // Tenta conectar
      await connectToWSA();
    }

    // Instala o APK
    const result = await installAPK(req.file.path);
    
    // Remove o arquivo temporário
    await fs.unlink(req.file.path);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'APK instalado com sucesso!',
        filename: req.file.originalname
      });
    } else {
      res.status(500).json({ 
        error: 'Falha na instalação: ' + result.error 
      });
    }
  } catch (error) {
    // Remove o arquivo em caso de erro
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// Listar aplicativos instalados
app.get('/api/installed-apps', async (req, res) => {
  const result = await listInstalledApps();
  res.json(result);
});

// Desinstalar aplicativo
app.delete('/api/uninstall-app/:packageName', async (req, res) => {
  const { packageName } = req.params;
  const result = await uninstallApp(packageName);
  res.json(result);
});

// Inicializar aplicativo WSA
app.post('/api/start-wsa', async (req, res) => {
  try {
    await execAsync('powershell -Command "Start-Process shell:AppsFolder\\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App"');
    res.json({ success: true, message: 'WSA iniciado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros do multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 100MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('WSA APK Installer iniciado com sucesso!');
});