@echo off
SETLOCAL
cd /d "%~dp0"

:: 1. Проверка Git и обновлений
where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
    git rev-parse --is-inside-work-tree >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [INFO] Checking for Git updates...
        git fetch --all --prune
        git diff --quiet origin/main
        if %ERRORLEVEL% neq 0 (
            echo [INFO] Updating repository...
            git reset --hard origin/main || (
                echo [ERROR] Failed to update repository
                goto NODE_CHECKS
            )
        )
    )
)

:: 2. Проверка Node.js и зависимостей
:NODE_CHECKS
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Download from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] package.json not found
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
) else (
    npm list ws >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [INFO] Installing missing module: ws
        npm install ws
    )
)

:: 3. Запуск сервера
echo [INFO] Starting server...
echo [INFO] Press Ctrl+C to stop
node server.js

ENDLOCAL