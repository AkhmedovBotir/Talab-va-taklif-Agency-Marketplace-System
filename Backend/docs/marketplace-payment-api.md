# Marketplace Payment API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [To'lov Qilish](#1-tolov-qilish)
  - [To'lov Holatini Ko'rish](#2-tolov-holatini-korish)
- [To'lov Jarayoni](#tolov-jarayoni)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Payment API foydalanuvchilarga buyurtmalar uchun to'lov qilish va to'lov holatini kuzatish imkoniyatini beradi. To'lov jarayoni quyidagicha ishlaydi:

1. Foydalanuvchi buyurtmani qabul qiladi (`status: 'confirmed_by_customer'`)
2. Foydalanuvchi to'lov qiladi
3. To'lov transaksiyasi yaratiladi va MFY agent tomonidan qabul qilinadi
4. To'lov moliya bo'limiga yetib boradi

**Base Path:** `/api/payment`

**Eslatma:** To'lov qilishdan oldin buyurtma mijoz tomonidan tasdiqlangan bo'lishi kerak (`status: 'confirmed_by_customer'`).

---

## Base URL

```
http://localhost:5000/api/payment
```

---

## Authentication

Barcha endpoint'lar Marketplace User autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <marketplace_user_token>`

**Token Olish:** Marketplace Authentication API orqali login qilinganidan keyin token olinadi.

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

### Order (Qisqacha)
```json
{
  "_id": "ObjectId",
  "orderNumber": "00001",
  "totalPrice": 150000,
  "status": "confirmed_by_customer",
  "paymentStatus": "paid",
  "paymentMethod": "cash|card"
}
```

---

## Endpoints

### 1. To'lov Qilish

Buyurtma uchun to'lov qilish. To'lov qilishdan oldin buyurtma mijoz tomonidan tasdiqlangan bo'lishi kerak.

**Endpoint:** `POST /orders/:orderId/pay`

**URL Parameters:**
- `orderId`: Buyurtma ID

**Request:** Body kerak emas. To'lov summasi va usuli buyurtmadan olinadi.

**Response:**
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli amalga oshirildi",
  "transaction": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "orderId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "amount": 150000,
    "paymentMethod": "cash",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - Buyurtma mijoz tomonidan tasdiqlanmagan:**
```json
{
  "success": false,
  "message": "Buyurtma mijoz tomonidan tasdiqlanmagan"
}
```

**400 - To'lov allaqachon qilingan:**
```json
{
  "success": false,
  "message": "Bu buyurtma uchun to'lov allaqachon qilingan",
  "transaction": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "collected",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**403 - Buyurtma sizga tegishli emas:**
```json
{
  "success": false,
  "message": "Bu buyurtma sizga tegishli emas"
}
```

**404 - Buyurtma topilmadi:**
```json
{
  "success": false,
  "message": "Buyurtma topilmadi"
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/payment/orders/65a1b2c3d4e5f6g7h8i9j0k2/pay" \
  -H "Authorization: Bearer <marketplace_user_token>"
```

---

### 2. To'lov Holatini Ko'rish

Buyurtma uchun to'lov holatini va transaksiya ma'lumotlarini ko'rish.

**Endpoint:** `GET /orders/:orderId/payment-status`

**URL Parameters:**
- `orderId`: Buyurtma ID

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "order": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "orderNumber": "00001",
      "totalPrice": 150000,
      "status": "confirmed_by_customer"
    },
    "amount": 150000,
    "paymentMethod": "cash",
    "status": "collected",
    "currentHolder": "mfy_agent",
    "transactionPath": [
      {
        "holder": "user",
        "holderId": "65a1b2c3d4e5f6g7h8i9j0k3",
        "action": "paid",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "note": "Foydalanuvchi tomonidan to'lov qilindi"
      },
      {
        "holder": "mfy_agent",
        "holderId": "65a1b2c3d4e5f6g7h8i9j0k4",
        "action": "collected",
        "timestamp": "2024-01-15T11:00:00.000Z",
        "note": "MFY agent tomonidan qabul qilindi"
      }
    ],
    "collectedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "name": "MFY Agent",
      "phone": "+998901234567"
    },
    "collectedAt": "2024-01-15T11:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Status Values:**
- `pending` - To'lov kutilmoqda (foydalanuvchi to'lagan, lekin agent qabul qilmagan)
- `collected` - To'lov qabul qilingan (MFY agent tomonidan)
- `submitted` - To'lov topshirilgan (keyingi darajaga)
- `received` - To'lov qabul qilingan (keyingi darajada)
- `confirmed` - To'lov tasdiqlangan (moliya bo'limida)
- `rejected` - To'lov rad etilgan

**Current Holder Values:**
- `user` - Foydalanuvchida
- `mfy_agent` - MFY agentda
- `district_agent` - Tuman agentda
- `province_agent` - Viloyat agentda
- `finance` - Moliya bo'limida

**Error Responses:**

**403 - To'lov sizga tegishli emas:**
```json
{
  "success": false,
  "message": "Bu to'lov sizga tegishli emas"
}
```

**404 - To'lov transaksiyasi topilmadi:**
```json
{
  "success": false,
  "message": "To'lov transaksiyasi topilmadi"
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/payment/orders/65a1b2c3d4e5f6g7h8i9j0k2/payment-status" \
  -H "Authorization: Bearer <marketplace_user_token>"
```

---

## To'lov Jarayoni

To'lov jarayoni quyidagi bosqichlardan iborat:

### 1. Foydalanuvchi To'lov Qiladi
- Foydalanuvchi buyurtmani qabul qiladi (`status: 'confirmed_by_customer'`)
- Foydalanuvchi to'lov qiladi (`POST /orders/:orderId/pay`)
- To'lov transaksiyasi yaratiladi (`status: 'pending'`)
- Buyurtma to'lov holati yangilanadi (`paymentStatus: 'paid'`)

### 2. MFY Agent To'lovni Qabul Qiladi
- MFY agent to'lovni qabul qiladi
- Transaksiya statusi `collected` ga o'zgaradi
- `currentHolder` `mfy_agent` ga o'zgaradi

### 3. Tuman Agentga Topshiriladi
- MFY agent to'lovlarni tuman agentga topshiradi
- Transaksiya statusi `submitted` ga o'zgaradi
- `currentHolder` `district_agent` ga o'zgaradi

### 4. Viloyat Agentga Topshiriladi
- Tuman agent to'lovlarni viloyat agentga topshiradi
- Transaksiya statusi `submitted` ga o'zgaradi
- `currentHolder` `province_agent` ga o'zgaradi

### 5. Moliya Bo'limiga Topshiriladi
- Viloyat agent to'lovlarni moliya bo'limiga topshiradi
- Transaksiya statusi `submitted` ga o'zgaradi
- `currentHolder` `finance` ga o'zgaradi

### 6. Moliya Bo'limi Tasdiqlaydi
- Moliya bo'limi to'lovni tasdiqlaydi
- Transaksiya statusi `confirmed` ga o'zgaradi

**Transaction Path:** Har bir bosqichda `transactionPath` array'iga yangi yozuv qo'shiladi, bu to'lovning to'liq tarixini ko'rsatadi.

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
- `201` - Yaratildi (to'lov qilish)
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q (buyurtma/to'lov sizga tegishli emas)
- `404` - Topilmadi
- `500` - Server xatosi

---

## Examples

### To'liq misol: To'lov qilish va holatini kuzatish

```bash
# 1. To'lov qilish
curl -X POST "http://localhost:5000/api/payment/orders/65a1b2c3d4e5f6g7h8i9j0k2/pay" \
  -H "Authorization: Bearer <marketplace_user_token>"

# Response:
# {
#   "success": true,
#   "message": "To'lov muvaffaqiyatli amalga oshirildi",
#   "transaction": {
#     "id": "65a1b2c3d4e5f6g7h8i9j0k1",
#     "orderId": "65a1b2c3d4e5f6g7h8i9j0k2",
#     "amount": 150000,
#     "paymentMethod": "cash",
#     "status": "pending",
#     "createdAt": "2024-01-15T10:30:00.000Z"
#   }
# }

# 2. To'lov holatini ko'rish
curl -X GET "http://localhost:5000/api/payment/orders/65a1b2c3d4e5f6g7h8i9j0k2/payment-status" \
  -H "Authorization: Bearer <marketplace_user_token>"

# Response:
# {
#   "success": true,
#   "transaction": {
#     "id": "65a1b2c3d4e5f6g7h8i9j0k1",
#     "order": {
#       "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
#       "orderNumber": "00001",
#       "totalPrice": 150000,
#       "status": "confirmed_by_customer"
#     },
#     "amount": 150000,
#     "paymentMethod": "cash",
#     "status": "collected",
#     "currentHolder": "mfy_agent",
#     "transactionPath": [
#       {
#         "holder": "user",
#         "holderId": "65a1b2c3d4e5f6g7h8i9j0k3",
#         "action": "paid",
#         "timestamp": "2024-01-15T10:30:00.000Z",
#         "note": "Foydalanuvchi tomonidan to'lov qilindi"
#       },
#       {
#         "holder": "mfy_agent",
#         "holderId": "65a1b2c3d4e5f6g7h8i9j0k4",
#         "action": "collected",
#         "timestamp": "2024-01-15T11:00:00.000Z",
#         "note": "MFY agent tomonidan qabul qilindi"
#       }
#     ],
#     "collectedBy": {
#       "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
#       "name": "MFY Agent",
#       "phone": "+998901234567"
#     },
#     "collectedAt": "2024-01-15T11:00:00.000Z",
#     "createdAt": "2024-01-15T10:30:00.000Z",
#     "updatedAt": "2024-01-15T11:00:00.000Z"
#   }
# }
```

### JavaScript/TypeScript misol

```javascript
// To'lov qilish
async function payOrder(orderId, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/payment/orders/${orderId}/pay`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('To\'lov muvaffaqiyatli:', data.transaction);
      return data.transaction;
    } else {
      console.error('To\'lov xatosi:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Xatolik:', error);
    throw error;
  }
}

// To'lov holatini ko'rish
async function getPaymentStatus(orderId, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/payment/orders/${orderId}/payment-status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('To\'lov holati:', data.transaction);
      return data.transaction;
    } else {
      console.error('Xatolik:', data.message);
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Xatolik:', error);
    throw error;
  }
}

// Foydalanish
const orderId = '65a1b2c3d4e5f6g7h8i9j0k2';
const token = 'your_marketplace_user_token';

// To'lov qilish
payOrder(orderId, token)
  .then((transaction) => {
    console.log('To\'lov ID:', transaction.id);
    
    // To'lov holatini kuzatish
    setInterval(() => {
      getPaymentStatus(orderId, token)
        .then((status) => {
          console.log('Joriy holat:', status.status);
          console.log('Hozirgi egasi:', status.currentHolder);
        });
    }, 5000); // Har 5 soniyada tekshirish
  })
  .catch((error) => {
    console.error('Xatolik:', error);
  });
```

### React misol

```jsx
import React, { useState, useEffect } from 'react';

function PaymentComponent({ orderId, token }) {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // To'lov qilish
  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/payment/orders/${orderId}/pay`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPaymentStatus(data.transaction);
        // To'lov holatini kuzatishni boshlash
        startPolling();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('To\'lov qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // To'lov holatini olish
  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/payment/orders/${orderId}/payment-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPaymentStatus(data.transaction);
      }
    } catch (err) {
      console.error('To\'lov holatini olishda xatolik:', err);
    }
  };

  // To'lov holatini kuzatish
  const startPolling = () => {
    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 5000); // Har 5 soniyada tekshirish

    // Agar to'lov tasdiqlangan bo'lsa, kuzatishni to'xtatish
    if (paymentStatus?.status === 'confirmed') {
      clearInterval(interval);
    }
  };

  useEffect(() => {
    // Komponent yuklanganda to'lov holatini olish
    fetchPaymentStatus();
  }, [orderId]);

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Kutilmoqda',
      collected: 'Qabul qilindi',
      submitted: 'Topshirildi',
      received: 'Qabul qilindi',
      confirmed: 'Tasdiqlandi',
      rejected: 'Rad etildi',
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      {!paymentStatus ? (
        <button onClick={handlePayment} disabled={loading}>
          {loading ? 'To\'lov qilinmoqda...' : 'To\'lov qilish'}
        </button>
      ) : (
        <div>
          <h3>To'lov Holati</h3>
          <p>Status: {getStatusText(paymentStatus.status)}</p>
          <p>Summa: {paymentStatus.amount.toLocaleString()} so'm</p>
          <p>To'lov usuli: {paymentStatus.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}</p>
          <p>Hozirgi egasi: {paymentStatus.currentHolder}</p>
          
          {paymentStatus.transactionPath && (
            <div>
              <h4>To'lov Tarixi</h4>
              <ul>
                {paymentStatus.transactionPath.map((step, index) => (
                  <li key={index}>
                    {step.note} - {new Date(step.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

export default PaymentComponent;
```

---

## Qo'shimcha Ma'lumotlar

### To'lov Usullari

- `cash` - Naqd pul
- `card` - Bank kartasi

### To'lov Talablari

1. Buyurtma mijoz tomonidan tasdiqlangan bo'lishi kerak (`status: 'confirmed_by_customer'`)
2. To'lov allaqachon qilinmagan bo'lishi kerak
3. Buyurtma foydalanuvchiga tegishli bo'lishi kerak

### Xavfsizlik

- Har bir foydalanuvchi faqat o'z buyurtmalari uchun to'lov qilishi mumkin
- To'lov holatini ko'rish uchun ham buyurtma foydalanuvchiga tegishli bo'lishi kerak
- Barcha endpoint'lar autentifikatsiya talab qiladi

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0

