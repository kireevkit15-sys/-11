@echo off
title DIVA Bot
cd /d "%~dp0bot"
:restart
echo [%time%] Starting bot...
npx tsx src/index.ts
echo [%time%] Bot crashed, restarting in 5s...
timeout /t 5 /nobreak
goto restart
