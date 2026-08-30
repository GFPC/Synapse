@echo off
title Synapse Android Mobile Launcher
setlocal

set "ANDROID_HOME=D:\sdks\android_sdk"
set "PATH=D:\sdks\android_sdk\platform-tools;C:\Users\greg\adb;%PATH%"

echo ===================================================
echo   Starting Synapse Android on your phone...
echo   SDK: %ANDROID_HOME%
echo ===================================================

cd /d "%~dp0"
call npx expo start -a

pause
