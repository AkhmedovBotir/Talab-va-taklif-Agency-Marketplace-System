# Marketplace Authentication API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [SMS Verification](#sms-verification)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Register - Step 1: Send SMS Code](#1-register---step-1-send-sms-code)
  - [Register - Step 2: Verify Code and Create Account](#2-register---step-2-verify-code-and-create-account)
  - [Login - Step 1: Verify Credentials and Send SMS Code](#3-login---step-1-verify-credentials-and-send-sms-code)
  - [Login - Step 2: Verify SMS Code](#4-login---step-2-verify-sms-code)
  - [Forgot Password - Step 1: Send SMS Code](#5-forgot-password---step-1-send-sms-code)
  - [Forgot Password - Step 2: Verify Code and Reset Password](#6-forgot-password---step-2-verify-code-and-reset-password)
  - [Resend SMS Code](#7-resend-sms-code)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Marketplace Authentication API provides endpoints for user registration, login, and password recovery with SMS verification. All authentication processes use 5-digit SMS codes sent via Eskiz SMS service.

**Base Path:** `/api/marketplace`

**SMS Code:** 5-digit numeric code, valid for 5 minutes

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

After successful registration or login, users receive a JWT token that should be included in the `Authorization` header for protected endpoints.

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** 30 days

---

## SMS Verification

All authentication processes use SMS verification:
- **Code Format:** 5-digit numeric code (e.g., 12345)
- **Validity:** 5 minutes
- **Service:** Eskiz SMS Gateway
- **Auto-cleanup:** Expired codes are automatically deleted from database

### SMS Templates

1. **Registration:**
   ```
   Talab va Taklif Agency platformasida ro'yxatdan o'tish uchun kod: ${code}. Amal 5 daqiqa.
   ```

2. **Login:**
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.
   ```

3. **Forgot Password:**
   ```
   Talab va Taklif Agency platformasida parolingizni tiklash uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.
   ```

---

## Data Models

### Marketplace User Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "firstName": "string (required, 2-50 characters)",
  "lastName": "string (required, 2-50 characters)",
  "phone": "string (required, unique, valid phone format)",
  "gender": "string (enum: 'ayol' | 'erkak')",
  "viloyat": "object (reference to Region, type: 'region')",
  "tuman": "object (reference to Region, type: 'district')",
  "mfy": "object (reference to Region, type: 'mfy')",
  "birthDate": "string (ISO 8601 date)",
  "isPhoneVerified": "boolean (default: false)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Region Object (when populated)

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

### 1. Register - Step 1: Send SMS Code

Send SMS verification code to phone number for registration.

**Endpoint:** `POST /api/marketplace/register/step1`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Error Responses:**

- **400 Bad Request** - Phone already registered or validation error
- **500 Internal Server Error** - Server error or SMS sending failed

---

### 2. Register - Step 2: Verify Code and Create Account

Verify SMS code and create new user account.

**Endpoint:** `POST /api/marketplace/register/step2`

**Request Body:**

```json
{
  "firstName": "string (required, 2-50 chars)",
  "lastName": "string (required, 2-50 chars)",
  "phone": "string (required, valid phone format)",
  "gender": "string (required, 'ayol' | 'erkak')",
  "viloyat": "string (required, MongoDB ObjectId of Region, type: 'region')",
  "tuman": "string (required, MongoDB ObjectId of Region, type: 'district')",
  "mfy": "string (required, MongoDB ObjectId of Region, type: 'mfy')",
  "birthDate": "string (required, ISO 8601 date)",
  "password": "string (required, min 6 chars)",
  "code": "string (required, 5-digit code)"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Ro'yxatdan muvaffaqiyatli o'tdingiz",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "gender": "erkak",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "birthDate": "1990-01-15T00:00:00.000Z",
      "isPhoneVerified": true,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, invalid code, phone already registered, or invalid regions
- **500 Internal Server Error** - Server error

---

### 3. Login - Step 1: Verify Credentials and Send SMS Code

Verify phone and password, then send SMS verification code.

**Endpoint:** `POST /api/marketplace/login/step1`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Account is inactive
- **500 Internal Server Error** - Server error or SMS sending failed

---

### 4. Login - Step 2: Verify SMS Code

Verify SMS code and return authentication token.

**Endpoint:** `POST /api/marketplace/login/step2`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)",
  "code": "string (required, 5-digit code)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "gender": "erkak",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "birthDate": "1990-01-15T00:00:00.000Z",
      "isPhoneVerified": true,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid or expired code
- **403 Forbidden** - Account is inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

### 5. Forgot Password - Step 1: Send SMS Code

Send SMS verification code for password reset.

**Endpoint:** `POST /api/marketplace/forgot-password/step1`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Error Responses:**

- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error or SMS sending failed

---

### 6. Forgot Password - Step 2: Verify Code and Reset Password

Verify SMS code and reset password.

**Endpoint:** `POST /api/marketplace/forgot-password/step2`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)",
  "code": "string (required, 5-digit code)",
  "newPassword": "string (required, min 6 chars)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli yangilandi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid or expired code, or validation error
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

### 7. Resend SMS Code

Resend SMS verification code for any type (login, register, forgot_password).

**Endpoint:** `POST /api/marketplace/resend-code`

**Request Body:**

```json
{
  "phone": "string (required, valid phone format)",
  "type": "string (required, 'login' | 'register' | 'forgot_password')"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid type, phone already registered (for register), or validation error
- **404 Not Found** - User not found (for login/forgot_password)
- **500 Internal Server Error** - Server error or SMS sending failed

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
- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Account inactive
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Invalid Code (400)

```json
{
  "success": false,
  "message": "Kod noto'g'ri yoki muddati tugagan"
}
```

#### Phone Already Registered (400)

```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon ro'yxatdan o'tgan"
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

#### User Not Found (404)

```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

#### SMS Sending Failed (500)

```json
{
  "success": false,
  "message": "SMS yuborishda xatolik yuz berdi"
}
```

---

## Validation Rules

### Phone Number
- **Type:** String
- **Required:** Yes
- **Format:** Valid phone number format (supports various formats with +, spaces, dashes, parentheses)
- **Example:** `+998901234567`, `998901234567`, `(998) 90-123-45-67`

### First Name / Last Name
- **Type:** String
- **Required:** Yes
- **Min Length:** 2 characters
- **Max Length:** 50 characters
- **Trim:** Yes

### Gender
- **Type:** String (enum)
- **Required:** Yes
- **Allowed Values:** `'ayol'`, `'erkak'`

### Regions (Viloyat, Tuman, MFY)
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes
- **Validation:** 
  - Viloyat must be type 'region'
  - Tuman must be type 'district' and child of viloyat
  - MFY must be type 'mfy' and child of tuman

### Birth Date
- **Type:** Date (ISO 8601 format)
- **Required:** Yes
- **Format:** `YYYY-MM-DD` or ISO 8601 date string

### Password
- **Type:** String
- **Required:** Yes
- **Min Length:** 6 characters

### SMS Code
- **Type:** String
- **Required:** Yes
- **Length:** Exactly 5 digits
- **Format:** Numeric only (e.g., "12345")
- **Validity:** 5 minutes

### Code Type (for resend)
- **Type:** String (enum)
- **Required:** Yes
- **Allowed Values:** `'login'`, `'register'`, `'forgot_password'`

---

## Examples

### Example 1: Register - Step 1

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/register/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

### Example 2: Register - Step 2

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/register/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ali",
    "lastName": "Valiyev",
    "phone": "+998901234567",
    "gender": "erkak",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439014",
    "birthDate": "1990-01-15",
    "password": "password123",
    "code": "12345"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Ro'yxatdan muvaffaqiyatli o'tdingiz",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "gender": "erkak",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "birthDate": "1990-01-15T00:00:00.000Z",
      "isPhoneVerified": true,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 3: Login - Step 1

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/login/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

### Example 4: Login - Step 2

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/login/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "code": "12345"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "gender": "erkak",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Toshkent tumani",
        "type": "district",
        "code": "TASH-TUM"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "birthDate": "1990-01-15T00:00:00.000Z",
      "isPhoneVerified": true,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 5: Forgot Password - Step 1

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/forgot-password/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

### Example 6: Forgot Password - Step 2

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/forgot-password/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "code": "12345",
    "newPassword": "newpassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli yangilandi"
}
```

### Example 7: Resend SMS Code

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/resend-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "type": "login"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi"
}
```

---

## Notes

1. **SMS Codes:**
   - Codes are 5-digit numeric codes
   - Valid for 5 minutes
   - Automatically deleted after expiration
   - Previous unused codes are invalidated when a new code is sent

2. **Phone Verification:**
   - Phone is automatically verified after successful registration
   - `isPhoneVerified` field is set to `true` after code verification

3. **Password Security:**
   - Passwords are hashed using bcrypt before storage
   - Passwords are never returned in API responses

4. **Token:**
   - JWT tokens expire after 30 days
   - Token should be included in `Authorization: Bearer <token>` header for protected endpoints

5. **Region Validation:**
   - Regions must follow hierarchy: Viloyat -> Tuman -> MFY
   - Each level is validated to ensure correct parent-child relationship

6. **SMS Service:**
   - Uses Eskiz SMS Gateway
   - Token is cached and automatically refreshed
   - Phone numbers are automatically formatted (removes +, spaces, etc.)

7. **Error Handling:**
   - All validation errors are returned in Uzbek language
   - SMS sending errors are logged but don't expose internal details to users

---

**Last Updated:** 2024-01-15

