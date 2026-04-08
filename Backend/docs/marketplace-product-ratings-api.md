# Marketplace Product Ratings API

Marketplace foydalanuvchi yetkazilgan buyurtmadagi mahsulotlarga baho beradi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <marketplace_jwt>`

## Endpoint

### POST `/marketplace/me/orders/{id}/ratings`

`{id}` — buyurtma ID (faqat `delivered` buyurtma).

Body:

```json
{
  "items": [
    {
      "order_item_id": 101,
      "score": 5,
      "comment_template_id": 3,
      "note": "Yaxshi sifat"
    },
    {
      "order_item_id": 102,
      "score": 4,
      "note": "Boshqa fikr"
    }
  ]
}
```

## Qoidalar

- `score` 1..5 oralig'ida bo'lishi shart.
- `comment_template_id` ixtiyoriy.
- `note` ixtiyoriy.
- `order_item_id` shu userning aynan shu `delivered` buyurtmasiga tegishli bo'lishi kerak.
- Qayta yuborilganda o'sha item bahosi yangilanadi (upsert).

## Xatolar

- `400` — format yoki maydon xatolari
- `409` — buyurtma yetkazilmagan / ruxsat etilmagan holat
- `401` — token xato
