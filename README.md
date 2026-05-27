# AM Snowboard Coach

Plataforma digital para clases de snowboard en Sierra Nevada — Alejandro Martín, Head Coach.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Firebase** — Auth, Firestore, Storage, FCM (próximo)
- **Stripe** — pagos (próximo)
- **Cal.com** — reservas (próximo)

## Inicio rápido

```bash
npm install
cp .env.example .env.local
# Rellena Firebase en .env.local (ver docs/SETUP.md)
npm run dev
```

## Estructura principal

```
src/
  app/(public)/     # Landing, clases, tarifas, reservar
  app/(auth)/       # Login
  app/coach/        # Panel del coach
  lib/firebase/     # Cliente y Admin SDK
  contexts/         # AuthProvider
  constants/        # Tipos de clase, roles
  types/            # Tipos Firestore
```

Guía completa de Firebase: [docs/SETUP.md](docs/SETUP.md).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
