# Script para build do aplicativo Windows nativo
Write-Host "=== Build WSA APK Installer (Windows Native) ===" -ForegroundColor Magenta

$projectPath = "WSAInstaller-Windows"
$outputPath = "dist-windows"

# Verificar se o .NET SDK está instalado
Write-Host "Verificando .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = & dotnet --version
    Write-Host "✅ .NET SDK encontrado: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET SDK não encontrado!" -ForegroundColor Red
    Write-Host "Baixe e instale o .NET 8 SDK de: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

# Verificar se o projeto existe
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Pasta do projeto não encontrada: $projectPath" -ForegroundColor Red
    exit 1
}

# Entrar na pasta do projeto
Set-Location $projectPath

# Limpar builds anteriores
Write-Host "Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" }
if (Test-Path "obj") { Remove-Item -Recurse -Force "obj" }

# Restaurar dependências
Write-Host "Restaurando dependências..." -ForegroundColor Yellow
& dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao restaurar dependências" -ForegroundColor Red
    exit 1
}

# Build do projeto
Write-Host "Compilando aplicativo..." -ForegroundColor Yellow
& dotnet build --configuration Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha na compilação" -ForegroundColor Red
    exit 1
}

# Publicar aplicativo (self-contained)
Write-Host "Publicando aplicativo..." -ForegroundColor Yellow
& dotnet publish --configuration Release --runtime win-x64 --self-contained true --output "../$outputPath"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha na publicação" -ForegroundColor Red
    exit 1
}

# Voltar para pasta raiz
Set-Location ..

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host "Arquivos gerados em: $outputPath" -ForegroundColor Cyan

if (Test-Path $outputPath) {
    $files = Get-ChildItem $outputPath
    Write-Host "Arquivos criados:" -ForegroundColor White
    foreach ($file in $files) {
        if ($file.Name -eq "WSAInstaller.exe") {
            Write-Host "  🎯 $($file.Name) (executável principal)" -ForegroundColor Green
        } else {
            Write-Host "  📄 $($file.Name)" -ForegroundColor Gray
        }
    }
    
    $exePath = Join-Path $outputPath "WSAInstaller.exe"
    if (Test-Path $exePath) {
        Write-Host "`n🚀 Para executar: .\$outputPath\WSAInstaller.exe" -ForegroundColor Yellow
        
        $size = (Get-Item $exePath).Length / 1MB
        Write-Host "📏 Tamanho do executável: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
    }
}

Write-Host "`n=== Build Finalizado ===" -ForegroundColor Magenta