@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo  Advansys DocGen
echo  ----------------
where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Instalarlo desde https://nodejs.org ^(LTS^) y volver a abrir este archivo.
  pause
  exit /b 1
)

if not exist "node_modules\tsx\dist\cli.mjs" (
  echo Instalando dependencias. Puede tardar unos minutos...
  call npm.cmd install
  if errorlevel 1 (
    echo Fallo npm install. En PowerShell usa: npm.cmd install
    pause
    exit /b 1
  )
)

if not exist ".env" if exist ".env.example" copy /y ".env.example" ".env" >nul

echo Abriendo http://localhost:3000
start "" http://localhost:3000
call npm.cmd run dev
pause
