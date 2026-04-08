# Admin QR CRUD API

Admin uchun QR CRUD API.

Talablar:
- QR yaratishda faqat `name` va `link` so'raladi.
- QR rasm `1000x1000` hajmda yaratiladi.
- QR rasm `base64` ko'rinishida saqlanadi va API'da qaytadi.
- QR yangilanganda QR o'zgarmaydi (faqat `name` yoki `link` o'zgaradi).
- Har bir skanerdan keyin `scan_count` oshadi.

Base URL: `http://localhost:8081/api/v1`

## Admin CRUD (General Admin token kerak)

Auth: `Authorization: Bearer <admin_jwt>`

- `POST /qrs`
- `GET /qrs?page=1&limit=10`
- `GET /qrs/:id`
- `PUT /qrs/:id`
- `DELETE /qrs/:id`

### Create body
```json
{
  "name": "Telegram kanal",
  "link": "https://t.me/example"
}
```

### Create/Update javobidagi asosiy maydonlar
- `id`
- `code` (o'zgarmas kod)
- `name`
- `link`
- `image_base64` (PNG, 1000x1000)
- `scan_count`
- `created_at`
- `updated_at`

## Public scan endpoint (token shart emas)

- `GET /qr/:code/scan`

Ishlash tartibi:
- `code` bo'yicha QR topiladi
- `scan_count` +1 qilinadi
- foydalanuvchi QR ichidagi joriy `link`ga redirect qilinadi (`302 Found`)

## Eslatma

- QR rasm yaratishda ichidagi target URL: `<APP_BASE_URL>/api/v1/qr/:code/scan`
- `APP_BASE_URL` bo'lmasa fallback: `http://localhost:8081`

