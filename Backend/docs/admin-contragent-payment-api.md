# Admin Contragent Payment API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get Unpaid Payments](#1-get-unpaid-payments)
  - [Get Unpaid Payments Grouped](#2-get-unpaid-payments-grouped)
  - [Pay Single Payment](#3-pay-single-payment)
  - [Pay Payments by Date Range](#4-pay-payments-by-date-range)
  - [Mark Payments as Paid (Multiple)](#5-mark-payments-as-paid-multiple)
  - [Get Payment Statistics](#6-get-payment-statistics)
  - [Get Paid Payments](#7-get-paid-payments)
  - [Sync Contragent Payments](#8-sync-contragent-payments)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Admin Contragent Payment API provides endpoints for Admins to manage payments to Contragents. This includes viewing unpaid payments, paying individual or multiple payments, filtering payments by date range, and syncing payments from orders.

**Workflow:**
1. Orders are confirmed by customers → Contragents deliver items
2. Admin syncs payments from orders → Creates `ContragentPaymentDistribution` records
3. Admin views unpaid payments → Filters by date, contragent, region, etc.
4. Admin pays contragents → Updates payment status to 'paid' and sends notifications

**Base Path:** `/api/admin-contragent-payments`

---

## Base URL

```
http://localhost:5000/api/admin-contragent-payments
```

---

## Authentication

All endpoints require Admin authentication using JWT token from Admin login.

**Format:** `Authorization: Bearer <token>`

**Required for:** All endpoints

---

## Data Models

### ContragentPaymentDistribution Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "contragent": {
    "_id": "string (ObjectId)",
    "name": "string",
    "inn": "string",
    "phone": "string",
    "viloyat": {
      "_id": "string (ObjectId)",
      "name": "string",
      "type": "region",
      "code": "string"
    },
    "tuman": {
      "_id": "string (ObjectId)",
      "name": "string",
      "type": "district",
      "code": "string"
    },
    "mfy": {
      "_id": "string (ObjectId)",
      "name": "string",
      "type": "mfy",
      "code": "string"
    }
  },
  "amount": "number (required, min: 0)",
  "status": "string (enum: 'pending' | 'paid' | 'cancelled', default: 'pending')",
  "paidAt": "Date | null (set when paid)",
  "paidBy": {
    "_id": "string (ObjectId)",
    "name": "string",
    "phone": "string"
  } | null,
  "notes": "string | null",
  "orders": [
    {
      "_id": "string (ObjectId)",
      "orderNumber": "string",
      "totalPrice": "number",
      "totalKpiPrice": "number",
      "createdAt": "Date"
    }
  ],
  "dueDate": "Date (required, payment due date)",
  "isOverdue": "boolean (default: false, true if dueDate passed and status is pending)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Payment Status Values

- `pending` - To'lanmagan (default)
- `paid` - To'langan
- `cancelled` - Bekor qilingan

---

## Endpoints

### 1. Get Unpaid Payments

Get all unpaid (pending) contragent payments with filtering options.

**Endpoint:** `GET /unpaid`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contragentId` | string (ObjectId) | No | Filter by contragent ID |
| `viloyatId` | string (ObjectId) | No | Filter by viloyat (region) |
| `tumanId` | string (ObjectId) | No | Filter by tuman (district) |
| `mfyId` | string (ObjectId) | No | Filter by MFY |
| `isOverdue` | string ('true'/'false') | No | Filter by overdue status |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalUnpaidAmount": 12000000,
  "overdue": {
    "totalAmount": 2000000,
    "count": 5
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "contragent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "O'zbekiston Tijorat MChJ",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "1001"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Navruz MFY",
          "type": "mfy",
          "code": "1001001"
        }
      },
      "amount": 500000,
      "status": "pending",
      "paidAt": null,
      "paidBy": null,
      "notes": null,
      "orders": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "orderNumber": "ORD-001",
          "totalPrice": 600000,
          "totalKpiPrice": 100000,
          "createdAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-22T00:00:00.000Z",
      "isOverdue": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

### 2. Get Unpaid Payments Grouped

Get unpaid payments grouped by contragent.

**Endpoint:** `GET /unpaid/grouped`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isOverdue` | string ('true'/'false') | No | Filter by overdue status |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "contragent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "O'zbekiston Tijorat MChJ",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "1001"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Navruz MFY",
          "type": "mfy",
          "code": "1001001"
        }
      },
      "totalAmount": 1500000,
      "count": 3,
      "earliestDueDate": "2024-01-20T00:00:00.000Z",
      "latestDueDate": "2024-01-25T00:00:00.000Z",
      "hasOverdue": false
    }
  ]
}
```

---

### 3. Pay Single Payment

Pay a single contragent payment by ID.

**Endpoint:** `POST /:id/pay`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the payment

**Request Body:**

```json
{
  "notes": "string (optional, payment notes)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli to'landi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "contragent": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "O'zbekiston Tijorat MChJ",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "phone": "+998901234567"
    },
    "notes": "To'lov qabul qilindi",
    "orders": [],
    "dueDate": "2024-01-22T00:00:00.000Z",
    "isOverdue": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "notification": {
    "id": "507f1f77bcf86cd799439021",
    "title": "To'lov qabul qilindi",
    "message": "Sizga 500,000 so'm to'lov 2024 yil 20 yanvar sanasida to'landi."
  }
}
```

**Error Responses:**
- **400 Bad Request** - Payment is not pending or already paid
- **404 Not Found** - Payment not found
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

### 4. Pay Payments by Date Range

Pay multiple unpaid payments filtered by date range and optional filters.

**Endpoint:** `POST /pay-by-date-range`

**Request Body:**

```json
{
  "startDate": "string (required, ISO 8601 date, e.g., '2024-01-01')",
  "endDate": "string (required, ISO 8601 date, e.g., '2024-01-31')",
  "contragentId": "string (optional, ObjectId)",
  "isOverdue": "boolean (optional, default: false)",
  "notes": "string (optional, payment notes)"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string (ISO 8601) | Yes | Start date for dueDate filter (inclusive) |
| `endDate` | string (ISO 8601) | Yes | End date for dueDate filter (inclusive) |
| `contragentId` | string (ObjectId) | No | Filter by specific contragent |
| `isOverdue` | boolean | No | Filter only overdue payments |
| `notes` | string | No | Notes to add to all payments |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "10 ta to'lov muvaffaqiyatli to'landi",
  "count": 10,
  "totalAmount": 5000000,
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  },
  "filter": {
    "contragentId": null,
    "isOverdue": false
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "contragent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "O'zbekiston Tijorat MChJ"
      },
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-20T10:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin User"
      },
      "notes": "To'lovlar qabul qilindi",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "isOverdue": false
    }
  ],
  "notifications": {
    "sent": 5,
    "contragents": 5
  }
}
```

**Error Responses:**
- **400 Bad Request** - Missing dates, invalid date range, or no payments found
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

**Important Notes:**
- Payments are filtered by `dueDate` (not `paidAt`)
- Only `pending` payments are paid
- All matching payments are updated to `paid` status
- Notifications are sent to contragents (one per contragent with total amount)

---

### 5. Mark Payments as Paid (Multiple)

Mark multiple payments as paid by providing payment IDs.

**Endpoint:** `POST /mark-as-paid`

**Request Body:**

```json
{
  "paymentIds": ["string (required, array of ObjectIds)"],
  "notes": "string (optional, payment notes)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "5 ta to'lov muvaffaqiyatli to'landi deb belgilandi",
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "notifications": 5
}
```

---

### 6. Get Payment Statistics

Get payment statistics (unpaid, paid, overdue).

**Endpoint:** `GET /statistics`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string (ISO 8601) | No | Start date for paid payments filter |
| `endDate` | string (ISO 8601) | No | End date for paid payments filter |

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
      "totalAmount": 12000000,
      "count": 25
    },
    "paid": {
      "totalAmount": 5000000,
      "count": 10
    },
    "overdue": {
      "totalAmount": 2000000,
      "count": 5
    }
  }
}
```

---

### 7. Get Paid Payments

Get all paid payments with filtering options.

**Endpoint:** `GET /paid`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contragentId` | string (ObjectId) | No | Filter by contragent ID |
| `startDate` | string (ISO 8601) | No | Start date for paidAt filter |
| `endDate` | string (ISO 8601) | No | End date for paidAt filter |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalPaidAmount": 25000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "contragent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "O'zbekiston Tijorat MChJ"
      },
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-20T10:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin User"
      }
    }
  ]
}
```

---

### 8. Sync Contragent Payments

Create or update contragent payments from confirmed orders.

**Endpoint:** `POST /sync`

**Request Body:**

```json
{
  "dueDateDays": "number (required, default: 7, minimum: 1)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Contragent to'lovlari muvaffaqiyatli yaratildi/yangilandi",
  "data": {
    "dueDate": "2024-01-27T00:00:00.000Z",
    "dueDateDays": 7,
    "foundOrders": 50,
    "filteredOrders": 45,
    "createdPayments": 10,
    "updatedPayments": 5,
    "processedOrders": 45,
    "createdPaymentIds": ["507f1f77bcf86cd799439011"],
    "updatedPaymentIds": ["507f1f77bcf86cd799439012"],
    "debug": {
      "ordersWithNoItems": 2,
      "ordersWithNoContragent": 1,
      "ordersWithNoDeliveredRequest": 2,
      "itemsProcessed": 100,
      "itemsSkipped": 5,
      "paymentsSkippedZeroAmount": 0
    }
  }
}
```

**Important Notes:**
- Only processes orders with status `confirmed_by_customer`
- Only includes items from contragent requests with status `delivered_to_punkt`
- Payment amount = `totalPrice - totalKpiPrice`
- If payment already exists for same contragent and dueDate, it updates the existing payment

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "error": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**
- **200 OK** - Success
- **400 Bad Request** - Validation error or invalid request
- **401 Unauthorized** - Authentication required or invalid token
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Validation Rules

### Pay Single Payment

- `notes`: Optional string

### Pay Payments by Date Range

- `startDate`: Required, ISO 8601 date string
- `endDate`: Required, ISO 8601 date string, must be after startDate
- `contragentId`: Optional, valid MongoDB ObjectId
- `isOverdue`: Optional boolean
- `notes`: Optional string

### Mark Payments as Paid

- `paymentIds`: Required, array of valid MongoDB ObjectIds, minimum 1 item
- `notes`: Optional string

### Sync Contragent Payments

- `dueDateDays`: Required, number, minimum 1

---

## Examples

### Example 1: Get Unpaid Payments

```bash
curl -X GET "http://localhost:5000/api/admin-contragent-payments/unpaid?page=1&limit=50&isOverdue=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Pay Single Payment

```bash
curl -X POST "http://localhost:5000/api/admin-contragent-payments/507f1f77bcf86cd799439011/pay" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "To'lov qabul qilindi"
  }'
```

### Example 3: Pay Payments by Date Range

```bash
curl -X POST "http://localhost:5000/api/admin-contragent-payments/pay-by-date-range" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "isOverdue": true,
    "notes": "Oylik to'lovlar"
  }'
```

### Example 4: Pay Payments by Date Range for Specific Contragent

```bash
curl -X POST "http://localhost:5000/api/admin-contragent-payments/pay-by-date-range" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "contragentId": "507f1f77bcf86cd799439012",
    "notes": "Contragent uchun oylik to'lov"
  }'
```

### Example 5: Mark Multiple Payments as Paid

```bash
curl -X POST "http://localhost:5000/api/admin-contragent-payments/mark-as-paid" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIds": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ],
    "notes": "To'lovlar qabul qilindi"
  }'
```

### Example 6: Get Payment Statistics

```bash
curl -X GET "http://localhost:5000/api/admin-contragent-payments/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 7: Sync Contragent Payments

```bash
curl -X POST "http://localhost:5000/api/admin-contragent-payments/sync" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "dueDateDays": 7
  }'
```

---

## Notes

- All payment operations send notifications to contragents via Socket.io (if available)
- Payments are automatically marked as overdue if `dueDate` passes and status is still `pending`
- When paying by date range, notifications are grouped by contragent (one notification per contragent with total amount)
- Payment amount is calculated as: `totalPrice - totalKpiPrice` from orders
- Only orders with status `confirmed_by_customer` and contragent requests with status `delivered_to_punkt` are included in sync
