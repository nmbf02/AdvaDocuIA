@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "PORT=3000"

echo Abriendo el puerto %PORT% en el firewall de Windows para la red local...
netsh advfirewall firewall delete rule name="Advansys DocGen" >nul 2>&1
netsh advfirewall firewall add rule name="Advansys DocGen" dir=in action=allow protocol=TCP localport=%PORT%
if errorlevel 1 (
  echo No se pudo crear la regla. Ejecuta este archivo como administrador.
  pause
  exit /b 1
)

echo.
echo URL para tu companero:
powershell -NoProfile -Command ^
  "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { '  http://' + $_.IPAddress + ':%PORT%' }"

echo.
echo El servidor debe estar corriendo en ESTA PC. Si no abre, ejecuta INICIAR.cmd
pause
