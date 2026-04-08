# Local Shops Products API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <local_shop_jwt>
```

Bu endpointlar maxalla do'koni uchun mahsulot CRUD.

Mahsulot maydonlari:

- `template_id` (admin yaratgan `active` shablondan biri)
- `quantity`
- `price`
- `original_price`

---

## 1) Create product

**POST** `/local-shops/me/products`

```json
{
  "template_id": 3,
  "quantity": 50,
  "price": 12000,
  "original_price": 10000
}
```

Javobda `template` ham qaytadi (`name`, `description`, `images`, `category_id`, `subcategory_id`, `unit`, `unit_size`).

---

## 2) List products

**GET** `/local-shops/me/products?page=1&limit=10`

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

---

## 3) Get by ID

**GET** `/local-shops/me/products/{id}`

Faqat o'ziga tegishli mahsulotni ko'radi.

---

## 4) Update product

**PUT** `/local-shops/me/products/{id}`

```json
{
  "template_id": 4,
  "quantity": 30,
  "price": 15000,
  "original_price": 12000
}
```

---

## 5) Delete product

**DELETE** `/local-shops/me/products/{id}`

---

## Validatsiya

- `template_id` mavjud va `active` bo'lishi kerak
- `quantity > 0`
- `price > 0`
- `original_price > 0`

---

## Status kodlar

- `200` — OK
- `201` — Created
- `400` — noto'g'ri input
- `401` — token yaroqsiz
- `404` — mahsulot topilmadi
- `500` — server xatosi
