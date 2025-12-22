# Admin Product Moderation API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get Pending Products](#1-get-pending-products)
  - [Get Pending Product by ID](#2-get-pending-product-by-id)
  - [Get All Products with Moderation Filter](#3-get-all-products-with-moderation-filter)
  - [Approve Product](#4-approve-product)
  - [Reject Product](#5-reject-product)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Admin Product Moderation API provides endpoints for Admins to review, approve, or reject products submitted by Contragents. All new products created by Contragents require moderation before they appear in the marketplace.

**Workflow:**
1. Contragent creates a product → `moderationStatus: 'pending'`
2. Admin reviews the product
3. Admin approves → `moderationStatus: 'approved'` → Product appears in marketplace
4. Admin rejects → `moderationStatus: 'rejected'` → Product does not appear in marketplace

**Base Path:** `/api/admins/products/moderation`

---

## Base URL

```
http://localhost:5000/api/admins/products/moderation
```

---

## Authentication

All endpoints require Admin authentication using JWT token from Admin login.

**Format:** `Authorization: Bearer <token>`

**Required for:** All endpoints

---

## Data Models

### Product Object (with Moderation Fields)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required, 2-500 characters)",
  "description": "object | null (optional, Delta format for rich text)",
  "price": "number (required, min: 0)",
  "originalPrice": "number (required, min: 0)",
  "images": "array of strings (max 5, base64 format)",
  "category": "object (reference to Category)",
  "subcategory": "object | null (reference to Category)",
  "quantity": "number (required, min: 0)",
  "unit": "string (enum: 'dona' | 'litr' | 'kg')",
  "unitSize": "number | null (optional, min: 0)",
  "length": "number | null (optional, min: 0)",
  "width": "number | null (optional, min: 0)",
  "weight": "number | null (optional, min: 0)",
  "status": "string (enum: 'active' | 'inactive' | 'archived', default: 'active')",
  "contragent": "object (reference to Contragent)",
  "deliveryRegions": "array of objects (viloyat, tuman)",
  "kpiBonusPercent": "number (required, 0-100)",
  "productCode": "string (auto-generated, unique)",
  "moderationStatus": "string (enum: 'pending' | 'approved' | 'rejected', default: 'pending')",
  "moderatedBy": "ObjectId | null (reference to Admin, set when moderated)",
  "moderatedAt": "Date | null (set when moderated)",
  "rejectionReason": "string | null (set when rejected, max 1000 chars)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Category Object (when populated)

```json
{
  "_id": "string",
  "name": "string",
  "slug": "string",
  "status": "string (enum: 'active' | 'inactive')",
  "image": "string | null",
  "censored": "boolean"
}
```

### Contragent Object (when populated)

```json
{
  "_id": "string",
  "name": "string",
  "inn": "string",
  "phone": "string",
  "viloyat": "object | null",
  "tuman": "object | null",
  "mfy": "object | null"
}
```

### Admin Object (when populated - moderatedBy)

```json
{
  "_id": "string",
  "name": "string",
  "username": "string",
  "telefonRaqam": "string"
}
```

---

## Endpoints

### 1. Get Pending Products

Get all products that are pending moderation.

**Endpoint:** `GET /api/admins/products/moderation/pending`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `contragent` (optional) - Filter by contragent ID
- `category` (optional) - Filter by category ID
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

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
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "price": 15000,
      "originalPrice": 12000,
      "images": ["data:image/jpeg;base64,..."],
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar",
        "status": "active",
        "image": "data:image/png;base64,...",
        "censored": false
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active",
        "image": null,
        "censored": false
      },
      "quantity": 20,
      "unit": "dona",
      "status": "active",
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "ABC MChJ",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "moderationStatus": "pending",
      "moderatedBy": null,
      "moderatedAt": null,
      "rejectionReason": null,
      "productCode": "001",
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

### 2. Get Pending Product by ID

Get a specific pending product by its ID.

**Endpoint:** `GET /api/admins/products/moderation/pending/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "description": null,
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "status": "active",
      "image": "data:image/png;base64,...",
      "censored": false
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar",
      "status": "active",
      "image": null,
      "censored": false
    },
    "quantity": 20,
    "unit": "dona",
    "unitSize": 1.5,
    "length": 30,
    "width": 10,
    "weight": 1.5,
    "status": "active",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "ABC MChJ",
      "inn": "123456789",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent",
        "type": "region",
        "code": "01"
      }
    },
    "deliveryRegions": [
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": null
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "moderationStatus": "pending",
    "moderatedBy": null,
    "moderatedAt": null,
    "rejectionReason": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid product ID format
- **404 Not Found** - Product not found or not pending
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

### 3. Get All Products with Moderation Filter

Get all products with optional moderation status filter.

**Endpoint:** `GET /api/admins/products/moderation`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `moderationStatus` (optional) - Filter by moderation status: `pending`, `approved`, `rejected`
- `contragent` (optional) - Filter by contragent ID
- `category` (optional) - Filter by category ID
- `status` (optional) - Filter by product status: `active`, `inactive`, `archived`
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 20,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "price": 15000,
      "moderationStatus": "approved",
      "moderatedBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "moderatedAt": "2024-01-15T11:00:00.000Z",
      "rejectionReason": null,
      "productCode": "001",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

### 4. Approve Product

Approve a pending product. Once approved, the product will appear in the marketplace.

**Endpoint:** `POST /api/admins/products/moderation/:id/approve`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli tasdiqlandi va marketplace ga qo'shildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "moderationStatus": "approved",
    "moderatedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "username": "admin",
      "telefonRaqam": "+998901234567"
    },
    "moderatedAt": "2024-01-15T11:00:00.000Z",
    "rejectionReason": null,
    "productCode": "001",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Product is not pending (already approved or rejected)
- **404 Not Found** - Product not found
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

### 5. Reject Product

Reject a pending product. Rejected products do not appear in the marketplace.

**Endpoint:** `POST /api/admins/products/moderation/:id/reject`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Request Body:**

```json
{
  "rejectionReason": "string (required, 1-1000 characters)"
}
```

**Validation Rules:**
- `rejectionReason`: Required, string, 1-1000 characters, trimmed

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot rad etildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "moderationStatus": "rejected",
    "moderatedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin User",
      "username": "admin",
      "telefonRaqam": "+998901234567"
    },
    "moderatedAt": "2024-01-15T11:00:00.000Z",
    "rejectionReason": "Rasm sifatida yoki kategoriya noto'g'ri",
    "productCode": "001",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Product is not pending, or validation error (missing/invalid rejectionReason)
- **404 Not Found** - Product not found
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

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

### Reject Product

- `rejectionReason`: 
  - Required
  - String type
  - Minimum 1 character
  - Maximum 1000 characters
  - Automatically trimmed

---

## Examples

### Example 1: Get All Pending Products

```bash
curl -X GET "http://localhost:5000/api/admins/products/moderation/pending?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get Pending Product by ID

```bash
curl -X GET "http://localhost:5000/api/admins/products/moderation/pending/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Approve Product

```bash
curl -X POST "http://localhost:5000/api/admins/products/moderation/507f1f77bcf86cd799439011/approve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Reject Product

```bash
curl -X POST "http://localhost:5000/api/admins/products/moderation/507f1f77bcf86cd799439011/reject" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Rasm sifatida yoki kategoriya noto'\''g'\''ri"
  }'
```

### Example 5: Get All Approved Products

```bash
curl -X GET "http://localhost:5000/api/admins/products/moderation?moderationStatus=approved&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 6: Get All Rejected Products

```bash
curl -X GET "http://localhost:5000/api/admins/products/moderation?moderationStatus=rejected&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Moderation Workflow:**
   - New products are created with `moderationStatus: 'pending'`
   - Only products with `moderationStatus: 'approved'` appear in the marketplace
   - Rejected products do not appear in the marketplace but remain in the database

2. **Moderation Status:**
   - `pending`: Product is waiting for admin review
   - `approved`: Product has been approved and appears in marketplace
   - `rejected`: Product has been rejected and does not appear in marketplace

3. **Moderation Fields:**
   - `moderatedBy`: Set to the Admin ID when product is approved or rejected
   - `moderatedAt`: Set to the current date/time when product is approved or rejected
   - `rejectionReason`: Set only when product is rejected, contains the reason for rejection

4. **Category Requirements:**
   - Products can only use categories and subcategories that are:
     - Active (`status: 'active'`)
     - Created by Admin (`createdByModel: 'Admin'`)
   - Categories must be top-level (no parent)
   - Subcategories must be children of the selected category

5. **Marketplace Visibility:**
   - Only products with `moderationStatus: 'approved'` and `status: 'active'` are visible in marketplace
   - Pending and rejected products are not visible to marketplace users

