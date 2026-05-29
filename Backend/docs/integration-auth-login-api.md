# Integratsiya login (faqat API kalit)

Admin panel orqali yaratilgan **integratsiya `api_key`** (`intgr_...`) bilan JWT olish. Boshqa tokenlar (masalan admin JWT) bu endpointda **ishlamaydi**.

**To‘liq URL:** `POST /api/v1/integration-auth/login`

---

## 1. Kalitni olish

1. General admin bilan kirish.
2. `POST /api/v1/integration-api-keys` yoki `GET /api/v1/integration-api-keys` orqali kalit yarating / ko‘ring.
3. Javobdagi `api_key` qiymatini **butunlay** nusxalang (`intgr_` dan boshlab, oxirigacha, bo‘shliqsiz).

Batafsil: [core-integration-api-keys.md](./core-integration-api-keys.md).

---

## 2. Login so‘rovi

```http
POST /api/v1/integration-auth/login
Content-Type: application/json
```

**Body (majburiy maydon — `api_key`):**

```json
{
  "api_key": "intgr_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

- Agar JSON ishlatilsa: `Content-Type: application/json`.
- Alternativa: sarlavha **`X-Integration-Api-Key: intgr_...`** (yoki `X-Api-Key`) — tanada kalit bo‘lmasa ham.
- Kalit satrida old/oxirida **bo‘sh joy** bo‘lmasin.
- URL **`/integration-auth/login`** bo‘lishi kerak (`/integration/login` ham ishlaydi, lekin tavsiya etilgan yo‘l — `integration-auth`).

---

## 3. Muvaffaqiyat (HTTP 200)

Javob tanasi umumiy formatda: `message`, `data`, `data` ichida:

| Maydon               | Tavsif                                    |
|----------------------|-------------------------------------------|
| `token`              | Keyingi so‘rovlar uchun JWT               |
| `token_type`         | `"Bearer"`                                |
| `integration_key_id` | Kalit yozuvi `id`                         |
| `name`               | Kalit nomi                                |
| `expires_in_hours`   | Token muddati (serverdagi `JWT_EXPIRE_HOURS`) |

Keyingi so‘rovlar:

```http
Authorization: Bearer <token>
```

---

## 4. Xatolar

| Kod | Sabab (odatda) |
|-----|----------------|
| **400** | JSON yo‘q / noto‘g‘ri format / `api_key` maydoni bo‘sh |
| **401** | `api_key` noto‘g‘ri, muddati o‘tmagan lekin bazada boshqa kalit bilan solishtirilmaydi, yoki noto‘g‘ri nusxa (bir belgi kam/qo‘shilgan) |

**401 bo‘lsa tekshiring:** to‘g‘ri endpoint (`/api/v1/integration-auth/login`), to‘liq `intgr_...` kalit, JSON ichida `api_key` kaliti, yangi yaratilgan kalit bilan qayta urinib ko‘ring.

---

## 5. Tekshiruv (ixtiyoriy)

Login dan keyin:

```http
GET /api/v1/integration-auth/me
Authorization: Bearer <token>
```

`200` bo‘lsa integratsiya JWT to‘g‘ri.

---

## 6. KPI ajratishi

Kalit bo‘yicha bitta KPI foizlari (Punkt, Agent, Menejer, Moliya, Yetkazib berish): [integration-kpi-allocation-api.md](./integration-kpi-allocation-api.md).

Buyurtma / tranzaksiya bo‘yicha KPI summalari: [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md).

Hisobotlar (barcha rollar, to‘langan/to‘lanmagan, to‘lov yozish): [integration-kpi-reports-api.md](./integration-kpi-reports-api.md).
