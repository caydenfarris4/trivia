@echo off
title Game Night Live
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get it free at https://nodejs.org then run this again. & pause & exit /b)
start "" http://localhost:3000/host
node server.js
pause
