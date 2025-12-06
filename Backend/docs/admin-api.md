# Admin API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Login Admin](#1-login-admin)
  - [Create Admin](#2-create-admin)
  - [Get All Admins](#3-get-all-admins)
  - [Get Admin by ID](#4-get-admin-by-id)
  - [Update Admin](#5-update-admin)
  - [Delete Admin](#6-delete-admin)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Admin API provides endpoints for managing admin users in the system. Each admin has a role (general or admin), personal information, and authentication credentials.

**Base Path:** `/api/admins`

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login, you will receive a JWT token that should be included in the `Authorization` header for protected endpoints.

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** Default is 7 days (configurable via `JWT_EXPIRE` environment variable)

**Note:** Currently, most endpoints do not require authentication. However, it is recommended to implement authentication middleware for production use.

---

## Data Models

### Admin Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-100 characters)",
  "role": "string (enum: 'general' | 'admin')",
  "telefonRaqam": "string (valid phone number)",
  "username": "string (3-30 characters, alphanumeric, lowercase)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** The `parol` (password) field is never returned in API responses for security reasons.

---

## Endpoints

### 1. Login Admin

Authenticate an admin user and receive a JWT token.

**Endpoint:** `POST /api/admins/login`

**Request Body:**

```json
{
  "username": "string (required)",
  "parol": "string (required)"
}
```

**Validation Rules:**
- `username`: Required
- `parol`: Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "general",
      "telefonRaqam": "+998901234567",
      "username": "johndoe",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **401 Unauthorized** - Invalid username or password
- **403 Forbidden** - Account is inactive
- **500 Internal Server Error** - Server error

---

### 2. Create Admin

Create a new admin user.

**Endpoint:** `POST /api/admins`

**Request Body:**

```json
{
  "name": "string (required, 2-100 chars)",
  "role": "string (optional, 'general' | 'admin', default: 'general')",
  "telefonRaqam": "string (required, valid phone format)",
  "username": "string (required, 3-30 chars, alphanumeric)",
  "parol": "string (required, min 6 chars)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `role`: Optional, must be 'general' or 'admin', defaults to 'general'
- `telefonRaqam`: Required, must be a valid phone number format
- `username`: Required, 3-30 characters, alphanumeric only, lowercase, unique
- `parol`: Required, minimum 6 characters
- `status`: Optional, must be 'active' or 'inactive', defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "general",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error or duplicate username/phone
- **500 Internal Server Error** - Server error

---

### 3. Get All Admins

Retrieve all admin users.

**Endpoint:** `GET /api/admins`

**Query Parameters:** None

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "general",
      "telefonRaqam": "+998901234567",
      "username": "johndoe",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "role": "admin",
      "telefonRaqam": "+998901234568",
      "username": "janesmith",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 4. Get Admin by ID

Retrieve a specific admin by their ID.

**Endpoint:** `GET /api/admins/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the admin

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "general",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid admin ID format
- **404 Not Found** - Admin topilmadi
- **500 Internal Server Error** - Server error

---

### 5. Update Admin

Update an existing admin's information.

**Endpoint:** `PUT /api/admins/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the admin

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-100 chars)",
  "role": "string (optional, 'general' | 'admin')",
  "telefonRaqam": "string (optional, valid phone format)",
  "username": "string (optional, 3-30 chars, alphanumeric)",
  "parol": "string (optional, min 6 chars)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Username and telefonRaqam must be unique (cannot duplicate existing values)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "role": "admin",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate username/phone, or invalid ID
- **404 Not Found** - Admin not found
- **500 Internal Server Error** - Server error

---

### 6. Delete Admin

Delete an admin user.

**Endpoint:** `DELETE /api/admins/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the admin

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Admin muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid admin ID format
- **404 Not Found** - Admin topilmadi
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
      "field": "username",
      "message": "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "parol",
      "message": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
    }
  ]
}
```

#### Duplicate Username (400)

```json
{
  "success": false,
  "message": "Bu foydalanuvchi nomi allaqachon mavjud"
}
```

#### Duplicate Phone Number (400)

```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon mavjud"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Admin topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri admin ID"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 2 characters
- **Max Length:** 100 characters
- **Trim:** Yes

### Role
- **Type:** String (enum)
- **Required:** No (defaults to 'general')
- **Allowed Values:** `'general'`, `'admin'`
- **Default:** `'general'`

### Telefon Raqam (Phone Number)
- **Type:** String
- **Required:** Yes (for create)
- **Format:** Valid phone number pattern
- **Pattern:** `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`
- **Unique:** Yes
- **Examples:**
  - `+998901234567`
  - `998901234567`
  - `(998) 90-123-45-67`
  - `998-90-123-45-67`

### Username
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 3 characters
- **Max Length:** 30 characters
- **Format:** Alphanumeric only (letters and numbers)
- **Case:** Automatically converted to lowercase
- **Unique:** Yes
- **Examples:**
  - Valid: `johndoe`, `admin123`, `user01`
  - Invalid: `john_doe` (contains underscore), `John Doe` (contains space)

### Parol (Password)
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 6 characters
- **Storage:** Hashed using bcrypt (salt rounds: 10)
- **Note:** Never returned in API responses

### Status
- **Type:** String (enum)
- **Required:** No (defaults to 'active')
- **Allowed Values:** `'active'`, `'inactive'`
- **Default:** `'active'`
- **Description:** Indicates whether the admin account is active or inactive

---

## Examples

### Example 1: Login Admin

**Request:**

```bash
curl -X POST http://localhost:5000/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "parol": "securepass123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInVzZXJuYW1lIjoiam9obmRvZSIsInJvbGUiOiJnZW5lcmFsIiwiaWF0IjoxNzA1MzI0MDAwLCJleHAiOjE3MDU5Mjg4MDB9.abc123...",
    "admin": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "general",
      "telefonRaqam": "+998901234567",
      "username": "johndoe",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 2: Create a General Admin

**Request:**

```bash
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "role": "general",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "parol": "securepass123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Admin muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "general",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Create an Admin Role User

**Request:**

```bash
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "role": "admin",
    "telefonRaqam": "+998901234568",
    "username": "janesmith",
    "parol": "adminpass456"
  }'
```

### Example 4: Get All Admins

**Request:**

```bash
curl -X GET http://localhost:5000/api/admins
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "general",
      "telefonRaqam": "+998901234567",
      "username": "johndoe",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "role": "admin",
      "telefonRaqam": "+998901234568",
      "username": "janesmith",
      "status": "active",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Example 5: Get Admin by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/admins/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "general",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 6: Update Admin

**Request:**

```bash
curl -X PUT http://localhost:5000/api/admins/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "role": "admin"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Admin muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "role": "admin",
    "telefonRaqam": "+998901234567",
    "username": "johndoe",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 7: Delete Admin

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/admins/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "message": "Admin muvaffaqiyatli o'chirildi"
}
```

### Example 8: Validation Error

**Request:**

```bash
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "J",
    "username": "ab",
    "parol": "123"
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
      "message": "Ism kamida 2 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "telefonRaqam",
      "message": "Telefon raqami kiritilishi shart"
    },
    {
      "field": "username",
      "message": "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "parol",
      "message": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
    }
  ]
}
```

---

## Notes

1. **Password Security:** Passwords are automatically hashed using bcrypt before being stored in the database. The password is never returned in API responses.

2. **Username Uniqueness:** Usernames must be unique across all admins. The system automatically converts usernames to lowercase.

3. **Phone Number Uniqueness:** Phone numbers must be unique across all admins.

4. **Timestamps:** All admin records include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

5. **Role Default:** If no role is specified when creating an admin, it defaults to `'general'`.

6. **Status Default:** If no status is specified when creating an admin, it defaults to `'active'`.

7. **Partial Updates:** When updating an admin, you only need to include the fields you want to change. All fields are optional in update requests.

---

## Health Check

To verify the server is running, you can use the health check endpoint:

**Endpoint:** `GET /health`

**Response:**

```json
{
  "success": true,
  "message": "Server ishlamoqda",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

**Last Updated:** 2024-01-15

