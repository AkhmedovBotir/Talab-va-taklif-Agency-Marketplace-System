# Agent Finance API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [MFY Agent](#mfy-agent)
  - [Tuman Agent](#tuman-agent)
  - [Viloyat Agent](#viloyat-agent)
- [Workflow](#workflow)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Agent Finance API agentlar tomonidan to'lovlarni qabul qilish, boshqarish va yuqori darajadagi agentlarga topshirish uchun ishlatiladi.

**Asosiy Xususiyatlar:**
- MFY agentlar mijozlardan to'lovlarni qabul qiladi
- MFY agentlar to'lovlarni tuman agentga topshiradi
- Tuman agentlar barcha MFY agentlardan kelgan to'lovlarni qabul qiladi va viloyat agentga topshiradi
- Viloyat agentlar barcha tuman agentlardan kelgan to'lovlarni qabul qiladi va moliya bo'limiga topshiradi
- Har kuni kunlik hisobotlar va statistikalar

**Base Path:** `/api/agent/finance`

---

## Base URL

```
http://localhost:5000/api/agent/finance
```

---

## Authentication

Barcha endpointlar Agent JWT token talab qiladi.

**Headers:**
```
Authorization: Bearer <agent_token>
```

---

## Data Models

### Agent Daily Report

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "agent": "507f1f77bcf86cd799439012",
  "date": "2024-01-15T00:00:00.000Z",
  "agentType": "mfy",
  "ordersCount": 10,
  "totalAmount": 500000,
  "collectedAmount": 500000,
  "submittedAmount": 300000,
  "pendingAmount": 200000,
  "receivedAmount": 0,
  "cashAmount": 300000,
  "cardAmount": 200000,
  "isSubmitted": false,
  "submittedAt": null,
  "transactions": ["507f1f77bcf86cd799439013"],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Finance Submission

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "fromAgent": "507f1f77bcf86cd799439012",
  "fromAgentType": "mfy",
  "toAgent": "507f1f77bcf86cd799439015",
  "toAgentType": "tuman",
  "amount": 300000,
  "cashAmount": 200000,
  "cardAmount": 100000,
  "transactionsCount": 5,
  "submissionDate": "2024-01-15T14:00:00.000Z",
  "status": "pending",
  "transactions": ["507f1f77bcf86cd799439013"],
  "notes": "",
  "createdAt": "2024-01-15T14:00:00.000Z",
  "updatedAt": "2024-01-15T14:00:00.000Z"
}
```

### Payment Transaction

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "order": "507f1f77bcf86cd799439016",
  "user": "507f1f77bcf86cd799439017",
  "amount": 50000,
  "paymentMethod": "cash",
  "status": "collected",
  "collectedBy": "507f1f77bcf86cd799439012",
  "collectedAt": "2024-01-15T10:30:00.000Z",
  "currentHolder": "mfy_agent",
  "currentHolderId": "507f1f77bcf86cd799439012",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Endpoints

## MFY Agent

### 1. Get Daily Report

Kunlik hisobotni olish. Har kuni qancha buyurtma qabul qilgani, qancha to'lovni qabul qilgani, umumiy summalar va qancha topshirayotgani ko'rsatiladi.

**Endpoint:** `GET /api/agent/finance/mfy/daily-report`

**Query Parameters:**
- `date` (optional, format: `YYYY-MM-DD`): Sana. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "ordersCount": 10,
    "totalAmount": 500000,
    "collectedAmount": 500000,
    "submittedAmount": 300000,
    "pendingAmount": 200000,
    "cashAmount": 300000,
    "cardAmount": 200000,
    "isSubmitted": false,
    "submittedAt": null,
    "transactions": ["507f1f77bcf86cd799439013"]
  }
}
```

**Response Fields:**
- `ordersCount`: Qabul qilingan buyurtmalar soni
- `totalAmount`: Jami summa
- `collectedAmount`: Qabul qilingan summa
- `submittedAmount`: Topshirilgan summa
- `pendingAmount`: Kutilayotgan summa (collectedAmount - submittedAmount)
- `cashAmount`: Naqd pul summa
- `cardAmount`: Karta orqali to'lov summa
- `isSubmitted`: Topshirilgan yoki yo'q
- `submittedAt`: Topshirilgan vaqt

---

### 2. Get Pending Payments

Kutilayotgan to'lovlarni ko'rish (mijozlar tomonidan to'langan, lekin hali MFY agent tomonidan qabul qilinmagan).

**Endpoint:** `GET /api/agent/finance/mfy/pending-payments`

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "order": {
        "_id": "507f1f77bcf86cd799439016",
        "orderNumber": "00001",
        "totalPrice": 50000,
        "status": "confirmed_by_customer",
        "deliveryMfy": "507f1f77bcf86cd799439018"
      },
      "user": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Ali Valiyev",
        "phone": "+998901234567"
      },
      "amount": 50000,
      "paymentMethod": "cash",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Collect Payment

To'lovni qabul qilish (mijozdan to'lovni olish).

**Endpoint:** `POST /api/agent/finance/mfy/collect-payment/:transactionId`

**Path Parameters:**
- `transactionId` (required): To'lov transaksiyasi ID

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli qabul qilindi",
  "transaction": {
    "id": "507f1f77bcf86cd799439013",
    "status": "collected",
    "collectedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Bu to'lov sizning hududingizga tegishli emas"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bu to'lov allaqachon qabul qilingan"
}
```

---

### 4. Submit to District

Tuman agentga to'lovlarni topshirish.

**Endpoint:** `POST /api/agent/finance/mfy/submit-to-district`

**Request Body:**
```json
{
  "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
  "notes": "Kunlik to'lovlar"
}
```

**Required Fields:**
- `transactionIds` (array, required): Topshiriladigan transaksiyalar ID'lari

**Optional Fields:**
- `notes` (string): Qo'shimcha eslatma

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli topshirildi",
  "submission": {
    "id": "507f1f77bcf86cd799439014",
    "amount": 300000,
    "transactionsCount": 5,
    "submittedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Ba'zi transaksiyalar topilmadi yoki qabul qilinmagan"
}
```

---

### 5. Get Statistics

Statistikani olish (sana oralig'ida).

**Endpoint:** `GET /api/agent/finance/mfy/statistics`

**Query Parameters:**
- `startDate` (optional, format: `YYYY-MM-DD`): Boshlanish sanasi. Default: bugungi sana
- `endDate` (optional, format: `YYYY-MM-DD`): Tugash sanasi. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    },
    "totalOrders": 50,
    "totalAmount": 2500000,
    "collectedAmount": 2500000,
    "submittedAmount": 2000000,
    "pendingAmount": 500000,
    "cashAmount": 1500000,
    "cardAmount": 1000000
  }
}
```

---

## Tuman Agent

### 1. Get District Report

Tuman hisoboti. Barcha MFY agentlardan kelgan topshiruvlar va qabul qilingan summalar.

**Endpoint:** `GET /api/agent/finance/district/report`

**Query Parameters:**
- `date` (optional, format: `YYYY-MM-DD`): Sana. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-15T00:00:00.000Z",
    "submissionsCount": 5,
    "totalReceived": 1500000,
    "pendingAmount": 500000,
    "submissions": [
      {
        "id": "507f1f77bcf86cd799439014",
        "fromAgent": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Ali Valiyev",
          "phone": "+998901234567"
        },
        "amount": 300000,
        "status": "confirmed",
        "submissionDate": "2024-01-15T14:00:00.000Z",
        "transactionsCount": 5
      }
    ]
  }
}
```

**Response Fields:**
- `submissionsCount`: Topshiruvlar soni
- `totalReceived`: Qabul qilingan jami summa (status: confirmed)
- `pendingAmount`: Kutilayotgan summa (status: pending)

---

### 2. Get District Submissions

MFY agentlardan kelgan topshiruvlarni ko'rish.

**Endpoint:** `GET /api/agent/finance/district/submissions`

**Query Parameters:**
- `status` (optional, enum: `pending`, `confirmed`, `rejected`): Topshiruv holati. Default: `pending`

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "submissions": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "fromAgent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ali Valiyev",
        "phone": "+998901234567",
        "mfy": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Yunusobod MFY"
        }
      },
      "amount": 300000,
      "cashAmount": 200000,
      "cardAmount": 100000,
      "transactionsCount": 5,
      "status": "pending",
      "submissionDate": "2024-01-15T14:00:00.000Z",
      "transactions": ["507f1f77bcf86cd799439013"],
      "notes": "",
      "createdAt": "2024-01-15T14:00:00.000Z"
    }
  ]
}
```

---

### 3. Confirm District Submission

Topshiruvni tasdiqlash (MFY agentdan kelgan to'lovlarni qabul qilish).

**Endpoint:** `POST /api/agent/finance/district/confirm-submission/:submissionId`

**Path Parameters:**
- `submissionId` (required): Topshiruv ID

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Topshiruv muvaffaqiyatli tasdiqlandi",
  "submission": {
    "id": "507f1f77bcf86cd799439014",
    "status": "confirmed",
    "confirmedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Bu topshiruv sizga tegishli emas"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bu topshiruv allaqachon tasdiqlangan yoki rad etilgan"
}
```

---

### 4. Submit to Province

Viloyat agentga to'lovlarni topshirish.

**Endpoint:** `POST /api/agent/finance/district/submit-to-province`

**Request Body:**
```json
{
  "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
  "notes": "Kunlik to'lovlar"
}
```

**Required Fields:**
- `transactionIds` (array, required): Topshiriladigan transaksiyalar ID'lari

**Optional Fields:**
- `notes` (string): Qo'shimcha eslatma

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli topshirildi",
  "submission": {
    "id": "507f1f77bcf86cd799439020",
    "amount": 1500000,
    "transactionsCount": 25,
    "submittedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

---

### 5. Get District Statistics

Statistikani olish (sana oralig'ida).

**Endpoint:** `GET /api/agent/finance/district/statistics`

**Query Parameters:**
- `startDate` (optional, format: `YYYY-MM-DD`): Boshlanish sanasi. Default: bugungi sana
- `endDate` (optional, format: `YYYY-MM-DD`): Tugash sanasi. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    },
    "submissionsCount": 10,
    "totalReceived": 5000000,
    "pendingAmount": 1000000
  }
}
```

---

## Viloyat Agent

### 1. Get Province Report

Viloyat hisoboti. Barcha tuman agentlardan kelgan topshiruvlar va qabul qilingan summalar.

**Endpoint:** `GET /api/agent/finance/province/report`

**Query Parameters:**
- `date` (optional, format: `YYYY-MM-DD`): Sana. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-15T00:00:00.000Z",
    "submissionsCount": 3,
    "totalReceived": 5000000,
    "pendingAmount": 1000000,
    "submissions": [
      {
        "id": "507f1f77bcf86cd799439020",
        "fromAgent": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Hasan Toshmatov",
          "phone": "+998901234568",
          "tuman": {
            "_id": "507f1f77bcf86cd799439021",
            "name": "Yunusobod tumani"
          }
        },
        "amount": 1500000,
        "status": "confirmed",
        "submissionDate": "2024-01-15T16:00:00.000Z",
        "transactionsCount": 25
      }
    ]
  }
}
```

---

### 2. Get Province Submissions

Tuman agentlardan kelgan topshiruvlarni ko'rish.

**Endpoint:** `GET /api/agent/finance/province/submissions`

**Query Parameters:**
- `status` (optional, enum: `pending`, `confirmed`, `rejected`): Topshiruv holati. Default: `pending`

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "submissions": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "fromAgent": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Hasan Toshmatov",
        "phone": "+998901234568",
        "tuman": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "Yunusobod tumani"
        }
      },
      "amount": 1500000,
      "cashAmount": 1000000,
      "cardAmount": 500000,
      "transactionsCount": 25,
      "status": "pending",
      "submissionDate": "2024-01-15T16:00:00.000Z",
      "transactions": ["507f1f77bcf86cd799439013"],
      "notes": "",
      "createdAt": "2024-01-15T16:00:00.000Z"
    }
  ]
}
```

---

### 3. Confirm Province Submission

Topshiruvni tasdiqlash (Tuman agentdan kelgan to'lovlarni qabul qilish).

**Endpoint:** `POST /api/agent/finance/province/confirm-submission/:submissionId`

**Path Parameters:**
- `submissionId` (required): Topshiruv ID

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Topshiruv muvaffaqiyatli tasdiqlandi",
  "submission": {
    "id": "507f1f77bcf86cd799439020",
    "status": "confirmed",
    "confirmedAt": "2024-01-15T17:00:00.000Z"
  }
}
```

---

### 4. Submit to Finance

Moliya bo'limiga to'lovlarni topshirish.

**Endpoint:** `POST /api/agent/finance/province/submit-to-finance`

**Request Body:**
```json
{
  "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
  "notes": "Kunlik to'lovlar"
}
```

**Required Fields:**
- `transactionIds` (array, required): Topshiriladigan transaksiyalar ID'lari

**Optional Fields:**
- `notes` (string): Qo'shimcha eslatma

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar muvaffaqiyatli moliya bo'limiga topshirildi",
  "submission": {
    "id": "507f1f77bcf86cd799439021",
    "amount": 5000000,
    "transactionsCount": 100,
    "submittedAt": "2024-01-15T18:00:00.000Z"
  }
}
```

---

### 5. Get Province Statistics

Statistikani olish (sana oralig'ida).

**Endpoint:** `GET /api/agent/finance/province/statistics`

**Query Parameters:**
- `startDate` (optional, format: `YYYY-MM-DD`): Boshlanish sanasi. Default: bugungi sana
- `endDate` (optional, format: `YYYY-MM-DD`): Tugash sanasi. Default: bugungi sana

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    },
    "submissionsCount": 5,
    "totalReceived": 20000000,
    "pendingAmount": 2000000
  }
}
```

---

## Workflow

### 1. MFY Agent To'lov Qabul Qilish

```
1. Mijoz buyurtmani qabul qiladi va to'lov qiladi
2. To'lov transaksiyasi yaratiladi (status: pending)
3. MFY agent kutilayotgan to'lovlarni ko'radi (GET /mfy/pending-payments)
4. MFY agent to'lovni qabul qiladi (POST /mfy/collect-payment/:transactionId)
5. To'lov transaksiyasi yangilanadi (status: collected)
6. Kunlik hisobot avtomatik yangilanadi
```

### 2. MFY Agent Tuman Agentga Topshirish

```
1. MFY agent kunlik hisobotni ko'radi (GET /mfy/daily-report)
2. MFY agent qabul qilgan to'lovlarni tanlaydi
3. MFY agent tuman agentga topshiradi (POST /mfy/submit-to-district)
4. FinanceSubmission yaratiladi (status: pending)
5. To'lov transaksiyalari yangilanadi (status: submitted)
6. Kunlik hisobot yangilanadi (submittedAmount oshadi)
```

### 3. Tuman Agent Qabul Qilish va Viloyat Agentga Topshirish

```
1. Tuman agent MFY agentlardan kelgan topshiruvlarni ko'radi (GET /district/submissions)
2. Tuman agent topshiruvni tasdiqlaydi (POST /district/confirm-submission/:submissionId)
3. FinanceSubmission yangilanadi (status: confirmed)
4. To'lov transaksiyalari yangilanadi (status: received)
5. Tuman agent barcha qabul qilingan to'lovlarni viloyat agentga topshiradi (POST /district/submit-to-province)
6. Yangi FinanceSubmission yaratiladi (status: pending)
```

### 4. Viloyat Agent Qabul Qilish va Moliya Bo'limiga Topshirish

```
1. Viloyat agent tuman agentlardan kelgan topshiruvlarni ko'radi (GET /province/submissions)
2. Viloyat agent topshiruvni tasdiqlaydi (POST /province/confirm-submission/:submissionId)
3. FinanceSubmission yangilanadi (status: confirmed)
4. To'lov transaksiyalari yangilanadi (status: received)
5. Viloyat agent barcha qabul qilingan to'lovlarni moliya bo'limiga topshiradi (POST /province/submit-to-finance)
6. FinanceSubmission yaratiladi (toAgentType: finance)
7. To'lov transaksiyalari yangilanadi (currentHolder: finance)
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Transaksiyalar ro'yxati kiritilishi shart"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Bu funksiya faqat MFY agentlar uchun"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "To'lov transaksiyasi topilmadi"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Kunlik hisobotni olishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Examples

### Example 1: MFY Agent Kunlik Hisobot

```bash
curl -X GET "http://localhost:5000/api/agent/finance/mfy/daily-report?date=2024-01-15" \
  -H "Authorization: Bearer <agent_token>"
```

### Example 2: MFY Agent To'lovni Qabul Qilish

```bash
curl -X POST "http://localhost:5000/api/agent/finance/mfy/collect-payment/507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer <agent_token>"
```

### Example 3: MFY Agent Tuman Agentga Topshirish

```bash
curl -X POST "http://localhost:5000/api/agent/finance/mfy/submit-to-district" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
    "notes": "Kunlik to'lovlar"
  }'
```

### Example 4: Tuman Agent Topshiruvni Tasdiqlash

```bash
curl -X POST "http://localhost:5000/api/agent/finance/district/confirm-submission/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer <agent_token>"
```

### Example 5: Tuman Agent Viloyat Agentga Topshirish

```bash
curl -X POST "http://localhost:5000/api/agent/finance/district/submit-to-province" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
    "notes": "Kunlik to'lovlar"
  }'
```

### Example 6: Viloyat Agent Moliya Bo'limiga Topshirish

```bash
curl -X POST "http://localhost:5000/api/agent/finance/province/submit-to-finance" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439019"],
    "notes": "Kunlik to'lovlar"
  }'
```

---

## Important Notes

1. **Agent Types:** Agent turlari avtomatik aniqlanadi (mfy, tuman, viloyat) va faqat tegishli endpointlarga kirish mumkin.

2. **Daily Reports:** Har kuni avtomatik yaratiladi yoki yangilanadi. Bir kunda bir marta yaratiladi.

3. **Transaction Status Flow:**
   - `pending` → `collected` (MFY agent qabul qilganda)
   - `collected` → `submitted` (MFY agent tuman agentga topshirganda)
   - `submitted` → `received` (Tuman agent tasdiqlaganda)
   - `received` → `submitted` (Tuman agent viloyat agentga topshirganda)
   - `submitted` → `received` (Viloyat agent tasdiqlaganda)
   - `received` → `submitted` (Viloyat agent moliya bo'limiga topshirganda)

4. **Finance Submission Status:**
   - `pending`: Kutilayotgan (qabul qilinmagan)
   - `confirmed`: Tasdiqlangan (qabul qilingan)
   - `rejected`: Rad etilgan

5. **Amount Calculations:**
   - `collectedAmount`: Qabul qilingan jami summa
   - `submittedAmount`: Topshirilgan jami summa
   - `pendingAmount`: Kutilayotgan summa (collectedAmount - submittedAmount)

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0
