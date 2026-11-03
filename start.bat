@echo off
title Game Night Live
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get it free at https://nodejs.org then run this again. & pause & exit /b)
if not exist node_modules (echo First run: installing... & call npm install)
echo.
echo   Wi-Fi addresses for your phones (use one of these instead of localhost, port 3000):
node -e "const o=require('os').networkInterfaces();for(const l of Object.values(o))for(const n of l)if(n.family==='IPv4'&&!n.internal)console.log('    http://'+n.address+':3000/host')"
echo.
start "" http://localhost:3000/host
call npm run dev
pause
