# Admin Transactions by Area API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <admin_jwt>` majburiy.  
Faqat `general admin`.

## Endpoint

- `GET /transactions/by-area?level=region&status=delivered&from=2026-03-01T00:00:00Z&to=2026-04-01T00:00:00Z`

## Query paramlar

- `level` — `region` | `district` | `mfy` (default: `region`)
- `status` — ixtiyoriy (`pending`, `cancelled`, `delivered`); bo'sh bo'lsa default `delivered`
- `from` — ixtiyoriy, RFC3339 (inclusive)
- `to` — ixtiyoriy, RFC3339 (exclusive)

## Javob

`data`:

```json
{
  "level": "district",
  "items": [
    {
      "region_id": 1,
      "district_id": 10,
      "district_name": "Chilonzor",
      "orders_count": 12,
      "total_amount": 5280000
    }
  ]
}
```

### `level=region`
- `region_id`, `region_name`, `orders_count`, `total_amount`

### `level=district`
- `region_id`, `district_id`, `district_name`, `orders_count`, `total_amount`

### `level=mfy`
- `region_id`, `district_id`, `mfy_id`, `mfy_name`, `orders_count`, `total_amount`
