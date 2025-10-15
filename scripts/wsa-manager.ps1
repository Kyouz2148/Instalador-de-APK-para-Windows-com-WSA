# Script para verificar e configurar o WSA
param(
    [string]$Action = "check"
)

function Check-WSAInstallation {
    Write-Host "Verificando instalação do WSA..." -ForegroundColor Yellow
    
    $wsaPackage = Get-AppxPackage -Name "MicrosoftCorporationII.WindowsSubsystemForAndroid" -ErrorAction SilentlyContinue
    
    if ($wsaPackage) {
        Write-Host "✅ WSA está instalado" -ForegroundColor Green
        Write-Host "Versão: $($wsaPackage.Version)" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "❌ WSA não está instalado" -ForegroundColor Red
        Write-Host "Para instalar o WSA:" -ForegroundColor Yellow
        Write-Host "1. Abra a Microsoft Store" -ForegroundColor White
        Write-Host "2. Procure por 'Amazon Appstore'" -ForegroundColor White
        Write-Host "3. Instale o Amazon Appstore (isso instalará o WSA automaticamente)" -ForegroundColor White
        return $false
    }
}

function Check-ADBInstallation {
    Write-Host "Verificando instalação do ADB..." -ForegroundColor Yellow
    
    try {
        $adbVersion = & adb version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ ADB está instalado e funcionando" -ForegroundColor Green
            return $true
        }
    } catch {
        # ADB não encontrado
    }
    
    Write-Host "❌ ADB não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "Para instalar o ADB:" -ForegroundColor Yellow
    Write-Host "1. Baixe o Android SDK Platform-Tools" -ForegroundColor White
    Write-Host "2. Extraia para uma pasta (ex: C:\platform-tools)" -ForegroundColor White
    Write-Host "3. Adicione a pasta ao PATH do sistema" -ForegroundColor White
    Write-Host "4. Ou use o comando: choco install adb (se tiver Chocolatey)" -ForegroundColor White
    return $false
}

function Check-WSARunning {
    Write-Host "Verificando se o WSA está rodando..." -ForegroundColor Yellow
    
    $wsaProcess = Get-Process -Name "WsaClient" -ErrorAction SilentlyContinue
    if ($wsaProcess) {
        Write-Host "✅ WSA está rodando" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️ WSA não está rodando" -ForegroundColor Yellow
        return $false
    }
}

function Start-WSA {
    Write-Host "Iniciando WSA..." -ForegroundColor Yellow
    
    try {
        Start-Process "shell:AppsFolder\MicrosoftCorporationII.WindowsSubsystemForAndroid_8wekyb3d8bbwe!App"
        Write-Host "✅ WSA iniciado com sucesso" -ForegroundColor Green
        Write-Host "Aguarde alguns segundos para o WSA inicializar completamente..." -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ Erro ao iniciar WSA: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Connect-WSAWithADB {
    Write-Host "Conectando ao WSA via ADB..." -ForegroundColor Yellow
    
    try {
        # Tenta conectar ao WSA
        $result = & adb connect 127.0.0.1:58526 2>&1
        
        if ($result -like "*connected*") {
            Write-Host "✅ Conectado ao WSA com sucesso" -ForegroundColor Green
            
            # Verifica dispositivos conectados
            $devices = & adb devices
            Write-Host "Dispositivos conectados:" -ForegroundColor Cyan
            Write-Host $devices -ForegroundColor White
            return $true
        } else {
            Write-Host "❌ Falha ao conectar ao WSA" -ForegroundColor Red
            Write-Host "Resultado: $result" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao conectar: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Install-APK {
    param([string]$ApkPath)
    
    if (-not (Test-Path $ApkPath)) {
        Write-Host "❌ Arquivo APK não encontrado: $ApkPath" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Instalando APK: $ApkPath" -ForegroundColor Yellow
    
    try {
        $result = & adb install $ApkPath 2>&1
        
        if ($result -like "*Success*") {
            Write-Host "✅ APK instalado com sucesso" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Falha na instalação do APK" -ForegroundColor Red
            Write-Host "Erro: $result" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Erro durante instalação: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Get-InstalledPackages {
    Write-Host "Listando pacotes instalados..." -ForegroundColor Yellow
    
    try {
        $packages = & adb shell pm list packages -3 2>&1
        
        if ($packages) {
            $packageList = $packages | Where-Object { $_ -like "package:*" } | ForEach-Object {
                $_.Replace("package:", "").Trim()
            }
            
            Write-Host "Pacotes instalados:" -ForegroundColor Green
            $packageList | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
            return $packageList
        } else {
            Write-Host "Nenhum pacote encontrado" -ForegroundColor Yellow
            return @()
        }
    } catch {
        Write-Host "❌ Erro ao listar pacotes: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

function Remove-Package {
    param([string]$PackageName)
    
    Write-Host "Removendo pacote: $PackageName" -ForegroundColor Yellow
    
    try {
        $result = & adb uninstall $PackageName 2>&1
        
        if ($result -like "*Success*") {
            Write-Host "✅ Pacote removido com sucesso" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Falha ao remover pacote" -ForegroundColor Red
            Write-Host "Erro: $result" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Erro durante remoção: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Executa a ação solicitada
switch ($Action.ToLower()) {
    "check" {
        Write-Host "=== Verificação do Sistema WSA ===" -ForegroundColor Magenta
        $wsaInstalled = Check-WSAInstallation
        $adbInstalled = Check-ADBInstallation
        $wsaRunning = Check-WSARunning
        
        Write-Host "`n=== Resumo ===" -ForegroundColor Magenta
        Write-Host "WSA Instalado: $(if($wsaInstalled){'✅'}else{'❌'})" -ForegroundColor White
        Write-Host "ADB Instalado: $(if($adbInstalled){'✅'}else{'❌'})" -ForegroundColor White
        Write-Host "WSA Rodando: $(if($wsaRunning){'✅'}else{'❌'})" -ForegroundColor White
    }
    "start" {
        Start-WSA
    }
    "connect" {
        Connect-WSAWithADB
    }
    "install" {
        if ($args[0]) {
            Install-APK $args[0]
        } else {
            Write-Host "❌ Caminho do APK não fornecido" -ForegroundColor Red
        }
    }
    "list" {
        Get-InstalledPackages
    }
    "uninstall" {
        if ($args[0]) {
            Remove-Package $args[0]
        } else {
            Write-Host "❌ Nome do pacote não fornecido" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Uso: .\wsa-manager.ps1 [check|start|connect|install|list|uninstall] [parâmetros]" -ForegroundColor Yellow
        Write-Host "Exemplos:" -ForegroundColor Cyan
        Write-Host "  .\wsa-manager.ps1 check" -ForegroundColor White
        Write-Host "  .\wsa-manager.ps1 start" -ForegroundColor White
        Write-Host "  .\wsa-manager.ps1 connect" -ForegroundColor White
        Write-Host "  .\wsa-manager.ps1 install caminho\para\app.apk" -ForegroundColor White
        Write-Host "  .\wsa-manager.ps1 list" -ForegroundColor White
        Write-Host "  .\wsa-manager.ps1 uninstall com.exemplo.app" -ForegroundColor White
    }
}