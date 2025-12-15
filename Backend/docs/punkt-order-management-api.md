# Punkt Order Management API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [O'z Hududidagi Contragentlar](#1-oz-hududidagi-contragentlar)
  - [Buyurtmalarni Ko'rish](#2-buyurtmalarni-korish)
  - [Buyurtma Tafsilotlari](#3-buyurtma-tafsilotlari)
  - [Buyurtmadagi Contragentlar](#4-buyurtmadagi-contragentlar)
  - [Buyurtmani Tasdiqlash](#5-buyurtmani-tasdiqlash)
  - [Contragentga So'rov Yuborish](#6-contragentga-sorov-yuborish)
  - [Boshqa Punktga So'rov Yuborish](#7-boshqa-punktga-sorov-yuborish)
  - [Punktdan Qabul Qilish](#8-punktdan-qabul-qilish)
  - [Contragentdan Qabul Qilish](#9-contragentdan-qabul-qilish)
  - [Agentga Topshirish](#10-agentga-topshirish)
- [Buyurtma Jarayoni](#buyurtma-jarayoni)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Punkt Order Management API punktlar uchun buyurtmalarni boshqarish funksiyalarini ta'minlaydi. Punkt o'z hududidagi contragentlarni ko'radi, buyurtmalarni tasdiqlaydi, contragentlarga so'rov yuboradi, boshqa punktlardan buyurtmalarni qabul qiladi va agentlarga topshiradi.

**Base Path:** `/api/punkt`

**Eslatma:** Avtorouting o'chirilgan. Barcha ishlar ketma-ket va manual ravishda amalga oshiriladi.

---

## Base URL

```
http://localhost:5000/api/punkt
```

---

## Authentication

Barcha endpoint'lar Punkt autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <punkt_token>`

---

## Data Models

### Contragent
```json
{
  "_id": "ObjectId",
  "name": "Contragent nomi",
  "inn": "123456789",
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
  "status": "active"
}
```

### Order
```json
{
  "_id": "ObjectId",
  "orderNumber": "00001",
  "items": [
    {
      "product": {
        "_id": "ObjectId",
        "name": "Maxsulot nomi",
        "contragent": {
          "_id": "ObjectId",
          "name": "Contragent nomi"
        }
      },
      "quantity": 2,
      "price": 150000
    }
  ],
  "totalPrice": 300000,
  "status": "pending|confirmed_by_punkt|requested_to_contragent|accepted_by_contragent|delivered_to_punkt|assigned_to_agent|confirmed_by_agent|confirmed_by_customer",
  "currentPunkt": "ObjectId",
  "contragentRequests": [
    {
      "contragentId": "ObjectId",
      "status": "pending|accepted|rejected|delivered_to_punkt",
      "requestedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "punktToPunktRequests": [
    {
      "fromPunktId": "ObjectId",
      "toPunktId": "ObjectId",
      "status": "pending|accepted|rejected|delivered",
      "requestedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## Endpoints

### 1. O'z Hududidagi Contragentlar

Punkt o'z hududidagi (o'z viloyati va tumanidagi) contragentlarni ko'radi.

**Endpoint:** `GET /data/contragents`

**Query Parameters:**
- `status` (optional): Status (`active`, `inactive`). Default: `active`
- `page` (optional): Sahifa raqami (default: 1)
- `limit` (optional): Har sahifadagi elementlar soni (default: 50)

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
      "name": "Contragent nomi",
      "inn": "123456789",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "ObjectId",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TK"
      },
      "tuman": {
        "_id": "ObjectId",
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "CH"
      },
      "mfy": {
        "_id": "ObjectId",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YU"
      },
      "status": "active"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/punkt/data/contragents?status=active&page=1&limit=50" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 2. Buyurtmalarni Ko'rish

Punkt o'z hududidagi buyurtmalarni ko'radi.

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
      "status": "pending",
      "currentPunkt": "ObjectId",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/punkt/orders?status=pending&page=1&limit=50" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 3. Buyurtma Tafsilotlari

Punkt buyurtma tafsilotlarini ko'radi.

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
    "status": "pending",
    "currentPunkt": {
      "_id": "ObjectId",
      "name": "Punkt nomi"
    },
    "contragentRequests": [],
    "punktToPunktRequests": []
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 4. Buyurtmadagi Contragentlar

Buyurtmadagi maxsulotlarning contragent ID'larini olish.

**Endpoint:** `GET /orders/:id/contragents`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ObjectId",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "ObjectId",
        "name": "Contragent nomi",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {},
        "tuman": {},
        "mfy": {},
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "ObjectId",
            "name": "Maxsulot nomi",
            "quantity": 2,
            "price": 150000
          }
        ],
        "hasRequest": false,
        "requestStatus": null
      }
    ]
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/contragents" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 5. Buyurtmani Tasdiqlash

Punkt buyurtmani tasdiqlaydi.

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
    "status": "confirmed_by_punkt"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 6. Contragentga So'rov Yuborish

Punkt o'z hududidagi contragentga buyurtma haqida so'rov yuboradi.

**Endpoint:** `POST /orders/:id/request-to-contragent`

**URL Parameters:**
- `id`: Buyurtma ID

**Request Body:**
```json
{
  "contragentId": "ObjectId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "ObjectId",
    "orderNumber": "00001",
    "contragent": {
      "_id": "ObjectId",
      "name": "Contragent nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "contragentRequests": []
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/request-to-contragent" \
  -H "Authorization: Bearer <punkt_token>" \
  -H "Content-Type: application/json" \
  -d '{"contragentId": "65a1b2c3d4e5f6g7h8i9j0k2"}'
```

---

### 7. Boshqa Punktga So'rov Yuborish

Punkt boshqa tuman punktiga buyurtma haqida so'rov yuboradi.

**Endpoint:** `POST /orders/:id/request-to-punkt`

**URL Parameters:**
- `id`: Buyurtma ID

**Request Body:**
```json
{
  "toPunktId": "ObjectId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "ObjectId",
    "orderNumber": "00001",
    "punktToPunktRequests": []
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/request-to-punkt" \
  -H "Authorization: Bearer <punkt_token>" \
  -H "Content-Type: application/json" \
  -d '{"toPunktId": "65a1b2c3d4e5f6g7h8i9j0k2"}'
```

---

### 8. Punktdan Qabul Qilish

Punkt boshqa punktdan buyurtmani qabul qiladi.

**Endpoint:** `POST /orders/:id/receive-from-punkt`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma punktdan muvaffaqiyatli qabul qilindi",
  "data": {}
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/receive-from-punkt" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 9. Contragentdan Qabul Qilish

Punkt contragentdan buyurtmani qabul qiladi.

**Endpoint:** `POST /orders/:id/receive-from-contragent`

**URL Parameters:**
- `id`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma contragentdan muvaffaqiyatli qabul qilindi",
  "data": {}
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/receive-from-contragent" \
  -H "Authorization: Bearer <punkt_token>"
```

---

### 10. Agentga Topshirish

Punkt buyurtmani MFY agentga topshiradi.

**Endpoint:** `POST /orders/:id/assign-to-agent`

**URL Parameters:**
- `id`: Buyurtma ID

**Request Body:**
```json
{
  "agentId": "ObjectId"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma agentga muvaffaqiyatli yuborildi",
  "data": {
    "orderId": "ObjectId",
    "orderNumber": "00001",
    "assignedToAgent": {
      "_id": "ObjectId",
      "name": "Agent nomi",
      "phone": "+998901234567"
    }
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/assign-to-agent" \
  -H "Authorization: Bearer <punkt_token>" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "65a1b2c3d4e5f6g7h8i9j0k2"}'
```

---

## Buyurtma Jarayoni

### Senaryo 1: O'z Tumanidagi Contragentda Maxsulotlar Mavjud

1. **Foydalanuvchi buyurtma beradi**
2. **Punkt buyurtmani ko'radi** (`GET /orders`)
3. **Punkt buyurtmadagi contragentlarni ko'radi** (`GET /orders/:id/contragents`)
4. **Punkt buyurtmani tasdiqlaydi** (`POST /orders/:id/confirm`)
5. **Punkt contragentga so'rov yuboradi** (`POST /orders/:id/request-to-contragent`)
6. **Contragent so'rovni qabul qiladi va punktga topshiradi**
7. **Punkt contragentdan qabul qiladi** (`POST /orders/:id/receive-from-contragent`)
8. **Punkt MFY agentga topshiradi** (`POST /orders/:id/assign-to-agent`)
9. **MFY agent foydalanuvchiga topshiradi**
10. **Foydalanuvchi buyurtmani qabul qiladi**

### Senaryo 2: Boshqa Tuman Contragentlarida Maxsulotlar Mavjud

1. **Foydalanuvchi buyurtma beradi**
2. **Punkt buyurtmani ko'radi** (`GET /orders`)
3. **Punkt buyurtmadagi contragentlarni ko'radi** (`GET /orders/:id/contragents`)
4. **Punkt buyurtmani tasdiqlaydi** (`POST /orders/:id/confirm`)
5. **Punkt boshqa tuman punktiga so'rov yuboradi** (`POST /orders/:id/request-to-punkt`)
6. **Boshqa tuman punkti so'rovni qabul qiladi**
7. **Boshqa tuman punkti contragentga so'rov yuboradi**
8. **Contragent so'rovni qabul qiladi va punktga topshiradi**
9. **Boshqa tuman punkti contragentdan qabul qiladi**
10. **Boshqa tuman punkti asosiy punktga topshiradi**
11. **Asosiy punkt boshqa punktdan qabul qiladi** (`POST /orders/:id/receive-from-punkt`)
12. **Asosiy punkt MFY agentga topshiradi** (`POST /orders/:id/assign-to-agent`)
13. **MFY agent foydalanuvchiga topshiradi**
14. **Foydalanuvchi buyurtmani qabul qiladi**

### Senaryo 3: Aralash (Bir Qismi O'z Tumanida, Bir Qismi Boshqa Tumanda)

1. **Foydalanuvchi buyurtma beradi**
2. **Punkt buyurtmani ko'radi** (`GET /orders`)
3. **Punkt buyurtmadagi contragentlarni ko'radi** (`GET /orders/:id/contragents`)
4. **Punkt buyurtmani tasdiqlaydi** (`POST /orders/:id/confirm`)
5. **Punkt o'z tumanidagi contragentga so'rov yuboradi** (`POST /orders/:id/request-to-contragent`)
6. **Punkt boshqa tuman punktiga so'rov yuboradi** (`POST /orders/:id/request-to-punkt`)
7. **Ikkala so'rov ham bajariladi (parallel)**
8. **Barcha maxsulotlar punktga yetib kelgach, punkt ularni jamlaydi**
9. **Punkt MFY agentga topshiradi** (`POST /orders/:id/assign-to-agent`)
10. **MFY agent foydalanuvchiga topshiradi**
11. **Foydalanuvchi buyurtmani qabul qiladi**

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
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

---

## Examples

### To'liq misol: Buyurtmani boshqarish

```bash
# 1. O'z hududidagi contragentlarni ko'rish
curl -X GET "http://localhost:5000/api/punkt/data/contragents" \
  -H "Authorization: Bearer <punkt_token>"

# 2. Buyurtmalarni ko'rish
curl -X GET "http://localhost:5000/api/punkt/orders?status=pending" \
  -H "Authorization: Bearer <punkt_token>"

# 3. Buyurtma tafsilotlarini ko'rish
curl -X GET "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer <punkt_token>"

# 4. Buyurtmadagi contragentlarni ko'rish
curl -X GET "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/contragents" \
  -H "Authorization: Bearer <punkt_token>"

# 5. Buyurtmani tasdiqlash
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/confirm" \
  -H "Authorization: Bearer <punkt_token>"

# 6. Contragentga so'rov yuborish
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/request-to-contragent" \
  -H "Authorization: Bearer <punkt_token>" \
  -H "Content-Type: application/json" \
  -d '{"contragentId": "65a1b2c3d4e5f6g7h8i9j0k2"}'

# 7. Contragentdan qabul qilish
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/receive-from-contragent" \
  -H "Authorization: Bearer <punkt_token>"

# 8. Agentga topshirish
curl -X POST "http://localhost:5000/api/punkt/orders/65a1b2c3d4e5f6g7h8i9j0k1/assign-to-agent" \
  -H "Authorization: Bearer <punkt_token>" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "65a1b2c3d4e5f6g7h8i9j0k3"}'
```

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0


