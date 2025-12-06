# Punkt KPI Bonus API Documentation

## Overview

Punkt KPI Bonus API provides endpoints for punkts to view their KPI bonus earnings and transactions. Punkts can see their total bonus amounts (including transfer bonuses), paid and unpaid bonuses, and detailed transaction history.

**Base Path:** `/api/punkt/kpi`

---

## Base URL

```
http://localhost:5000/api/punkt
```

---

## Authentication

All endpoints require punkt authentication using JWT token from Punkt login.

**Format:** `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get My KPI Summary

Get punkt's KPI bonus summary (total amounts, paid, unpaid).

**Endpoint:** `GET /api/punkt/kpi/summary`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter until date (ISO 8601)
- `isPaid` (optional) - Filter by payment status: `true` or `false`

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567"
    },
    "summary": {
      "totalTransactions": 30,
      "totalAmount": 45000,
      "paidAmount": 25000,
      "unpaidAmount": 20000
    }
  }
}
```

**Response Fields:**
- `totalTransactions`: Total number of KPI bonus transactions
- `totalAmount`: Total bonus amount (paid + unpaid), including:
  - Regular punkt bonuses
  - From punkt transfer bonuses (when this punkt sent order to another)
  - To punkt transfer bonuses (when this punkt received order from another)
- `paidAmount`: Total paid bonus amount
- `unpaidAmount`: Total unpaid bonus amount

---

### 2. Get My KPI Transactions

Get punkt's KPI bonus transactions with details.

**Endpoint:** `GET /api/punkt/kpi/transactions`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter until date (ISO 8601)
- `isPaid` (optional) - Filter by payment status: `true` or `false`
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "order": {
        "_id": "507f1f77bcf86cd799439021",
        "orderNumber": "00001",
        "status": "confirmed_by_customer",
        "totalPrice": 30000
      },
      "orderItem": {
        "product": {
          "_id": "507f1f77bcf86cd799439022",
          "name": "Akt Shampuni",
          "price": 15000,
          "productCode": "001"
        },
        "quantity": 2,
        "price": 15000,
        "kpiBonusPercent": 20
      },
      "distributionConfig": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Standard Distribution"
      },
      "recipients": {
        "fromPunkt": {
          "_id": "507f1f77bcf86cd799439023",
          "name": "Punkt 2"
        },
        "toPunkt": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Punkt 1"
        }
      },
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "punktAmount": 1200,
      "bonusType": "to_punkt",
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `punktAmount`: The bonus amount for this punkt (can be regular, from_punkt, or to_punkt)
- `bonusType`: Type of bonus:
  - `regular`: Regular punkt bonus (this punkt confirmed the order)
  - `from_punkt`: Transfer bonus (this punkt sent order to another punkt)
  - `to_punkt`: Transfer bonus (this punkt received order from another punkt)

---

-### 3. Get My Daily KPI Balance

Kunlik 00:00–23:59 oralig‘ida mazkur punktga tegishli barcha bonus harakatlarini ko‘rsatadi (regular + transfer bonuslari).

**Endpoint:** `GET /api/punkt/kpi/balance`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `date` (optional, `YYYY-MM-DD`) – Qaysi kunning balansini olish. Default: bugungi sana.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totals": {
      "totalTransactions": 5,
      "totalAmount": 9600,
      "paidAmount": 4000,
      "unpaidAmount": 5600,
      "paidTransactions": 2,
      "unpaidTransactions": 3
    }
  }
}
```

---

### 4. Get My Daily KPI Report

Sana oralig‘i bo‘yicha har bir kun uchun punkt KPI summalarini jamlab ko‘rsatadi.

**Endpoint:** `GET /api/punkt/kpi/reports/daily`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional, `YYYY-MM-DD`) – Hisobot boshlanish sanasi. Default: so‘nggi 7 kun.
- `endDate` (optional, `YYYY-MM-DD`) – Hisobot tugash sanasi. Default: so‘nggi 7 kunning oxiri.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "range": {
      "startDate": "2024-01-09T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    },
    "report": [
      {
        "date": "2024-01-14",
        "totalTransactions": 3,
        "totalAmount": 5400,
        "paidAmount": 1800,
        "unpaidAmount": 3600,
        "paidTransactions": 1,
        "unpaidTransactions": 2
      },
      {
        "date": "2024-01-15",
        "totalTransactions": 5,
        "totalAmount": 9600,
        "paidAmount": 4000,
        "unpaidAmount": 5600,
        "paidTransactions": 2,
        "unpaidTransactions": 3
      }
    ]
  }
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "error": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**
- **200 OK** - Request successful
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Get KPI Summary

```bash
curl -X GET "http://localhost:5000/api/punkt/kpi/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get KPI Transactions

```bash
curl -X GET "http://localhost:5000/api/punkt/kpi/transactions?isPaid=false&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Multiple Bonus Types:** Punkts can receive bonuses from:
   - Regular orders they confirmed
   - Orders they sent to other punkts (from_punkt)
   - Orders they received from other punkts (to_punkt)

2. **Transaction Filtering:** Transactions are automatically filtered to show only those where this punkt is involved (as regular punkt, from punkt, or to punkt).

3. **Payment Status:** Use `isPaid` filter to see only paid or unpaid bonuses.

4. **Date Filtering:** Use `startDate` and `endDate` to filter transactions by creation date.

5. **Customer Confirmation:** KPI bonuslari faqat foydalanuvchi buyurtmani `confirmed_by_customer` holatida tasdiqlaganidan keyin hisoblanadi. Kunlik balans API har kuni 00:00–23:59 oralig‘idagi harakatlarni ko‘rsatadi.

---

**Last Updated:** 2024-01-15


