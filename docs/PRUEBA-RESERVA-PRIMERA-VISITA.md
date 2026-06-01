# Probar reserva como visitante nuevo

Flujo esperado en **https://tu-dominio/reservar** (o local).

## Requisitos

- Firebase Auth: Google y email/contraseña activos.
- Firestore: reglas desplegadas (perfil `users/{uid}` al registrarse).
- Google Calendar configurado (disponibilidad).
- Stripe `sk_test_` o `sk_live_` según entorno.

## Pasos (primera visita)

1. Abre `/reservar` en ventana de incógnito (sin sesión).
2. Elige **un día** con hueco libre en el calendario y el **turno**.
3. Elige duración (2 h, 3 h o día completo).
4. Estilo y 1 persona.
5. Pulsa **Reservar y pagar** → aparece el bloque «Último paso».
6. **Continuar con Google** (o Área de alumno → registrarte con email).
7. Tras entrar debe mostrarse tu nombre y lanzarse el pago (Stripe) o un mensaje claro si falta algo.
8. Completa el pago en Stripe (tarjeta de prueba si es modo test).

## Tarjeta de prueba Stripe

- Número: `4242 4242 4242 4242`
- Fecha: cualquier futura · CVC: cualquier 3 dígitos

## Si algo falla

| Síntoma | Qué revisar |
|--------|-------------|
| `Missing or insufficient permissions` | Reglas Firestore desplegadas; cerrar sesión y volver a entrar |
| 400 en `/api/bookings/reserve` | Mensaje en pantalla; día/turno, nombre ≥ 2 caracteres |
| No redirige a Stripe | `STRIPE_SECRET_KEY` en Vercel / `.env.local` |
| Sin huecos en calendario | Google Calendar / temporada nov–jun |
