# Script para build do aplicativo WSA APK Installer
Write-Host "=== Build WSA APK Installer ===" -ForegroundColor Magenta

# Verificar se as dependências estão instaladas
Write-Host "Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    npm install
}

# Limpar pasta de distribuição anterior
Write-Host "Limpando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Pasta dist limpa" -ForegroundColor Green
}

# Executar build
Write-Host "Iniciando build do aplicativo..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Cyan

try {
    npm run build
    
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    Write-Host "Arquivos gerados na pasta 'dist':" -ForegroundColor Cyan
    
    if (Test-Path "dist") {
        Get-ChildItem "dist" | ForEach-Object {
            Write-Host "  • $($_.Name)" -ForegroundColor White
        }
        
        # Verificar se o instalador foi criado
        $installer = Get-ChildItem "dist" -Filter "*.exe" | Where-Object { $_.Name -like "*Setup*" }
        if ($installer) {
            Write-Host "`n🎉 Instalador criado: $($installer.Name)" -ForegroundColor Green
            Write-Host "Localização: $(Resolve-Path $installer.FullName)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "❌ Erro durante o build: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Build Finalizado ===" -ForegroundColor Magenta