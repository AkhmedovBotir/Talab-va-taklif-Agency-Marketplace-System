# Agent Finance API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [MFY Agent](#mfy-agent)
    - [Kunlik Hisobot](#1-mfy-kunlik-hisobot)
    - [Kutilayotgan To'lovlar](#2-mfy-kutilayotgan-tolovlar)
    - [To'lovni Qabul Qilish](#3-mfy-tolovni-qabul-qilish)
    - [Tuman Agentga Topshirish](#4-mfy-tuman-agentga-topshirish)
    - [Statistika](#5-mfy-statistika)
  - [Tuman Agent](#tuman-agent)
    - [Tuman Hisoboti](#6-tuman-hisoboti)
    - [MFY Agentlardan Kelgan Topshiruvlar](#7-tuman-mfy-agentlardan-kelgan-topshiruvlar)
    - [Topshiruvni Tasdiqlash](#8-tuman-topshiruvni-tasdiqlash)
    - [Viloyat Agentga Topshirish](#9-tuman-viloyat-agentga-topshirish)
    - [Statistika](#10-tuman-statistika)
  - [Viloyat Agent](#viloyat-agent)
    - [Viloyat Hisoboti](#11-viloyat-hisoboti)
    - [Tuman Agentlardan Kelgan Topshiruvlar](#12-viloyat-tuman-agentlardan-kelgan-topshiruvlar)
    - [Topshiruvni Tasdiqlash](#13-viloyat-topshiruvni-tasdiqlash)
    - [Moliya Bo'limiga Topshirish](#14-viloyat-moliya-bolimiga-topshirish)
    - [Statistika](#15-viloyat-statistika)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Agent Finance API agentlar (MFY, Tuman, Viloyat) uchun moliya boshqaruvi funksiyalarini ta'minlaydi. Har bir agent turi uchun alohida endpoint'lar mavjud.

**Base Path:** `/api/agent-finance`

---

## Base URL

```
http://localhost:5000/api/agent-finance
```

---

## Authentication

Barcha endpoint'lar Agent autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <agent_token>`

**Eslatma:** Har bir endpoint faqat tegishli agent turi uchun ishlaydi. Masalan, MFY agent endpoint'lari faqat MFY agentlar tomonidan ishlatilishi mumkin.

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
  "transactionPath": [],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### AgentDailyReport
```json
{
  "_id": "ObjectId",
  "agent": "ObjectId (Agent)",
  "date": "2024-01-15T00:00:00.000Z",
  "agentType": "mfy|tuman|viloyat",
  "ordersCount": 25,
  "totalAmount": 3750000,
  "collectedAmount": 3750000,
  "submittedAmount": 3000000,
  "pendingAmount": 750000,
  "cashAmount": 2250000,
  "cardAmount": 1500000,
  "isSubmitted": false,
  "transactions": ["ObjectId (PaymentTransaction)"]
}
```

### FinanceSubmission
```json
{
  "_id": "ObjectId",
  "fromAgent": "ObjectId (Agent)",
  "fromAgentType": "mfy|tuman|viloyat",
  "toAgent": "ObjectId (Agent)",
  "toAgentType": "tuman|viloyat|finance",
  "amount": 5000000,
  "submissionDate": "2024-01-15T10:30:00.000Z",
  "status": "pending|confirmed|rejected",
  "transactions": ["ObjectId (PaymentTransaction)"],
  "cashAmount": 3000000,
  "cardAmount": 2000000,
  "transactionsCount": 25
}
```

---

## Endpoints

### MFY Agent

MFY agentlar uchun endpoint'lar. Faqat `mfy` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 1. MFY Kunlik Hisobot

MFY agent uchun kunlik hisobot. Qabul qilingan to'lovlar, topshirilgan summalar va kutilayotgan summalar ko'rsatiladi.

**Endpoint:** `GET /mfy/daily-report`

**Query Parameters:**
- `date` (optional): Sana (format: `YYYY-MM-DD`). Agar berilmasa, bugungi sana ishlatiladi.

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "ObjectId",
    "date": "2024-01-15T00:00:00.000Z",
    "ordersCount": 25,
    "totalAmount": 3750000,
    "collectedAmount": 3750000,
    "submittedAmount": 3000000,
    "pendingAmount": 750000,
    "cashAmount": 2250000,
    "cardAmount": 1500000,
    "isSubmitted": false,
    "submittedAt": null,
    "transactions": [
      {
        "_id": "ObjectId",
        "order": {
          "orderNumber": "00001",
          "totalPrice": 150000
        },
        "amount": 150000,
        "paymentMethod": "cash",
        "status": "collected"
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/mfy/daily-report?date=2024-01-15" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

#### 2. MFY Kutilayotgan To'lovlar

MFY agent hududidagi kutilayotgan to'lovlar ro'yxati.

**Endpoint:** `GET /mfy/pending-payments`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "transactions": [
    {
      "_id": "ObjectId",
      "order": {
        "_id": "ObjectId",
        "orderNumber": "00001",
        "totalPrice": 150000,
        "status": "confirmed_by_customer",
        "deliveryMfy": "ObjectId"
      },
      "user": {
        "_id": "ObjectId",
        "name": "Foydalanuvchi",
        "phone": "+998901234567"
      },
      "amount": 150000,
      "paymentMethod": "cash",
      "status": "pending",
      "currentHolder": "user",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/mfy/pending-payments" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

#### 3. MFY To'lovni Qabul Qilish

MFY agent to'lovni qabul qiladi.

**Endpoint:** `POST /mfy/collect-payment/:transactionId`

**URL Parameters:**
- `transactionId`: To'lov transaksiyasi ID

**Response:**
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli qabul qilindi",
  "transaction": {
    "id": "ObjectId",
    "status": "collected",
    "collectedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/mfy/collect-payment/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

#### 4. MFY Tuman Agentga Topshirish

MFY agent to'lovlarni tuman agentga topshiradi.

**Endpoint:** `POST /mfy/submit-to-district`

**Request Body:**
```json
{
  "transactionIds": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2"
  ],
  "notes": "Kunlik topshiruv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli topshirildi",
  "submission": {
    "id": "ObjectId",
    "amount": 3000000,
    "transactionsCount": 20,
    "submittedAt": "2024-01-15T18:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/mfy/submit-to-district" \
  -H "Authorization: Bearer <mfy_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1", "65a1b2c3d4e5f6g7h8i9j0k2"],
    "notes": "Kunlik topshiruv"
  }'
```

---

#### 5. MFY Statistika

MFY agent uchun statistika.

**Endpoint:** `GET /mfy/statistics`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalOrders": 500,
    "totalAmount": 75000000,
    "collectedAmount": 75000000,
    "submittedAmount": 70000000,
    "pendingAmount": 5000000,
    "cashAmount": 45000000,
    "cardAmount": 30000000
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/mfy/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

### Tuman Agent

Tuman agentlar uchun endpoint'lar. Faqat `tuman` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 6. Tuman Hisoboti

Tuman agent uchun kunlik hisobot. Barcha MFY agentlardan kelgan topshiruvlar ko'rsatiladi.

**Endpoint:** `GET /district/report`

**Query Parameters:**
- `date` (optional): Sana (format: `YYYY-MM-DD`). Agar berilmasa, bugungi sana ishlatiladi.

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-15T00:00:00.000Z",
    "submissionsCount": 5,
    "totalReceived": 15000000,
    "pendingAmount": 5000000,
    "submissions": [
      {
        "id": "ObjectId",
        "fromAgent": {
          "_id": "ObjectId",
          "name": "MFY Agent",
          "phone": "+998901234567"
        },
        "amount": 3000000,
        "status": "confirmed",
        "submissionDate": "2024-01-15T18:00:00.000Z",
        "transactionsCount": 20
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/district/report?date=2024-01-15" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

#### 7. Tuman MFY Agentlardan Kelgan Topshiruvlar

Tuman agentga MFY agentlardan kelgan topshiruvlar ro'yxati.

**Endpoint:** `GET /district/submissions`

**Query Parameters:**
- `status` (optional): Status (`pending`, `confirmed`, `rejected`). Default: `pending`

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
        "name": "MFY Agent",
        "phone": "+998901234567",
        "mfy": {
          "_id": "ObjectId",
          "name": "Yunusobod MFY"
        }
      },
      "amount": 3000000,
      "status": "pending",
      "transactionsCount": 20,
      "submissionDate": "2024-01-15T18:00:00.000Z",
      "createdAt": "2024-01-15T18:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/district/submissions?status=pending" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

#### 8. Tuman Topshiruvni Tasdiqlash

Tuman agent MFY agentdan kelgan topshiruvni tasdiqlaydi.

**Endpoint:** `POST /district/confirm-submission/:submissionId`

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
    "confirmedAt": "2024-01-15T19:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/district/confirm-submission/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

#### 9. Tuman Viloyat Agentga Topshirish

Tuman agent to'lovlarni viloyat agentga topshiradi.

**Endpoint:** `POST /district/submit-to-province`

**Request Body:**
```json
{
  "transactionIds": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2"
  ],
  "notes": "Kunlik topshiruv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli topshirildi",
  "submission": {
    "id": "ObjectId",
    "amount": 15000000,
    "transactionsCount": 100,
    "submittedAt": "2024-01-15T20:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/district/submit-to-province" \
  -H "Authorization: Bearer <tuman_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1", "65a1b2c3d4e5f6g7h8i9j0k2"],
    "notes": "Kunlik topshiruv"
  }'
```

---

#### 10. Tuman Statistika

Tuman agent uchun statistika.

**Endpoint:** `GET /district/statistics`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "submissionsCount": 150,
    "totalReceived": 450000000,
    "pendingAmount": 50000000
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/district/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

### Viloyat Agent

Viloyat agentlar uchun endpoint'lar. Faqat `viloyat` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 11. Viloyat Hisoboti

Viloyat agent uchun kunlik hisobot. Barcha tuman agentlardan kelgan topshiruvlar ko'rsatiladi.

**Endpoint:** `GET /province/report`

**Query Parameters:**
- `date` (optional): Sana (format: `YYYY-MM-DD`). Agar berilmasa, bugungi sana ishlatiladi.

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-15T00:00:00.000Z",
    "submissionsCount": 10,
    "totalReceived": 50000000,
    "pendingAmount": 10000000,
    "submissions": [
      {
        "id": "ObjectId",
        "fromAgent": {
          "_id": "ObjectId",
          "name": "Tuman Agent",
          "phone": "+998901234567",
          "tuman": {
            "_id": "ObjectId",
            "name": "Chirchiq tumani"
          }
        },
        "amount": 15000000,
        "status": "confirmed",
        "submissionDate": "2024-01-15T20:00:00.000Z",
        "transactionsCount": 100
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/province/report?date=2024-01-15" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

#### 12. Viloyat Tuman Agentlardan Kelgan Topshiruvlar

Viloyat agentga tuman agentlardan kelgan topshiruvlar ro'yxati.

**Endpoint:** `GET /province/submissions`

**Query Parameters:**
- `status` (optional): Status (`pending`, `confirmed`, `rejected`). Default: `pending`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "submissions": [
    {
      "_id": "ObjectId",
      "fromAgent": {
        "_id": "ObjectId",
        "name": "Tuman Agent",
        "phone": "+998901234567",
        "tuman": {
          "_id": "ObjectId",
          "name": "Chirchiq tumani"
        }
      },
      "amount": 15000000,
      "status": "pending",
      "transactionsCount": 100,
      "submissionDate": "2024-01-15T20:00:00.000Z",
      "createdAt": "2024-01-15T20:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/province/submissions?status=pending" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

#### 13. Viloyat Topshiruvni Tasdiqlash

Viloyat agent tuman agentdan kelgan topshiruvni tasdiqlaydi.

**Endpoint:** `POST /province/confirm-submission/:submissionId`

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
    "confirmedAt": "2024-01-15T21:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/province/confirm-submission/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

#### 14. Viloyat Moliya Bo'limiga Topshirish

Viloyat agent to'lovlarni moliya bo'limiga topshiradi.

**Endpoint:** `POST /province/submit-to-finance`

**Request Body:**
```json
{
  "transactionIds": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2"
  ],
  "notes": "Kunlik topshiruv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli moliya bo'limiga topshirildi",
  "submission": {
    "id": "ObjectId",
    "amount": 50000000,
    "transactionsCount": 350,
    "submittedAt": "2024-01-15T22:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent-finance/province/submit-to-finance" \
  -H "Authorization: Bearer <viloyat_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1", "65a1b2c3d4e5f6g7h8i9j0k2"],
    "notes": "Kunlik topshiruv"
  }'
```

---

#### 15. Viloyat Statistika

Viloyat agent uchun statistika.

**Endpoint:** `GET /province/statistics`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "submissionsCount": 300,
    "totalReceived": 1500000000,
    "pendingAmount": 100000000
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent-finance/province/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <viloyat_agent_token>"
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
- `403` - Ruxsat yo'q (agent turi mos kelmaydi)
- `404` - Topilmadi
- `500` - Server xatosi

**Eslatma:** Agar agent noto'g'ri turda bo'lsa (masalan, MFY agent Tuman agent endpoint'ini chaqirsa), `403` status code qaytariladi.

---

## Examples

### MFY Agent: To'liq misol

```bash
# 1. Kunlik hisobotni olish
curl -X GET "http://localhost:5000/api/agent-finance/mfy/daily-report" \
  -H "Authorization: Bearer <mfy_agent_token>"

# 2. Kutilayotgan to'lovlarni ko'rish
curl -X GET "http://localhost:5000/api/agent-finance/mfy/pending-payments" \
  -H "Authorization: Bearer <mfy_agent_token>"

# 3. To'lovni qabul qilish
curl -X POST "http://localhost:5000/api/agent-finance/mfy/collect-payment/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <mfy_agent_token>"

# 4. Tuman agentga topshirish
curl -X POST "http://localhost:5000/api/agent-finance/mfy/submit-to-district" \
  -H "Authorization: Bearer <mfy_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1"],
    "notes": "Kunlik topshiruv"
  }'
```

### Tuman Agent: To'liq misol

```bash
# 1. Tuman hisobotini olish
curl -X GET "http://localhost:5000/api/agent-finance/district/report" \
  -H "Authorization: Bearer <tuman_agent_token>"

# 2. MFY agentlardan kelgan topshiruvlarni ko'rish
curl -X GET "http://localhost:5000/api/agent-finance/district/submissions" \
  -H "Authorization: Bearer <tuman_agent_token>"

# 3. Topshiruvni tasdiqlash
curl -X POST "http://localhost:5000/api/agent-finance/district/confirm-submission/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <tuman_agent_token>"

# 4. Viloyat agentga topshirish
curl -X POST "http://localhost:5000/api/agent-finance/district/submit-to-province" \
  -H "Authorization: Bearer <tuman_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1"],
    "notes": "Kunlik topshiruv"
  }'
```

### Viloyat Agent: To'liq misol

```bash
# 1. Viloyat hisobotini olish
curl -X GET "http://localhost:5000/api/agent-finance/province/report" \
  -H "Authorization: Bearer <viloyat_agent_token>"

# 2. Tuman agentlardan kelgan topshiruvlarni ko'rish
curl -X GET "http://localhost:5000/api/agent-finance/province/submissions" \
  -H "Authorization: Bearer <viloyat_agent_token>"

# 3. Topshiruvni tasdiqlash
curl -X POST "http://localhost:5000/api/agent-finance/province/confirm-submission/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <viloyat_agent_token>"

# 4. Moliya bo'limiga topshirish
curl -X POST "http://localhost:5000/api/agent-finance/province/submit-to-finance" \
  -H "Authorization: Bearer <viloyat_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["65a1b2c3d4e5f6g7h8i9j0k1"],
    "notes": "Kunlik topshiruv"
  }'
```

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0


