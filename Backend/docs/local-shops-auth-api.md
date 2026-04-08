# Local Shops Auth API

Base URL: `http://localhost:8081/api/v1`

Ushbu API `neighborhood_shops` uchun mobil/web auth oqimi:

- SMS kod yuborish
- Kodni tasdiqlash
- Parol o'rnatish
- Login
- Profil olish
- Parol almashtirish
- Logo yangilash

## Public endpointlar

Prefiks: `/local-shops/auth`

### POST `/local-shops/auth/send-code`

```json
{
  "phone": "+998901234567"
}
```

`active` va `password_setup_allowed=true` bo'lgan local shop uchun 5 daqiqalik kod yuboradi.

### POST `/local-shops/auth/verify-code`

```json
{
  "phone": "+998901234567",
  "code": "12345"
}
```

### POST `/local-shops/auth/resend-code`

```json
{
  "phone": "+998901234567"
}
```

### POST `/local-shops/auth/set-password`

```json
{
  "phone": "+998901234567",
  "password": "secret123"
}
```

Javob:

```json
{
  "token": "<jwt>",
  "shop": {
    "id": 1,
    "name": "Mahalla do'koni",
    "phone": "+998901234567",
    "status": "active"
  }
}
```

### POST `/local-shops/auth/login`

```json
{
  "phone": "+998901234567",
  "password": "secret123"
}
```

Javob: `token` + `shop`.

## Protected endpointlar

Header:

```http
Authorization: Bearer <token>
```

Prefiks: `/local-shops/me`

### GET `/local-shops/me/profile`

Joriy local shop profilini qaytaradi.

### POST `/local-shops/me/change-password`

```json
{
  "old_password": "secret123",
  "new_password": "secret456"
}
```

### PATCH `/local-shops/me/logo`

```json
{
  "logo": "data:image/png;base64,..."
}
```

## Status kodlar

- `200` — muvaffaqiyat
- `400` — format/validatsiya xatosi
- `401` — token yoki login noto'g'ri
- `403` — noactive, parol o'rnatilgan/o'rnatilmagan holat mos emas
- `404` — local shop yoki kod topilmadi
- `410` — kod muddati o'tgan
- `500` — server xatosi
