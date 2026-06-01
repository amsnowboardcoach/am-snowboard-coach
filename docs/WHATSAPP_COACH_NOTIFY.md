# WhatsApp al coach (CallMeBot)

Los avisos al coach por **WhatsApp** usan solo [CallMeBot](https://www.callmebot.com/). El email y la notificación push siguen por su canal habitual.

## Cuándo llega un WhatsApp

- Nuevo alumno registrado
- Nueva reserva de clase (también si el pago con tarjeta está pendiente)
- Nueva solicitud de video corrección
- Alumno sube un vídeo para revisar
- Pago con tarjeta recibido (señal o total)

## Configuración

### 1. Activar CallMeBot en tu móvil

1. Añade el contacto de CallMeBot en WhatsApp (el que indica su web).
2. Envía el mensaje de activación (p. ej. «I allow callmebot…»).
3. Copia la **API key** que te devuelven.

### 2. Variables en Vercel / `.env.local`

```env
CALLMEBOT_API_KEY=tu_clave_callmebot
```

Opcional (si el número del coach no es el de `NEXT_PUBLIC_COACH_WHATSAPP`):

```env
COACH_WHATSAPP_NOTIFY_PHONE=34617354031
```

Por defecto se usa `NEXT_PUBLIC_COACH_WHATSAPP` o **+34 617 354 031**.

### 3. Redeploy

Tras guardar `CALLMEBOT_API_KEY` en Vercel, vuelve a desplegar.

## Probar

- Registro de alumno de prueba
- Reserva en `/reservar`
- Subida de vídeo en `/perfil/videos`

Si no llega el mensaje, revisa los logs de Vercel (`[whatsapp]` o `[notify-coach]`).
