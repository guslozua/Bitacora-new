@echo off
echo 🔧 Testing Frontend Compilation...
cd C:\Users\guslo\Bitacora_01\frontend

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔍 TypeScript check...
call npx tsc --noEmit --skipLibCheck

echo.
echo 🚀 Attempting build...
call npm run build

echo.
echo ✅ Compilation test completed.
pause
