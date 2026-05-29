# Marketplace korzinka API

Foydalanuvchi korzinkasi: faqat **marketplace JWT** bilan.

Base URL: `http://localhost:8081/api/v1`

Barcha so'rovlarda header:

`Authorization: Bearer <marketplace_token>`

---

## Ma'lumotlar

- Har bir foydalanuvchida bir xil `product_id` uchun **bitta** qator (miqdor yangilanadi).
- **POST** yangi mahsulot qo'shadi yoki mavjud qatorda miqdorni **qo'shib**, ombordan oshmasligi uchun cheklaydi.
- **GET** va har bir o'zgarishdan keyin javobda faqat **tasdiqlangan va faol** mahsulotlar; omborda yo'q yoki o'chirilgan mahsulotlar qatorlari avtomatik olib tashlanadi yoki miqdor omborga tenglashtiriladi.

---

## 1) Korzinkani olish

- **Method:** `GET`
- **URL:** `/marketplace/me/cart`

**Javob `data`:** `items` (har biri `id`, `quantity`, `product` — `ProductOutput` maydonlari, jumladan `delivery_areas`), `total_lines`.

---

## 2) Qator qo'shish (yoki miqdorni oshirish)

- **Method:** `POST`
- **URL:** `/marketplace/me/cart/items`

**Body (JSON):**

```json
{
  "product_id": 1,
  "quantity": 2
}
```

`quantity` musbat bo'lishi kerak. Jami miqdor ombordan (`product.quantity`) oshmasligi uchun cheklanadi.

**Javob:** yangilangan to'liq korzinka (xuddi GET kabi).

---

## 3) Qator miqdorini almashtirish

- **Method:** `PUT`
- **URL:** `/marketplace/me/cart/items/{id}`

`{id}` — korzinka qatori `id` si (`items[].id`), mahsulot `id` emas.

**Body:**

```json
{
  "quantity": 5
}
```

`quantity` musbat va ombordagi mavjud miqdordan oshmasligi kerak.

---

## 4) Bitta qatorni o'chirish

- **Method:** `DELETE`
- **URL:** `/marketplace/me/cart/items/{id}`

**Javob:** yangilangan korzinka.

---

## 5) Korzinkani to'liq tozalash

- **Method:** `DELETE`
- **URL:** `/marketplace/me/cart`

**Javob:** bo'sh korzinka (`items: []`, `total_lines: 0`).

---

## Status kodlar

| Kod | Tavsif |
|-----|--------|
| 200 | OK |
| 400 | Noto'g'ri body, miqdor yoki mahsulot mavjud emas (POST) |
| 401 | Token yo'q / yaroqsiz |
| 404 | Korzinka `id` noto'g'ri yoki boshqa foydalanuvchiga tegishli |
| 500 | Server xatoligi |
