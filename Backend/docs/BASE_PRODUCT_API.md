# Base Product API Dokumentatsiyasi

Bu dokumentatsiya Admin tomonidan asosiy maxsulotlarni boshqarish uchun API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/admin/base-products`

**Eslatma:** Bu API faqat Adminlar uchun ishlaydi. Maxalla dokonlari uchun `/api/maxalla-contragents/products` API dan foydalaning.

---

## Munda

1. [Asosiy Maxsulot Yaratish](#asosiy-maxsulot-yaratish)
2. [Barcha Asosiy Maxsulotlarni Olish](#barcha-asosiy-maxsulotlarni-olish)
3. [Asosiy Maxsulotni ID bo'yicha Olish](#asosiy-maxsulotni-id-boyicha-olish)
4. [Asosiy Maxsulotni Yangilash](#asosiy-maxsulotni-yangilash)
5. [Asosiy Maxsulotni O'chirish](#asosiy-maxsulotni-ochirish)
6. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
7. [Xato Kodlari](#xato-kodlari)
8. [Validatsiya Qoidalari](#validatsiya-qoidalari)
9. [Misollar](#misollar)

---

## Asosiy Maxsulot Yaratish

```
POST /api/admin/base-products
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "name": "Maxsulot Nomi",
  "description": "Maxsulot tavsifi (ixtiyoriy)",
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  ],
  "category": "507f1f77bcf86cd799439011",
  "subcategory": "507f1f77bcf86cd799439012",
  "unit": "dona",
  "unitSize": 1,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asosiy maxsulot muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Maxsulot Nomi",
    "description": "Maxsulot tavsifi",
    "images": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ],
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Kategoriya Nomi",
      "slug": "kategoriya-nomi"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sub Kategoriya Nomi",
      "slug": "sub-kategoriya-nomi"
    },
    "unit": "dona",
    "unitSize": 1,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Admin Nomi",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Muvaffaqiyatli yaratildi
- `400` - Validatsiya xatosi
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `500` - Server xatosi

---

## Barcha Asosiy Maxsulotlarni Olish

```
GET /api/admin/base-products
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)
- `category` (optional): Filter by category ID
- `subcategory` (optional): Filter by subcategory ID
- `search` (optional): Search by name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Maxsulot Nomi",
      "description": "Maxsulot tavsifi",
      "images": ["..."],
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kategoriya Nomi",
        "slug": "kategoriya-nomi"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sub Kategoriya Nomi",
        "slug": "sub-kategoriya-nomi"
      },
      "unit": "dona",
      "unitSize": 1,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439010",
        "name": "Admin Nomi",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `500` - Server xatosi

---

## Asosiy Maxsulotni ID bo'yicha Olish

```
GET /api/admin/base-products/:id
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Maxsulot Nomi",
    "description": "Maxsulot tavsifi",
    "images": ["..."],
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Kategoriya Nomi",
      "slug": "kategoriya-nomi"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sub Kategoriya Nomi",
      "slug": "sub-kategoriya-nomi"
    },
    "unit": "dona",
    "unitSize": 1,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Admin Nomi",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri asosiy maxsulot ID
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `404` - Asosiy maxsulot topilmadi
- `500` - Server xatosi

---

## Asosiy Maxsulotni Yangilash

```
PUT /api/admin/base-products/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "name": "Yangilangan Nomi",
  "description": "Yangilangan tavsif",
  "images": ["..."],
  "category": "507f1f77bcf86cd799439011",
  "subcategory": "507f1f77bcf86cd799439012",
  "unit": "kg",
  "unitSize": 2.5,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asosiy maxsulot yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Yangilangan Nomi",
    "description": "Yangilangan tavsif",
    "images": ["..."],
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Kategoriya Nomi",
      "slug": "kategoriya-nomi"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sub Kategoriya Nomi",
      "slug": "sub-kategoriya-nomi"
    },
    "unit": "kg",
    "unitSize": 2.5,
    "status": "active",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli yangilandi
- `400` - Validatsiya xatosi
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `404` - Asosiy maxsulot topilmadi
- `500` - Server xatosi

---

## Asosiy Maxsulotni O'chirish

```
DELETE /api/admin/base-products/:id
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Asosiy maxsulot o'chirildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli o'chirildi
- `400` - Bu asosiy maxsulot maxalla dokonlarida ishlatilmoqda
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `404` - Asosiy maxsulot topilmadi
- `500` - Server xatosi

**Eslatma:** Agar asosiy maxsulot maxalla dokonlarida ishlatilayotgan bo'lsa, o'chirish mumkin emas. Avval maxalla dokonlaridagi maxsulotlarni o'chirish kerak.

---

## Ma'lumotlar Strukturasi

### BaseProduct Ob'ekti

```typescript
interface BaseProduct {
  _id: string;                    // ObjectId
  name: string;                   // 2-500 belgi
  description: string | object | null;  // Tavsif (Delta format yoki string)
  images: string[];              // Base64 formatdagi rasmlar (max 5)
  category: Category;            // Kategoriya ob'ekti
  subcategory: Category | null;  // Sub kategoriya ob'ekti
  unit: "dona" | "litr" | "kg"; // Birlik
  unitSize: number | null;       // Birlik o'lchami
  status: "active" | "inactive"; // Status
  createdBy: Admin;              // Yaratgan admin
  createdAt: Date;               // Yaratilgan sana
  updatedAt: Date;               // Yangilangan sana
}
```

---

## Xato Kodlari

| Kod | Xabar | Tavsif |
|-----|-------|--------|
| 200 | OK | Muvaffaqiyatli so'rov |
| 201 | Created | Muvaffaqiyatli yaratildi |
| 400 | Bad Request | Validatsiya xatosi yoki noto'g'ri so'rov |
| 401 | Unauthorized | Autentifikatsiya talab qilinadi |
| 403 | Forbidden | Bu funksiya faqat Adminlar uchun |
| 404 | Not Found | Asosiy maxsulot topilmadi |
| 500 | Internal Server Error | Server xatosi |

---

## Validatsiya Qoidalari

### Name
- Kamida 2 ta belgi
- Maksimal 500 ta belgi
- Required (create)

### Description
- String, object yoki null bo'lishi mumkin
- Optional

### Images
- Array, maksimal 5 ta rasm
- Har bir rasm base64 formatida bo'lishi kerak
- Format: `data:image/png;base64,...` yoki `data:image/jpeg;base64,...`
- Optional

### Category
- Category ID bo'lishi kerak
- Category faol bo'lishi kerak
- Category Admin tomonidan yaratilgan bo'lishi kerak
- Category top-level bo'lishi kerak (parent yo'q)
- Required (create)

### Subcategory
- Subcategory ID bo'lishi kerak
- Subcategory faol bo'lishi kerak
- Subcategory tanlangan kategoriyaga tegishli bo'lishi kerak
- Optional

### Unit
- `dona`, `litr` yoki `kg` bo'lishi kerak
- Required (create)

### UnitSize
- 0 dan katta yoki teng bo'lishi kerak
- Optional

### Status
- `active` yoki `inactive` bo'lishi kerak
- Default: `active`

---

## Misollar

### Asosiy Maxsulot Yaratish

```bash
curl -X POST https://api.example.com/api/admin/base-products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Olma",
    "description": "Qizil olma",
    "images": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ],
    "category": "507f1f77bcf86cd799439011",
    "subcategory": "507f1f77bcf86cd799439012",
    "unit": "kg",
    "unitSize": 1,
    "status": "active"
  }'
```

### Barcha Asosiy Maxsulotlarni Olish

```bash
curl -X GET "https://api.example.com/api/admin/base-products?status=active&page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

### Asosiy Maxsulotni Yangilash

```bash
curl -X PUT https://api.example.com/api/admin/base-products/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Yangilangan Olma",
    "unitSize": 2
  }'
```

### Asosiy Maxsulotni O'chirish

```bash
curl -X DELETE https://api.example.com/api/admin/base-products/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer {token}"
```

### JavaScript/Fetch Misollari

```javascript
// Asosiy maxsulot yaratish
const createBaseProduct = async (token, productData) => {
  const response = await fetch('https://api.example.com/api/admin/base-products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await response.json();
};

// Barcha asosiy maxsulotlarni olish
const getAllBaseProducts = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`https://api.example.com/api/admin/base-products?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Asosiy maxsulotni yangilash
const updateBaseProduct = async (token, productId, updateData) => {
  const response = await fetch(`https://api.example.com/api/admin/base-products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  return await response.json();
};

// Asosiy maxsulotni o'chirish
const deleteBaseProduct = async (token, productId) => {
  const response = await fetch(`https://api.example.com/api/admin/base-products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};
```

---

## Qo'shimcha Ma'lumotlar

- **Maxalla Dokoni Maxsulotlari API:** [Maxalla Dokoni API Documentation](./MAXALLA_DOKONI_API.md)
- **Admin Maxalla Maxsulotlari API:** [Admin Maxalla Products API Documentation](./ADMIN_MAXALLA_PRODUCTS_API.md)
- **Umumiy API:** [API Documentation](./API.md)

---

**Dokumentatsiya versiyasi:** 1.0  
**Yaratilgan sana:** 2024  
**Yangilangan sana:** 2024
