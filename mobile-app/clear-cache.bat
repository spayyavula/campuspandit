@echo off
REM Clear all Expo and Metro bundler caches

echo ========================================
echo Clearing Expo/Metro Caches
echo ========================================
echo.

echo [1/3] Clearing Metro bundler cache...
npx react-native start --reset-cache

echo.
echo [2/3] Clearing Expo cache...
npx expo start --clear

echo.
echo [3/3] Clearing watchman cache (if installed)...
watchman watch-del-all 2>nul

echo.
echo ========================================
echo Cache cleared successfully!
echo ========================================
echo.
echo You can now run: npm start
echo.
pause
