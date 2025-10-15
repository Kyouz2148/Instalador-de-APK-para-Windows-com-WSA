@echo off
echo WSA APK Installer - Aplicativo Windows Nativo
echo ==============================================

echo.
echo Verificando .NET Runtime...
dotnet --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERRO: .NET Runtime nao encontrado!
    echo Baixe e instale o .NET 8 Runtime de: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

echo .NET Runtime encontrado!
echo.

if not exist "WSAInstaller-Windows" (
    echo ERRO: Pasta do projeto nao encontrada!
    echo Execute este script na pasta raiz do projeto.
    pause
    exit /b 1
)

echo Compilando e executando aplicativo...
cd WSAInstaller-Windows
dotnet run --configuration Release

pause