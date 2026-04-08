# Local Shops Orders Payments & Analytics API

Maxalla do'koni uchun to'lovni qabul qilish va buyurtma statistikasi.

Base URL: `http://localhost:8081/api/v1`

Auth:

`Authorization: Bearer <local_shop_token>`

## 1) To'lovni qabul qilish

- **PATCH** `/local-shops/me/orders/{id}/accept-payment`

Mazmuni:
- buyurtmada kuryer tomonidan to'lov do'konga topshirilgan bo'lishi kerak (`payment_transferred_to_shop_at` mavjud)
- muvaffaqiyatli bo'lsa `shop_payment_accepted_at` yoziladi

## 2) Analitika

- **GET** `/local-shops/me/orders/analytics`

Query:
- `from` (ixtiyoriy, format: `YYYY-MM-DD`)
- `to` (ixtiyoriy, format: `YYYY-MM-DD`)

Misol:

`/local-shops/me/orders/analytics?from=2026-04-01&to=2026-04-30`

Javob:

```json
{
  "from": "2026-04-01",
  "to": "2026-04-30",
  "total_orders": 120,
  "total_amount": 4500000,
  "delivered_amount": 3100000,
  "undelivered_amount": 1400000,
  "transferred_amount": 2500000,
  "untransferred_amount": 2000000
}
```

## Status kodlar

- `200` — OK
- `400` — sana formati noto'g'ri
- `401` — token yaroqsiz
- `404` — buyurtma topilmadi
- `409` — to'lovni qabul qilish shartlari bajarilmagan
- `500` — server xatoligi
