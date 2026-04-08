# Integratsiya autentifikatsiya (API kalit + JWT)

**Login va 401 tuzatish uchun batafsil alohida hujjat:** [integration-auth-login-api.md](./integration-auth-login-api.md) — `POST /api/v1/integration-auth/login`.

**KPI ajratishi (JWT bilan):** [integration-kpi-allocation-api.md](./integration-kpi-allocation-api.md).

Tashqi tizim avvalo **integratsiya `api_key`** bilan login qiladi va **JWT** oladi. Keyingi so‘rovlarda faqat shu JWT ishlatiladi (admin tokeni bilan aralashmasin).

- **Kalitlarni boshqarish** (yaratish / ro‘yxat / tahrirlash / o‘chirish): [core-integration-api-keys.md](./core-integration-api-keys.md) — faqat general admin JWT.

---

## POST `/api/v1/integration-auth/login` (tavsiya)

**Autentifikatsiya yo‘q** (ochiq endpoint). Eski yo‘l: `POST /api/v1/integration/login`.

**Body:**

```json
{
  "api_key": "intgr_..."
}
```

**Muvaffaqiyatli javob (200)** — `data`:

| Maydon                 | Tavsif                                      |
|------------------------|---------------------------------------------|
| `token`                | Integratsiya JWT                            |
| `token_type`           | `"Bearer"`                                  |
| `integration_key_id`   | Kalit yozuvining `id`                       |
| `name`                 | Kalit nomi (admin bergan)                   |
| `expires_in_hours`     | Muddat (`JWT_EXPIRE_HOURS` bilan bir xil)   |

**Xatolar:**

| Kod | Holat        |
|-----|--------------|
| 400 | `api_key` yo‘q yoki noto‘g‘ri JSON        |
| 401 | Noto‘g‘ri `api_key`                       |

---

## Integratsiya JWT

- Imzo: `JWT_SECRET` (boshqa rollar bilan bir xil maxfiy kalit, lekin **payload boshqacha**).
- Claimlar: `integration_key_id`, `token_use: "integration"`.
- **Admin JWT** bu token bilan almashtirilmaydi — integratsiya endpointlari faqat `ParseIntegrationToken` (yoki quyidagi middleware) orqali tekshiriladi.

So‘rovlarda:

```http
Authorization: Bearer <integration_token>
```

---

## GET `/api/v1/integration-auth/me`

Joriy integratsiya tokeni haqida qisqa ma’lumot (ulanishni tekshirish uchun). Eski yo‘l: `GET /api/v1/integration/me`.

**Headers:** `Authorization: Bearer <integration_token>`

**Javob (200)** — `data`:

| Maydon                 | Tavsif           |
|------------------------|------------------|
| `integration_key_id`   | Kalit `id`       |
| `name`                 | Nom              |
| `created_at`           | ISO8601 UTC      |

**Xatolar:** `401` (token yo‘q / yaroqsiz / admin tokeni), `404` (kalit o‘chirilgan).

---

## Keyingi integratsiya APIlar

Yangi marshrutlarda Gin middleware: `handler.IntegrationAuthMiddleware(jwtSecret)` — muvaffaqiyatdan keyin `c.Get(handler.GinIntegrationKeyID)` → `uint` (integratsiya kaliti `id`).

Muddati tugaganda qayta `POST /api/v1/integration-auth/login` qiling.
