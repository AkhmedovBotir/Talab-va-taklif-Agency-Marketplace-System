# Marketplace Featured Contragents API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get Featured Contragents](#1-get-featured-contragents)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Featured Contragents API foydalanuvchilarga adminlar tomonidan tanlab qo'yilgan kontragentlar ro'yxatini ko'rish imkoniyatini beradi. Bu ro'yxat odatda asosiy sahifada yoki alohida blokda ko'rsatiladi.

**Base Path:** `/api/marketplace`

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

Featured contragents ro'yxatini olish **authentication talab qilmaydi**. Barcha foydalanuvchilar (hatto guestlar) bu ma'lumotni ko'rishi mumkin.

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
- `name` – Kontragent nomi (kompaniya nomi)
- `logo` – Kontragent logotipi (URL yoki base64 string), bo'sh bo'lishi mumkin

---

## Endpoints

### 1. Get Featured Contragents

Adminlar tomonidan tanlab qo'yilgan kontragentlar ro'yxatini qaytaradi. Faqat qisqa ma'lumot: `id`, `name`, `logo`.

**Endpoint:** `GET /featured-contragents`

**Authentication:** Yo'q (public)

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
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Techno Market LLC",
      "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
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

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Tanlangan kontragentlarni olishda xatolik yuz berdi",
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

- `200` – Muvaffaqiyatli
- `500` – Server xatosi

---

## Examples

### cURL

```bash
curl -X GET http://localhost:5000/api/marketplace/featured-contragents
```

### JavaScript (fetch)

```javascript
async function getFeaturedContragents() {
  const response = await fetch('http://localhost:5000/api/marketplace/featured-contragents');
  const data = await response.json();
  return data;
}

getFeaturedContragents()
  .then(result => console.log('Featured contragents:', result))
  .catch(error => console.error('Error:', error));
```

---

**Last Updated:** 2024-01-15



