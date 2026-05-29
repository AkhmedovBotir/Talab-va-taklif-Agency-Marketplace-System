# Admin CRUD API hujjati

Base URL: `http://localhost:8081/api/v1` (production: `https://api.ttsa.uz/api/v1`)

## Umumiy qoidalar

### Autentifikatsiya

| Endpoint guruhi | Token |
|-----------------|--------|
| `POST /admins/login` | Kerak emas |
| Qolgan `/admins/*` va boshqa admin panel API lari | `Authorization: Bearer <jwt>` majburiy |

Token query orqali ham qabul qilinadi: `?token=<jwt>` (masalan WebSocket).

JWT ichida: `admin_id`, `role` (`general` yoki `admin`).

**Muhim:** Barcha himoyalangan admin API larda server `permissions` ro‘yxatini **tekshirmaydi**. Faqat yaroqli JWT yetarli (`role: admin` ham, `role: general` ham bir xil). Menyu/sahifalarni yashirish — **faqat frontend** vazifasi.

`403` faqat quyidagi holatlarda keladi (admin CRUD dan tashqari API larda emas):

- `POST /admins/login` — admin `inactive`
- `GET /admins/auth/check` — token OK, lekin admin `inactive`

Boshqa admin marshrutlarida noto‘g‘ri/yaroqsiz token → **`401`**.

### `permissions` maydoni

- Tip: `string[]` (faqat nomlar, ob'ekt emas)
- Maqsad: admin yozuvida saqlash + login/`/me`/get javoblarida frontend uchun
- Server nomlarni **whitelist bilan tekshirmaydi**; bo‘sh/takror satrlar tozalanadi
- Tavsiya etilgan nomlar ro‘yxati: `GET /admins/permission-names`

### `role`

| Qiymat | Izoh |
|--------|------|
| `general` | Tizimda **faqat bitta** bo‘lishi mumkin |
| `admin` | Bir nechta bo‘lishi mumkin |

### `status`

- `active` — login va API ishlashi uchun
- `inactive` — login `403`, `auth/check` `403`

### Telefon

Format: `+998XXXXXXXXX` (9 ta raqam, jami 13 belgi).

### Response formati

```json
{
  "message": "o'zbekcha xabar",
  "data": {},
  "error": "xatolik tafsiloti"
}
```

`data` yoki `error` holatga qarab bo‘sh bo‘lishi mumkin.

---

## Endpointlar ro‘yxati

| Metod | Yo‘l | Token | Izoh |
|-------|------|-------|------|
| GET | `/meta/build` | Yo‘q | Deploy tekshiruvi (ochiq) |
| POST | `/admins/login` | Yo‘q | Login |
| GET | `/admins/auth/check` | Ha | Token + status tekshiruvi |
| GET | `/admins/me` | Ha | Joriy admin profili |
| GET | `/admins/permission-names` | Ha | Tavsiya ruxsat nomlari (konstanta) |
| POST | `/admins` | Ha | Admin yaratish |
| GET | `/admins` | Ha | Ro‘yxat (sahifalangan) |
| GET | `/admins/{id}` | Ha | Bitta admin |
| PUT | `/admins/{id}` | Ha | Yangilash |
| PATCH | `/admins/{id}/status` | Ha | Faqat status |
| DELETE | `/admins/{id}` | Ha | O‘chirish |

---

## 1) Login

**POST** `/admins/login`

Body:

```json
{
  "username": "general_admin",
  "password": "12345678"
}
```

Muvaffaqiyat (`200`):

```json
{
  "message": "Muvaffaqiyatli login qilindi",
  "data": {
    "token": "jwt_token",
    "admin": {
      "id": 1,
      "name": "Super Admin",
      "role": "general",
      "phone": "+998901234567",
      "username": "general_admin",
      "status": "active",
      "permissions": ["dashboard", "adminlar"],
      "created_at": "2026-05-29T12:00:00Z",
      "updated_at": "2026-05-29T12:00:00Z"
    }
  }
}
```

Parol javobda **qaytmaydi**.

| Kod | Sabab |
|-----|--------|
| `400` | JSON formati noto‘g‘ri |
| `401` | Username yoki parol noto‘g‘ri |
| `403` | Admin `inactive` |
| `500` | Server xatosi |

---

## 1.1) Token tekshirish

**GET** `/admins/auth/check`

Header: `Authorization: Bearer <token>` yoki `?token=<jwt>`

Maqsad: ilova ochilganda token yaroqliligini tekshirish (`401` / `403` ajratish). `permissions` **tekshirilmaydi**.

Muvaffaqiyat (`200`):

```json
{
  "message": "Token yaroqli",
  "data": {
    "valid": true,
    "admin_id": 2,
    "role": "admin",
    "status": "active"
  }
}
```

| Kod | Sabab |
|-----|--------|
| `401` | Token yo‘q, format noto‘g‘ri, muddati o‘tgan, admin o‘chirilgan |
| `403` | Token OK, admin `inactive` |
| `500` | Server xatosi |

To‘liq profil (shu jumladan `permissions`) uchun: **GET** `/admins/me`.

---

## 1.2) Joriy admin

**GET** `/admins/me`

Header: `Authorization: Bearer <token>`

Muvaffaqiyat (`200`): login dagi `admin` obyekti bilan bir xil maydonlar (`permissions` bilan).

| Kod | Sabab |
|-----|--------|
| `401` | Token yo‘q / yaroqsiz |
| `404` | Admin topilmadi |
| `500` | Server xatosi |

---

## 1.3) Tavsiya etilgan ruxsat nomlari

**GET** `/admins/permission-names`

Header: `Authorization: Bearer <token>`

Muvaffaqiyat (`200`):

```json
{
  "message": "Ruxsat nomlari ro'yxati",
  "data": {
    "items": [
      "dashboard",
      "adminlar",
      "agentlar",
      "menejerlar",
      "punktlar",
      "hududlar",
      "kontragent turlari",
      "kontragentlar",
      "maxalla do'konlari",
      "hamkorlik so'rovi",
      "kategoriyalar",
      "mahsulotlar",
      "maxalla maxsulotlari shablonlari",
      "maxalla maxsulotlari",
      "marketplace foydalanuvchilari",
      "barcha buyurtmalar",
      "buyurtmalar monitoringgi",
      "kommentariya shablonlari",
      "kommentariyalar",
      "trankzasiyalar",
      "do'kon obunasi",
      "integratsiya kalitlari",
      "arxiv",
      "qr tizimi"
    ]
  }
}
```

Bu ro‘yxat faqat UI uchun tavsiya; create/update da boshqa string nomlar ham saqlanishi mumkin.

---

## 2) Admin yaratish

**POST** `/admins`

Header: `Authorization: Bearer <token>`

Body:

```json
{
  "name": "Ali Valiyev",
  "role": "admin",
  "phone": "+998901112233",
  "username": "ali_admin",
  "password": "12345678",
  "status": "active",
  "permissions": ["dashboard", "mahsulotlar", "arxiv"]
}
```

Majburiy maydonlar: `name`, `role`, `phone`, `username`, `password`, `status`.

`permissions` ixtiyoriy; yuborilmasa `[]` saqlanadi.

Muvaffaqiyat (`201`): yaratilgan admin (`sanitizeAdmin`, parolsiz).

| Kod | Sabab |
|-----|--------|
| `400` | Majburiy maydon yo‘q, rol/status/telefon noto‘g‘ri |
| `401` | Token yo‘q / yaroqsiz |
| `409` | `general` allaqachon mavjud; `phone` yoki `username` band |
| `500` | Server xatosi |

---

## 3) Adminlar ro‘yxati

**GET** `/admins`

Header: `Authorization: Bearer <token>`

Query:

| Param | Default | Max |
|-------|---------|-----|
| `page` | `1` | — |
| `limit` | `10` | `100` |

Muvaffaqiyat (`200`):

```json
{
  "message": "Adminlar ro'yxati olindi",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Super Admin",
        "role": "general",
        "phone": "+998901234567",
        "username": "general_admin",
        "status": "active",
        "permissions": ["dashboard", "adminlar"],
        "created_at": "2026-05-29T12:00:00Z",
        "updated_at": "2026-05-29T12:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "total_pages": 3
  }
}
```

| Kod | Sabab |
|-----|--------|
| `401` | Token yo‘q / yaroqsiz |
| `500` | Server xatosi |

---

## 4) Bitta admin

**GET** `/admins/{id}`

Header: `Authorization: Bearer <token>`

Muvaffaqiyat (`200`): bitta admin obyekti (yuqoridagi `items[0]` struktura).

| Kod | Sabab |
|-----|--------|
| `400` | ID noto‘g‘ri |
| `401` | Token yo‘q / yaroqsiz |
| `404` | Admin topilmadi |
| `500` | Server xatosi |

---

## 5) Admin yangilash

**PUT** `/admins/{id}`

Header: `Authorization: Bearer <token>`

Body:

```json
{
  "name": "Ali Valiyev",
  "role": "admin",
  "phone": "+998901112233",
  "username": "ali_admin",
  "password": "newpassword123",
  "status": "inactive",
  "permissions": ["dashboard", "hududlar"]
}
```

Majburiy: `name`, `role`, `phone`, `username`, `status` (`password` ixtiyoriy).

- `password` bo‘sh yoki yuborilmasa — eski parol saqlanadi.
- `permissions`:
  - maydon **yuborilmasa** — bazadagi ro‘yxat o‘zgarmaydi;
  - `"permissions": []` — ro‘yxat tozalanadi;
  - massiv yuborilsa — yangi ro‘yxat saqlanadi.

Muvaffaqiyat (`200`): yangilangan admin.

| Kod | Sabab |
|-----|--------|
| `400` | Validatsiya xatosi |
| `401` | Token yo‘q / yaroqsiz |
| `404` | Admin topilmadi |
| `409` | `general` allaqachon mavjud; `phone` / `username` band |
| `500` | Server xatosi |

---

## 6) Admin o‘chirish

**DELETE** `/admins/{id}`

Header: `Authorization: Bearer <token>`

Muvaffaqiyat (`200`):

```json
{
  "message": "Admin muvaffaqiyatli o'chirildi",
  "data": null
}
```

| Kod | Sabab |
|-----|--------|
| `400` | ID noto‘g‘ri |
| `401` | Token yo‘q / yaroqsiz |
| `404` | Admin topilmadi |
| `500` | Server xatosi |

---

## 7) Status o‘zgartirish

**PATCH** `/admins/{id}/status`

Header: `Authorization: Bearer <token>`

Body:

```json
{
  "status": "inactive"
}
```

Muvaffaqiyat (`200`): yangilangan admin obyekti.

| Kod | Sabab |
|-----|--------|
| `400` | `status` noto‘g‘ri yoki bo‘sh |
| `401` | Token yo‘q / yaroqsiz |
| `404` | Admin topilmadi |
| `500` | Server xatosi |

---

## Boshqa admin modul API lari

Mahsulotlar, hududlar, `order-pipeline` va hokazo alohida hujjatlarda (`docs/admin-*.md`).

Ularda ham xuddi shu qoida: **faqat JWT**, `permissions` bo‘yicha `403` **yo‘q**.

Agar `GET /order-pipeline/...` yoki boshqa endpoint `403` (`Ushbu bo'limga ruxsat yo'q`) qaytarsa — serverda **eski binary** ishlayapti; yangi build deploy qiling va `systemctl restart ttsa.service` bajaring. Yangi build logida: `Server ishga tushdi (admin API: permissions middleware yo'q, faqat JWT)`.

---

## Seed: general admin

`go run ./cmd/seed-general-admin` — mavjud `general` bo‘lsa unga barcha tavsiya ruxsatlarini yozadi; yo‘q bo‘lsa yangi `general` yaratadi. Bu faqat CLI, HTTP API emas.

---

## Muammolar (404 / 403)

### `GET /admins/auth/check` → 404

**404** degani admin yo‘q emas — **serverda bu endpoint yo‘q** (eski `ttsa-app` ishlayapti).

Admin DB da bo‘lsa ham, eski binary da `/admins/auth/check` marshruti bo‘lmasa Gin `404` + `Bunday endpoint topilmadi` qaytaradi.

Tekshirish (ochiq, token kerak emas):

```http
GET https://api.ttsa.uz/api/v1/meta/build
```

Yangi build (`200`):

```json
{
  "data": {
    "auth_check_route": true,
    "permissions_enforced": false,
    "admin_permissions_scope": "frontend_only"
  }
}
```

Eski build: `404` yoki `permissions_enforced: true` (bo‘lmasa ham 403 davom etadi).

**Vaqtinchalik yechim (frontend):** `auth/check` o‘rniga `GET /admins/me` — token yaroqli bo‘lsa `200` + profil.

**Doimiy yechim (VPS):**

```bash
cd ~/api.ttsa.uz
git pull   # yoki yangi kodni nusxalang
go build -o ttsa-app ./cmd/api
systemctl restart ttsa.service
journalctl -u ttsa.service -n 3 --no-pager
# log: Server ishga tushdi (admin API: permissions middleware yo'q, faqat JWT)
```

### Boshqa API lar → 403 (`Ushbu bo'limga ruxsat yo'q`)

Bu **permissions middleware** (eski build). Yangi kodda bunday xabar **yo‘q**.

`/order-pipeline`, `/regions` va h.k. uchun faqat `Authorization: Bearer <token>` kerak; `permissions` ro‘yxati API da tekshirilmaydi.

Deploydan keyin qayta `POST /admins/login` qiling (yangi token).

### HTTP kodlari farqi

| Kod | Ma'nosi |
|-----|---------|
| `404` | Endpoint serverda yo‘q (deploy eski) |
| `401` | Token yo‘q / yaroqsiz / admin o‘chirilgan |
| `403` (login/check) | Admin `inactive` |
| `403` (boshqa API, eski build) | Permissions middleware — deploy yangilang |
