@echo off
title EduQueue Backend API Server (Port 8000)
echo ========================================================
echo   Starting EduQueue PHP Backend API on port 8000...
echo ========================================================

:: Check if php is in system PATH
where php >nul 2>nul
if %errorlevel% equ 0 (
    php -S localhost:8000 -t backend/public backend/public/index.php
    goto end
)

:: Check Laragon PHP 8.3
if exist "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" (
    echo Using Laragon PHP 8.3...
    "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" -S localhost:8000 -t backend/public backend/public/index.php
    goto end
)

:: Check any Laragon PHP version
for /d %%D in ("C:\laragon\bin\php\*") do (
    if exist "%%D\php.exe" (
        echo Using Laragon PHP from %%D...
        "%%D\php.exe" -S localhost:8000 -t backend/public backend/public/index.php
        goto end
    )
)

:: Check XAMPP PHP
if exist "C:\xampp\php\php.exe" (
    echo Using XAMPP PHP...
    "C:\xampp\php\php.exe" -S localhost:8000 -t backend/public backend/public/index.php
    goto end
)

echo ERROR: PHP executable not found in Laragon or XAMPP.
echo Please run this from Laragon Terminal (Open Laragon -> Click "Terminal").
pause

:end
