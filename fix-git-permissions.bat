@echo off
:: Self-elevation check
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges to fix Git permissions...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ========================================================
echo Fixing Git Permissions for Natura Bliss Repository...
echo ========================================================

takeown /f "%~dp0.git" /r /d y
icacls "%~dp0.git" /grant Users:(OI)(CI)(F) /T

if exist "%~dp0.git\index.lock" del /f /q "%~dp0.git\index.lock"

echo.
echo ========================================================
echo SUCCESS: Full Git permissions granted!
echo You can now run "git add ." and commit in VS Code.
echo ========================================================
timeout /t 3 >nul
