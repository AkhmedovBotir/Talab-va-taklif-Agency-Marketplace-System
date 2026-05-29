# Admin — maxalla do'koni obuna va oylik konfig API

Base URL: `http://localhost:8081/api/v1`

## Umumiy

- Barcha endpointlar: `Authorization: Bearer <admin_jwt>`
- Faqat **`general`** role
- Maxalla do'koni CRUD: `docs/neighborhood-shop-api.md` (alohida)

Ikki alohida blok:

1. **Oylik konfig** — tizim bo‘yicha standart oylik narx (`/neighborhood-shop-monthly-config`)
2. **Do‘kon obunasi** — har bir do‘kon uchun oylik to‘lov yoki N oy bepul (`/neighborhood_shops/{id}/subscription`)

---

## 1) Oylik konfig (singleton)

Standart oylik narx. Bitta yozuv (`id` doim `1`). Do‘konda `monthly_price_uzs` berilmasa, shu qiymat ishlatiladi.

### Olish

`GET /neighborhood-shop-monthly-config`

Response `data`:

| Maydon | Turi | Izoh |
|--------|------|------|
| `id` | number | Har doim `1` |
| `monthly_price_uzs` | number | Standart oylik narx (so'm) |
| `currency` | string | Masalan `UZS` |
| `created_at`, `updated_at` | string (ISO) | |

### Yangilash

`PUT /neighborhood-shop-monthly-config`

```json
{
  "monthly_price_uzs": 150000,
  "currency": "UZS"
}
```

- `monthly_price_uzs` — majburiy, `>= 0`
- `currency` — ixtiyoriy; berilmasa avvalgi qiymat saqlanadi

---

## 2) Do‘kon obunasi

Har bir maxalla do‘koni uchun **bitta** obuna yozuvi.

### Olish

`GET /neighborhood_shops/{id}/subscription`

- `404` — do‘kon yo‘q yoki obuna hali berilmagan

Response `data` (misol):

```json
{
  "id": 1,
  "neighborhood_shop_id": 5,
  "billing_type": "free",
  "monthly_price_uzs": null,
  "free_months": 3,
  "period_start_at": "2026-05-01T00:00:00Z",
  "period_end_at": "2026-08-01T00:00:00Z",
  "config_monthly_price_uzs": 150000,
  "effective_monthly_price_uzs": 150000,
  "is_in_free_period": true,
  "is_period_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

| Maydon | Izoh |
|--------|------|
| `billing_type` | `monthly` — oylik to‘lov; `free` — bepul muddat |
| `monthly_price_uzs` | Faqat `monthly` da: do‘kon uchun maxsus narx; `null` — konfigdagi standart |
| `free_months` | Faqat `free` da: necha oy bepul |
| `period_start_at` | Joriy davr boshlanishi |
| `period_end_at` | `monthly`: +1 oy; `free`: +`free_months` oy |
| `config_monthly_price_uzs` | Global konfigdan |
| `effective_monthly_price_uzs` | Hisoblangan (override yoki konfig) |
| `is_in_free_period` | Hozir bepul muddat ichidami |
| `is_period_active` | Hozir `period_start_at` ≤ now &lt; `period_end_at` |

### Berish / yangilash

`PUT /neighborhood_shops/{id}/subscription`

Mavjud bo‘lsa yangilanadi, yo‘q bo‘lsa yaratiladi.

#### Oylik to‘lov

```json
{
  "billing_type": "monthly",
  "monthly_price_uzs": 200000,
  "period_start_at": "2026-05-01T00:00:00Z"
}
```

| Maydon | Majburiy | Izoh |
|--------|----------|------|
| `billing_type` | ha | `monthly` |
| `monthly_price_uzs` | yo‘q | Berilmasa — faqat konfig narxi (`effective` = konfig) |
| `period_start_at` | yo‘q | ISO vaqt; default — hozir (UTC). `period_end_at` = start + **1 oy** |

#### Bepul muddat

```json
{
  "billing_type": "free",
  "free_months": 3,
  "period_start_at": "2026-05-01T00:00:00Z"
}
```

| Maydon | Majburiy | Izoh |
|--------|----------|------|
| `billing_type` | ha | `free` |
| `free_months` | ha | Kamida `1` |
| `period_start_at` | yo‘q | Default — hozir. `period_end_at` = start + **`free_months`** oy |

### Xatoliklar

| HTTP | Sabab |
|------|--------|
| `400` | Noto‘g‘ri `billing_type`, `free_months` &lt; 1, manfiy narx |
| `404` | Do‘kon topilmadi (`GET` da obuna yo‘q ham shu kod) |
| `401` / `403` | Token yoki `general` emas |

---

## Oqim (tavsiya)

1. `PUT /neighborhood-shop-monthly-config` — standart oylik narxni o‘rnating.
2. Yangi do‘kon: `POST /neighborhood_shops` (CRUD hujjat).
3. Obuna: `PUT /neighborhood_shops/{id}/subscription` — `free` (masalan 3 oy) yoki `monthly`.
