# Delivery Providers Auth API

Yetkazib beruvchi (kuryer) uchun alohida auth moduli.

Base URL: `http://localhost:8081/api/v1`

SMS matni:

`${code} - Yetkazib beruvchi hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.`

## Public endpointlar

- `POST /delivery-providers/auth/send-code`
- `POST /delivery-providers/auth/verify-code`
- `POST /delivery-providers/auth/resend-code`
- `POST /delivery-providers/auth/set-password`
- `POST /delivery-providers/auth/login`

## Protected endpointlar

Header:

`Authorization: Bearer <delivery_provider_token>`

- `GET /delivery-providers/me/profile`
- `POST /delivery-providers/me/change-password`

## Oqim

1. `send-code` (`phone`)
2. `verify-code` (`phone`, `code`)
3. `set-password` (`phone`, `password`) -> `token`
4. keyin `login` yoki `me/profile`

## Request namunalari

### Send code

```json
{
  "phone": "+998901234567"
}
```

### Verify code

```json
{
  "phone": "+998901234567",
  "code": "12345"
}
```

### Set password

```json
{
  "phone": "+998901234567",
  "password": "123456"
}
```

### Login

```json
{
  "phone": "+998901234567",
  "password": "123456"
}
```

## Status kodlar

- `200` — OK
- `400` — noto'g'ri format, code/password validatsiya xatolari
- `401` — login/token xato
- `403` — parol holati bo'yicha taqiqlangan (`password already set` va h.k.)
- `404` — courier yoki code topilmadi
- `410` — code muddati o'tgan
- `500` — server xatoligi
