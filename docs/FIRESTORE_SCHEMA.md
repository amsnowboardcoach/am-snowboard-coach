# Esquema Firestore — AM Snowboard Coach

## Colecciones raíz

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfiles (uid = Auth) |
| `bookings` | Reservas + pago Stripe + factura manual |
| `tricks_catalog` | Catálogo de maniobras |
| `tribe_posts` | Feed La Tribu |
| `marketplace_listings` | Segunda mano |
| `snow_reports` | Parte de nieve diario |
| `coach_daily_tips` | Consejo del Coach |
| `notifications` | Alertas in-app / FCM |
| `system_config` | Tarifas, afiliados |

## Subcolecciones

- `users/{uid}/trick_progress/{trickId}`
- `users/{uid}/progress_videos/{videoId}`
- `tribe_posts/{id}/comments/{id}`
- `tribe_posts/{id}/fires/{userId}`
- `snow_reports/{date}/contributions/{userId}`

## Factura manual en `bookings`

```ts
invoice: {
  status: "pending" | "issued" | "not_required",
  number?: string,
  issuedAt?: Timestamp,
  pdfUrl?: string,
  issuedByCoachId?: string,
}
```

Ver reglas en `firestore.rules`.
