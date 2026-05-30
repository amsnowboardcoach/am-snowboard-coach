# Cal.com — Reservas AM Snowboard Coach

## Duraciones y turnos (web)

Definidas en `src/constants/session-schedules.ts`:

| Event Type (slug) | Duración Cal.com | Turnos en pista |
|-------------------|------------------|------------------|
| `curso-de-2-horas` | 120 min | 10:00–12:00, 12:00–14:00, 14:00–16:00 |
| `curso-de-3-horas` | 180 min | 10:00–13:00, 13:00–16:00 |
| `full-day` | 360 min (6 h) | 10:00–16:00 |

Usuario Cal.com: **am-snowboard-coach**

## 1. Crear los 3 Event Types en Cal.com

Por cada fila de la tabla:

1. Cal.com → **Event Types** → **+ New**
2. **Title:** igual que en la tabla (ej. «Clase 2 horas»)
3. **URL slug:** `curso-de-2-horas`, `curso-de-3-horas`, `full-day`
4. **Duration:** 120 / 180 / 360 minutos
5. **Location:** «Borreguiles — salida telecabina Al-Andalus, Sierra Nevada» (forfait y material no incluidos)
6. En **Availability** → edita el horario de trabajo para que solo se puedan **empezar** clases a las horas de inicio de cada turno:

### Clase 2 h (`curso-de-2-horas`)

En el horario semanal (o «Date overrides» en temporada), permite **inicios** solo a:

- 10:00 (termina 12:00)
- 12:00 (termina 14:00)
- 14:00 (termina 16:00)

Cal.com: *Availability* → añade bloques 10:00–12:00, 12:00–14:00, 14:00–16:00 **o** usa «Limit start times» / intervalo de 120 min con ventana 10:00–16:00.

### Clase 3 h (`curso-de-3-horas`)

Inicios:

- 10:00 → 13:00
- 13:00 → 16:00

### Día completo (`full-day`)

Un solo bloque diario **10:00–16:00** (duración del evento 360 min).

7. **Timezone:** Europe/Madrid  
8. **Minimum booking notice:** 24–48 h (recomendado en temporada alta)

## 2. Variables de entorno

En `.env.local`:

```env
NEXT_PUBLIC_CALCOM_USERNAME=am-snowboard-coach
CALCOM_API_KEY=tu_api_key
# Opcional: enlace fijo si solo quieres un evento
# NEXT_PUBLIC_CALCOM_CAL_LINK=am-snowboard-coach/curso-de-2-horas
```

Reinicia `npm run dev` y abre `/reservar` — el alumno elige 2 h / 3 h / día completo y se carga el embed correcto.

## 3. Webhook → panel coach (Firestore)

### A) Firebase Admin (servidor)

Firebase Console → Configuración → **Cuentas de servicio** → Generar nueva clave privada.

En `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID=am-snowboard-coach
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@am-snowboard-coach.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### B) Crear webhook en Cal.com

Settings → Developer → **Webhooks** → New:

| Campo | Valor |
|-------|--------|
| URL | `https://TU_DOMINIO/api/webhooks/cal` |
| Eventos | `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, `BOOKING_REQUESTED` |
| Secret | Genera uno y cópialo a `.env.local` |

```env
CAL_WEBHOOK_SECRET=tu_secreto_largo
```

### C) URL de producción actual

Tras desplegar en Vercel (cuenta `amsnowboardcoach@gmail.com`):

**https://am-snowboard-coach-9pqle4du3-am-snowboard-coach-s-projects.vercel.app**

Webhook registrado en Cal.com apuntando a:

`.../api/webhooks/cal`

Para regenerar: `npm run setup:cal-webhook -- https://TU_URL/api/webhooks/cal`

### D) Probar en local (ngrok)

```powershell
ngrok http 3000
```

Usa la URL `https://xxxx.ngrok-free.app/api/webhooks/cal` en Cal.com y `npm run dev`.

Tras una reserva de prueba, la reserva aparece en **`/coach`** (colección `bookings`). Si el email del alumno ya está registrado en la app, se enlaza `userId` automáticamente.

### E) Código

- Handler: `src/app/api/webhooks/cal/route.ts`
- Sincronización: `src/lib/firebase/bookings-admin.ts`
- Idempotencia por `calEventId` (= `uid` de Cal.com)

## 4. Próximo

- Stripe + precios en Cal.com
- Email / FCM al reservar
