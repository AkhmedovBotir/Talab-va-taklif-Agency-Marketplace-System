# Admin Contragent Payment Distribution API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [To'lanmagan To'lovlar](#to'lanmagan-to'lovlar)
  - [To'lovni Tasdiqlash](#to'lovni-tasdiqlash)
  - [To'lovlar Statistika](#to'lovlar-statistika)
  - [To'langan To'lovlar](#to'langan-to'lovlar)
  - [Sinxronlashtirish](#sinxronlashtirish)
- [Workflow](#workflow)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin Contragent Payment Distribution API moliya bo'limi uchun Contragentlarga to'lovlarni tarqatish tizimini ta'minlaydi. Bu API orqali:

- To'lanmagan Contragent to'lovlarini ko'rish
- To'lovlarni "to'landi" deb belgilash
- To'lovlar statistikasini ko'rish
- To'langan to'lovlar tarixini ko'rish
- Buyurtmalardan to'lovlarni avtomatik yaratish (belgilangan muddat bilan)

**Base Path:** `/api/admin-contragent-payments`

**Asosiy Ma'lumotlar:**
- Moliya bo'limi barcha pullarni to'liq yig'ib olgandan keyin, markazdan boshqarilgan holda tarqatadi
- Tizimda oldindan hisoblangan ma'lumotlarga asoslanib, Contragentlar uchun to'lov summalari aniqlanadi
- To'lov summa = `totalPrice - totalKpiPrice` (KPI dan oshgan summa)
- Moliya bo'limi ro'yxat bo'yicha pulni bosqichma-bosqich o'tkazadi
- Har bir o'tkazma amalga oshirilgach, tizimda mos ravishda "to'landi" deb belgilab qo'yiladi
- Kimga qancha pul berilgani va kimga hali to'lanmagani aniq ko'rinib turadi
- To'lov muddati belgilanadi va muddat o'tgan to'lovlar alohida ko'rsatiladi

---

## Base URL

```
http://localhost:5000/api/admin-contragent-payments
```

---

## Authentication

Barcha endpoint'lar Admin autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <admin_token>`

---

## Data Models

### ContragentPaymentDistribution Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "contragent": {
    "_id": "string",
    "name": "string",
    "inn": "string",
    "phone": "string",
    "viloyat": {
      "_id": "string",
      "name": "string",
      "type": "region",
      "code": "string"
    },
    "tuman": {
      "_id": "string",
      "name": "string",
      "type": "district",
      "code": "string"
    },
    "mfy": {
      "_id": "string",
      "name": "string",
      "type": "mfy",
      "code": "string"
    }
  },
  "amount": "number",
  "status": "string (enum: 'pending', 'paid', 'cancelled')",
  "paidAt": "Date (null if not paid)",
  "paidBy": {
    "_id": "string",
    "name": "string",
    "phone": "string"
  },
  "notes": "string (optional)",
  "orders": [
    {
      "_id": "string",
      "orderNumber": "string",
      "totalPrice": "number",
      "totalKpiPrice": "number",
      "createdAt": "Date"
    }
  ],
  "dueDate": "Date",
  "isOverdue": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Field Descriptions:**
- `contragent`: To'lov qilinadigan Contragent
- `amount`: To'lov summasi (totalPrice - totalKpiPrice)
- `status`: To'lov holati
  - `pending`: To'lanmagan
  - `paid`: To'langan
  - `cancelled`: Bekor qilingan
- `paidAt`: To'landi deb belgilangan vaqt
- `paidBy`: To'lovni tasdiqlagan admin
- `notes`: Qo'shimcha ma'lumotlar
- `orders`: Qaysi buyurtmalardan yig'ilgan
- `dueDate`: To'lov muddati (belgilangan muddat)
- `isOverdue`: To'lov muddati o'tganmi (dueDate o'tgan va hali to'lanmagan)

---

## Endpoints

### To'lanmagan To'lovlar

#### Get Unpaid Payments

Barcha to'lanmagan Contragent to'lovlarini olish.

**Endpoint:** `GET /api/admin-contragent-payments/unpaid`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `contragentId` | string | Contragent ID bo'yicha filtrlash |
| `viloyatId` | string | Viloyat ID bo'yicha filtrlash |
| `tumanId` | string | Tuman ID bo'yicha filtrlash |
| `mfyId` | string | MFY ID bo'yicha filtrlash |
| `isOverdue` | boolean | Faqat muddat o'tgan to'lovlarni ko'rsatish (`true` yoki `false`) |
| `page` | number | Sahifa raqami (default: 1) |
| `limit` | number | Har bir sahifadagi elementlar soni (default: 50) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalUnpaidAmount": 10000000,
  "overdue": {
    "totalAmount": 2000000,
    "count": 5
  },
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "contragent": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": { ... },
        "tuman": { ... },
        "mfy": { ... }
      },
      "amount": 500000,
      "status": "pending",
      "paidAt": null,
      "paidBy": null,
      "notes": null,
      "orders": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
          "orderNumber": "00001",
          "totalPrice": 1000000,
          "totalKpiPrice": 500000,
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-15T00:00:00.000Z",
      "isOverdue": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notes:**
- To'lovlar `dueDate` bo'yicha tartiblanadi (eng yaqin muddat birinchi)
- `isOverdue` avtomatik yangilanadi (dueDate o'tgan va status pending bo'lsa)

---

#### Get Unpaid Payments Grouped

To'lanmagan to'lovlarni Contragent bo'yicha guruhlab olish.

**Endpoint:** `GET /api/admin-contragent-payments/unpaid/grouped`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `isOverdue` | boolean | Faqat muddat o'tgan to'lovlarni ko'rsatish (`true` yoki `false`) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "contragent": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": { ... },
        "tuman": { ... },
        "mfy": { ... }
      },
      "totalAmount": 1500000,
      "count": 3,
      "earliestDueDate": "2024-01-10T00:00:00.000Z",
      "latestDueDate": "2024-01-20T00:00:00.000Z",
      "hasOverdue": false
    }
  ]
}
```

---

### To'lovni Tasdiqlash

#### Mark Payments as Paid

Bir yoki bir nechta to'lovlarni "to'landi" deb belgilash.

**Endpoint:** `POST /api/admin-contragent-payments/mark-as-paid`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "paymentIds": [
    "60f7b3b3b3b3b3b3b3b3b3b3",
    "60f7b3b3b3b3b3b3b3b3b3b4"
  ],
  "notes": "Naqd pul orqali to'landi"
}
```

**Request Fields:**
- `paymentIds` (required): To'lov ID'lari array'i
- `notes` (optional): Qo'shimcha ma'lumotlar

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "2 ta to'lov muvaffaqiyatli to'landi deb belgilandi",
  "count": 2,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "contragent": { ... },
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-15T10:00:00.000Z",
      "paidBy": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "name": "Admin 1",
        "phone": "+998901234567"
      },
      "notes": "Naqd pul orqali to'landi",
      "orders": [ ... ],
      "dueDate": "2024-01-15T00:00:00.000Z",
      "isOverdue": false
    }
  ],
  "notifications": 2
}
```

**Notes:**
- To'lovlar tasdiqlanganda Contragentlarga bildirishnoma yuboriladi
- `isOverdue` avtomatik `false` ga o'rnatiladi

---

### To'lovlar Statistika

#### Get Payment Statistics

To'lovlar statistikasini olish.

**Endpoint:** `GET /api/admin-contragent-payments/statistics`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Boshlanish sanasi (ISO 8601) |
| `endDate` | string | Tugash sanasi (ISO 8601) |

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
      "totalAmount": 10000000,
      "count": 20
    },
    "paid": {
      "totalAmount": 50000000,
      "count": 100
    },
    "overdue": {
      "totalAmount": 2000000,
      "count": 5
    }
  }
}
```

---

### To'langan To'lovlar

#### Get Paid Payments

To'langan to'lovlarni olish.

**Endpoint:** `GET /api/admin-contragent-payments/paid`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `contragentId` | string | Contragent ID bo'yicha filtrlash |
| `startDate` | string | Boshlanish sanasi (ISO 8601) |
| `endDate` | string | Tugash sanasi (ISO 8601) |
| `page` | number | Sahifa raqami (default: 1) |
| `limit` | number | Har bir sahifadagi elementlar soni (default: 50) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "totalAmount": 5000000,
  "totalPaidAmount": 50000000,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "contragent": { ... },
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-15T10:00:00.000Z",
      "paidBy": { ... },
      "notes": "Naqd pul orqali to'landi",
      "orders": [ ... ],
      "dueDate": "2024-01-15T00:00:00.000Z",
      "isOverdue": false
    }
  ]
}
```

---

### Sinxronlashtirish

#### Sync Contragent Payments

Buyurtmalardan Contragent to'lovlarini yaratish/yangilash.

**Endpoint:** `POST /api/admin-contragent-payments/sync`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "dueDateDays": 7
}
```

**Request Fields:**
- `dueDateDays` (required): To'lov muddati (kunlar soni, default: 7)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Contragent to'lovlari muvaffaqiyatli yaratildi/yangilandi",
  "data": {
    "dueDate": "2024-01-22T00:00:00.000Z",
    "dueDateDays": 7,
    "createdPayments": 10,
    "updatedPayments": 5,
    "processedOrders": 25,
    "createdPaymentIds": [ ... ],
    "updatedPaymentIds": [ ... ]
  }
}
```

**Notes:**
- Bu endpoint `status: 'confirmed_by_customer'` va `contragentRequests.status: 'delivered_to_punkt'` bo'lgan barcha buyurtmalarni ko'rib chiqadi
- Har bir buyurtma uchun quyidagilar yaratiladi/yangilanadi:
  - Contragent uchun to'lov (agar `totalPrice - totalKpiPrice > 0`)
- To'lov summa = `totalPrice - totalKpiPrice` (KPI dan oshgan summa)
- Agar to'lov allaqachon mavjud bo'lsa (pending status va bir xil dueDate), faqat summa yangilanadi
- To'lov muddati = hozirgi sana + `dueDateDays`

---

## Workflow

### To'lovlar Tarqatish Jarayoni

1. **Buyurtmalardan To'lovlarni Yaratish:**
   - Admin `/sync` endpoint'ini chaqiradi va `dueDateDays` ni belgilaydi
   - Tizim barcha `confirmed_by_customer` va `delivered_to_punkt` bo'lgan buyurtmalardan to'lovlarni yaratadi
   - Har bir Contragent uchun to'lov summa = `totalPrice - totalKpiPrice`

2. **To'lanmagan To'lovlarni Ko'rish:**
   - Admin `/unpaid` yoki `/unpaid/grouped` endpoint'larini chaqiradi
   - Kimga qancha to'lov qilinishi kerakligini ko'radi
   - Muddat o'tgan to'lovlar `isOverdue: true` bilan ko'rsatiladi

3. **To'lovlarni To'lash:**
   - Admin to'lovlarni amalga oshiradi (plastik karta, naqd pul, boshqa usullar)
   - Admin `/mark-as-paid` endpoint'ini chaqirib, to'lovlarni "to'landi" deb belgilaydi

4. **To'lovlar Tarixini Ko'rish:**
   - Admin `/paid` endpoint'ini chaqirib, to'langan to'lovlar tarixini ko'radi

5. **Statistikani Ko'rish:**
   - Admin `/statistics` endpoint'ini chaqirib, umumiy statistikani ko'radi

---

## Error Handling

Barcha endpoint'lar quyidagi formatda xatolarni qaytaradi:

```json
{
  "success": false,
  "message": "Xato xabari",
  "error": "Batafsil xato ma'lumoti"
}
```

**HTTP Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `404` - Topilmadi
- `500` - Server xatosi

---

## Examples

### To'liq Misol: To'lovlar Tarqatish

```javascript
// 1. To'lovlarni sinxronlashtirish (7 kun muddat bilan)
async function syncPayments(token) {
  const response = await fetch('http://localhost:5000/api/admin-contragent-payments/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dueDateDays: 7
    }),
  });
  
  const data = await response.json();
  console.log('Synced payments:', data);
}

// 2. To'lanmagan to'lovlarni ko'rish
async function getUnpaidPayments(token) {
  const response = await fetch('http://localhost:5000/api/admin-contragent-payments/unpaid?isOverdue=true', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  console.log('Unpaid payments:', data);
}

// 3. To'lovlarni to'lash
async function markAsPaid(token, paymentIds) {
  const response = await fetch('http://localhost:5000/api/admin-contragent-payments/mark-as-paid', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIds: paymentIds,
      notes: 'Naqd pul orqali to\'landi'
    }),
  });
  
  const data = await response.json();
  console.log('Marked as paid:', data);
}

// 4. Statistikani ko'rish
async function getStatistics(token) {
  const response = await fetch('http://localhost:5000/api/admin-contragent-payments/statistics', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  console.log('Statistics:', data);
}
```

---

## Payment Calculation

### How Contragent Payment is Calculated

1. **For each order:**
   - Order status must be `confirmed_by_customer`
   - Contragent request status must be `delivered_to_punkt`
   - For each item in the order:
     - If item belongs to contragent and is in delivered request:
       - `itemTotalPrice = item.price × item.quantity`
       - `itemKpiPrice = ((item.price - item.originalPrice) × item.quantity × item.kpiBonusPercent) / 100`
       - `itemPaymentAmount = itemTotalPrice - itemKpiPrice`

2. **Total Payment:**
   - `totalPaymentAmount = sum of all itemPaymentAmount for the contragent`

3. **Payment Creation:**
   - If payment already exists (pending status and same dueDate):
     - Add order to existing payment
     - Update amount (add to existing)
   - Else:
     - Create new payment with dueDate = currentDate + dueDateDays

4. **Overdue Detection:**
   - If `status === 'pending'` and `currentDate > dueDate`:
     - `isOverdue = true`

---

## Important Notes

- To'lov summa = `totalPrice - totalKpiPrice` (KPI dan oshgan summa)
- To'lov muddati belgilanishi shart (sync endpoint'ida `dueDateDays` parametri)
- Muddat o'tgan to'lovlar `isOverdue: true` bilan ko'rsatiladi
- To'lovlar tasdiqlanganda Contragentlarga bildirishnoma yuboriladi
- Bir xil Contragent va bir xil dueDate uchun to'lovlar birlashtiriladi

