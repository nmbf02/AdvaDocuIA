@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "ROOT=%CD%"
set "LOG=%ROOT%\scripts\boot.log"
set "NODE=C:\Program Files\nodejs\node.exe"
set "TSX=%ROOT%\node_modules\tsx\dist\cli.mjs"
set "PORT=3000"

if not exist "%NODE%" (
  where node >nul 2>&1 && for /f "delims=" %%I in ('where node') do set "NODE=%%I"
)

echo [%date% %time%] inicio ROOT=%ROOT% >> "%LOG%"

if not exist "%NODE%" (
  echo [%date% %time%] ERROR: no se encontro node.exe >> "%LOG%"
  goto OPEN
)
if not exist "%TSX%" (
  echo [%date% %time%] ERROR: no se encontro tsx. Ejecuta INICIAR.cmd una vez. >> "%LOG%"
  goto OPEN
)

"%NODE%" -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
if %ERRORLEVEL%==0 (
  echo [%date% %time%] ya estaba corriendo >> "%LOG%"
  goto OPEN
)

echo [%date% %time%] arrancando servidor en segundo plano >> "%LOG%"
wscript.exe //nologo "%ROOT%\scripts\start-server-hidden.vbs" "%ROOT%" "%NODE%"

set /a n=0
:WAIT
timeout /t 2 /nobreak >nul
"%NODE%" -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
if %ERRORLEVEL%==0 (
  echo [%date% %time%] servidor listo >> "%LOG%"
  goto OPEN
)
set /a n+=1
if %n% LSS 20 goto WAIT
echo [%date% %time%] ERROR: el servidor no respondio a tiempo >> "%LOG%"

:OPEN
start "" http://localhost:%PORT%
echo [%date% %time%] navegador abierto >> "%LOG%"
endlocal
