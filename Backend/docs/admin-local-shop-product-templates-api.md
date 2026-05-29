# Admin Local Shop Product Templates API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <admin_jwt>
```

Faqat `general` admin.

## Maqsad

Maxalla do'konlari uchun mahsulot shablonlarini CRUD qilish.

Shablon maydonlari:

- `name`
- `description` (delta format JSON string)
- `images` (base64, 1..5 ta; har qanday rasm MIME; base64 qismi ≤ 100 GB; piksel/hajm cheklovi yo‘q)
- `category_id` (parent category ID)
- `subcategory_id` (tanlangan category ichidagi subcategory ID)
- `unit` (`dona | litr | kg`)
- `unit_size`
- `status` (`active | inactive`)

---

## 1) Create

**POST** `/local-shop-product-templates`

```json
{
  "name": "Sut 1L",
  "description": "{\"ops\":[{\"insert\":\"Mahsulot tavsifi\"}]}",
  "images": ["data:image/png;base64,..."],
  "category_id": 1,
  "subcategory_id": 5,
  "unit": "dona",
  "unit_size": "1 litr",
  "status": "active"
}
```

---

## 2) List

**GET** `/local-shop-product-templates?page=1&limit=10`

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

**GET** `/local-shop-product-templates/{id}`

---

## 4) Update

**PUT** `/local-shop-product-templates/{id}`

Body create bilan bir xil formatda.

---

## 5) Update status

**PATCH** `/local-shop-product-templates/{id}/status`

```json
{
  "status": "inactive"
}
```

---

## 6) Delete

**DELETE** `/local-shop-product-templates/{id}`

---

## Xatolar

- `400` - validatsiya xatolari (`category/subcategory`, `unit`, `status`, `images`, `description` va h.k.)
  - `image base64 formati noto'g'ri`
  - `image base64 hajmi 100 GB dan oshmasligi kerak`
- `401/403` - auth yoki role mos emas
- `404` - shablon topilmadi
- `500` - server xatosi
