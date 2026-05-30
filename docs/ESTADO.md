# Estado del proyecto — AM Snowboard Coach

Última revisión: automática tras pruebas locales.

## ✅ Funciona

| Área | Estado |
|------|--------|
| Build producción (`npm run build`) | OK — 14 rutas |
| ESLint | OK |
| `.env.local` Firebase cliente | Completo |
| Coach UID en env | `LoJYXe7ekuNNyTMtkNZIJlhzTIx2` |
| Landing pública | `/`, `/clases`, `/tarifas`, `/sobre-mi`, `/reservar` |
| Auth UI | `/login`, `/registro` |
| Área privada (estructura) | `/perfil`, `/perfil/videos`, `/tribu`, `/coach` |
| Registro → perfil Firestore | Código listo (`createUserProfile`) |

## ⚠️ Pendiente / bloqueos

| Item | Prioridad | Acción |
|------|-----------|--------|
| **Deploy reglas Firestore/Storage** | Alta | `firebase login` con **amsnowboardcoach@gmail.com** (CLI ahora solo ve proyecto `all4post`) |
| **Documento `users/{uid}` en Firestore** | Alta | Verificar en consola que existe tu perfil con `role: coach` |
| Firebase Admin SDK | Alta | Necesario para webhook Cal → Firestore (`FIREBASE_ADMIN_*`) |
| Webhook Cal.com → `/coach` | Código listo | Falta: Admin en `.env.local` + webhook en Cal.com (+ ngrok en local) |
| Stripe + Cal.com pagos | Media | Precios y Checkout |
| Pasaporte de trucos | ✅ Hecho | `/perfil/pasaporte` + `/coach/alumnos` |
| La Tribu / Marketplace | Baja | Feed, storage uploads |
| FCM notificaciones | Baja | Push móvil |
| Facturas manuales en panel coach | ✅ Hecho | `/coach` — crear reserva, marcar pago, registrar factura + PDF |

## Firebase CLI

Si `firebase projects:list` no muestra `am-snowboard-coach`:

```powershell
firebase logout
firebase login
firebase use am-snowboard-coach
firebase deploy --only firestore:rules,storage
```

## Prueba manual recomendada

1. `npm run dev`
2. `/registro` o `/login` con amsnowboardcoach@gmail.com
3. Debe abrir `/coach`
4. Firebase Console → Firestore → colección `users` → documento con tu UID
