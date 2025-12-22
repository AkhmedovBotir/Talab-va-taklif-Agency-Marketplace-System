# Product API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Create Product](#1-create-product)
  - [Get My Products](#2-get-my-products)
  - [Get All Products](#3-get-all-products)
  - [Get Product by ID](#4-get-product-by-id)
  - [Update Product](#5-update-product)
  - [Update Product Status](#6-update-product-status)
  - [Delete Product](#7-delete-product)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Product Code Generation](#product-code-generation)
- [Examples](#examples)

---

## Overview

Product API provides endpoints for managing products in the system. Products can be created by Contragents, and each product includes detailed information such as pricing, images, categories, delivery regions, and KPI bonus percentages.

**Important:** All new products require moderation by Admin before they appear in the marketplace. Products are created with `moderationStatus: 'pending'` and must be approved by an Admin to be visible to marketplace users.

**Base Path:** `/api/product`

---

## Base URL

```
http://localhost:5000/api/product
```

---

## Authentication

Most endpoints require authentication using JWT token from Contragent login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required for:**
- Creating products
- Getting own products
- Updating products
- Deleting products
- Updating product status

**Not required for:**
- Getting all products (public list)
- Getting product by ID (public)

---

## Data Models

### Product Object

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
  "length": "number | null (optional, min: 0, maxsulotning bo'yi - cm yoki m)",
  "width": "number | null (optional, min: 0, maxsulotning eni - cm yoki m)",
  "weight": "number | null (optional, min: 0, maxsulotning og'irligi - kg yoki g)",
  "status": "string (enum: 'active' | 'inactive' | 'archived', default: 'active')",
  "contragent": "object (reference to Contragent, auto-set)",
  "deliveryRegions": "array of objects (viloyat, tuman)",
  "kpiBonusPercent": "number (required, 0-100)",
  "productCode": "string (auto-generated, unique)",
  "moderationStatus": "string (enum: 'pending' | 'approved' | 'rejected', default: 'pending')",
  "moderatedBy": "ObjectId | null (reference to Admin, set when moderated)",
  "moderatedAt": "Date | null (set when moderated)",
  "rejectionReason": "string | null (set when rejected, max 1000 chars)",
  "censored": "boolean (inherited from category/subcategory, default: false)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Delivery Region Object

```json
{
  "viloyat": "string (MongoDB ObjectId, reference to Region, type: 'region')",
  "tuman": "string | null (MongoDB ObjectId, reference to Region, type: 'district', optional)"
}
```

### Category Object (when populated)

```json
{
  "_id": "string",
  "name": "string",
  "slug": "string"
}
```

### Contragent Object (when populated)

```json
{
  "_id": "string",
  "name": "string",
  "inn": "string",
  "phone": "string"
}
```

### Region Object (when populated)

```json
{
  "_id": "string",
  "name": "string",
  "type": "string",
  "code": "string"
}
```

---

## Endpoints

### 1. Create Product

Create a new product. Product code is automatically generated.

**Endpoint:** `POST /api/product/create`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "name": "string (required, 2-500 chars)",
  "description": "object | null (optional, Delta format for rich text)",
  "price": "number (required, min: 0)",
  "originalPrice": "number (required, min: 0)",
  "images": "array of strings (optional, max 5, base64 format)",
  "category": "string (required, MongoDB ObjectId of Category)",
  "subcategory": "string | null (optional, MongoDB ObjectId of Category)",
  "quantity": "number (required, min: 0)",
  "unit": "string (required, 'dona' | 'litr' | 'kg')",
  "unitSize": "number | null (optional, min: 0)",
  "length": "number | null (optional, min: 0, maxsulotning bo'yi - cm yoki m)",
  "width": "number | null (optional, min: 0, maxsulotning eni - cm yoki m)",
  "weight": "number | null (optional, min: 0, maxsulotning og'irligi - kg yoki g)",
  "status": "string (optional, 'active' | 'inactive' | 'archived', default: 'active')",
  "deliveryRegions": "array (required, min 1 item, see Delivery Regions Example below)",
  "kpiBonusPercent": "number (required, 0-100)"
}
```

**Delivery Regions Example:**

```json
{
  "deliveryRegions": [
    {
      "viloyat": "507f1f77bcf86cd799439012",
      "tuman": null
    },
    {
      "viloyat": "507f1f77bcf86cd799439013",
      "tuman": "507f1f77bcf86cd799439014"
    }
  ]
}
```

**Validation Rules:**
- `name`: Required, 2-500 characters
- `description`: Optional, Delta format (object) for rich text content, can be null
- `price`: Required, number, minimum 0
- `originalPrice`: Required, number, minimum 0
- `images`: Optional, array of base64 strings, maximum 5 images
- `category`: Required, must be a valid Category ID that is:
  - Active (`status: 'active'`)
  - Created by Admin (`createdByModel: 'Admin'`)
  - Top-level category (no parent)
- `subcategory`: Optional, must be a valid Category ID that is:
  - Active (`status: 'active'`)
  - Created by Admin (`createdByModel: 'Admin'`)
  - Child of the selected category
- `censored`: Automatically inherited from category or subcategory:
  - If subcategory is selected, uses subcategory's `censored` value (which inherits from parent category)
  - If only category is selected, uses category's `censored` value
  - `censored: true` means the product is for 18+ users only
- `quantity`: Required, number, minimum 0
- `unit`: Required, must be 'dona', 'litr', or 'kg'
- `unitSize`: Optional, number, minimum 0. If provided, quantity should be in this unit format
- `length`: Optional, number, minimum 0. Maxsulotning bo'yi (cm yoki m). Unit va unitSize'dan alohida, fizik o'lcham.
- `width`: Optional, number, minimum 0. Maxsulotning eni (cm yoki m). Unit va unitSize'dan alohida, fizik o'lcham.
- `weight`: Optional, number, minimum 0. Maxsulotning og'irligi (kg yoki g). Unit va unitSize'dan alohida, fizik o'lcham.
- `status`: Optional, defaults to 'active'
- `deliveryRegions`: Required, array of objects (minimum 1 item) with viloyat (required) and tuman (optional, can be null)
- `kpiBonusPercent`: Required, number between 0 and 100

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli yaratildi va moderatsiya uchun yuborildi. Admin tomonidan tasdiqlangandan keyin marketplace ga chiqadi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
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
      "phone": "+998901234567"
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
      },
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Samarqand viloyati",
          "type": "region",
          "code": "SAM"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Samarqand tumani",
          "type": "district",
          "code": "SAM-TUM"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, invalid category/subcategory, or invalid delivery regions
- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 2. Get My Products

Get all products created by the authenticated contragent.

**Endpoint:** `GET /api/product/my`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active', 'inactive', or 'archived'
- `category` (optional) - Filter by category ID
- `subcategory` (optional) - Filter by subcategory ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
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
        "slug": "ichimliklar"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar"
      },
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "status": "active",
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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 3. Get All Products

Get all products with optional filtering and pagination. This endpoint is public.

**Endpoint:** `GET /api/product/list`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active', 'inactive', or 'archived'
- `category` (optional) - Filter by category ID
- `subcategory` (optional) - Filter by subcategory ID
- `contragent` (optional) - Filter by contragent ID
- `viloyat` (optional) - Filter by delivery viloyat ID
- `tuman` (optional) - Filter by delivery tuman ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
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
        "slug": "ichimliklar"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar"
      },
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "status": "active",
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "ABC MChJ",
        "inn": "123456789",
        "phone": "+998901234567"
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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 4. Get Product by ID

Get a specific product by its ID. This endpoint is public.

**Endpoint:** `GET /api/product/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
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
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
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
      },
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Samarqand viloyati",
          "type": "region",
          "code": "SAM"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Samarqand tumani",
          "type": "district",
          "code": "SAM-TUM"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid product ID format
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

### 5. Update Product

Update an existing product. Only the product owner (contragent) can update their products.

**Important Notes:**
- If `category` or `subcategory` is changed, the `censored` field is automatically updated based on the new category/subcategory, and `moderationStatus` is reset to `pending` (requires re-approval by Admin).
- The `censored` field cannot be manually set - it is always inherited from the selected category or subcategory.

**Endpoint:** `PUT /api/product/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-500 chars)",
  "description": "object | null (optional, Delta format for rich text)",
  "price": "number (optional, min: 0)",
  "originalPrice": "number (optional, min: 0)",
  "images": "array of strings (optional, max 5)",
  "category": "string (optional, MongoDB ObjectId - must be Admin-created and active)",
  "subcategory": "string | null (optional, MongoDB ObjectId - must be Admin-created and active)",
  "quantity": "number (optional, min: 0)",
  "unit": "string (optional, 'dona' | 'litr' | 'kg')",
  "unitSize": "number | null (optional, min: 0)",
  "length": "number | null (optional, min: 0, maxsulotning bo'yi - cm yoki m)",
  "width": "number | null (optional, min: 0, maxsulotning eni - cm yoki m)",
  "weight": "number | null (optional, min: 0, maxsulotning og'irligi - kg yoki g)",
  "status": "string (optional, 'active' | 'inactive' | 'archived')",
  "deliveryRegions": "array (optional, min 1 item if provided)",
  "kpiBonusPercent": "number (optional, 0-100)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L (Updated)",
    "description": {
      "ops": [
        {"insert": "Yangilangan maxsulot tavsifi.\n"}
      ]
    },
    "price": 16000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
    },
    "quantity": 25,
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
      "phone": "+998901234567"
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
    "kpiBonusPercent": 6,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, invalid category/subcategory, or invalid delivery regions
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not the owner of this product
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

### 6. Update Product Status

Update only the status of a product. Only the product owner can update status.

**Endpoint:** `PUT /api/product/:id/status`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Request Body:**

```json
{
  "status": "string (required, 'active' | 'inactive' | 'archived')"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
    },
    "quantity": 20,
    "unit": "dona",
    "unitSize": 1.5,
    "status": "inactive",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "ABC MChJ",
      "inn": "123456789",
      "phone": "+998901234567"
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
      },
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Samarqand viloyati",
          "type": "region",
          "code": "SAM"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Samarqand tumani",
          "type": "district",
          "code": "SAM-TUM"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid status value or invalid ID
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not the owner of this product
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

### 7. Delete Product

Delete a product. Only the product owner can delete their products.

**Endpoint:** `DELETE /api/product/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid product ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not the owner of this product
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Xato xabari",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not authorized to perform this action
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validatsiya xatosi",
  "errors": [
    {
      "field": "name",
      "message": "Maxsulot nomi kiritilishi shart"
    }
  ]
}
```

#### Invalid Category (400)

```json
{
  "success": false,
  "message": "Kategoriya topilmadi"
}
```

#### Invalid Subcategory (400)

```json
{
  "success": false,
  "message": "Sub kategoriya tanlangan kategoriyaga tegishli emas"
}
```

#### Not Owner (403)

```json
{
  "success": false,
  "message": "Bu maxsulotni yangilash huquqiga ega emassiz"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Maxsulot topilmadi"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 2 characters
- **Max Length:** 500 characters
- **Trim:** Yes

### Price
- **Type:** Number
- **Required:** Yes (for create)
- **Min Value:** 0

### Original Price
- **Type:** Number
- **Required:** Yes (for create)
- **Min Value:** 0

### Images
- **Type:** Array of Strings (base64)
- **Required:** No
- **Max Items:** 5
- **Format:** Base64 encoded image strings

### Category
- **Type:** MongoDB ObjectId (reference to Category)
- **Required:** Yes (for create)
- **Description:** Must be a valid Category ID

### Subcategory
- **Type:** MongoDB ObjectId (reference to Category) or null
- **Required:** No
- **Description:** Must be a valid Category ID and a child of the selected category

### Quantity
- **Type:** Number
- **Required:** Yes (for create)
- **Min Value:** 0
- **Description:** If `unitSize` is provided, quantity should be in that unit format (e.g., if unitSize is 1.5L, quantity of 20 means 20 bottles of 1.5L)

### Unit
- **Type:** String (enum)
- **Required:** Yes (for create)
- **Allowed Values:** `'dona'`, `'litr'`, `'kg'`

### Unit Size
- **Type:** Number or null
- **Required:** No
- **Min Value:** 0 (if provided)
- **Description:** The size of each unit. For example, if unit is 'litr' and unitSize is 1.5, then quantity of 20 means 20 bottles of 1.5 liters each.

### Length (Bo'yi)
- **Type:** Number or null
- **Required:** No
- **Min Value:** 0 (if provided)
- **Description:** Maxsulotning bo'yi (cm yoki m). Unit va unitSize'dan alohida, maxsulotning fizik o'lchami. Maxsulot hajmini hisoblash uchun ishlatiladi.

### Width (Eni)
- **Type:** Number or null
- **Required:** No
- **Min Value:** 0 (if provided)
- **Description:** Maxsulotning eni (cm yoki m). Unit va unitSize'dan alohida, maxsulotning fizik o'lchami. Maxsulot hajmini hisoblash uchun ishlatiladi.

### Weight (Og'irligi)
- **Type:** Number or null
- **Required:** No
- **Min Value:** 0 (if provided)
- **Description:** Maxsulotning og'irligi (kg yoki g). Unit va unitSize'dan alohida, maxsulotning fizik o'lchami. Maxsulot hajmini hisoblash uchun ishlatiladi.

### Status
- **Type:** String (enum)
- **Required:** Yes (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`, `'archived'`
- **Default:** `'active'`

### Delivery Regions
- **Type:** Array of Objects
- **Required:** Yes (for create), Optional (for update)
- **Min Items:** 1
- **Structure:**
  ```json
  {
    "viloyat": "string (required, MongoDB ObjectId of Region, type: 'region')",
    "tuman": "string | null (optional, MongoDB ObjectId of Region, type: 'district')"
  }
  ```
- **Description:** Can specify multiple delivery regions. Each region must have a viloyat, and optionally a tuman (can be null). If tuman is provided, it must be a child of the viloyat. At least one delivery region is required when creating a product.

### KPI Bonus Percent
- **Type:** Number
- **Required:** Yes (for create)
- **Min Value:** 0
- **Max Value:** 100
- **Description:** Percentage of bonus from the price for sellers

### Product Code
- **Type:** String
- **Auto-generated:** Yes
- **Format:** Sequential code starting from '001', '002', etc. If numbers exceed 999, letters are appended (e.g., '001a', '001b')
- **Unique:** Yes (per contragent)

---

## Product Code Generation

Product codes are automatically generated for each contragent. The system follows this pattern:

1. **First product:** `001`
2. **Subsequent products:** `002`, `003`, ..., `999`
3. **After 999:** `001a`, `002a`, ..., `999a`
4. **After 999a:** `001b`, `002b`, ..., `999b`
5. **And so on...**

The code is unique per contragent and is generated based on the last product code for that contragent. If a code already exists (due to deletions or other reasons), the system will find the next available code.

**Example sequence:**
- Product 1: `001`
- Product 2: `002`
- ...
- Product 999: `999`
- Product 1000: `001a`
- Product 1001: `002a`
- ...
- Product 1998: `999a`
- Product 1999: `001b`

---

## Examples

### Example 1: Create Product

**Request:**

```bash
curl -X POST http://localhost:5000/api/product/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."],
    "category": "507f1f77bcf86cd799439012",
    "subcategory": "507f1f77bcf86cd799439013",
    "quantity": 20,
    "unit": "dona",
    "unitSize": 1.5,
    "length": 30,
    "width": 10,
    "weight": 1.5,
    "status": "active",
    "deliveryRegions": [
      {
        "viloyat": "507f1f77bcf86cd799439015",
        "tuman": null
      },
      {
        "viloyat": "507f1f77bcf86cd799439016",
        "tuman": "507f1f77bcf86cd799439017"
      }
    ],
    "kpiBonusPercent": 5
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
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
      "phone": "+998901234567"
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
      },
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Samarqand viloyati",
          "type": "region",
          "code": "SAM"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Samarqand tumani",
          "type": "district",
          "code": "SAM-TUM"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 2: Get My Products

**Request:**

```bash
curl -X GET "http://localhost:5000/api/product/my?page=1&limit=10&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
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
        "slug": "ichimliklar"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar"
      },
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "status": "active",
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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 3: Get All Products (Filtered)

**Request:**

```bash
curl -X GET "http://localhost:5000/api/product/list?category=507f1f77bcf86cd799439012&status=active&viloyat=507f1f77bcf86cd799439015"
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 10,
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
        "slug": "ichimliklar"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar"
      },
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "status": "active",
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "ABC MChJ",
        "inn": "123456789",
        "phone": "+998901234567"
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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 4: Update Product

**Request:**

```bash
curl -X PUT http://localhost:5000/api/product/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 16000,
    "quantity": 25,
    "kpiBonusPercent": 6
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 16000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
    },
    "quantity": 25,
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
      "phone": "+998901234567"
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
    "kpiBonusPercent": 6,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 5: Update Product Status

**Request:**

```bash
curl -X PUT http://localhost:5000/api/product/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "archived"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar"
    },
    "quantity": 20,
    "unit": "dona",
    "unitSize": 1.5,
    "status": "archived",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "ABC MChJ",
      "inn": "123456789",
      "phone": "+998901234567"
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
      },
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Samarqand viloyati",
          "type": "region",
          "code": "SAM"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "Samarqand tumani",
          "type": "district",
          "code": "SAM-TUM"
        }
      }
    ],
    "kpiBonusPercent": 5,
    "productCode": "001",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 6: Delete Product

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/product/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot muvaffaqiyatli o'chirildi"
}
```

---

## Notes

1. **Product Code:** Product codes are automatically generated and are unique per contragent. The code starts from '001' and increments sequentially. After '999', letters are appended (e.g., '001a', '001b').

2. **Images:** Images should be provided as base64 encoded strings. Maximum 5 images per product.

3. **Unit Size:** If `unitSize` is provided, the `quantity` should be interpreted in that unit format. For example, if `unit` is 'litr' and `unitSize` is 1.5, then `quantity` of 20 means 20 bottles of 1.5 liters each.

4. **Delivery Regions:** You can specify multiple delivery regions (minimum 1 required when creating). Each region must have a viloyat, and optionally a tuman (can be null). If tuman is provided, it must be a child of the viloyat. Example: `[{viloyat: id, tuman: id}, {viloyat: id, tuman: null}]`

5. **KPI Bonus Percent:** This is the percentage of bonus from the price that sellers will receive. It should be between 0 and 100.

6. **Ownership:** Only the contragent who created a product can update or delete it. The system automatically checks ownership before allowing updates or deletions.

7. **Status Values:**
   - `active`: Product is active and available
   - `inactive`: Product is temporarily unavailable
   - `archived`: Product is archived (not shown in regular listings)

8. **Pagination:** The `getAllProducts` and `getMyProducts` endpoints support pagination with `page` and `limit` query parameters.

9. **Filtering:** You can filter products by status, category, subcategory, contragent, and delivery regions (viloyat, tuman).

---

**Last Updated:** 2024-01-15


