@echo off
SETLOCAL
cd /d "%~dp0"

:: Проверка и обновление Git
where git >nul 2>&1
if not errorlevel 1 (
    git rev-parse --is-inside-work-tree >nul 2>&1
    if not errorlevel 1 (
        git fetch --all --prune >nul 2>&1
        git diff --quiet origin/main >nul 2>&1
        if errorlevel 1 (
            git reset --hard origin/main >nul 2>&1
        )
    )
)

:: Проверка и установка Node.js зависимостей
where node >nul 2>&1
if errorlevel 1 exit /b 1

if exist "package.json" (
    if not exist "node_modules" (
        npm install >nul 2>&1
    )
    npm list ws >nul 2>&1
    if errorlevel 1 (
        npm install ws >nul 2>&1
    )
)

ENDLOCAL
exit /b 0