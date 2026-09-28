@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:4173"
  node tools/serve.mjs
  pause
  exit /b
)
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  start "" "http://localhost:4173"
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools/serve.mjs
  pause
  exit /b
)
echo Node.js 18 ou plus recent est necessaire pour lancer le serveur local.
echo Installe Node.js puis relance ce fichier. Aucune dependance npm a installer.
pause
