# Abre la página para descargar la clave de Firebase Admin
Start-Process "https://console.firebase.google.com/project/am-snowboard-coach/settings/serviceaccounts/adminsdk"
Write-Host ""
Write-Host "1. Pulsa 'Generar nueva clave privada' y guarda el JSON en Descargas"
Write-Host "2. Ejecuta:"
Write-Host '   npm run setup:firebase-admin -- "C:\Users\User\Downloads\am-snowboard-coach-firebase-adminsdk-xxxxx.json"'
Write-Host ""
