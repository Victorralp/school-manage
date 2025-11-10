
@echo off
REM School Exam Management System - Vercel Deployment Script (Windows)

echo.
echo ========================================
echo   Deploying to Vercel
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

REM Build the project
echo.
echo Building project...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo.
    
    REM Deploy to Vercel
    echo Deploying to Vercel...
    call vercel --prod
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo   Deployment Successful!
        echo ========================================
        echo.
        echo Next steps:
        echo 1. Add your Vercel domain to Firebase
        echo 2. Test your deployment
        echo 3. Share your app URL!
        echo.
    ) else (
        echo.
        echo Deployment failed. Check errors above.
    )
) else (
    echo.
    echo Build failed. Fix errors and try again.
)

pause
