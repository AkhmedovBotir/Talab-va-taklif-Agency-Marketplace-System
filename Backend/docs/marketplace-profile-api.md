# Marketplace Profile API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get Profile](#1-get-profile)
  - [Update Profile](#2-update-profile)
  - [Update Password](#3-update-password)
  - [Update Avatar](#4-update-avatar)
  - [Update Location](#5-update-location)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Profile API provides endpoints for managing user profile information. Users can view their profile, update personal information, change password, upload avatar, and update their location.

**Base Path:** `/api/marketplace/me`

**Note:** All profile endpoints require authentication. Users must be logged in to access their profile.

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

All profile endpoints **require authentication** using a JWT token obtained from the marketplace authentication endpoints.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Type:** `marketplace_user`

**Token Expiration:** 30 days (as set in authentication)

---

## Endpoints

### 1. Get Profile

Get the current authenticated user's profile information.

**Endpoint:** `GET /api/marketplace/me`

**Headers:**
- `Authorization: Bearer <token>` (required)

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

**Response Fields:**
- `_id` - User ID
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number
- `gender` - Gender: `"ayol"` or `"erkak"`
- `viloyat` - Region object (populated)
- `tuman` - District object (populated)
- `mfy` - MFY object (populated)
- `birthDate` - Birth date
- `isPhoneVerified` - Phone verification status
- `avatar` - Avatar image (base64 format, can be null)
- `status` - Account status: `"active"` or `"inactive"`
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

**Note:** Password field is never returned in responses.

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

### 2. Update Profile

Update user's personal information (firstName, lastName, gender, birthDate).

**Endpoint:** `PUT /api/marketplace/me`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "gender": "erkak",
  "birthDate": "1990-01-15"
}
```

**Request Fields:**
- `firstName` (optional) - First name (2-50 characters)
- `lastName` (optional) - Last name (2-50 characters)
- `gender` (optional) - Gender: `"ayol"` or `"erkak"`
- `birthDate` (optional) - Birth date (ISO 8601 format)

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profil yangilandi",
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
    "avatar": null,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input (validation errors)
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

### 3. Update Password

Change user's password. Requires current password for verification.

**Endpoint:** `PATCH /api/marketplace/me/password`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Request Fields:**
- `currentPassword` (required) - Current password for verification
- `newPassword` (required) - New password (minimum 6 characters)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'zgartirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Missing required fields
  - Current password is incorrect
  - New password doesn't meet requirements (minimum 6 characters)
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

**Example Error Response (Wrong Current Password):**

```json
{
  "success": false,
  "message": "Joriy parol noto'g'ri"
}
```

---

### 4. Update Avatar

Upload or update user's avatar image. Avatar must be in base64 format.

**Endpoint:** `PATCH /api/marketplace/me/avatar`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Request Fields:**
- `avatar` (required) - Avatar image in base64 format. Must start with `data:image/(png|jpg|jpeg|gif|webp);base64,`

**Supported Image Formats:**
- PNG: `data:image/png;base64,...`
- JPEG/JPG: `data:image/jpeg;base64,...` or `data:image/jpg;base64,...`
- GIF: `data:image/gif;base64,...`
- WebP: `data:image/webp;base64,...`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Avatar yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Avatar missing
  - Invalid base64 format
  - Unsupported image format
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

**Example Error Response (Invalid Format):**

```json
{
  "success": false,
  "message": "Avatar base64 formatida bo'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)"
}
```

---

### 5. Update Location

Update user's location (viloyat, tuman, mfy). All fields are optional, but hierarchy must be maintained.

**Endpoint:** `PATCH /api/marketplace/me/location`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "viloyat": "507f1f77bcf86cd799439015",
  "tuman": "507f1f77bcf86cd799439016",
  "mfy": "507f1f77bcf86cd799439017"
}
```

**Request Fields:**
- `viloyat` (optional) - Region ID (must be type: 'region')
- `tuman` (optional) - District ID (must be type: 'district', must be child of viloyat)
- `mfy` (optional) - MFY ID (must be type: 'mfy', must be child of tuman)

**Note:** 
- All fields are optional
- If updating tuman, it must be a child of the viloyat (current or new)
- If updating mfy, it must be a child of the tuman (current or new)
- Hierarchy validation is performed automatically

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Manzil yangilandi",
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
    "avatar": null,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Invalid region ID format
  - Region not found
  - Wrong region type (e.g., tuman provided as viloyat)
  - Hierarchy violation (e.g., tuman not child of viloyat)
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

**Example Error Response (Hierarchy Violation):**

```json
{
  "success": false,
  "message": "Tuman tanlangan viloyatga tegishli emas"
}
```

---

## Data Models

### Marketplace User Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "firstName": "string (2-50 characters, required)",
  "lastName": "string (2-50 characters, required)",
  "phone": "string (valid phone number, unique, required)",
  "gender": "string (enum: 'ayol' | 'erkak', required)",
  "viloyat": "object (reference to Region, type: 'region', required)",
  "tuman": "object (reference to Region, type: 'district', required)",
  "mfy": "object (reference to Region, type: 'mfy', required)",
  "birthDate": "string (ISO 8601 date, required)",
  "isPhoneVerified": "boolean (default: false)",
  "avatar": "string (base64 image, nullable)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Region Object (when populated)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string",
  "type": "string (enum: 'region' | 'district' | 'mfy')",
  "code": "string"
}
```

**Note:** The `password` field is never returned in API responses for security reasons.

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
- **400 Bad Request** - Invalid input or validation error
- **401 Unauthorized** - Token missing, invalid, or expired
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

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
  "message": "Bu token marketplace user uchun emas"
}
```

```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Joriy parol noto'g'ri"
}
```

```json
{
  "success": false,
  "message": "Avatar base64 formatida bo'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)"
}
```

```json
{
  "success": false,
  "message": "Tuman tanlangan viloyatga tegishli emas"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

---

## Examples

### Example 1: Get Profile

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/me" \
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
    "avatar": null,
    "status": "active"
  }
}
```

### Example 2: Update Profile

**Request:**

```bash
curl -X PUT "http://localhost:5000/api/marketplace/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ali",
    "lastName": "Valiyev",
    "gender": "erkak",
    "birthDate": "1990-01-15"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Profil yangilandi",
  "data": {...}
}
```

### Example 3: Update Password

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/marketplace/me/password" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'zgartirildi"
}
```

### Example 4: Update Avatar

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/marketplace/me/avatar" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Avatar yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "firstName": "Ali",
    "lastName": "Valiyev",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }
}
```

### Example 5: Update Location

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/marketplace/me/location" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "507f1f77bcf86cd799439015",
    "tuman": "507f1f77bcf86cd799439016",
    "mfy": "507f1f77bcf86cd799439017"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Manzil yangilandi",
  "data": {...}
}
```

---

## Notes

1. **Authentication Required:** All profile endpoints require a valid JWT token for marketplace users.

2. **Partial Updates:** 
   - PUT `/me` - All fields are optional, only provided fields are updated
   - PATCH endpoints - Only specific fields can be updated

3. **Password Security:**
   - Current password is required to change password
   - New password must be at least 6 characters
   - Password is hashed before storage

4. **Avatar Format:**
   - Must be base64 encoded
   - Must include data URI prefix: `data:image/(format);base64,`
   - Supported formats: PNG, JPEG, JPG, GIF, WebP
   - Avatar can be null (no avatar set)

5. **Location Hierarchy:**
   - Viloyat → Tuman → MFY hierarchy must be maintained
   - When updating location, the system validates the hierarchy
   - Tuman must be a child of viloyat
   - MFY must be a child of tuman

6. **Region Validation:**
   - All region IDs are validated for existence and correct type
   - Hierarchy relationships are checked automatically

7. **Phone Number:**
   - Phone number cannot be changed through profile API
   - Phone number is set during registration

8. **Response Data:**
   - Password is never included in responses
   - All region objects are populated with full details

---

**Last Updated:** 2024-01-15





