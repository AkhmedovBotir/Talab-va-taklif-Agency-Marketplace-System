# Integratsiya API kalitlari (`modules/core`)

Tashqi tizimlar uchun server tomonidan generatsiya qilinadigan kalitlar. Bir nechta kalit yaratish mumkin. **Faqat general admin** JWT bilan.

Kalit bilan **login**: [integration-auth-login-api.md](./integration-auth-login-api.md) (`POST /api/v1/integration-auth/login`). Qo‘shimcha: [integration-auth-api.md](./integration-auth-api.md).

Asosiy URL prefiksi: `/api/v1/integration-api-keys`

## Xavfsizlik

- Bazada: integratsiya kaliti uchun **bcrypt hash** (tekshiruv) va **AES-256-GCM** bilan shifrlangan nusxa (admin `GET` da to‘liq ko‘rsatish uchun). Shifrlash kaliti sifatida serverdagi **`JWT_SECRET`** ishlatiladi — uni o‘zgartirsangiz, eski yozuvlarning `api_key` maydoni bo‘sh chiqishi mumkin; bunday holda kalitni qayta yarating.
- `POST` va `GET` javoblarida to‘liq `api_key` bor; endpointlar faqat **general admin** JWT bilan himoyalangan — kalitni himoyalang.

---

## POST `/api/v1/integration-api-keys`

Yangi kalit yaratish.

**Headers:** `Authorization: Bearer <admin_jwt>`

**Body:**

```json
{
  "name": "ERP ulanishi"
}
```

**Javob (201):** `data`:

| Maydon      | Tavsif                          |
|------------|----------------------------------|
| `id`       | Kalit ID                         |
| `name`     | Berilgan nom                     |
| `api_key`  | To‘liq kalit (`intgr_` + 64 hex) |
| `created_at` | ISO8601 UTC                   |

---

## GET `/api/v1/integration-api-keys`

Barcha kalitlar — har birida **to‘liq** `api_key`.

**Javob (200):** `data` — massiv:

| Maydon       | Tavsif                         |
|-------------|--------------------------------|
| `id`        | ID                             |
| `name`      | Nom                            |
| `api_key`   | To‘liq kalit (ochilmagan bo‘lsa `""`) |
| `key_hint`  | Qisqa ko‘rinish                |
| `created_at`| ISO8601 UTC                    |

---

## PUT `/api/v1/integration-api-keys/:id`

Faqat **nom**ni yangilash (`name`). Kalit qiymati o‘zgarmaydi.

**Body:**

```json
{
  "name": "Yangi nom"
}
```

**Javob:** `200` — `Yangilandi`

**Xatolar:** `400` (name bo‘sh), `404` (topilmasa)

---

## DELETE `/api/v1/integration-api-keys/:id`

Kalitni o‘chirish (hash va yozuv butunlay olib tashlanadi).

**Javob:** `200` — `O'chirildi`

**Xatolar:** `404` (topilmasa)

---

## Keyingi qadam (integratsiya endpointlari)

Kelajakda boshqa modullar `X-Integration-Key: <api_key>` yoki `Authorization: Bearer <api_key>` orqali tekshiruv qo‘shishi mumkin; kalitlar shu jadvaldagi hash bilan solishtiriladi.
