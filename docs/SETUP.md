# AM Snowboard Coach — Configuración inicial

## 1. Firebase Console

1. Entra en [Firebase Console](https://console.firebase.google.com/) → **Crear proyecto** (ej. `am-snowboard-coach`).
2. **Authentication** → Activar **Correo/contraseña** y **Google**:
   - Proveedor **Google** → Activar → elegir email de soporte del proyecto.
   - Si falla con `invalid_client` o *client secret is invalid*, sigue [GOOGLE_SIGNIN_FIX.md](./GOOGLE_SIGNIN_FIX.md).
   - En **Settings** → **Authorized domains**, deben figurar `localhost` y tu dominio de producción (ej. `am-snowboard-coach-green.vercel.app`).
3. **Firestore** → Crear base de datos en modo producción (región `europe-west1` o `europe-west3`).
4. **Storage** → Activar.
5. **Configuración del proyecto** → Tu app → **Web** (`</>`) → copiar el objeto `firebaseConfig`.

## 2. Variables locales

```bash
cp .env.example .env.local
```

Rellena las claves `NEXT_PUBLIC_FIREBASE_*` con los valores de Firebase.

## 3. Cuenta de servicio (Admin SDK)

1. Firebase → **Configuración del proyecto** → **Cuentas de servicio**.
2. **Generar nueva clave privada** → guarda el JSON.
3. En `.env.local`:
   - `FIREBASE_ADMIN_PROJECT_ID` = `project_id`
   - `FIREBASE_ADMIN_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_ADMIN_PRIVATE_KEY` = clave privada entre comillas (los `\n` se escapan)

## 4. Desplegar reglas Firestore y Storage

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

## 5. Tu usuario como Coach

1. Arranca la app: `npm run dev`.
2. Crea un usuario en Authentication (manual en consola o login cuando esté listo).
3. En Firestore crea el documento `users/{tu-uid}`:

```json
{
  "uid": "TU_UID",
  "email": "tu@email.com",
  "displayName": "Alejandro Martín",
  "role": "coach",
  "assignedCoachId": "TU_UID",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

4. Copia tu UID en `NEXT_PUBLIC_DEFAULT_COACH_ID` en `.env.local`.

## 6. Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).
