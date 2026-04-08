# Local Shops Couriers API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <local_shop_jwt>
```

Barcha endpointlar local shopning o'ziga tegishli kuryerlarni boshqaradi.

## Maydonlar

- `first_name` - ism (majburiy)
- `last_name` - familiya (majburiy)
- `phone` - `+998XXXXXXXXX` format (majburiy)
- `note` - eslatma (ixtiyoriy)
- `password` - ixtiyoriy; yuborilsa hashlanadi
- `password_setup_allowed` - ixtiyoriy (`true/false`)

Javobda:

- `has_password` - parol o'rnatilgan/o'rnatilmagan
- `password_setup_allowed` - parol setup ruxsati

---

## 1) Create courier

**POST** `/local-shops/me/couriers`

```json
{
  "first_name": "Ali",
  "last_name": "Valiyev",
  "phone": "+998901112233",
  "note": "Yangi yetkazuvchi",
  "password": "secret123",
  "password_setup_allowed": true
}
```

> `password` yuborilsa `password_setup_allowed` avtomatik `false` bo'ladi.

---

## 2) List couriers

**GET** `/local-shops/me/couriers?page=1&limit=10`

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

---

## 3) Get courier by ID

**GET** `/local-shops/me/couriers/{id}`

---

## 4) Update courier

**PUT** `/local-shops/me/couriers/{id}`

```json
{
  "first_name": "Ali",
  "last_name": "Valiyev",
  "phone": "+998901112233",
  "note": "Kechki smena",
  "password_setup_allowed": true
}
```

---

## 5) Delete courier

**DELETE** `/local-shops/me/couriers/{id}`

---

## Status kodlar

- `200` - OK
- `201` - Created
- `400` - validatsiya xatosi
- `401` - token xato
- `404` - kuryer topilmadi
- `409` - telefon band
- `500` - server xatosi
