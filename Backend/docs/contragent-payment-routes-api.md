# Contragent Payment Routes API Documentation

## 📋 Ma'lumot

Bu dokumentatsiya Contragent'lar uchun to'lov ma'lumotlarini ko'rish API endpoint'larini tavsiflaydi.

**Base Path:** `/api/contragents/payments`

**Route Fayl:** `routes/contragentRoutes.js` (76-81 qatorlar)

**Controller:** `controllers/contragentPaymentController.js`

---

## 🔐 Autentifikatsiya

Barcha endpoint'lar **Contragent autentifikatsiyasi** talab qiladi.

**Header:**
```
Authorization: Bearer <contragent_jwt_token>
```

**Token Type:** `contragent`

---

## 📊 Data Model

### ContragentPaymentDistribution

```json
{
  "_id": "string (MongoDB ObjectId)",
  "contragent": "string (ObjectId, reference to Contragent)",
  "amount": "number (required, min: 0)",
  "status": "string (enum: 'pending' | 'paid' | 'cancelled', default: 'pending')",
  "paidAt": "Date | null (set when paid)",
  "paidBy": {
    "_id": "string (ObjectId)",
    "name": "string",
    "phone": "string"
  } | null,
  "notes": "string | null",
  "orders": [
    {
      "_id": "string (ObjectId)",
      "orderNumber": "string",
      "totalPrice": "number",
      "totalKpiPrice": "number",
      "createdAt": "Date"
    }
  ],
  "dueDate": "Date (required, payment due date)",
  "isOverdue": "boolean (default: false, true if dueDate passed and status is pending)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Status Qiymatlari

- `pending` - To'lanmagan (default)
- `paid` - To'langan
- `cancelled` - Bekor qilingan

---

## 🛣️ Endpoint'lar

### 1. To'langan To'lovlarni Olish

Contragent o'ziga qilingan to'langan to'lovlarni ko'rish.

**Endpoint:** `GET /api/contragents/payments/paid`

**Route:** `router.get('/payments/paid', contragentAuth, getMyPaidPayments);`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Sahifa raqami |
| `limit` | number | No | 50 | Har bir sahifadagi elementlar soni |
| `startDate` | string (ISO 8601) | No | - | To'lov sanasi boshlanishi (paidAt filter) |
| `endDate` | string (ISO 8601) | No | - | To'lov sanasi tugashi (paidAt filter) |

**Example Request:**
```bash
GET /api/contragents/payments/paid?page=1&limit=50&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalPaidAmount": 12000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "contragent": "507f1f77bcf86cd799439010",
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-20T10:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin User",
        "phone": "+998901234567"
      },
      "notes": "To'lov qabul qilindi",
      "orders": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "orderNumber": "ORD-001",
          "totalPrice": 600000,
          "totalKpiPrice": 100000,
          "createdAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-22T00:00:00.000Z",
      "isOverdue": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Muvaffaqiyatli so'rov |
| `count` | number | Joriy sahifadagi to'lovlar soni |
| `total` | number | Jami to'langan to'lovlar soni |
| `page` | number | Joriy sahifa raqami |
| `limit` | number | Har bir sahifadagi elementlar soni |
| `totalPages` | number | Jami sahifalar soni |
| `totalAmount` | number | Joriy sahifadagi to'lovlar yig'indisi |
| `totalPaidAmount` | number | Barcha to'langan to'lovlar yig'indisi |
| `data` | array | To'lov obyektlari massivi |

**Error Responses:**

- **401 Unauthorized** - Token topilmadi yoki noto'g'ri
- **403 Forbidden** - Token contragent uchun emas yoki hisob faol emas
- **500 Internal Server Error** - Server xatosi

---

### 2. To'lanmagan To'lovlarni Olish

Contragent o'ziga qilingan to'lanmagan to'lovlarni ko'rish.

**Endpoint:** `GET /api/contragents/payments/unpaid`

**Route:** `router.get('/payments/unpaid', contragentAuth, getMyUnpaidPayments);`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Sahifa raqami |
| `limit` | number | No | 50 | Har bir sahifadagi elementlar soni |
| `isOverdue` | string ('true'/'false') | No | - | Muddati o'tgan to'lovlarni filter qilish |

**Example Request:**
```bash
GET /api/contragents/payments/unpaid?page=1&limit=50&isOverdue=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 2000000,
  "totalUnpaidAmount": 5000000,
  "overdue": {
    "totalAmount": 1000000,
    "count": 2
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "contragent": "507f1f77bcf86cd799439010",
      "amount": 500000,
      "status": "pending",
      "paidAt": null,
      "paidBy": null,
      "notes": null,
      "orders": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "orderNumber": "ORD-001",
          "totalPrice": 600000,
          "totalKpiPrice": 100000,
          "createdAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-22T00:00:00.000Z",
      "isOverdue": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Muvaffaqiyatli so'rov |
| `count` | number | Joriy sahifadagi to'lovlar soni |
| `total` | number | Jami to'lanmagan to'lovlar soni |
| `page` | number | Joriy sahifa raqami |
| `limit` | number | Har bir sahifadagi elementlar soni |
| `totalPages` | number | Jami sahifalar soni |
| `totalAmount` | number | Joriy sahifadagi to'lovlar yig'indisi |
| `totalUnpaidAmount` | number | Barcha to'lanmagan to'lovlar yig'indisi |
| `overdue` | object | Muddati o'tgan to'lovlar statistikasi |
| `overdue.totalAmount` | number | Muddati o'tgan to'lovlar yig'indisi |
| `overdue.count` | number | Muddati o'tgan to'lovlar soni |
| `data` | array | To'lov obyektlari massivi |

**Error Responses:**

- **401 Unauthorized** - Token topilmadi yoki noto'g'ri
- **403 Forbidden** - Token contragent uchun emas yoki hisob faol emas
- **500 Internal Server Error** - Server xatosi

**Eslatma:** Muddati o'tgan to'lovlar avtomatik ravishda yangilanadi. Agar `dueDate` o'tgan bo'lsa va status hali `pending` bo'lsa, `isOverdue` `true` ga o'rnatiladi.

---

### 3. To'lovlar Statistikasini Olish

Contragent o'ziga qilingan to'lovlar statistikasini ko'rish.

**Endpoint:** `GET /api/contragents/payments/statistics`

**Route:** `router.get('/payments/statistics', contragentAuth, getMyPaymentStatistics);`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string (ISO 8601) | No | - | To'langan to'lovlar uchun boshlanish sanasi (paidAt filter) |
| `endDate` | string (ISO 8601) | No | - | To'langan to'lovlar uchun tugash sanasi (paidAt filter) |

**Example Request:**
```bash
GET /api/contragents/payments/statistics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "unpaid": {
      "totalAmount": 5000000,
      "count": 10
    },
    "paid": {
      "totalAmount": 12000000,
      "count": 25
    },
    "overdue": {
      "totalAmount": 1000000,
      "count": 2
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Muvaffaqiyatli so'rov |
| `data` | object | Statistika ma'lumotlari |
| `data.period` | object | To'langan to'lovlar uchun sana oralig'i |
| `data.period.startDate` | string \| null | Boshlanish sanasi (agar ko'rsatilgan bo'lsa) |
| `data.period.endDate` | string \| null | Tugash sanasi (agar ko'rsatilgan bo'lsa) |
| `data.unpaid` | object | To'lanmagan to'lovlar statistikasi |
| `data.unpaid.totalAmount` | number | To'lanmagan to'lovlar yig'indisi |
| `data.unpaid.count` | number | To'lanmagan to'lovlar soni |
| `data.paid` | object | To'langan to'lovlar statistikasi (sana oralig'i bo'yicha filter qilingan) |
| `data.paid.totalAmount` | number | To'langan to'lovlar yig'indisi |
| `data.paid.count` | number | To'langan to'lovlar soni |
| `data.overdue` | object | Muddati o'tgan to'lovlar statistikasi |
| `data.overdue.totalAmount` | number | Muddati o'tgan to'lovlar yig'indisi |
| `data.overdue.count` | number | Muddati o'tgan to'lovlar soni |

**Error Responses:**

- **401 Unauthorized** - Token topilmadi yoki noto'g'ri
- **403 Forbidden** - Token contragent uchun emas yoki hisob faol emas
- **500 Internal Server Error** - Server xatosi

---

### 4. To'lovni ID bo'yicha Olish

Contragent bitta to'lovni ID bo'yicha ko'rish.

**Endpoint:** `GET /api/contragents/payments/:id`

**Route:** `router.get('/payments/:id', contragentAuth, getMyPaymentById);`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (MongoDB ObjectId) | Yes | To'lov ID si |

**Example Request:**
```bash
GET /api/contragents/payments/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "contragent": "507f1f77bcf86cd799439010",
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "phone": "+998901234567"
    },
    "notes": "To'lov qabul qilindi",
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "orderNumber": "ORD-001",
        "totalPrice": 600000,
        "totalKpiPrice": 100000,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "dueDate": "2024-01-22T00:00:00.000Z",
    "isOverdue": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Token topilmadi yoki noto'g'ri
- **403 Forbidden** - Token contragent uchun emas yoki hisob faol emas
- **404 Not Found** - To'lov topilmadi yoki bu contragent'ga tegishli emas
- **500 Internal Server Error** - Server xatosi

**404 Error Response:**
```json
{
  "success": false,
  "message": "To'lov topilmadi"
}
```

---

## ⚠️ Xatoliklar

Barcha xatoliklar quyidagi formatda qaytariladi:

```json
{
  "success": false,
  "message": "Xatolik xabari (O'zbek tilida)",
  "error": "Batafsil xatolik xabari (ixtiyoriy)"
}
```

### HTTP Status Kodlari

| Status Code | Description |
|-------------|-------------|
| 200 | Muvaffaqiyatli |
| 400 | Noto'g'ri so'rov |
| 401 | Autentifikatsiya talab qilinadi yoki token noto'g'ri |
| 403 | Token contragent uchun emas yoki hisob faol emas |
| 404 | To'lov topilmadi |
| 500 | Server xatosi |

### Xatolik Xabarlari

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

```json
{
  "success": false,
  "message": "Token noto'g'ri yoki muddati tugagan"
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "message": "Bu token contragent uchun emas"
}
```

```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "To'lov topilmadi"
}
```

---

## 📝 Eslatmalar

1. **Autentifikatsiya:** Barcha endpoint'lar Contragent autentifikatsiyasi talab qiladi. Token `Authorization` header'ida `Bearer` formatida yuborilishi kerak.

2. **O'z To'lovlari:** Contragent faqat o'ziga tegishli to'lovlarni ko'ra oladi. Tizim avtomatik ravishda autentifikatsiya qilingan contragent ID si bo'yicha filter qiladi.

3. **To'lov Statusi:**
   - `pending` - To'lanmagan (default)
   - `paid` - To'langan (Admin tomonidan to'landi)
   - `cancelled` - Bekor qilingan

4. **Muddati O'tgan To'lovlar:**
   - To'lovlar avtomatik ravishda muddati o'tgan deb belgilanadi, agar `dueDate` o'tgan bo'lsa va status hali `pending` bo'lsa
   - `isOverdue` maydoni to'lanmagan to'lovlarni olishda avtomatik yangilanadi

5. **To'lov Summasi:**
   - To'lov summasi quyidagicha hisoblanadi: `totalPrice - totalKpiPrice` buyurtmalardan
   - `totalPrice` = Mijozdan olingan umumiy summa
   - `totalKpiPrice` = KPI bonus summa

6. **Sana Filterlari:**
   - To'langan to'lovlar uchun: `paidAt` sanasi bo'yicha filter
   - To'lanmagan to'lovlar uchun: `dueDate` bo'yicha filter (hozirgi implementatsiyada qo'llanilmaydi, lekin qo'shish mumkin)
   - Sana formati: ISO 8601 (masalan, "2024-01-01" yoki "2024-01-01T00:00:00.000Z")

7. **Pagination:**
   - Default sahifa: 1
   - Default limit: 50
   - Natijalar quyidagicha tartiblanadi:
     - To'langan to'lovlar: `paidAt` kamayish bo'yicha (eng yangilari birinchi)
     - To'lanmagan to'lovlar: `dueDate` o'sish bo'yicha, keyin `createdAt` kamayish bo'yicha

8. **Buyurtma Ma'lumotlari:**
   - Har bir to'lov o'zini yaratgan buyurtmalar haqida ma'lumotni o'z ichiga oladi
   - Buyurtmalar quyidagi maydonlar bilan populate qilinadi: `orderNumber`, `totalPrice`, `totalKpiPrice`, `createdAt`

9. **Admin Ma'lumotlari:**
   - To'langan to'lovlar uchun `paidBy` maydoni to'lovni amalga oshirgan Admin haqida ma'lumotni o'z ichiga oladi
   - Quyidagi maydonlar kiritiladi: `_id`, `name`, `phone`

10. **Bildirishnomalar:**
    - Admin contragent'ga to'lov qilganda, contragent'ga avtomatik bildirishnoma yuboriladi
    - Bildirishnomalar Socket.io orqali (agar mavjud bo'lsa) va ma'lumotlar bazasiga saqlanadi

---

## 💡 Misollar

### Misol 1: To'langan To'lovlarni Olish

**Request:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/paid?page=1&limit=50&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalPaidAmount": 12000000,
  "data": [...]
}
```

### Misol 2: To'lanmagan To'lovlarni Olish (Muddati O'tgan)

**Request:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/unpaid?isOverdue=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 1000000,
  "totalUnpaidAmount": 5000000,
  "overdue": {
    "totalAmount": 1000000,
    "count": 2
  },
  "data": [...]
}
```

### Misol 3: To'lovlar Statistikasini Olish

**Request:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "unpaid": {
      "totalAmount": 5000000,
      "count": 10
    },
    "paid": {
      "totalAmount": 12000000,
      "count": 25
    },
    "overdue": {
      "totalAmount": 1000000,
      "count": 2
    }
  }
}
```

### Misol 4: To'lovni ID bo'yicha Olish

**Request:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "phone": "+998901234567"
    },
    "notes": "To'lov qabul qilindi",
    "orders": [...],
    "dueDate": "2024-01-22T00:00:00.000Z",
    "isOverdue": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

## 🔗 Bog'liq Dokumentatsiyalar

- [Contragent API Documentation](./contragent-api.md)
- [Admin Contragent Payment API Documentation](./admin-contragent-payment-api.md)

---

**Yaratilgan:** 2024-12-25  
**Versiya:** 1.0.0  
**Route Fayl:** `routes/contragentRoutes.js` (76-81 qatorlar)  
**Controller:** `controllers/contragentPaymentController.js`


