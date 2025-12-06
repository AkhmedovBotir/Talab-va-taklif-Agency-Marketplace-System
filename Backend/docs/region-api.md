# Region API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Create Region](#1-create-region)
  - [Get All Regions](#2-get-all-regions)
  - [Get Regions by Type](#3-get-regions-by-type)
  - [Get Region by ID](#4-get-region-by-id)
  - [Get Region Children](#5-get-region-children)
  - [Update Region](#6-update-region)
  - [Update Region Status](#7-update-region-status)
  - [Delete Region](#8-delete-region)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Region API provides endpoints for managing geographical regions in the system. The system supports a hierarchical structure with three types: regions, districts, and MFY (Mahalla Fuqarolar Yig'ini). Each region can have a parent region, creating a tree-like structure.

**Base Path:** `/api/regions`

---

## Base URL

```
http://localhost:5000/api/regions
```

---

## Authentication

Currently, the API does not require authentication. However, it is recommended to implement authentication middleware for production use.

---

## Data Models

### Region Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required)",
  "type": "string (enum: 'region' | 'district' | 'mfy')",
  "parent": "object | null (reference to parent Region)",
  "code": "string (unique, required)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Parent Object (when populated):**
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

### 1. Create Region

Create a new region.

**Endpoint:** `POST /api/regions`

**Request Body:**

```json
{
  "name": "string (required)",
  "type": "string (required, 'region' | 'district' | 'mfy')",
  "parent": "string | null (optional, MongoDB ObjectId)",
  "code": "string (required, unique)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, trimmed string
- `type`: Required, must be 'region', 'district', or 'mfy'
- `parent`: Optional, must be a valid Region ID if provided
- `code`: Required, must be unique
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Xudud muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate code, or invalid parent
- **500 Internal Server Error** - Server error

---

### 2. Get All Regions

Retrieve all regions with optional filtering and pagination.

**Endpoint:** `GET /api/regions`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `type` (optional) - Filter by type: 'region', 'district', or 'mfy'
- `parent` (optional) - Filter by parent ID. Use 'null' for regions without parent
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
      "name": "Toshkent shahri",
      "type": "region",
      "parent": null,
      "code": "TASH",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Yunusobod tumani",
      "type": "district",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent shahri",
        "type": "region",
        "code": "TASH"
      },
      "code": "YUN",
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

### 3. Get Regions by Type

Retrieve regions filtered by type.

**Endpoint:** `GET /api/regions/type/:type`

**URL Parameters:**
- `type` (required) - Region type: 'region', 'district', or 'mfy'

**Query Parameters:**
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `parent` (optional) - Filter by parent ID. Use 'null' for regions without parent

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Toshkent shahri",
      "type": "region",
      "parent": null,
      "code": "TASH",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid type
- **500 Internal Server Error** - Server error

---

### 4. Get Region by ID

Retrieve a specific region by its ID.

**Endpoint:** `GET /api/regions/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the region

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid region ID format
- **404 Not Found** - Region not found
- **500 Internal Server Error** - Server error

---

### 5. Get Region Children

Retrieve all child regions of a specific region.

**Endpoint:** `GET /api/regions/:id/children`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the parent region

**Query Parameters:**
- `status` (optional) - Filter by status: 'active' or 'inactive'

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Yunusobod tumani",
      "type": "district",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent shahri",
        "type": "region",
        "code": "TASH"
      },
      "code": "YUN",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid region ID format
- **404 Not Found** - Region not found
- **500 Internal Server Error** - Server error

---

### 6. Update Region

Update an existing region's information.

**Endpoint:** `PUT /api/regions/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the region

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional)",
  "type": "string (optional, 'region' | 'district' | 'mfy')",
  "parent": "string | null (optional, MongoDB ObjectId)",
  "code": "string (optional, unique)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Code must be unique (cannot duplicate existing values)
- Parent must be a valid Region ID if provided
- Region cannot be its own parent (circular reference prevention)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Xudud muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri (Updated)",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate code, invalid parent, circular reference, or invalid ID
- **404 Not Found** - Region not found
- **500 Internal Server Error** - Server error

---

### 7. Update Region Status

Update only the status of a region.

**Endpoint:** `PATCH /api/regions/:id/status`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the region

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
  "message": "Xudud statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "inactive",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid status value or invalid ID
- **404 Not Found** - Region not found
- **500 Internal Server Error** - Server error

---

### 8. Delete Region

Delete a region.

**Endpoint:** `DELETE /api/regions/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the region

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Xudud va uning bolalar xududlari muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid region ID format
- **404 Not Found** - Region not found
- **500 Internal Server Error** - Server error

**Note:** When a region is deleted, all its child regions (and their children recursively) are also deleted automatically.

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
      "message": "Xudud nomi kiritilishi shart"
    },
    {
      "field": "type",
      "message": "Xudud turi \"region\", \"district\" yoki \"mfy\" bo'lishi kerak"
    }
  ]
}
```

#### Duplicate Code (400)

```json
{
  "success": false,
  "message": "Bu kod allaqachon mavjud"
}
```

#### Invalid Parent (400)

```json
{
  "success": false,
  "message": "Ota xudud topilmadi"
}
```

#### Circular Reference (400)

```json
{
  "success": false,
  "message": "Xudud o'zining ota xududi bo'la olmaydi"
}
```


#### Not Found (404)

```json
{
  "success": false,
  "message": "Xudud topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri xudud ID"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Trim:** Yes (whitespace removed from both ends)

### Type
- **Type:** String (enum)
- **Required:** Yes (for create)
- **Allowed Values:** `'region'`, `'district'`, `'mfy'`
- **Description:**
  - `region` - Top-level administrative region
  - `district` - District within a region
  - `mfy` - Mahalla Fuqarolar Yig'ini (neighborhood/community)

### Parent
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** No
- **Default:** `null`
- **Validation:** Must be a valid Region ID if provided
- **Note:** Prevents circular references (region cannot be its own parent)

### Code
- **Type:** String
- **Required:** Yes (for create)
- **Unique:** Yes (must be unique across all regions)
- **Description:** Unique identifier code for the region (e.g., "TASH" for Toshkent shahri)

### Status
- **Type:** String (enum)
- **Required:** No (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`

---

## Examples

### Example 1: Create a Region

**Request:**

```bash
curl -X POST http://localhost:5000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Toshkent shahri",
    "type": "region",
    "code": "TASH",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Xudud muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 2: Create a District with Parent

**Request:**

```bash
curl -X POST http://localhost:5000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yunusobod tumani",
    "type": "district",
    "parent": "507f1f77bcf86cd799439011",
    "code": "YUN",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Xudud muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Yunusobod tumani",
    "type": "district",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Toshkent shahri",
      "type": "region",
      "code": "TASH"
    },
    "code": "YUN",
    "status": "active",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Example 3: Get All Regions with Pagination

**Request:**

```bash
curl -X GET "http://localhost:5000/api/regions?page=1&limit=10&type=region&status=active"
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
      "name": "Toshkent shahri",
      "type": "region",
      "parent": null,
      "code": "TASH",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 4: Get Regions by Type

**Request:**

```bash
curl -X GET "http://localhost:5000/api/regions/type/district?status=active&parent=507f1f77bcf86cd799439011"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Yunusobod tumani",
      "type": "district",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent shahri",
        "type": "region",
        "code": "TASH"
      },
      "code": "YUN",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Example 5: Get Region by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/regions/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 6: Get Region Children

**Request:**

```bash
curl -X GET "http://localhost:5000/api/regions/507f1f77bcf86cd799439011/children?status=active"
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Yunusobod tumani",
      "type": "district",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent shahri",
        "type": "region",
        "code": "TASH"
      },
      "code": "YUN",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Example 7: Update Region

**Request:**

```bash
curl -X PUT http://localhost:5000/api/regions/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Toshkent shahri (Updated)",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Xudud muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri (Updated)",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 8: Update Region Status

**Request:**

```bash
curl -X PATCH http://localhost:5000/api/regions/507f1f77bcf86cd799439011/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Xudud statusi muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent shahri",
    "type": "region",
    "parent": null,
    "code": "TASH",
    "status": "inactive",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 9: Delete Region

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/regions/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "message": "Xudud va uning bolalar xududlari muvaffaqiyatli o'chirildi"
}
```

**Note:** This will also delete all child regions recursively.

### Example 10: Validation Error

**Request:**

```bash
curl -X POST http://localhost:5000/api/regions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T",
    "type": "invalid_type",
    "code": ""
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
      "message": "Xudud nomi kiritilishi shart"
    },
    {
      "field": "type",
      "message": "Xudud turi \"region\", \"district\" yoki \"mfy\" bo'lishi kerak"
    },
    {
      "field": "code",
      "message": "Kod kiritilishi shart"
    }
  ]
}
```

---

## Notes

1. **Hierarchical Structure:** Regions support a parent-child relationship, creating a tree structure. A region can have multiple children, but only one parent.

2. **Circular References:** The system prevents a region from being its own parent or creating circular references in the hierarchy.

3. **Cascading Deletion:** When a region is deleted, all its child regions (and their children recursively) are automatically deleted as well.

4. **Code Uniqueness:** The `code` field must be unique across all regions, regardless of type or parent.

5. **Parent Population:** When fetching regions, parent information is automatically populated if a parent exists.

6. **Status Filtering:** You can filter regions by status in most endpoints. If status is not specified, all statuses are returned (except in `getRegionsByType` where it's optional).

7. **Pagination:** The `getAllRegions` endpoint supports pagination with `page` and `limit` query parameters.

8. **Type Hierarchy:** The typical hierarchy is:
   - `region` (top level, no parent)
   - `district` (child of region)
   - `mfy` (child of district)

---

**Last Updated:** 2024-01-15

