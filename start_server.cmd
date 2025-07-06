@echo off
SETLOCAL

:: Change to the project directory (adjust if needed)
cd /d "%~dp0"

:: Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed. Skipping updates.
    goto START_SERVER
)

:: Fetch latest changes from remote
git fetch origin

:: Compare local and remote branches (replace 'main' with your branch)
git diff --quiet origin/main
if %ERRORLEVEL% equ 0 (
    echo [INFO] No updates found. Starting server...
    goto START_SERVER
) else (
    echo [INFO] Updates detected. Pulling changes...
    git pull origin main
    echo [INFO] Installing/updating dependencies...
    npm install
)

:START_SERVER
echo [INFO] Starting web server...
node server.js

ENDLOCAL