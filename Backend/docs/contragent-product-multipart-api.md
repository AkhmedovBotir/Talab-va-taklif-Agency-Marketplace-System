# Kontragent mahsulotlar — multipart rasm API

Base URL: `https://api.ttsa.uz/api/v1`

`Authorization: Bearer <contragent_token>` majburiy (faqat o‘z mahsulotlari).

JSON CRUD: `docs/contragent-product-api.md`. **Fayl yuborish** uchun quyidagi endpointlar.

## Qoidalar

| Qoida | Qiymat |
|--------|--------|
| Rasm soni | Yaratish / almashtirish: **1–5** |
| Bitta fayl | **≤ 4 MB**, JPEG/PNG/WebP/GIF |
| Form maydoni | `images` (bir nechta), almashtirishda `image` |
| Moderatsiya | Rasm yoki matn yangilanganda `moderation_status` → `pending` |

Javob: `images[]` (URL) va `image_items[]` (`id`, `url`, `sort_order`).

---

## 1) Yaratish

`POST /contragents/me/products/with-images`

| Maydon | Majburiy |
|--------|----------|
| `name`, `description`, `price`, `original_price` | ha |
| `category_id`, `subcategory_id` | ha |
| `quantity`, `unit`, `unit_size`, `status` | ha |
| `kpi_bonus_percent` | ha (0–100) |
| `images` | ha (1–5 fayl) |

```bash
curl -X POST "https://api.ttsa.uz/api/v1/contragents/me/products/with-images" \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Suv 1L" \
  -F "description=Tavsif" \
  -F "price=12000" \
  -F "original_price=10000" \
  -F "category_id=1" \
  -F "subcategory_id=10" \
  -F "quantity=100" \
  -F "unit=litr" \
  -F "unit_size=1 litr" \
  -F "status=active" \
  -F "kpi_bonus_percent=20" \
  -F "images=@a.jpg"
```

**Javob:** `201`

---

## 2) Tahrir (matn + ixtiyoriy yangi rasmlar)

`PUT /contragents/me/products/{id}/with-images`

- `images` **yuborilmasa** — faqat matn yangilanadi.
- `images` **1–5 fayl** — barcha rasmlar almashtiriladi.
- Har doim `moderation_status = pending`.

---

## 3) Rasmlarni alohida boshqarish

| Metod | Yo‘l | Vazifa |
|--------|------|--------|
| `POST` | `/contragents/me/products/{id}/images` | Qo‘shish (jami ≤ 5) |
| `PUT` | `/contragents/me/products/{id}/images` | Barchasini almashtirish |
| `PUT` | `/contragents/me/products/{id}/images/{imageId}` | Bitta rasmni almashtirish |
| `DELETE` | `/contragents/me/products/{id}/images/{imageId}` | O‘chirish (kamida 1 rasm qoladi) |

`imageId` — `GET /contragents/me/products/{id}` → `image_items[].id`.

---

## 4) JSON API (eski)

| Vazifa | Endpoint |
|--------|----------|
| Fayl bilan yaratish | `POST .../with-images` |
| Fayl bilan tahrir | `PUT .../{id}/with-images` |
| Faqat matn | `PUT .../{id}` (`images` siz) |
| Base64 (legacy) | `POST` / `PUT` JSON — hali ishlaydi |

---

## 5) Frontend

```javascript
const fd = new FormData();
fd.append("name", name);
// ... boshqa maydonlar
files.forEach((f) => fd.append("images", f));

await fetch("/api/v1/contragents/me/products/with-images", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd,
});
```

Rasm URL: `https://api.ttsa.uz/uploads/products/{productId}/1.jpg`

---

## 6) Xatoliklar

- `400` — validatsiya, fayl noto‘g‘ri, 5 tadan ortiq rasm
- `401` — token yo‘q
- `404` — mahsulot yoki rasm topilmadi
