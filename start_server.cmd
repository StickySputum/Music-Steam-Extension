@echo off
SETLOCAL

:: Change to the project directory
cd /d "%~dp0"

:: ===== Git Checks =====
:: Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed. Skipping updates.
    goto NODE_CHECKS
)

:: Check if current dir is a Git repo
git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] This is not a Git repository. Skipping updates.
    goto NODE_CHECKS
)

:: Fetch all changes
echo [INFO] Checking for repository updates...
git fetch --all --prune

:: Compare local and remote branches
git diff --quiet origin/main
if %ERRORLEVEL% equ 0 (
    echo [INFO] Repository is up-to-date.
    goto NODE_CHECKS
)

:: Force update
echo [INFO] Downloading updates...
git reset --hard origin/main
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to update repository.
    goto NODE_CHECKS
)

:: Verify repository integrity
echo [INFO] Verifying repository integrity...
git fsck
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Repository integrity issues detected. Attempting recovery...
    git checkout --force origin/main
)

:: ===== Node.js Checks =====
:NODE_CHECKS
:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Download from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for package.json
if not exist "package.json" (
    echo [ERROR] package.json not found! Cannot install dependencies.
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    npm install
)

:: Check for critical modules (example: ws)
npm list ws >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Required module 'ws' not found. Installing...
    npm install ws
)

:: ===== Server Startup =====
:START_SERVER
echo [INFO] Starting web server...

:: Option 1: Run in current window (console will stay open)
:: node server.js

:: Option 2: Run in new window (recommended - console won't close)
start "SoundCloud Server" cmd /c "node server.js & pause"

:: Option 3: For production (using PM2 - install first: npm install -g pm2)
:: pm2 start server.js --name "SoundCloud-Server"

ENDLOCAL