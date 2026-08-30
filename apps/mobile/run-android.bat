@echo off
set ANDROID_HOME=D:\sdks\android_sdk
set PATH=D:\sdks\android_sdk\platform-tools;C:\Users\greg\adb;%PATH%

echo ==============================================
echo   Synapse Android Mobile Starter
echo   Android SDK: %ANDROID_HOME%
echo ==============================================

cd /d %~dp0
npx expo start -a
pause
