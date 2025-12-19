# Punkt Order App API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Order Status Flow](#order-status-flow)
- [Endpoints](#endpoints)
  - [Authentication](#1-authentication)
  - [Order Management](#2-order-management)
  - [Order Confirmation](#3-order-confirmation)
  - [Contragent Operations](#4-contragent-operations)
  - [Punkt-to-Punkt Operations](#5-punkt-to-punkt-operations)
  - [Agent Assignment](#6-agent-assignment)
  - [Data Retrieval](#7-data-retrieval)
  - [KPI Operations](#8-kpi-operations)
  - [Notifications](#9-notifications)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Punkt Order App API - bu punktlar uchun buyurtmalarni boshqarish, contragentlar bilan ishlash, boshqa punktlar bilan aloqa qilish va agentlarga buyurtmalarni topshirish funksiyalarini ta'minlaydi.

**Asosiy funksiyalar:**
- Buyurtmalarni ko'rish va boshqarish
- Buyurtmalarni tasdiqlash
- Contragentlarga so'rov yuborish
- Boshqa punktlarga so'rov yuborish va qabul qilish
- Contragentdan buyurtma qabul qilish
- Punktdan buyurtma qabul qilish
- Agentlarga buyurtma topshirish
- KPI bonuslarni ko'rish

**Base Path:** `/api/punkt`

---

## Base URL

```
http://localhost:5000/api/punkt
```

---

## Authentication

Barcha endpoint'lar Punkt autentifikatsiyasini talab qiladi (login endpoint'dan tashqari).

**Format:** `Authorization: Bearer <punkt_token>`

**Token Expiration:** 24 hours

**Login Endpoint:**
- **Path:** `/api/punkts/login`
- **Method:** `POST`
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
        "viloyat": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TOS"
        },
        "tuman": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "CHI"
        },
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
        "category": {
          "_id": "string",
          "name": "string",
          "slug": "string"
        },
        "subcategory": {
          "_id": "string",
          "name": "string",
          "slug": "string"
        },
        "contragent": {
          "_id": "string",
          "name": "string",
          "inn": "string",
          "phone": "string"
        }
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
  "deliveryViloyat": {
    "_id": "string",
    "name": "string",
    "type": "region",
    "code": "string"
  },
  "deliveryTuman": {
    "_id": "string",
    "name": "string",
    "type": "district",
    "code": "string"
  } | null,
  "deliveryMfy": {
    "_id": "string",
    "name": "string",
    "type": "mfy",
    "code": "string"
  } | null,
  "deliveryNote": "string",
  "phoneNumber": "string",
  "confirmedByPunkt": {
    "_id": "string",
    "name": "string",
    "phone": "string",
    "viloyat": "object",
    "tuman": "object"
  } | null,
  "punktStatus": "pending" | "confirmed" | "rejected" | "requested",
  "currentPunkt": {
    "_id": "string",
    "name": "string",
    "phone": "string",
    "viloyat": "object",
    "tuman": "object"
  } | null,
  "assignedToAgent": {
    "_id": "string",
    "name": "string",
    "phone": "string",
    "viloyat": "object",
    "tuman": "object",
    "mfy": "object"
  } | null,
  "assignedByPunkt": {
    "_id": "string",
    "name": "string",
    "phone": "string"
  } | null,
  "assignedAt": "string (ISO 8601 date)" | null,
  "confirmedByAgent": {
    "_id": "string",
    "name": "string",
    "phone": "string"
  } | null,
  "agentConfirmedAt": "string (ISO 8601 date)" | null,
  "contragentRequests": [
    {
      "contragentId": {
        "_id": "string",
        "name": "string",
        "inn": "string",
        "phone": "string",
        "viloyat": "object",
        "tuman": "object",
        "mfy": "object"
      },
      "itemIds": ["number"],
      "status": "pending" | "accepted" | "rejected" | "delivered_to_punkt",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string (ISO 8601 date)" | null,
      "deliveredToPunktAt": "string (ISO 8601 date)" | null
    }
  ],
  "punktToPunktRequests": [
    {
      "fromPunktId": {
        "_id": "string",
        "name": "string",
        "phone": "string",
        "viloyat": "object",
        "tuman": "object"
      },
      "toPunktId": {
        "_id": "string",
        "name": "string",
        "phone": "string",
        "viloyat": "object",
        "tuman": "object"
      },
      "status": "pending" | "accepted" | "rejected" | "delivered",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string (ISO 8601 date)" | null,
      "deliveredAt": "string (ISO 8601 date)" | null
    }
  ],
  "punktRequests": [
    {
      "punktId": {
        "_id": "string",
        "name": "string",
        "phone": "string",
        "viloyat": "object",
        "tuman": "object"
      },
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

### Contragent Object

```json
{
  "_id": "string (MongoDB ObjectId)",
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
  } | null,
  "mfy": {
    "_id": "string",
    "name": "string",
    "type": "mfy",
    "code": "string"
  } | null,
  "status": "active" | "inactive"
}
```

---

## Order Status Flow

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

### Status Transition Flow

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

**Alternative Flow (Punkt-to-Punkt):**

```
pending
  ↓
confirmed_by_punkt (Boshqa punkt tasdiqlaganda)
  ↓
delivered_to_punkt (Punktdan qabul qilinganda)
  ↓
assigned_to_agent
  ↓
confirmed_by_agent
  ↓
confirmed_by_customer
```

### Punkt Status Values

| Status | Description |
|--------|-------------|
| `pending` | Punkt hali buyurtmani ko'rib chiqmagan |
| `confirmed` | Punkt buyurtmani tasdiqlagan |
| `rejected` | Punkt buyurtmani rad etgan |
| `requested` | Punkt boshqa punktlarga so'rov yuborgan |

### Contragent Request Status Values

| Status | Description |
|--------|-------------|
| `pending` | So'rov yuborilgan, javob kutilmoqda |
| `accepted` | Contragent so'rovni qabul qilgan |
| `rejected` | Contragent so'rovni rad etgan |
| `delivered_to_punkt` | Contragent punktga yetkazgan |

### Punkt-to-Punkt Request Status Values

| Status | Description |
|--------|-------------|
| `pending` | So'rov yuborilgan, javob kutilmoqda |
| `accepted` | Qabul qilingan punkt so'rovni qabul qilgan |
| `rejected` | Qabul qilingan punkt so'rovni rad etgan |
| `delivered` | Buyurtma punktga yetkazilgan |

---

## Endpoints

### 1. Authentication

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
- `500` - Server xatosi

---

### 2. Order Management

#### Get My Orders

**Endpoint:** `GET /api/punkt/orders`

**Description:** Punktning barcha buyurtmalarini olish (o'z hududidagi va tegishli buyurtmalar)

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

**Query Parameters:**
- `status` (optional) - Buyurtma holati filtri
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni

**Response:** Xuddi `GET /api/punkt/orders` kabi, lekin faqat bugungi buyurtmalar

---

#### Get Order History

**Endpoint:** `GET /api/punkt/orders/history`

**Description:** O'tgan kunlardagi buyurtmalarni olish (bugungi kundan tashqari)

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

### 3. Order Confirmation

#### Confirm Order

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Description:** Buyurtmani tasdiqlash (punkt tomonidan)

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

### 4. Contragent Operations

#### Request to Contragent

**Endpoint:** `POST /api/punkt/orders/:id/request-to-contragent`

**Description:** Contragentga so'rov yuborish

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
- Buyurtma punkt hududiga tegishli bo'lishi kerak
- Contragent faol bo'lishi kerak
- Bu contragentga allaqachon so'rov yuborilmagan bo'lishi kerak
- Buyurtmada bu contragentning maxsulotlari bo'lishi kerak

**Notes:**
- `itemIds` - Bu contragentning maxsulotlarining buyurtmadagi indekslari
- Faqat bu contragentning maxsulotlari so'rovga kiritiladi

**Error Responses:**
- `400` - Contragent ID kiritilishi shart
- `404` - Buyurtma topilmadi
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `404` - Contragent topilmadi
- `400` - Contragent faol emas
- `400` - Bu contragentga allaqachon so'rov yuborilgan
- `400` - Bu buyurtmada tanlangan contragentning mahsulotlari yo'q

---

#### Receive from Contragent

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-contragent`

**Description:** Contragentdan buyurtma qabul qilish

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

### 5. Punkt-to-Punkt Operations

#### Request to Punkt

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Description:** Boshqa punktga so'rov yuborish

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

#### Get Punkt Requests (Old Style)

**Endpoint:** `GET /api/punkt/requests`

**Description:** Punktga kelgan eski usuldagi so'rovlarni olish (punktRequests)

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

### 6. Agent Assignment

#### Assign Order to Agent

**Endpoint:** `POST /api/punkt/orders/:id/assign-to-agent`

**Description:** Buyurtmani agentga topshirish

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

### 7. Data Retrieval

#### Get Contragents in Region

**Endpoint:** `GET /api/punkt/data/contragents`

**Description:** Punkt hududidagi contragentlarni olish

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

**Notes:**
- Faqat punkt viloyatidagi contragentlar ko'rsatiladi
- Agar punkt tumani bo'lsa, faqat o'sha tumandagi contragentlar ko'rsatiladi

---

### 8. KPI Operations

#### Get KPI Summary

**Endpoint:** `GET /api/punkt/kpi/summary`

**Description:** Punktning KPI bonuslari umumiy ma'lumotlari

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 1000000,
    "totalEarned": 2000000,
    "totalSpent": 1000000,
    "totalTransactions": 50
  }
}
```

---

#### Get KPI Transactions

**Endpoint:** `GET /api/punkt/kpi/transactions`

**Description:** Punktning KPI bonus transaksiyalari

**Query Parameters:**
- `page` (optional, default: 1) - Sahifa raqami
- `limit` (optional, default: 50) - Har bir sahifadagi elementlar soni
- `type` (optional) - Transaksiya turi filtri
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi

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
      "type": "credit",
      "amount": 10000,
      "description": "Buyurtma #00001 uchun bonus",
      "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "orderNumber": "00001",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Get KPI Daily Balance

**Endpoint:** `GET /api/punkt/kpi/balance`

**Description:** Punktning kunlik KPI balansi

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

### 9. Notifications

#### Get Notifications

**Endpoint:** `GET /api/punkt/notifications/list`

**Description:** Punktning bildirishnomalarini olish

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

**Endpoint:** `GET /api/punkt/notifications/unread-count`

**Description:** O'qilmagan bildirishnomalar soni

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

**Endpoint:** `POST /api/punkt/notifications/:notificationId/read`

**Description:** Bildirishnomani o'qilgan deb belgilash

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

**Endpoint:** `POST /api/punkt/notifications/read-all`

**Description:** Barcha bildirishnomalarni o'qilgan deb belgilash

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

---

## Examples

### Example 1: Complete Order Flow

#### Step 1: Login
```bash
POST /api/punkts/login
{
  "phone": "+998901234567",
  "password": "password123"
}
```

#### Step 2: Get Orders
```bash
GET /api/punkt/orders?status=pending
Authorization: Bearer <token>
```

#### Step 3: Confirm Order
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/confirm
Authorization: Bearer <token>
```

#### Step 4: Request to Contragent
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/request-to-contragent
Authorization: Bearer <token>
{
  "contragentId": "60f7b3b3b3b3b3b3b3b3b3b4"
}
```

#### Step 5: Receive from Contragent
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/receive-from-contragent
Authorization: Bearer <token>
```

#### Step 6: Assign to Agent
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/assign-to-agent
Authorization: Bearer <token>
{
  "agentId": "60f7b3b3b3b3b3b3b3b3b3b5"
}
```

---

### Example 2: Punkt-to-Punkt Flow

#### Step 1: Request to Another Punkt
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/request-to-punkt
Authorization: Bearer <token>
{
  "toPunktId": "60f7b3b3b3b3b3b3b3b3b3b4"
}
```

#### Step 2: (Other Punkt) Get Requests
```bash
GET /api/punkt/punkt-to-punkt-requests?status=pending
Authorization: Bearer <other_punkt_token>
```

#### Step 3: (Other Punkt) Accept Request
```bash
POST /api/punkt/punkt-to-punkt-requests/60f7b3b3b3b3b3b3b3b3b3b3/respond
Authorization: Bearer <other_punkt_token>
{
  "response": "accepted"
}
```

#### Step 4: (Other Punkt) Receive Order
```bash
POST /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/receive-from-punkt
Authorization: Bearer <other_punkt_token>
```

---

### Example 3: Get Order Contragents

```bash
GET /api/punkt/orders/60f7b3b3b3b3b3b3b3b3b3b3/contragents
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
        "isInRegion": true,
        "hasRequest": false,
        "products": [
          {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
            "name": "Maxsulot 1",
            "quantity": 2,
            "price": 50000
          }
        ]
      }
    ]
  }
}
```

---

## Notes

### Important Considerations

1. **Authentication:** Barcha endpoint'lar (login'dan tashqari) `Authorization: Bearer <token>` header'ini talab qiladi.

2. **Order Status Flow:** Buyurtma holati avtomatik o'zgaradi har bir amal bajarilganda. Status o'zgarishlarini kuzatib boring.

3. **Region Validation:** Punkt faqat o'z hududidagi buyurtmalar bilan ishlay oladi (deliveryViloyat va deliveryTuman bo'yicha).

4. **Current Punkt:** `currentPunkt` maydoni buyurtma hozir qaysi punktda ekanligini ko'rsatadi. Bu punkt buyurtmani boshqaradi.

5. **Auto-Routing:** Ba'zi holatlarda (masalan, buyurtma tasdiqlanganda) avtomatik routing ishlaydi va contragentlarga yoki boshqa punktlarga so'rovlar yuboriladi.

6. **Request Statuses:** 
   - Contragent so'rovlari: `pending` → `accepted`/`rejected` → `delivered_to_punkt`
   - Punkt-to-punkt so'rovlari: `pending` → `accepted`/`rejected` → `delivered`

7. **Multiple Requests:** Bir buyurtmaga bir nechta contragentlarga yoki punktlarga so'rov yuborish mumkin.

8. **KPI Bonus:** KPI bonuslar buyurtma `confirmed_by_customer` holatiga o'tganda hisoblanadi.

9. **Notifications:** Punkt yangi so'rovlar, buyurtma o'zgarishlari va boshqa muhim voqealardan xabardor bo'ladi.

10. **Pagination:** Ko'pchilik ro'yxat endpoint'lari pagination qo'llab-quvvatlaydi (`page` va `limit` parametrlari).

---

## Support

Agar savollar yoki muammolar bo'lsa, iltimos, texnik yordam bilan bog'laning.

---

**Documentation Version:** 1.0.0  
**Last Updated:** 2024-01-01

