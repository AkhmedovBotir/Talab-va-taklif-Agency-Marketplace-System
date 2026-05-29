# Maxalla do'koni — xizmat ruxsati API

Base URL: `http://localhost:8081/api/v1`

Mahalliy do'kon ilovasi **bitta** asosiy tekshiruv nuqtasi va server tomonida **barcha** `/local-shops/me/*` (shu endpointdan tashqari) marshrutlarida majburiy blok.

Auth: `Authorization: Bearer <local_shop_jwt>`

---

## 1) Holatni ko'rish

`GET /local-shops/me/service-access`

### Ruxsat bor (`200`)

```json
{
  "message": "Bepul xizmat muddati faol",
  "data": {
    "can_operate": true,
    "message": "Bepul xizmat muddati faol",
    "reason": "active",
    "billing_type": "free",
    "free_months": 3,
    "period_start_at": "2026-05-01T00:00:00Z",
    "period_end_at": "2026-08-01T00:00:00Z",
    "is_in_free_period": true
  }
}
```

Oylik obuna bo'lsa: `billing_type`: `monthly`, `message`: `"Oylik xizmat muddati faol"`.

### Ruxsat yo'q (`403`)

```json
{
  "message": "Xizmat muddati tugagan. Davom etish uchun admin bilan bog'laning.",
  "data": {
    "can_operate": false,
    "message": "Xizmat muddati tugagan. Davom etish uchun admin bilan bog'laning.",
    "reason": "period_expired",
    "billing_type": "free",
    "free_months": 3,
    "period_start_at": "2026-05-01T00:00:00Z",
    "period_end_at": "2026-08-01T00:00:00Z"
  }
}
```

Obuna bo'lsa yoki bo'lmasa, **mumkin bo'lganda** `period_start_at` / `period_end_at` / `billing_type` / `free_months` qaytariladi.

### `reason` qiymatlari

| `reason` | Ma'nosi |
|----------|---------|
| `active` | Hozir ishlay oladi |
| `shop_inactive` | Admin `status=inactive` qilgan |
| `no_subscription` | Obuna yozuvi yo'q |
| `period_not_started` | `period_start_at` hali kelmagan |
| `period_expired` | `period_end_at` o'tgan |

---

## 2) Boshqa API lar (avtomatik blok)

`/local-shops/me` ostidagi **barcha** endpointlar (buyurtmalar, mahsulotlar, kuryerlar, bildirishnomalar, profil, logo va hokazo) xuddi shu qoidani qo'llaydi:

- Obuna muddati tugagan / yo'q / do'kon faol emas → **`403`** + yuqoridagi `data` struktura + `message` matni.
- **Istisno:** faqat `GET /local-shops/me/service-access` — har doim ishlaydi (holatni ko'rsatish uchun).

Login va parol oqimi (`/local-shops/auth/*`) bloklanmaydi.

---

## Admin bilan bog'liqlik

Obuna admin tomonidan beriladi: `docs/admin-neighborhood-shop-billing-api.md`.

## Avtomatik eslatmalar (notification)

Server har soat tekshiradi: obuna muddati tugashiga **3, 2 yoki 1 kun** qolganda do'konga `warning` turidagi xabar yuboriladi.

- Mavjud `/local-shops/me/notifications` API orqali ko'rinadi (yangi endpoint yo'q).
- Har bir eslatma faqat tegishli do'konga (`neighborhood_shop_id` bilan).
- Bir muddat uchun har kunlik eslatma bir marta (`3`, `2`, `1` alohida).
- Obuna yangilansa (`period_end_at` o'zgarsa) yangi muddat uchun eslatmalar qayta yuboriladi.
