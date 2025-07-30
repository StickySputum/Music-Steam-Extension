@echo off
SETLOCAL
cd /d "%~dp0"

:: Запуск сервера
title SoundCloud Server
echo Starting server... (Press CTRL+C to stop)
node server.js

:: Остановка
echo.
echo Server stopped
pause