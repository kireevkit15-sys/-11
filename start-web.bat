@echo off
title DIVA Web
cd /d "%~dp0web"
:restart
echo [%time%] Starting web...
npx next dev
echo [%time%] Web crashed, restarting in 5s...
timeout /t 5 /nobreak
goto restart
