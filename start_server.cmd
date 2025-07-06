@echo off
SETLOCAL

:: Change to the project directory
cd /d "%~dp0"

:: Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed. Skipping updates.
    goto START_SERVER
)

:: Check if current dir is a Git repo
git rev-parse --is-inside-work-tree >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] This is not a Git repository. Skipping updates.
    goto START_SERVER
)

:: Fetch all changes (--all to update all branches/tags)
echo [INFO] Checking for updates...
git fetch --all --prune

:: Compare local and remote (replace 'main' with your branch)
git diff --quiet origin/main
if %ERRORLEVEL% equ 0 (
    echo [INFO] Repository is up-to-date.
    goto CHECK_INTEGRITY
)

:: Force update (download missing/changed files)
echo [INFO] Downloading updates...
git reset --hard origin/main
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to update repository.
    goto START_SERVER
)

:CHECK_INTEGRITY
:: Verify files (optional, for critical projects)
echo [INFO] Verifying files...
git fsck
if %ERRORLEVEL% neq 0 (
    echo [WARN] Repository integrity check failed (corrupted files?). Trying to recover...
    git checkout --force origin/main
)

:: Install dependencies (if package.json exists)
if exist "package.json" (
    echo [INFO] Installing npm dependencies...
    npm install
)

:START_SERVER
echo [INFO] Starting web server...
node server.js

ENDLOCAL