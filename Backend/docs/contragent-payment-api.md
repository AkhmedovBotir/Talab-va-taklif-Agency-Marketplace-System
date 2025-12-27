# Contragent Payment API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get My Paid Payments](#1-get-my-paid-payments)
  - [Get My Unpaid Payments](#2-get-my-unpaid-payments)
  - [Get My Payment Statistics](#3-get-my-payment-statistics)
  - [Get My Payment by ID](#4-get-my-payment-by-id)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Contragent Payment API provides endpoints for Contragents to view their payment information. Contragents can see payments made to them by Admin, including paid payments, unpaid payments, payment statistics, and individual payment details.

**Base Path:** `/api/contragents/payments`

**Note:** All payment endpoints require Contragent authentication. Contragents can only view their own payments.

---

## Base URL

```
http://localhost:5000/api/contragents
```

---

## Authentication

All payment endpoints **require authentication** using a JWT token obtained from Contragent login.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Type:** `contragent`

**Token Expiration:** 24 hours (as set in authentication)

---

## Data Models

### ContragentPaymentDistribution Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "contragent": "string (ObjectId, reference to Contragent)",
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

### 1. Get My Paid Payments

Get all paid payments made to the current authenticated Contragent.

**Endpoint:** `GET /api/contragents/payments/paid`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |
| `startDate` | string (ISO 8601) | No | Start date for paidAt filter |
| `endDate` | string (ISO 8601) | No | End date for paidAt filter |

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
  "totalPaidAmount": 12000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-20T10:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin User",
        "phone": "+998901234567"
      },
      "notes": "To'lov qabul qilindi",
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
      "updatedAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `count` - Number of payments in current page
- `total` - Total number of paid payments
- `page` - Current page number
- `limit` - Items per page
- `totalPages` - Total number of pages
- `totalAmount` - Sum of amounts in current page
- `totalPaidAmount` - Sum of all paid payments
- `data` - Array of payment objects

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for contragent or account inactive
- **500 Internal Server Error** - Server error

---

### 2. Get My Unpaid Payments

Get all unpaid (pending) payments for the current authenticated Contragent.

**Endpoint:** `GET /api/contragents/payments/unpaid`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |
| `isOverdue` | string ('true'/'false') | No | Filter by overdue status |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 2000000,
  "totalUnpaidAmount": 5000000,
  "overdue": {
    "totalAmount": 1000000,
    "count": 2
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
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

**Response Fields:**
- `count` - Number of payments in current page
- `total` - Total number of unpaid payments
- `page` - Current page number
- `limit` - Items per page
- `totalPages` - Total number of pages
- `totalAmount` - Sum of amounts in current page
- `totalUnpaidAmount` - Sum of all unpaid payments
- `overdue` - Overdue payments statistics
  - `totalAmount` - Sum of overdue payments
  - `count` - Number of overdue payments
- `data` - Array of payment objects

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for contragent or account inactive
- **500 Internal Server Error** - Server error

---

### 3. Get My Payment Statistics

Get payment statistics for the current authenticated Contragent.

**Endpoint:** `GET /api/contragents/payments/statistics`

**Headers:**
- `Authorization: Bearer <token>` (required)

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
      "totalAmount": 5000000,
      "count": 10
    },
    "paid": {
      "totalAmount": 12000000,
      "count": 25
    },
    "overdue": {
      "totalAmount": 1000000,
      "count": 2
    }
  }
}
```

**Response Fields:**
- `period` - Date range for paid payments filter (null if not specified)
  - `startDate` - Start date (null if not specified)
  - `endDate` - End date (null if not specified)
- `unpaid` - Unpaid payments statistics
  - `totalAmount` - Total unpaid amount
  - `count` - Number of unpaid payments
- `paid` - Paid payments statistics (filtered by date range if specified)
  - `totalAmount` - Total paid amount
  - `count` - Number of paid payments
- `overdue` - Overdue payments statistics
  - `totalAmount` - Total overdue amount
  - `count` - Number of overdue payments

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for contragent or account inactive
- **500 Internal Server Error** - Server error

---

### 4. Get My Payment by ID

Get a specific payment by ID for the current authenticated Contragent.

**Endpoint:** `GET /api/contragents/payments/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the payment

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "phone": "+998901234567"
    },
    "notes": "To'lov qabul qilindi",
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
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for contragent or account inactive
- **404 Not Found** - Payment not found or does not belong to this contragent
- **500 Internal Server Error** - Server error

---

## Error Handling

All error responses follow a consistent format:

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
- **403 Forbidden** - Token not for contragent or account inactive
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

```json
{
  "success": false,
  "message": "Token noto'g'ri yoki muddati tugagan"
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Bu token contragent uchun emas"
}
```

```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "To'lov topilmadi"
}
```

---

## Examples

### Example 1: Get My Paid Payments

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragents/payments/paid?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalPaidAmount": 12000000,
  "data": [...]
}
```

### Example 2: Get My Unpaid Payments

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragents/payments/unpaid?isOverdue=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 1000000,
  "totalUnpaidAmount": 5000000,
  "overdue": {
    "totalAmount": 1000000,
    "count": 2
  },
  "data": [...]
}
```

### Example 3: Get My Payment Statistics

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragents/payments/statistics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "unpaid": {
      "totalAmount": 5000000,
      "count": 10
    },
    "paid": {
      "totalAmount": 12000000,
      "count": 25
    },
    "overdue": {
      "totalAmount": 1000000,
      "count": 2
    }
  }
}
```

### Example 4: Get My Payment by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragents/payments/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "phone": "+998901234567"
    },
    "notes": "To'lov qabul qilindi",
    "orders": [...],
    "dueDate": "2024-01-22T00:00:00.000Z",
    "isOverdue": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

## Notes

1. **Authentication Required:** All payment endpoints require a valid JWT token for contragents.

2. **Own Payments Only:** Contragents can only view their own payments. The system automatically filters payments by the authenticated contragent's ID.

3. **Payment Status:**
   - `pending` - To'lanmagan (default)
   - `paid` - To'langan (Admin tomonidan to'landi)
   - `cancelled` - Bekor qilingan

4. **Overdue Payments:**
   - Payments are automatically marked as overdue if `dueDate` passes and status is still `pending`
   - The `isOverdue` field is updated automatically when fetching unpaid payments

5. **Payment Amount:**
   - Payment amount is calculated as: `totalPrice - totalKpiPrice` from orders
   - `totalPrice` = Mijozdan olingan umumiy summa
   - `totalKpiPrice` = KPI bonus summa

6. **Date Filters:**
   - For paid payments: Filter by `paidAt` date
   - For unpaid payments: Filter by `dueDate` (not applicable in current implementation, but can be added)
   - Date format: ISO 8601 (e.g., "2024-01-01" or "2024-01-01T00:00:00.000Z")

7. **Pagination:**
   - Default page: 1
   - Default limit: 50
   - Results are sorted by:
     - Paid payments: `paidAt` descending (newest first)
     - Unpaid payments: `dueDate` ascending, then `createdAt` descending

8. **Orders Information:**
   - Each payment includes information about the orders it was created from
   - Orders are populated with: `orderNumber`, `totalPrice`, `totalKpiPrice`, `createdAt`

9. **Admin Information:**
   - For paid payments, `paidBy` field contains information about the Admin who made the payment
   - Includes: `_id`, `name`, `phone`

10. **Notifications:**
    - When Admin pays a contragent, a notification is automatically sent to the contragent
    - Notifications are sent via Socket.io (if available) and saved in the database

---

**Last Updated:** 2024-12-25  
**Versiya:** 1.0.0

