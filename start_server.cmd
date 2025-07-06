@echo off
SETLOCAL
cd /d "%~dp0"

:: Выполнение обновлений
call update.cmd
if errorlevel 1 (
    echo Failed to initialize dependencies
    pause
    exit /b 1
)

:: Запуск сервера
title SoundCloud Server
echo Starting server... (Press CTRL+C to stop)
node server.js

:: Остановка
echo.
echo Server stopped
pause