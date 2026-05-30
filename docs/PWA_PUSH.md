# PWA + notificaciones push

## Instalar en el móvil

1. Abre la web en Chrome/Safari (producción HTTPS).
2. **Android Chrome:** menú → «Instalar aplicación» o banner «Instalar».
3. **iPhone Safari:** Compartir → «Añadir a pantalla de inicio».

Atajos en la app: Panel coach (`/coach`), Reservar, Perfil.

## Activar push (coach y alumnos)

1. Inicia sesión (`/login`).
2. Acepta el banner **Activar notificaciones**.
3. En Firebase Console → Cloud Messaging → **Certificados web** → genera par de claves VAPID.
4. Añade en `.env.local` y Vercel:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxxx...
```

5. Redeploy.

## Qué notifica

| Evento | Quién recibe | Mensaje (resumen) |
|--------|----------------|---------------------|
| Solicitud clase en pista | Coach | Nombre + fecha y hora (peninsular) |
| Solicitud video corrección | Coach | Nombre + nº de vídeos |
| Alumno sube vídeo en su área | Coach | Enlace al alumno en el panel |
| Coach confirma clase | Alumno (con cuenta) | Hora confirmada o enlace de pago |
| Coach confirma video corrección | Alumno (con cuenta) | Pago o subir vídeos |
| Coach rechaza solicitud | Alumno (con cuenta) | Invita a reservar otra fecha |
| Pago Stripe completado | Alumno + coach | Importe y tipo de reserva |
| Coach publica apuntes en un vídeo | Alumno | Enlace a Mis vídeos |

Los invitados sin cuenta solo reciben email. Hace falta **Activar notificaciones** (o no haber pulsado «No, gracias» en el banner).

## Probar en local

Push requiere HTTPS (o `localhost`). Usa `npm run dev` y permisos del navegador.
