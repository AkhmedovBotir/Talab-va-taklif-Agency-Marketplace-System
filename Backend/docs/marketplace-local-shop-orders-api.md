# Marketplace Maxalla Buyurtmalar API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <marketplace_token>` barcha endpointlar uchun majburiy.

Bu API `maxalla savatchasi`dan buyurtma yaratadi. Buyurtma berishda foydalanuvchi `noauth/local-shops` dan tanlangan do'kon `id` sini yuborishi shart.

## Muhim qoidalar

- `local_shop_id` majburiy.
- Buyurtmaga faqat savatchadagi **shu do'konga tegishli** qatorlar kiradi.
- Agar tanlangan do'kon bo'yicha savatchada mahsulot bo'lmasa: `400`.
- Yaratilganda mahsulot zaxirasi (`local_shop_products.quantity`) kamayadi.
- Bekor qilinganda (`pending` bo'lsa) zaxira qaytariladi.

## 1) Buyurtma yaratish

- **POST** `/marketplace/me/local-shop-orders`

```json
{
  "local_shop_id": 3,
  "extra_phone": "+998901112233",
  "address_note": "3-podezd, domofon 44",
  "address": {
    "type": "default"
  }
}
```

`address.type` qiymatlari:
- `default`
- `delivery_area` (`delivery_area_id` majburiy)
- `extra` (`text` majburiy)

Javob: `201` — yaratilgan buyurtma.

## 2) Buyurtmalar ro'yxati

- **GET** `/marketplace/me/local-shop-orders?page=1&limit=10`

Javob:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

## 3) Bitta buyurtma

- **GET** `/marketplace/me/local-shop-orders/{id}`

## 4) Buyurtmani bekor qilish

- **PATCH** `/marketplace/me/local-shop-orders/{id}/cancel`

Faqat `pending` holatdagi buyurtma bekor qilinadi.

## Buyurtma obyektidagi asosiy maydonlar

- `id`, `local_shop_id`, `status`, `can_cancel`, `total_amount`
- `extra_phone`, `address_note`
- `address` (snapshot yoki `custom_text`)
- `items[]` (`local_shop_product_id`, `template_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
- `created_at`, `updated_at`

## Status kodlar

- `200` — OK
- `201` — Created
- `400` — validatsiya xatosi (`local_shop_id` yo'q, manzil noto'g'ri, savatcha bo'sh, va h.k.)
- `401` — token yaroqsiz
- `404` — buyurtma topilmadi
- `409` — zaxira yetarli emas yoki `pending` bo'lmagan buyurtmani bekor qilish
- `500` — server xatoligi
