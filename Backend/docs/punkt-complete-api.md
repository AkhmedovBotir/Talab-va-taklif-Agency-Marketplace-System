# Punkt Complete API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Order Workflow](#order-workflow)
- [Endpoints](#endpoints)
  - [Authentication & Profile](#1-authentication--profile)
  - [Order Management](#2-order-management)
  - [Contragent Operations](#3-contragent-operations)
  - [Punkt-to-Punkt Operations](#4-punkt-to-punkt-operations)
  - [Agent Operations](#5-agent-operations)
  - [KPI Operations](#6-kpi-operations)
  - [Notifications](#7-notifications)
  - [Data Retrieval](#8-data-retrieval)
- [Error Handling](#error-handling)
- [Complete Workflow Examples](#complete-workflow-examples)

---

## Overview

Punkt Complete API - bu punktlar uchun to'liq buyurtma boshqaruvi, contragentlar bilan ishlash, boshqa punktlar bilan aloqa qilish va agentlarga buyurtmalarni topshirish funksiyalarini ta'minlaydi.

**Asosiy funksiyalar:**
- Buyurtmalarni ko'rish va boshqarish (barcha holatlar)
- Buyurtmalarni tasdiqlash
- Contragentlarga so'rov yuborish va qabul qilish
- Boshqa punktlarga so'rov yuborish, qabul qilish va yuborish
- Contragentdan buyurtma qabul qilish
- Punktdan buyurtma qabul qilish va yuborish
- Agentlarga buyurtma topshirish
- KPI bonuslarni ko'rish
- Bildirishnomalarni boshqarish

**Base Paths:**
- `/api/punkts` - Punkt profil va autentifikatsiya
- `/api/punkt` - Buyurtma boshqaruvi va operatsiyalar

---

## Base URLs

```
http://localhost:5000/api/punkts  (Punkt profil)
http://localhost:5000/api/punkt   (Buyurtma operatsiyalari)
```

---

## Authentication

Barcha endpoint'lar Punkt autentifikatsiyasini talab qiladi (login endpoint'dan tashqari).

**Format:** `Authorization: Bearer <punkt_token>`

**Token Expiration:** 24 hours

**Login Endpoint:**
- **Path:** `POST /api/punkts/login`
- **Body:**
  ```json
  {
    "phone": "+998901234567",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Muvaffaqiyatli kirildi",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "punkt": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Punkt nomi",
        "phone": "+998901234567",
        "viloyat": { ... },
        "tuman": { ... },
        "status": "active"
      }
    }
  }
  ```

---

## Data Models

### Punkt Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "phone": "string (valid phone number, unique)",
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
  } | null,
  "status": "active" | "inactive",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Order Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "orderNumber": "string (unique)",
  "user": {
    "_id": "string",
    "name": "string",
    "phone": "string"
  },
  "items": [
    {
      "product": {
        "_id": "string",
        "name": "string",
        "category": { ... },
        "subcategory": { ... },
        "contragent": { ... }
      },
      "quantity": "number",
      "price": "number",
      "originalPrice": "number"
    }
  ],
  "totalPrice": "number",
  "totalOriginalPrice": "number",
  "totalKpiPrice": "number",
  "itemCount": "number",
  "status": "string (enum)",
  "paymentStatus": "pending" | "paid" | "failed" | "refunded",
  "paymentMethod": "cash" | "card",
  "deliveryViloyat": { ... },
  "deliveryTuman": { ... },
  "deliveryMfy": { ... },
  "deliveryNote": "string",
  "phoneNumber": "string",
  "confirmedByPunkt": { ... } | null,
  "punktStatus": "pending" | "confirmed" | "rejected" | "requested",
  "currentPunkt": { ... } | null,
  "assignedToAgent": { ... } | null,
  "assignedByPunkt": { ... } | null,
  "assignedAt": "string (ISO 8601 date)" | null,
  "confirmedByAgent": { ... } | null,
  "agentConfirmedAt": "string (ISO 8601 date)" | null,
  "contragentRequests": [
    {
      "contragentId": { ... },
      "itemIds": ["number"],
      "status": "pending" | "accepted" | "rejected" | "delivered_to_punkt",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string (ISO 8601 date)" | null,
      "deliveredToPunktAt": "string (ISO 8601 date)" | null
    }
  ],
  "punktToPunktRequests": [
    {
      "fromPunktId": { ... },
      "toPunktId": { ... },
      "status": "pending" | "accepted" | "rejected" | "delivered",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string (ISO 8601 date)" | null,
      "deliveredAt": "string (ISO 8601 date)" | null
    }
  ],
  "punktRequests": [
    {
      "punktId": { ... },
      "status": "pending" | "accepted" | "rejected",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string (ISO 8601 date)" | null
    }
  ],
  "customerConfirmed": "boolean",
  "customerConfirmedAt": "string (ISO 8601 date)" | null,
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Order Workflow

### Order Status Values

| Status | Description |
|--------|-------------|
| `pending` | Yangi buyurtma (mijoz tomonidan yaratilgan) |
| `confirmed_by_punkt` | Punkt tomonidan tasdiqlangan |
| `requested_to_contragent` | Contragentga so'rov yuborilgan |
| `accepted_by_contragent` | Contragent tomonidan qabul qilingan |
| `delivered_to_punkt` | Punktga yetkazilgan |
| `assigned_to_agent` | Agentga yuborilgan |
| `confirmed_by_agent` | Agent tomonidan tasdiqlangan (mijozga yetkazilgan) |
| `confirmed_by_customer` | Mijoz tomonidan tasdiqlangan |
| `cancelled` | Bekor qilingan |

### Complete Order Flow

```
1. Customer creates order
   → status: pending

2. Punkt confirms order
   → status: confirmed_by_punkt
   → punktStatus: confirmed
   → currentPunkt: punkt._id

3. Punkt requests to contragent (or multiple contragents)
   → status: requested_to_contragent
   → contragentRequests: [ { status: pending } ]

4. Contragent accepts request
   → contragentRequests[].status: accepted
   → status: accepted_by_contragent

5. Contragent delivers to punkt
   → contragentRequests[].status: delivered_to_punkt
   → status: delivered_to_punkt

6. Punkt receives from contragent
   → currentPunkt: punkt._id (remains same)
   → status: delivered_to_punkt

7. Punkt assigns to agent
   → status: assigned_to_agent
   → assignedToAgent: agent._id
   → assignedByPunkt: punkt._id

8. Agent confirms delivery
   → status: confirmed_by_agent
   → confirmedByAgent: agent._id

9. Customer confirms receipt
   → status: confirmed_by_customer
   → customerConfirmed: true
```

### Punkt-to-Punkt Flow

```
1. A punkt confirms order
   → status: confirmed_by_punkt
   → currentPunkt: A punkt

2. A punkt requests to B punkt
   → punktToPunktRequests: [ { fromPunktId: A, toPunktId: B, status: pending } ]

3. B punkt accepts request
   → punktToPunktRequests[].status: accepted
   → currentPunkt: B punkt
   → status: confirmed_by_punkt

4. B punkt requests to contragent
   → status: requested_to_contragent
   → contragentRequests: [ { status: pending } ]

5. Contragent delivers to B punkt
   → contragentRequests[].status: delivered_to_punkt
   → status: delivered_to_punkt

6. B punkt receives from contragent
   → currentPunkt: B punkt (remains same)

7. B punkt sends to A punkt
   → punktToPunktRequests[].status: delivered
   → currentPunkt: A punkt
   → status: delivered_to_punkt

8. A punkt receives from B punkt
   → currentPunkt: A punkt (remains same)
   → status: delivered_to_punkt

9. A punkt assigns to agent
   → status: assigned_to_agent
   → assignedToAgent: agent._id
```

---

## Endpoints

### 1. Authentication & Profile

#### Login Punkt

**Endpoint:** `POST /api/punkts/login`

**Description:** Punkt autentifikatsiyasi va token olish

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "punkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567",
      "viloyat": { ... },
      "tuman": { ... },
      "status": "active"
    }
  }
}
```

**Error Responses:**
- `401` - Telefon raqami yoki parol noto'g'ri
- `403` - Hisobingiz faol emas

---

#### Get Contragents in Region

**Endpoint:** `GET /api/punkts/data/contragents`

**Description:** Punkt hududidagi contragentlarni olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Contragent holati filtri (default: `active`)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Contragent nomi",
      "inn": "123456789",
      "phone": "+998901234567",
      "viloyat": { ... },
      "tuman": { ... },
      "mfy": { ... },
      "status": "active"
    }
  ]
}
```

---

### 2. Order Management

#### Get My Orders

**Endpoint:** `GET /api/punkt/orders`

**Description:** Punktning barcha buyurtmalarini olish (o'z hududidagi va tegishli buyurtmalar)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `paymentStatus` (optional) - To'lov holati filtri
- `paymentMethod` (optional) - To'lov usuli filtri (`cash` | `card`)
- `orderNumber` (optional) - Buyurtma raqami bo'yicha qidirish
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `minTotalPrice` (optional) - Minimal jami narx
- `maxTotalPrice` (optional) - Maksimal jami narx
- `search` (optional) - Buyurtma raqami yoki telefon raqami bo'yicha qidirish
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "user": { ... },
      "items": [ ... ],
      "totalPrice": 100000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "deliveryViloyat": { ... },
      "deliveryTuman": { ... },
      "deliveryMfy": { ... },
      "confirmedByPunkt": null,
      "punktStatus": "pending",
      "currentPunkt": null,
      "contragentRequests": [],
      "punktToPunktRequests": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Punkt o'z hududidagi buyurtmalarni ko'radi (deliveryViloyat va deliveryTuman bo'yicha)
- Punkt currentPunkt bo'lgan buyurtmalarni ko'radi
- Punkt punktToPunktRequests'da ishtirok etgan buyurtmalarni ko'radi
- Punkt punktRequests'da ishtirok etgan buyurtmalarni ko'radi

---

#### Get Today's Orders

**Endpoint:** `GET /api/punkt/orders/today`

**Description:** Bugungi buyurtmalarni olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:** Xuddi `GET /api/punkt/orders` kabi, lekin faqat bugungi buyurtmalar

---

#### Get Order History

**Endpoint:** `GET /api/punkt/orders/history`

**Description:** O'tgan kunlardagi buyurtmalarni olish (bugungi kundan tashqari)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:** Xuddi `GET /api/punkt/orders` kabi, lekin faqat o'tgan kunlardagi buyurtmalar

---

#### Get Order by ID

**Endpoint:** `GET /api/punkt/orders/:id`

**Description:** Buyurtma tafsilotlarini ID bo'yicha olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "user": { ... },
    "items": [ ... ],
    "totalPrice": 100000,
    "status": "pending",
    "deliveryViloyat": { ... },
    "deliveryTuman": { ... },
    "deliveryMfy": { ... },
    "confirmedByPunkt": null,
    "punktStatus": "pending",
    "currentPunkt": null,
    "contragentRequests": [],
    "punktToPunktRequests": [],
    "punktRequests": [],
    "assignedToAgent": null,
    "assignedByPunkt": null,
    "confirmedByAgent": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Buyurtma topilmadi
- `400` - Noto'g'ri buyurtma ID

---

#### Get Order Contragent IDs

**Endpoint:** `GET /api/punkt/orders/:id/contragents`

**Description:** Buyurtmadagi maxsulotlarning contragent ID'larini olish (contragentga so'rov yuborish uchun)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Contragent nomi",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": { ... },
        "tuman": { ... },
        "mfy": { ... },
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "Maxsulot nomi",
            "quantity": 2,
            "price": 50000
          }
        ],
        "hasRequest": false,
        "requestStatus": null,
        "requestedAt": null
      }
    ]
  }
}
```

**Notes:**
- `isInRegion` - Contragent punkt hududida bormi
- `hasRequest` - Bu contragentga so'rov yuborilganmi
- `requestStatus` - So'rov holati (agar mavjud bo'lsa)

---

#### Confirm Order

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Description:** Buyurtmani tasdiqlash (punkt tomonidan)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:** Bo'sh (body kerak emas)

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "contragentRequests": [ ... ],
    "punktToPunktRequests": [ ... ]
  }
}
```

**Status Changes:**
- `status`: `pending` → `confirmed_by_punkt`
- `punktStatus`: `pending` → `confirmed`
- `confirmedByPunkt`: Punkt ID o'rnatiladi
- `currentPunkt`: Punkt ID o'rnatiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Buyurtma allaqachon tasdiqlanmagan bo'lishi kerak
- Kamida bitta maxsulotning yetkazish hududi punkt tumanidagi MFY'ni o'z ichiga olishi kerak

**Auto-Routing:**
- Tasdiqlashdan keyin avtomatik routing ishlaydi (agar mavjud bo'lsa)
- O'z tumanidagi contragentlarga so'rov yuboriladi
- Boshqa tuman punktlariga so'rov yuboriladi

**Error Responses:**
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Bu buyurtma allaqachon tasdiqlangan
- `403` - Siz bu buyurtmani tasdiqlay olmaysiz (maxsulotlar yetkazish hududida sizning tumaningizdagi MFY'lardan biri yo'q)
- `404` - Buyurtma topilmadi

---

### 3. Contragent Operations

#### Request to Contragent

**Endpoint:** `POST /api/punkt/orders/:id/request-to-contragent`

**Description:** Contragentga so'rov yuborish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "contragentId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "contragent": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Contragent nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "contragentRequests": [
      {
        "contragentId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "itemIds": [0, 1],
        "status": "pending",
        "requestedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `status`: `pending` yoki `confirmed_by_punkt` → `requested_to_contragent` (agar allaqachon `requested_to_contragent` bo'lmasa)
- `currentPunkt`: Punkt ID o'rnatiladi
- `contragentRequests`: Yangi so'rov qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak **YOKI** punkt currentPunkt bo'lishi kerak
- Contragent faol bo'lishi kerak
- Bu contragentga allaqachon so'rov yuborilmagan bo'lishi kerak
- Buyurtmada bu contragentning maxsulotlari bo'lishi kerak

**Notes:**
- `itemIds` - Bu contragentning maxsulotlarining buyurtmadagi indekslari
- Faqat bu contragentning maxsulotlari so'rovga kiritiladi
- **Muhim:** Agar punkt boshqa punktdan buyurtma qabul qilgan bo'lsa (currentPunkt bo'lsa), u ham contragentga so'rov yuborishi mumkin

**Error Responses:**
- `400` - Contragent ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas yoki siz hozirgi punkt emassiz
- `404` - Contragent topilmadi
- `400` - Contragent faol emas
- `400` - Bu contragentga allaqachon so'rov yuborilgan
- `400` - Bu buyurtmada tanlangan contragentning mahsulotlari yo'q

---

#### Receive from Contragent

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-contragent`

**Description:** Contragentdan buyurtma qabul qilish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:** Bo'sh (body kerak emas)

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma contragentdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "delivered_to_punkt",
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "contragentRequests": [
      {
        "contragentId": { ... },
        "status": "delivered_to_punkt",
        "deliveredToPunktAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `status`: `delivered_to_punkt` (agar allaqachon bo'lmasa)
- `currentPunkt`: Punkt ID o'rnatiladi

**Validation:**
- Buyurtmada `delivered_to_punkt` holatidagi contragent so'rovi bo'lishi kerak
- Punkt currentPunkt bo'lishi kerak (yoki buyurtma punkt hududiga tegishli bo'lishi kerak)

**Error Responses:**
- `404` - Buyurtma topilmadi
- `404` - Contragentdan buyurtma hali yetkazilmagan
- `403` - Bu buyurtma sizning punktingizga tegishli emas

---

### 4. Punkt-to-Punkt Operations

#### Request to Punkt

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Description:** Boshqa punktga so'rov yuborish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "toPunktId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "toPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "punktToPunktRequests": [
      {
        "fromPunktId": { ... },
        "toPunktId": { ... },
        "status": "pending",
        "requestedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `punktToPunktRequests`: Yangi so'rov qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- ToPunkt faol bo'lishi kerak
- Bu punktga allaqachon so'rov yuborilmagan bo'lishi kerak (pending, accepted, yoki delivered bo'lsa, yana yubormaymiz)

**Error Responses:**
- `400` - Punkt ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `404` - Punkt topilmadi
- `400` - Punkt faol emas
- `400` - Bu punktga allaqachon so'rov yuborilgan

---

#### Request to Punkts (Multiple)

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkts`

**Description:** Bir nechta punktlarga so'rov yuborish (tuman bo'yicha)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "tumanIds": [
    "60f7b3b3b3b3b3b3b3b3b3b3",
    "60f7b3b3b3b3b3b3b3b3b3b4"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 ta punktga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "requestedPunkts": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Punkt nomi",
        "phone": "+998901234567"
      }
    ],
    "punktRequests": [ ... ]
  }
}
```

**Status Changes:**
- `punktStatus`: `requested`
- `punktRequests`: Yangi so'rovlar qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Barcha tumanlar punkt viloyatiga tegishli bo'lishi kerak
- Belgilangan tumanlarda faol punktlar bo'lishi kerak

**Error Responses:**
- `400` - Tuman ID'lari kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Ba'zi tumanlar topilmadi
- `400` - Barcha tumanlar sizning viloyatingizga tegishli bo'lishi kerak
- `404` - Belgilangan tumanlarda faol punktlar topilmadi

---

#### Get Punkt-to-Punkt Requests

**Endpoint:** `GET /api/punkt/punkt-to-punkt-requests`

**Description:** Punktga kelgan punkt-to-punkt so'rovlarini olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - So'rov holati filtri (`pending` | `accepted` | `rejected` | `delivered` | `sent`)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "user": { ... },
      "items": [ ... ],
      "punktToPunktRequests": [
        {
          "fromPunktId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "name": "Yuboruvchi punkt",
            "phone": "+998901234567"
          },
          "toPunktId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "Qabul qiluvchi punkt",
            "phone": "+998901234568"
          },
          "status": "pending",
          "requestedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Notes:**
- Faqat bu punktga yuborilgan so'rovlar ko'rsatiladi
- `punktToPunktRequests` array'ida faqat bu punktga tegishli so'rovlar qoladi

---

#### Get My Orders

**Endpoint:** `GET /api/punkt/orders`

**Description:** Punktning barcha buyurtmalarini olish (o'z hududidagi va tegishli buyurtmalar)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `paymentStatus` (optional) - To'lov holati filtri
- `paymentMethod` (optional) - To'lov usuli filtri (`cash` | `card`)
- `orderNumber` (optional) - Buyurtma raqami bo'yicha qidirish
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `minTotalPrice` (optional) - Minimal jami narx
- `maxTotalPrice` (optional) - Maksimal jami narx
- `search` (optional) - Buyurtma raqami yoki telefon raqami bo'yicha qidirish
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "user": { ... },
      "items": [ ... ],
      "totalPrice": 100000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "deliveryViloyat": { ... },
      "deliveryTuman": { ... },
      "deliveryMfy": { ... },
      "confirmedByPunkt": null,
      "punktStatus": "pending",
      "currentPunkt": null,
      "contragentRequests": [],
      "punktToPunktRequests": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Punkt o'z hududidagi buyurtmalarni ko'radi (deliveryViloyat va deliveryTuman bo'yicha)
- Punkt currentPunkt bo'lgan buyurtmalarni ko'radi
- Punkt punktToPunktRequests'da ishtirok etgan buyurtmalarni ko'radi
- Punkt punktRequests'da ishtirok etgan buyurtmalarni ko'radi

---

#### Get Today's Orders

**Endpoint:** `GET /api/punkt/orders/today`

**Description:** Bugungi buyurtmalarni olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:** Xuddi `GET /api/punkt/orders` kabi, lekin faqat bugungi buyurtmalar

---

#### Get Order History

**Endpoint:** `GET /api/punkt/orders/history`

**Description:** O'tgan kunlardagi buyurtmalarni olish (bugungi kundan tashqari)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:** Xuddi `GET /api/punkt/orders` kabi, lekin faqat o'tgan kunlardagi buyurtmalar

---

#### Get Order by ID

**Endpoint:** `GET /api/punkt/orders/:id`

**Description:** Buyurtma tafsilotlarini ID bo'yicha olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "user": { ... },
    "items": [ ... ],
    "totalPrice": 100000,
    "status": "pending",
    "deliveryViloyat": { ... },
    "deliveryTuman": { ... },
    "deliveryMfy": { ... },
    "confirmedByPunkt": null,
    "punktStatus": "pending",
    "currentPunkt": null,
    "contragentRequests": [],
    "punktToPunktRequests": [],
    "punktRequests": [],
    "assignedToAgent": null,
    "assignedByPunkt": null,
    "confirmedByAgent": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Buyurtma topilmadi
- `400` - Noto'g'ri buyurtma ID

---

#### Get Order Contragent IDs

**Endpoint:** `GET /api/punkt/orders/:id/contragents`

**Description:** Buyurtmadagi maxsulotlarning contragent ID'larini olish (contragentga so'rov yuborish uchun)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Contragent nomi",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": { ... },
        "tuman": { ... },
        "mfy": { ... },
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "Maxsulot nomi",
            "quantity": 2,
            "price": 50000
          }
        ],
        "hasRequest": false,
        "requestStatus": null,
        "requestedAt": null
      }
    ]
  }
}
```

**Notes:**
- `isInRegion` - Contragent punkt hududida bormi
- `hasRequest` - Bu contragentga so'rov yuborilganmi
- `requestStatus` - So'rov holati (agar mavjud bo'lsa)

---

#### Confirm Order

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Description:** Buyurtmani tasdiqlash (punkt tomonidan)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:** Bo'sh (body kerak emas)

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "contragentRequests": [ ... ],
    "punktToPunktRequests": [ ... ]
  }
}
```

**Status Changes:**
- `status`: `pending` → `confirmed_by_punkt`
- `punktStatus`: `pending` → `confirmed`
- `confirmedByPunkt`: Punkt ID o'rnatiladi
- `currentPunkt`: Punkt ID o'rnatiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Buyurtma allaqachon tasdiqlanmagan bo'lishi kerak
- Kamida bitta maxsulotning yetkazish hududi punkt tumanidagi MFY'ni o'z ichiga olishi kerak

**Auto-Routing:**
- Tasdiqlashdan keyin avtomatik routing ishlaydi (agar mavjud bo'lsa)
- O'z tumanidagi contragentlarga so'rov yuboriladi
- Boshqa tuman punktlariga so'rov yuboriladi

**Error Responses:**
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Bu buyurtma allaqachon tasdiqlangan
- `403` - Siz bu buyurtmani tasdiqlay olmaysiz (maxsulotlar yetkazish hududida sizning tumaningizdagi MFY'lardan biri yo'q)
- `404` - Buyurtma topilmadi

---

### 3. Contragent Operations

#### Request to Contragent

**Endpoint:** `POST /api/punkt/orders/:id/request-to-contragent`

**Description:** Contragentga so'rov yuborish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "contragentId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "contragent": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Contragent nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "contragentRequests": [
      {
        "contragentId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "itemIds": [0, 1],
        "status": "pending",
        "requestedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `status`: `pending` yoki `confirmed_by_punkt` → `requested_to_contragent` (agar allaqachon `requested_to_contragent` bo'lmasa)
- `currentPunkt`: Punkt ID o'rnatiladi
- `contragentRequests`: Yangi so'rov qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak **YOKI** punkt currentPunkt bo'lishi kerak
- Contragent faol bo'lishi kerak
- Bu contragentga allaqachon so'rov yuborilmagan bo'lishi kerak
- Buyurtmada bu contragentning maxsulotlari bo'lishi kerak

**Notes:**
- `itemIds` - Bu contragentning maxsulotlarining buyurtmadagi indekslari
- Faqat bu contragentning maxsulotlari so'rovga kiritiladi
- **Muhim:** Agar punkt boshqa punktdan buyurtma qabul qilgan bo'lsa (currentPunkt bo'lsa), u ham contragentga so'rov yuborishi mumkin

**Error Responses:**
- `400` - Contragent ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas yoki siz hozirgi punkt emassiz
- `404` - Contragent topilmadi
- `400` - Contragent faol emas
- `400` - Bu contragentga allaqachon so'rov yuborilgan
- `400` - Bu buyurtmada tanlangan contragentning mahsulotlari yo'q

---

#### Receive from Contragent

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-contragent`

**Description:** Contragentdan buyurtma qabul qilish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:** Bo'sh (body kerak emas)

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma contragentdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "delivered_to_punkt",
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "contragentRequests": [
      {
        "contragentId": { ... },
        "status": "delivered_to_punkt",
        "deliveredToPunktAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `status`: `delivered_to_punkt` (agar allaqachon bo'lmasa)
- `currentPunkt`: Punkt ID o'rnatiladi

**Validation:**
- Buyurtmada `delivered_to_punkt` holatidagi contragent so'rovi bo'lishi kerak
- Punkt currentPunkt bo'lishi kerak (yoki buyurtma punkt hududiga tegishli bo'lishi kerak)

**Error Responses:**
- `404` - Buyurtma topilmadi
- `404` - Contragentdan buyurtma hali yetkazilmagan
- `403` - Bu buyurtma sizning punktingizga tegishli emas

---

### 4. Punkt-to-Punkt Operations

#### Request to Punkt

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Description:** Boshqa punktga so'rov yuborish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "toPunktId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "toPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "punktToPunktRequests": [
      {
        "fromPunktId": { ... },
        "toPunktId": { ... },
        "status": "pending",
        "requestedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `punktToPunktRequests`: Yangi so'rov qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- ToPunkt faol bo'lishi kerak
- Bu punktga allaqachon so'rov yuborilmagan bo'lishi kerak (pending, accepted, yoki delivered bo'lsa, yana yubormaymiz)

**Error Responses:**
- `400` - Punkt ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `404` - Punkt topilmadi
- `400` - Punkt faol emas
- `400` - Bu punktga allaqachon so'rov yuborilgan

---

#### Request to Punkts (Multiple)

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkts`

**Description:** Bir nechta punktlarga so'rov yuborish (tuman bo'yicha)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "tumanIds": [
    "60f7b3b3b3b3b3b3b3b3b3b3",
    "60f7b3b3b3b3b3b3b3b3b3b4"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 ta punktga so'rov yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "requestedPunkts": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "name": "Punkt nomi",
        "phone": "+998901234567"
      }
    ],
    "punktRequests": [ ... ]
  }
}
```

**Status Changes:**
- `punktStatus`: `requested`
- `punktRequests`: Yangi so'rovlar qo'shiladi

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Barcha tumanlar punkt viloyatiga tegishli bo'lishi kerak
- Belgilangan tumanlarda faol punktlar bo'lishi kerak

**Error Responses:**
- `400` - Tuman ID'lari kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Ba'zi tumanlar topilmadi
- `400` - Barcha tumanlar sizning viloyatingizga tegishli bo'lishi kerak
- `404` - Belgilangan tumanlarda faol punktlar topilmadi

---

#### Get Punkt-to-Punkt Requests

**Endpoint:** `GET /api/punkt/punkt-to-punkt-requests`

**Description:** Punktga kelgan punkt-to-punkt so'rovlarini olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - So'rov holati filtri (`pending` | `accepted` | `rejected` | `delivered`)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "user": { ... },
      "items": [ ... ],
      "punktToPunktRequests": [
        {
          "fromPunktId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "name": "Yuboruvchi punkt",
            "phone": "+998901234567"
          },
          "toPunktId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "Qabul qiluvchi punkt",
            "phone": "+998901234568"
          },
          "status": "pending",
          "requestedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Notes:**
- Faqat bu punktga yuborilgan so'rovlar ko'rsatiladi
- `punktToPunktRequests` array'ida faqat bu punktga tegishli so'rovlar qoladi

---

#### Respond to Punkt-to-Punkt Request

**Endpoint:** `POST /api/punkt/punkt-to-punkt-requests/:orderId/respond`

**Description:** Punkt-to-punkt so'roviga javob berish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `orderId` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Response Values:**
- `accepted` - So'rovni qabul qilish
- `rejected` - So'rovni rad etish

**Response:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "punktToPunktRequests": [
      {
        "fromPunktId": { ... },
        "toPunktId": { ... },
        "status": "accepted",
        "respondedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "contragentRequests": [ ... ]
  }
}
```

**Status Changes (accepted):**
- `status`: `pending` yoki `requested_to_contragent` → `confirmed_by_punkt`
- `punktStatus`: `confirmed`
- `confirmedByPunkt`: Punkt ID o'rnatiladi
- `currentPunkt`: Punkt ID o'rnatiladi
- `punktToPunktRequests[].status`: `pending` → `accepted`
- `punktToPunktRequests[].respondedAt`: Joriy vaqt

**Auto-Routing:**
- Qabul qilingandan keyin avtomatik routing ishlaydi (agar mavjud bo'lsa)

**Validation:**
- So'rov pending bo'lishi kerak
- So'rov bu punktga yuborilgan bo'lishi kerak

**Error Responses:**
- `400` - Javob "accepted" yoki "rejected" bo'lishi kerak
- `404` - Buyurtma topilmadi
- `404` - Sizga so'rov yuborilmagan
- `400` - Bu so'rovga allaqachon javob berilgan

---

#### Receive from Punkt

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-punkt`

**Description:** Boshqa punktdan buyurtma qabul qilish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:** Bo'sh (body kerak emas)

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "delivered_to_punkt",
    "currentPunkt": "60f7b3b3b3b3b3b3b3b3b3b3",
    "punktToPunktRequests": [
      {
        "fromPunktId": { ... },
        "toPunktId": { ... },
        "status": "delivered",
        "deliveredAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- `status`: `delivered_to_punkt` (agar allaqachon bo'lmasa va `assigned_to_agent`, `confirmed_by_agent`, `confirmed_by_customer` bo'lmasa)
- `currentPunkt`: Punkt ID o'rnatiladi
- `punktToPunktRequests[].status`: `pending` yoki `accepted` → `delivered`
- `punktToPunktRequests[].deliveredAt`: Joriy vaqt

**Special Cases:**
- Agar so'rov `pending` bo'lsa, avtomatik `accepted` qilinadi va buyurtma tasdiqlanadi
- Agar so'rov `accepted` bo'lsa, `delivered` qilinadi

**Validation:**
- Punktga so'rov yuborilgan bo'lishi kerak (pending yoki accepted)
- So'rov allaqachon delivered bo'lmasligi kerak

**Error Responses:**
- `404` - Buyurtma topilmadi
- `400` - Bu buyurtma allaqachon qabul qilingan
- `400` - Bu so'rov rad etilgan
- `404` - Sizga bu buyurtma yuborilmagan

---

#### Send to Punkt

**Endpoint:** `POST /api/punkt/orders/:id/send-to-punkt`

**Description:** Boshqa punktga buyurtma yuborish (B punktdan A punktga yuborish uchun)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "toPunktId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli punktga yuborildi",
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "toPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "currentPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "punktToPunktRequests": [ ... ]
  }
}
```

**Status Changes:**
- `status`: `delivered_to_punkt` (agar allaqachon bo'lmasa va `assigned_to_agent`, `confirmed_by_agent`, `confirmed_by_customer` bo'lmasa)
- `currentPunkt`: ToPunkt ID o'rnatiladi
- `punktToPunktRequests[].status`: `accepted` → `delivered` (yoki yangi so'rov yaratiladi)
- `punktToPunktRequests[].deliveredAt`: Joriy vaqt

**Validation:**
- Punkt currentPunkt bo'lishi kerak
- ToPunkt faol bo'lishi kerak
- Bu punktga allaqachon delivered so'rov yuborilmagan bo'lishi kerak

**Use Case:**
- B punkt contragentdan buyurtma qabul qilgandan keyin, A punktga yuborish uchun ishlatiladi

**Error Responses:**
- `400` - Punkt ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Siz hozirgi punkt emassiz. Faqat hozirgi punkt buyurtmani boshqa punktga yubora oladi
- `404` - Punkt topilmadi
- `400` - Punkt faol emas
- `400` - Bu punktga allaqachon buyurtma yuborilgan

---

#### Get Punkt Requests (Old Style)

**Endpoint:** `GET /api/punkt/requests`

**Description:** Punktga kelgan eski usuldagi so'rovlarni olish (punktRequests)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - So'rov holati filtri (`pending` | `accepted` | `rejected`)
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "user": { ... },
      "items": [ ... ],
      "punktRequests": [
        {
          "punktId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "name": "Yuboruvchi punkt",
            "phone": "+998901234567"
          },
          "status": "pending",
          "requestedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Notes:**
- Bu eski usuldagi so'rovlar (punktRequests)
- Faqat bu punktga yuborilgan so'rovlar ko'rsatiladi

---

#### Respond to Request (Old Style)

**Endpoint:** `POST /api/punkt/requests/:orderId/respond`

**Description:** Eski usuldagi so'rovga javob berish (punktRequests)

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `orderId` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Response Values:**
- `accepted` - So'rovni qabul qilish
- `rejected` - So'rovni rad etish

**Response:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi va buyurtma tasdiqlandi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "punktRequests": [
      {
        "punktId": { ... },
        "status": "accepted",
        "respondedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes (accepted):**
- `status`: `confirmed_by_punkt` (agar allaqachon bo'lmasa)
- `punktStatus`: `confirmed`
- `confirmedByPunkt`: Punkt ID o'rnatiladi
- `punktRequests[].status`: `pending` → `accepted`
- `punktRequests[].respondedAt`: Joriy vaqt

**Validation:**
- So'rov pending bo'lishi kerak
- So'rov bu punktga yuborilgan bo'lishi kerak

**Error Responses:**
- `400` - Javob "accepted" yoki "rejected" bo'lishi kerak
- `404` - Buyurtma topilmadi
- `404` - Sizga so'rov yuborilmagan
- `400` - Bu so'rovga allaqachon javob berilgan

---

### 5. Agent Operations

#### Assign Order to Agent

**Endpoint:** `POST /api/punkt/orders/:id/assign-to-agent`

**Description:** Buyurtmani agentga topshirish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `id` - Buyurtma ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "agentId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli agentga yuborildi",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "status": "assigned_to_agent",
    "assignedToAgent": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Agent nomi",
      "phone": "+998901234567",
      "viloyat": { ... },
      "tuman": { ... },
      "mfy": { ... }
    },
    "assignedByPunkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "assignedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Changes:**
- `status`: `delivered_to_punkt` yoki `confirmed_by_punkt` → `assigned_to_agent`
- `assignedToAgent`: Agent ID o'rnatiladi
- `assignedByPunkt`: Punkt ID o'rnatiladi
- `assignedAt`: Joriy vaqt

**Validation:**
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Buyurtma punkt tomonidan tasdiqlangan yoki currentPunkt bo'lishi kerak
- Buyurtma allaqachon agentga yuborilmagan bo'lishi kerak
- Agent faol bo'lishi kerak

**Error Responses:**
- `400` - Agent ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `403` - Bu buyurtmani siz tasdiqlamaggansiz va hozirgi punkt ham siz emassiz, shuning uchun agentga yubora olmaysiz
- `400` - Bu buyurtma allaqachon agentga yuborilgan
- `404` - Agent topilmadi
- `400` - Agent faol emas

---

### 6. KPI Operations

#### Get KPI Summary

**Endpoint:** `GET /api/punkt/kpi/summary`

**Description:** Punktning KPI bonuslari umumiy ma'lumotlari

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `isPaid` (optional) - To'lov holati filtri (`true` | `false`)

**Response:**
```json
{
  "success": true,
  "data": {
    "punkt": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567"
    },
    "summary": {
      "totalTransactions": 30,
      "totalAmount": 45000,
      "paidAmount": 25000,
      "unpaidAmount": 20000,
      "paidTransactions": 15,
      "unpaidTransactions": 15
    }
  }
}
```

**Response Fields:**
- `totalTransactions`: Jami KPI bonus transaksiyalari soni
- `totalAmount`: Jami bonus miqdori (to'langan + to'lanmagan), quyidagilarni o'z ichiga oladi:
  - Oddiy punkt bonuslari
  - Punktdan transfer bonuslari (bu punkt boshqa punktga buyurtma yuborganida)
  - Punktga transfer bonuslari (bu punkt boshqa punktdan buyurtma qabul qilganda)
- `paidAmount`: To'langan bonus miqdori
- `unpaidAmount`: To'lanmagan bonus miqdori
- `paidTransactions`: To'langan transaksiyalar soni
- `unpaidTransactions`: To'lanmagan transaksiyalar soni

---

#### Get KPI Transactions

**Endpoint:** `GET /api/punkt/kpi/transactions`

**Description:** Punktning KPI bonus transaksiyalari

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni
- `startDate` (optional) - Boshlanish sanasi (ISO 8601)
- `endDate` (optional) - Tugash sanasi (ISO 8601)
- `isPaid` (optional) - To'lov holati filtri (`true` | `false`)

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "orderNumber": "00001",
      "type": "credit",
      "amount": 10000,
      "punktAmount": 10000,
      "fromPunktAmount": 0,
      "toPunktAmount": 0,
      "description": "Buyurtma #00001 uchun bonus",
      "isPaid": false,
      "paidAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `type`: Transaksiya turi (`credit` - bonus, `debit` - to'lov)
- `amount`: Jami miqdor
- `punktAmount`: Oddiy punkt bonus miqdori
- `fromPunktAmount`: Punktdan transfer bonus miqdori (bu punkt yuborganida)
- `toPunktAmount`: Punktga transfer bonus miqdori (bu punkt qabul qilganda)
- `isPaid`: To'langanmi
- `paidAt`: To'lov sanasi (agar to'langan bo'lsa)

---

#### Get KPI Daily Balance

**Endpoint:** `GET /api/punkt/kpi/balance`

**Description:** Punktning kunlik KPI balansi

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `date` (optional) - Sana (ISO 8601, default: bugungi sana)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "openingBalance": 100000,
    "closingBalance": 150000,
    "totalCredits": 60000,
    "totalDebits": 10000,
    "transactions": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "type": "credit",
        "amount": 10000,
        "description": "Buyurtma #00001 uchun bonus",
        "createdAt": "2024-01-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### Get KPI Daily Report

**Endpoint:** `GET /api/punkt/kpi/reports/daily`

**Description:** Punktning kunlik KPI hisoboti

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `date` (optional) - Sana (ISO 8601, default: bugungi sana)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "totalOrders": 10,
    "totalKpiAmount": 100000,
    "totalCredits": 60000,
    "totalDebits": 10000,
    "netAmount": 50000,
    "orders": [
      {
        "orderNumber": "00001",
        "kpiAmount": 10000,
        "status": "confirmed_by_customer"
      }
    ]
  }
}
```

---

### 7. Notifications

#### Get Notifications

**Endpoint:** `GET /api/punkts/notifications/list`

**Description:** Punktning bildirishnomalarini olish

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni
- `read` (optional) - O'qilgan/o'qilmagan filtri (`true` | `false`)

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "type": "order_request",
      "title": "Yangi buyurtma so'rovi",
      "message": "Sizga yangi buyurtma so'rovi yuborildi",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Get Unread Count

**Endpoint:** `GET /api/punkts/notifications/unread-count`

**Description:** O'qilmagan bildirishnomalar soni

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

#### Mark Notification as Read

**Endpoint:** `POST /api/punkts/notifications/:notificationId/read`

**Description:** Bildirishnomani o'qilgan deb belgilash

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `notificationId` - Bildirishnoma ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Bildirishnoma o'qilgan deb belgilandi"
}
```

---

#### Mark All Notifications as Read

**Endpoint:** `POST /api/punkts/notifications/read-all`

**Description:** Barcha bildirishnomalarni o'qilgan deb belgilash

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Barcha bildirishnomalar o'qilgan deb belgilandi",
  "data": {
    "updatedCount": 10
  }
}
```

---

### 8. Data Retrieval

#### Get Punkts for Selection

**Endpoint:** `GET /api/punkts/selection`

**Description:** Punkt ID tanlash uchun punktlar ro'yxati (public endpoint)

**Query Parameters:**
- `status` (optional) - Punkt holati filtri (default: `active`)
- `viloyat` (optional) - Viloyat ID filtri
- `tuman` (optional) - Tuman ID filtri
- `search` (optional) - Punkt nomi yoki telefon raqami bo'yicha qidirish
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 100) - Har bir sahifadagi elementlar soni

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
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Punkt nomi",
      "phone": "+998901234567",
      "viloyat": { ... },
      "tuman": { ... },
      "status": "active"
    }
  ]
}
```

**Notes:**
- Bu endpoint autentifikatsiya talab qilmaydi
- Faqat minimal ma'lumotlar qaytariladi (ID, nom, telefon, hudud, holat)

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Xatolik xabari",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Muvaffaqiyatli so'rov |
| `201` | Muvaffaqiyatli yaratildi |
| `400` | Noto'g'ri so'rov (validation error) |
| `401` | Autentifikatsiya xatosi |
| `403` | Ruxsat berilmagan (authorization error) |
| `404` | Topilmadi (not found) |
| `500` | Server xatosi |

### Common Error Messages

- `"Buyurtma topilmadi"` - Order not found
- `"Bu buyurtma sizning hududingizga tegishli emas"` - Order does not belong to your region
- `"Bu buyurtma allaqachon tasdiqlangan"` - Order already confirmed
- `"Contragent topilmadi"` - Contragent not found
- `"Punkt topilmadi"` - Punkt not found
- `"Agent topilmadi"` - Agent not found
- `"Sizga so'rov yuborilmagan"` - Request not sent to you
- `"Bu so'rovga allaqachon javob berilgan"` - Request already responded
- `"Telefon raqami yoki parol noto'g'ri"` - Invalid phone or password
- `"Hisobingiz faol emas"` - Account is not active
- `"Siz hozirgi punkt emassiz"` - You are not the current punkt

---

## Complete Workflow Examples

### Example 1: Simple Order Flow (Direct Contragent)

```
1. Login
   POST /api/punkts/login
   → Get token

2. Get Orders
   GET /api/punkt/orders?status=pending
   → See pending orders

3. Confirm Order
   POST /api/punkt/orders/:id/confirm
   → Order confirmed, auto-routing may occur

4. Get Contragents
   GET /api/punkt/orders/:id/contragents
   → See available contragents

5. Request to Contragent
   POST /api/punkt/orders/:id/request-to-contragent
   Body: { "contragentId": "..." }
   → Request sent to contragent

6. (Contragent accepts and delivers)

7. Receive from Contragent
   POST /api/punkt/orders/:id/receive-from-contragent
   → Order received from contragent

8. Assign to Agent
   POST /api/punkt/orders/:id/assign-to-agent
   Body: { "agentId": "..." }
   → Order assigned to agent
```

### Example 2: Punkt-to-Punkt Flow (Complex)

```
1. A Punkt Login
   POST /api/punkts/login
   → Get token A

2. A Punkt Confirms Order
   POST /api/punkt/orders/:id/confirm
   → Order confirmed by A punkt

3. A Punkt Requests to B Punkt
   POST /api/punkt/orders/:id/request-to-punkt
   Body: { "toPunktId": "B_punkt_id" }
   → Request sent to B punkt

4. B Punkt Login
   POST /api/punkts/login
   → Get token B

5. B Punkt Gets Requests
   GET /api/punkt/punkt-to-punkt-requests?status=pending
   → See pending requests

6. B Punkt Accepts Request
   POST /api/punkt/punkt-to-punkt-requests/:orderId/respond
   Body: { "response": "accepted" }
   → Request accepted, currentPunkt = B punkt

7. B Punkt Gets Contragents
   GET /api/punkt/orders/:id/contragents
   → See available contragents

8. B Punkt Requests to Contragent
   POST /api/punkt/orders/:id/request-to-contragent
   Body: { "contragentId": "..." }
   → Request sent to contragent (B punkt is currentPunkt)

9. (Contragent accepts and delivers)

10. B Punkt Receives from Contragent
    POST /api/punkt/orders/:id/receive-from-contragent
    → Order received from contragent

11. B Punkt Sends to A Punkt
    POST /api/punkt/orders/:id/send-to-punkt
    Body: { "toPunktId": "A_punkt_id" }
    → Order sent to A punkt, currentPunkt = A punkt

12. A Punkt Receives from B Punkt
    POST /api/punkt/orders/:id/receive-from-punkt
    → Order received from B punkt

13. A Punkt Assigns to Agent
    POST /api/punkt/orders/:id/assign-to-agent
    Body: { "agentId": "..." }
    → Order assigned to agent
```

### Example 3: Get KPI Information

```
1. Get KPI Summary
   GET /api/punkt/kpi/summary
   → See total bonuses

2. Get KPI Transactions
   GET /api/punkt/kpi/transactions?page=1&limit=50
   → See detailed transactions

3. Get Daily Balance
   GET /api/punkt/kpi/balance?date=2024-01-01
   → See daily balance

4. Get Daily Report
   GET /api/punkt/kpi/reports/daily?date=2024-01-01
   → See daily report
```

---

## Important Notes

### Current Punkt Concept

**`currentPunkt`** - Bu maydon buyurtma hozir qaysi punktda ekanligini ko'rsatadi. Bu punkt buyurtmani boshqaradi va quyidagi operatsiyalarni bajarishi mumkin:

- Contragentga so'rov yuborish
- Contragentdan qabul qilish
- Boshqa punktga yuborish
- Agentga topshirish

**Muhim:** Agar punkt `currentPunkt` bo'lsa, u buyurtmani boshqarishi mumkin, hatto buyurtma uning hududiga tegishli bo'lmasa ham.

### Order Status Flow

Buyurtma holati quyidagi ketma-ketlikda o'zgaradi:

```
pending
  ↓
confirmed_by_punkt (Punkt tasdiqlaganda)
  ↓
requested_to_contragent (Contragentga so'rov yuborilganda)
  ↓
accepted_by_contragent (Contragent qabul qilganda)
  ↓
delivered_to_punkt (Contragent yetkazganda yoki Punktdan qabul qilinganda)
  ↓
assigned_to_agent (Agentga topshirilganda)
  ↓
confirmed_by_agent (Agent tasdiqlaganda)
  ↓
confirmed_by_customer (Mijoz tasdiqlaganda)
```

### Punkt-to-Punkt Request Status Flow

```
pending (So'rov yuborilgan)
  ↓
accepted (Qabul qilingan punkt qabul qilgan)
  ↓
delivered (Buyurtma punktga yetkazilgan)
```

### Contragent Request Status Flow

```
pending (So'rov yuborilgan)
  ↓
accepted (Contragent qabul qilgan)
  ↓
delivered_to_punkt (Contragent punktga yetkazgan)
```

### Auto-Routing

Ba'zi holatlarda (masalan, buyurtma tasdiqlanganda yoki punkt-to-punkt so'rov qabul qilinganda) avtomatik routing ishlaydi:

- O'z tumanidagi contragentlarga so'rov yuboriladi
- Boshqa tuman punktlariga so'rov yuboriladi

Lekin bu avtomatik routing punkt-to-punkt so'rov qabul qilinganda ham ishlaydi.

### Multiple Requests

Bir buyurtmaga bir nechta contragentlarga yoki punktlarga so'rov yuborish mumkin. Har bir so'rov alohida kuzatiladi.

### KPI Bonus Calculation

KPI bonuslar buyurtma `confirmed_by_customer` holatiga o'tganda hisoblanadi. Bonus quyidagilardan iborat:

- Oddiy punkt bonus (punkt buyurtmani tasdiqlaganda)
- Punktdan transfer bonus (punkt boshqa punktga buyurtma yuborganida)
- Punktga transfer bonus (punkt boshqa punktdan buyurtma qabul qilganda)

---

## Support

Agar savollar yoki muammolar bo'lsa, iltimos, texnik yordam bilan bog'laning.

---

**Documentation Version:** 2.0.0  
**Last Updated:** 2024-12-17