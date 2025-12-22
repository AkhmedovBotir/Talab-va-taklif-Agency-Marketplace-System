# Contragent Authentication API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Password Setup - Step 1: Request Phone](#1-password-setup---step-1-request-phone)
  - [Password Setup - Step 2: Verify SMS Code](#2-password-setup---step-2-verify-sms-code)
  - [Password Setup - Step 3: Set Password](#3-password-setup---step-3-set-password)
  - [Login](#4-login)
- [Workflow](#workflow)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Contragent Authentication API provides endpoints for contragents to set up their password (for new contragents created from partnership requests) and login to the platform.

**Base Path:** `/api/contragents`

**Note:** Password setup endpoints are for contragents who were created from approved partnership requests and need to set their password for the first time.

---

## Base URL

```
http://localhost:5000/api/contragents
```

---

## Authentication

- **Password Setup Endpoints:** No authentication required (public endpoints)
- **Login Endpoint:** No authentication required (public endpoint)
- **Other Endpoints:** Require contragent JWT token (obtained from login)

---

## Data Models

### Contragent Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "inn": "string (9 or 12 digits, unique)",
  "viloyat": {
    "_id": "string",
    "name": "string",
    "type": "region",
    "code": "string"
  },
  "tuman": {
    "_id": "string",
    "name": "string",
    "type": "district",
    "code": "string"
  },
  "mfy": {
    "_id": "string",
    "name": "string",
    "type": "mfy",
    "code": "string"
  },
  "phone": "string (valid phone number, unique)",
  "logo": "string (base64 image, nullable)",
  "passwordSetupAllowed": "boolean (default: false)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** 
- The `password` field is never returned in API responses for security reasons.
- `passwordSetupAllowed: true` means the contragent can set their password (for new contragents from partnership requests).

---

## Endpoints

### 1. Password Setup - Step 1: Request Phone

Request SMS verification code for password setup. This endpoint is for contragents who were created from partnership requests and need to set their password.

**Endpoint:** `POST /api/contragents/password-setup/step1`

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+998901234567"
}
```

**Request Fields:**
- `phone` (required) - Contragent phone number (must match the phone in contragent record)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**SMS Template:**
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Invalid phone format
  - Contragent not found
  - Password already set
  - Password setup not allowed
  - Contragent account inactive
- **500 Internal Server Error** - Server error or SMS sending failed

**Example Error Response (Contragent Not Found):**

```json
{
  "success": false,
  "message": "Kontragent topilmadi"
}
```

**Example Error Response (Password Already Set):**

```json
{
  "success": false,
  "message": "Parol allaqachon o'rnatilgan"
}
```

**Example Error Response (Password Setup Not Allowed):**

```json
{
  "success": false,
  "message": "Parol o'rnatish ruxsati berilmagan"
}
```

---

### 2. Password Setup - Step 2: Verify SMS Code

Verify SMS code. After successful verification, you can proceed to Step 3 to set the password.

**Endpoint:** `POST /api/contragents/password-setup/step2`

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+998901234567",
  "code": "12345"
}
```

**Request Fields:**
- `phone` (required) - Contragent phone number
- `code` (required) - SMS verification code (5 digits)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Kod muvaffaqiyatli tasdiqlandi. Endi parol o'rnatishingiz mumkin"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Invalid phone format
  - Invalid or expired code
  - Password setup not allowed
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

**Example Error Response (Invalid Code):**

```json
{
  "success": false,
  "message": "Kod noto'g'ri yoki muddati tugagan"
}
```

**Note:** If the code is invalid or expired, you can request a new code by calling Step 1 again.

---

### 3. Password Setup - Step 3: Set Password

Set password after SMS code verification. This endpoint requires that Step 2 was successfully completed (code was verified) within the last 10 minutes.

**Endpoint:** `POST /api/contragents/password-setup/step3`

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+998901234567",
  "newPassword": "newpassword123"
}
```

**Request Fields:**
- `phone` (required) - Contragent phone number
- `newPassword` (required) - New password (minimum 6 characters)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'rnatildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Invalid phone format
  - Password too short (less than 6 characters)
  - SMS code not verified (Step 2 not completed or expired)
  - Password setup not allowed
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

**Example Error Response (Password Too Short):**

```json
{
  "success": false,
  "message": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
}
```

**Example Error Response (Code Not Verified):**

```json
{
  "success": false,
  "message": "Avval SMS kodini tasdiqlashingiz kerak"
}
```

**Note:** You must complete Step 2 (verify SMS code) before setting the password. The code verification is valid for 10 minutes.

---

### 4. Login

Login to the contragent account using phone and password.

**Endpoint:** `POST /api/contragents/auth/login`

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Request Fields:**
- `phone` (required) - Contragent phone number
- `password` (required) - Contragent password

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "contragent": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "O'zbekiston Tovar",
      "inn": "123456789",
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
      "phone": "+998901234567",
      "logo": null,
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Response Fields:**
- `token` - JWT token for authentication (expires in 24 hours)
- `contragent` - Contragent object with populated regions

**Error Responses:**

- **400 Bad Request** - Password not set (for contragents who haven't completed password setup)
- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Contragent account inactive
- **500 Internal Server Error** - Server error

**Example Error Response (Password Not Set):**

```json
{
  "success": false,
  "message": "Parol o'rnatilmagan. Iltimos, avval parol o'rnating"
}
```

**Example Error Response (Invalid Credentials):**

```json
{
  "success": false,
  "message": "Telefon raqami yoki parol noto'g'ri"
}
```

---

## Workflow

### For New Contragents (from Partnership Requests)

1. **Admin converts partnership request to contragent**
   - Contragent is created with `passwordSetupAllowed: true`
   - No SMS is sent automatically

2. **Password Setup - Step 1: Request Phone**
   ```
   POST /api/contragents/password-setup/step1
   { "phone": "+998901234567" }
   ```
   - If password is not set, SMS code is sent to the phone
   - SMS template: `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`

3. **Password Setup - Step 2: Verify SMS Code**
   ```
   POST /api/contragents/password-setup/step2
   { "phone": "+998901234567", "code": "12345" }
   ```
   - Code is verified
   - Code is marked as used
   - You can now proceed to Step 3

4. **Password Setup - Step 3: Set Password**
   ```
   POST /api/contragents/password-setup/step3
   { "phone": "+998901234567", "newPassword": "newpassword123" }
   ```
   - Password is set
   - `passwordSetupAllowed` is set to `false`
   - Code verification must have been completed within last 10 minutes

5. **Login**
   ```
   POST /api/contragents/auth/login
   { "phone": "+998901234567", "password": "newpassword123" }
   ```
   - Receive JWT token
   - Use token for authenticated requests

### Resending SMS Code

If you need to resend the SMS code:
- Call Step 1 again with the same phone number
- A new code will be sent, and previous unused codes will be invalidated

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
- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Account inactive
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Parol o'rnatish ruxsati berilmagan"
}
```

```json
{
  "success": false,
  "message": "Kod noto'g'ri yoki muddati tugagan"
}
```

```json
{
  "success": false,
  "message": "Avval SMS kodini tasdiqlashingiz kerak"
}
```

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Telefon raqami yoki parol noto'g'ri"
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

---

## Validation Rules

### Phone Number
- Required
- Valid phone format
- Pattern: `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`
- Must match contragent's phone in database

### SMS Code
- Required (Step 2)
- 5-digit code
- Valid for 5 minutes
- Can only be used once
- Must be verified before setting password

### Password
- Required (Step 3 and login)
- Minimum length: 6 characters
- Stored as hashed value (bcrypt)
- Never returned in API responses

### Password Setup Eligibility
- Contragent must have `passwordSetupAllowed: true`
- Contragent must be active
- Password must not be already set
- SMS code must be verified within 10 minutes before setting password

---

## Examples

### Example 1: Password Setup - Step 1

**Request:**

```bash
curl -X POST "http://localhost:5000/api/contragents/password-setup/step1" \
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

**SMS Received:**
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: 12345. Kod 5 daqiqa amal qiladi.
```

### Example 2: Password Setup - Step 2 (Verify Code)

**Request:**

```bash
curl -X POST "http://localhost:5000/api/contragents/password-setup/step2" \
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
  "message": "Kod muvaffaqiyatli tasdiqlandi. Endi parol o'rnatishingiz mumkin"
}
```

### Example 3: Password Setup - Step 3 (Set Password)

**Request:**

```bash
curl -X POST "http://localhost:5000/api/contragents/password-setup/step3" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "newPassword": "newpassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'rnatildi"
}
```

### Example 4: Resend SMS Code

If you need to resend the SMS code, simply call Step 1 again:

**Request:**

```bash
curl -X POST "http://localhost:5000/api/contragents/password-setup/step1" \
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

### Example 5: Login

**Request:**

```bash
curl -X POST "http://localhost:5000/api/contragents/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "newpassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "contragent": {...}
  }
}
```

---

## Notes

1. **Password Setup Flow:** 
   - Only contragents with `passwordSetupAllowed: true` can use password setup endpoints
   - After password is set, `passwordSetupAllowed` is automatically set to `false`
   - SMS code expires in 5 minutes
   - Each code can only be used once
   - Code verification (Step 2) is valid for 10 minutes before setting password (Step 3)

2. **SMS Code:**
   - 5-digit code
   - Sent via Eskiz SMS service
   - Template: `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`
   - Expires in 5 minutes
   - Can be resent by calling Step 1 again

3. **Login:**
   - Requires phone and password
   - Returns JWT token valid for 24 hours
   - Token type: `contragent`
   - Use token in `Authorization: Bearer <token>` header for authenticated requests

4. **Password Security:**
   - Password is hashed using bcrypt before storage
   - Password is never returned in API responses
   - Minimum length: 6 characters

5. **Account Status:**
   - Only active contragents can set password and login
   - Inactive contragents will receive 403 Forbidden error

6. **Partnership Request Integration:**
   - When admin converts approved partnership request to contragent:
     - Contragent is created with `passwordSetupAllowed: true`
     - No SMS is sent automatically
     - User must complete password setup process (Step 1 → Step 2 → Step 3) before login

7. **Resending SMS Code:**
   - If you need a new SMS code, call Step 1 again with the same phone number
   - Previous unused codes will be invalidated
   - A new code will be sent

---

**Last Updated:** 2024-01-15
