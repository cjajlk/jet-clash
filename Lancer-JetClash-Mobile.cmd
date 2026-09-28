@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node tools/serve.mjs --lan
  pause
  exit /b
)
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools/serve.mjs --lan
  pause
  exit /b
)
echo Node.js 18 ou plus recent est necessaire. Aucune dependance npm a installer.
pause
