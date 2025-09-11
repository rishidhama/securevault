@echo off
REM 🚀 SecureVault Vercel Deployment Script for Windows
REM This script helps deploy both frontend and backend to Vercel

echo 🚀 Starting SecureVault deployment to Vercel...
echo ================================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Vercel. Please login first:
    vercel login
)

echo.
echo 📋 Deployment Options:
echo 1. Deploy Backend Only
echo 2. Deploy Frontend Only
echo 3. Deploy Both (Recommended)
echo 4. Exit
echo.

set /p choice="Choose an option (1-4): "

if "%choice%"=="1" (
    echo 🔧 Deploying Backend...
    cd server
    vercel --prod
    echo ✅ Backend deployment complete!
    echo 📝 Don't forget to:
    echo    - Set environment variables in Vercel dashboard
    echo    - Update REACT_APP_API_URL in frontend
) else if "%choice%"=="2" (
    echo 🎨 Deploying Frontend...
    cd client
    vercel --prod
    echo ✅ Frontend deployment complete!
    echo 📝 Don't forget to:
    echo    - Set REACT_APP_API_URL environment variable
    echo    - Ensure backend is deployed and accessible
) else if "%choice%"=="3" (
    echo 🚀 Deploying Both Frontend and Backend...
    
    echo 🔧 Deploying Backend...
    cd server
    vercel --prod
    echo ✅ Backend deployed!
    
    echo.
    echo 🎨 Deploying Frontend...
    cd ..\client
    vercel --prod
    echo ✅ Frontend deployed!
    
    echo.
    echo 🎉 Deployment Complete!
    echo ======================
    echo.
    echo 📝 Next Steps:
    echo 1. Update environment variables in Vercel dashboard
    echo 2. Set REACT_APP_API_URL to your backend URL
    echo 3. Test the application
) else if "%choice%"=="4" (
    echo 👋 Exiting deployment script
    exit /b 0
) else (
    echo ❌ Invalid option. Please run the script again.
    exit /b 1
)

echo.
echo 📚 For detailed instructions, see: VERCEL-DEPLOYMENT-GUIDE.md
pause
