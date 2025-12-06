# Admin KPI Bonus API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [KPI Distribution Management](#kpi-distribution-management)
    - [Get Initial KPI Distribution](#get-initial-kpi-distribution)
  - [KPI Transactions](#kpi-transactions)
  - [KPI Statistics](#kpi-statistics)
  - [KPI Data - Agents & Punkts](#kpi-data---agents--punkts)
    - [Get Viloyat Agents KPI](#get-viloyat-agents-kpi)
    - [Get Tuman Agents KPI](#get-tuman-agents-kpi)
    - [Get MFY Agents KPI](#get-mfy-agents-kpi)
    - [Get Punkts KPI](#get-punkts-kpi)
    - [Get Agent KPI Details](#get-agent-kpi-details)
    - [Get Punkt KPI Details](#get-punkt-kpi-details)
- [KPI Bonus Calculation](#kpi-bonus-calculation)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin KPI Bonus API provides endpoints for managing KPI (Key Performance Indicator) bonus distribution configurations and monitoring bonus transactions. Admins can configure how KPI bonuses are distributed among contragents, punkts, and agents (viloyat, tuman, MFY), and track all bonus transactions.

**Base Path:** `/api/admins/kpi`

**Key Features:**
- Create and manage KPI bonus distribution configurations
- View all KPI bonus transactions
- Monitor KPI bonus statistics
- Track bonus payments

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

All endpoints require admin authentication using JWT token from Admin login.

**Format:** `Authorization: Bearer <token>`

---

## Data Models

### KPI Bonus Distribution Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (unique, required)",
  "description": "string (optional)",
  "distribution": {
    "punkt": "number (0-100, required)",
    "viloyatAgent": "number (0-100, required)",
    "tumanAgent": "number (0-100, required)",
    "mfyAgent": "number (0-100, required)",
    "punktTransfer": "number (0-100, optional, default: 0)"
  },
  "isActive": "boolean (default: true)",
  "createdBy": "ObjectId (reference to Admin)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Important:** 
- The sum of `punkt`, `viloyatAgent`, `tumanAgent`, and `mfyAgent` must equal 100%.
- `punktTransfer` is optional and represents additional bonus percentage for inter-punkt transfers.
- If `punktTransfer` > 0, this percentage is automatically split 50/50 between `fromPunkt` and `toPunkt` (no separate distribution config needed).

### KPI Bonus Transaction Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "order": "ObjectId (reference to Order)",
  "orderItem": {
    "product": "ObjectId (reference to Product)",
    "quantity": "number",
    "price": "number (selling price)",
    "originalPrice": "number (original/cost price)",
    "kpiBonusPercent": "number"
  },
  "totalKpiAmount": "number (calculated: (price - originalPrice) * quantity * kpiBonusPercent / 100)",
  "distributionConfig": "ObjectId (reference to KpiBonusDistribution)",
  "amounts": {
    "punkt": "number",
    "viloyatAgent": "number",
    "tumanAgent": "number",
    "mfyAgent": "number",
    "punktTransfer": "number"
  },
  "recipients": {
    "punkt": "ObjectId (reference to Punkt, optional)",
    "viloyatAgent": "ObjectId (reference to Agent, optional)",
    "tumanAgent": "ObjectId (reference to Agent, optional)",
    "mfyAgent": "ObjectId (reference to Agent, optional)",
    "fromPunkt": "ObjectId (reference to Punkt, optional)",
    "toPunkt": "ObjectId (reference to Punkt, optional)",
    "fromPunktAmount": "number",
    "toPunktAmount": "number"
  },
  "orderStatus": "string (enum: order statuses)",
  "isPaid": "boolean (default: false)",
  "paidAt": "Date (optional)",
  "notes": "string (optional)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Endpoints

### KPI Distribution Management

#### Get Initial KPI Distribution

Get default/initial KPI distribution values that admin can use to prefill the create form. This endpoint should be called before creating the very first distribution so that the UI has suggested values.

**Endpoint:** `GET /api/admins/kpi/distributions/initial/defaults`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "name": "Default KPI Distribution",
    "description": "Tavsiyaviy boshlang'ich taqsimlash. Admin kerak bo'lsa qiymatlarni o'zgartirishi mumkin.",
        "distribution": {
          "punkt": 20,
          "viloyatAgent": 20,
          "tumanAgent": 20,
          "mfyAgent": 40,
          "punktTransfer": 0
        },
        "notes": [
          "Asosiy taqsimlashlar (punkt, viloyatAgent, tumanAgent, mfyAgent) yig'indisi 100% bo'lishi shart",
          "Punkt transfer 0 bo'lsa, transfer bonus ajratilmaydi",
          "Punkt transfer > 0 bo'lsa, bu foizning yarmi fromPunkt ga, yarmi toPunkt ga ajratiladi",
          "Bu qiymatlar faqat create formasi uchun boshlang'ich tavsiya"
        ]
  }
}
```

**Usage Notes:**
- This endpoint **does not create** any distribution; it only returns recommended starting values.
- Call this endpoint before showing the create form to admins.
- Admin can adjust the returned values before calling the create API.

#### 1. Create KPI Distribution

Create a new KPI bonus distribution configuration.

**Endpoint:** `POST /api/admins/kpi/distributions`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Standard Distribution",
  "description": "Standard KPI bonus distribution for all orders",
  "distribution": {
    "punkt": 20,
    "viloyatAgent": 20,
    "tumanAgent": 20,
    "mfyAgent": 40,
    "punktTransfer": 10
  }
}
```

**Qanday yuborish kerak?**
- Avval asosiy to'rtta foiz (punkt, viloyatAgent, tumanAgent, mfyAgent) summasini tekshiring — **100% bo'lishi majburiy**.
- `punktTransfer` ni 0 yoki kerakli qiymatga qo'yishingiz mumkin; bu asosiy yig'indiga kirmaydi va transfer bo'lsa avtomatik 5/5 ga bo'linadi.
- Agar asosiy foizlar 100% dan kam bo'lsa (masalan, 10 + 20 + 20 + 40 = 90%), server xatolik qaytaradi.

**Validation Rules:**
- `name`: Required, unique
- **Asosiy taqsimlashlar:** `distribution.punkt + viloyatAgent + tumanAgent + mfyAgent` must equal 100
- `punktTransfer`: Optional, 0-100. If > 0, automatically split 50/50 between fromPunkt and toPunkt
- **Faqat bitta active distribution:** Agar yangi distribution `isActive: true` bo'lsa, boshqa barcha distributionlar avtomatik `isActive: false` bo'ladi

> **Eslatma:** `punktTransfer` qo'shimcha bonus bo'lib, asosiy foizlar yig'indisiga kirmaydi. Avvalo `punkt + viloyatAgent + tumanAgent + mfyAgent = 100%` ekanligiga ishonch hosil qiling, so'ng zaruratga qarab `punktTransfer` qo'shing.

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Standard Distribution",
    "description": "Standard KPI bonus distribution for all orders",
    "distribution": {
      "punkt": 20,
      "viloyatAgent": 20,
      "tumanAgent": 20,
      "mfyAgent": 40,
      "punktTransfer": 10
    },
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error:
  - `Asosiy taqsimlashlar yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: X%` - Asosiy 4 ta foiz (punkt, viloyatAgent, tumanAgent, mfyAgent) yig'indisi 100% bo'lishi kerak
  - Duplicate name error
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

#### 2. Get All KPI Distributions

Get all KPI bonus distribution configurations.

**Endpoint:** `GET /api/admins/kpi/distributions`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `isActive` (optional) - Filter by active status: `true` or `false`
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 5,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Standard Distribution",
      "distribution": {
        "punkt": 20,
        "viloyatAgent": 20,
        "tumanAgent": 20,
        "mfyAgent": 40,
        "punktTransfer": 10
      },
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "phone": "+998901234567"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get KPI Distribution by ID

Get a specific KPI bonus distribution configuration.

**Endpoint:** `GET /api/admins/kpi/distributions/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the distribution

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Standard Distribution",
    "description": "Standard KPI bonus distribution",
    "distribution": {
      "punkt": 20,
      "viloyatAgent": 20,
      "tumanAgent": 20,
      "mfyAgent": 40
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User"
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### 4. Update KPI Distribution

Update an existing KPI bonus distribution configuration.

**Endpoint:** `PUT /api/admins/kpi/distributions/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the distribution

**Request Body:**

```json
{
  "name": "Updated Distribution",
  "description": "Updated description",
  "distribution": {
    "punkt": 25,
    "viloyatAgent": 25,
    "tumanAgent": 25,
    "mfyAgent": 25,
    "punktTransfer": 5
  },
  "isActive": true
}
```

**Important Notes:**
- Agar `isActive: true` bo'lsa, boshqa barcha distributionlar avtomatik `isActive: false` bo'ladi
- Faqat bitta distribution faol bo'lishi mumkin

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Distribution",
    "distribution": {
      "punkt": 20,
      "viloyatAgent": 20,
      "tumanAgent": 20,
      "mfyAgent": 40
    },
    "isActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### 5. Delete KPI Distribution

Delete a KPI bonus distribution configuration. Cannot delete if used in transactions.

**Endpoint:** `DELETE /api/admins/kpi/distributions/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the distribution

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**
- **400 Bad Request** - Distribution is used in transactions
- **404 Not Found** - Distribution not found

---

### KPI Transactions

#### 6. Get All KPI Transactions

Get all KPI bonus transactions with filters.

**Endpoint:** `GET /api/admins/kpi/transactions`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `orderId` (optional) - Filter by order ID
- `productId` (optional) - Filter by product ID
- `contragentId` (optional) - Filter by contragent ID
- `punktId` (optional) - Filter by punkt ID
- `agentId` (optional) - Filter by agent ID
- `orderStatus` (optional) - Filter by order status
- `isPaid` (optional) - Filter by payment status: `true` or `false`
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter until date (ISO 8601)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "order": {
        "_id": "507f1f77bcf86cd799439021",
        "orderNumber": "00001",
        "status": "confirmed_by_customer",
        "totalPrice": 30000
      },
        "orderItem": {
          "product": {
            "_id": "507f1f77bcf86cd799439022",
            "name": "Akt Shampuni",
            "price": 15000,
            "productCode": "001"
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000,
          "kpiBonusPercent": 50
        },
        "totalKpiAmount": 3000,
      "distributionConfig": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Standard Distribution"
      },
        "amounts": {
          "punkt": 600,
          "viloyatAgent": 600,
          "tumanAgent": 600,
          "mfyAgent": 1200,
          "punktTransfer": 0
        },
        "recipients": {
          "punkt": {
          "_id": "507f1f77bcf86cd799439024",
          "name": "Punkt 1"
        },
        "mfyAgent": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Agent 1"
        }
      },
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

#### 7. Get KPI Transaction by ID

Get a specific KPI bonus transaction.

**Endpoint:** `GET /api/admins/kpi/transactions/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the transaction

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "order": {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "status": "confirmed_by_customer"
    },
    "orderItem": {
      "product": {
        "_id": "507f1f77bcf86cd799439022",
        "name": "Akt Shampuni"
      },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000,
          "kpiBonusPercent": 50
        },
        "totalKpiAmount": 3000,
        "amounts": {
          "punkt": 600,
          "viloyatAgent": 600,
          "tumanAgent": 600,
          "mfyAgent": 1200
        },
        "recipients": {
          "punkt": {
            "_id": "507f1f77bcf86cd799439024",
            "name": "Punkt 1"
          }
        },
    "isPaid": false,
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### KPI Statistics

#### 8. Get KPI Statistics

Get aggregated KPI bonus statistics.

**Endpoint:** `GET /api/admins/kpi/statistics`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter until date (ISO 8601)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
      "totalTransactions": 150,
      "totalKpiAmount": 900000,
      "totalPunkt": 180000,
      "totalViloyatAgent": 180000,
      "totalTumanAgent": 180000,
      "totalMfyAgent": 360000,
      "totalPunktTransfer": 0,
      "paidTransactions": 100,
      "unpaidTransactions": 50
  }
}
```

---

### KPI Data - Agents & Punkts

#### Get Viloyat Agents KPI

Barcha viloyat agentlarining KPI bonus ma'lumotlarini olish.

**Endpoint:** `GET /api/admins/kpi/data/viloyat-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Viloyat bo'yicha filter
- `agentId` (optional) - Aniq agent bo'yicha filter
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi elementlar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "agent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Viloyat Agent 1",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati"
        }
      },
      "totalTransactions": 50,
      "totalAmount": 150000,
      "paidAmount": 100000,
      "unpaidAmount": 50000
    }
  ]
}
```

---

#### Get Tuman Agents KPI

Barcha tuman agentlarining KPI bonus ma'lumotlarini olish.

**Endpoint:** `GET /api/admins/kpi/data/tuman-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Viloyat bo'yicha filter
- `tumanId` (optional) - Tuman bo'yicha filter
- `agentId` (optional) - Aniq agent bo'yicha filter
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi elementlar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 15,
  "total": 40,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "agent": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Tuman Agent 1",
        "phone": "+998901234568",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        }
      },
      "totalTransactions": 30,
      "totalAmount": 90000,
      "paidAmount": 60000,
      "unpaidAmount": 30000
    }
  ]
}
```

---

#### Get MFY Agents KPI

Barcha MFY agentlarining KPI bonus ma'lumotlarini olish.

**Endpoint:** `GET /api/admins/kpi/data/mfy-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Viloyat bo'yicha filter
- `tumanId` (optional) - Tuman bo'yicha filter
- `mfyId` (optional) - MFY bo'yicha filter
- `agentId` (optional) - Aniq agent bo'yicha filter
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi elementlar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 20,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "agent": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "MFY Agent 1",
        "phone": "+998901234569",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Guliston MFY"
        }
      },
      "totalTransactions": 80,
      "totalAmount": 240000,
      "paidAmount": 200000,
      "unpaidAmount": 40000
    }
  ]
}
```

---

#### Get Punkts KPI

Barcha punktlarning KPI bonus ma'lumotlarini olish.

**Endpoint:** `GET /api/admins/kpi/data/punkts`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Viloyat bo'yicha filter
- `tumanId` (optional) - Tuman bo'yicha filter
- `punktId` (optional) - Aniq punkt bo'yicha filter
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi elementlar soni

**Success Response (200 OK):**

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
      "punkt": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Punkt 1",
        "phone": "+998901234570",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        }
      },
      "totalTransactions": 45,
      "totalAmount": 135000,
      "paidAmount": 100000,
      "unpaidAmount": 35000
    }
  ]
}
```

**Note:** Punkt KPI summasi quyidagilarni o'z ichiga oladi:
- Regular punkt bonus (`amounts.punkt`)
- FromPunkt transfer bonus (`recipients.fromPunktAmount`)
- ToPunkt transfer bonus (`recipients.toPunktAmount`)

---

#### Get Agent KPI Details

Aniq bir agentning batafsil KPI ma'lumotlari va transaksiyalarini olish.

**Endpoint:** `GET /api/admins/kpi/data/agents/:agentId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `agentId` (required) - Agent ID

**Query Parameters:**
- `role` (optional) - Agent roli: `viloyat`, `tuman`, yoki `mfy`. Agar ko'rsatilmasa, agent ma'lumotlaridan avtomatik aniqlanadi
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Transaksiyalar sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi transaksiyalar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "agent": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "MFY Agent 1",
      "phone": "+998901234569",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Chirchiq tumani"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Guliston MFY"
      }
    },
    "role": "mfy",
    "summary": {
      "totalTransactions": 80,
      "totalAmount": 240000,
      "paidAmount": 200000,
      "unpaidAmount": 40000
    },
    "transactions": {
      "count": 50,
      "total": 80,
      "page": 1,
      "limit": 50,
      "totalPages": 2,
      "data": [
        {
          "_id": "507f1f77bcf86cd799439020",
          "order": {
            "_id": "507f1f77bcf86cd799439021",
            "orderNumber": "00001",
            "status": "confirmed_by_customer",
            "totalPrice": 30000
          },
          "orderItem": {
            "product": {
              "_id": "507f1f77bcf86cd799439022",
              "name": "Akt Shampuni",
              "price": 15000,
              "productCode": "001"
            },
            "quantity": 2,
            "price": 15000,
            "originalPrice": 12000,
            "kpiBonusPercent": 50
          },
          "totalKpiAmount": 3000,
          "amounts": {
            "punkt": 600,
            "viloyatAgent": 600,
            "tumanAgent": 600,
            "mfyAgent": 1200
          },
          "agentAmount": 1200,
          "isPaid": false,
          "createdAt": "2024-01-15T12:00:00.000Z"
        }
      ]
    }
  }
}
```

---

#### Get Punkt KPI Details

Aniq bir punktning batafsil KPI ma'lumotlari va transaksiyalarini olish.

**Endpoint:** `GET /api/admins/kpi/data/punkts/:punktId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `punktId` (required) - Punkt ID

**Query Parameters:**
- `isPaid` (optional) - To'lov holati: `true` yoki `false`
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Transaksiyalar sahifa raqami
- `limit` (optional, default: 50) - Sahifadagi transaksiyalar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "punkt": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Punkt 1",
      "phone": "+998901234570",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Chirchiq tumani"
      }
    },
    "summary": {
      "totalTransactions": 45,
      "totalAmount": 135000,
      "paidAmount": 100000,
      "unpaidAmount": 35000
    },
    "transactions": {
      "count": 45,
      "total": 45,
      "page": 1,
      "limit": 50,
      "totalPages": 1,
      "data": [
        {
          "_id": "507f1f77bcf86cd799439020",
          "order": {
            "_id": "507f1f77bcf86cd799439021",
            "orderNumber": "00001",
            "status": "confirmed_by_customer",
            "totalPrice": 30000
          },
          "orderItem": {
            "product": {
              "_id": "507f1f77bcf86cd799439022",
              "name": "Akt Shampuni",
              "price": 15000,
              "productCode": "001"
            },
            "quantity": 2,
            "price": 15000,
            "originalPrice": 12000,
            "kpiBonusPercent": 50
          },
          "totalKpiAmount": 3000,
          "amounts": {
            "punkt": 600,
            "viloyatAgent": 600,
            "tumanAgent": 600,
            "mfyAgent": 1200
          },
          "punktAmount": 600,
          "bonusType": "regular",
          "isPaid": false,
          "createdAt": "2024-01-15T12:00:00.000Z"
        }
      ]
    }
  }
}
```

**Bonus Types:**
- `regular` - Oddiy punkt bonus
- `from_punkt` - Punktdan transfer qilgandagi bonus
- `to_punkt` - Punktga transfer qabul qilgandagi bonus
- `mixed` - Bir nechta turdagi bonus

---

## KPI Bonus Calculation

### How KPI Bonus is Calculated

1. **For each order item:**
   - `profitPerUnit = item.price - item.originalPrice`
   - `totalKpiAmount = (profitPerUnit × item.quantity × item.kpiBonusPercent) / 100`
   - **Example:** If `price = 1000`, `originalPrice = 800`, `quantity = 1`, `kpiBonusPercent = 50%`:
     - `profitPerUnit = 1000 - 800 = 200`
     - `totalKpiAmount = (200 × 1 × 50) / 100 = 100`

2. **Distribution:**
   - Each recipient gets their percentage of `totalKpiAmount`
   - **Example:** If `totalKpiAmount = 100` and distribution is:
     - `punkt = 20%` → `punktAmount = 20`
     - `viloyatAgent = 20%` → `viloyatAgentAmount = 20`
     - `tumanAgent = 20%` → `tumanAgentAmount = 20`
     - `mfyAgent = 40%` → `mfyAgentAmount = 40`

3. **Punkt Transfer Bonus:**
   - If `punktTransfer > 0` and order has `punktToPunktRequests`:
     - `transferAmount = (totalKpiAmount × punktTransfer) / 100`
     - `fromPunktAmount = transferAmount / 2` (50% to sending punkt)
     - `toPunktAmount = transferAmount / 2` (50% to receiving punkt)

4. **When is KPI Bonus Calculated:**
   - KPI bonus transactions are created automatically when order status changes to `confirmed_by_customer`
   - Only one set of transactions is created per order (even if status changes multiple times)

5. **Recipients Assignment:**
   - **Punkt:** From `confirmedByPunkt` or `currentPunkt`
   - **Viloyat Agent:** Active agent for the delivery viloyat (no tuman, no mfy)
   - **Tuman Agent:** Active agent for the delivery tuman (no mfy)
   - **MFY Agent:** The agent assigned to the order (`assignedToAgent`)
   - **Punkt Transfer:** From `punktToPunktRequests` if order was transferred between punkts (50/50 split)

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "error": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**
- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Authentication required or invalid token
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Create KPI Distribution

```bash
curl -X POST http://localhost:5000/api/admins/kpi/distributions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Distribution",
    "description": "Standard KPI bonus distribution",
    "distribution": {
      "contragent": 20,
      "punkt": 20,
      "viloyatAgent": 20,
      "tumanAgent": 25,
      "mfyAgent": 35
    }
  }'
```

### Example 2: Get KPI Statistics

```bash
curl -X GET "http://localhost:5000/api/admins/kpi/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Get KPI Transactions for Specific Order

```bash
curl -X GET "http://localhost:5000/api/admins/kpi/transactions?orderId=507f1f77bcf86cd799439021" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Active Distribution:** Faqat bitta distribution faol bo'lishi mumkin. Yangi distribution `isActive: true` bilan yaratilganda yoki yangilanganda, boshqa barcha distributionlar avtomatik `isActive: false` bo'ladi.

2. **Transaction Creation:** KPI bonus transactions are created automatically when an order reaches `confirmed_by_customer` status. They are not created again if the order status changes after that.

3. **Recipient Assignment:** If a recipient (agent, punkt) is not found, that portion of the bonus will not be assigned but will still be calculated.

4. **Punkt Transfer:** Punkt transfer bonuses are only calculated if the order has `punktToPunktRequests` with accepted or delivered status.

5. **Payment Tracking:** Use the `isPaid` field to track which bonuses have been paid out. This can be updated manually or through a separate payment API.

6. **Validation Messages:**
   - Asosiy taqsimlashlar (punkt, viloyatAgent, tumanAgent, mfyAgent) yig'indisi 100% bo'lishi shart
   - Punkt transfer foizi alohida va 0-100% orasida bo'lishi mumkin
   - Punkt transfer > 0 bo'lsa, bu foizning yarmi avtomatik fromPunkt ga, yarmi toPunkt ga ajratiladi (50/50 split)

---

**Last Updated:** 2024-01-15

