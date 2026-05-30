# Arreglar login con Google (`invalid_client` / client secret inválido)

Error típico:

```text
auth/invalid-credential
The provided client secret is invalid.
OAuth2 redirect uri: https://am-snowboard-coach.firebaseapp.com/__/auth/handler
```

Firebase intercambia el login de Google con un **OAuth Web Client** de Google Cloud. Si el **client secret** no coincide, falla con este error.

## Solución recomendada (5–10 min)

### 1. Google Cloud — credenciales del proyecto Firebase

1. Abre [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials?project=am-snowboard-coach)  
   (cambia `am-snowboard-coach` si tu Project ID es otro).
2. Busca el cliente **Web client (auto created by Google Service)** o uno tipo **Aplicación web**.
3. Ábrelo y comprueba:

   **Orígenes de JavaScript autorizados:**
   - `http://localhost`
   - `http://localhost:3000`
   - `https://am-snowboard-coach.firebaseapp.com`
   - `https://am-snowboard-coach-green.vercel.app`

   **URIs de redirección autorizados:**
   - `https://am-snowboard-coach.firebaseapp.com/__/auth/handler`

4. Si no existe un cliente web, créalo:
   - **+ Crear credenciales** → **ID de cliente de OAuth** → **Aplicación web**
   - Añade los orígenes y la URI de redirección de arriba.
   - Guarda.

5. **Copia** el **ID de cliente** y el **Secreto de cliente** (si no hay secreto, usa “Restablecer secreto” y copia el nuevo).

### 2. Pantalla de consentimiento OAuth

1. [Pantalla de consentimiento de OAuth](https://console.cloud.google.com/apis/credentials/consent?project=am-snowboard-coach)
2. Tipo **Externo** (o Interno si es Workspace).
3. Rellena nombre de la app, email de soporte y dominios si lo pide.
4. En **Usuarios de prueba** (si la app está en “Prueba”), añade los Gmail con los que probarás.

### 3. Firebase — volver a enlazar Google

1. [Firebase Console](https://console.firebase.google.com/) → proyecto **am-snowboard-coach**
2. **Authentication** → **Sign-in method** → **Google**
3. Si está activado: **Desactivar** → Guardar.
4. **Activar** de nuevo.
5. Despliega **Configuración del SDK web** (o “Web SDK configuration”) y pega:
   - **Web client ID** = ID de cliente de Google Cloud
   - **Web client secret** = Secreto de cliente (el recién copiado/restablecido)
6. Email de asistencia del proyecto → **Guardar**

### 4. Dominios autorizados en Firebase

**Authentication** → **Settings** → **Authorized domains**:

- `localhost`
- `am-snowboard-coach-green.vercel.app`

### 5. Comprobar `.env` / Vercel

`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` debe ser:

```text
am-snowboard-coach.firebaseapp.com
```

(no un dominio inventado ni solo el de Vercel).

---

## Probar

1. https://am-snowboard-coach-green.vercel.app/registro  
2. **Registrarse con Google**  
3. Debe abrir la cuenta de Google y volver a `/perfil` sin error.

## Si sigue fallando — método “cliente nuevo” (el más fiable)

A veces el cliente *auto created by Google Service* queda corrupto. Crea uno nuevo y enlázalo a mano:

### A. Google Cloud

1. [Credenciales](https://console.cloud.google.com/apis/credentials?project=am-snowboard-coach) → **+ Crear credenciales** → **ID de cliente de OAuth** → **Aplicación web**.
2. Nombre: `AM Snowboard Coach Web`.
3. **Orígenes JavaScript autorizados** (todas):
   - `http://localhost`
   - `http://localhost:3000`
   - `https://am-snowboard-coach.firebaseapp.com`
   - `https://am-snowboard-coach-green.vercel.app`
4. **URIs de redirección autorizados** (solo esta, exacta):
   - `https://am-snowboard-coach.firebaseapp.com/__/auth/handler`
5. **Crear** → copia **ID de cliente** (`....apps.googleusercontent.com`) y **Secreto de cliente** (`GOCSPX-...` o similar).

### B. Firebase

1. [Authentication → Google](https://console.firebase.google.com/project/am-snowboard-coach/authentication/providers)
2. **Desactivar** → Guardar.
3. **Activar** otra vez.
4. Abre **Configuración del SDK para la Web** (no uses el modo automático si falla).
5. Pega el **ID de cliente** y **Secreto de cliente** del paso A (no otro cliente distinto).
6. Guardar.

### C. Comprobar que coinciden

En Firebase, el **Web client ID** debe ser **idéntico** al de Google Cloud que acabas de crear. Si Firebase muestra otro ID, estás editando el cliente equivocado en GCP.

---

## Error `deleted_client` / «The OAuth client was deleted»

Significa que el **client ID que usa Firebase ya no existe** en Google Cloud (lo borraste en Credenciales, o borraste el cliente equivocado).

Comprueba antes de guardar en Firebase:

```bash
npm run verify:google-auth -- TU_CLIENT_ID.apps.googleusercontent.com
```

Si dice `BORRADO`, crea otro cliente en GCP y **no borres** el que esté en uso.

Firebase sigue usando un **client ID antiguo** aunque hayas creado uno nuevo en Google Cloud.

1. Comprueba qué cliente usa Firebase (debe terminar en tu cliente **nuevo**, no en uno borrado):

   ```bash
   node -e "fetch('https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=TU_API_KEY',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({providerId:'google.com',continueUri:'https://TU-DOMINIO/registro'})}).then(r=>r.json()).then(j=>console.log(j.authUri.match(/client_id=([^&]+)/)[1]))"
   ```

2. En [Firebase → Google](https://console.firebase.google.com/project/am-snowboard-coach/authentication/providers) pega el **ID y secreto del cliente que sigue existiendo** en [Credenciales GCP](https://console.cloud.google.com/apis/credentials?project=am-snowboard-coach).

3. O actualiza por API (cuenta `firebase login` del owner):

   ```powershell
   $env:GOOGLE_WEB_CLIENT_ID="....apps.googleusercontent.com"
   $env:GOOGLE_WEB_CLIENT_SECRET="GOCSPX-..."
   node scripts/fix-google-auth-provider.mjs
   ```

---

## Otras causas

- Espera 2–5 minutos tras guardar (propagación de Google).
- Prueba en **incógnito**.
- Misma cuenta Google en Firebase y GCP: `amsnowboardcoach@gmail.com`.
- No mezcles claves del proyecto **Cal.com** u otro OAuth; solo el proyecto `am-snowboard-coach`.

La app en Vercel ya tiene `authDomain` correcto: `am-snowboard-coach.firebaseapp.com`. No hace falta redeploy por este error.
