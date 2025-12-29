# Contragent Type API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get All Contragent Types](#1-get-all-contragent-types)
  - [Get Contragent Type by ID](#2-get-contragent-type-by-id)
  - [Create Contragent Type](#3-create-contragent-type)
  - [Update Contragent Type](#4-update-contragent-type)
  - [Delete Contragent Type](#5-delete-contragent-type)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Contragent Type API provides endpoints for managing contragent activity types in the system. Each contragent type has a name and an icon. Contragents must select an activity type when registering.

**Base Path:** `/api/contragent-types`

**Note:** GET endpoints are **public** and do not require authentication. POST, PUT, and DELETE endpoints require Admin authentication.

---

## Base URL

```
http://localhost:5000/api/contragent-types
```

---

## Authentication

- **GET endpoints:** Public (no authentication required)
- **POST, PUT, DELETE endpoints:** Require Admin authentication via JWT token

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** 24 hours

---

## Data Models

### ContragentType Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "icon": "string",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Endpoints

### 1. Get All Contragent Types

Retrieve all contragent types with optional filtering by status.

**Endpoint:** `GET /api/contragent-types`

**Query Parameters:**
- `status` (optional) - Filter by status: 'active' or 'inactive'

**Authentication:** Not required (public endpoint)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Savdo",
      "icon": "shop-icon",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Xizmat ko'rsatish",
      "icon": "service-icon",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Ishlab chiqarish",
      "icon": "production-icon",
      "status": "active",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 2. Get Contragent Type by ID

Retrieve a specific contragent type by its ID.

**Endpoint:** `GET /api/contragent-types/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent type

**Authentication:** Not required (public endpoint)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo",
    "icon": "shop-icon",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid contragent type ID format
- **404 Not Found** - Contragent type not found
- **500 Internal Server Error** - Server error

---

### 3. Create Contragent Type

Create a new contragent type.

**Endpoint:** `POST /api/contragent-types`

**Headers:**
- `Authorization: Bearer <token>` (required - Admin only)

**Request Body:**

```json
{
  "name": "string (required, 2-200 chars)",
  "icon": "string (required)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, 2-200 characters
- `icon`: Required
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo",
    "icon": "shop-icon",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **401 Unauthorized** - Token not provided, invalid, or expired
- **403 Forbidden** - User is not an admin
- **500 Internal Server Error** - Server error

---

### 4. Update Contragent Type

Update an existing contragent type's information.

**Endpoint:** `PUT /api/contragent-types/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent type

**Headers:**
- `Authorization: Bearer <token>` (required - Admin only)

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-200 chars)",
  "icon": "string (optional)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo (Updated)",
    "icon": "shop-icon-updated",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error or invalid ID
- **401 Unauthorized** - Token not provided, invalid, or expired
- **403 Forbidden** - User is not an admin
- **404 Not Found** - Contragent type not found
- **500 Internal Server Error** - Server error

---

### 5. Delete Contragent Type

Delete a contragent type.

**Endpoint:** `DELETE /api/contragent-types/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent type

**Headers:**
- `Authorization: Bearer <token>` (required - Admin only)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid contragent type ID format
- **401 Unauthorized** - Token not provided, invalid, or expired
- **403 Forbidden** - User is not an admin
- **404 Not Found** - Contragent type not found
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
- **403 Forbidden** - User is not an admin
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
      "field": "icon",
      "message": "Icon kiritilishi shart"
    }
  ]
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Kontragent faoliyat turi topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri kontragent faoliyat turi ID"
}
```

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Token topilmadi yoki noto'g'ri"
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Ruxsat yo'q"
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

### Icon
- **Type:** String
- **Required:** Yes (for create)
- **Description:** Icon identifier or icon name (e.g., "shop-icon", "service-icon")

### Status
- **Type:** String (enum)
- **Required:** No (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`

---

## Examples

### Example 1: Get All Contragent Types

**Request:**

```bash
curl -X GET http://localhost:5000/api/contragent-types
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Savdo",
      "icon": "shop-icon",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 2: Get Contragent Type by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/contragent-types/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo",
    "icon": "shop-icon",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Create Contragent Type (Admin Only)

**Request:**

```bash
curl -X POST http://localhost:5000/api/contragent-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Savdo",
    "icon": "shop-icon",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo",
    "icon": "shop-icon",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 4: Update Contragent Type (Admin Only)

**Request:**

```bash
curl -X PUT http://localhost:5000/api/contragent-types/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Savdo (Updated)",
    "icon": "shop-icon-updated"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Savdo (Updated)",
    "icon": "shop-icon-updated",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 5: Delete Contragent Type (Admin Only)

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/contragent-types/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Kontragent faoliyat turi muvaffaqiyatli o'chirildi"
}
```

### Example 6: Filter by Status

**Request:**

```bash
curl -X GET "http://localhost:5000/api/contragent-types?status=active"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Savdo",
      "icon": "shop-icon",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Notes

1. **Public Access:** GET endpoints are public and can be accessed without authentication. This allows frontend applications to fetch available contragent types for registration forms.

2. **Admin Only:** POST, PUT, and DELETE endpoints require Admin authentication. Only admins can create, update, or delete contragent types.

3. **Status Management:** Contragent types can be set to 'active' or 'inactive'. Only active contragent types should be used when creating new contragents.

4. **Icon Field:** The icon field is a string that can represent an icon identifier, icon name, or icon class. The exact format depends on your frontend implementation.

5. **Timestamps:** All contragent type records include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

6. **Usage in Contragent Registration:** When creating a new contragent, the `activityType` field must reference a valid ContragentType ID with status 'active'.

---

**Last Updated:** 2024-01-15





