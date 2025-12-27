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

### ⚠️ MUHIM: KPI Bonus - Xarajat, Daromad Emas!

**Asosiy qoida:**
- **KPI bonus** — bu daromad emas, bu **ichki taqsimot (xarajat)**
- Agar KPI mijozdan alohida tushmagan bo'lsa, u **Tushgan summa ichidan ajratiladi**
- KPI'ni "daromadga qo'shish" → hisobni sun'iy oshiradi

**To'g'ri moliyaviy struktura:**

1. **Umumiy Tushgan Summa** (`totalReceived`)
   - Mijozlardan real tushgan pul
   - Moliya bo'limiga tasdiqlangan to'lovlar

2. **KPI Bonuslar (Ichki taqsimot - Xarajat)** (`totalKpiExpenses`)
   - Punkt, Agentlar (MFY, Tuman, Viloyat), Moliya bo'limi, Yetkazib berish
   - **Bularning barchasi xarajat**

3. **Contragent to'lovlari** (`totalContragentPayments`)
   - Tashqi xarajat (real chiqim)

4. **Umumiy Xarajatlar** (`totalExpenses`)
   - KPI Bonuslar + Contragent to'lovlari

5. **Umumiy Sof Balans (REAL foyda)** (`totalBalance`)
   - Tushgan - Xarajatlar

6. **Moliya bo'limi balansi** (`financeTotalBalance`)
   - Tushgan - Contragent to'lovlari
   - KPI qo'shilmaydi (chunki bu xarajat)

7. **Moliya bo'limi sof daromadi** (`financeNetIncome`)
   - Moliya bo'limi uchun KPI bonus (ichki daromad)
   - Lekin umumiy tizim uchun bu xarajat

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
  "success": true,
  "balance": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalReceived": 375000,
    "totalKpiExpenses": 23800,
    "kpiDistribution": {
      "punkt": 4200,
      "viloyatAgent": 4200,
      "tumanAgent": 4200,
      "mfyAgent": 9800,
      "punktTransfer": 0,
      "deliveryService": 1400,
      "finance": 4200,
      "total": 23800
    },
    "totalContragentPayments": 111000,
    "totalExpenses": 134800,
    "totalBalance": 240200,
    "financeTotalBalance": 264000,
    "financeNetIncome": 4200,
    "details": {
      "kpiDistribution": {
        "punkt": 4200,
        "viloyatAgent": 4200,
        "tumanAgent": 4200,
        "mfyAgent": 9800,
        "punktTransfer": 0,
        "deliveryService": 1400,
        "finance": 4200,
        "total": 23800
      },
      "contragentPayments": {
        "total": 111000,
        "count": 25
      }
    }
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
    "totalReceived": 375000,
    "totalKpiExpenses": 23800,
    "kpiDistribution": {
      "punkt": 4200,
      "viloyatAgent": 4200,
      "tumanAgent": 4200,
      "mfyAgent": 9800,
      "punktTransfer": 0,
      "deliveryService": 1400,
      "finance": 4200,
      "total": 23800
    },
    "totalContragentPayments": 111000,
    "totalExpenses": 134800,
    "totalBalance": 240200,
    "financeTotalBalance": 264000,
    "financeNetIncome": 4200,
    "details": {
      "kpiDistribution": {
        "punkt": 4200,
        "viloyatAgent": 4200,
        "tumanAgent": 4200,
        "mfyAgent": 9800,
        "punktTransfer": 0,
        "deliveryService": 1400,
        "finance": 4200,
        "total": 23800
      },
      "contragentPayments": {
        "total": 111000,
        "count": 25
      }
    }
  }
}
```

**Field Tushuntirishlari:**

**Daromadlar:**
- `totalReceived` - Umumiy tushgan summa (Mijozlardan real tushgan pul)
  - Moliya bo'limiga tasdiqlangan to'lovlar
  - **Eslatma:** KPI bonus daromad emas, xarajat!

**Xarajatlar:**
- `totalKpiExpenses` - Barcha KPI bonuslar jami (Xarajat - ichki taqsimot)
  - Punkt, Agentlar (MFY, Tuman, Viloyat), Moliya bo'limi, Yetkazib berish
  - **Bularning barchasi xarajat**
- `kpiDistribution` - KPI bonuslar taqsimoti
  - `punkt` - Punkt bonuslari
  - `viloyatAgent` - Viloyat agent bonuslari
  - `tumanAgent` - Tuman agent bonuslari
  - `mfyAgent` - MFY agent bonuslari
  - `punktTransfer` - Punkt transfer bonuslari
  - `deliveryService` - Yetkazib berish xizmati bonuslari
  - `finance` - Moliya bo'limi bonuslari (ichki daromad, lekin umumiy tizim uchun xarajat)
  - `total` - Barcha KPI bonuslar jami
- `totalContragentPayments` - Contragent to'lovlari (Tashqi xarajat - real chiqim)
- `totalExpenses` - Umumiy xarajatlar (KPI bonuslar + Contragent to'lovlari)

**Balanslar:**
- `totalBalance` - Umumiy sof balans (REAL foyda) = Tushgan - Xarajatlar
- `financeTotalBalance` - Moliya bo'limi balansi = Tushgan - Contragent to'lovlari
  - KPI qo'shilmaydi (chunki bu xarajat)
- `financeNetIncome` - Moliya bo'limi sof daromadi = KPI bonus (ichki daromad)
  - Moliya bo'limi uchun KPI = ichki daromad
  - Lekin umumiy tizim uchun: KPI = xarajat

**Tafsilotlar:**
- `details.kpiDistribution` - KPI bonuslar taqsimoti (har bir kategoriya bo'yicha)
- `details.contragentPayments` - Contragent to'lovlari (jami summa va soni)

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

### 3. Tarqatilgan Summa (KPI Bonuslar - Xarajat)

KPI bonuslar bo'yicha tarqatilgan summa (punkt, agentlar, deliveryService). **Eslatma:** Bu xarajat, daromad emas!

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
      "punktTransfer": 0,
      "deliveryService": 0
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

### 4. Moliya Bo'limiga Ajratilgan Summa (KPI Bonus - Xarajat)

KPI bonuslardan moliya bo'limiga ajratilgan summa. **Eslatma:** Bu ham xarajat (ichki taqsimot), lekin moliya bo'limi uchun ichki daromad.

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
    "totalContragentPayments": 150000000,
    "totalExpenses": 350000000,
    "totalBalance": 150000000
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

### ⚠️ MUHIM: KPI Bonus - Xarajat, Daromad Emas!

**Asosiy qoida:**
- **KPI bonus** — bu daromad emas, bu **ichki taqsimot (xarajat)**
- Agar KPI mijozdan alohida tushmagan bo'lsa, u **Tushgan summa ichidan ajratiladi**
- KPI'ni "daromadga qo'shish" → hisobni sun'iy oshiradi

### Umumiy Tushgan Summa (`totalReceived`)
- Mijozlardan real tushgan pul
- Moliya bo'limiga tasdiqlangan to'lovlar jami summasi
- `FinanceSubmission` modelida `status: 'confirmed'` va `toAgentType: 'finance'` bo'lganlar
- Bu summa viloyat agentlardan moliya bo'limiga topshirilgan to'lovlar
- **Sana filtri:** `confirmedAt` bo'yicha

### KPI Bonuslar (Ichki Taqsimot - Xarajat) (`totalKpiExpenses`)
- **Barcha KPI bonuslar jami (xarajat)**
- Quyidagilarni o'z ichiga oladi:
  - Punkt bonuslari
  - Viloyat agent bonuslari
  - Tuman agent bonuslari
  - MFY agent bonuslari
  - Punkt transfer bonuslari
  - Yetkazib berish xizmati bonuslari (`deliveryService`)
  - Moliya bo'limi bonuslari (`finance`)
- **Eslatma:** Bularning barchasi xarajat (ichki taqsimot)
- **Sana filtri:** `createdAt` bo'yicha

### Contragent To'lovlari (`totalContragentPayments`)
- Contragentlarga to'langan to'lovlar jami summasi (Tashqi xarajat - real chiqim)
- `ContragentPaymentDistribution` modelida `status: 'paid'` bo'lganlar
- Bu summa contragentlarga to'langan to'lovlar (buyurtmalardan olingan summalar)
- **Sana filtri:** `paidAt` bo'yicha

### Umumiy Xarajatlar (`totalExpenses`)
- **Formula:** `totalKpiExpenses + totalContragentPayments` = KPI Bonuslar + Contragent to'lovlari
- Bu summa tizimning umumiy xarajatlari

### Umumiy Sof Balans (REAL foyda) (`totalBalance`)
- **Formula:** `totalReceived - totalExpenses` = Tushgan - Xarajatlar
- Bu tizimning haqiqiy sof balansi

### Moliya Bo'limi Balansi (`financeTotalBalance`)
- **Formula:** `totalReceived - totalContragentPayments` = Tushgan - Contragent to'lovlari
- KPI qo'shilmaydi (chunki bu xarajat)
- Bu moliya bo'limida qolgan pul (Contragent to'lovlaridan keyin)

### Moliya Bo'limi Sof Daromadi (`financeNetIncome`)
- **Formula:** `totalFinanceKpi` = Moliya bo'limi uchun KPI bonus
- Moliya bo'limi uchun: KPI bonus = ichki daromad
- Lekin umumiy tizim uchun: KPI = xarajat

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
      console.log('Moliya bo\'limiga ajratilgan summa (KPI):', data.balance.totalFinanceKpi);
      console.log('Umumiy daromad:', data.balance.totalIncome);
      console.log('Tarqatilgan summa (KPI):', data.balance.totalDistributed);
      console.log('Contragent to\'lovlari:', data.balance.totalContragentPayments);
      console.log('Umumiy xarajatlar:', data.balance.totalExpenses);
      console.log('Umumiy balans:', data.balance.totalBalance);
      console.log('Moliya bo\'limi umumiy balansi:', data.balance.financeTotalBalance);
      console.log('Moliya bo\'limi sof daromadi:', data.balance.financeNetIncome);
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
          <h3>Moliya Bo'limiga Ajratilgan (KPI)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'blue' }}>
            {balance.totalFinanceKpi.toLocaleString()} so'm
          </p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Umumiy Tushgan Summa</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'darkgreen' }}>
            {balance.totalReceived.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>Mijozlardan real tushgan pul</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>KPI Bonuslar (Xarajat)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>
            {balance.totalKpiExpenses.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>Ichki taqsimot - xarajat</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Contragent To'lovlari</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'red' }}>
            {balance.totalContragentPayments.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>Tashqi xarajat - real chiqim</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Umumiy Xarajatlar</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'darkred' }}>
            {balance.totalExpenses.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>KPI Bonuslar + Contragent to'lovlari</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Umumiy Sof Balans (REAL foyda)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'purple' }}>
            {balance.totalBalance.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>Tushgan - Xarajatlar</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Moliya Bo'limi Balansi</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'darkgreen' }}>
            {balance.financeTotalBalance.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>Tushgan - Contragent to'lovlari</p>
        </div>

        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Moliya Bo'limi Sof Daromadi</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
            {balance.financeNetIncome.toLocaleString()} so'm
          </p>
          <p style={{ fontSize: '12px', color: 'gray' }}>KPI bonus (ichki daromad)</p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>KPI Bonuslar Taqsimoti</h3>
        <ul>
          <li>Punkt: {balance.details.kpiDistribution.punkt.toLocaleString()} so'm</li>
          <li>Viloyat Agent: {balance.details.kpiDistribution.viloyatAgent.toLocaleString()} so'm</li>
          <li>Tuman Agent: {balance.details.kpiDistribution.tumanAgent.toLocaleString()} so'm</li>
          <li>MFY Agent: {balance.details.kpiDistribution.mfyAgent.toLocaleString()} so'm</li>
          <li>Punkt Transfer: {balance.details.kpiDistribution.punktTransfer.toLocaleString()} so'm</li>
          <li>Yetkazib Berish Xizmati: {balance.details.kpiDistribution.deliveryService.toLocaleString()} so'm</li>
          <li>Moliya Bo'limi: {balance.details.kpiDistribution.finance.toLocaleString()} so'm</li>
        </ul>
        
        <h3>Contragent To'lovlari</h3>
        <ul>
          <li>Jami Summa: {balance.details.contragentPayments.total.toLocaleString()} so'm</li>
          <li>To'lovlar Soni: {balance.details.contragentPayments.count} ta</li>
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

#### ⚠️ MUHIM: KPI Bonus - Xarajat, Daromad Emas!

**Asosiy qoida:**
- KPI bonus — bu daromad emas, bu **ichki taqsimot (xarajat)**
- Umumiy daromad = Tushgan summa (KPI qo'shilmaydi)
- Sof foyda = Tushgan - (KPI + Contragent to'lovlari)

1. **Umumiy Tushgan Summa (Daromad):**
   ```
   totalReceived = SUM(FinanceSubmission.amount) 
   WHERE status = 'confirmed' AND toAgentType = 'finance'
   ```
   - Mijozlardan real tushgan pul
   - **Eslatma:** KPI bonus daromad emas!

2. **KPI Bonuslar (Xarajat - Ichki Taqsimot):**
   ```
   totalKpiExpenses = SUM(
     amounts.punkt + 
     amounts.viloyatAgent + 
     amounts.tumanAgent + 
     amounts.mfyAgent + 
     amounts.punktTransfer +
     amounts.deliveryService +
     amounts.finance
   )
   FROM KpiBonusTransaction
   WHERE orderStatus = 'confirmed_by_customer'
   ```
   - Barcha KPI bonuslar jami (xarajat)
   - Punkt, Agentlar, Moliya bo'limi, Yetkazib berish

3. **Contragent To'lovlari (Tashqi Xarajat):**
   ```
   totalContragentPayments = SUM(amount)
   FROM ContragentPaymentDistribution
   WHERE status = 'paid'
   ```
   - Contragentlarga to'langan to'lovlar (real chiqim)

4. **Umumiy Xarajatlar:**
   ```
   totalExpenses = totalKpiExpenses + totalContragentPayments
   ```
   - KPI Bonuslar + Contragent to'lovlari

5. **Umumiy Sof Balans (REAL foyda):**
   ```
   totalBalance = totalReceived - totalExpenses
   ```
   - Tushgan - Xarajatlar
   - Bu tizimning haqiqiy sof balansi

6. **Moliya Bo'limi Balansi:**
   ```
   financeTotalBalance = totalReceived - totalContragentPayments
   ```
   - Tushgan - Contragent to'lovlari
   - KPI qo'shilmaydi (chunki bu xarajat)

7. **Moliya Bo'limi Sof Daromadi:**
   ```
   financeNetIncome = totalFinanceKpi
   ```
   - Moliya bo'limi uchun KPI bonus (ichki daromad)
   - Lekin umumiy tizim uchun: KPI = xarajat

### Xavfsizlik

- Barcha endpoint'lar admin autentifikatsiyasini talab qiladi
- Faqat adminlar moliya balanslarini ko'rishlari mumkin
- Barcha ma'lumotlar real-time hisoblanadi

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0


