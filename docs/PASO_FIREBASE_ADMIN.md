# Un solo paso que solo tú puedes hacer (Firebase Admin)

El webhook de Cal.com ya está creado y la web está en Vercel. Falta la clave de servidor para escribir en Firestore.

## Pasos (2 minutos)

1. Ejecuta en PowerShell (abre la consola de Firebase):

```powershell
cd c:\Users\User\Desktop\am-snowboard-coach
powershell -File scripts/abrir-firebase-admin.ps1
```

2. En el navegador: **Generar nueva clave privada** → guarda el `.json` en Descargas.

3. Importa la clave (cambia la ruta por la tuya):

```powershell
npm run setup:firebase-admin -- "C:\Users\User\Downloads\am-snowboard-coach-firebase-adminsdk-xxxxx.json"
```

4. Sube las variables de Admin a Vercel:

```powershell
npm run push:vercel-env
```

5. Redespliega:

```powershell
vercel deploy --prod --yes
```

6. Haz una reserva de prueba en Cal.com y revisa `/coach`.
