# Punkt Auth API

Base URL: `http://localhost:8081/api/v1`

Modul fayllari: `modules/punkts` (`domain`, `repository`, `service`, `handler`, `module.go`). Punkt yozuvi `modules/admin/domain` dagi `Punkt` modeli va `punkts` jadvali bilan ishlaydi.

## Flow

1. `send-code` — telefon tekshiriladi, 5 xonali kod SMS orqali yuboriladi.
2. `verify-code` — kod to'g'ri/noto'g'ri yoki muddati o'tganligi tekshiriladi.
3. `set-password` — kod tasdiqlangandan keyin parol o'rnatiladi va token qaytadi (auto login).
4. Keyin `login` yoki token bilan `me/profile` va `me/change-password`.

Kontragent auth bilan bir xil oqim; punkt uchun **logo** endpointi yo'q.

## Public endpointlar

### 1) SMS kod yuborish

**POST** `/punkts/auth/send-code`

```json
{
  "phone": "+998901112233"
}
```

Javob: `200` — `SMS kodi yuborildi`

### 2) SMS kodni tekshirish

**POST** `/punkts/auth/verify-code`

```json
{
  "phone": "+998901112233",
  "code": "12345"
}
```

Javob: `200` — `Kod tasdiqlandi`

### 3) Kodni qayta yuborish

**POST** `/punkts/auth/resend-code`

```json
{
  "phone": "+998901112233"
}
```

Javob: `200` — `SMS kodi qayta yuborildi`

### 4) Parol o'rnatish (kod tasdiqlangandan keyin)

**POST** `/punkts/auth/set-password`

```json
{
  "phone": "+998901112233",
  "password": "strongPass123"
}
```

Javobda token qaytadi:

```json
{
  "message": "Parol o'rnatildi",
  "data": {
    "token": "jwt-token",
    "punkt": {
      "id": 1,
      "name": "1-son punkt",
      "viloyat_id": 1,
      "tuman_id": 10,
      "phone": "+998901112233",
      "status": "active",
      "password_setup_allowed": false,
      "has_password": true,
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

### 5) Login

**POST** `/punkts/auth/login`

```json
{
  "phone": "+998901112233",
  "password": "strongPass123"
}
```

Muvaffaqiyatli javob tuzilishi `set-password` bilan bir xil: `data.token` va `data.punkt`.

## Protected endpointlar (Bearer token kerak)

Header:

`Authorization: Bearer <token>`

Token JWT ichida `punkt_id` claim saqlanadi (kontragent tokenidan farq qiladi; bir-birini almashtirib bo'lmaydi).

### 6) Profil

**GET** `/punkts/me/profile`

Javob `data` ichida punkt obyekti (yuqoridagi `punkt` maydoni bilan bir xil maydonlar, parol qaytarilmaydi).

### 7) Parolni almashtirish

**POST** `/punkts/me/change-password`

```json
{
  "old_password": "strongPass123",
  "new_password": "newStrongPass456"
}
```

Javob: `200` — `Parol muvaffaqiyatli yangilandi`

## Validatsiya va qoidalar

- `phone` formati: `+998901234567` (13 belgi, `+998` dan keyin 9 raqam)
- SMS kod amal qilish muddati: **5 daqiqa**
- `set-password` faqat `verify-code` dan keyin ishlaydi
- `password` kamida **6** ta belgi
- `send-code` / `resend-code` faqat:
  - punkt telefon bo'yicha mavjud bo'lsa
  - status `active` bo'lsa
  - parol hali o'rnatilmagan bo'lsa (`password_setup_allowed` va bo'sh parol holati)

## Status kodlar

- `200` — muvaffaqiyatli
- `400` — noto'g'ri so'rov yoki validatsiya
- `401` — login yoki token noto'g'ri / `Authorization` yo'q
- `403` — punkt nofaol, parol allaqachon o'rnatilgan yoki parol hali o'rnatilmagan (tegishli operatsiya uchun)
- `404` — punkt yoki kod topilmadi
- `410` — SMS kod muddati o'tgan
- `500` — server xatosi

Batafsil punkt CRUD (admin): `docs/punkt-api.md`.
