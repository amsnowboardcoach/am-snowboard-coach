# Arreglar `redirect_uri_mismatch`

El Client ID que termina en `...ctlck5` suele ser **Web (Firebase)** y solo acepta URIs de Firebase, no `localhost:3000` ni `3333`.

## Solución: cliente OAuth «Aplicación de escritorio»

### 1. Crear credenciales nuevas

1. [Google Cloud → Credenciales](https://console.cloud.google.com/apis/credentials?project=am-snowboard-coach)
2. **+ Crear credenciales** → **ID de cliente de OAuth**
3. Tipo de aplicación: **Aplicación de escritorio** (no «Aplicación web»)
4. Nombre: `AM Snowboard Calendar`
5. **Crear** → copia **ID de cliente** y **Secreto de cliente**

### 2. Actualizar `.env.local`

```env
GOOGLE_CLIENT_ID=el_nuevo_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=
```

(Sustituye los valores del cliente Web antiguo.)

### 3. Pantalla de consentimiento

[OAuth consent screen](https://console.cloud.google.com/auth/audience?project=am-snowboard-coach)

- Modo **Prueba**
- Usuario de prueba: `amsnowboardcoach@gmail.com`
- Alcance: Google Calendar API (se pide al autorizar)

### 4. Autorizar (sin registrar redirect en consola)

```powershell
npm run setup:google-oauth
```

Abre la URL que imprima el script → inicia sesión → debe salir **OK** y guardar `GOOGLE_REFRESH_TOKEN` en `.env.local`.

Con cliente **Escritorio**, Google acepta `http://127.0.0.1:3333/oauth2callback` automáticamente.
