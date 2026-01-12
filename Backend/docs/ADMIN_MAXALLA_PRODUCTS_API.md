# Admin Maxalla Maxsulotlari API Dokumentatsiyasi

Bu dokumentatsiya Admin tomonidan Maxalla kontragentlar tomonidan yaratilgan maxsulotlarni ko'rish uchun API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/admin/maxalla-products`

**Eslatma:** Bu API faqat Adminlar uchun va faqat ko'rish (GET) operatsiyalarini o'z ichiga oladi. Maxalla kontragentlar o'z maxsulotlarini `/api/maxalla-contragents/products` API orqali boshqaradi.

---

## Munda

1. [Barcha Maxalla Maxsulotlarini Olish](#barcha-maxalla-maxsulotlarini-olish)
2. [Maxalla Maxsulotni ID bo'yicha Olish](#maxalla-maxsulotni-id-boyicha-olish)
3. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
4. [Xato Kodlari](#xato-kodlari)
5. [Filtrlar va Qidiruv](#filtrlar-va-qidiruv)
6. [Misollar](#misollar)

---

## Barcha Maxalla Maxsulotlarini Olish

```
GET /api/admin/maxalla-products
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)
- `category` (optional): Filter by base product category ID
- `subcategory` (optional): Filter by base product subcategory ID
- `contragent` (optional): Filter by contragent ID (maxalla kontragent)
- `search` (optional): Search by base product name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "baseProduct": {
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
        "status": "active"
      },
      "contragent": {
        "_id": "507f1f77bcf86cd799439010",
        "name": "Maxalla Dokoni Nomi",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "1001"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Olmazor MFY",
          "type": "mfy",
          "code": "100101"
        },
        "contragentLevel": "mfy",
        "status": "active"
      },
      "quantity": 100,
      "price": 15000,
      "originalPrice": 20000,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `500` - Server xatosi

---

## Maxalla Maxsulotni ID bo'yicha Olish

```
GET /api/admin/maxalla-products/:id
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "baseProduct": {
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
      "status": "active"
    },
    "contragent": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Maxalla Dokoni Nomi",
      "inn": "123456789",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "10"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "1001"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Olmazor MFY",
        "type": "mfy",
        "code": "100101"
      },
      "contragentLevel": "mfy",
      "status": "active"
    },
    "quantity": 100,
    "price": 15000,
    "originalPrice": 20000,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri maxalla maxsulot ID
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Adminlar uchun
- `404` - Maxalla maxsuloti topilmadi
- `500` - Server xatosi

---

## Ma'lumotlar Strukturasi

### MaxallaProduct Ob'ekti (Admin uchun)

```typescript
interface MaxallaProduct {
  _id: string;                    // ObjectId
  baseProduct: BaseProduct;       // Asosiy maxsulot ob'ekti (to'liq)
  contragent: Contragent;         // Maxalla kontragent ob'ekti (to'liq)
  quantity: number;               // Miqdor (min: 0)
  price: number;                  // Narx (min: 0)
  originalPrice: number;          // Asl narx (min: 0)
  status: "active" | "inactive";  // Status
  createdAt: Date;                // Yaratilgan sana
  updatedAt: Date;                // Yangilangan sana
}
```

### BaseProduct Ob'ekti

```typescript
interface BaseProduct {
  _id: string;                    // ObjectId
  name: string;                   // Maxsulot nomi
  description: string | object | null;  // Tavsif
  images: string[];               // Base64 formatdagi rasmlar (max 5)
  category: Category;             // Kategoriya ob'ekti
  subcategory: Category | null;   // Sub kategoriya ob'ekti
  unit: "dona" | "litr" | "kg";  // Birlik
  unitSize: number | null;        // Birlik o'lchami
  status: "active" | "inactive";  // Status
}
```

### Contragent Ob'ekti (Maxalla)

```typescript
interface Contragent {
  _id: string;                    // ObjectId
  name: string;                   // Kontragent nomi
  inn: string | null;             // INN (ixtiyoriy maxalla uchun)
  phone: string;                  // Telefon raqami
  viloyat: Region;                // Viloyat ob'ekti
  tuman: Region;                  // Tuman ob'ekti
  mfy: Region;                    // MFY ob'ekti
  contragentLevel: "mfy";         // Kontragent darajasi (faqat "mfy")
  status: "active" | "inactive";  // Status
}
```

---

## Xato Kodlari

| Kod | Xabar | Tavsif |
|-----|-------|--------|
| 200 | OK | Muvaffaqiyatli so'rov |
| 400 | Bad Request | Noto'g'ri so'rov yoki format |
| 401 | Unauthorized | Autentifikatsiya talab qilinadi |
| 403 | Forbidden | Bu funksiya faqat Adminlar uchun |
| 404 | Not Found | Maxalla maxsuloti topilmadi |
| 500 | Internal Server Error | Server xatosi |

---

## Filtrlar va Qidiruv

### Status Filtrlari
- `status=active` - Faqat faol maxsulotlar
- `status=inactive` - Faqat faol bo'lmagan maxsulotlar

### Kategoriya Filtrlari
- `category={categoryId}` - Ma'lum kategoriyaga tegishli base productlar
- `subcategory={subcategoryId}` - Ma'lum sub kategoriyaga tegishli base productlar

### Kontragent Filtrlari
- `contragent={contragentId}` - Ma'lum maxalla kontragent tomonidan yaratilgan maxsulotlar

### Qidiruv
- `search={query}` - Base product nomi bo'yicha qidiruv (case-insensitive)

### Pagination
- `page={number}` - Sahifa raqami (default: 1)
- `limit={number}` - Sahifadagi elementlar soni (default: 20)

---

## Misollar

### Barcha Maxalla Maxsulotlarini Olish

```bash
curl -X GET "https://api.example.com/api/admin/maxalla-products?status=active&page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

### Filtrlar Bilan Qidiruv

```bash
curl -X GET "https://api.example.com/api/admin/maxalla-products?category=507f1f77bcf86cd799439011&status=active&search=olma" \
  -H "Authorization: Bearer {token}"
```

### Ma'lum Kontragent Maxsulotlarini Olish

```bash
curl -X GET "https://api.example.com/api/admin/maxalla-products?contragent=507f1f77bcf86cd799439010" \
  -H "Authorization: Bearer {token}"
```

### Maxalla Maxsulotni ID bo'yicha Olish

```bash
curl -X GET "https://api.example.com/api/admin/maxalla-products/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer {token}"
```

### JavaScript/Fetch Misollari

```javascript
// Barcha maxalla maxsulotlarini olish
const getAllMaxallaProducts = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`https://api.example.com/api/admin/maxalla-products?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Maxalla maxsulotni ID bo'yicha olish
const getMaxallaProductById = async (token, productId) => {
  const response = await fetch(`https://api.example.com/api/admin/maxalla-products/${productId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Misol: Faol maxsulotlarni kategoriya bo'yicha filtrlash
const getActiveProductsByCategory = async (token, categoryId) => {
  return await getAllMaxallaProducts(token, {
    status: 'active',
    category: categoryId,
    page: 1,
    limit: 20
  });
};

// Misol: Kontragent maxsulotlarini qidirish
const searchContragentProducts = async (token, contragentId, searchQuery) => {
  return await getAllMaxallaProducts(token, {
    contragent: contragentId,
    search: searchQuery,
    page: 1,
    limit: 20
  });
};
```

---

## Qo'shimcha Ma'lumotlar

- **Asosiy Maxsulotlar API:** [Base Product API Documentation](./BASE_PRODUCT_API.md)
- **Maxalla Dokoni API:** [Maxalla Dokoni API Documentation](./MAXALLA_DOKONI_API.md)
- **Umumiy API:** [API Documentation](./API.md)

---

**Eslatma:** Bu API faqat ko'rish (GET) operatsiyalarini qo'llab-quvvatlaydi. Maxalla kontragentlar o'z maxsulotlarini `/api/maxalla-contragents/products` API orqali yaratadi, yangilaydi va o'chiradi. Admin faqat bu maxsulotlarni ko'rish huquqiga ega.

---

**Dokumentatsiya versiyasi:** 1.0  
**Yaratilgan sana:** 2024  
**Yangilangan sana:** 2024
