# Marketplace Hamkorlik So'rovi API

Marketplace foydalanuvchisi hamkorlik so'rovini yuboradi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <marketplace_jwt>`

## Endpointlar

### GET `/marketplace/me/partner-requests?page=1&limit=10`

Foydalanuvchining yuborgan hamkorlik so'rovlari ro'yxati.

`data`:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

### POST `/marketplace/me/partner-requests`

Body:

```json
{
  "company_name": "Hamkor Savdo MChJ",
  "inn": "123456789",
  "mfo": "01025",
  "account_number": "20208000123456789001",
  "activity_type_id": 2,
  "region_id": 1,
  "district_id": 10,
  "mfy_id": 105,
  "phone": "+998901234567"
}
```

## Qoidalar

- `phone` formati faqat `+998901234567`.
- Telefon raqami tizimda (`contragent`, `shop`, `agent`, `punkt`, `manager`, `admin`, `marketplace_user`) mavjud bo'lsa so'rov qabul qilinmaydi.
- Bir foydalanuvchi bir necha marta so'rov yuborishi mumkin.

## Xatolar

- `400` — majburiy maydonlar/formati xato
- `409` — telefon raqami allaqachon tizimda mavjud
- `401` — marketplace token xato
