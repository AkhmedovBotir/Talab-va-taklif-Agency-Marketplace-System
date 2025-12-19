# Admin Data API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get All Categories](#1-get-all-categories)
  - [Get Category by ID](#2-get-category-by-id)
  - [Get All Subcategories](#3-get-all-subcategories)
  - [Get All Products](#4-get-all-products)
  - [Get Product by ID](#5-get-product-by-id)
  - [Get All SMS Verifications](#6-get-all-sms-verifications)
  - [Get SMS Verification by ID](#7-get-sms-verification-by-id)
  - [Get All Marketplace Users](#8-get-all-marketplace-users)
  - [Get Marketplace User by ID](#9-get-marketplace-user-by-id)
  - [Get All Orders](#10-get-all-orders)
  - [Get Order by ID](#11-get-order-by-id)
  - [Get Marketplace Orders](#12-get-marketplace-orders)
  - [Get Orders Delivered to Punkt](#13-get-orders-delivered-to-punkt)
  - [Get Orders Assigned to Agents](#14-get-orders-assigned-to-agents)
  - [Get Orders Confirmed by Agents](#15-get-orders-confirmed-by-agents)
  - [Get Orders Confirmed by Customers](#16-get-orders-confirmed-by-customers)
  - [Get Cancelled Orders](#17-get-cancelled-orders)
- [Filtering Options](#filtering-options)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin Data API provides endpoints for administrators to view and filter categories, subcategories, and products with full details. These endpoints are read-only and provide comprehensive filtering options.

**Base Path:** `/api/admins/data`

**Note:** All endpoints require admin authentication.

---

## Base URL

```
http://localhost:5000/api/admins/data
```

---

## Authentication

All endpoints require authentication using JWT token from Admin login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required User Type:** `admin`

---

## Endpoints

### 1. Get All Categories

Get all top-level categories with full details including subcategories and creator information.

**Endpoint:** `GET /api/admins/data/categories`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 100) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `includeSubcategories` (optional) - Boolean ('true' | 'false') to include populated subcategories (default: false)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Gazlangan ichimliklar",
          "slug": "gazlangan-ichimliklar",
          "status": "active",
          "createdBy": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Test Contragent",
            "inn": "123456789",
            "phone": "+998901234567"
          },
          "createdByModel": "Contragent",
          "createdAt": "2024-01-15T10:35:00.000Z",
          "updatedAt": "2024-01-15T10:35:00.000Z"
        }
      ]
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 2. Get Category by ID

Get a specific category by its ID with full details including subcategories and creator information.

**Endpoint:** `GET /api/admins/data/categories/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Ichimliklar",
    "slug": "ichimliklar",
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Test Contragent",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active",
        "createdBy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Test Contragent",
          "inn": "123456789",
          "phone": "+998901234567"
        },
        "createdByModel": "Contragent",
        "createdAt": "2024-01-15T10:35:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid category ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

---

### 3. Get All Subcategories

Get all subcategories with full details including parent category and creator information.

**Endpoint:** `GET /api/admins/data/subcategories`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 100) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `parent` (optional) - Filter by parent category ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar",
      "parent": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar",
        "status": "active"
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 4. Get All Products

Get all products with full details and advanced filtering options. This endpoint provides comprehensive filtering capabilities for administrators.

**Endpoint:** `GET /api/admins/data/products`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

#### Basic Filters:
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page
- `status` (optional) - Filter by status: 'active', 'inactive', or 'archived'
- `category` (optional) - Filter by category ID
- `subcategory` (optional) - Filter by subcategory ID
- `contragent` (optional) - Filter by contragent ID

#### Delivery Region Filters:
- `viloyat` (optional) - Filter by delivery viloyat ID
- `tuman` (optional) - Filter by delivery tuman ID

#### Price Filters:
- `minPrice` (optional) - Minimum price (number)
- `maxPrice` (optional) - Maximum price (number)

#### Quantity Filters:
- `minQuantity` (optional) - Minimum quantity (number)
- `maxQuantity` (optional) - Maximum quantity (number)

#### Other Filters:
- `unit` (optional) - Filter by unit: 'dona', 'litr', or 'kg'
- `search` (optional) - Search by product name or product code (case-insensitive)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "description": {
        "ops": [
          {"insert": "Coca Cola - dunyoning eng mashhur gazlangan ichimligi.\n"}
        ]
      },
      "price": 15000,
      "originalPrice": 12000,
      "images": ["data:image/jpeg;base64,..."],
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar",
        "status": "active"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active"
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
        "status": "active",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Toshkent tumani",
          "type": "district",
          "code": "TASH-TUM"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY-1"
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
            "_id": "507f1f77bcf86cd799439018",
            "name": "Samarqand viloyati",
            "type": "region",
            "code": "SAM"
          },
          "tuman": {
            "_id": "507f1f77bcf86cd799439019",
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
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 5. Get Product by ID

Get a specific product by its ID with full details including all populated fields.

**Endpoint:** `GET /api/admins/data/products/:id`

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
    "description": {
      "ops": [
        {"insert": "Coca Cola - dunyoning eng mashhur gazlangan ichimligi.\n"}
      ]
    },
    "price": 15000,
    "originalPrice": 12000,
    "images": ["data:image/jpeg;base64,..."],
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "status": "active"
    },
    "subcategory": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Gazlangan ichimliklar",
      "slug": "gazlangan-ichimliklar",
      "status": "active"
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
      "status": "active",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
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
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid product ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

### 6. Get All SMS Verifications

Get all SMS verification records with full details including phone number, code, type, and status. This endpoint allows admins to monitor SMS activity.

**Endpoint:** `GET /api/admins/data/sms-verifications`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page
- `phone` (optional) - Filter by phone number (partial match, case-insensitive)
- `type` (optional) - Filter by type: 'login', 'register', or 'forgot_password'
- `isUsed` (optional) - Filter by usage status: 'true' or 'false'
- `startDate` (optional) - Filter by start date (ISO 8601 format)
- `endDate` (optional) - Filter by end date (ISO 8601 format)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+998901234567",
      "code": "12345",
      "type": "register",
      "isUsed": false,
      "expiresAt": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "phone": "+998901234567",
      "code": "67890",
      "type": "login",
      "isUsed": true,
      "expiresAt": "2024-01-15T11:35:00.000Z",
      "createdAt": "2024-01-15T11:30:00.000Z",
      "updatedAt": "2024-01-15T11:32:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 7. Get SMS Verification by ID

Get a specific SMS verification record by its ID with full details.

**Endpoint:** `GET /api/admins/data/sms-verifications/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the SMS verification

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+998901234567",
    "code": "12345",
    "type": "register",
    "isUsed": false,
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid SMS verification ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - SMS verification not found
- **500 Internal Server Error** - Server error

---

## Filtering Options

### Product Filters

The `GET /api/admins/data/products` endpoint supports comprehensive filtering:

#### Status Filter
- Filter by product status: `?status=active`, `?status=inactive`, or `?status=archived`

#### Category Filters
- Filter by category: `?category=507f1f77bcf86cd799439012`
- Filter by subcategory: `?subcategory=507f1f77bcf86cd799439013`

#### Contragent Filter
- Filter by contragent: `?contragent=507f1f77bcf86cd799439014`

#### Delivery Region Filters
- Filter by viloyat: `?viloyat=507f1f77bcf86cd799439015`
- Filter by tuman: `?tuman=507f1f77bcf86cd799439016`

#### Price Range Filters
- Minimum price: `?minPrice=10000`
- Maximum price: `?maxPrice=20000`
- Price range: `?minPrice=10000&maxPrice=20000`

#### Quantity Range Filters
- Minimum quantity: `?minQuantity=10`
- Maximum quantity: `?maxQuantity=100`
- Quantity range: `?minQuantity=10&maxQuantity=100`

#### Unit Filter
- Filter by unit: `?unit=dona`, `?unit=litr`, or `?unit=kg`

#### Search Filter
- Search by name or product code: `?search=coca`
- Case-insensitive search

#### Combined Filters
You can combine multiple filters:
```
?status=active&category=507f1f77bcf86cd799439012&minPrice=10000&maxPrice=20000&search=coca
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Xato xabari"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid input or ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Unauthorized (401)

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
  "message": "Sizda bu amalni bajarish uchun ruxsat yo'q"
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

## Examples

### Example 1: Get All Categories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/categories?includeSubcategories=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Gazlangan ichimliklar",
          "slug": "gazlangan-ichimliklar",
          "status": "active"
        }
      ]
    }
  ]
}
```

### Example 2: Get Products with Multiple Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?status=active&category=507f1f77bcf86cd799439012&minPrice=10000&maxPrice=20000&search=coca&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "price": 15000,
      "originalPrice": 12000,
      "status": "active",
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar"
      },
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "ABC MChJ",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "productCode": "001"
    }
  ]
}
```

### Example 3: Get Products by Contragent and Delivery Region

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?contragent=507f1f77bcf86cd799439014&viloyat=507f1f77bcf86cd799439015" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Products with Quantity Range

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?minQuantity=10&maxQuantity=50&unit=dona" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Get All SMS Verifications

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications?type=login&isUsed=false&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+998901234567",
      "code": "12345",
      "type": "login",
      "isUsed": false,
      "expiresAt": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "phone": "+998901234568",
      "code": "67890",
      "type": "login",
      "isUsed": false,
      "expiresAt": "2024-01-15T11:35:00.000Z",
      "createdAt": "2024-01-15T11:30:00.000Z",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  ]
}
```

### Example 6: Get SMS Verifications by Phone and Date Range

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications?phone=998901234567&startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 7: Get SMS Verification by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+998901234567",
    "code": "12345",
    "type": "register",
    "isUsed": true,
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:32:00.000Z"
  }
}
```

### Example 8: Get All Marketplace Users

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users?status=active&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "data": [...]
}
```

### Example 9: Get Marketplace Users with Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users?viloyat=507f1f77bcf86cd799439015&gender=erkak&isPhoneVerified=true&search=Ali" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 10: Get Marketplace User by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users/507f1f77bcf86cd799439021" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "phone": "+998901234567",
    "gender": "erkak",
    "viloyat": {...},
    "tuman": {...},
    "mfy": {...},
    "birthDate": "1990-01-15T00:00:00.000Z",
    "isPhoneVerified": true,
    "avatar": "data:image/jpeg;base64,...",
    "status": "active"
  }
}
```

---

### 8. Get All Marketplace Users

Get all marketplace users with filtering and pagination options.

**Endpoint:** `GET /api/admins/data/marketplace-users`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by status: `'active'` or `'inactive'`
- `viloyat` (optional) - Filter by region ID
- `tuman` (optional) - Filter by district ID
- `mfy` (optional) - Filter by MFY ID
- `isPhoneVerified` (optional) - Filter by phone verification status: `'true'` or `'false'`
- `gender` (optional) - Filter by gender: `'ayol'` or `'erkak'`
- `search` (optional) - Search in firstName, lastName, or phone (case-insensitive)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "gender": "erkak",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent",
        "type": "region",
        "code": "01"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod",
        "type": "district",
        "code": "0101"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "010101"
      },
      "birthDate": "1990-01-15T00:00:00.000Z",
      "isPhoneVerified": true,
      "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 9. Get Marketplace User by ID

Get a specific marketplace user by their ID with full details.

**Endpoint:** `GET /api/admins/data/marketplace-users/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the marketplace user

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "phone": "+998901234567",
    "gender": "erkak",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent",
      "type": "region",
      "code": "01"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Yunusobod",
      "type": "district",
      "code": "0101"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "MFY 1",
      "type": "mfy",
      "code": "010101"
    },
    "birthDate": "1990-01-15T00:00:00.000Z",
    "isPhoneVerified": true,
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid user ID format
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

## Notes

1. **Authentication:** All endpoints require admin authentication. Make sure to include a valid JWT token in the Authorization header.

2. **Pagination:** All list endpoints support pagination with `page` and `limit` query parameters.

3. **Filtering:** Multiple filters can be combined. All filters are optional.

4. **Search:** 
   - For products: searches in both product name and product code fields (case-insensitive)
   - For marketplace users: searches in firstName, lastName, and phone fields (case-insensitive)

5. **Full Details:** All endpoints return full details including populated references (category, subcategory, contragent, regions, etc.).

6. **Read-Only:** These endpoints are read-only. They only allow viewing data, not modifying it.

7. **Performance:** For large datasets, use pagination and specific filters to improve performance.

8. **SMS Verifications:**
   - All SMS codes are visible to admins (including the actual code)
   - Expired codes are automatically deleted from database
   - You can filter by phone, type, usage status, and date range
   - Codes show when they were created, when they expire, and if they've been used
   - Type field indicates the purpose: 'login', 'register', or 'forgot_password'

9. **Marketplace Users:**
   - All user information is visible to admins (except password)
   - You can filter by status, location (viloyat, tuman, mfy), phone verification, gender
   - Search functionality searches in firstName, lastName, and phone
   - All region objects are populated with full details
   - Avatar is included in base64 format if available

---

### 10. Get All Orders

Get all orders with full details and advanced filtering options. This endpoint allows admins to view all orders in the system with comprehensive filtering capabilities.

**Endpoint:** `GET /api/admins/data/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

#### Basic Filters:
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', or 'cancelled'
- `paymentStatus` (optional) - Filter by payment status: 'pending', 'paid', 'failed', or 'refunded'
- `paymentMethod` (optional) - Filter by payment method: 'cash' or 'card'
- `user` (optional) - Filter by user ID

#### Search Filters:
- `orderNumber` (optional) - Filter by order number (partial match, case-insensitive)
- `search` (optional) - Search by order number or phone number (case-insensitive)

#### Date Filters:
- `startDate` (optional) - Filter by start date (ISO 8601 format)
- `endDate` (optional) - Filter by end date (ISO 8601 format)

#### Price Filters:
- `minTotalPrice` (optional) - Minimum total price (number)
- `maxTotalPrice` (optional) - Maximum total price (number)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "user": {
        "_id": "507f1f77bcf86cd799439022",
        "firstName": "Ali",
        "lastName": "Valiyev",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Toshkent tumani",
          "type": "district",
          "code": "TASH-TUM"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY-1"
        },
        "status": "active"
      },
      "orderNumber": "00001",
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Coca Cola 1.5L",
            "price": 15000,
            "originalPrice": 12000,
            "images": ["data:image/jpeg;base64,..."],
            "category": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "Ichimliklar",
              "slug": "ichimliklar",
              "status": "active"
            },
            "subcategory": {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Gazlangan ichimliklar",
              "slug": "gazlangan-ichimliklar",
              "status": "active"
            },
            "contragent": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "ABC MChJ",
              "phone": "+998901234567",
              "status": "active",
              "viloyat": {
                "_id": "507f1f77bcf86cd799439015",
                "name": "Toshkent viloyati",
                "type": "region",
                "code": "TASH"
              },
              "tuman": {
                "_id": "507f1f77bcf86cd799439016",
                "name": "Toshkent tumani",
                "type": "district",
                "code": "TASH-TUM"
              },
              "mfy": {
                "_id": "507f1f77bcf86cd799439017",
                "name": "MFY 1",
                "type": "mfy",
                "code": "MFY-1"
              }
            },
            "quantity": 20,
            "unit": "dona",
            "unitSize": 1.5,
            "length": 30,
            "width": 10,
            "weight": 1.5,
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
            "productCode": "001"
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000,
          "kpiBonusPercent": 5
        }
      ],
      "totalPrice": 30000,
      "totalOriginalPrice": 24000,
      "totalKpiPrice": 1500,
      "itemCount": 2,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "deliveryMfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "deliveryNote": "Eshik oldida qoldiring",
      "phoneNumber": "+998901234567",
      "punktRequests": [],
      "confirmedByPunkt": null,
      "punktStatus": "pending",
      "assignedToAgent": null,
      "assignedByPunkt": null,
      "assignedAt": null,
      "confirmedByAgent": null,
      "agentConfirmedAt": null,
      "contragentRequests": [],
      "punktToPunktRequests": [],
      "customerConfirmed": false,
      "customerConfirmedAt": null,
      "currentPunkt": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **500 Internal Server Error** - Server error

---

### 11. Get Order by ID

Get a specific order by its ID with full details including user information and all order items with populated product details.

**Endpoint:** `GET /api/admins/data/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "user": {
      "_id": "507f1f77bcf86cd799439022",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "status": "active"
    },
    "orderNumber": "00001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Coca Cola 1.5L",
          "price": 15000,
          "originalPrice": 12000,
          "images": ["data:image/jpeg;base64,..."],
          "category": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Ichimliklar",
            "slug": "ichimliklar",
            "status": "active"
          },
          "subcategory": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Gazlangan ichimliklar",
            "slug": "gazlangan-ichimliklar",
            "status": "active"
          },
          "contragent": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "ABC MChJ",
            "phone": "+998901234567",
            "status": "active",
            "viloyat": {
              "_id": "507f1f77bcf86cd799439015",
              "name": "Toshkent viloyati",
              "type": "region",
              "code": "TASH"
            },
            "tuman": {
              "_id": "507f1f77bcf86cd799439016",
              "name": "Toshkent tumani",
              "type": "district",
              "code": "TASH-TUM"
            },
            "mfy": {
              "_id": "507f1f77bcf86cd799439017",
              "name": "MFY 1",
              "type": "mfy",
              "code": "MFY-1"
            }
          },
          "quantity": 20,
          "unit": "dona",
          "unitSize": 1.5,
          "length": 30,
          "width": 10,
          "weight": 1.5,
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
          "productCode": "001"
        },
        "quantity": 2,
        "price": 15000,
        "originalPrice": 12000,
        "kpiBonusPercent": 5
      }
    ],
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalKpiPrice": 1500,
    "itemCount": 2,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "MFY 1",
      "type": "mfy",
      "code": "MFY-1"
    },
    "deliveryNote": "Eshik oldida qoldiring",
    "phoneNumber": "+998901234567",
    "punktRequests": [],
    "confirmedByPunkt": null,
    "punktStatus": "pending",
    "assignedToAgent": null,
    "assignedByPunkt": null,
    "assignedAt": null,
    "confirmedByAgent": null,
    "agentConfirmedAt": null,
    "contragentRequests": [],
    "punktToPunktRequests": [],
    "customerConfirmed": false,
    "customerConfirmedAt": null,
    "currentPunkt": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

## Filtering Options

### Order Filters

The `GET /api/admins/data/orders` endpoint supports comprehensive filtering:

#### Status Filter
- Filter by order status: `?status=pending`, `?status=processing`, `?status=shipped`, `?status=delivered`, or `?status=cancelled`

#### Payment Status Filter
- Filter by payment status: `?paymentStatus=pending`, `?paymentStatus=paid`, `?paymentStatus=failed`, or `?paymentStatus=refunded`

#### Payment Method Filter
- Filter by payment method: `?paymentMethod=cash` or `?paymentMethod=card`

#### User Filter
- Filter by user ID: `?user=507f1f77bcf86cd799439022`

#### Order Number Filter
- Filter by order number: `?orderNumber=00001`

#### Date Range Filters
- Start date: `?startDate=2024-01-15T00:00:00.000Z`
- End date: `?endDate=2024-01-15T23:59:59.999Z`
- Date range: `?startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z`

#### Total Price Range Filters
- Minimum total price: `?minTotalPrice=10000`
- Maximum total price: `?maxTotalPrice=50000`
- Price range: `?minTotalPrice=10000&maxTotalPrice=50000`

#### Search Filter
- Search by order number or phone number: `?search=00001` or `?search=998901234567`
- Case-insensitive search

#### Combined Filters
You can combine multiple filters:
```
?status=pending&paymentStatus=pending&paymentMethod=cash&startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z&minTotalPrice=10000
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Xato xabari"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid input or ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Unauthorized (401)

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
  "message": "Sizda bu amalni bajarish uchun ruxsat yo'q"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Buyurtma topilmadi"
}
```

---

## Examples

### Example 1: Get All Categories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/categories?includeSubcategories=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 100,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Gazlangan ichimliklar",
          "slug": "gazlangan-ichimliklar",
          "status": "active"
        }
      ]
    }
  ]
}
```

### Example 2: Get Products with Multiple Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?status=active&category=507f1f77bcf86cd799439012&minPrice=10000&maxPrice=20000&search=coca&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "price": 15000,
      "originalPrice": 12000,
      "status": "active",
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar"
      },
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "ABC MChJ",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "productCode": "001"
    }
  ]
}
```

### Example 3: Get Products by Contragent and Delivery Region

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?contragent=507f1f77bcf86cd799439014&viloyat=507f1f77bcf86cd799439015" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Products with Quantity Range

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/products?minQuantity=10&maxQuantity=50&unit=dona" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Get All SMS Verifications

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications?type=login&isUsed=false&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+998901234567",
      "code": "12345",
      "type": "login",
      "isUsed": false,
      "expiresAt": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "phone": "+998901234568",
      "code": "67890",
      "type": "login",
      "isUsed": false,
      "expiresAt": "2024-01-15T11:35:00.000Z",
      "createdAt": "2024-01-15T11:30:00.000Z",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  ]
}
```

### Example 6: Get SMS Verifications by Phone and Date Range

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications?phone=998901234567&startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 7: Get SMS Verification by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/sms-verifications/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+998901234567",
    "code": "12345",
    "type": "register",
    "isUsed": true,
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:32:00.000Z"
  }
}
```

### Example 8: Get All Marketplace Users

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users?status=active&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "data": [...]
}
```

### Example 9: Get Marketplace Users with Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users?viloyat=507f1f77bcf86cd799439015&gender=erkak&isPhoneVerified=true&search=Ali" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 10: Get Marketplace User by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/marketplace-users/507f1f77bcf86cd799439021" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "phone": "+998901234567",
    "gender": "erkak",
    "viloyat": {...},
    "tuman": {...},
    "mfy": {...},
    "birthDate": "1990-01-15T00:00:00.000Z",
    "isPhoneVerified": true,
    "avatar": "data:image/jpeg;base64,...",
    "status": "active"
  }
}
```

### Example 11: Get All Orders

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders?status=pending&paymentStatus=pending&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439022",
        "firstName": "Ali",
        "lastName": "Valiyev",
        "phone": "+998901234567"
      },
      "totalPrice": 30000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 12: Get Orders with Multiple Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders?status=pending&paymentMethod=cash&startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z&minTotalPrice=10000&maxTotalPrice=50000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 13: Get Orders by User

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders?user=507f1f77bcf86cd799439022" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 14: Get Orders by Order Number or Phone

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders?search=00001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 15: Get Order by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/507f1f77bcf86cd799439021" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 16: Get Marketplace Orders

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/marketplace?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 17: Get Orders Delivered to Punkt

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/delivered-to-punkt?startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 18: Get Orders Assigned to Agents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/assigned-to-agents?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 19: Get Orders Confirmed by Agents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/confirmed-by-agents?startDate=2024-01-15T00:00:00.000Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 20: Get Orders Confirmed by Customers

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/confirmed-by-customers?status=delivered&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 21: Get Cancelled Orders

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/cancelled?startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Order Status Flow

The complete order workflow:

1. **Marketplace Order** - Customer places order via marketplace
2. **Delivered to Punkt** - Contragent delivers products to punkt
3. **Assigned to Agent** - Punkt assigns order to MFY agent
4. **Confirmed by Agent** - Agent visits customer and confirms delivery
5. **Confirmed by Customer** - Customer confirms receipt
6. **Cancelled** - Order cancelled at any stage (if applicable)

---

## Notes

1. **Authentication:** All endpoints require admin authentication. Make sure to include a valid JWT token in the Authorization header.

2. **Pagination:** All list endpoints support pagination with `page` and `limit` query parameters.

3. **Filtering:** Multiple filters can be combined. All filters are optional.

4. **Search:** 
   - For products: searches in both product name and product code fields (case-insensitive)
   - For marketplace users: searches in firstName, lastName, and phone fields (case-insensitive)
   - For orders: searches in order number and phone number fields (case-insensitive)

5. **Full Details:** All endpoints return full details including populated references (category, subcategory, contragent, regions, etc.).

6. **Read-Only:** These endpoints are read-only. They only allow viewing data, not modifying it.

7. **Performance:** For large datasets, use pagination and specific filters to improve performance.

8. **SMS Verifications:**
   - All SMS codes are visible to admins (including the actual code)
   - Expired codes are automatically deleted from database
   - You can filter by phone, type, usage status, and date range
   - Codes show when they were created, when they expire, and if they've been used
   - Type field indicates the purpose: 'login', 'register', or 'forgot_password'

9. **Marketplace Users:**
   - All user information is visible to admins (except password)
   - You can filter by status, location (viloyat, tuman, mfy), phone verification, gender
   - Search functionality searches in firstName, lastName, and phone
   - All region objects are populated with full details
   - Avatar is included in base64 format if available

10. **Orders:**
    - All orders are visible to admins with full details
    - You can filter by status, payment status, payment method, user, order number, date range, and price range
    - Search functionality searches in order number and phone number
    - All order items include full product details with populated category, subcategory, and contragent information
    - User information is populated with full region details
    - KPI bonus percent is included in order items but removed from product objects in response
    - Orders include delivery regions (deliveryViloyat, deliveryTuman, deliveryMfy) instead of deliveryAddress
    - Orders include workflow fields: punktRequests, confirmedByPunkt, punktStatus, assignedToAgent, assignedByPunkt, confirmedByAgent, contragentRequests, punktToPunktRequests, customerConfirmed, currentPunkt

---

### 12. Get Marketplace Orders

Get all marketplace orders that have not been confirmed by punkt yet (punkt qabul qilmagan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/marketplace`

**Description:** Returns orders from marketplace that are still pending punkt confirmation. These are new orders that punkt has not yet accepted.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered'
- `paymentStatus` (optional) - Filter by payment status: 'pending', 'paid', 'failed', 'refunded'
- `paymentMethod` (optional) - Filter by payment method: 'cash', 'card'
- `startDate` (optional) - Filter orders from this date (ISO 8601 format)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439022",
        "firstName": "Ali",
        "lastName": "Valiyev",
        "phone": "+998901234567"
      },
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Note:** This endpoint returns all orders except cancelled ones. Cancelled orders are excluded from marketplace orders.

---

### 13. Get Orders Delivered to Punkt

Get all orders that have been delivered to punkt by contragents.

**Endpoint:** `GET /api/admins/data/orders/delivered-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `startDate` (optional) - Filter by delivery date from (ISO 8601 format)
- `endDate` (optional) - Filter by delivery date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 20,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "contragentRequests": [
        {
          "contragentId": {
            "_id": "507f1f77bcf86cd799439020",
            "name": "Contragent 1",
            "inn": "123456789"
          },
          "status": "delivered_to_punkt",
          "deliveredToPunktAt": "2024-01-15T12:00:00.000Z"
        }
      ],
      "currentPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1",
        "phone": "+998901234568"
      }
    }
  ]
}
```

**Note:** This endpoint returns orders where at least one contragent request has status `delivered_to_punkt`.

---

### 14. Get Orders Assigned to Agents

Get all orders that have been assigned to agents by punkts.

**Endpoint:** `GET /api/admins/data/orders/assigned-to-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `startDate` (optional) - Filter by assignment date from (ISO 8601 format)
- `endDate` (optional) - Filter by assignment date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 8,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "assignedToAgent": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Agent 1",
        "phone": "+998901234567",
        "mfy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "MFY 1"
        }
      },
      "assignedByPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1",
        "phone": "+998901234568"
      },
      "assignedAt": "2024-01-15T13:00:00.000Z"
    }
  ]
}
```

**Note:** This endpoint returns orders where `assignedToAgent` is not null.

---

### 15. Get Orders Confirmed by Agents

Get all orders that have been confirmed by agents (delivered to customers by agents).

**Endpoint:** `GET /api/admins/data/orders/confirmed-by-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `startDate` (optional) - Filter by confirmation date from (ISO 8601 format)
- `endDate` (optional) - Filter by confirmation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 6,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "confirmedByAgent": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Agent 1",
        "phone": "+998901234567",
        "mfy": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "MFY 1"
        }
      },
      "agentConfirmedAt": "2024-01-15T14:00:00.000Z"
    }
  ]
}
```

**Note:** This endpoint returns orders where `confirmedByAgent` is not null, meaning the agent has visited the customer and confirmed delivery.

---

### 16. Get Orders Confirmed by Customers

Get all orders that have been confirmed by customers (customers have confirmed receipt).

**Endpoint:** `GET /api/admins/data/orders/confirmed-by-customers`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `startDate` (optional) - Filter by confirmation date from (ISO 8601 format)
- `endDate` (optional) - Filter by confirmation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 4,
  "total": 15,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "customerConfirmed": true,
      "customerConfirmedAt": "2024-01-15T15:00:00.000Z",
      "status": "delivered",
      "confirmedByAgent": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Agent 1",
        "phone": "+998901234567"
      }
    }
  ]
}
```

**Note:** This endpoint returns orders where `customerConfirmed` is `true`, meaning the customer has confirmed they received the order.

---

### 17. Get Cancelled Orders

Get all cancelled orders with cancellation reasons.

**Endpoint:** `GET /api/admins/data/orders/cancelled`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Filter by cancellation date from (ISO 8601 format)
- `endDate` (optional) - Filter by cancellation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "status": "cancelled",
      "user": {
        "_id": "507f1f77bcf86cd799439022",
        "firstName": "Ali",
        "lastName": "Valiyev",
        "phone": "+998901234567"
      },
      "totalPrice": 30000,
      "cancelledAt": "2024-01-15T16:00:00.000Z",
      "updatedAt": "2024-01-15T16:00:00.000Z"
    }
  ]
}
```

**Note:** This endpoint returns all orders with status `cancelled`. The cancellation reason can be found in the order details or notes.

---

## Order Status Flow

The complete order workflow:

1. **Marketplace Order** - Customer places order via marketplace
2. **Delivered to Punkt** - Contragent delivers products to punkt
3. **Assigned to Agent** - Punkt assigns order to MFY agent
4. **Confirmed by Agent** - Agent visits customer and confirms delivery
5. **Confirmed by Customer** - Customer confirms receipt
6. **Cancelled** - Order cancelled at any stage (if applicable)

---

**Last Updated:** 2024-01-15

