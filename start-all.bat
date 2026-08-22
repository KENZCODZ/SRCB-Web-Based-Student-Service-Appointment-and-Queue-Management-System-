@echo off
title EduQueue Launcher
echo ========================================================
echo   Launching EduQueue Backend and Frontend...
echo ========================================================

start "EduQueue Backend (Port 8000)" cmd /k "call start-backend.bat"
start "EduQueue Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo Servers launched!
echo Open http://localhost:5173 in your browser.
timeout /t 3 >nul
start http://localhost:5173
