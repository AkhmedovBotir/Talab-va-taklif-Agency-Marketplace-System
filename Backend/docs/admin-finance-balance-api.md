# Admin Finance Balance API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Umumiy Balans](#1-umumiy-balans)
  - [Umumiy Tushgan Summa](#2-umumiy-tushgan-summa)
  - [Tarqatilgan Summa](#3-tarqatilgan-summa)
  - [Moliya Bo'limiga Ajratilgan Summa](#4-moliya-bolimiga-ajratilgan-summa)
  - [Umumiy Balans (Tushgan - Tarqatilgan)](#5-umumiy-balans-tushgan---tarqatilgan)
- [Balans Tushuntirishlari](#balans-tushuntirishlari)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin Finance Balance API moliya bo'limi uchun to'liq moliya balanslari va statistikalarni ta'minlaydi. Bu API orqali umumiy tushgan summa, tarqatilgan summa (KPI bonuslar), moliya bo'limiga ajratilgan summa va umumiy balanslarni ko'rish mumkin.

**Base Path:** `/api/admin-finance/balance`

**Asosiy Ma'lumotlar:**
- **Umumiy tushgan summa:** Moliya bo'limiga tasdiqlangan to'lovlar
- **Tarqatilgan summa:** KPI bonuslar (punkt, agentlar)
- **Moliya bo'limiga ajratilgan summa:** KPI bonuslardan moliya bo'limiga ajratilgan qism
- **Umumiy balans:** Tushgan summa - Tarqatilgan summa
- **Moliya bo'limi umumiy balansi:** Tushgan summa + Moliya bo'limiga ajratilgan summa

---

## Base URL

```
http://localhost:5000/api/admin-finance/balance
```

---

## Authentication

Barcha endpoint'lar Admin autentifikatsiyasini talab qiladi.

**Format:** `Authorization: Bearer <admin_token>`

---

## Data Models

### Balance Object
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  },
  "totalReceived": 500000000,
  "totalDistributed": 200000000,
  "totalFinanceKpi": 100000000,
  "totalBalance": 300000000,
  "financeTotalBalance": 600000000,
  "details": {
    "punkt": 50000000,
    "viloyatAgent": 50000000,
    "tumanAgent": 50000000,
    "mfyAgent": 50000000,
    "punktTransfer": 0,
    "finance": 100000000
  }
}
```

---

## Endpoints

### 1. Umumiy Balans

Umumiy tushgan summa, tarqatilgan summa, moliya bo'limiga ajratilgan summa va umumiy balanslarni ko'rsatadi.

**Endpoint:** `GET /balance`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "balance": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalReceived": 500000000,
    "totalDistributed": 200000000,
    "totalFinanceKpi": 100000000,
    "totalBalance": 300000000,
    "financeTotalBalance": 600000000,
    "details": {
      "punkt": 50000000,
      "viloyatAgent": 50000000,
      "tumanAgent": 50000000,
      "mfyAgent": 50000000,
      "punktTransfer": 0,
      "finance": 100000000
    }
  }
}
```

**Field Tushuntirishlari:**
- `totalReceived` - Umumiy tushgan summa (Moliya bo'limiga tasdiqlangan to'lovlar)
- `totalDistributed` - Tarqatilgan summa (KPI bonuslar: punkt + agentlar)
- `totalFinanceKpi` - Moliya bo'limiga ajratilgan summa (KPI bonuslardan)
- `totalBalance` - Umumiy balans (Tushgan - Tarqatilgan)
- `financeTotalBalance` - Moliya bo'limi umumiy balansi (Tushgan + KPI bonus)
- `details` - Tafsilotlar (har bir kategoriya bo'yicha)

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/balance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 2. Umumiy Tushgan Summa

Moliya bo'limiga tasdiqlangan to'lovlar jami summasi.

**Endpoint:** `GET /balance/total-received`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalReceived": 500000000,
    "totalOrders": 3500,
    "submissionsCount": 120
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-received?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 3. Tarqatilgan Summa

KPI bonuslar bo'yicha tarqatilgan summa (punkt, agentlar).

**Endpoint:** `GET /balance/total-distributed`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalDistributed": 200000000,
    "transactionsCount": 1500,
    "details": {
      "punkt": 50000000,
      "viloyatAgent": 50000000,
      "tumanAgent": 50000000,
      "mfyAgent": 50000000,
      "punktTransfer": 0
    }
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-distributed?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4. Moliya Bo'limiga Ajratilgan Summa

KPI bonuslardan moliya bo'limiga ajratilgan summa.

**Endpoint:** `GET /balance/finance-kpi`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalFinanceKpi": 100000000,
    "transactionsCount": 1500
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/balance/finance-kpi?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 5. Umumiy Balans (Tushgan - Tarqatilgan)

Umumiy tushgan summa minus tarqatilgan summa.

**Endpoint:** `GET /balance/total-balance`

**Query Parameters:**
- `startDate` (optional): Boshlanish sanasi (format: `YYYY-MM-DD`)
- `endDate` (optional): Tugash sanasi (format: `YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalReceived": 500000000,
    "totalDistributed": 200000000,
    "totalBalance": 300000000
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-balance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Balans Tushuntirishlari

### Umumiy Tushgan Summa (`totalReceived`)
- Moliya bo'limiga tasdiqlangan to'lovlar jami summasi
- `FinanceSubmission` modelida `status: 'confirmed'` va `toAgentType: 'finance'` bo'lganlar
- Bu summa viloyat agentlardan moliya bo'limiga topshirilgan to'lovlar

### Tarqatilgan Summa (`totalDistributed`)
- KPI bonuslar bo'yicha tarqatilgan summa
- Quyidagilarni o'z ichiga oladi:
  - Punkt bonuslari
  - Viloyat agent bonuslari
  - Tuman agent bonuslari
  - MFY agent bonuslari
  - Punkt transfer bonuslari
- **Eslatma:** Moliya bo'limiga ajratilgan summa (`finance`) bu yig'indiga kirmaydi

### Moliya Bo'limiga Ajratilgan Summa (`totalFinanceKpi`)
- KPI bonuslardan moliya bo'limiga ajratilgan qism
- `KpiBonusTransaction` modelida `amounts.finance` field'i
- Bu summa KPI bonus tizimi orqali moliya bo'limiga ajratiladi

### Umumiy Balans (`totalBalance`)
- **Formula:** `totalReceived - totalDistributed`
- Bu summa moliya bo'limida qolgan pul (tarqatilmagan qism)

### Moliya Bo'limi Umumiy Balansi (`financeTotalBalance`)
- **Formula:** `totalReceived + totalFinanceKpi`
- Bu summa moliya bo'limining umumiy balansi (tushgan to'lovlar + KPI bonus)

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
- `500` - Server xatosi

---

## Examples

### To'liq misol: Barcha balanslarni olish

```bash
# 1. Umumiy balans
curl -X GET "http://localhost:5000/api/admin-finance/balance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"

# 2. Umumiy tushgan summa
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-received?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"

# 3. Tarqatilgan summa
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-distributed?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"

# 4. Moliya bo'limiga ajratilgan summa
curl -X GET "http://localhost:5000/api/admin-finance/balance/finance-kpi?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"

# 5. Umumiy balans
curl -X GET "http://localhost:5000/api/admin-finance/balance/total-balance?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"
```

### JavaScript/TypeScript misol

```javascript
// Umumiy balansni olish
async function getFinanceBalance(startDate, endDate, token) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(
      `http://localhost:5000/api/admin-finance/balance?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('Umumiy tushgan summa:', data.balance.totalReceived);
      console.log('Tarqatilgan summa:', data.balance.totalDistributed);
      console.log('Moliya bo\'limiga ajratilgan summa:', data.balance.totalFinanceKpi);
      console.log('Umumiy balans:', data.balance.totalBalance);
      console.log('Moliya bo\'limi umumiy balansi:', data.balance.financeTotalBalance);
      return data.balance;
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
const token = 'your_admin_token';
getFinanceBalance('2024-01-01', '2024-01-31', token)
  .then((balance) => {
    console.log('Balans:', balance);
  })
  .catch((error) => {
    console.error('Xatolik:', error);
  });
```

### React misol

```jsx
import React, { useState, useEffect } from 'react';

function FinanceBalanceComponent({ token, startDate, endDate }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(
          `http://localhost:5000/api/admin-finance/balance?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setBalance(data.balance);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Balansni olishda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [token, startDate, endDate]);

  if (loading) return <div>Yuklanmoqda...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!balance) return null;

  return (
    <div>
      <h2>Moliya Balanslari</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Umumiy Tushgan Summa</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
            {balance.totalReceived.toLocaleString()} so'm
          </p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Tarqatilgan Summa</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>
            {balance.totalDistributed.toLocaleString()} so'm
          </p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Moliya Bo'limiga Ajratilgan</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'blue' }}>
            {balance.totalFinanceKpi.toLocaleString()} so'm
          </p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Umumiy Balans</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'purple' }}>
            {balance.totalBalance.toLocaleString()} so'm
          </p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', gridColumn: 'span 2' }}>
          <h3>Moliya Bo'limi Umumiy Balansi</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'darkgreen' }}>
            {balance.financeTotalBalance.toLocaleString()} so'm
          </p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Tafsilotlar</h3>
        <ul>
          <li>Punkt: {balance.details.punkt.toLocaleString()} so'm</li>
          <li>Viloyat Agent: {balance.details.viloyatAgent.toLocaleString()} so'm</li>
          <li>Tuman Agent: {balance.details.tumanAgent.toLocaleString()} so'm</li>
          <li>MFY Agent: {balance.details.mfyAgent.toLocaleString()} so'm</li>
          <li>Punkt Transfer: {balance.details.punktTransfer.toLocaleString()} so'm</li>
          <li>Moliya Bo'limi: {balance.details.finance.toLocaleString()} so'm</li>
        </ul>
      </div>
    </div>
  );
}

export default FinanceBalanceComponent;
```

---

## Qo'shimcha Ma'lumotlar

### Balans Hisoblash Formulalari

1. **Umumiy Tushgan Summa:**
   ```
   totalReceived = SUM(FinanceSubmission.amount) 
   WHERE status = 'confirmed' AND toAgentType = 'finance'
   ```

2. **Tarqatilgan Summa:**
   ```
   totalDistributed = SUM(
     amounts.punkt + 
     amounts.viloyatAgent + 
     amounts.tumanAgent + 
     amounts.mfyAgent + 
     amounts.punktTransfer
   )
   FROM KpiBonusTransaction
   WHERE orderStatus = 'confirmed_by_customer'
   ```

3. **Moliya Bo'limiga Ajratilgan Summa:**
   ```
   totalFinanceKpi = SUM(amounts.finance)
   FROM KpiBonusTransaction
   WHERE orderStatus = 'confirmed_by_customer'
   ```

4. **Umumiy Balans:**
   ```
   totalBalance = totalReceived - totalDistributed
   ```

5. **Moliya Bo'limi Umumiy Balansi:**
   ```
   financeTotalBalance = totalReceived + totalFinanceKpi
   ```

### Xavfsizlik

- Barcha endpoint'lar admin autentifikatsiyasini talab qiladi
- Faqat adminlar moliya balanslarini ko'rishlari mumkin
- Barcha ma'lumotlar real-time hisoblanadi

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0


