# Contragent Analytics API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <contragent_jwt>
```

Kontragent uchun statistik va buyurtma savdo APIlari.

## 1) Statistika

**GET** `/contragents/me/analytics/stats`

Ixtiyoriy query:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

`from` va `to` birga yuboriladi. Yuborilmasa barcha davr bo'yicha.

Javob:

```json
{
  "from_utc": "2026-04-01",
  "to_utc": "2026-04-07",
  "orders_count": 10,
  "lines_count": 34,
  "gross_sales_total": 1200000,
  "cost_total": 900000,
  "margin_total": 300000,
  "kpi_pool_total": 65000,
  "payout_total": 1080000
}
```

## 2) Buyurtmalar sotuvi (narxlar bilan)

**GET** `/contragents/me/analytics/sales/orders?page=1&limit=10`

Ixtiyoriy query:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`
- `page` (default `1`)
- `limit` (default `10`, max `100`)

Javob:

```json
{
  "items": [
    {
      "order_id": 12,
      "order_status": "delivered",
      "order_updated_at": "2026-04-06T12:00:00Z",
      "lines_count": 3,
      "gross_sales_total": 250000,
      "cost_total": 200000,
      "payout_total": 230000
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

## Eslatma

- `gross_sales_total` = `unit_price * quantity` yig'indisi
- `cost_total` = `unit_original_price * quantity` yig'indisi
- `payout_total` = `unit_price * quantity * payout_percent` (foiz bo'lmasa 100%)

## Status kodlar

- `200` — OK
- `400` — noto'g'ri `from/to`
- `401` — token yaroqsiz
- `500` — server xatosi
