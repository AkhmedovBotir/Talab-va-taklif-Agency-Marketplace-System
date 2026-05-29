# NoAuth Product Ratings API

Mahsulot bo'yicha baholarni public ko'rish API.

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

### GET `/noauth/product-ratings?product_id=12&page=1&limit=10`

## Response (`data`)

```json
{
  "product_id": 12,
  "average_score": 4.6,
  "total_ratings": 25,
  "score_breakdown": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 6,
    "5": 16
  },
  "items": [
    {
      "id": 55,
      "order_id": 1001,
      "order_item_id": 2003,
      "score": 5,
      "comment_template_id": 3,
      "comment_template": "Sifatli mahsulot",
      "note": "Rahmat",
      "created_at": "2026-04-07T10:15:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total_pages": 3
}
```

## Xatolar

- `400` — `product_id` noto'g'ri yoki berilmagan
- `500` — server xatosi
