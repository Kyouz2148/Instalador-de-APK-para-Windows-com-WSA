@echo off
echo Iniciando WSA APK Installer (Aplicativo Desktop)
echo ================================================

echo.
echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando aplicativo Electron...
npm run electron

pause