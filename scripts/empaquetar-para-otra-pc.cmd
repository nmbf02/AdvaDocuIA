@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "OUT=%CD%\AdvaDocuIA-portable.zip"

echo Empaquetando el proyecto sin node_modules ni secretos...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = (Resolve-Path '%CD%').Path; $out = Join-Path $root 'AdvaDocuIA-portable.zip'; if (Test-Path $out) { Remove-Item $out -Force }; $exclude = @('node_modules','dist','.git','.vite','.cache','.env','.ai-secrets.json','AdvaDocuIA-portable.zip'); Get-ChildItem -Force $root | Where-Object { $exclude -notcontains $_.Name } | Compress-Archive -DestinationPath $out -Force; Write-Output $out"

if exist "%OUT%" (
  echo.
  echo Listo: %OUT%
  echo Pasa ese ZIP a tu companero. En su PC: extraer, instalar Node.js LTS y abrir INICIAR.cmd
) else (
  echo No se pudo crear el ZIP.
)
pause
