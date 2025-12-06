# Category API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Create Category](#1-create-category)
  - [Get All Categories](#2-get-all-categories)
  - [Get Category by ID](#3-get-category-by-id)
  - [Update Category](#4-update-category)
  - [Update Category Status](#5-update-category-status)
  - [Delete Category](#6-delete-category)
  - [Create Subcategory](#7-create-subcategory)
  - [Get All Subcategories](#8-get-all-subcategories)
  - [Update Subcategory](#9-update-subcategory)
  - [Update Subcategory Status](#10-update-subcategory-status)
  - [Delete Subcategory](#11-delete-subcategory)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Category API provides endpoints for managing categories and subcategories in the system. Categories can be created by Contragents, and each category can have subcategories. The system uses a hierarchical structure where subcategories belong to parent categories.

**Base Path:** `/api/category`

---

## Base URL

```
http://localhost:5000/api/category
```

---

## Authentication

Most endpoints require authentication using JWT token. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required for:**
- Creating categories/subcategories
- Updating categories/subcategories
- Deleting categories/subcategories
- Updating status

**Not required for:**
- Getting categories/subcategories (list and by ID)

---

## Data Models

### Category Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required, min 2 characters)",
  "slug": "string (auto-generated, unique, lowercase)",
  "parent": "object | null (reference to Category, null for top-level categories)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdBy": "object (reference to creator - Admin, ShopOwner, or Contragent)",
  "createdByModel": "string (enum: 'Admin' | 'ShopOwner' | 'Contragent')",
  "subcategories": "array (virtual field, only when populated)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Parent Object (when populated):**
```json
{
  "_id": "string",
  "name": "string",
  "slug": "string",
  "status": "string"
}
```

**CreatedBy Object (when populated):**
```json
{
  "_id": "string",
  "name": "string",
  "username": "string (for Admin)",
  "phone": "string (for Contragent/ShopOwner)"
}
```

---

## Endpoints

### 1. Create Category

Create a new top-level category.

**Endpoint:** `POST /api/category/create`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "parent": "string | null (optional, MongoDB ObjectId of parent Category)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, minimum 2 characters
- `parent`: Optional, if provided must be a valid Category ID
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "parent": null,
    "status": "active",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate name, or invalid parent
- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 2. Get All Categories

Retrieve all top-level categories with optional filtering and pagination.

**Endpoint:** `GET /api/category/list`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'

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
      "name": "Elektronika",
      "slug": "elektronika",
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ABC MChJ",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Telefonlar",
          "slug": "telefonlar",
          "status": "active"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 3. Get Category by ID

Retrieve a specific category by its ID.

**Endpoint:** `GET /api/category/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Telefonlar",
        "slug": "telefonlar",
        "status": "active"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid category ID format
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

---

### 4. Update Category

Update an existing category's information.

**Endpoint:** `PUT /api/category/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, min 2 chars)",
  "parent": "string | null (optional, MongoDB ObjectId of parent Category)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Name must be unique within the same parent level
- If removing parent (making it top-level), category must not have subcategories

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika (Updated)",
    "slug": "elektronika-updated",
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "subcategories": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate name, invalid parent, or category has subcategories
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

---

### 5. Update Category Status

Update only the status of a category.

**Endpoint:** `PUT /api/category/:id/status`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Request Body:**

```json
{
  "status": "string (required, 'active' | 'inactive')"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "parent": null,
    "status": "inactive",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "subcategories": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid status value or invalid ID
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

---

### 6. Delete Category

Delete a category.

**Endpoint:** `DELETE /api/category/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid category ID format or category has subcategories
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

**Note:** A category cannot be deleted if it has subcategories. Delete all subcategories first.

---

### 7. Create Subcategory

Create a new subcategory (category with a parent).

**Endpoint:** `POST /api/category/subcategory/create`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "parent": "string (required, MongoDB ObjectId of parent Category)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, minimum 2 characters
- `parent`: Required, must be a valid Category ID (top-level category, not another subcategory)
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Telefonlar",
    "slug": "telefonlar",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Elektronika",
      "slug": "elektronika",
      "status": "active"
    },
    "status": "active",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate name, invalid parent, or parent is a subcategory
- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 8. Get All Subcategories

Retrieve all subcategories with optional filtering and pagination.

**Endpoint:** `GET /api/category/subcategory/list`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `parent` (optional) - Filter by parent category ID

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
      "_id": "507f1f77bcf86cd799439013",
      "name": "Telefonlar",
      "slug": "telefonlar",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Elektronika",
        "slug": "elektronika",
        "status": "active"
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ABC MChJ",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 9. Update Subcategory

Update an existing subcategory's information.

**Endpoint:** `PUT /api/category/subcategory/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the subcategory

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, min 2 chars)",
  "parent": "string (optional, MongoDB ObjectId of parent Category)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Parent must always be set (cannot be null for subcategory)
- Name must be unique within the same parent level

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Telefonlar (Updated)",
    "slug": "telefonlar-updated",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Elektronika",
      "slug": "elektronika",
      "status": "active"
    },
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate name, invalid parent, or invalid ID
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Subcategory not found
- **500 Internal Server Error** - Server error

---

### 10. Update Subcategory Status

Update only the status of a subcategory.

**Endpoint:** `PUT /api/category/subcategory/:id/status`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the subcategory

**Request Body:**

```json
{
  "status": "string (required, 'active' | 'inactive')"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Telefonlar",
    "slug": "telefonlar",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Elektronika",
      "slug": "elektronika",
      "status": "active"
    },
    "status": "inactive",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid status value or invalid ID
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Subcategory not found
- **500 Internal Server Error** - Server error

---

### 11. Delete Subcategory

Delete a subcategory.

**Endpoint:** `DELETE /api/category/subcategory/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the subcategory

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid subcategory ID format
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Subcategory not found
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
- **403 Forbidden** - Token is not for contragent
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
      "message": "Kategoriya nomi kiritilishi shart"
    }
  ]
}
```

#### Duplicate Name (400)

```json
{
  "success": false,
  "message": "Bu nom bilan kategoriya allaqachon mavjud"
}
```

#### Invalid Parent (400)

```json
{
  "success": false,
  "message": "Ota kategoriya topilmadi"
}
```

#### Category Has Subcategories (400)

```json
{
  "success": false,
  "message": "Bu kategoriyaning sub kategoriyalari mavjud. Avval sub kategoriyalarni o'chiring"
}
```

#### Subcategory Cannot Have Subcategory Parent (400)

```json
{
  "success": false,
  "message": "Sub kategoriya o'zining sub kategoriyasiga ega bo'la olmaydi"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Kategoriya topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri kategoriya ID"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 2 characters
- **Trim:** Yes
- **Unique:** Yes (within the same parent level)

### Slug
- **Type:** String
- **Auto-generated:** Yes (from name)
- **Format:** Lowercase, hyphen-separated
- **Unique:** Yes (globally unique)
- **Example:** "Elektronika" → "elektronika", "Telefonlar" → "telefonlar"

### Parent
- **Type:** MongoDB ObjectId (reference to Category)
- **Required:** No (for category), Yes (for subcategory)
- **Default:** `null` (for top-level categories)
- **Description:** 
  - For categories: Optional, if provided must be a valid Category ID
  - For subcategories: Required, must be a top-level category (not another subcategory)

### Status
- **Type:** String (enum)
- **Required:** Yes
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`

### CreatedBy
- **Type:** MongoDB ObjectId (reference to Admin, ShopOwner, or Contragent)
- **Required:** Yes
- **Auto-set:** Yes (from authentication token)

### CreatedByModel
- **Type:** String (enum)
- **Required:** Yes
- **Allowed Values:** `'Admin'`, `'ShopOwner'`, `'Contragent'`
- **Auto-set:** Yes (from authentication token)

---

## Examples

### Example 1: Create Category

**Request:**

```bash
curl -X POST http://localhost:5000/api/category/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elektronika",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "parent": null,
    "status": "active",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 2: Create Subcategory

**Request:**

```bash
curl -X POST http://localhost:5000/api/category/subcategory/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Telefonlar",
    "parent": "507f1f77bcf86cd799439011",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Telefonlar",
    "slug": "telefonlar",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Elektronika",
      "slug": "elektronika",
      "status": "active"
    },
    "status": "active",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Contragent",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Example 3: Get All Categories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/category/list?page=1&limit=10&status=active"
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
      "name": "Elektronika",
      "slug": "elektronika",
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ABC MChJ",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Telefonlar",
          "slug": "telefonlar",
          "status": "active"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 4: Get All Subcategories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/category/subcategory/list?page=1&limit=10&status=active&parent=507f1f77bcf86cd799439011"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "total": 20,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Telefonlar",
      "slug": "telefonlar",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Elektronika",
        "slug": "elektronika",
        "status": "active"
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ABC MChJ",
        "phone": "+998901234567"
      },
      "createdByModel": "Contragent",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Example 5: Update Category

**Request:**

```bash
curl -X PUT http://localhost:5000/api/category/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elektronika (Updated)",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika (Updated)",
    "slug": "elektronika-updated",
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "subcategories": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 6: Update Category Status

**Request:**

```bash
curl -X PUT http://localhost:5000/api/category/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Kategoriya statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "parent": null,
    "status": "inactive",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC MChJ",
      "phone": "+998901234567"
    },
    "createdByModel": "Contragent",
    "subcategories": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 7: Delete Category

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/category/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli o'chirildi"
}
```

---

## Notes

1. **Slug Generation:** Slugs are automatically generated from the category name. They are lowercase, hyphen-separated, and globally unique.

2. **Hierarchical Structure:** 
   - Categories (top-level) have `parent: null`
   - Subcategories have a `parent` reference to a top-level category
   - Subcategories cannot have other subcategories as parents (only 2 levels deep)

3. **Name Uniqueness:** Category names must be unique within the same parent level. For example, you can have "Telefonlar" under "Elektronika" and also "Telefonlar" under "Maishiy texnika", but not two "Telefonlar" under the same parent.

4. **Deletion Protection:** A category cannot be deleted if it has subcategories. Delete all subcategories first.

5. **CreatedBy Tracking:** The system automatically tracks who created each category/subcategory using the authentication token.

6. **Virtual Fields:** The `subcategories` field is a virtual field that is populated when fetching categories, showing all subcategories belonging to that category.

7. **Pagination:** The `getAllCategories` and `getAllSubcategories` endpoints support pagination with `page` and `limit` query parameters.

8. **Status Filtering:** You can filter categories/subcategories by status in the list endpoints.

---

**Last Updated:** 2024-01-15


