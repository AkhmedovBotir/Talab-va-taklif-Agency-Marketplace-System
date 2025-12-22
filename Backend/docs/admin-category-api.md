# Admin Category Management API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Category Management](#category-management)
    - [Create Category](#1-create-category)
    - [Get All Categories](#2-get-all-categories)
    - [Get Category by ID](#3-get-category-by-id)
    - [Update Category](#4-update-category)
    - [Update Category Status](#5-update-category-status)
    - [Delete Category](#6-delete-category)
  - [Subcategory Management](#subcategory-management)
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

Admin Category Management API provides endpoints for admins to manage categories and subcategories. Only admins can create, update, and delete categories and subcategories.

**Base Path:** `/api/admins/categories`

**Key Features:**
- Create and manage categories with images and censored status
- Create and manage subcategories
- Update category and subcategory status
- Filter categories by status and censored flag
- Full CRUD operations for both categories and subcategories

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

All endpoints require admin authentication using JWT token from Admin login.

**Format:** `Authorization: Bearer <token>`

---

## Data Models

### Category Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2+ characters, required)",
  "slug": "string (auto-generated, unique)",
  "image": "string (base64 image or URL, nullable)",
  "censored": "boolean (default: false)",
  "parent": "null (for top-level categories)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdBy": "ObjectId (reference to Admin)",
  "createdByModel": "string (always 'Admin')",
  "subcategories": [
    {
      "_id": "string",
      "name": "string",
      "slug": "string",
      "status": "string",
      "image": "string",
      "censored": "boolean"
    }
  ],
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Subcategory Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2+ characters, required)",
  "slug": "string (auto-generated, unique)",
  "image": "null (always null, subcategories don't have images)",
  "censored": "boolean (inherited from parent category)",
  "parent": "ObjectId (reference to Category, required)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdBy": "ObjectId (reference to Admin)",
  "createdByModel": "string (always 'Admin')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Important Notes:**
- `censored`: Inherited from parent category automatically. Cannot be set manually for subcategories.
- `image`: Always `null` for subcategories. Subcategories don't have their own images.
- `status`: `active` means visible, `inactive` means hidden
- Subcategories must have a parent category (cannot be top-level)
- When parent category's `censored` status changes, subcategories automatically inherit the new value

---

## Endpoints

### Category Management

#### 1. Create Category

Create a new top-level category.

**Endpoint:** `POST /api/admins/categories`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Elektronika",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "censored": false,
  "status": "active"
}
```

**Request Fields:**
- `name` (required) - Category name (minimum 2 characters)
- `image` (optional) - Base64 encoded image or URL
- `censored` (optional, default: false) - Whether category is censored
- `status` (optional, default: 'active') - Category status

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "slug": "elektronika",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "censored": false,
    "parent": null,
    "status": "active",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Admin",
    "subcategories": [],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error or duplicate name
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

#### 2. Get All Categories

Get all top-level categories with optional filters.

**Endpoint:** `GET /api/admins/categories`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by status: `active` or `inactive`
- `censored` (optional) - Filter by censored flag: `true` or `false`
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

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
      "name": "Elektronika",
      "slug": "elektronika",
      "image": "data:image/png;base64,...",
      "censored": false,
      "status": "active",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Smartfonlar",
          "slug": "smartfonlar",
          "status": "active",
          "image": null,
          "censored": false
        }
      ],
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User",
        "username": "admin",
        "telefonRaqam": "+998901234567"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Category by ID

Get a specific category by ID with its subcategories.

**Endpoint:** `GET /api/admins/categories/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

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
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Smartfonlar",
        "slug": "smartfonlar",
        "status": "active",
        "image": null,
        "censored": false
      }
    ],
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid category ID
- **404 Not Found** - Category not found
- **401 Unauthorized** - Token missing or invalid

---

#### 4. Update Category

Update an existing category.

**Endpoint:** `PUT /api/admins/categories/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Request Body:**

```json
{
  "name": "Updated Category Name",
  "image": "data:image/png;base64,...",
  "censored": true,
  "status": "active"
}
```

**Request Fields (all optional):**
- `name` - Category name
- `image` - Base64 encoded image or URL
- `censored` - Whether category is censored
- `status` - Category status

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Category Name",
    "slug": "updated-category-name",
    "image": "data:image/png;base64,...",
    "censored": true,
    "status": "active",
    "subcategories": [...],
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error or duplicate name
- **404 Not Found** - Category not found
- **401 Unauthorized** - Token missing or invalid

---

#### 5. Update Category Status

Update only the status of a category.

**Endpoint:** `PUT /api/admins/categories/:id/status`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Request Body:**

```json
{
  "status": "inactive"
}
```

**Request Fields:**
- `status` (required) - Must be `active` or `inactive`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elektronika",
    "status": "inactive",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### 6. Delete Category

Delete a category. Cannot delete if it has subcategories.

**Endpoint:** `DELETE /api/admins/categories/:id`

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
- **400 Bad Request** - Category has subcategories
- **404 Not Found** - Category not found
- **401 Unauthorized** - Token missing or invalid

---

### Subcategory Management

#### 7. Create Subcategory

Create a new subcategory under a category.

**Endpoint:** `POST /api/admins/categories/subcategories`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Smartfonlar",
  "parent": "507f1f77bcf86cd799439011",
  "status": "active"
}
```

**Request Fields:**
- `name` (required) - Subcategory name (minimum 2 characters)
- `parent` (required) - Parent category ID
- `status` (optional, default: 'active') - Subcategory status

**Note:** 
- `image` and `censored` are not accepted for subcategories
- `censored` is automatically inherited from the parent category
- `image` is always set to `null` for subcategories

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Smartfonlar",
    "slug": "smartfonlar",
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
    "createdBy": "507f1f77bcf86cd799439012",
    "createdByModel": "Admin",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error, parent not found, or parent has a parent
- **401 Unauthorized** - Token missing or invalid
- **500 Internal Server Error** - Server error

---

#### 8. Get All Subcategories

Get all subcategories with optional filters.

**Endpoint:** `GET /api/admins/categories/subcategories`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by status: `active` or `inactive`
- `censored` (optional) - Filter by censored flag: `true` or `false`
- `parent` (optional) - Filter by parent category ID
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 15,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Smartfonlar",
      "slug": "smartfonlar",
      "image": null,
      "censored": false,
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Elektronika",
        "slug": "elektronika",
        "status": "active",
        "image": null,
        "censored": false
      },
      "status": "active",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 9. Update Subcategory

Update an existing subcategory.

**Endpoint:** `PUT /api/admins/categories/subcategories/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the subcategory

**Request Body:**

```json
{
  "name": "Updated Subcategory Name",
  "parent": "507f1f77bcf86cd799439011",
  "status": "active"
}
```

**Request Fields (all optional):**
- `name` - Subcategory name
- `parent` - Parent category ID (must be a top-level category)
- `status` - Subcategory status

**Note:**
- `image` and `censored` are not accepted for subcategories
- `censored` is automatically inherited from the parent category
- If `parent` is updated, `censored` will be updated to match the new parent's `censored` value

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Sub kategoriya muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Updated Subcategory Name",
    "slug": "updated-subcategory-name",
    "image": null,
    "censored": false,
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Elektronika",
      "censored": false
    },
    "status": "active",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation error, parent not found, or parent has a parent
- **404 Not Found** - Subcategory not found
- **401 Unauthorized** - Token missing or invalid

---

#### 10. Update Subcategory Status

Update only the status of a subcategory.

**Endpoint:** `PUT /api/admins/categories/subcategories/:id/status`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the subcategory

**Request Body:**

```json
{
  "status": "inactive"
}
```

**Request Fields:**
- `status` (required) - Must be `active` or `inactive`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kategoriya statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Smartfonlar",
    "status": "inactive",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### 11. Delete Subcategory

Delete a subcategory.

**Endpoint:** `DELETE /api/admins/categories/subcategories/:id`

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
- **404 Not Found** - Subcategory not found
- **401 Unauthorized** - Token missing or invalid

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
- **201 Created** - Resource created successfully
- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Authentication required or invalid token
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Bu nom bilan kategoriya allaqachon mavjud"
}
```

```json
{
  "success": false,
  "message": "Ota kategoriya topilmadi"
}
```

```json
{
  "success": false,
  "message": "Bu kategoriyaning sub kategoriyalari mavjud. Avval sub kategoriyalarni o'chiring"
}
```

---

## Validation Rules

### Category Name
- Required (for create)
- Minimum length: 2 characters
- Must be unique within the same parent level
- Trimmed automatically

### Image
- **For Categories:** Optional, can be base64 encoded image or URL string
- **For Subcategories:** Always `null`, not accepted in requests
- Format: `data:image/png;base64,...` or URL

### Censored
- **For Categories:** Optional (default: false), Boolean value, `true` = censored, `false` = not censored
- **For Subcategories:** Automatically inherited from parent category, cannot be set manually

### Status
- Optional (default: 'active')
- Must be `active` or `inactive`
- `active` = visible, `inactive` = hidden

### Parent (for subcategories)
- Required for subcategories
- Must be a valid category ID
- Parent category must not have a parent (must be top-level)
- Cannot be the same as the subcategory ID (circular reference)

---

## Examples

### Example 1: Create Category

```bash
curl -X POST "http://localhost:5000/api/admins/categories" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elektronika",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "censored": false,
    "status": "active"
  }'
```

### Example 2: Get All Categories with Filters

```bash
curl -X GET "http://localhost:5000/api/admins/categories?status=active&censored=false&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Create Subcategory

```bash
curl -X POST "http://localhost:5000/api/admins/categories/subcategories" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartfonlar",
    "parent": "507f1f77bcf86cd799439011",
    "status": "active"
  }'
```

**Note:** `censored` is automatically inherited from the parent category. `image` is not accepted and will always be `null`.

### Example 4: Update Category

```bash
curl -X PUT "http://localhost:5000/api/admins/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category Name",
    "censored": true
  }'
```

**Note:** When a category's `censored` status is updated, all its subcategories automatically inherit the new value.

### Example 5: Delete Category

```bash
curl -X DELETE "http://localhost:5000/api/admins/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Category Hierarchy:**
   - Categories are top-level (no parent)
   - Subcategories must have a parent category
   - Subcategories cannot have their own subcategories (max 2 levels)

2. **Censored Flag:**
   - **For Categories:** `censored: true` means the category is censored, `censored: false` means it's not censored
   - **For Subcategories:** `censored` is automatically inherited from the parent category and cannot be set manually
   - When a category's `censored` status is updated, all its subcategories automatically inherit the new value
   - This flag is independent of status

3. **Status:**
   - `active` = category/subcategory is visible and can be used
   - `inactive` = category/subcategory is hidden but not deleted

4. **Image:**
   - **For Categories:** Can be base64 encoded image (recommended format: `data:image/png;base64,...`) or URL string, optional
   - **For Subcategories:** Always `null`, subcategories don't have their own images

5. **Deletion:**
   - Cannot delete a category if it has subcategories
   - Must delete all subcategories first, then delete the category
   - Subcategories can be deleted independently

6. **Slug:**
   - Automatically generated from category/subcategory name
   - Unique across all categories and subcategories
   - Used for SEO-friendly URLs

7. **Created By:**
   - All categories and subcategories are created by admins
   - `createdByModel` is always `'Admin'`
   - `createdBy` references the Admin who created it

---

**Last Updated:** 2024-01-15

