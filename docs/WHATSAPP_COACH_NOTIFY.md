# WhatsApp al coach cuando hay reserva pagada

Cuando un alumno **completa el pago con tarjeta** (señal o total), además del email y la notificación push, puedes recibir un **mensaje de WhatsApp** en el móvil del coach con los datos de la reserva y el enlace al panel.

El aviso se envía **después del pago**, igual que el email «Pago recibido — acepta la reserva».

## Número de destino

Por defecto: **+34 617 354 031** (`34617354031`), desde `NEXT_PUBLIC_COACH_WHATSAPP` o:

```env
COACH_WHATSAPP_NOTIFY_PHONE=34617354031
```

## Opción A — CallMeBot (rápida, gratuita)

1. Añade el contacto de [CallMeBot](https://www.callmebot.com/) en WhatsApp.
2. Envía el mensaje que te indiquen para activar (p. ej. «I allow callmebot…»).
3. Copia tu **API key** y ponla en Vercel / `.env.local`:

```env
CALLMEBOT_API_KEY=tu_clave
```

4. Redeploy.

## Opción B — Twilio WhatsApp (producción)

1. Cuenta en [Twilio](https://www.twilio.com/) y activa **WhatsApp** (sandbox de prueba o número aprobado).
2. Variables:

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

(`TWILIO_WHATSAPP_FROM` es el número remitente de Twilio, no el del coach.)

Si Twilio falla y tienes `CALLMEBOT_API_KEY`, se usará CallMeBot como respaldo.

## Probar

Tras configurar, haz una reserva de prueba con pago en `/reservar`. Deberías recibir el WhatsApp en unos segundos tras completar Stripe.

Si no llega, revisa los logs de Vercel (`[whatsapp]` o `[markBookingPaid] WhatsApp coach`).
