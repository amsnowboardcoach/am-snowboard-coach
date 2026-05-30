# Esquema Firestore — AM Snowboard Coach

## Colecciones raíz

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfiles (uid = Auth) |
| `bookings` | Reservas + pago Stripe + factura manual |
| `tricks_catalog` | Catálogo de maniobras |
| `tribe_posts` | Feed La Tribu (fotos/vídeos, likes `fires`, comentarios) |
| `marketplace_listings` | Mercadillo (activos públicos; al vender se borran doc + fotos) |
| `snow_reports` | Parte de nieve diario |
| `coach_daily_tips` | Consejo del Coach |
| `notifications` | Alertas in-app / FCM |
| `system_config` | Tarifas, afiliados, **issuer** (datos fiscales del coach) |

## Subcolecciones

- `users/{uid}/trick_progress/{trickId}`
- `users/{uid}/progress_videos/{videoId}`
- `tribe_posts/{id}/comments/{id}`
- `tribe_posts/{id}/fires/{userId}`
- `snow_reports/{date}/contributions/{userId}`

## Factura manual en `bookings`

```ts
// system_config/issuer
{
  legalName: "Alejandro Martín del Valle",
  taxId: "74941275F",
  address: "Av. Europa 29, 3º",
  postalCode: "18690",
  city: "Almuñécar",
  province: "Granada",
  country: "ES"
}

// bookings.invoice
{
  status, number, issuedAt,
  documentType: "simplified" | "full",
  issuerLegalName, issuerTaxId,
  recipient: { type, legalName, taxId, address, ... },
  tax: { vatRatePercent, baseAmountCents, vatAmountCents, totalAmountCents }
}
```

Ver reglas en `firestore.rules`.
