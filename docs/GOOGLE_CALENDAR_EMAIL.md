# Google Calendar + Email (sin Cal.com)

Las reservas en `/reservar` usan:

1. **Google Calendar** de `amsnowboardcoach@gmail.com` (disponibilidad + crear evento)
2. **Firestore** (`bookings`)
3. **Email SMTP** (Gmail) — confirmación al alumno y aviso al coach

## 1. Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto (o el de Firebase)
2. **APIs y servicios** → Biblioteca → activar **Google Calendar API**
3. **Credenciales** → Crear credenciales → **ID de cliente OAuth** → Aplicación web
4. En ese mismo cliente OAuth → **URIs de redirección autorizados** (no “Orígenes JavaScript”), añade **exactamente**:
   - `http://localhost:3000/api/auth/google/callback`
   - Guarda y espera 1–2 minutos.
   - Si ves `redirect_uri_mismatch`, la URI no está en **ese** cliente o hay un typo.
5. Pantalla de consentimiento OAuth → modo Prueba → añade `amsnowboardcoach@gmail.com` como usuario de prueba

## 2. Obtener refresh token (una vez)

En `.env.local` pon primero:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Luego:

```powershell
npm run dev
npm run setup:google-oauth
```

Abre la URL que imprima el script (con `npm run dev` en marcha). Al terminar, el callback guarda `GOOGLE_REFRESH_TOKEN` en `.env.local`.

```env
GOOGLE_CALENDAR_ID=primary
```

### Varios calendarios (Explora + AM Snowboard Coach)

Para que `/reservar` no ofrezca huecos ya ocupados en **Explora** ni en **AM**:

1. En Google Calendar, el calendario de Explora (`explora.sclub@gmail.com` o el de Alex) debe estar **compartido** con `amsnowboardcoach@gmail.com` con permiso al menos de **ver todos los detalles de los eventos** (ideal: hacer cambios en eventos si quieres reflejar reservas AM en Explora).
2. En `.env.local` y Vercel:

```env
GOOGLE_CALENDAR_ID=primary
GOOGLE_EXPLORA_CALENDAR_ID=explora.sclub@gmail.com
```

`GOOGLE_EXPLORA_CALENDAR_ID` es el **id del calendario** (suele ser el email). Si no funciona, en [calendar.google.com](https://calendar.google.com) → Configuración del calendario → **Integrar calendario** → copia el **ID del calendario**.

Al **aceptar** una reserva en AM, el evento se crea en `GOOGLE_CALENDAR_ID` y se **duplica** en Explora (misma franja), para que ambos sistemas vean el bloqueo.

Calendarios extra solo para consultar ocupación (sin duplicar evento):

```env
GOOGLE_BUSY_CALENDAR_IDS=otro@ejemplo.com,otro-id@group.calendar.google.com
```

## 3. Gmail SMTP (contraseña de aplicación)

1. Cuenta Google → Seguridad → Verificación en 2 pasos (activada)
2. **Contraseñas de aplicaciones** → genera una para "AM Snowboard Coach"
3. En `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=amsnowboardcoach@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
BOOKING_FROM_EMAIL=amsnowboardcoach@gmail.com
BOOKING_NOTIFY_EMAIL=amsnowboardcoach@gmail.com
```

## 4. Vercel

Añade las mismas variables en el panel de Vercel → Environment Variables → Production.

Puedes quitar: `CALCOM_API_KEY`, `CAL_WEBHOOK_SECRET`, `NEXT_PUBLIC_CALCOM_*`.

## 5. Probar

```powershell
npm run dev
```

Reserva de prueba en `/reservar` → revisa Google Calendar y bandeja de entrada.
