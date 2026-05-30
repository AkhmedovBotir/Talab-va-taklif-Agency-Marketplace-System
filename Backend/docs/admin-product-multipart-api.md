# Admin mahsulotlar — multipart rasm API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <admin_token>` majburiy (`general` admin).

JSON CRUD (`docs/admin-product-api.md`) saqlanadi. **Yangi mahsulotlar va rasmlar uchun** quyidagi multipart endpointlardan foydalaning — frontend `FormData` bilan fayl yuboradi, server diskda saqlaydi va javobda **to‘liq URL** qaytaradi.

## Umumiy qoidalar

| Qoida | Qiymat |
|--------|--------|
| Rasm soni | Yaratish / almashtirish: **1–5**; qo‘shish: jami **≤ 5** |
| Bitta fayl hajmi | **≤ 4 MB** |
| Formatlar | JPEG, PNG, WebP, GIF |
| Form maydon nomi (bir nechta fayl) | `images` |
| Bitta fayl (almashtirish) | `image` yoki `images[0]` |
| `Content-Type` | `multipart/form-data` |

### Javobdagi rasm maydonlari

- `images` — URL lar massivi (`img src` uchun).
- `image_items` — batafsil: `{ "id", "url", "sort_order" }` (o‘chirish / almashtirish uchun `id` kerak).

---

## 1) Mahsulot yaratish (matn + rasmlar)

`POST /products/with-images`

**Form maydonlari** (hammasi matn, `application/x-www-form-urlencoded` emas — `multipart` ichida):

| Maydon | Majburiy | Turi |
|--------|----------|------|
| `contragent_id` | ha | butun son |
| `name` | ha | string |
| `description` | ha | string |
| `price` | ha | float |
| `original_price` | ha | float |
| `category_id` | ha | butun son |
| `subcategory_id` | ha | butun son |
| `quantity` | ha | float |
| `unit` | ha | `dona` \| `litr` \| `kg` |
| `unit_size` | ha | string |
| `status` | ha | `active` \| `inactive` |
| `kpi_bonus_percent` | ha | 0–100 |
| `images` | ha | 1–5 ta fayl |

**Misol (curl):**

```bash
curl -X POST "http://localhost:8081/api/v1/products/with-images" \
  -H "Authorization: Bearer TOKEN" \
  -F "contragent_id=1" \
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
  -F "images=@/path/a.jpg" \
  -F "images=@/path/b.jpg"
```

**Javob:** `201` — mahsulot obyekti (`moderation_status`: `pending`).

---

## 2) Mahsulot tahriri (matn; ixtiyoriy yangi rasmlar)

`PUT /products/{id}/with-images`

- Form maydonlari — yaratish bilan bir xil (matn qismi).
- `images` fayllari **ixtiyoriy**:
  - **Yuborilmasa** — faqat matn maydonlari yangilanadi, rasmlar o‘zgarmaydi.
  - **1–5 fayl yuborilsa** — barcha eski rasmlar o‘chiriladi va yangilari bilan **to‘liq almashtiriladi**.

JSON tahrir (`PUT /products/{id}`) ham ishlaydi: `images` yuborilmasa rasmlar tegilmaydi; base64/URL yuborilsa — `admin-product-api.md` dagi qoidalar.

---

## 3) Rasmlarni alohida boshqarish

### Qo‘shish

`POST /products/{id}/images`

- `images`: 1 yoki bir nechta fayl.
- Jami rasm **5 tadan oshmasligi** kerak.

### Barchasini almashtirish

`PUT /products/{id}/images`

- `images`: 1–5 fayl (eski rasmlar diskdan ham o‘chiriladi).

### Bitta rasmni almashtirish

`PUT /products/{id}/images/{imageId}`

- `image` yoki `images` — **bitta** fayl.
- `imageId` — `GET /products/{id}` javobidagi `image_items[].id`.

### Bitta rasmni o‘chirish

`DELETE /products/{id}/images/{imageId}`

- Mahsulotda **kamida 1 ta rasm** qolishi shart (oxirgi rasmni o‘chirib bo‘lmaydi → `400`).

### Mahsulotni butunlay o‘chirish

`DELETE /products/{id}` — JSON API bilan bir xil; `uploads/products/{id}/` papkasi ham tozalanadi.

---

## 4) Frontend (FormData) misol

```javascript
const fd = new FormData();
fd.append("contragent_id", "1");
fd.append("name", "Suv 1L");
// ... boshqa maydonlar
for (const file of selectedFiles) {
  fd.append("images", file);
}
await fetch("/api/v1/products/with-images", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd,
});
```

Rasm o‘chirish:

```javascript
await fetch(`/api/v1/products/${productId}/images/${imageId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 5) Xatoliklar

| HTTP | Xabar (namuna) |
|------|----------------|
| `400` | `images 1 tadan 5 tagacha bo'lishi kerak` |
| `400` | `kamida bitta rasm (images) kerak` |
| `400` | `rasm fayli noto'g'ri yoki qo'llab-quvvatlanmaydi` |
| `400` | `bitta rasm 4 MB dan oshmasligi kerak` |
| `404` | `mahsulot topilmadi` / `rasm topilmadi` |

---

## 6) JSON API bilan farq

| Vazifa | Tavsiya |
|--------|---------|
| Yangi mahsulot + fayllar | `POST /products/with-images` |
| Tahrir + yangi fayllar to‘plami | `PUT /products/{id}/with-images` |
| Faqat matn | `PUT /products/{id}` (JSON, `images` siz) |
| Bitta rasm o‘chirish / almashtirish | `DELETE` / `PUT .../images/{imageId}` |
| Eski integratsiya (base64) | `POST` / `PUT` JSON — hali qo‘llab-quvvatlanadi |

Rasm URL prefiksi: `APP_BASE_URL` + `/uploads/products/{productId}/...` (server `uploads` papkasini static qilib beradi).
