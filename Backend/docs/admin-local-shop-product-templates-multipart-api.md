# Admin mahsulot shablonlari — multipart rasm API

Base URL: `https://api.ttsa.uz/api/v1`

`Authorization: Bearer <admin_token>` (`general` admin).

JSON CRUD: `docs/admin-local-shop-product-templates-api.md`.

## Qoidalar

| Qoida | Qiymat |
|--------|--------|
| Rasm soni | 1–5 |
| Bitta fayl | ≤ 4 MB (JPEG, PNG, WebP, GIF) |
| Form maydoni | `images` |
| Disk yo‘li | `uploads/templates/{id}/1.jpg` |
| Javob URL | `https://api.ttsa.uz/uploads/templates/{id}/...` |

Javob: `images[]` va `image_items[]` (`id`, `url`, `sort_order`).

---

## Endpointlar

Baza: `/local-shop-product-templates`

| Metod | Yo‘l | Vazifa |
|--------|------|--------|
| `POST` | `/with-images` | Yaratish |
| `PUT` | `/:id/with-images` | Tahrir (`images` ixtiyoriy) |
| `POST` | `/:id/images` | Rasm qo‘shish |
| `PUT` | `/:id/images` | Barchasini almashtirish |
| `PUT` | `/:id/images/:imageId` | Bitta rasmni almashtirish |
| `DELETE` | `/:id/images/:imageId` | O‘chirish (≥1 rasm qoladi) |

### Form maydonlari (matn)

`name`, `description`, `category_id`, `subcategory_id`, `unit`, `unit_size`, `status`

### Misol (curl)

```bash
curl -X POST "https://api.ttsa.uz/api/v1/local-shop-product-templates/with-images" \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Sut 1L" \
  -F "description=Tavsif" \
  -F "category_id=1" \
  -F "subcategory_id=5" \
  -F "unit=dona" \
  -F "unit_size=1 litr" \
  -F "status=active" \
  -F "images=@a.jpg"
```

---

## JSON tahrir

`PUT /local-shop-product-templates/{id}` — `images` **ixtiyoriy** (yuborilmasa rasmlar o‘zgarmaydi).

---

## Deploy eslatmalari

- nginx: `client_max_body_size 32M;`
- `.env`: `APP_BASE_URL`, `UPLOAD_DIR`
- `GET /api/v1/meta/build` → `local_shop_template_multipart: true`
