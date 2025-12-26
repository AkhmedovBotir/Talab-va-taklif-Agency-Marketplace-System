# Marketplace Partnership Request API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Create Partnership Request](#1-create-partnership-request)
  - [Get My Partnership Requests](#2-get-my-partnership-requests)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Marketplace Partnership Request API provides endpoints for marketplace users to submit partnership requests. Users can apply to become partners by providing company information, legal address, activity details, and manager information.

**Base Path:** `/api/marketplace`

**Note:** 
- **POST /partnership-requests** - Authentication **optional** (tokensiz ham, token bilan ham ishlaydi)
- **GET /partnership-requests** - Authentication **required**
- Users can only have one pending partnership request at a time (only if authenticated)

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

### POST /partnership-requests (Optional Authentication)
- **Token bilan:** Agar token bo'lsa, foydalanuvchi ID saqlanadi va pending request tekshiruvi amalga oshiriladi
- **Tokensiz:** Token bo'lmasa, so'rov yuboriladi, lekin `marketplaceUser` field `null` bo'ladi

### GET /partnership-requests (Required Authentication)
- Token talab qilinadi
- Faqat autentifikatsiya qilingan foydalanuvchining o'z so'rovlarini ko'rish mumkin

**Format:** `Authorization: Bearer <token>`

**Token Type:** Marketplace User Token (obtained from login)

---

## Data Models

### PartnershipRequest

```json
{
  "_id": "string (ObjectId)",
  "marketplaceUser": {
    "_id": "string (ObjectId)",
    "firstName": "string",
    "lastName": "string",
    "phone": "string"
  },
  "companyName": "string",
  "inn": "string (9 or 12 digits)",
  "mfo": "string",
  "accountNumber": "string",
  "viloyat": {
    "_id": "string (ObjectId)",
    "name": "string",
    "type": "region",
    "code": "string"
  },
  "tuman": {
    "_id": "string (ObjectId)",
    "name": "string",
    "type": "district",
    "code": "string"
  },
  "mfy": {
    "_id": "string (ObjectId)",
    "name": "string",
    "type": "mfy",
    "code": "string"
  },
  "activityType": {
    "_id": "string (ObjectId)",
    "name": "string",
    "icon": "string"
  },
  "managerFirstName": "string",
  "managerLastName": "string",
  "managerPhone": "string",
  "contactStatus": "not_contacted | contacted | in_progress | completed",
  "status": "pending | approved | rejected",
  "adminNotes": "string | null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### Contact Status Values

- `not_contacted` - Aloqa qilinmagan (default)
- `contacted` - Aloqa qilingan
- `in_progress` - Jarayonda
- `completed` - Tugallangan

### Request Status Values

- `pending` - Ko'rib chiqilmoqda (default)
- `approved` - Tasdiqlangan
- `rejected` - Rad etilgan

---

## Endpoints

### 1. Get All Contragent Types

Get all available contragent activity types for partnership request form.

**Endpoint:** `GET /api/contragent-types`

**Authentication:** Not required (public endpoint)

**Query Parameters:**
- `status` (optional) - Filter by status: 'active' or 'inactive'. Default: returns all

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
    }
  ]
}
```

**Note:** Use this endpoint to get the list of available activity types before creating a partnership request. Only active activity types should be used in partnership requests.

**For more details, see:** [Contragent Type API Documentation](./contragent-type-api.md)

---

### 2. Create Partnership Request

Submit a new partnership request.

**Endpoint:** `POST /partnership-requests`

**Authentication:** **Optional** (tokensiz ham, token bilan ham ishlaydi)

**Request Body:**

```json
{
  "companyName": "string (required, 2-200 characters)",
  "inn": "string (required, 9 or 12 digits)",
  "mfo": "string (required)",
  "accountNumber": "string (required)",
  "viloyat": "string (required, Region ObjectId)",
  "tuman": "string (required, Region ObjectId)",
  "mfy": "string (required, Region ObjectId)",
  "activityType": "string (required, ContragentType ObjectId)",
  "managerFirstName": "string (required, 2-50 characters)",
  "managerLastName": "string (required, 2-50 characters)",
  "managerPhone": "string (required, valid phone format)"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyName` | string | Yes | Kompaniya nomi (2-200 belgi) |
| `inn` | string | Yes | INN raqami (9 yoki 12 ta raqam) |
| `mfo` | string | Yes | MFO raqami |
| `accountNumber` | string | Yes | Hisob raqami (XR) |
| `viloyat` | string | Yes | Viloyat ID (Region modelidan, type='region') |
| `tuman` | string | Yes | Tuman ID (Region modelidan, type='district') |
| `mfy` | string | Yes | MFY ID (Region modelidan, type='mfy') |
| `activityType` | string (ObjectId) | Yes | Faoliyat turi ID (ContragentType - faqat active status bilan) |
| `managerFirstName` | string | Yes | Rahbar ismi (2-50 belgi) |
| `managerLastName` | string | Yes | Rahbar familiyasi (2-50 belgi) |
| `managerPhone` | string | Yes | Rahbar telefon raqami |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi muvaffaqiyatli yuborildi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "marketplaceUser": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567"
    },
    "companyName": "O'zbekiston Tijorat MChJ",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "22614840900000000001",
    "viloyat": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "name": "Chirchiq tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "name": "Navruz MFY",
      "type": "mfy",
      "code": "1001001"
    },
    "activityType": "507f1f77bcf86cd799439011",
    "managerFirstName": "Akmal",
    "managerLastName": "Karimov",
    "managerPhone": "+998901234568",
    "contactStatus": "not_contacted",
    "status": "pending",
    "adminNotes": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**

```json
{
  "success": false,
  "message": "Validatsiya xatosi",
  "errors": [
    {
      "field": "companyName",
      "message": "Kompaniya nomi kiritilishi shart"
    },
    {
      "field": "inn",
      "message": "INN 9 yoki 12 ta raqamdan iborat bo'lishi kerak"
    }
  ]
}
```

**400 Bad Request - Invalid Region:**

```json
{
  "success": false,
  "message": "Noto'g'ri viloyat tanlandi"
}
```

**400 Bad Request - Pending Request Exists (only if authenticated):**

```json
{
  "success": false,
  "message": "Sizda allaqachon ko'rib chiqilayotgan hamkorlik so'rovi mavjud"
}
```

**Note:** Bu xato faqat token bilan yuborilgan so'rovlar uchun ko'rsatiladi. Tokensiz so'rovlar uchun bu tekshiruv o'tkazilmaydi.

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Hamkorlik so'rovini yaratishda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

### 3. Get My Partnership Requests

Get all partnership requests submitted by the authenticated user.

**Endpoint:** `GET /partnership-requests`

**Authentication:** Required

**Query Parameters:** None

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "companyName": "O'zbekiston Tijorat MChJ",
      "inn": "123456789",
      "mfo": "00014",
      "accountNumber": "22614840900000000001",
      "viloyat": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "10"
      },
      "tuman": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "1001"
      },
      "mfy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
        "name": "Navruz MFY",
        "type": "mfy",
        "code": "1001001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Savdo",
        "icon": "shop-icon"
      },
      "managerFirstName": "Akmal",
      "managerLastName": "Karimov",
      "managerPhone": "+998901234568",
      "contactStatus": "contacted",
      "status": "pending",
      "adminNotes": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "companyName": "Yana bir kompaniya",
      "inn": "987654321",
      "mfo": "00015",
      "accountNumber": "22614840900000000002",
      "viloyat": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
        "name": "Samarqand viloyati",
        "type": "region",
        "code": "20"
      },
      "tuman": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "name": "Samarqand tumani",
        "type": "district",
        "code": "2001"
      },
      "mfy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
        "name": "Registon MFY",
        "type": "mfy",
        "code": "2001001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Xizmat ko'rsatish",
        "icon": "service-icon"
      },
      "managerFirstName": "Bobur",
      "managerLastName": "Toshmatov",
      "managerPhone": "+998901234569",
      "contactStatus": "not_contacted",
      "status": "rejected",
      "adminNotes": "Kompaniya ma'lumotlari to'liq emas",
      "createdAt": "2024-01-10T08:15:00.000Z",
      "updatedAt": "2024-01-12T16:45:00.000Z"
    }
  ]
}
```

**Empty Response (200 OK):**

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

**Error Responses:**

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Hamkorlik so'rovlarini olishda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "error": "Detailed error message (optional, for development)"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Validation Rules

### Company Name
- Required
- Minimum length: 2 characters
- Maximum length: 200 characters
- Trimmed (leading/trailing spaces removed)

### INN
- Required
- Must be exactly 9 or 12 digits
- Pattern: `^\d{9}$|^\d{12}$`

### MFO
- Required
- Any string value

### Account Number
- Required
- Any string value

### Region Selection
- `viloyat`: Must be a valid Region ObjectId with `type='region'`
- `tuman`: Must be a valid Region ObjectId with `type='district'`
- `mfy`: Must be a valid Region ObjectId with `type='mfy'`
- All three are required

### Activity
- Required
- Maximum length: 500 characters
- Trimmed

### Manager First Name
- Required
- Minimum length: 2 characters
- Maximum length: 50 characters
- Trimmed

### Manager Last Name
- Required
- Minimum length: 2 characters
- Maximum length: 50 characters
- Trimmed

### Manager Phone
- Required
- Must match phone number pattern
- Pattern: `^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$`
- Examples: `+998901234567`, `998901234567`, `(998) 90-123-45-67`

### Business Rules
- A user can only have **one pending request** at a time
- If a user has a pending request, they cannot create a new one until the pending request is resolved (approved or rejected)

---

## Examples

### Example 1: Create Partnership Request (Token bilan)

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/partnership-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "companyName": "O'zbekiston Tijorat MChJ",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "22614840900000000001",
    "viloyat": "65a1b2c3d4e5f6g7h8i9j0k3",
    "tuman": "65a1b2c3d4e5f6g7h8i9j0k4",
    "mfy": "65a1b2c3d4e5f6g7h8i9j0k5",
    "activityType": "507f1f77bcf86cd799439011",
    "managerFirstName": "Akmal",
    "managerLastName": "Karimov",
    "managerPhone": "+998901234568"
  }'
```

### Example 1b: Create Partnership Request (Tokensiz)

**Request:**

```bash
curl -X POST http://localhost:5000/api/marketplace/partnership-requests \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "O'zbekiston Tijorat MChJ",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "22614840900000000001",
    "viloyat": "65a1b2c3d4e5f6g7h8i9j0k3",
    "tuman": "65a1b2c3d4e5f6g7h8i9j0k4",
    "mfy": "65a1b2c3d4e5f6g7h8i9j0k5",
    "activityType": "507f1f77bcf86cd799439011",
    "managerFirstName": "Akmal",
    "managerLastName": "Karimov",
    "managerPhone": "+998901234568"
  }'
```

**Response (Tokensiz):**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi muvaffaqiyatli yuborildi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "marketplaceUser": null,
    "companyName": "O'zbekiston Tijorat MChJ",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "22614840900000000001",
    "viloyat": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "name": "Chirchiq tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "name": "Navruz MFY",
      "type": "mfy",
      "code": "1001001"
    },
    "activityType": "507f1f77bcf86cd799439011",
    "managerFirstName": "Akmal",
    "managerLastName": "Karimov",
    "managerPhone": "+998901234568",
    "contactStatus": "not_contacted",
    "status": "pending",
    "adminNotes": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi muvaffaqiyatli yuborildi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "companyName": "O'zbekiston Tijorat MChJ",
    "status": "pending",
    "contactStatus": "not_contacted",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 2: Get My Partnership Requests

**Request:**

```bash
curl -X GET http://localhost:5000/api/marketplace/partnership-requests \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "companyName": "O'zbekiston Tijorat MChJ",
      "status": "pending",
      "contactStatus": "contacted",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Example 3: JavaScript/Fetch Example

```javascript
// Create Partnership Request
async function createPartnershipRequest(token, requestData) {
  const response = await fetch('http://localhost:5000/api/marketplace/partnership-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestData)
  });

  const data = await response.json();
  return data;
}

// Get My Partnership Requests
async function getMyPartnershipRequests(token) {
  const response = await fetch('http://localhost:5000/api/marketplace/partnership-requests', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data;
}

// Usage
const token = 'your-jwt-token-here';
const requestData = {
  companyName: "O'zbekiston Tijorat MChJ",
  inn: "123456789",
  mfo: "00014",
  accountNumber: "22614840900000000001",
  viloyat: "65a1b2c3d4e5f6g7h8i9j0k3",
  tuman: "65a1b2c3d4e5f6g7h8i9j0k4",
  mfy: "65a1b2c3d4e5f6g7h8i9j0k5",
  activity: "Qishloq xo'jalik mahsulotlari yetkazib berish",
  managerFirstName: "Akmal",
  managerLastName: "Karimov",
  managerPhone: "+998901234568"
};

createPartnershipRequest(token, requestData)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

---

## Notes

1. **Region Selection**: Make sure to use valid Region IDs. You can get available regions from the regions API endpoint.

2. **Pending Request Limit**: Users can only have one pending request at a time. If you need to submit a new request, wait for the current one to be approved or rejected.

3. **Status Updates**: Only admins can update the `status` and `contactStatus` fields. Marketplace users can only view their requests.

4. **Phone Number Format**: Phone numbers should follow international format. The validation accepts various formats, but it's recommended to use `+998XXXXXXXXX` format.

5. **Response Ordering**: Partnership requests are returned in descending order by creation date (newest first).

---

**Last Updated:** 2024-01-15




