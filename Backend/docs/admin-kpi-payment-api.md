# Admin KPI Payment Distribution API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [To'lanmagan To'lovlar](#to'lanmagan-to'lovlar)
  - [To'lovni Tasdiqlash](#to'lovni-tasdiqlash)
  - [To'lovlar Statistika](#to'lovlar-statistika)
  - [To'langan To'lovlar](#to'langan-to'lovlar)
  - [Sinxronlashtirish](#sinxronlashtirish)
- [Workflow](#workflow)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin KPI Payment Distribution API moliya bo'limi uchun KPI bonuslarini tarqatish tizimini ta'minlaydi. Bu API orqali:

- To'lanmagan KPI to'lovlarini ko'rish (agentlar va punktlar bo'yicha)
- To'lovlarni "to'landi" deb belgilash
- To'lovlar statistikasini ko'rish
- To'langan to'lovlar tarixini ko'rish
- KPI transaksiyalardan to'lovlarni avtomatik yaratish

**Base Path:** `/api/admin-kpi-payments`

**Asosiy Ma'lumotlar:**
- Moliya bo'limi barcha pullarni to'liq yig'ib olgandan keyin, markazdan boshqarilgan holda tarqatadi
- Tizimda oldindan hisoblangan ma'lumotlarga asoslanib, viloyat, tuman, MFY agentlari va punktlar uchun KPI summalari aniqlanadi
- Moliya bo'limi ro'yxat bo'yicha pulni bosqichma-bosqich o'tkazadi
- Har bir o'tkazma amalga oshirilgach, tizimda mos ravishda "to'landi" deb belgilab qo'yiladi
- Kimga qancha pul berilgani va kimga hali to'lanmagani aniq ko'rinib turadi

---

## Base URL

```
http://localhost:5000/api/admin-kpi-payments
```

---

## Authentication

Barcha endpoint'lar Admin autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <admin_token>`

---

## Data Models

### KpiPaymentDistribution Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "recipientType": "string (enum: 'agent', 'punkt')",
  "recipient": "ObjectId (reference to Agent or Punkt)",
  "recipientModel": "string (enum: 'Agent', 'Punkt')",
  "agentType": "string (enum: 'viloyat', 'tuman', 'mfy', optional)",
  "amount": "number (required, min: 0)",
  "status": "string (enum: 'pending', 'paid', 'cancelled', default: 'pending')",
  "paidAt": "Date (optional)",
  "paidBy": "ObjectId (reference to Admin, optional)",
  "notes": "string (optional)",
  "kpiTransactions": ["ObjectId (reference to KpiBonusTransaction)"],
  "dueDate": "Date (optional)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Endpoints

### To'lanmagan To'lovlar

#### 1. Barcha To'lanmagan To'lovlar Ro'yxati

To'lanmagan barcha KPI to'lovlarini olish.

**Endpoint:** `GET /unpaid`

**Query Parameters:**
- `recipientType` (optional): Qabul qiluvchi turi - `agent` yoki `punkt`
- `agentType` (optional): Agent turi - `viloyat`, `tuman`, yoki `mfy`
- `viloyatId` (optional): Viloyat bo'yicha filter
- `tumanId` (optional): Tuman bo'yicha filter
- `mfyId` (optional): MFY bo'yicha filter
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 50): Sahifadagi elementlar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "totalAmount": 5000000,
  "totalUnpaidAmount": 15000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "recipientType": "agent",
      "recipient": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "MFY Agent 1",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Guliston MFY"
        }
      },
      "agentType": "mfy",
      "amount": 500000,
      "status": "pending",
      "kpiTransactions": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "order": "507f1f77bcf86cd799439017",
          "totalKpiAmount": 1000000
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-kpi-payments/unpaid?recipientType=agent&agentType=mfy&page=1&limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

---

#### 2. To'lanmagan To'lovlar (Guruhlangan)

To'lanmagan to'lovlarni qabul qiluvchilar bo'yicha guruhlab olish.

**Endpoint:** `GET /unpaid/grouped`

**Query Parameters:**
- `recipientType` (optional): Qabul qiluvchi turi - `agent` yoki `punkt`
- `agentType` (optional): Agent turi - `viloyat`, `tuman`, yoki `mfy`

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 25,
  "totalAmount": 15000000,
  "data": [
    {
      "recipient": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "MFY Agent 1",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Guliston MFY"
        }
      },
      "recipientType": "agent",
      "agentType": "mfy",
      "totalAmount": 500000,
      "paymentsCount": 5
    },
    {
      "recipient": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1",
        "phone": "+998901234568",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani"
        }
      },
      "recipientType": "punkt",
      "agentType": null,
      "totalAmount": 300000,
      "paymentsCount": 3
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-kpi-payments/unpaid/grouped?recipientType=agent" \
  -H "Authorization: Bearer <admin_token>"
```

---

### To'lovni Tasdiqlash

#### 3. To'lovlarni "To'landi" Deb Belgilash

Bir yoki bir nechta to'lovlarni "to'landi" deb belgilash.

**Endpoint:** `POST /mark-as-paid`

**Request Body:**
```json
{
  "paymentIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "notes": "Plastik karta orqali to'landi"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "3 ta to'lov muvaffaqiyatli to'landi deb belgilandi",
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "recipientType": "agent",
      "recipient": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "MFY Agent 1",
        "phone": "+998901234567"
      },
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-15T12:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439019",
        "name": "Admin User",
        "phone": "+998901234569"
      },
      "notes": "Plastik karta orqali to'landi"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request** - To'lov ID lari kiritilmagan yoki ba'zi to'lovlar topilmadi/allaqachon to'langan
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin-kpi-payments/mark-as-paid \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "notes": "Plastik karta orqali to'landi"
  }'
```

**Important Notes:**
- To'lovlar "to'landi" deb belgilanganda, tegishli `KpiBonusTransaction` larda ham `isPaid: true` va `paidAt` yangilanadi
- Bir nechta to'lovlarni bir vaqtning o'zida belgilash mumkin
- Faqat `status: 'pending'` bo'lgan to'lovlarni belgilash mumkin

---

### To'lovlar Statistika

#### 4. To'lovlar Statistikasi

To'lovlar statistikasini olish.

**Endpoint:** `GET /statistics`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "unpaid": {
      "totalAmount": 15000000,
      "count": 150
    },
    "paid": {
      "totalAmount": 50000000,
      "count": 500
    },
    "byRecipientType": {
      "agent": {
        "totalAmount": 10000000,
        "count": 100
      },
      "punkt": {
        "totalAmount": 5000000,
        "count": 50
      }
    },
    "byAgentType": {
      "viloyat": {
        "totalAmount": 2000000,
        "count": 10
      },
      "tuman": {
        "totalAmount": 3000000,
        "count": 20
      },
      "mfy": {
        "totalAmount": 5000000,
        "count": 70
      }
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-kpi-payments/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### To'langan To'lovlar

#### 5. To'langan To'lovlar Ro'yxati

To'langan to'lovlar ro'yxatini olish.

**Endpoint:** `GET /paid`

**Query Parameters:**
- `recipientType` (optional): Qabul qiluvchi turi - `agent` yoki `punkt`
- `agentType` (optional): Agent turi - `viloyat`, `tuman`, yoki `mfy`
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 50): Sahifadagi elementlar soni

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 500,
  "page": 1,
  "limit": 50,
  "totalPages": 10,
  "totalAmount": 5000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "recipientType": "agent",
      "recipient": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "MFY Agent 1",
        "phone": "+998901234567"
      },
      "agentType": "mfy",
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-15T12:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439019",
        "name": "Admin User",
        "phone": "+998901234569"
      },
      "notes": "Plastik karta orqali to'landi",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-kpi-payments/paid?recipientType=agent&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

---

### Sinxronlashtirish

#### 6. KPI To'lovlarini Sinxronlashtirish

KPI transaksiyalardan to'lovlarni avtomatik yaratish/yangilash. Bu endpoint `KpiBonusTransaction` lardan `KpiPaymentDistribution` larni yaratadi yoki yangilaydi.

**Endpoint:** `POST /sync`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "KPI to'lovlari muvaffaqiyatli sinxronlashtirildi",
  "created": 50,
  "updated": 10,
  "data": {
    "created": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012"
    ],
    "updated": [
      "507f1f77bcf86cd799439013"
    ]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin-kpi-payments/sync \
  -H "Authorization: Bearer <admin_token>"
```

**Important Notes:**
- Bu endpoint `isPaid: false` bo'lgan barcha `KpiBonusTransaction` larni ko'rib chiqadi
- Har bir transaksiya uchun quyidagilar yaratiladi/yangilanadi:
  - Punkt uchun to'lov (agar `amounts.punkt > 0`)
  - Viloyat agent uchun to'lov (agar `amounts.viloyatAgent > 0`)
  - Tuman agent uchun to'lov (agar `amounts.tumanAgent > 0`)
  - MFY agent uchun to'lov (agar `amounts.mfyAgent > 0`)
  - FromPunkt uchun to'lov (agar `fromPunktAmount > 0`)
  - ToPunkt uchun to'lov (agar `toPunktAmount > 0`)
- Agar to'lov allaqachon mavjud bo'lsa, faqat summa yangilanadi

---

## Workflow

### To'lovlar Tarqatish Jarayoni

1. **KPI Transaksiyalarni Yaratish:**
   - Buyurtma `confirmed_by_customer` holatiga o'tganda, `KpiBonusTransaction` lar avtomatik yaratiladi
   - Har bir transaksiya uchun punkt, agentlar va moliya bo'limiga summalar ajratiladi

2. **To'lovlarni Sinxronlashtirish:**
   - Admin `/sync` endpoint'ini chaqiradi
   - Tizim barcha `isPaid: false` bo'lgan transaksiyalardan to'lovlarni yaratadi

3. **To'lanmagan To'lovlarni Ko'rish:**
   - Admin `/unpaid` yoki `/unpaid/grouped` endpoint'larini chaqiradi
   - Kimga qancha to'lov qilinishi kerakligini ko'radi

4. **To'lovlarni To'lash:**
   - Admin to'lovlarni amalga oshiradi (plastik karta, naqd pul, boshqa usullar)
   - Admin `/mark-as-paid` endpoint'ini chaqirib, to'lovlarni "to'landi" deb belgilaydi

5. **To'lovlar Tarixini Ko'rish:**
   - Admin `/paid` endpoint'ini chaqirib, to'langan to'lovlar tarixini ko'radi

6. **Statistikani Ko'rish:**
   - Admin `/statistics` endpoint'ini chaqirib, umumiy statistikani ko'radi

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
- `404` - Topilmadi
- `500` - Server xatosi

---

## Examples

### To'liq Misol: To'lovlar Tarqatish

```javascript
// 1. To'lovlarni sinxronlashtirish
async function syncPayments(token) {
  const response = await fetch('http://localhost:5000/api/admin-kpi-payments/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('Sinxronlashtirildi:', data);
}

// 2. To'lanmagan to'lovlarni ko'rish
async function getUnpaidPayments(token) {
  const response = await fetch('http://localhost:5000/api/admin-kpi-payments/unpaid/grouped', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('To\'lanmagan to\'lovlar:', data);
}

// 3. To'lovlarni to'landi deb belgilash
async function markAsPaid(paymentIds, notes, token) {
  const response = await fetch('http://localhost:5000/api/admin-kpi-payments/mark-as-paid', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIds,
      notes,
    }),
  });
  const data = await response.json();
  console.log('To\'lovlar to\'landi:', data);
}

// 4. Statistikani ko'rish
async function getStatistics(token) {
  const response = await fetch('http://localhost:5000/api/admin-kpi-payments/statistics', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log('Statistika:', data);
}

// Foydalanish
const token = 'your_admin_token';

// Avval sinxronlashtirish
await syncPayments(token);

// To'lanmagan to'lovlarni ko'rish
const unpaid = await getUnpaidPayments(token);

// To'lovlarni to'lash (masalan, birinchi 5 tasini)
const paymentIds = unpaid.data.slice(0, 5).map(p => p._id);
await markAsPaid(paymentIds, 'Plastik karta orqali to\'landi', token);

// Statistikani ko'rish
await getStatistics(token);
```

### React Komponenti Misoli

```jsx
import React, { useState, useEffect } from 'react';

function KpiPaymentDistribution({ token }) {
  const [unpaidPayments, setUnpaidPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnpaidPayments();
    fetchStatistics();
  }, []);

  const fetchUnpaidPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin-kpi-payments/unpaid/grouped', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUnpaidPayments(data.data);
      }
    } catch (error) {
      console.error('Xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin-kpi-payments/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Xatolik:', error);
    }
  };

  const markAsPaid = async (recipientId, recipientType, agentType, notes) => {
    try {
      // First, get individual payments for this recipient
      const unpaidResponse = await fetch(
        `http://localhost:5000/api/admin-kpi-payments/unpaid?recipientType=${recipientType}${agentType ? `&agentType=${agentType}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const unpaidData = await unpaidResponse.json();
      
      if (!unpaidData.success) {
        alert('Xatolik: To\'lovlarni olishda muammo');
        return;
      }

      // Filter payments for this specific recipient
      const recipientPayments = unpaidData.data.filter(
        (payment) => payment.recipient?._id?.toString() === recipientId.toString()
      );

      if (recipientPayments.length === 0) {
        alert('Bu qabul qiluvchi uchun to\'lanmagan to\'lovlar topilmadi');
        return;
      }

      // Get payment IDs
      const paymentIds = recipientPayments.map((p) => p._id);

      // Mark as paid
      const response = await fetch('http://localhost:5000/api/admin-kpi-payments/mark-as-paid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds,
          notes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`${recipientPayments.length} ta to'lov muvaffaqiyatli to'landi deb belgilandi`);
        fetchUnpaidPayments();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Xatolik:', error);
    }
  };

  if (loading) return <div>Yuklanmoqda...</div>;

  return (
    <div>
      <h2>KPI To'lovlar Tarqatish</h2>

      {statistics && (
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Statistika</h3>
          <p>To'lanmagan: {statistics.unpaid.totalAmount.toLocaleString()} so'm ({statistics.unpaid.count} ta)</p>
          <p>To'langan: {statistics.paid.totalAmount.toLocaleString()} so'm ({statistics.paid.count} ta)</p>
        </div>
      )}

      <h3>To'lanmagan To'lovlar</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Qabul qiluvchi</th>
            <th>Turi</th>
            <th>Summa</th>
            <th>To'lovlar soni</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {unpaidPayments.map((payment) => (
            <tr key={payment.recipient?._id}>
              <td>{payment.recipient?.name}</td>
              <td>{payment.recipientType} {payment.agentType && `(${payment.agentType})`}</td>
              <td>{payment.totalAmount.toLocaleString()} so'm</td>
              <td>{payment.paymentsCount}</td>
              <td>
                <button 
                  onClick={() => markAsPaid(
                    payment.recipient?._id, 
                    payment.recipientType, 
                    payment.agentType, 
                    'To\'landi'
                  )}
                >
                  To'landi deb belgilash
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default KpiPaymentDistribution;
```

---

## Qo'shimcha Ma'lumotlar

### To'lovlar Yaratish Logikasi

1. **Punkt To'lovlari:**
   - `amounts.punkt` > 0 bo'lsa, punkt uchun to'lov yaratiladi
   - `fromPunktAmount` > 0 bo'lsa, fromPunkt uchun alohida to'lov yaratiladi
   - `toPunktAmount` > 0 bo'lsa, toPunkt uchun alohida to'lov yaratiladi

2. **Agent To'lovlari:**
   - `amounts.viloyatAgent` > 0 bo'lsa, viloyat agent uchun to'lov yaratiladi
   - `amounts.tumanAgent` > 0 bo'lsa, tuman agent uchun to'lov yaratiladi
   - `amounts.mfyAgent` > 0 bo'lsa, MFY agent uchun to'lov yaratiladi

3. **To'lovlar Birlashtirish:**
   - Agar bir xil qabul qiluvchi uchun bir nechta transaksiya bo'lsa, ular birlashtiriladi
   - Har bir qabul qiluvchi uchun bitta `KpiPaymentDistribution` yaratiladi

### Xavfsizlik

- Barcha endpoint'lar admin autentifikatsiyasini talab qiladi
- Faqat adminlar to'lovlarni belgilashlari mumkin
- Barcha amallar audit trail bilan kuzatiladi (`paidBy`, `paidAt`)

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0

