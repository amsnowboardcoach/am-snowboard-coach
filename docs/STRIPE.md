# Stripe — pagos de reservas

## Variables de entorno

En `.env.local` y en Vercel:

```env
STRIPE_SECRET_KEY=sk_live_...   # Clave secreta (Developers → API keys)
STRIPE_WEBHOOK_SECRET=whsec_... # Tras crear el endpoint de webhook
```

Opcional (solo si usas Elements en el futuro):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

> Usa la **clave secreta** `sk_live_...` o `sk_test_...`, no solo una restricted key (`rk_live_...`), salvo que tenga permiso explícito para *Checkout Sessions*.

## Webhook en producción

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Añadir endpoint  
2. URL: `https://TU-DOMINIO/api/webhooks/stripe`  
3. Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`  
4. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## Flujo

1. El alumno reserva en `/reservar` → reserva `pending` (sin pago).  
2. El coach **confirma** en `/coach` → email + push con enlace `/pagar/{bookingId}`.  
3. Al abrir el enlace → redirección automática a **Stripe Checkout**.  
4. El webhook marca `payment.status = paid`.

## Local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Usa el `whsec_...` que imprime el CLI en `STRIPE_WEBHOOK_SECRET`.

## Reintentar pago

`POST /api/bookings/{bookingId}/checkout` devuelve `{ checkoutUrl }` si la reserva sigue sin pagar.
