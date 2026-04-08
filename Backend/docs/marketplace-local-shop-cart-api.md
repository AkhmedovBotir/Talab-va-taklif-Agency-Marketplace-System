# Marketplace Maxalla Savatchasi API

Marketplace foydalanuvchi uchun alohida **maxalla savatchasi**.

Base URL: `http://localhost:8081/api/v1`

Barcha so'rovlarda header:

`Authorization: Bearer <marketplace_token>`

## Ma'lumotlar

- Har bir foydalanuvchida bir xil `local_shop_product_id` uchun bitta qator bo'ladi.
- POST mavjud bo'lsa miqdorni oshiradi, ammo mahsulot omboridan oshirmaydi.
- GET va o'zgarishlardan keyin javobda:
  - maxalla mahsulot ma'lumotlari,
  - shablon ma'lumotlari (`images` bilan),
  - do'kon ma'lumotlari,
  - do'kon yetkazib berish hududlari (`delivery_areas`)
  qaytadi.

## 1) Savatchani olish

- **GET** `/marketplace/me/local-shop-cart`

## 2) Savatchaga qo'shish (yoki miqdorni oshirish)

- **POST** `/marketplace/me/local-shop-cart/items`

```json
{
  "local_shop_product_id": 10,
  "quantity": 2
}
```

## 3) Qator miqdorini yangilash

- **PUT** `/marketplace/me/local-shop-cart/items/{id}`

`{id}` — savatcha qatori `id` (product id emas).

```json
{
  "quantity": 5
}
```

## 4) Bitta qatorni o'chirish

- **DELETE** `/marketplace/me/local-shop-cart/items/{id}`

## 5) Savatchani tozalash

- **DELETE** `/marketplace/me/local-shop-cart`

Javob: bo'sh savatcha (`items: []`, `total_lines: 0`).

## Status kodlar

| Kod | Tavsif |
|-----|--------|
| 200 | OK |
| 400 | Noto'g'ri body, miqdor yoki mahsulot sotuvda emas |
| 401 | Token yo'q / yaroqsiz |
| 404 | Savatcha qatori topilmadi |
| 500 | Server xatoligi |
