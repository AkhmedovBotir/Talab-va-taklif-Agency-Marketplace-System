# Agent Orders Analytics API

Agent uchun buyurtmalar statistikasi va analitikasi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <agent_jwt>`

## Endpoint

### GET `/agents/me/orders/analytics`

Query (ixtiyoriy):
- `from` — `YYYY-MM-DD`
- `to` — `YYYY-MM-DD`

`from`/`to` berilsa, filter `created_at` bo‘yicha ishlaydi.

## Response (`data`)

```json
{
  "from": "2026-04-01",
  "to": "2026-04-06",
  "total_orders": 14,
  "total_amount": 2450000,
  "delivered_orders": 9,
  "delivered_amount": 1700000,
  "pending_orders": 5,
  "pending_amount": 750000,
  "declared_to_punkt_amount": 1200000,
  "confirmed_by_punkt_amount": 900000,
  "unconfirmed_declared_amount": 300000
}
```

## Maydonlar

- `total_orders`, `total_amount`: agentga tayinlangan barcha buyurtmalar
- `delivered_*`: `status = delivered`
- `pending_*`: `status = pending`
- `declared_to_punkt_amount`: `agent_declared_payment_to_punkt_at` to‘ldirilgan buyurtmalar summasi
- `confirmed_by_punkt_amount`: `punkt_confirmed_agent_payment_at` to‘ldirilgan buyurtmalar summasi
- `unconfirmed_declared_amount`: agent to‘lovni e’lon qilgan, lekin punkt hali tasdiqlamagan buyurtmalar summasi

## Xatolar

- `400` — sana formati noto‘g‘ri yoki `from > to`
- `401` — token noto‘g‘ri/yaroqsiz
- `500` — server xatosi
