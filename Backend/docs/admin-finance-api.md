# Admin Finance API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Hisobotlar](#hisobotlar)
    - [Kunlik Hisobot](#1-kunlik-hisobot)
    - [Haftalik Hisobot](#2-haftalik-hisobot)
    - [Oylik Hisobot](#3-oylik-hisobot)
    - [Yillik Hisobot](#4-yillik-hisobot)
    - [Belgilangan Muddat Hisoboti](#5-belgilangan-muddat-hisoboti)
  - [Topshiruvlar](#topshiruvlar)
    - [Kutilayotgan Topshiruvlar](#6-kutilayotgan-topshiruvlar)
    - [Topshiruvni Tasdiqlash](#7-topshiruvni-tasdiqlash)
    - [Topshiruvni Rad Etish](#8-topshiruvni-rad-etish)
  - [Transaksiyalar](#transaksiyalar)
    - [Barcha Transaksiyalar](#9-barcha-transaksiyalar)
  - [Statistika](#statistika)
    - [Umumiy Statistika](#10-umumiy-statistika)
    - [Viloyat Bo'yicha Statistika](#11-viloyat-boyicha-statistika)
    - [Tuman Bo'yicha Statistika](#12-tuman-boyicha-statistika)
    - [MFY Bo'yicha Statistika](#13-mfy-boyicha-statistika)
    - [Agentlar Faolligi](#14-agentlar-faolligi)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin Finance API moliya bo'limi uchun to'liq moliya boshqaruvi funksiyalarini ta'minlaydi. Bu API orqali kunlik, haftalik, oylik, yillik va belgilangan muddat hisobotlarini olish, topshiruvlarni tasdiqlash yoki rad etish, barcha transaksiyalarni ko'rish va batafsil statistikani olish mumkin.

**Base Path:** `/api/admin-finance`

---

## Base URL

```
http://localhost:5000/api/admin-finance
```

---

## Authentication

Barcha endpoint'lar Admin autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <admin_token>`

---

## Data Models

### PaymentTransaction
```json
{
  "_id": "ObjectId",
  "order": "ObjectId (Order)",
  "user": "ObjectId (MarketplaceUser)",
  "amount": 150000,
  "paymentMethod": "cash|card",
  "status": "pending|collected|submitted|received|confirmed|rejected",
  "collectedBy": "ObjectId (Agent)",
  "collectedAt": "2024-01-15T10:30:00.000Z",
  "currentHolder": "user|mfy_agent|district_agent|province_agent|finance",
  "transactionPath": [
    {
      "holder": "user",
      "holderId": "ObjectId",
      "action": "paid",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "note": "Foydalanuvchi tomonidan to'lov qilindi"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### FinanceSubmission
```json
{
  "_id": "ObjectId",
  "fromAgent": "ObjectId (Agent)",
  "fromAgentType": "mfy|tuman|viloyat",
  "toAgent": "ObjectId (Agent) | null",
  "toAgentType": "tuman|viloyat|finance",
  "amount": 5000000,
  "submissionDate": "2024-01-15T10:30:00.000Z",
  "status": "pending|confirmed|rejected",
  "transactions": ["ObjectId (PaymentTransaction)"],
  "cashAmount": 3000000,
  "cardAmount": 2000000,
  "transactionsCount": 25,
  "confirmedBy": "ObjectId",
  "confirmedAt": "2024-01-15T11:00:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Endpoints

### Hisobotlar

#### 1. Kunlik Hisobot

Bugungi kun uchun moliya bo'limiga topshirilgan to'lovlar haqida hisobot.

**Endpoint:** `GET /reports/daily`

**Query Parameters:**
- `date` (optional): Sana (format: `YYYY-MM-DD`). Agar berilmasa, bugungi sana ishlatiladi.

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-15T00:00:00.000Z",
    "totalReceived": 50000000,
    "totalOrders": 350,
    "submissionsCount": 12,
    "confirmedCount": 10,
    "pendingCount": 2,
    "byRegion": [
      {
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 20000000,
        "ordersCount": 140
      }
    ],
    "submissions": [
      {
        "id": "ObjectId",
        "fromAgent": {
          "_id": "ObjectId",
          "name": "Viloyat Agent",
          "phone": "+998901234567"
        },
        "amount": 5000000,
        "status": "confirmed",
        "transactionsCount": 35,
        "submissionDate": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/reports/daily?date=2024-01-15" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 2. Haftalik Hisobot

Joriy hafta uchun moliya bo'limiga topshirilgan to'lovlar haqida hisobot.

**Endpoint:** `GET /reports/weekly`

**Response:**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2024-01-14T00:00:00.000Z",
      "endDate": "2024-01-20T23:59:59.999Z"
    },
    "totalReceived": 350000000,
    "totalOrders": 2450,
    "byRegion": [
      {
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 140000000,
        "ordersCount": 980
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2024-01-14T00:00:00.000Z",
        "totalAmount": 50000000,
        "ordersCount": 350
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/reports/weekly" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 3. Oylik Hisobot

Belgilangan oy uchun moliya bo'limiga topshirilgan to'lovlar haqida hisobot.

**Endpoint:** `GET /reports/monthly`

**Query Parameters:**
- `year` (optional): Yil (default: joriy yil)
- `month` (optional): Oy (1-12, default: joriy oy)

**Response:**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z",
      "year": 2024,
      "month": 1
    },
    "totalReceived": 1500000000,
    "totalOrders": 10500,
    "byRegion": [
      {
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 600000000,
        "ordersCount": 4200
      }
    ],
    "byDistrict": [
      {
        "district": {
          "_id": "ObjectId",
          "name": "Chirchiq tumani"
        },
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 100000000,
        "ordersCount": 700
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2024-01-01T00:00:00.000Z",
        "totalAmount": 50000000,
        "ordersCount": 350
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/reports/monthly?year=2024&month=1" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 4. Yillik Hisobot

Belgilangan yil uchun moliya bo'limiga topshirilgan to'lovlar haqida hisobot.

**Endpoint:** `GET /reports/yearly`

**Query Parameters:**
- `year` (optional): Yil (default: joriy yil)

**Response:**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-12-31T23:59:59.999Z",
      "year": 2024
    },
    "totalReceived": 18000000000,
    "totalOrders": 126000,
    "byRegion": [
      {
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 7200000000,
        "ordersCount": 50400
      }
    ],
    "monthlyBreakdown": [
      {
        "month": 1,
        "totalAmount": 1500000000,
        "ordersCount": 10500
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/reports/yearly?year=2024" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 5. Belgilangan Muddat Hisoboti

Belgilangan muddat uchun moliya bo'limiga topshirilgan to'lovlar haqida hisobot.

**Endpoint:** `GET /reports/custom`

**Query Parameters:**
- `startDate` (required): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (required): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalReceived": 1500000000,
    "totalOrders": 10500,
    "byRegion": [
      {
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 600000000,
        "ordersCount": 4200
      }
    ],
    "byDistrict": [
      {
        "district": {
          "_id": "ObjectId",
          "name": "Chirchiq tumani"
        },
        "region": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "totalAmount": 100000000,
        "ordersCount": 700
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/reports/custom?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### Topshiruvlar

#### 6. Kutilayotgan Topshiruvlar

Moliya bo'limiga kutilayotgan topshiruvlarni ko'rish.

**Endpoint:** `GET /submissions/pending`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "submissions": [
    {
      "_id": "ObjectId",
      "fromAgent": {
        "_id": "ObjectId",
        "name": "Viloyat Agent",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        }
      },
      "amount": 5000000,
      "status": "pending",
      "transactionsCount": 35,
      "submissionDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/submissions/pending" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 7. Topshiruvni Tasdiqlash

Moliya bo'limiga topshirilgan to'lovlarni tasdiqlash.

**Endpoint:** `POST /submissions/:submissionId/confirm`

**URL Parameters:**
- `submissionId`: Topshiruv ID

**Response:**
```json
{
  "success": true,
  "message": "Topshiruv muvaffaqiyatli tasdiqlandi",
  "submission": {
    "id": "ObjectId",
    "status": "confirmed",
    "confirmedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/admin-finance/submissions/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 8. Topshiruvni Rad Etish

Moliya bo'limiga topshirilgan to'lovlarni rad etish.

**Endpoint:** `POST /submissions/:submissionId/reject`

**URL Parameters:**
- `submissionId`: Topshiruv ID

**Request Body:**
```json
{
  "rejectionReason": "Summalar mos kelmaydi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Topshiruv rad etildi",
  "submission": {
    "id": "ObjectId",
    "status": "rejected",
    "rejectedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/admin-finance/submissions/65a1b2c3d4e5f6g7h8i9j0k1/reject" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"rejectionReason": "Summalar mos kelmaydi"}'
```

---

### Transaksiyalar

#### 9. Barcha Transaksiyalar

Barcha to'lov transaksiyalarini ko'rish (filtrlash va pagination bilan).

**Endpoint:** `GET /transactions`

**Query Parameters:**
- `status` (optional): Status (`pending`, `collected`, `submitted`, `received`, `confirmed`, `rejected`)
- `paymentMethod` (optional): To'lov usuli (`cash`, `card`)
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi
- `currentHolder` (optional): Hozirgi egasi (`user`, `mfy_agent`, `district_agent`, `province_agent`, `finance`)
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Har bir sahifadagi elementlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "transactions": [
    {
      "_id": "ObjectId",
      "order": {
        "_id": "ObjectId",
        "orderNumber": "00001",
        "totalPrice": 150000
      },
      "user": {
        "_id": "ObjectId",
        "name": "Foydalanuvchi",
        "phone": "+998901234567"
      },
      "amount": 150000,
      "paymentMethod": "cash",
      "status": "confirmed",
      "currentHolder": "finance",
      "transactionPath": [],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/transactions?status=confirmed&page=1&limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

---

### Statistika

#### 10. Umumiy Statistika

Umumiy moliya statistikasi.

**Endpoint:** `GET /statistics`

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalTransactions": 15000,
    "totalAmount": 2250000000,
    "byStatus": [
      {
        "_id": "confirmed",
        "count": 12000,
        "total": 1800000000
      }
    ],
    "byPaymentMethod": [
      {
        "_id": "cash",
        "count": 9000,
        "total": 1350000000
      },
      {
        "_id": "card",
        "count": 6000,
        "total": 900000000
      }
    ],
    "submissions": {
      "confirmed": 500,
      "pending": 10
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/statistics" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 11. Viloyat Bo'yicha Statistika

Viloyatlar bo'yicha to'lovlar statistikasi.

**Endpoint:** `GET /statistics/region`

**Response:**
```json
{
  "success": true,
  "statistics": [
    {
      "region": {
        "_id": "ObjectId",
        "name": "Toshkent viloyati"
      },
      "totalAmount": 900000000,
      "ordersCount": 6300
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/statistics/region" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 12. Tuman Bo'yicha Statistika

Tumanlar bo'yicha to'lovlar statistikasi.

**Endpoint:** `GET /statistics/district`

**Query Parameters:**
- `regionId` (optional): Viloyat ID (faqat shu viloyatdagi tumanlar)

**Response:**
```json
{
  "success": true,
  "statistics": [
    {
      "district": {
        "_id": "ObjectId",
        "name": "Chirchiq tumani"
      },
      "region": {
        "_id": "ObjectId",
        "name": "Toshkent viloyati"
      },
      "totalAmount": 150000000,
      "ordersCount": 1050
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/statistics/district?regionId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 13. MFY Bo'yicha Statistika

MFY'lar bo'yicha to'lovlar statistikasi.

**Endpoint:** `GET /statistics/mfy`

**Query Parameters:**
- `districtId` (optional): Tuman ID (faqat shu tumandagi MFY'lar)

**Response:**
```json
{
  "success": true,
  "statistics": [
    {
      "mfy": {
        "_id": "ObjectId",
        "name": "Yunusobod MFY"
      },
      "totalAmount": 30000000,
      "ordersCount": 210
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/statistics/mfy?districtId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 14. Agentlar Faolligi

Agentlar bo'yicha to'lovlar statistikasi va reytingi.

**Endpoint:** `GET /statistics/agent-performance`

**Query Parameters:**
- `agentType` (optional): Agent turi (`mfy`, `tuman`, `viloyat`)
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi

**Response:**
```json
{
  "success": true,
  "performance": [
    {
      "agent": {
        "id": "ObjectId",
        "name": "MFY Agent",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "ObjectId",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "ObjectId",
          "name": "Chirchiq tumani"
        },
        "mfy": {
          "_id": "ObjectId",
          "name": "Yunusobod MFY"
        },
        "agentType": "mfy"
      },
      "ordersCount": 500,
      "totalAmount": 75000000
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/statistics/agent-performance?agentType=mfy" \
  -H "Authorization: Bearer <admin_token>"
```

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
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

---

## Examples

### To'liq misol: Kunlik hisobot olish va topshiruvni tasdiqlash

```bash
# 1. Kunlik hisobotni olish
curl -X GET "http://localhost:5000/api/admin-finance/reports/daily" \
  -H "Authorization: Bearer <admin_token>"

# 2. Kutilayotgan topshiruvlarni ko'rish
curl -X GET "http://localhost:5000/api/admin-finance/submissions/pending" \
  -H "Authorization: Bearer <admin_token>"

# 3. Topshiruvni tasdiqlash
curl -X POST "http://localhost:5000/api/admin-finance/submissions/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <admin_token>"
```

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0

