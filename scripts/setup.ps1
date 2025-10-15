# Script de instalação automática de dependências
Write-Host "=== WSA APK Installer - Setup ===" -ForegroundColor Magenta

# Verifica se o Node.js está instalado
function Check-NodeJS {
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Node.js está instalado: $nodeVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Node.js não está instalado" -ForegroundColor Red
        Write-Host "Baixe e instale Node.js de: https://nodejs.org" -ForegroundColor Yellow
        return $false
    }
}

# Verifica se o npm está instalado
function Check-NPM {
    try {
        $npmVersion = & npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ npm está instalado: $npmVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ npm não está instalado" -ForegroundColor Red
        return $false
    }
}

# Instala dependências npm
function Install-Dependencies {
    Write-Host "Instalando dependências do projeto..." -ForegroundColor Yellow
    
    try {
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependências instaladas com sucesso" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro durante instalação: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verifica/Instala ADB
function Setup-ADB {
    Write-Host "Verificando ADB..." -ForegroundColor Yellow
    
    try {
        & adb version >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ ADB já está instalado" -ForegroundColor Green
            return $true
        }
    } catch {
        # ADB não encontrado
    }
    
    Write-Host "ADB não encontrado. Opções de instalação:" -ForegroundColor Yellow
    Write-Host "1. Instalar via Chocolatey (recomendado)" -ForegroundColor Cyan
    Write-Host "2. Download manual do Android SDK Platform-Tools" -ForegroundColor Cyan
    
    # Verifica se o Chocolatey está instalado
    try {
        & choco --version >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $choice = Read-Host "Deseja instalar ADB via Chocolatey? (s/n)"
            if ($choice -eq "s" -or $choice -eq "S") {
                Write-Host "Instalando ADB via Chocolatey..." -ForegroundColor Yellow
                & choco install adb -y
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ ADB instalado com sucesso" -ForegroundColor Green
                    return $true
                }
            }
        }
    } catch {
        # Chocolatey não está instalado
    }
    
    Write-Host "Para instalar ADB manualmente:" -ForegroundColor Yellow
    Write-Host "1. Baixe Android SDK Platform-Tools de: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor White
    Write-Host "2. Extraia para C:\platform-tools" -ForegroundColor White
    Write-Host "3. Adicione C:\platform-tools ao PATH do sistema" -ForegroundColor White
    Write-Host "4. Reinicie o terminal e execute novamente" -ForegroundColor White
    
    return $false
}

# Cria pastas necessárias
function Create-Directories {
    Write-Host "Criando estrutura de pastas..." -ForegroundColor Yellow
    
    $folders = @("uploads", "public", "scripts")
    
    foreach ($folder in $folders) {
        if (-not (Test-Path $folder)) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
            Write-Host "📁 Criada pasta: $folder" -ForegroundColor Cyan
        }
    }
}

# Script principal
Write-Host "Iniciando configuração do projeto..." -ForegroundColor Cyan

# Verifica pré-requisitos
$nodeOk = Check-NodeJS
$npmOk = Check-NPM

if (-not $nodeOk -or -not $npmOk) {
    Write-Host "❌ Pré-requisitos não atendidos. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Cria estrutura de pastas
Create-Directories

# Instala dependências
$depsOk = Install-Dependencies

if (-not $depsOk) {
    Write-Host "❌ Falha na instalação das dependências" -ForegroundColor Red
    exit 1
}

# Configura ADB
Setup-ADB

Write-Host "`n=== Configuração Concluída ===" -ForegroundColor Green
Write-Host "Para iniciar o aplicativo:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host "`nPara desenvolvimento:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nAcesse: http://localhost:3000" -ForegroundColor Yellow

# Pergunta se deseja iniciar o aplicativo
$startApp = Read-Host "`nDeseja iniciar o aplicativo agora? (s/n)"
if ($startApp -eq "s" -or $startApp -eq "S") {
    Write-Host "Iniciando aplicativo..." -ForegroundColor Yellow
    & npm start
}