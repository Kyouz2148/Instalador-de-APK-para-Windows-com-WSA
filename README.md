# WSA APK Installer

Um aplicativo web moderno para instalar facilmente aplicativos Android (.apk) no Windows usando o Windows Subsystem for Android (WSA).

![WSA APK Installer](https://img.shields.io/badge/WSA-APK%20Installer-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Características

- ✅ **Interface Web Intuitiva**: Interface moderna e responsiva para upload e gerenciamento de APKs
- ✅ **Drag & Drop**: Arraste e solte arquivos APK diretamente na interface
- ✅ **Status em Tempo Real**: Monitora o status do WSA, ADB e conexão automaticamente
- ✅ **Gerenciamento de Apps**: Lista e desinstala aplicativos Android instalados
- ✅ **Logs Detalhados**: Sistema de logs em tempo real para acompanhar o processo
- ✅ **Segurança**: Validação de arquivos APK e limitação de tamanho
- ✅ **Automação**: Scripts PowerShell para automação completa do processo

## 📋 Pré-requisitos

### Sistema Operacional
- Windows 11 (versão 22000 ou superior)
- Windows 10 (versão 19041 ou superior) com suporte ao WSA

### Software Necessário
- **Node.js** (versão 16 ou superior)
- **Windows Subsystem for Android (WSA)**
- **Android Debug Bridge (ADB)**

## 🛠️ Instalação

### 1. Instalação Automática (Recomendada)

1. Clone ou baixe este repositório
2. Abra o PowerShell como Administrador
3. Navegue até a pasta do projeto
4. Execute o script de setup:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup.ps1
```

### 2. Instalação Manual

#### 2.1 Instalar Node.js
- Baixe e instale o Node.js de [nodejs.org](https://nodejs.org)

#### 2.2 Instalar WSA
- Abra a Microsoft Store
- Procure por "Amazon Appstore"
- Instale o Amazon Appstore (isso instalará o WSA automaticamente)

#### 2.3 Instalar ADB
**Opção 1: Via Chocolatey (Recomendado)**
```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar ADB
choco install adb
```

**Opção 2: Download Manual**
1. Baixe Android SDK Platform-Tools de [developer.android.com](https://developer.android.com/studio/releases/platform-tools)
2. Extraia para `C:\platform-tools`
3. Adicione `C:\platform-tools` ao PATH do sistema

#### 2.4 Instalar Dependências do Projeto
```bash
npm install
```

## 🚀 Como Usar

### 1. Iniciar o Aplicativo

```bash
# Modo produção
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```

### 2. Acessar a Interface Web
Abra seu navegador e acesse: `http://localhost:3000`

### 3. Primeira Configuração

1. **Verificar Status**: A página mostrará automaticamente o status do WSA e ADB
2. **Iniciar WSA**: Se não estiver rodando, clique em "Iniciar WSA"
3. **Conectar ADB**: Clique em "Conectar ADB" para estabelecer conexão
4. **Pronto**: Quando todos os status estiverem verdes, você pode instalar APKs

### 4. Instalar APKs

1. **Upload**: Arraste um arquivo .apk para a área de upload ou clique para selecionar
2. **Instalação**: O sistema fará upload e instalará automaticamente
3. **Verificação**: O aplicativo aparecerá na lista de apps instalados

### 5. Gerenciar Aplicativos

- **Listar**: Veja todos os aplicativos Android instalados
- **Desinstalar**: Remova aplicativos não desejados
- **Atualizar**: Atualize a lista de aplicativos

## 🔧 Scripts Utilitários

### Script WSA Manager
Execute comandos diretamente via PowerShell:

```powershell
# Verificar status do sistema
.\scripts\wsa-manager.ps1 check

# Iniciar WSA
.\scripts\wsa-manager.ps1 start

# Conectar ADB
.\scripts\wsa-manager.ps1 connect

# Instalar APK
.\scripts\wsa-manager.ps1 install "caminho\para\app.apk"

# Listar aplicativos instalados
.\scripts\wsa-manager.ps1 list

# Desinstalar aplicativo
.\scripts\wsa-manager.ps1 uninstall com.exemplo.app
```

## 📁 Estrutura do Projeto

```
WSA-APK-Installer/
├── public/                 # Interface web (frontend)
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   └── script.js          # JavaScript do frontend
├── scripts/               # Scripts PowerShell
│   ├── setup.ps1         # Script de instalação automática
│   └── wsa-manager.ps1   # Gerenciador WSA via linha de comando
├── uploads/               # Pasta temporária para uploads
├── server.js             # Servidor backend Node.js
├── package.json          # Configuração do projeto
└── README.md            # Esta documentação
```

## 🔄 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/wsa-status` | Verifica status do WSA e ADB |
| POST | `/api/connect-wsa` | Conecta ao WSA via ADB |
| POST | `/api/install-apk` | Upload e instalação de APK |
| GET | `/api/installed-apps` | Lista aplicativos instalados |
| DELETE | `/api/uninstall-app/:package` | Desinstala aplicativo |
| POST | `/api/start-wsa` | Inicia o WSA |

## 🐛 Solução de Problemas

### WSA não inicia
- Verifique se o Windows está atualizado
- Execute Windows Update
- Reinicie o computador
- Certifique-se de que a virtualização está habilitada no BIOS

### ADB não conecta
- Verifique se o WSA está rodando
- Execute: `adb kill-server && adb start-server`
- Verifique se a porta 58526 não está bloqueada

### Erro na instalação de APK
- Verifique se o arquivo é um APK válido
- Certifique-se de que há espaço suficiente no disco
- Alguns APKs podem não ser compatíveis com o WSA

### Porta 3000 já está em uso
```bash
# Use uma porta diferente
PORT=3001 npm start
```

## 🔒 Segurança

- ✅ Validação de tipo de arquivo (apenas .apk)
- ✅ Limitação de tamanho (máximo 100MB)
- ✅ Sanitização de nomes de arquivo
- ✅ Remoção automática de arquivos temporários
- ✅ Validação de entrada nos endpoints

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⭐ Suporte

Se este projeto foi útil para você, considere dar uma estrela! ⭐

## 📞 Contato

- **Autor**: Alan Godois
- **Projeto**: WSA APK Installer

---

### 📝 Notas Importantes

- Este aplicativo é para uso educacional e pessoal
- Certifique-se de ter os direitos para instalar os APKs
- O WSA tem limitações em comparação com um dispositivo Android real
- Nem todos os aplicativos Android funcionarão no WSA
- Sempre baixe APKs de fontes confiáveis

### 🔄 Atualizações Futuras

- [ ] Suporte a instalação em lote
- [ ] Backup e restauração de aplicativos
- [ ] Interface para configurações do WSA
- [ ] Suporte a sideload de Google Play Services
- [ ] Sistema de notificações
- [ ] Tema escuro/claro