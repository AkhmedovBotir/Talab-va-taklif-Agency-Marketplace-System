# Contragent API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Login Contragent](#1-login-contragent)
  - [Get Current Contragent (Me)](#2-get-current-contragent-me)
  - [Create Contragent](#3-create-contragent)
  - [Get All Contragents](#4-get-all-contragents)
  - [Get Contragent by ID](#5-get-contragent-by-id)
  - [Update Contragent](#6-update-contragent)
  - [Delete Contragent](#7-delete-contragent)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Contragent API provides endpoints for managing contragents (contractors) in the system. Each contragent has company information, INN, address (linked to Region), phone number, and authentication credentials.

**Base Path:** `/api/contragents`

---

## Base URL

```
http://localhost:5000/api/contragents
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login, you will receive a JWT token that should be included in the `Authorization` header for protected endpoints.

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** 24 hours

**Note:** Currently, most endpoints do not require authentication. However, it is recommended to implement authentication middleware for production use.

---

## Data Models

### Contragent Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "inn": "string (9 or 12 digits, unique)",
  "viloyat": "object (reference to Region, type: 'region')",
  "tuman": "object (reference to Region, type: 'district')",
  "mfy": "object (reference to Region, type: 'mfy')",
  "phone": "string (valid phone number, unique)",
  "logo": "string (base64 image, optional)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Region Object (when populated):**
```json
{
  "_id": "string",
  "name": "string",
  "type": "string",
  "code": "string"
}
```

**Note:** The `password` field is never returned in API responses for security reasons.

---

## Endpoints

### 1. Login Contragent

Authenticate a contragent and receive a JWT token.

**Endpoint:** `POST /api/contragents/login`

**Request Body:**

```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Validation Rules:**
- `phone`: Required, valid phone number format
- `password`: Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "contragent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC MChJ",
      "inn": "123456789",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234567",
      "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Account is inactive
- **500 Internal Server Error** - Server error

---

### 2. Get Current Contragent (Me)

Get the current authenticated contragent's information using JWT token.

**Endpoint:** `GET /api/contragents/me`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
    "inn": "123456789",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Yunusobod MFY",
      "type": "mfy",
      "code": "YUN-MFY"
    },
    "phone": "+998901234567",
    "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided, invalid, or expired
- **403 Forbidden** - Token is not for contragent
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

---

### 3. Create Contragent

Create a new contragent.

**Endpoint:** `POST /api/contragents`

**Request Body:**

```json
{
  "name": "string (required, 2-200 chars)",
  "inn": "string (required, 9 or 12 digits, unique)",
  "viloyat": "string (required, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string (required, MongoDB ObjectId of Region with type: 'district')",
  "mfy": "string (required, MongoDB ObjectId of Region with type: 'mfy')",
  "phone": "string (required, valid phone format, unique)",
  "password": "string (required, min 6 chars)",
  "logo": "string (optional, base64 image format: data:image/png;base64,...)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, 2-200 characters
- `inn`: Required, must be 9 or 12 digits, unique
- `viloyat`: Required, must be a valid Region ID with type 'region'
- `tuman`: Required, must be a valid Region ID with type 'district', and must be a child of the selected viloyat
- `mfy`: Required, must be a valid Region ID with type 'mfy', and must be a child of the selected tuman
- `phone`: Required, must be a valid phone number format, unique
- `password`: Required, minimum 6 characters
- `logo`: Optional, must be base64 image format (data:image/png;base64,... or data:image/jpeg;base64,...)
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
      "inn": "123456789",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234567",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate INN/phone, or invalid viloyat/tuman/mfy
- **500 Internal Server Error** - Server error

---

### 4. Get All Contragents

Retrieve all contragents with optional filtering and pagination.

**Endpoint:** `GET /api/contragents`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `viloyat` (optional) - Filter by viloyat (Region ID)
- `tuman` (optional) - Filter by tuman (Region ID)
- `mfy` (optional) - Filter by mfy (Region ID)

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
      "name": "ABC MChJ",
      "inn": "123456789",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234567",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "XYZ LLC",
      "inn": "987654321",
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
        "code": "SAM-T"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Samarqand MFY",
        "type": "mfy",
        "code": "SAM-MFY"
      },
      "phone": "+998901234568",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 5. Get Contragent by ID

Retrieve a specific contragent by its ID.

**Endpoint:** `GET /api/contragents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
    "inn": "123456789",
    "address": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "phone": "+998901234567",
    "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid contragent ID format
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

---

### 6. Update Contragent

Update an existing contragent's information.

**Endpoint:** `PUT /api/contragents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-200 chars)",
  "inn": "string (optional, 9 or 12 digits, unique)",
  "viloyat": "string (optional, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string (optional, MongoDB ObjectId of Region with type: 'district')",
  "mfy": "string (optional, MongoDB ObjectId of Region with type: 'mfy')",
  "phone": "string (optional, valid phone format, unique)",
  "password": "string (optional, min 6 chars)",
  "logo": "string (optional, base64 image format: data:image/png;base64,...)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- INN and phone must be unique (cannot duplicate existing values)
- If updating viloyat, tuman, or mfy, hierarchy validation applies (tuman must be child of viloyat, mfy must be child of tuman)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ (Updated)",
    "inn": "123456789",
    "address": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "phone": "+998901234567",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate INN/phone, or invalid ID
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

---

### 7. Delete Contragent

Delete a contragent.

**Endpoint:** `DELETE /api/contragents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid contragent ID format
- **404 Not Found** - Contragent not found
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
- **401 Unauthorized** - Authentication failed
- **403 Forbidden** - Account is inactive
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
      "message": "Nomi kiritilishi shart"
    },
    {
      "field": "inn",
      "message": "INN 9 yoki 12 ta raqamdan iborat bo'lishi kerak"
    }
  ]
}
```

#### Duplicate INN (400)

```json
{
  "success": false,
  "message": "Bu INN allaqachon mavjud"
}
```

#### Duplicate Phone Number (400)

```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon mavjud"
}
```

#### Invalid Credentials (401)

```json
{
  "success": false,
  "message": "Telefon raqami yoki parol noto'g'ri"
}
```

#### Account Inactive (403)

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
  "message": "Kontragent topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri kontragent ID"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 2 characters
- **Max Length:** 200 characters
- **Trim:** Yes

### INN
- **Type:** String
- **Required:** Yes (for create)
- **Format:** Must be exactly 9 or 12 digits
- **Pattern:** `/^\d{9}$|^\d{12}$/`
- **Unique:** Yes
- **Examples:**
  - Valid: `123456789` (9 digits), `123456789012` (12 digits)
  - Invalid: `12345` (too short), `12345678901` (11 digits), `ABC123456` (contains letters)

### Viloyat
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes (for create)
- **Description:** Must be a valid Region ID with type 'region' from the regions collection

### Tuman
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes (for create)
- **Description:** Must be a valid Region ID with type 'district' from the regions collection. Must be a child of the selected viloyat.

### MFY
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes (for create)
- **Description:** Must be a valid Region ID with type 'mfy' from the regions collection. Must be a child of the selected tuman.

### Phone
- **Type:** String
- **Required:** Yes (for create)
- **Format:** Valid phone number pattern
- **Pattern:** `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`
- **Unique:** Yes
- **Examples:**
  - `+998901234567`
  - `998901234567`
  - `(998) 90-123-45-67`

### Password
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 6 characters
- **Storage:** Hashed using bcrypt (salt rounds: 10)
- **Note:** Never returned in API responses

### Logo
- **Type:** String (base64 encoded image)
- **Required:** No
- **Format:** Must be base64 image format
- **Pattern:** `/^data:image\/(png|jpg|jpeg|gif|webp);base64,/`
- **Examples:**
  - Valid: `data:image/png;base64,iVBORw0KGgoAAAANS...`
  - Valid: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`
  - Invalid: `base64string` (missing data URI prefix)
  - Invalid: `data:image/png;base64` (missing comma and base64 data)
- **Note:** Logo is stored as base64 string in the database

### Status
- **Type:** String (enum)
- **Required:** No (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`

---

## Examples

### Example 1: Login Contragent

**Request:**

```bash
curl -X POST http://localhost:5000/api/contragents/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "securepass123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInBob25lIjoiKzk5ODkwMTIzNDU2NyIsImlubiI6IjEyMzQ1Njc4OSIsInR5cGUiOiJjb250cmFnZW50IiwiaWF0IjoxNzA1MzI0MDAwLCJleHAiOjE3MDU0MTA0MDB9.abc123...",
    "contragent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC MChJ",
      "inn": "123456789",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234567",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 2: Get Current Contragent (Me)

**Request:**

```bash
curl -X GET http://localhost:5000/api/contragents/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
    "inn": "123456789",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Yunusobod MFY",
      "type": "mfy",
      "code": "YUN-MFY"
    },
    "phone": "+998901234567",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Create Contragent

**Request:**

```bash
curl -X POST http://localhost:5000/api/contragents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC MChJ",
    "inn": "123456789",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439014",
    "phone": "+998901234567",
    "password": "securepass123",
    "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
    "inn": "123456789",
    "address": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "phone": "+998901234567",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 4: Get All Contragents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragents?page=1&limit=10&status=active"
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
      "name": "ABC MChJ",
      "inn": "123456789",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234567",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 5: Get Contragent by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/contragents/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ",
    "inn": "123456789",
    "address": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "phone": "+998901234567",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 6: Update Contragent

**Request:**

```bash
curl -X PUT http://localhost:5000/api/contragents/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC MChJ (Updated)",
    "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC MChJ (Updated)",
    "inn": "123456789",
    "address": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "phone": "+998901234567",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 7: Delete Contragent

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/contragents/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli o'chirildi"
}
```

### Example 8: Validation Error

**Request:**

```bash
curl -X POST http://localhost:5000/api/contragents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "inn": "12345",
    "phone": "123",
    "password": "123"
  }'
```

**Response:**

```json
{
  "success": false,
  "message": "Validatsiya xatosi",
  "errors": [
    {
      "field": "name",
      "message": "Nomi kamida 2 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "inn",
      "message": "INN 9 yoki 12 ta raqamdan iborat bo'lishi kerak"
    },
    {
      "field": "viloyat",
      "message": "Viloyat kiritilishi shart"
    },
    {
      "field": "tuman",
      "message": "Tuman kiritilishi shart"
    },
    {
      "field": "mfy",
      "message": "MFY kiritilishi shart"
    },
    {
      "field": "phone",
      "message": "To'g'ri telefon raqam formatini kiriting"
    },
    {
      "field": "password",
      "message": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
    }
  ]
}
```

---

## Notes

1. **Password Security:** Passwords are automatically hashed using bcrypt before being stored in the database. The password is never returned in API responses.

2. **INN Uniqueness:** INN must be unique across all contragents. The system accepts both 9-digit and 12-digit INN formats.

3. **Phone Number Uniqueness:** Phone numbers must be unique across all contragents.

4. **Address Structure:** Contragents have a three-level address structure:
   - **Viloyat** (Region): Must be a Region with type 'region'
   - **Tuman** (District): Must be a Region with type 'district' and must be a child of the selected viloyat
   - **MFY** (Mahalla): Must be a Region with type 'mfy' and must be a child of the selected tuman
   - All three address fields are automatically populated when fetching contragents.

5. **JWT Token:** Login tokens expire after 24 hours. The token includes contragent ID, phone, INN, and type ('contragent').

6. **Status Filtering:** You can filter contragents by status in the `getAllContragents` endpoint.

7. **Pagination:** The `getAllContragents` endpoint supports pagination with `page` and `limit` query parameters.

8. **Timestamps:** All contragent records include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

---

**Last Updated:** 2024-01-15

