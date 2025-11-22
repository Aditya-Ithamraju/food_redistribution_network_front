@echo off
REM Food Waste Redistribution Network - GitHub Push Script
REM This script will push your project to GitHub

echo.
echo ========================================
echo Food Waste Redistribution Network
echo GitHub Push Script
echo ========================================
echo.

REM Change to project directory
cd /d "c:\Users\adiit\Documents\food_waste_redistribution_network_frontend"

REM Check if git is initialized
if not exist ".git" (
    echo ERROR: Git is not initialized!
    echo Please run: git init
    pause
    exit /b 1
)

echo Step 1: Checking Git status...
git status

echo.
echo Step 2: Configuring Git remote...
echo.
echo Before continuing, make sure you have:
echo 1. Created a repository on GitHub at: https://github.com/new
echo 2. Named it: food_waste_redistribution_network_frontend
echo 3. Left it empty (no README, .gitignore, or license)
echo.

set /p proceed="Have you created the GitHub repository? (yes/no): "
if /i not "%proceed%"=="yes" (
    echo Cancelled. Please create the repository first.
    pause
    exit /b 1
)

echo.
echo Adding remote origin...
git remote add origin https://github.com/Aditya-Ithamraju/food_waste_redistribution_network_frontend.git

echo.
echo Renaming branch to main...
git branch -M main

echo.
echo Pushing to GitHub (you may be prompted for credentials)...
echo.
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! 🎉
    echo ========================================
    echo.
    echo Your project has been uploaded to:
    echo https://github.com/Aditya-Ithamraju/food_waste_redistribution_network_frontend
    echo.
) else (
    echo.
    echo ERROR: Push failed!
    echo Please check the error message above.
    echo.
)

pause
