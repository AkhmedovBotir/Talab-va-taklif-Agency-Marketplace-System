# Category API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get All Categories](#1-get-all-categories)
  - [Get Category by ID](#2-get-category-by-id)
  - [Get All Subcategories](#3-get-all-subcategories)
- [Error Handling](#error-handling)
- [Notes](#notes)
- [Examples](#examples)

---

## Overview

Category API provides **read-only** endpoints for viewing categories and subcategories in the system. Categories and subcategories are now managed exclusively by Admins. Contragents can only view (read) categories and subcategories that are created by Admins and are active.

**Important Notes:**
- Categories and subcategories are created and managed by Admins only
- Contragents can only view active categories and subcategories created by Admins
- This API provides read-only access for Contragents to browse available categories when creating products
- For creating, updating, or deleting categories, use the Admin Category API (`/api/admins/categories`)

**Base Path:** `/api/category`

---

## Base URL

```
http://localhost:5000/api/category
```

---

## Authentication

All endpoints are **public** and do not require authentication. However, authentication is optional and can be used if needed.

**Format:** `Authorization: Bearer <token>` (optional)

**Note:** All endpoints are read-only and accessible without authentication.

---

## Data Models

### Category Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required, min 2 characters)",
  "slug": "string (auto-generated, unique, lowercase)",
  "image": "string | null (base64 image or URL, nullable)",
  "censored": "boolean (default: false, true means 18+ only)",
  "parent": "object | null (reference to Category, null for top-level categories)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdBy": "object (reference to Admin)",
  "createdByModel": "string (always 'Admin')",
  "subcategories": "array (virtual field, only when populated)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** 
- Only categories with `createdByModel: 'Admin'` and `status: 'active'` are returned by default
- `censored: true` means the category is for users 18 years and older only
- `image` can be base64 encoded image or URL string

### Subcategory Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required, min 2 characters)",
  "slug": "string (auto-generated, unique, lowercase)",
  "image": "null (always null, subcategories don't have images)",
  "censored": "boolean (inherited from parent category)",
  "parent": "object (reference to Category, required)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdBy": "object (reference to Admin)",
  "createdByModel": "string (always 'Admin')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:**
- Subcategories always have `image: null` (they don't have their own images)
- Subcategories inherit `censored` value from their parent category automatically
- When parent category's `censored` status changes, subcategories automatically inherit the new value

**Parent Object (when populated):**
```json
{
  "_id": "string",
  "name": "string",
  "slug": "string",
  "status": "string",
  "image": "string | null",
  "censored": "boolean"
}
```

**Subcategory Object (when populated in subcategories array):**
```json
{
  "_id": "string",
  "name": "string",
  "slug": "string",
  "status": "string",
  "image": "null (always null for subcategories)",
  "censored": "boolean (inherited from parent category)"
}
```

**CreatedBy Object (when populated):**
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

**Note:** This API only provides read-only endpoints. To create, update, or delete categories, use the Admin Category API at `/api/admins/categories`.

### 1. Get All Categories

Retrieve all top-level categories created by Admins that are active. This endpoint is read-only and returns only Admin-created, active categories.

**Endpoint:** `GET /api/category/list`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive' (default: 'active')

**Note:** Only categories with `createdByModel: 'Admin'` and `status: 'active'` are returned by default.

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
      "image": "data:image/png;base64,...",
      "censored": false,
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "createdByModel": "Admin",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Telefonlar",
          "slug": "telefonlar",
          "status": "active",
          "image": null,
          "censored": false
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

### 2. Get Category by ID

Retrieve a specific category by its ID. Only returns Admin-created categories.

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
    "image": "data:image/png;base64,...",
    "censored": false,
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "username": "admin",
      "telefonRaqam": "+998901234567"
    },
    "createdByModel": "Admin",
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Telefonlar",
        "slug": "telefonlar",
        "status": "active",
        "image": null,
        "censored": false
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid category ID format
- **404 Not Found** - Category not found or not created by Admin
- **500 Internal Server Error** - Server error

---

### 3. Get All Subcategories

Retrieve all subcategories created by Admins that are active. This endpoint is read-only and returns only Admin-created, active subcategories.

**Endpoint:** `GET /api/category/subcategory/list`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive' (default: 'active')
- `parent` (optional) - Filter by parent category ID

**Note:** Only subcategories with `createdByModel: 'Admin'` and `status: 'active'` are returned by default.

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
      "image": null,
      "censored": false,
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Elektronika",
        "slug": "elektronika",
        "status": "active",
        "image": "data:image/png;base64,...",
        "censored": false
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "createdByModel": "Admin",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Xato xabari",
  "error": "Detailed error message (optional)"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid category ID format
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

### Common Error Messages

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

## Notes

1. **Read-Only API:** This API is read-only. All categories and subcategories are managed by Admins through the Admin Category API (`/api/admins/categories`).

2. **Filtering:** 
   - Only categories/subcategories with `createdByModel: 'Admin'` are returned
   - By default, only `status: 'active'` categories/subcategories are returned
   - You can filter by `status` query parameter if needed

3. **Category Fields:**
   - `image`: Can be base64 encoded image or URL string, nullable
   - `censored`: Boolean, `true` means the category is for users 18 years and older only
   - `status`: `'active'` means visible, `'inactive'` means hidden

4. **Subcategory Fields:**
   - `image`: Always `null` - subcategories don't have their own images
   - `censored`: Automatically inherited from parent category - cannot be set manually
   - When parent category's `censored` status changes, subcategories automatically inherit the new value

5. **Hierarchical Structure:** 
   - Categories (top-level) have `parent: null`
   - Subcategories have a `parent` reference to a top-level category
   - Subcategories cannot have other subcategories as parents (only 2 levels deep)

6. **Virtual Fields:** The `subcategories` field is a virtual field that is populated when fetching categories, showing all subcategories belonging to that category.

7. **Pagination:** The `getAllCategories` and `getAllSubcategories` endpoints support pagination with `page` and `limit` query parameters.

8. **For Creating/Updating Categories:** Use the Admin Category API at `/api/admins/categories`. See `docs/admin-category-api.md` for details.

---

## Examples

### Example 1: Get All Categories

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
      "image": "data:image/png;base64,...",
      "censored": false,
      "parent": null,
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "createdByModel": "Admin",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Telefonlar",
          "slug": "telefonlar",
          "status": "active",
          "image": null,
          "censored": false
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 2: Get Category by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/category/507f1f77bcf86cd799439011"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "image": "data:image/png;base64,...",
    "censored": false,
    "parent": null,
    "status": "active",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "username": "admin",
      "telefonRaqam": "+998901234567"
    },
    "createdByModel": "Admin",
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Telefonlar",
        "slug": "telefonlar",
        "status": "active",
        "image": null,
        "censored": false
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Get All Subcategories

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
      "image": null,
      "censored": false,
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Elektronika",
        "slug": "elektronika",
        "status": "active",
        "image": "data:image/png;base64,...",
        "censored": false
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "createdByModel": "Admin",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

**Last Updated:** 2024-01-15

**Note:** For creating, updating, or deleting categories and subcategories, please use the Admin Category API. See `docs/admin-category-api.md` for complete documentation.
