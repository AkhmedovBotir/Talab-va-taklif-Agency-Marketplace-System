# Agent Auth API

Base URL: `http://localhost:8081/api/v1`

Modul fayllari: `modules/agents` (`domain`, `repository`, `service`, `handler`, `module.go`). Agent yozuvi `modules/admin/domain` dagi `Agent` modeli va `agents` jadvali bilan ishlaydi. Tayinlangan buyurtmalar: `docs/agent-orders-api.md`.

Punkt auth bilan bir xil SMS + parol oqimi; agentda qo‘shimcha **`mfy_id`** maydoni bor.

---

## Javob formati

Muvaffaqiyat va xato barchasi bir xil tanada:

```json
{
  "message": "inqilobiy xabar matni",
  "data": { },
  "error": null
}
```

- **`message`** — foydalanuvchiga ko‘rsatish mumkin bo‘lgan qisqa matn.
- **`data`** — muvaffaqiyatda ma’lumot (bo‘sh bo‘lishi mumkin).
- **`error`** — xatolikda qo‘shimcha texnik tafsilot (masalan JSON bind xatosi); ba’zan `null`.

---

## Flow

1. **`send-code`** — agent telefoni bo‘yicha SMS kod.
2. **`verify-code`** — kodni tasdiqlash.
3. **`set-password`** — parol + JWT (birinchi kirish).
4. Keyin **`login`** yoki token bilan **`me/profile`** / **`me/change-password`**.

### Agent bor, lekin parol hali o‘rnatilmagan

- **`login`**: telefon bazada **agent sifatida mavjud**, lekin parol bo‘sh bo‘lsa, server **`400`** qaytaradi, `message`: **`parol hali o'rnatilmagan`**. Bu **telefon topilmadi** yoki **noto‘g‘ri parol** (`401`) dan farq qiladi — klient SMS oqimiga yo‘naltirishi kerak.
- **`send-code`** shu holatda ishlashi kerak: agent `active`, parol bo‘sh va `password_setup_allowed=true` bo‘lsa kod yuboriladi.
- Agar admin `password_setup_allowed=false` qilib qo‘ygan bo‘lsa, parol bo‘sh bo‘lsa ham **`send-code`** **`403`**, `message`: **`parol o'rnatilgan`** (sozlama ziddiyati — admin paneldan tuzatish kerak).

---

## Public endpointlar

### 1) SMS kod yuborish

**POST** `/agents/auth/send-code`

```json
{ "phone": "+998901112233" }
```

**Muvaffaqiyat:** `200` — `SMS kodi yuborildi`

---

### 2) SMS kodni tekshirish

**POST** `/agents/auth/verify-code`

```json
{
  "phone": "+998901112233",
  "code": "12345"
}
```

**Muvaffaqiyat:** `200` — `Kod tasdiqlandi`

---

### 3) Kodni qayta yuborish

**POST** `/agents/auth/resend-code`

```json
{ "phone": "+998901112233" }
```

**Muvaffaqiyat:** `200` — `SMS kodi qayta yuborildi`  
(xatoliklar **`send-code`** bilan bir xil.)

---

### 4) Parol o‘rnatish

**POST** `/agents/auth/set-password`

```json
{
  "phone": "+998901112233",
  "password": "strongPass123"
}
```

**Muvaffaqiyat:** `200` — `Parol o'rnatildi`; `data`:

```json
{
  "token": "jwt-token",
  "agent": {
    "id": 1,
    "name": "Agent nomi",
    "viloyat_id": 1,
    "tuman_id": 10,
    "mfy_id": 5,
    "phone": "+998901112233",
    "status": "active",
    "password_setup_allowed": false,
    "has_password": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### 5) Login

**POST** `/agents/auth/login`

```json
{
  "phone": "+998901112233",
  "password": "strongPass123"
}
```

**Muvaffaqiyat:** `200` — `Muvaffaqiyatli login qilindi`; `data.token` va `data.agent`.

**Eslatma:** telefon bazada **yo‘q** bo‘lsa, xavfsizlik uchun **`401`** va `telefon yoki parol noto'g'ri` (agent bor-yo‘qligini ochib bermaydi).

---

## Protected endpointlar

Header: **`Authorization: Bearer <token>`**

JWT ichida **`agent_id`** claim (boshqa rollar tokenlari bilan almashtirib bo‘lmaydi).

### 6) Profil

**GET** `/agents/me/profile`

### 7) Buyurtmalar (punkt topshirgach)

Ro‘yxat, batafsil, yetkazish: **`docs/agent-orders-api.md`** (`/agents/me/orders/...`).

### 8) Parolni almashtirish

**POST** `/agents/me/change-password`

```json
{
  "old_password": "strongPass123",
  "new_password": "newStrongPass456"
}
```

**Muvaffaqiyat:** `200` — `Parol muvaffaqiyatli yangilandi`

---

## Xabar matnlari (barcha `message` qiymatlari)

Quyidagi qatorlar **`message`** maydonida qaytarilishi mumkin (xato holatda asosan `message` ichida aynan shu matn, ba’zi umumiy xatolarda boshqa matn).

| Matn | HTTP | Qisqa ma’nosi |
|------|------|----------------|
| `So'rov formati noto'g'ri` | 400 | JSON noto‘g‘ri yoki maydonlar yetishmaydi (`error` ichida tafsilot) |
| `telefon raqami formati noto'g'ri` | 400 | `+998` + 9 raqam emas |
| `tasdiqlash kodi noto'g'ri` | 400 | Kod noto‘g‘ri yoki bo‘sh |
| `avval kodni tasdiqlang` | 400 | `set-password` dan oldin `verify-code` |
| `parol kamida 6 ta belgidan iborat bo'lishi kerak` | 400 | Yangi parol qisqa |
| `parol hali o'rnatilmagan` | 400 | **`login`** yoki **`change-password`**: avval SMS oqimi |
| `telefon yoki parol noto'g'ri` | 401 | Login: noto‘g‘ri parol yoki telefon yo‘q; yoki `change-password`da eski parol noto‘g‘ri |
| `agent faol emas` | 403 | `status` ≠ `active` |
| `parol o'rnatilgan` | 403 | SMS orqali parol o‘rnatish bloklangan yoki parol allaqachon bor |
| `agent topilmadi` | 404 | Telefon bo‘yicha agent yo‘q (`send-code` / `set-password` / profil) |
| `tasdiqlash kodi topilmadi` | 404 | Kod yozuvi yo‘q |
| `tasdiqlash kodi muddati o'tgan` | 410 | Kod 5 daqiqadan oshib ketgan |
| `Authorization header topilmadi` | 401 | Himoyalangan marshrut, header yo‘q |
| `Authorization formati noto'g'ri` | 401 | `Bearer` emas |
| `Token yaroqsiz` | 401 | JWT yaroqsiz yoki muddati o‘tgan; yoki kontekstda `agent_id` yo‘q |
| `Serverda xatolik yuz berdi` | 500 | SMS yoki DB kabi kutilmagan xato (`error` ichida tafsilot) |

---

## Endpoint bo‘yicha xatolar (jadval)

### `POST .../send-code` va `POST .../resend-code`

| HTTP | `message` (asosan) |
|------|---------------------|
| 400 | `So'rov formati noto'g'ri`, `telefon raqami formati noto'g'ri` |
| 403 | `agent faol emas`, `parol o'rnatilgan` |
| 404 | `agent topilmadi` |
| 500 | `Serverda xatolik yuz berdi` (masalan SMS) |

### `POST .../verify-code`

| HTTP | `message` (asosan) |
|------|---------------------|
| 400 | `So'rov formati noto'g'ri`, `telefon raqami formati noto'g'ri`, `tasdiqlash kodi noto'g'ri` |
| 404 | `tasdiqlash kodi topilmadi` |
| 410 | `tasdiqlash kodi muddati o'tgan` |
| 500 | `Serverda xatolik yuz berdi` |

### `POST .../set-password`

| HTTP | `message` (asosan) |
|------|---------------------|
| 400 | `So'rov formati noto'g'ri`, `telefon raqami formati noto'g'ri`, `parol kamida 6 ta belgidan iborat bo'lishi kerak`, `avval kodni tasdiqlang` |
| 403 | `parol o'rnatilgan` |
| 404 | `agent topilmadi`, `tasdiqlash kodi topilmadi` |
| 410 | `tasdiqlash kodi muddati o'tgan` |
| 500 | `Serverda xatolik yuz berdi` |

### `POST .../login`

| HTTP | `message` (asosan) |
|------|---------------------|
| 400 | `So'rov formati noto'g'ri`, `telefon raqami formati noto'g'ri`, **`parol hali o'rnatilmagan`** (agent bor, parol bo‘sh) |
| 401 | **`telefon yoki parol noto'g'ri`** (noto‘g‘ri parol yoki telefon bazada yo‘q) |
| 403 | `agent faol emas` |
| 500 | `Serverda xatolik yuz berdi` |

### `GET .../me/profile`

| HTTP | `message` (asosan) |
|------|---------------------|
| 401 | `Authorization header topilmadi`, `Authorization formati noto'g'ri`, `Token yaroqsiz` |
| 404 | `agent topilmadi` |
| 500 | `Serverda xatolik yuz berdi` |

### `GET .../me/orders/*`, `POST .../me/orders/{id}/payment-to-punkt`, `POST .../me/orders/{id}/deliver`

| HTTP | `message` (asosan) |
|------|---------------------|
| 401 | Token / `Authorization` xatolari |
| 400 | `ID noto'g'ri` |
| 404 | `buyurtma topilmadi` |
| 409 | `buyurtma yetkazish uchun mos emas`, `punktga to'lov e'lon qilish uchun holat mos emas`, `punkt to'lovdan keyingi yetkazish bosqichini yakunlamagan` |
| 500 | `Serverda xatolik yuz berdi` |

### `POST .../me/change-password`

| HTTP | `message` (asosan) |
|------|---------------------|
| 400 | `So'rov formati noto'g'ri`, `parol kamida 6 ta belgidan iborat bo'lishi kerak`, **`parol hali o'rnatilmagan`** |
| 401 | `Authorization ...`, `Token yaroqsiz`, `telefon yoki parol noto'g'ri` (eski parol) |
| 404 | `agent topilmadi` |
| 500 | `Serverda xatolik yuz berdi` |

---

## Validatsiya qoidalari

- `phone`: **`+998`** va undan keyin **9** ta raqam (jami 13 belgi).
- SMS kod muddati: **5 daqiqa**.
- Parol: kamida **6** belgi.
- `send-code`: agent **mavjud**, **`active`**, parol hali **o‘rnatilmagan**, **`password_setup_allowed: true`**.

---

## Qisqa status kodlar xulosasi

| Kod | Qachon |
|-----|--------|
| 200 | Muvaffaqiyat |
| 400 | Validatsiya, noto‘g‘ri so‘rov, **parol o‘rnatilmagan (login/change-password)** |
| 401 | Login xato, token yo‘q/yaroqsiz, noto‘g‘ri `Authorization` |
| 403 | Agent nofaol, SMS parol o‘rnatish bloklangan / parol allaqachon bor |
| 404 | Agent yoki kod topilmadi |
| 410 | Kod muddati tugagan |
| 500 | Server ichki xatosi |

---

Admin tomonda agent CRUD: `docs/agent-api.md`.
