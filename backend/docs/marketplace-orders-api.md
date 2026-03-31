# Marketplace buyurtmalar API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <marketplace_token>` barcha endpointlar uchun majburiy.

Modul: `modules/marketplace` (`domain/order.go`, `repository/order_repository.go`, `service/order_service.go`, `handler/order_http.go`).

## Buyurtma holati (`status`)

Hozircha quyidagi qiymatlar ishlatiladi:

| Qiymat | Ma'nosi |
|--------|---------|
| `pending` | Kutilmoqda |
| `cancelled` | Bekor qilingan |
| `delivered` | Yetkazilgan |

Yangi buyurtma yaratilganda holat doim `pending` bo‘ladi. Holatni keyin admin yoki boshqa jarayon o‘zgartirishi mumkin (hozircha API da alohida o‘zgartirish endpointi yo‘q).

## Zaxira (`products.quantity`)

- **Buyurtma yaratilganda** (`POST /orders`, holat `pending`) mahsulot omboridagi `quantity` **darhol kamaytiriladi** (bir tranzaksiyada: buyurtma + qatorlar + zaxira).
- Keyinchalik holat «jarayonda» yoki boshqa statusga o‘tishi uchun alohida API hozircha yo‘q; shuning uchun **qayta ayrilmaydi** — zaxira allaqachon buyurtma paytida yechildi.
- **`pending` buyurtmani bekor qilish** (`PATCH .../cancel`) — har bir qator bo‘yicha `quantity` **qaytarib qo‘yiladi** (xuddi shu tranzaksiyada `cancelled` qilinadi). `delivered` / allaqachon `cancelled` bo‘lsa bekor qilib bo‘lmaydi.

## Manzil qoidalari

1. **Asosiy manzil** — foydalanuvchida `delivery-areas` orqali **asosiy** (`is_default=true`) manzil bo‘lishi shart. Aks holda buyurtma qabul qilinmaydi.
2. **Tanlov** — har bir buyurtmada manzil rejimi (`address.type`) aniq beriladi:
   - `default` — saqlangan **asosiy** manzil ishlatiladi.
   - `delivery_area` — o‘zining boshqa saqlangan manzili (`delivery_area_id` majburiy).
   - `extra` — matnli manzil (`address.text` majburiy, masalan to‘liq manzil matni).
3. **Qo‘shimcha telefon** — `extra_phone` ixtiyoriy, `+998901234567` formatida.
4. **Qo‘shimcha manzil izohi** — `address_note` ixtiyoriy (masalan: «3-podezd, 4-qavat»); tanlangan asosiy/saqlangan manzilga qo‘shimcha sifatida saqlanadi.

## Mahsulotlar

`items` massivida har bir qator:

- `product_id` — tasdiqlangan va faol mahsulot `id`
- `quantity` — miqdor (`> 0`)

Xuddi mahsulot bir necha marta kelsa, server ularni bitta qatorga yig‘adi. Zaxira yetarli bo‘lishi tekshiriladi; muvaffaqiyatli buyurtmada ombordagi `quantity` kamaytiriladi.

## Punkt marshruti (`punkt_routing`)

Har bir buyurtma javobida `punkt_routing` obyekti bor:

| Maydon | Tavsif |
|--------|--------|
| `routing_district_id` | Yetkazib berish **tumani** (`0` — matnli manzil, tuman snapshot yo‘q) |
| `status` | `none` \| `no_punkt` \| `inbox` \| `rejected` \| `contragent_requests_created` |
| `assigned_punkt_id` | Shu tumandagi faol punkt `id` (bo‘lmasa yo‘q) |

**Qoida:** saqlangan manzil (`default` / `delivery_area`) bo‘lsa, tuman `snap` dan olinadi va shu `district_id` bo‘yicha faol punkt qidiriladi; topilsa buyurtma punkt **inbox**iga tushadi. **Matnli manzil** (`extra`) hozircha `routing_district_id = 0`, punkt oqimiga kirmaydi (keyingi bosqichlarda kengaytirish mumkin).

Punkt tomonda API: `docs/punkt-orders-api.md`.

---

## 1) Buyurtma berish

**POST** `/marketplace/me/orders`

### Misol: asosiy manzil

```json
{
  "items": [
    { "product_id": 12, "quantity": 2 },
    { "product_id": 5, "quantity": 1.5 }
  ],
  "extra_phone": "+998901112233",
  "address_note": "3-podezd, domofon 44",
  "address": {
    "type": "default"
  }
}
```

### Misol: boshqa saqlangan manzil

```json
{
  "items": [{ "product_id": 12, "quantity": 1 }],
  "address": {
    "type": "delivery_area",
    "delivery_area_id": 8
  }
}
```

### Misol: matnli manzil

```json
{
  "items": [{ "product_id": 12, "quantity": 1 }],
  "address": {
    "type": "extra",
    "text": "Toshkent, Chilonzor 5-kvartal, 12-uy"
  }
}
```

**Javob:** `201` — `Buyurtma qabul qilindi`; `data` ichida yaratilgan buyurtma (pastdagi struktura).

---

## 2) Buyurtmalar ro‘yxati

**GET** `/marketplace/me/orders?page=1&limit=10`

- `page` — standart: `1`
- `limit` — standart: `10`, maksimum: `100`

`data` tuzilishi:

```json
{
  "items": [ /* OrderOutput */ ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "total_pages": 5
}
```

---

## 3) Bitta buyurtma

**GET** `/marketplace/me/orders/{id}`

Faqat joriy foydalanuvchining o‘z buyurtmasi qaytadi.

`data` ichida qo‘shimcha `roadmap` bloki bor — marketplace va punkt/agent oqimining yo‘l xaritasi:

```json
{
  "roadmap": {
    "created": { "done": true, "at": "2026-03-29T10:09:58Z" },
    "punkt_assigned": { "done": true },
    "punkt_accepted": { "done": true },
    "punkt_rejected": { "done": false },
    "contragent_requests_created": { "done": true },
    "punkt_collected": { "done": true, "at": "2026-03-29T10:11:53Z" },
    "punkt_ready": { "done": true, "at": "2026-03-29T10:12:00Z" },
    "agent_assigned": { "done": true },
    "agent_declared_payment_to_punkt": { "done": true, "at": "2026-03-29T10:17:30Z" },
    "punkt_confirmed_agent_payment": { "done": true, "at": "2026-03-29T10:17:40Z" },
    "punkt_post_payment_delivered": { "done": true, "at": "2026-03-29T10:17:55Z" },
    "punkt_remainder_handed_over": { "done": true, "at": "2026-03-29T10:18:14Z" },
    "delivered": { "done": true },
    "cancelled": { "done": false },
    "current_stage": "delivered"
  }
}
```

---

## 4) Buyurtmani bekor qilish (zaxirani qaytarish)

Foydalanuvchi buyurtmani **faqat `kutilmoqda` (`pending`)** holatida bekor qila oladi. Boshqa jarayonda (`delivered`, boshqa kelajakdagi statuslar) bekor qilish **mumkin emas** — server ham ruxsat bermaydi.

**PATCH** `/marketplace/me/orders/{id}/cancel`

Tana (`body`) kerak emas.

- Faqat **`pending`** bo‘lsa: `status` → `cancelled`, mahsulot zaxiralari buyurtma qatorlari bo‘yicha **qayta oshiriladi**.
- Boshqa holatda: `409` — `faqat kutilmoqdagi buyurtma bekor qilinadi`.

**Javob:** `200` — `Buyurtma bekor qilindi`; `data` yangilangan buyurtma (`status`: `cancelled`).

---

## Javobdagi buyurtma obyekti (`OrderOutput`)

| Maydon | Tavsif |
|--------|--------|
| `id` | Buyurtma ID |
| `status` | `pending` \| `cancelled` \| `delivered` |
| `can_cancel` | `true` faqat `pending` bo‘lsa (klient `PATCH .../cancel` ni shu bo‘yicha ko‘rsatishi mumkin) |
| `punkt_routing` | Yuqoridagi jadval |
| `total_amount` | Jami summa (qatorlar yig‘indisi) |
| `extra_phone` | Bo‘sh bo‘lmasa qo‘shimcha telefon |
| `address_note` | Qo‘shimcha izoh |
| `address` | Manzil blok (quyida) |
| `items` | Qatorlar ro‘yxati |
| `roadmap` | Buyurtma jarayoni yo‘l xaritasi (`done`, ixtiyoriy `at`, va `current_stage`) |
| `created_at`, `updated_at` | ISO8601 vaqt |

### `address` bloki

| `type` | Qaytariladigan maydonlar |
|--------|---------------------------|
| `default` yoki `delivery_area` | `delivery_area_id` (bo‘lishi mumkin), `area_name`, `region_id`, `district_id`, `mfy_id` — buyurtma vaqtidagi snapshot |
| `extra` | `custom_text` — kiritilgan matn manzil |

### `items[]` qatori

| Maydon | Tavsif |
|--------|--------|
| `product_id` | Mahsulot ID |
| `contragent_id` | Kontragent ID |
| `product_name` | Buyurtma vaqtidagi nom (snapshot) |
| `unit_price` | Birlik narxi (snapshot) |
| `quantity` | Miqdor |
| `unit` | O‘lchov birligi |
| `line_total` | `unit_price * quantity` |

### `roadmap` bosqichlari

| Maydon | Ma’nosi |
|--------|---------|
| `created` | Buyurtma yaratilgan |
| `punkt_assigned` | Punkt tayinlangan |
| `punkt_accepted` | Punkt buyurtmani qabul qilgan |
| `punkt_rejected` | Punkt rad etgan |
| `contragent_requests_created` | Kontragent so‘rovlari yaratilgan |
| `punkt_collected` | Punkt yig‘ish bosqichi |
| `punkt_ready` | Punkt tayyorlash bosqichi |
| `agent_assigned` | Agent tayinlangan |
| `agent_declared_payment_to_punkt` | Agent punktga to‘lov e’lon qilgan |
| `punkt_confirmed_agent_payment` | Punkt to‘lovni tasdiqlagan |
| `punkt_post_payment_delivered` | To‘lovdan keyingi punkt yetkazish bajarilgan |
| `punkt_remainder_handed_over` | Kontragentlarga qolgan qism topshirilgan |
| `delivered` | Marketplace holati `delivered` |
| `cancelled` | Marketplace holati `cancelled` |
| `current_stage` | Hozirgi asosiy bosqich kodi |

---

## Status kodlar

- `200` — muvaffaqiyatli o‘qish / bekor qilish
- `201` — buyurtma yaratildi
- `400` — validatsiya yoki manzil/mahsulot xatosi
- `401` — token yo‘q / yaroqsiz
- `404` — buyurtma topilmadi yoki boshqa foydalanuvchiga tegishli
- `409` — zaxira yetarli emas (`mahsulot zaxirasi yetarli emas`) yoki bekor qilish mumkin emas (`faqat kutilmoqdagi buyurtma bekor qilinadi`)
- `500` — server xatosi (jumladan zaxirani qaytarishda mahsulot qatori topilmasa)

---

## Tavsiya etilgan tartib

1. Profil va `delivery-areas` orqali kamida bitta manzil; iloji bo‘lsa asosiy manzilni belgilash (`PATCH .../set-default`).
2. Korzinka yoki to‘g‘ridan-to‘g‘ri `items` bilan `POST /orders`.
3. Ro‘yxat va bitta buyurtma uchun `GET` endpointlari.
4. Kerak bo‘lsa `PATCH /orders/{id}/cancel` bilan `pending` buyurtmani bekor qilish.

Batafsil yetkazib berish hududlari: `docs/marketplace-delivery-area-api.md`.
