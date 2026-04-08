# NoAuth Local Shops API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/local-shops`

## Query params

- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)
- `q` (ixtiyoriy, do'kon nomi yoki telefoni bo'yicha qidiruv)
- `district_id` (ixtiyoriy)
- `mfy_id` (ixtiyoriy)

## Qisqa tavsif

Bu endpoint maxalladagi faol do'konlarni qaytaradi.
Har bir do'kon bilan birga uning ish vaqtlari (`working_hours`) ham qaytadi.

## Response (200) namunasi

```json
{
  "success": true,
  "message": "NoAuth maxalla do'konlari ro'yxati olindi",
  "data": {
    "items": [
      {
        "id": 3,
        "name": "Navro'z do'koni",
        "region_id": 1,
        "district_id": 12,
        "mfy_id": 144,
        "phone": "998901112233",
        "logo": "https://cdn.example/logo.png",
        "status": "active",
        "working_hours": [
          { "weekday": 1, "is_off": false, "open_time": "09:00", "close_time": "21:00" },
          { "weekday": 2, "is_off": false, "open_time": "09:00", "close_time": "21:00" },
          { "weekday": 7, "is_off": true }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

## Status kodlar

- `200` - OK
- `400` - query param noto'g'ri
- `500` - server xatoligi
