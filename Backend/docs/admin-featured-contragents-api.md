# Admin Featured Contragents API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get Featured Contragents](#1-get-featured-contragents)
  - [Update Featured Contragents List](#2-update-featured-contragents-list)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)
- [Typical Workflow](#typical-workflow)

---

## Overview

Admin Featured Contragents API adminlarga marketplace uchun ko'rsatiladigan tanlangan kontragentlar ro'yxatini boshqarish imkoniyatini beradi. Admin mavjud kontragentlardan bir nechtasini tanlab, ularni marketplace foydalanuvchilariga ko'rsatishi mumkin.

**Base Path:** `/api/admins`

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

Hamma endpointlar admin autentifikatsiyasini talab qiladi.

**Header:**

```text
Authorization: Bearer <admin_jwt_token>
```

**Token turi:** Admin Token  
**Token muddati:** Standart 7 kun (`JWT_EXPIRE` muhit o'zgaruvchisi orqali boshqariladi)

---

## Data Models

### FeaturedContragent (Short View)

```json
{
  "_id": "string (ObjectId)",
  "name": "string",
  "logo": "string | null"
}
```

**Maydonlar:**

- `id / _id` – Kontragent ID (MongoDB ObjectId)
- `name` – Kontragent nomi
- `logo` – Kontragent logotipi (URL yoki base64, bo'sh bo'lishi mumkin)

**Eslatma:** Ichki modelda `isFeaturedForMarketplace` degan `Boolean` maydon mavjud, lekin API javobida qaytarilmaydi.

---

## Endpoints

### 1. Get Featured Contragents

Hozirda marketplace uchun tanlab qo'yilgan kontragentlar ro'yxatini qaytaradi.

**Endpoint:** `GET /featured-contragents`

**Authentication:** Required (Admin)

**Query Parameters:** Yo'q

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "O'zbekiston Tijorat MChJ",
      "logo": "https://example.com/logos/uzbekistan-tijorat.png"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Samarqand Agro",
      "logo": null
    }
  ]
}
```

**Empty Response (200 OK):**

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

**Error Responses:**

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Tanlangan kontragentlarni olishda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

### 2. Update Featured Contragents List

Marketplace uchun tanlangan kontragentlar ro'yxatini yangilaydi. Yangi ro'yxat yuborilganda:

- Avvalgi barcha `isFeaturedForMarketplace=true` bo'lgan kontragentlar **false** qilinadi
- So'ngra body ichida kelgan ID'lar bo'yicha `isFeaturedForMarketplace=true` qilinadi

**Endpoint:** `PUT /featured-contragents`

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "contragentIds": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2",
    "65a1b2c3d4e5f6g7h8i9j0k3"
  ]
}
```

**Field Descriptions:**

| Field           | Type     | Required | Description                                      |
|----------------|----------|----------|--------------------------------------------------|
| `contragentIds`| array    | Yes      | Kontragent ID'lar ro'yxati (ObjectId string)     |

**Eslatma:**  
`contragentIds` bo'sh massiv bo'lishi ham mumkin. Bu holda barcha kontragentlar tanlovdan olib tashlanadi.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tanlangan kontragentlar muvaffaqiyatli yangilandi",
  "count": 2,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "O'zbekiston Tijorat MChJ",
      "logo": "https://example.com/logos/uzbekistan-tijorat.png"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Samarqand Agro",
      "logo": null
    }
  ]
}
```

**Error Responses:**

**400 Bad Request – Validation Error:**

```json
{
  "success": false,
  "message": "Validatsiya xatosi",
  "errors": [
    {
      "field": "contragentIds",
      "message": "contragentIds massiv bo'lishi kerak"
    }
  ]
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Tanlangan kontragentlarni yangilashda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

## Error Handling

Har bir xatolik quyidagi formatda qaytariladi:

```json
{
  "success": false,
  "message": "Uzbek tilidagi xato xabari",
  "error": "Batafsil xato xabari (ixtiyoriy, faqat dev uchun)"
}
```

**HTTP Status kodlari:**

- `200` – Success
- `400` – Bad Request (validatsiya xatosi yoki noto'g'ri body)
- `401` – Unauthorized (token yo'q yoki noto'g'ri)
- `500` – Internal Server Error

---

## Validation Rules

### `contragentIds`

- Majburiy (`required`)
- Array bo'lishi kerak
- Har bir element:
  - String bo'lishi kerak
  - Bo'sh bo'lmasligi kerak
- `min(0)` – bo'sh massivga ruxsat beriladi

Misollar:

- To'g'ri:

```json
{ "contragentIds": [] }
```

```json
{ "contragentIds": ["65a1b2c3d4e5f6g7h8i9j0k1"] }
```

- Noto'g'ri:

```json
{ "contragentIds": "65a1b2c3..." }
```

```json
{ "contragentIds": [123] }
```

---

## Examples

### 1. Get Featured Contragents (cURL)

```bash
curl -X GET http://localhost:5000/api/admins/featured-contragents \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 2. Update Featured List (cURL)

```bash
curl -X PUT http://localhost:5000/api/admins/featured-contragents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "contragentIds": [
      "65a1b2c3d4e5f6g7h8i9j0k1",
      "65a1b2c3d4e5f6g7h8i9j0k2"
    ]
  }'
```

### 3. JavaScript (fetch)

```javascript
// Get featured contragents
async function getFeaturedContragentsAdmin(token) {
  const response = await fetch('http://localhost:5000/api/admins/featured-contragents', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

// Update featured contragents
async function updateFeaturedContragentsAdmin(token, contragentIds) {
  const response = await fetch('http://localhost:5000/api/admins/featured-contragents', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contragentIds }),
  });
  return response.json();
}
```

---

## Typical Workflow

1. **Kontragentlar ro'yxatini ko'rish (mavjud API orqali)**  
   Admin biror sahifada barcha kontragentlarni ko'radi (masalan, `/api/contragents` API orqali).

2. **UI'da checkbox orqali tanlash**  
   Admin kerakli kontragentlarni tanlaydi (bir nechtasini).

3. **Tanlangan ID'larni yuborish**  
   Frontend `PUT /api/admins/featured-contragents` endpointiga `contragentIds` massivini yuboradi.

4. **Marketplace tomoni**  
   Marketplace frontend `GET /api/marketplace/featured-contragents` endpointidan foydalanib, faqat `id`, `name`, `logo` ma'lumotlarini olib, ularni ko'rsatadi.

---

**Last Updated:** 2024-01-15



