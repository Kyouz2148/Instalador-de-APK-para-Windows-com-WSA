# 🚀 WSA APK Installer - Aplicativo Desktop para Windows

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2011-green.svg)
![Electron](https://img.shields.io/badge/built%20with-Electron-47848F.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**Instalador de APKs nativo para Windows** - Aplicativo desktop desenvolvido com **Electron** que permite instalar aplicativos Android (.APK) no **Windows Subsystem for Android (WSA)** de forma simples e intuitiva.

## 📱 Recursos Principais

### 🎯 Interface Nativa do Windows
- **Aplicativo desktop completo** com menu nativo do Windows
- **Ícone na bandeja do sistema** para acesso rápido
- **Notificações do sistema** para status das instalações
- **Drag & Drop** de arquivos APK direto na interface
- **Menu de contexto** com todas as funcionalidades

### 🔧 Funcionalidades Avançadas
- **✅ Instalação automática de APKs**
- **🔍 Verificação de status do WSA** em tempo real
- **📋 Lista de aplicativos instalados** com gerenciamento
- **🗑️ Desinstalação de aplicativos** diretamente pela interface
- **🔄 Atualização de APKs** com suporte a downgrade
- **⚡ Conexão automática com ADB**
- **📊 Logs detalhados** de todas as operações

## 📋 Pré-requisitos

### Requisitos do Sistema
- **Windows 11** (versão 22000 ou superior)
- **WSA (Windows Subsystem for Android)** instalado e configurado
- **Modo Desenvolvedor** ativado no WSA
- **4GB RAM** livres (recomendado)

### Configuração do WSA
1. Instale o WSA pela Microsoft Store
2. Abra as **Configurações do WSA**
3. Ative o **Modo Desenvolvedor**
4. Anote o **endereço IP** mostrado (ex: 127.0.0.1:58526)

## 🚀 Instalação

### 📥 Download do Instalador
1. Acesse a [página de releases](https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/releases)
2. Baixe o arquivo `WSA-APK-Installer-2.0.0-Setup.exe` (71MB)
3. Execute o instalador como **Administrador**
4. Siga as instruções de instalação

## 🎮 Como Usar

### 1️⃣ Primeiro Uso
1. **Inicie o aplicativo** pelo atalho na área de trabalho
2. **Aguarde a verificação automática** do WSA e ADB
3. Se o ADB não estiver instalado, será **instalado automaticamente**

### 2️⃣ Instalando APKs

#### 🖱️ Método Drag & Drop (Recomendado)
- **Arraste o arquivo .apk** diretamente para a interface
- **Aguarde a instalação** automática
- **Confira o status** na área de logs

#### 📁 Método via Menu
- Clique em **"Arquivo" → "Instalar APK..."**
- **Selecione o arquivo .apk** desejado
- **Confirme a instalação**

### 3️⃣ Gerenciamento de Apps
- **Lista de apps**: Menu "WSA" → "Aplicativos Instalados"
- **Desinstalar**: Clique com botão direito na lista
- **Atualizar lista**: Pressione **F5**

## ⌨️ Atalhos de Teclado

- **Ctrl+O**: Abrir arquivo APK
- **Ctrl+L**: Listar aplicativos instalados
- **F5**: Atualizar status do WSA
- **F12**: DevTools (debugging)
- **Ctrl+Q**: Sair do aplicativo

## 🛠️ Para Desenvolvedores

### 🔨 Build do Projeto
```bash
# Clone o repositório
git clone https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA.git
cd Instalador-de-APK-para-Windows-com-WSA

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm start

# Gere o build de produção
npm run build
```

### 📦 Estrutura do Projeto
```
📁 Instalador APK/
├── 🎯 electron-main.js      # Processo principal do Electron
├── 🔒 electron-preload.js   # Script de preload seguro
├── 🌐 server.js             # Servidor Express integrado
├── 📄 package.json          # Configurações do projeto
├── 📁 public/               # Interface web
│   ├── 🎨 index.html        # Interface principal
│   ├── ⚡ script.js         # JavaScript frontend
│   └── 🎨 style.css         # Estilos
├── 📁 assets/               # Recursos (ícones)
└── 📁 uploads/              # Arquivos temporários
```

## 🐛 Solução de Problemas

### ❌ Problemas Comuns

#### "WSA não encontrado"
- **Verifique** se o WSA está instalado
- **Inicie o WSA** manualmente
- **Ative o modo desenvolvedor**

#### "ADB não conectado"
- **Reinicie o WSA**
- **Reabra o aplicativo**
- Verifique se o **IP do WSA** não mudou

#### "Falha na instalação do APK"
- **Verifique** se o arquivo não está corrompido
- **Tente reinstalar** com downgrade
- **Libere espaço** no dispositivo virtual

## 📈 Atualizações

### 🆕 Versão 2.0.0 (Atual)
- ✅ **Interface nativa** com Electron
- ✅ **Ícone na bandeja** do sistema
- ✅ **Notificações** do Windows
- ✅ **Menu contextual** completo
- ✅ **Instalador NSIS** profissional
- ✅ **Performance** otimizada

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

## 👨‍💻 Autor

**Alan Godois**
- 🐙 GitHub: [@Kyouz2148](https://github.com/Kyouz2148)

## ⭐ Suporte

Se este projeto foi útil:
- ⭐ **Dê uma estrela** no GitHub
- 🐛 **Reporte bugs** na aba Issues
- 💡 **Sugira melhorias** via Discussions

---

<div align="center">
  <h3>🎉 Desenvolvido com ❤️ para a comunidade Windows + Android</h3>
  <p>
    <a href="https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/stargazers">⭐ Stars</a> •
    <a href="https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/issues">🐛 Issues</a> •
    <a href="https://github.com/Kyouz2148/Instalador-de-APK-para-Windows-com-WSA/releases">📦 Releases</a>
  </p>
</div>