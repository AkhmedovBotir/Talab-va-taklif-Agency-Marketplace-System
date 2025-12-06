# Agent KPI Bonus API Documentation

## Overview

Agent KPI Bonus API provides endpoints for agents to view their KPI bonus earnings and transactions. Agents can see their total bonus amounts, paid and unpaid bonuses, and detailed transaction history.

**Base Path:** `/api/agent/kpi`

---

## Base URL

```
http://localhost:5000/api/agent
```

---

## Authentication

All endpoints require agent authentication using JWT token from Agent login.

**Format:** `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get My KPI Summary

Get agent's KPI bonus summary (total amounts, paid, unpaid).

**Endpoint:** `GET /api/agent/kpi/summary`

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
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Agent 1",
      "phone": "+998901234567",
      "role": "mfy"
    },
    "summary": {
      "totalTransactions": 25,
      "totalAmount": 52500,
      "paidAmount": 30000,
      "unpaidAmount": 22500
    }
  }
}
```

**Response Fields:**
- `totalTransactions`: Total number of KPI bonus transactions
- `totalAmount`: Total bonus amount (paid + unpaid)
- `paidAmount`: Total paid bonus amount
- `unpaidAmount`: Total unpaid bonus amount

**Note:** The amount shown is based on the agent's role:
- **MFY Agent:** Shows `mfyAgent` amounts
- **Tuman Agent:** Shows `tumanAgent` amounts
- **Viloyat Agent:** Shows `viloyatAgent` amounts

---

### 2. Get My KPI Transactions

Get agent's KPI bonus transactions with details.

**Endpoint:** `GET /api/agent/kpi/transactions`

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
  "total": 25,
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
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "agentAmount": 2100,
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `agentAmount`: The bonus amount for this agent (based on their role)
- Other fields are the same as in the transaction object

---

-### 3. Get My Daily KPI Balance

Kunlik KPI bonus balansini ko‘rsatadi. Natija faqat `confirmed_by_customer` holatiga kelgan buyurtmalar bo‘yicha 00:00–23:59 oralig‘idagi barcha transaksiyalarni jamlaydi.

**Endpoint:** `GET /api/agent/kpi/balance`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `date` (optional, format `YYYY-MM-DD`) – Ko‘rsatilgan sananing kunlik balansini olish. Default: bugungi sana.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totals": {
      "totalTransactions": 4,
      "totalAmount": 8400,
      "paidAmount": 3000,
      "unpaidAmount": 5400,
      "paidTransactions": 2,
      "unpaidTransactions": 2
    }
  }
}
```

---

### 4. Get My Daily KPI Report

Belgilangan davr bo‘yicha har kunlik KPI bonus hisobotini qaytaradi. Har bir element sanoq sanasi bo‘yicha jamlangan.

**Endpoint:** `GET /api/agent/kpi/reports/daily`

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
        "totalAmount": 4500,
        "paidAmount": 1500,
        "unpaidAmount": 3000,
        "paidTransactions": 1,
        "unpaidTransactions": 2
      },
      {
        "date": "2024-01-15",
        "totalTransactions": 4,
        "totalAmount": 8400,
        "paidAmount": 3000,
        "unpaidAmount": 5400,
        "paidTransactions": 2,
        "unpaidTransactions": 2
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
curl -X GET "http://localhost:5000/api/agent/kpi/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get KPI Transactions

```bash
curl -X GET "http://localhost:5000/api/agent/kpi/transactions?isPaid=false&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Role-Based Amounts:** Agents only see bonuses for their role (MFY agents see MFY bonuses, tuman agents see tuman bonuses, etc.)

2. **Transaction Filtering:** Transactions are automatically filtered by agent role. MFY agents only see transactions where they are the MFY agent recipient.

3. **Payment Status:** Use `isPaid` filter to see only paid or unpaid bonuses.

4. **Date Filtering:** Use `startDate` and `endDate` to filter transactions by creation date.

5. **Customer Confirmation:** Barcha KPI hisob-kitoblari faqat mijoz buyurtmani `confirmed_by_customer` holatida tasdiqlaganidan keyin yaratiladi. Kunlik balans har kuni 00:00–23:59 oralig‘idagi harakatlarni ko‘rsatadi.

---

**Last Updated:** 2024-01-15


