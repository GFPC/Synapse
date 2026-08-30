$env:ANDROID_HOME = "D:\sdks\android_sdk"
$env:PATH = "D:\sdks\android_sdk\platform-tools;C:\Users\greg\adb;" + $env:PATH

Write-Host "📱 Synapse Android Starter" -ForegroundColor Cyan
Write-Host "Android SDK: $env:ANDROID_HOME" -ForegroundColor Gray
Write-Host "Target Device:" -ForegroundColor Gray
adb devices

Set-Location -Path $PSScriptRoot
npx expo start -a
