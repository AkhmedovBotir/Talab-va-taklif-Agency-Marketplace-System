# Viloyat Manager Data API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api/viloyat-managers
```

### Response Format
Barcha API javoblari quyidagi formatda qaytariladi:

**Muvaffaqiyatli javob:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [ ... ]
}
```

**Xatolik javobi:**
```json
{
  "success": false,
  "message": "Xatolik xabari",
  "error": "Xatolik tafsilotlari"
}
```

### HTTP Status Codes
- `200` - Muvaffaqiyatli so'rov
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

### Authentication
Barcha endpoint'lar `viloyatManagerAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

**Eslatma:** Manager faqat o'z viloyatidagi ma'lumotlarni ko'ra oladi. Token'dan managerning viloyati aniqlanadi va filter avtomatik qo'llaniladi.

### Umumiy Query Parametrlar

Barcha endpoint'lar quyidagi parametrlarni qo'llab-quvvatlaydi:

| Parametr | Type | Tavsif | Misol |
|----------|------|--------|-------|
| `status` | string | Faollik holati | `active`, `inactive` |
| `search` | string | Qidiruv (name, phone, inn) | `John`, `+998901234567` |
| `page` | number | Sahifa raqami (default: 1) | `1` |
| `limit` | number | Har sahifadagi yozuvlar soni (default: 50) | `50` |

---

## 1. O'z Viloyatidagi Tumanlarni Olish

**GET** `/api/viloyat-managers/data/tumans`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha tumanlarni olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `search` | string | No | Qidiruv (name yoki code bo'yicha) |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi tumanlar soni (default: 100) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani",
      "type": "district",
      "code": "BULOQBOSHI",
      "parent": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "status": "active",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/viloyat-managers/data/tumans?search=Buloq&page=1&limit=20
```

---

## 2. O'z Viloyatidagi Punktlarni Olish

**GET** `/api/viloyat-managers/data/punkts`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha punktlarni olish. Faqat o'chirilmagan (`isDeleted: false`) punktlar ko'rsatiladi.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `status` | string | No | Faollik holati (`active`, `inactive`) |
| `tuman` | string | No | Tuman ID bo'yicha filter |
| `search` | string | No | Qidiruv (name yoki phone bo'yicha) |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi punktlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Punkt 1",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani",
        "type": "district",
        "code": "BULOQBOSHI"
      },
      "status": "active",
      "isDeleted": false,
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/viloyat-managers/data/punkts?status=active&tuman=507f1f77bcf86cd799439016&page=1&limit=20
```

---

## 3. O'z Viloyatidagi Agentlarni Olish

**GET** `/api/viloyat-managers/data/agents`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha agentlarni olish. Faqat o'chirilmagan (`isDeleted: false`) agentlar ko'rsatiladi.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `status` | string | No | Faollik holati (`active`, `inactive`) |
| `tuman` | string | No | Tuman ID bo'yicha filter |
| `mfy` | string | No | MFY ID bo'yicha filter |
| `search` | string | No | Qidiruv (name yoki phone bo'yicha) |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi agentlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "name": "Agent 1",
      "phone": "+998901234568",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani",
        "type": "district",
        "code": "BULOQBOSHI"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY001"
      },
      "status": "active",
      "isDeleted": false,
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/viloyat-managers/data/agents?status=active&tuman=507f1f77bcf86cd799439016&mfy=507f1f77bcf86cd799439017&page=1&limit=20
```

---

## 4. O'z Viloyatidagi Kontragentlarni Olish

**GET** `/api/viloyat-managers/data/contragents`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha kontragentlarni olish. Faqat o'chirilmagan (`isDeleted: false`) kontragentlar ko'rsatiladi. Bu endpoint barcha kontragentlarni (tuman va mfy) qaytaradi.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `status` | string | No | Faollik holati (`active`, `inactive`) |
| `tuman` | string | No | Tuman ID bo'yicha filter |
| `mfy` | string | No | MFY ID bo'yicha filter |
| `contragentLevel` | string | No | Kontragent darajasi (`tuman`, `mfy`) |
| `search` | string | No | Qidiruv (name, phone yoki inn bo'yicha) |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi kontragentlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439023",
      "name": "Kontragent 1",
      "inn": "123456789",
      "phone": "+998901234569",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani",
        "type": "district",
        "code": "BULOQBOSHI"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Oziq-ovqat"
      },
      "contragentLevel": "tuman",
      "status": "active",
      "isDeleted": false,
      "logo": "https://example.com/logo.jpg",
      "isFeaturedForMarketplace": false,
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/viloyat-managers/data/contragents?status=active&contragentLevel=tuman&tuman=507f1f77bcf86cd799439016&page=1&limit=20
```

---

## 5. O'z Viloyatidagi Do'konlarni Olish

**GET** `/api/viloyat-managers/data/dokons`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha do'konlarni (MFY kontragentlar) olish. Faqat `contragentLevel: 'mfy'` bo'lgan va o'chirilmagan (`isDeleted: false`) kontragentlar ko'rsatiladi.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `status` | string | No | Faollik holati (`active`, `inactive`) |
| `tuman` | string | No | Tuman ID bo'yicha filter |
| `mfy` | string | No | MFY ID bo'yicha filter |
| `search` | string | No | Qidiruv (name, phone yoki inn bo'yicha) |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi do'konlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439024",
      "name": "Do'kon 1",
      "inn": "987654321",
      "phone": "+998901234570",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani",
        "type": "district",
        "code": "BULOQBOSHI"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Oziq-ovqat"
      },
      "contragentLevel": "mfy",
      "status": "active",
      "isDeleted": false,
      "logo": "https://example.com/logo.jpg",
      "isFeaturedForMarketplace": false,
      "workingHours": {
        "open": "09:00",
        "close": "18:00"
      },
      "serviceAreas": {
        "tuman": "507f1f77bcf86cd799439016",
        "mfy": ["507f1f77bcf86cd799439017"]
      },
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/viloyat-managers/data/dokons?status=active&tuman=507f1f77bcf86cd799439016&page=1&limit=20
```

---

## Filter Qoidalari

### Avtomatik Filter
Barcha endpoint'larda managerning viloyati avtomatik filter sifatida qo'llaniladi:
```javascript
filter.viloyat = req.user.viloyat._id || req.user.viloyat;
```

### O'chirilgan Yozuvlar
Barcha endpoint'larda faqat o'chirilmagan yozuvlar ko'rsatiladi:
```javascript
filter.isDeleted = false;
```

### Qidiruv (Search)
Qidiruv parametri quyidagi maydonlarda qidiradi:
- **Punktlar:** `name`, `phone`
- **Agentlar:** `name`, `phone`
- **Kontragentlar:** `name`, `phone`, `inn`
- **Do'konlar:** `name`, `phone`, `inn`

Qidiruv case-insensitive va regex orqali amalga oshiriladi.

---

## Pagination

Barcha endpoint'lar pagination qo'llab-quvvatlaydi:

- **page:** Sahifa raqami (default: 1)
- **limit:** Har sahifadagi yozuvlar soni (default: 50)

**Response format:**
```json
{
  "success": true,
  "count": 10,        // Joriy sahifadagi yozuvlar soni
  "total": 50,        // Jami yozuvlar soni
  "page": 1,          // Joriy sahifa
  "limit": 50,        // Har sahifadagi yozuvlar soni
  "totalPages": 1,    // Jami sahifalar soni
  "data": [ ... ]
}
```

---

## Xatoliklar

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```
Yoki:
```json
{
  "success": false,
  "message": "Token noto'g'ri yoki muddati tugagan"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Xatolik xabari",
  "error": "Xatolik tafsilotlari"
}
```

---

## Misollar

### Misol 1: Faol punktlarni olish
```bash
curl -X GET "http://localhost:5000/api/viloyat-managers/data/punkts?status=active&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Misol 2: Tuman bo'yicha agentlarni qidirish
```bash
curl -X GET "http://localhost:5000/api/viloyat-managers/data/agents?tuman=507f1f77bcf86cd799439016&search=John&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Misol 3: Tuman kontragentlarini olish
```bash
curl -X GET "http://localhost:5000/api/viloyat-managers/data/contragents?contragentLevel=tuman&status=active&page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

### Misol 4: Do'konlarni qidirish
```bash
curl -X GET "http://localhost:5000/api/viloyat-managers/data/dokons?search=Do'kon&status=active&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## Eslatmalar

1. **Viloyat Filter:** Manager faqat o'z viloyatidagi ma'lumotlarni ko'ra oladi. Token'dan managerning viloyati aniqlanadi va filter avtomatik qo'llaniladi.

2. **O'chirilgan Yozuvlar:** Barcha endpoint'larda faqat o'chirilmagan (`isDeleted: false`) yozuvlar ko'rsatiladi.

3. **Password:** Barcha endpoint'larda password maydoni response'da qaytarilmaydi.

4. **Population:** Barcha endpoint'larda `viloyat`, `tuman`, `mfy`, `activityType` maydonlari populate qilinadi.

5. **Sorting:** Barcha endpoint'larda yozuvlar `createdAt: -1` (eng yangisi birinchi) bo'yicha tartiblanadi.

6. **Do'konlar:** Do'konlar `contragentLevel: 'mfy'` bo'lgan kontragentlardir. Bu endpoint faqat MFY kontragentlarini qaytaradi.

7. **Kontragentlar:** Kontragentlar endpoint'i barcha kontragentlarni (tuman va mfy) qaytaradi. Agar faqat do'konlarni olish kerak bo'lsa, `/data/dokons` endpoint'ini ishlating.

---

---

## Buyurtmalar API

### Umumiy Ma'lumot

Manager o'z viloyatidagi buyurtmalarni kuzatish uchun API'lar. Barcha buyurtmalar `deliveryViloyat` bo'yicha filter qilinadi.

### Tuman Kontragentlari Sotuvi

#### 1. Barcha Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman`

**Authentication:** `viloyatManagerAuth` required

**Tavsif:** Manager o'z viloyatidagi barcha tuman buyurtmalarini olish.

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi (status, paymentStatus, paymentMethod, orderNumber, user, startDate, endDate, minTotalPrice, maxTotalPrice, search, page, limit)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "statistics": {
    "totalOrders": 50,
    "totalPrice": 5000000,
    "totalOriginalPrice": 4000000,
    "totalKpiPrice": 1000000,
    "totalItems": 100,
    "avgOrderValue": 100000
  },
  "data": [ ... ]
}
```

---

#### 2. Marketplace dan Buyurilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/marketplace`

**Tavsif:** Marketplace dan buyurilgan, lekin punkt tomonidan hali qabul qilinmagan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `status: { $ne: 'cancelled' }`
- `confirmedByPunkt: null`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

---

#### 3. Punkt Qabul Qilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/confirmed-by-punkt`

**Tavsif:** Punkt tomonidan qabul qilingan, lekin hali hech narsa qilinmagan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `confirmedByPunkt: { $ne: null }`
- `assignedToAgent: null`
- `contragentRequests` bo'sh yoki hammasi `pending`/`rejected`

---

#### 4. Kontragentlarga Yuborilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/requested-to-contragents`

**Tavsif:** Kontragentlarga so'rov yuborilgan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `contragentRequests.status: { $in: ['pending', 'accepted'] }`

---

#### 5. Punktga Yetkazilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/delivered-to-punkt`

**Tavsif:** Kontragent tomonidan punktga yetkazilgan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `contragentRequests.status: 'delivered_to_punkt'`

---

#### 6. Agentga Yuborilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/assigned-to-agents`

**Tavsif:** Punkt tomonidan agentga yuborilgan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `assignedToAgent: { $ne: null }`

---

#### 7. Agent Topshirgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/confirmed-by-agents`

**Tavsif:** Agent tomonidan mijozga yetkazilgan va tasdiqlangan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `confirmedByAgent: { $ne: null }`

---

#### 8. Mijoz Qabul Qilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/confirmed-by-customers`

**Tavsif:** Mijoz tomonidan qabul qilingan (yakuniy) tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `customerConfirmed: true`

---

#### 9. Qaytarilgan Tuman Buyurtmalari
**GET** `/api/viloyat-managers/orders/tuman/cancelled`

**Tavsif:** Bekor qilingan tuman buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `status: 'cancelled'`

---

### Maxalla Do'konlari Sotuvi

#### 10. Barcha Maxalla Buyurtmalari
**GET** `/api/viloyat-managers/orders/maxalla`

**Tavsif:** Manager o'z viloyatidagi barcha maxalla/dokon buyurtmalarini olish.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

---

#### 11. Marketplace dan Buyurilgan Maxalla Buyurtmalari
**GET** `/api/viloyat-managers/orders/maxalla/marketplace`

**Tavsif:** Marketplace dan buyurilgan, lekin punkt tomonidan hali qabul qilinmagan maxalla buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `status: { $ne: 'cancelled' }`
- `confirmedByPunkt: null`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

---

#### 12. Kontragentlarga Yuborilgan Maxalla Buyurtmalari
**GET** `/api/viloyat-managers/orders/maxalla/requested-to-contragents`

**Tavsif:** Kontragentlarga so'rov yuborilgan maxalla buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `contragentRequests.status: { $in: ['pending', 'accepted'] }`

---

#### 13. Mijoz Qabul Qilgan Maxalla Buyurtmalari
**GET** `/api/viloyat-managers/orders/maxalla/confirmed-by-customers`

**Tavsif:** Mijoz tomonidan qabul qilingan (yakuniy) maxalla buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `customerConfirmed: true`

---

#### 14. Qaytarilgan Maxalla Buyurtmalari
**GET** `/api/viloyat-managers/orders/maxalla/cancelled`

**Tavsif:** Bekor qilingan maxalla buyurtmalari.

**Filter:**
- `deliveryViloyat: managerViloyat`
- `status: 'cancelled'`

---

## Versiya

**Version:** 2.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Manager o'z viloyatidagi Punktlar, Agentlar, Kontragentlar, Do'konlar va Buyurtmalarni olish
