# Agent Order Management API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [MFY Agent](#mfy-agent)
    - [O'z Hududidagi Buyurtmalar](#1-mfy-oz-hududidagi-buyurtmalar)
    - [Buyurtma Tafsilotlari](#2-mfy-buyurtma-tafsilotlari)
    - [Buyurtmani Tasdiqlash](#3-mfy-buyurtmani-tasdiqlash)
  - [Tuman Agent](#tuman-agent)
    - [O'z Hududidagi Buyurtmalar](#4-tuman-oz-hududidagi-buyurtmalar)
    - [Buyurtma Tafsilotlari](#5-tuman-buyurtma-tafsilotlari)
  - [Viloyat Agent](#viloyat-agent)
    - [O'z Hududidagi Buyurtmalar](#6-viloyat-oz-hududidagi-buyurtmalar)
    - [Buyurtma Tafsilotlari](#7-viloyat-buyurtma-tafsilotlari)
- [Buyurtma Jarayoni](#buyurtma-jarayoni)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Agent Order Management API agentlar (MFY, Tuman, Viloyat) uchun buyurtmalarni kuzatish funksiyalarini ta'minlaydi. Har bir agent turi o'z hududidagi buyurtmalarni ko'radi va kuzatadi.

**Base Path:** `/api/agent`

**Eslatma:** Har bir endpoint faqat tegishli agent turi uchun ishlaydi.

---

## Base URL

```
http://localhost:5000/api/agent
```

---

## Authentication

Barcha endpoint'lar Agent autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <agent_token>`

**Eslatma:** Har bir endpoint faqat tegishli agent turi uchun ishlaydi. Masalan, MFY agent endpoint'lari faqat MFY agentlar tomonidan ishlatilishi mumkin.

---

## Data Models

### Order
```json
{
  "_id": "ObjectId",
  "orderNumber": "00001",
  "items": [
    {
      "product": {
        "_id": "ObjectId",
        "name": "Maxsulot nomi"
      },
      "quantity": 2,
      "price": 150000
    }
  ],
  "totalPrice": 300000,
  "status": "pending|confirmed_by_punkt|requested_to_contragent|accepted_by_contragent|delivered_to_punkt|assigned_to_agent|confirmed_by_agent|confirmed_by_customer",
  "deliveryViloyat": {
    "_id": "ObjectId",
    "name": "Toshkent viloyati"
  },
  "deliveryTuman": {
    "_id": "ObjectId",
    "name": "Chirchiq tumani"
  },
  "deliveryMfy": {
    "_id": "ObjectId",
    "name": "Yunusobod MFY"
  },
  "assignedToAgent": "ObjectId",
  "confirmedByAgent": "ObjectId",
  "agentConfirmedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## Endpoints

### MFY Agent

MFY agentlar uchun endpoint'lar. Faqat `mfy` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 1. MFY O'z Hududidagi Buyurtmalar

MFY agent o'z hududidagi (o'z MFY'sidagi) buyurtmalarni ko'radi.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `status` (optional): Buyurtma holati
- `paymentStatus` (optional): To'lov holati
- `paymentMethod` (optional): To'lov usuli
- `orderNumber` (optional): Buyurtma raqami
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi
- `minTotalPrice` (optional): Minimal jami narx
- `maxTotalPrice` (optional): Maksimal jami narx
- `search` (optional): Qidiruv
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Har sahifadagi buyurtmalar soni (default: 50)

**Response:**
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
      "_id": "ObjectId",
      "orderNumber": "00001",
      "items": [],
      "totalPrice": 300000,
      "status": "assigned_to_agent",
      "deliveryMfy": {
        "_id": "ObjectId",
        "name": "Yunusobod MFY"
      },
      "assignedToAgent": "ObjectId",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent&page=1&limit=50" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

#### 2. MFY Buyurtma Tafsilotlari

MFY agent buyurtma tafsilotlarini ko'radi.

**Endpoint:** `GET /orders/:id`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "orderNumber": "00001",
    "items": [],
    "totalPrice": 300000,
    "status": "assigned_to_agent",
    "deliveryMfy": {
      "_id": "ObjectId",
      "name": "Yunusobod MFY"
    },
    "assignedToAgent": {
      "_id": "ObjectId",
      "name": "MFY Agent",
      "phone": "+998901234567"
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

#### 3. MFY Buyurtmani Tasdiqlash

MFY agent buyurtmani foydalanuvchiga yetkazganini tasdiqlaydi.

**Endpoint:** `POST /orders/:id/confirm`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "orderId": "ObjectId",
    "orderNumber": "00001",
    "status": "confirmed_by_agent"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

---

### Tuman Agent

Tuman agentlar uchun endpoint'lar. Faqat `tuman` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 4. Tuman O'z Hududidagi Buyurtmalar

Tuman agent o'z hududidagi (o'z tumanidagi) buyurtmalarni ko'radi.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `status` (optional): Buyurtma holati
- `paymentStatus` (optional): To'lov holati
- `paymentMethod` (optional): To'lov usuli
- `orderNumber` (optional): Buyurtma raqami
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi
- `minTotalPrice` (optional): Minimal jami narx
- `maxTotalPrice` (optional): Maksimal jami narx
- `search` (optional): Qidiruv
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Har sahifadagi buyurtmalar soni (default: 50)

**Response:**
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
      "_id": "ObjectId",
      "orderNumber": "00001",
      "items": [],
      "totalPrice": 300000,
      "status": "assigned_to_agent",
      "deliveryTuman": {
        "_id": "ObjectId",
        "name": "Chirchiq tumani"
      },
      "assignedToAgent": "ObjectId",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent&page=1&limit=50" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

#### 5. Tuman Buyurtma Tafsilotlari

Tuman agent buyurtma tafsilotlarini ko'radi.

**Endpoint:** `GET /orders/:id`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "orderNumber": "00001",
    "items": [],
    "totalPrice": 300000,
    "status": "assigned_to_agent",
    "deliveryTuman": {
      "_id": "ObjectId",
      "name": "Chirchiq tumani"
    },
    "assignedToAgent": {
      "_id": "ObjectId",
      "name": "MFY Agent",
      "phone": "+998901234567"
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

---

### Viloyat Agent

Viloyat agentlar uchun endpoint'lar. Faqat `viloyat` agentType'ga ega agentlar ishlatishi mumkin.

---

#### 6. Viloyat O'z Hududidagi Buyurtmalar

Viloyat agent o'z hududidagi (o'z viloyatidagi) buyurtmalarni ko'radi.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `status` (optional): Buyurtma holati
- `paymentStatus` (optional): To'lov holati
- `paymentMethod` (optional): To'lov usuli
- `orderNumber` (optional): Buyurtma raqami
- `startDate` (optional): Boshlanish sanasi
- `endDate` (optional): Tugash sanasi
- `minTotalPrice` (optional): Minimal jami narx
- `maxTotalPrice` (optional): Maksimal jami narx
- `search` (optional): Qidiruv
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Har sahifadagi buyurtmalar soni (default: 50)

**Response:**
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
      "_id": "ObjectId",
      "orderNumber": "00001",
      "items": [],
      "totalPrice": 300000,
      "status": "assigned_to_agent",
      "deliveryViloyat": {
        "_id": "ObjectId",
        "name": "Toshkent viloyati"
      },
      "assignedToAgent": "ObjectId",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent&page=1&limit=50" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

#### 7. Viloyat Buyurtma Tafsilotlari

Viloyat agent buyurtma tafsilotlarini ko'radi.

**Endpoint:** `GET /orders/:id`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "orderNumber": "00001",
    "items": [],
    "totalPrice": 300000,
    "status": "assigned_to_agent",
    "deliveryViloyat": {
      "_id": "ObjectId",
      "name": "Toshkent viloyati"
    },
    "assignedToAgent": {
      "_id": "ObjectId",
      "name": "MFY Agent",
      "phone": "+998901234567"
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

## Buyurtma Jarayoni

### MFY Agent Jarayoni

1. **Punkt buyurtmani MFY agentga topshiradi**
2. **MFY agent buyurtmalarni ko'radi** (`GET /orders`)
3. **MFY agent buyurtma tafsilotlarini ko'radi** (`GET /orders/:id`)
4. **MFY agent buyurtmani foydalanuvchiga yetkazadi**
5. **MFY agent buyurtmani tasdiqlaydi** (`POST /orders/:id/confirm`)
6. **Foydalanuvchi buyurtmani qabul qiladi**

### Tuman Agent Jarayoni

1. **Tuman agent o'z tumanidagi barcha buyurtmalarni ko'radi** (`GET /orders`)
2. **Tuman agent buyurtma tafsilotlarini ko'radi** (`GET /orders/:id`)
3. **Tuman agent buyurtmalarni kuzatadi va statistika oladi**

### Viloyat Agent Jarayoni

1. **Viloyat agent o'z viloyatidagi barcha buyurtmalarni ko'radi** (`GET /orders`)
2. **Viloyat agent buyurtma tafsilotlarini ko'radi** (`GET /orders/:id`)
3. **Viloyat agent buyurtmalarni kuzatadi va statistika oladi**

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
- `201` - Yaratildi
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
# 1. O'z hududidagi buyurtmalarni ko'rish
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent" \
  -H "Authorization: Bearer <mfy_agent_token>"

# 2. Buyurtma tafsilotlarini ko'rish
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <mfy_agent_token>"

# 3. Buyurtmani tasdiqlash
curl -X POST "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <mfy_agent_token>"
```

### Tuman Agent: To'liq misol

```bash
# 1. O'z hududidagi buyurtmalarni ko'rish
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent" \
  -H "Authorization: Bearer <tuman_agent_token>"

# 2. Buyurtma tafsilotlarini ko'rish
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <tuman_agent_token>"
```

### Viloyat Agent: To'liq misol

```bash
# 1. O'z hududidagi buyurtmalarni ko'rish
curl -X GET "http://localhost:5000/api/agent/orders?status=assigned_to_agent" \
  -H "Authorization: Bearer <viloyat_agent_token>"

# 2. Buyurtma tafsilotlarini ko'rish
curl -X GET "http://localhost:5000/api/agent/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <viloyat_agent_token>"
```

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0

