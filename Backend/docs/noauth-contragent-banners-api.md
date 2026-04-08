# NoAuth Contragent Banners API

NoAuth qismidan hozirgi vaqt oralig‘ida aktiv turgan contragent bannerlarini olish API.

## Endpoint

- `GET /api/v1/noauth/contragent-banners`

## Response `data`

```json
[
  {
    "id": 1,
    "contragent_id": 12,
    "contragent_name": "Mega Savdo MChJ",
    "contragent_logo": "https://cdn.example.com/logo.png",
    "start_at": "2026-04-06T08:00:00Z",
    "end_at": "2026-04-12T23:59:59Z"
  }
]
```

## Notes

- Faqat `status=active` bannerlar qaytadi.
- Faqat joriy vaqt (`NOW()`) `start_at` va `end_at` oralig‘ida bo‘lgan bannerlar qaytadi.
