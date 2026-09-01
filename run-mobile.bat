@echo off
title Synapse Android Mobile Launcher
setlocal

set "ANDROID_HOME=D:\sdks\android_sdk"
set "PATH=C:\Users\greg\adb;D:\sdks\android_sdk\platform-tools;%PATH%"

echo ===================================================
echo   Connecting to phone 192.168.0.103:43711 ...
echo ===================================================

adb -s 192.168.0.103:43711 reverse tcp:8081 tcp:8081

cd /d "%~dp0\apps\mobile"
call npx expo start -a

pause
