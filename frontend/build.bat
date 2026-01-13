@echo off
echo === Building Frontend for Production ===
echo.

cd /d "%~dp0"

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
call npm --version
echo.

echo Running Vite build...
node node_modules\vite\bin\vite.js build

echo.
if %ERRORLEVEL% EQU 0 (
    echo === Build Successful! ===
    echo Output directory: dist\
    echo.
    dir dist /b
) else (
    echo === Build Failed! ===
    echo Check errors above.
)

pause
