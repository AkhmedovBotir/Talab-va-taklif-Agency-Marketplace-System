# Integration Contragent Banners API

Integratsiya foydalanuvchisi (`integration-auth` yoki `integration`) kontragent reklama bannerlarini CRUD qilishi uchun API.

## Auth

- `POST /api/v1/integration-auth/login` orqali token oling.
- Header: `Authorization: Bearer <token>`

## Endpoints

### 1) Create banner
- `POST /api/v1/integration-auth/contragent-banners`

Body:
```json
{
  "contragent_id": 12,
  "start_at": "2026-04-06T08:00:00Z",
  "end_at": "2026-04-12T23:59:59Z",
  "status": "active"
}
```

### 2) List banners
- `GET /api/v1/integration-auth/contragent-banners`

### 3) Update banner
- `PUT /api/v1/integration-auth/contragent-banners/:id`

Body:
```json
{
  "contragent_id": 15,
  "start_at": "2026-04-07T09:00:00Z",
  "end_at": "2026-04-20T21:00:00Z",
  "status": "inactive"
}
```

### 4) Delete banner
- `DELETE /api/v1/integration-auth/contragent-banners/:id`

## Rules

- `contragent_id` majburiy va mavjud bo‘lishi kerak.
- `start_at` va `end_at` RFC3339 formatda bo‘lishi kerak.
- `end_at` `start_at`dan katta bo‘lishi shart.
- `status`: `active` yoki `inactive` (bo‘sh bo‘lsa `active`).

## Response format

Barcha endpointlar umumiy formatda qaytadi:

```json
{
  "success": true,
  "message": "Reklama yaratildi",
  "data": {}
}
```
