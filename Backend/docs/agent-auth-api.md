# Agent Authentication API Documentation

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

Agent Authentication API provides endpoints for agents to set up their password (for new agents created from vacancy applications) and login to the platform.

**Base Path:** `/api/agents`

**Note:** Password setup endpoints are for agents who were created from approved vacancy applications and need to set their password for the first time.

---

## Base URL

```
http://localhost:5000/api/agents
```

---

## Authentication

- **Password Setup Endpoints:** No authentication required (public endpoints)
- **Login Endpoint:** No authentication required (public endpoint)
- **Other Endpoints:** Require agent JWT token (obtained from login)

---

## Data Models

### Agent Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "phone": "string (valid phone number, unique)",
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
  "agentType": "string (enum: 'viloyat' | 'tuman' | 'mfy')",
  "passwordSetupAllowed": "boolean (default: false)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** 
- The `password` field is never returned in API responses for security reasons.
- `passwordSetupAllowed: true` means the agent can set their password (for new agents from vacancy applications).
- `agentType` is determined automatically based on selected regions:
  - `viloyat`: Only viloyat is selected
  - `tuman`: Viloyat and tuman are selected
  - `mfy`: Viloyat, tuman, and mfy are selected

---

## Endpoints

### 1. Password Setup - Step 1: Request Phone

Request SMS verification code for password setup. This endpoint is for agents who were created from vacancy applications and need to set their password.

**Endpoint:** `POST /api/agents/password-setup/step1`

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "phone": "+998901234567"
}
```

**Request Fields:**
- `phone` (required) - Agent phone number

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Invalid phone format
  - Password already set
  - Password setup not allowed
- **403 Forbidden** - Agent account inactive
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

---

### 2. Password Setup - Step 2: Verify SMS Code

Verify SMS code received in Step 1. This endpoint verifies the code but does not set the password yet.

**Endpoint:** `POST /api/agents/password-setup/step2`

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
- `phone` (required) - Agent phone number
- `code` (required) - 5-digit SMS verification code

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
  - Invalid code format (must be 5 digits)
  - Code invalid or expired
  - Password setup not allowed
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

**Note:** If the code is invalid or expired, you can request a new code by calling Step 1 again.

---

### 3. Password Setup - Step 3: Set Password

Set password after SMS code verification. This endpoint requires that Step 2 was successfully completed (code was verified) within the last 10 minutes.

**Endpoint:** `POST /api/agents/password-setup/step3`

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
- `phone` (required) - Agent phone number
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
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

**Note:** You must complete Step 2 (verify SMS code) before setting the password. The code verification is valid for 10 minutes.

---

### 4. Login

Login to the agent account using phone and password.

**Endpoint:** `POST /api/agents/login`

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
- `phone` (required) - Agent phone number
- `password` (required) - Agent password

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "agent": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "John Doe",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": null,
      "agentType": "tuman",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Response Fields:**
- `token` - JWT token for authentication (expires in 24 hours)
- `agent` - Agent object with populated regions and `agentType`

**Error Responses:**

- **400 Bad Request** - Password not set (for agents who haven't completed password setup)
- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Agent account inactive or deleted
- **500 Internal Server Error** - Server error

---

## Workflow

### For New Agents (from Vacancy Applications)

1. **Admin converts vacancy application to agent**
   - Agent is created with `passwordSetupAllowed: true`
   - No SMS is sent automatically

2. **Password Setup - Step 1: Request Phone**
   ```
   POST /api/agents/password-setup/step1
   { "phone": "+998901234567" }
   ```
   - If password is not set, SMS code is sent to the phone
   - SMS template: `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`

3. **Password Setup - Step 2: Verify SMS Code**
   ```
   POST /api/agents/password-setup/step2
   { "phone": "+998901234567", "code": "12345" }
   ```
   - Code is verified
   - Code is marked as used
   - You can now proceed to Step 3

4. **Password Setup - Step 3: Set Password**
   ```
   POST /api/agents/password-setup/step3
   { "phone": "+998901234567", "newPassword": "mypassword123" }
   ```
   - Password is set
   - `passwordSetupAllowed` is set to `false`
   - You can now login

5. **Login**
   ```
   POST /api/agents/login
   { "phone": "+998901234567", "password": "mypassword123" }
   ```
   - Returns JWT token for authentication

---

## Error Handling

### Common Error Responses

- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Account inactive or deleted
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

---

## Validation Rules

### Phone Number
- **Type:** String
- **Required:** Yes
- **Format:** Valid phone number format (supports various formats with +, spaces, dashes, parentheses)
- **Example:** `+998901234567`, `998901234567`, `(998) 90-123-45-67`

### Password
- **Type:** String
- **Required:** Yes (for Step 3 and Login)
- **Min Length:** 6 characters
- **Max Length:** No limit

### SMS Code
- **Type:** String
- **Required:** Yes (for Step 2)
- **Length:** Exactly 5 digits
- **Format:** Numeric only (0-9)
- **Expiration:** 5 minutes from creation

---

## Examples

### Complete Password Setup Flow

```bash
# Step 1: Request SMS code
curl -X POST "http://localhost:5000/api/agents/password-setup/step1" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567"
  }'

# Step 2: Verify SMS code
curl -X POST "http://localhost:5000/api/agents/password-setup/step2" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "code": "12345"
  }'

# Step 3: Set password
curl -X POST "http://localhost:5000/api/agents/password-setup/step3" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "newPassword": "mypassword123"
  }'

# Login
curl -X POST "http://localhost:5000/api/agents/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "mypassword123"
  }'
```

---

## Notes

- **Password Setup:** Password setup is only available for agents with `passwordSetupAllowed: true` (new agents from vacancy applications).
- **SMS Code Expiration:** SMS codes expire after 5 minutes.
- **Code Verification Window:** After verifying the code in Step 2, you have 10 minutes to complete Step 3 (set password).
- **Token Expiration:** JWT tokens expire after 24 hours.
- **Agent Types:** Agent type (`viloyat`, `tuman`, `mfy`) is determined automatically based on selected regions.

