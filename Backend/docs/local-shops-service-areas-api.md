# Local Shops Service Areas API

Local shop o'z xizmat ko'rsatish hududlarini (MFY) belgilaydi. Faqat do'konning o'z tumani ichidagi faol MFYlar tanlanadi.

## Base URL

`/api/v1/local-shops/me/service-areas`

## Authentication

`Authorization: Bearer <local_shop_token>` talab qilinadi.

## 1) MFYlarni olish (available + selected)

- **Method:** `GET`
- **Path:** `/mfys`

### Response (200)

```json
{
  "success": true,
  "message": "Xizmat hududlari olindi",
  "data": {
    "district_id": 12,
    "available_mfys": [
      {
        "id": 101,
        "external_id": "mfy_0001",
        "district_id": 12,
        "name": "Yangi hayot",
        "code": "YH-01",
        "status": "active",
        "created_at": "2026-04-06T10:00:00Z",
        "updated_at": "2026-04-06T10:00:00Z"
      }
    ],
    "selected_mfy_ids": [101, 105]
  }
}
```

## 2) MFYlarni saqlash

- **Method:** `PUT`
- **Path:** `/mfys`

### Request body

```json
{
  "mfy_ids": [101, 105, 110]
}
```

### Rules

- `mfy_ids` ichidagi har bir ID:
  - `0` bo'lmasligi kerak
  - do'konning o'z tumani ichidagi faol MFY bo'lishi kerak
- Dublikatlar avtomatik olib tashlanadi
- Bo'sh ro'yxat yuborilsa, avvalgi barcha hududlar o'chiriladi

### Response (200)

`GET /mfys` dagi `data` formatini qaytaradi va yangilangan holatni beradi.

## Error responses

- `400` - noto'g'ri request yoki noto'g'ri MFYlar
- `401` - token yaroqsiz
- `404` - maxalla do'koni topilmadi
- `500` - server xatoligi
