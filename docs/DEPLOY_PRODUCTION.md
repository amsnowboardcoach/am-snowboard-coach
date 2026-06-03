# Despliegue a producción

URL canónica: **https://am-snowboard-coach-green.vercel.app**

## 1. GitHub → Vercel (código)

Cada `git push` a `main` despliega en Vercel si el repo está conectado.

```powershell
git add -A
git commit -m "tu mensaje"
git push origin main
```

O despliegue manual:

```powershell
vercel deploy --prod --yes
```

## 2. Variables en Vercel

Desde `.env.local` (completo y actualizado):

```powershell
npm run push:vercel-env
vercel deploy --prod --yes
```

Comprueba en [Vercel → Project → Settings → Environment Variables](https://vercel.com) (entorno **Production**):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_APP_URL` | Enlaces en emails y push |
| `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Auth, Firestore cliente, push |
| `NEXT_PUBLIC_DEFAULT_COACH_ID` | Asignación de alumnos y push al coach |
| `FIREBASE_ADMIN_*` | APIs servidor, webhooks, notificaciones |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Pagos |
| `SMTP_*` | Emails (reservas, pasaporte, broadcast) |
| `GOOGLE_*` | Calendar al confirmar reservas |
| `CALLMEBOT_API_KEY` + `COACH_WHATSAPP_NOTIFY_PHONE` | WhatsApp al coach (opcional) |

## 3. Firestore y Storage (reglas)

Inicia sesión con la cuenta del proyecto (`amsnowboardcoach@gmail.com`):

```powershell
firebase login
firebase use am-snowboard-coach
firebase deploy --only firestore:rules,storage
```

Si Storage da 403, activa Storage en Firebase Console y vuelve a desplegar. Firestore rules solo:

```powershell
firebase deploy --only firestore:rules
```

## 4. Firebase Console (una vez)

- **Authentication** → Dominios autorizados: `localhost`, `am-snowboard-coach-green.vercel.app`
- **Authentication** → Google y Email/Password activos; **Anónimo** para La Tribu
- **Cloud Messaging** → Par de claves VAPID → `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en Vercel

## 5. Stripe (producción)

Webhook endpoint:

`https://am-snowboard-coach-green.vercel.app/api/webhooks/stripe`

Eventos: `checkout.session.completed` (y los que uses en el dashboard).

Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET` en Vercel → redeploy.

## 6. Google OAuth (login y Calendar)

Ver [GOOGLE_SIGNIN_FIX.md](./GOOGLE_SIGNIN_FIX.md): URIs de redirección con el dominio `am-snowboard-coach-green.vercel.app`.

## 7. Comprobar en producción

1. `/registro` — login Google
2. `/reservar` — reserva + pago test Stripe
3. `/coach` — aceptar reserva; activar push en el banner
4. Coach → alumno → Pasaporte → **Confirmar y notificar** → alumno recibe email/push
5. `/perfil/pasaporte` — alumno ve cambios

## Script rápido (local)

```powershell
npm run deploy:prod
```

Ejecuta: `push:vercel-env` (si hay `.env.local`) + `vercel deploy --prod --yes`.  
Firestore hay que desplegarlo aparte con `firebase deploy` (paso 3).
