@echo off
title Resenha (feche esta janela para desligar)
cd /d "%~dp0"
if not exist node_modules call npm.cmd install --no-fund --no-audit
start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
