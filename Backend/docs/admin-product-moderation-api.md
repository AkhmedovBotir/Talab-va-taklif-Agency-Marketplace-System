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
  - [Update Product](#6-update-product)
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

### 6. Update Product

Update any product in the system. Admin can update any product regardless of which Contragent owns it.

**Endpoint:** `PUT /api/admins/products/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-500 characters)",
  "description": "object | string | null (optional, Delta format for rich text)",
  "price": "number (optional, min: 0)",
  "originalPrice": "number (optional, min: 0)",
  "images": "array of strings (optional, max 5, base64 format)",
  "category": "string (optional, Category ObjectId)",
  "subcategory": "string | null (optional, Category ObjectId)",
  "quantity": "number (optional, min: 0)",
  "unit": "string (optional, enum: 'dona' | 'litr' | 'kg')",
  "unitSize": "number | null (optional, min: 0)",
  "length": "number | null (optional, min: 0)",
  "width": "number | null (optional, min: 0)",
  "weight": "number | null (optional, min: 0)",
  "status": "string (optional, enum: 'active' | 'inactive' | 'archived')",
  "deliveryRegions": "array of objects (optional, viloyat, tuman)",
  "kpiBonusPercent": "number (optional, 0-100)",
  "moderationStatus": "string (optional, enum: 'pending' | 'approved' | 'rejected')"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Maxsulot nomi (2-500 belgi) |
| `description` | object/string/null | No | Maxsulot tavsifi (Delta format yoki null) |
| `price` | number | No | Narx (min: 0) |
| `originalPrice` | number | No | Asl narx (min: 0) |
| `images` | array | No | Rasmlar (maksimal 5 ta, base64 format) |
| `category` | string (ObjectId) | No | Kategoriya ID (faqat Admin tomonidan yaratilgan va active) |
| `subcategory` | string/null (ObjectId) | No | Sub kategoriya ID yoki null (faqat Admin tomonidan yaratilgan va active) |
| `quantity` | number | No | Miqdor (min: 0) |
| `unit` | string | No | Birlik ('dona', 'litr', 'kg') |
| `unitSize` | number/null | No | Birlik o'lchami (min: 0) |
| `length` | number/null | No | Bo'yi (cm yoki m, min: 0) |
| `width` | number/null | No | Eni (cm yoki m, min: 0) |
| `weight` | number/null | No | Og'irligi (kg yoki g, min: 0) |
| `status` | string | No | Status ('active', 'inactive', 'archived') |
| `deliveryRegions` | array | No | Yetkazib berish xududlari (kamida 1 ta) |
| `kpiBonusPercent` | number | No | KPI bonus foizi (0-100) |
| `moderationStatus` | string | No | Moderation status ('pending', 'approved', 'rejected') |

**Important Notes:**
- **Category/Subcategory Validation:** Only categories/subcategories created by Admin and with `status: 'active'` can be used
- **Censored Inheritance:** `censored` field is automatically inherited from category or subcategory
- **Moderation Status Reset:** If `category` or `subcategory` is changed and `moderationStatus` is not explicitly set, it will be reset to `'pending'`
- **Delivery Regions:** Each region must have `viloyat` (required) and `tuman` (optional, can be null). Tuman must belong to the selected viloyat

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L (Updated)",
    "description": null,
    "price": 16000,
    "originalPrice": 18000,
    "images": ["base64image1", "base64image2"],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "status": "active",
      "image": "category-image-url",
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
    "quantity": 100,
    "unit": "dona",
    "unitSize": 1.5,
    "length": null,
    "width": null,
    "weight": null,
    "status": "active",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "O'zbekiston Tijorat MChJ",
      "inn": "123456789",
      "phone": "+998901234567",
      "viloyat": "507f1f77bcf86cd799439015",
      "tuman": "507f1f77bcf86cd799439016",
      "mfy": "507f1f77bcf86cd799439017"
    },
    "deliveryRegions": [
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439019",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "1001"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "moderationStatus": "approved",
    "moderatedBy": null,
    "moderatedAt": null,
    "rejectionReason": null,
    "censored": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error (invalid category/subcategory, invalid delivery regions, etc.)
- **404 Not Found** - Product not found
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

**Example Request:**

```bash
curl -X PUT "http://localhost:5000/api/admins/products/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 1.5L (Updated)",
    "price": 16000,
    "originalPrice": 18000,
    "quantity": 100,
    "status": "active",
    "moderationStatus": "approved"
  }'
```

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

### Update Product

All fields are optional. Only include fields you want to update.

- `name`: String, 2-500 characters, trimmed
- `description`: String, object (Delta format), or null
- `price`: Number, minimum 0
- `originalPrice`: Number, minimum 0
- `images`: Array of strings, maximum 5 items
- `category`: String (ObjectId), must be Admin-created and active
- `subcategory`: String (ObjectId) or null, must be Admin-created, active, and belong to category
- `quantity`: Number, minimum 0
- `unit`: String, must be one of: 'dona', 'litr', 'kg'
- `unitSize`: Number (min: 0) or null
- `length`: Number (min: 0) or null
- `width`: Number (min: 0) or null
- `weight`: Number (min: 0) or null
- `status`: String, must be one of: 'active', 'inactive', 'archived'
- `deliveryRegions`: Array of objects, minimum 1 item
  - Each region must have `viloyat` (required, ObjectId)
  - Each region can have `tuman` (optional, ObjectId or null)
  - Tuman must belong to the selected viloyat
- `kpiBonusPercent`: Number, 0-100
- `moderationStatus`: String, must be one of: 'pending', 'approved', 'rejected'

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

### Example 5: Update Product

```bash
curl -X PUT "http://localhost:5000/api/admins/products/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 1.5L (Updated)",
    "price": 16000,
    "originalPrice": 18000,
    "quantity": 100,
    "status": "active",
    "moderationStatus": "approved"
  }'
```

### Example 6: Update Product with Category Change

```bash
curl -X PUT "http://localhost:5000/api/admins/products/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "category": "507f1f77bcf86cd799439012",
    "subcategory": "507f1f77bcf86cd799439013",
    "deliveryRegions": [
      {
        "viloyat": "507f1f77bcf86cd799439018",
        "tuman": "507f1f77bcf86cd799439019"
      }
    ]
  }'
```

**Note:** When category or subcategory is changed, `moderationStatus` will be automatically reset to `'pending'` unless explicitly set in the request.

### Example 5: Update Product

```bash
curl -X PUT "http://localhost:5000/api/admins/products/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 1.5L (Updated)",
    "price": 16000,
    "originalPrice": 18000,
    "quantity": 100,
    "status": "active",
    "moderationStatus": "approved"
  }'
```

### Example 6: Update Product with Category Change

```bash
curl -X PUT "http://localhost:5000/api/admins/products/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "category": "507f1f77bcf86cd799439012",
    "subcategory": "507f1f77bcf86cd799439013",
    "deliveryRegions": [
      {
        "viloyat": "507f1f77bcf86cd799439018",
        "tuman": "507f1f77bcf86cd799439019"
      }
    ]
  }'
```

**Note:** When category or subcategory is changed, `moderationStatus` will be automatically reset to `'pending'` unless explicitly set in the request.

### Example 7: Get All Approved Products

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

