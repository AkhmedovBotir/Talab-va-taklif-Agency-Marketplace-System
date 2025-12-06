# Punkt API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Login Punkt](#1-login-punkt)
  - [Create Punkt](#2-create-punkt)
  - [Get All Punkts](#3-get-all-punkts)
  - [Get Punkt by ID](#4-get-punkt-by-id)
  - [Update Punkt](#5-update-punkt)
  - [Delete Punkt](#6-delete-punkt)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Punkt API provides endpoints for managing points (punkts) in the system. Each punkt has a name, phone number, password, assigned viloyat (region), tuman (district), and status.

**Base Path:** `/api/punkts`

---

## Base URL

```
http://localhost:5000/api/punkts
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login, you will receive a JWT token that should be included in the `Authorization` header for protected endpoints.

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** 24 hours

**Note:** Currently, most endpoints do not require authentication. However, it is recommended to implement authentication middleware for production use.

---

## Data Models

### Punkt Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "phone": "string (valid phone number, unique)",
  "viloyat": "object (reference to Region, type: 'region')",
  "tuman": "object (reference to Region, type: 'district', optional, can be null)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Viloyat/Tuman Object (when populated):**
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

### 1. Login Punkt

Authenticate a punkt and receive a JWT token.

**Endpoint:** `POST /api/punkts/login`

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
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567",
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
        "code": "TASH-TUM"
      },
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

### 2. Create Punkt

Create a new punkt.

**Endpoint:** `POST /api/punkts`

**Request Body:**

```json
{
  "name": "string (required, 2-200 chars)",
  "phone": "string (required, valid phone format, unique)",
  "password": "string (required, min 6 chars)",
  "viloyat": "string (required, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string (optional, MongoDB ObjectId of Region with type: 'district', must belong to viloyat)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, 2-200 characters
- `phone`: Required, must be a valid phone number format, unique
- `password`: Required, minimum 6 characters
- `viloyat`: Required, must be a valid Region ID with type 'region'
- `tuman`: Optional, must be a valid Region ID with type 'district' and must belong to the specified viloyat
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate phone, or invalid viloyat
- **500 Internal Server Error** - Server error

---

### 3. Get All Punkts

Retrieve all punkts with optional filtering and pagination.

**Endpoint:** `GET /api/punkts`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `viloyat` (optional) - Filter by viloyat (Region ID)
- `tuman` (optional) - Filter by tuman (Region ID)

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
      "name": "Punkt 1",
      "phone": "+998901234567",
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
        "code": "TASH-TUM"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Punkt 2",
      "phone": "+998901234568",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Samarqand viloyati",
        "type": "region",
        "code": "SAM"
      },
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

### 4. Get Punkt by ID

Retrieve a specific punkt by its ID.

**Endpoint:** `GET /api/punkts/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the punkt

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid punkt ID format
- **404 Not Found** - Punkt not found
- **500 Internal Server Error** - Server error

---

### 5. Update Punkt

Update an existing punkt's information.

**Endpoint:** `PUT /api/punkts/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the punkt

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-200 chars)",
  "phone": "string (optional, valid phone format, unique)",
  "password": "string (optional, min 6 chars)",
  "viloyat": "string (optional, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string (optional, MongoDB ObjectId of Region with type: 'district', must belong to viloyat)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Phone must be unique (cannot duplicate existing values)
- Viloyat must be a valid Region ID with type 'region'
- Tuman must be a valid Region ID with type 'district' and must belong to the viloyat (if viloyat is provided or already set)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1 (Updated)",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate phone, invalid viloyat, or invalid ID
- **404 Not Found** - Punkt not found
- **500 Internal Server Error** - Server error

---

### 6. Delete Punkt

Delete a punkt.

**Endpoint:** `DELETE /api/punkts/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the punkt

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid punkt ID format
- **404 Not Found** - Punkt not found
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
      "message": "Punkt nomi kiritilishi shart"
    },
    {
      "field": "phone",
      "message": "To'g'ri telefon raqam formatini kiriting"
    }
  ]
}
```

#### Duplicate Phone Number (400)

```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon mavjud"
}
```

#### Invalid Viloyat (400)

```json
{
  "success": false,
  "message": "Viloyat topilmadi yoki noto'g'ri tur"
}
```

#### Invalid Tuman (400)

```json
{
  "success": false,
  "message": "Tuman topilmadi yoki noto'g'ri tur"
}
```

#### Tuman Not Belonging to Viloyat (400)

```json
{
  "success": false,
  "message": "Tuman viloyatga tegishli emas"
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
  "message": "Punkt topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri punkt ID"
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

### Viloyat
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes (for create)
- **Description:** Must be a valid Region ID with type 'region' from the regions collection

### Tuman
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** No (optional)
- **Default:** `null`
- **Description:** Must be a valid Region ID with type 'district' from the regions collection. Must be a child of the selected viloyat. Can only be set if viloyat is set.

### Status
- **Type:** String (enum)
- **Required:** No (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`

---

## Examples

### Example 1: Login Punkt

**Request:**

```bash
curl -X POST http://localhost:5000/api/punkts/login \
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInBob25lIjoiKzk5ODkwMTIzNDU2NyIsInR5cGUiOiJwdW5rdCIsImlhdCI6MTcwNTMyNDAwMCwiZXhwIjoxNzA1NDEwNDAwfQ.abc123...",
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567",
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
        "code": "TASH-TUM"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 2: Create Punkt

**Request:**

```bash
curl -X POST http://localhost:5000/api/punkts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Punkt 1",
    "phone": "+998901234567",
    "password": "securepass123",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Get All Punkts

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts?page=1&limit=10&status=active&viloyat=507f1f77bcf86cd799439012"
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
      "name": "Punkt 1",
      "phone": "+998901234567",
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
        "code": "TASH-TUM"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 4: Get Punkt by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/punkts/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 5: Update Punkt

**Request:**

```bash
curl -X PUT http://localhost:5000/api/punkts/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Punkt 1 (Updated)",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1 (Updated)",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 6: Delete Punkt

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/punkts/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "message": "Punkt muvaffaqiyatli o'chirildi"
}
```

### Example 7: Validation Error

**Request:**

```bash
curl -X POST http://localhost:5000/api/punkts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "P",
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
      "message": "Punkt nomi kamida 2 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "viloyat",
      "message": "Viloyat kiritilishi shart"
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

2. **Phone Number Uniqueness:** Phone numbers must be unique across all punkts.

3. **Viloyat Reference:** The viloyat field must reference a valid Region ID with type 'region' from the regions collection. The viloyat is automatically populated when fetching punkts.

4. **Tuman Reference:** The tuman field is optional and must reference a valid Region ID with type 'district' from the regions collection. The tuman must belong to the specified viloyat. The tuman is automatically populated when fetching punkts.

5. **JWT Token:** Login tokens expire after 24 hours. The token includes punkt ID, phone, and type ('punkt').

6. **Status Filtering:** You can filter punkts by status in the `getAllPunkts` endpoint.

7. **Viloyat Filtering:** You can filter punkts by viloyat in the `getAllPunkts` endpoint.

8. **Tuman Filtering:** You can filter punkts by tuman in the `getAllPunkts` endpoint.

9. **Pagination:** The `getAllPunkts` endpoint supports pagination with `page` and `limit` query parameters.

10. **Timestamps:** All punkt records include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

---

**Last Updated:** 2024-01-15



