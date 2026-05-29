# Admin — maxalla do'koni mahsulotlari API

Base URL: `http://localhost:8081/api/v1`

Auth:

```http
Authorization: Bearer <admin_jwt>
```

Faqat `general` role.

## Maqsad

Maxalla do'koni admin yaratgan **shablon**dan o'ziga mahsulot biriktirganda ma'lumot `local_shop_products` jadvaliga yoziladi. Ushbu API admin paneli uchun shu mahsulotlarni ko'rish (GET) imkonini beradi.

**Eslatma:** Bu endpoint faqat o'qish (read-only). Yaratish/tahrirlash maxalla do'koni o'zi qiladi: `POST/PUT/DELETE /local-shops/me/products` (qarang: `docs/local-shops-products-api.md`).

Shablonlarni boshqarish: `docs/admin-local-shop-product-templates-api.md`.

## NoAuth API bilan farqi

| | Admin (`/local-shop-products`) | NoAuth (`/noauth/local-shop-products`) |
|---|-------------------------------|----------------------------------------|
| Auth | Admin JWT, `general` | Yo'q |
| Do'kon/shablon statusi | Barchasi (filter ixtiyoriy) | Faqat `active` do'kon + `active` shablon |
| Qo'shimcha filterlar | `region_id`, `template_id`, `shop_status`, `template_status` | Yo'q |
| Javobda `status` | Do'kon va shablon `status` qaytadi | `status` yo'q |
| Vaqt | `created_at`, `updated_at` | Yo'q |

---

## 1) Ro'yxat

**GET** `/local-shop-products`

### Query parametrlar

| Param | Majburiy | Default | Tavsif |
|-------|----------|---------|--------|
| `page` | yo'q | `1` | Sahifa |
| `limit` | yo'q | `10` | Limit (max `100`) |
| `q` | yo'q | — | Shablon nomi yoki do'kon nomi bo'yicha qidiruv (`ILIKE`) |
| `local_shop_id` | yo'q | — | Bitta maxalla do'koni (`neighborhood_shops.id`) |
| `template_id` | yo'q | — | Bitta shablon (`local_shop_product_templates.id`) |
| `region_id` | yo'q | — | Viloyat bo'yicha filter |
| `district_id` | yo'q | — | Tuman bo'yicha filter |
| `mfy_id` | yo'q | — | MFY bo'yicha filter (do'kon manzili MFY) |
| `shop_status` | yo'q | — | `active` yoki `inactive` |
| `template_status` | yo'q | — | `active` yoki `inactive` |

Filterlar bir vaqtda berilishi mumkin (AND mantiqida).

### Misol so'rovlar

```http
GET /local-shop-products?page=1&limit=20
GET /local-shop-products?local_shop_id=3
GET /local-shop-products?template_id=12&template_status=active
GET /local-shop-products?district_id=12&q=sut
GET /local-shop-products?region_id=1&shop_status=active
```

### Muvaffaqiyatli javob (200)

```json
{
  "success": true,
  "message": "Maxalla do'koni mahsulotlari ro'yxati olindi",
  "data": {
    "items": [
      {
        "id": 7,
        "local_shop_id": 3,
        "template_id": 12,
        "quantity": 25,
        "price": 15000,
        "original_price": 17000,
        "created_at": "2026-05-27T10:15:00+05:00",
        "updated_at": "2026-05-27T10:15:00+05:00",
        "template": {
          "id": 12,
          "name": "Shakar",
          "description": "{\"ops\":[{\"insert\":\"...\"}]}",
          "category_id": 2,
          "subcategory_id": 9,
          "unit": "kg",
          "unit_size": "1",
          "status": "active",
          "images": ["data:image/jpeg;base64,..."]
        },
        "shop": {
          "id": 3,
          "name": "Navro'z do'koni",
          "status": "active",
          "region_id": 1,
          "district_id": 12,
          "mfy_id": 144,
          "phone": "+998901112233"
        },
        "delivery_areas": [
          { "mfy_id": 144, "mfy_name": "Yangi hayot" },
          { "mfy_id": 145, "mfy_name": "Do'stlik" }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

### `items[]` maydonlari

**Mahsulot (do'kon zaxirasi):**

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `id` | number | `local_shop_products.id` |
| `local_shop_id` | number | Qaysi do'konga tegishli |
| `template_id` | number | Qaysi shablondan olingan |
| `quantity` | number | Qoldiq miqdori |
| `price` | number | Sotuv narxi |
| `original_price` | number | Eski / chizilgan narx |
| `created_at` | string (ISO8601) | Yaratilgan vaqt |
| `updated_at` | string (ISO8601) | Yangilangan vaqt |

**`template`:** admin shabloni (`local_shop_product_templates` + `images`).

**`shop`:** maxalla do'koni (`neighborhood_shops`).

**`delivery_areas`:** do'konning yetkazish MFYlari (`local_shop_service_areas` + `mfies.name`). Bo'sh bo'lsa `[]`.

---

## 2) Bitta mahsulot

**GET** `/local-shop-products/{id}`

`{id}` — `local_shop_products.id`.

### Muvaffaqiyatli javob (200)

```json
{
  "success": true,
  "message": "Maxalla do'koni mahsuloti olindi",
  "data": {
    "id": 7,
    "local_shop_id": 3,
    "template_id": 12,
    "quantity": 25,
    "price": 15000,
    "original_price": 17000,
    "created_at": "2026-05-27T10:15:00+05:00",
    "updated_at": "2026-05-27T10:15:00+05:00",
    "template": { },
    "shop": { },
    "delivery_areas": []
  }
}
```

(`template`, `shop`, `delivery_areas` tuzilishi ro'yxatdagi bilan bir xil.)

---

## Status kodlar

| Kod | Holat |
|-----|--------|
| `200` | OK |
| `400` | Query param noto'g'ri (`local_shop_id`, `template_id`, `region_id`, `district_id`, `mfy_id`, `shop_status`, `template_status`) yoki `id` noto'g'ri |
| `401` | Token yo'q yoki yaroqsiz |
| `403` | Admin `general` emas |
| `404` | Mahsulot topilmadi (`maxalla do'koni mahsuloti topilmadi`) |
| `500` | Server xatosi |

---

## Bog'liq API lar

- Shablonlar (admin CRUD): `docs/admin-local-shop-product-templates-api.md`
- Maxalla do'koni (admin CRUD): `docs/neighborhood-shop-api.md`
- Do'kon o'zi mahsulot qo'shadi: `docs/local-shops-products-api.md`
- Marketplace (ochiq ro'yxat): `docs/noauth/local-shop-products-api.md`
- O'chirilgan do'kon arxivi: `docs/admin-arxiv-api.md` (`related.local_shop_products`)
