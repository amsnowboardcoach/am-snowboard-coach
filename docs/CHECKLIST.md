# Checklist — AM Snowboard Coach

Marca cada paso. Responde en el chat con el **número de paso** y lo que pide.

---

## Paso 1 — Servicios Firebase (en consola)

En [Firebase Console](https://console.firebase.google.com/) con el proyecto vinculado a **amsnowboardcoach@gmail.com**:

- [ ] **Authentication** → Activar proveedor **Correo/Contraseña**
- [ ] **Firestore Database** → Crear BD (modo producción, región **europe-west1** o **europe-west3**)
- [ ] **Storage** → Activar
- [ ] **App web** (`</>`) registrada con nickname ej. `am-snowboard-coach-web`

**Respóndeme:** ¿Ya están los 4 puntos? ¿Cuál es el **Project ID** exacto?

✅ Project ID confirmado: **`am-snowboard-coach`**

---

## Paso 2 — Claves para `.env.local`

Firebase → ⚙️ Configuración del proyecto → **Tus apps** → SDK web.

Copia el bloque `firebaseConfig` y pégalo en el chat **o** crea tú el archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_COACH_EMAILS=amsnowboardcoach@gmail.com
```

> Las claves `NEXT_PUBLIC_*` son públicas (van al navegador). No pegues aquí la clave privada de Admin.

---

## Paso 3 — Reglas Firestore

En terminal (proyecto):

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

**Respóndeme:** ¿Deploy OK o qué error sale?

---

## Paso 4 — Tu cuenta Coach ✅

- UID: `LoJYXe7ekuNNyTMtkNZIJlhzTIx2`
- Guardado en `NEXT_PUBLIC_DEFAULT_COACH_ID`

---

## Paso 5 — Siguiente desarrollo (cuando 1–4 estén OK)

- Panel coach: reservas + factura manual
- Cal.com + Stripe
- Pasaporte de trucos
