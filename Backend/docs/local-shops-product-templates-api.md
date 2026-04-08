# Local Shops Product Templates API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <local_shop_jwt>
```

Bu endpointlar admin yaratgan `active` shablonlarni Maxalla do'koni ko'rishi uchun.

## 1) Shablonlar ro'yxati

**GET** `/local-shops/me/product-templates?page=1&limit=10`

Javob:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

Har bir item:

- `id`
- `name`
- `description` (delta format string)
- `images`
- `category_id`
- `subcategory_id`
- `unit`
- `unit_size`
- `status`
- `created_at`
- `updated_at`

## 2) Bitta shablon

**GET** `/local-shops/me/product-templates/{id}`

`active` bo'lmagan yoki yo'q shablon uchun `404`.

## Status kodlar

- `200` — OK
- `400` — ID noto'g'ri
- `401` — token noto'g'ri/yaroqsiz
- `404` — shablon topilmadi
- `500` — server xatosi
