# Marketplace Partnership Request API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Create Partnership Request](#1-create-partnership-request)
  - [Get My Partnership Requests](#2-get-my-partnership-requests)
  - [Get Partnership Request by ID](#3-get-partnership-request-by-id)
- [Status Flow](#status-flow)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Marketplace Partnership Request API provides endpoints for marketplace users to submit partnership requests to become a contragent (supplier) on the platform. Users can create requests, view their own requests, and track the status of their applications.

**Base Path:** `/api/marketplace/marketplace-partnership-requests`

**Note:** All endpoints require marketplace user authentication.

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

All endpoints **require authentication** using a JWT token obtained from the marketplace authentication endpoints.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Type:** `marketplace_user`

**Token Expiration:** 30 days (as set in authentication)

---

## Data Models

### MarketplacePartnershipRequest

```json
{
  "_id": "string (ObjectId)",
  "marketplaceUser": {
    "_id": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string"
  },
  "companyName": "string (2-200 characters, required)",
  "inn": "string (9 or 12 digits, required)",
  "mfo": "string (required)",
  "accountNumber": "string (required)",
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
  "activity": "string (max 500 characters, required)",
  "managerFirstName": "string (2-50 characters, required)",
  "managerLastName": "string (2-50 characters, required)",
  "managerPhone": "string (valid phone format, required)",
  "status": "string (enum: 'pending' | 'reviewing' | 'contacted' | 'approved' | 'rejected')",
  "adminNotes": "string (max 1000 characters, nullable)",
  "reviewedBy": {
    "_id": "string",
    "firstName": "string",
    "lastName": "string"
  },
  "reviewedAt": "string (ISO 8601 date, nullable)",
  "contactedAt": "string (ISO 8601 date, nullable)",
  "approvedAt": "string (ISO 8601 date, nullable)",
  "rejectedAt": "string (ISO 8601 date, nullable)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Status Values

- **pending** - Request submitted, waiting for admin review
- **reviewing** - Admin is reviewing the request
- **contacted** - Admin has contacted the company
- **approved** - Request approved, company can become contragent
- **rejected** - Request rejected (adminNotes will contain rejection reason)

---

## Endpoints

### 1. Create Partnership Request

Submit a new partnership request to become a contragent on the platform.

**Endpoint:** `POST /api/marketplace/marketplace-partnership-requests`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "companyName": "O'zbekiston Tovar",
  "inn": "123456789",
  "mfo": "00014",
  "accountNumber": "226148409010001234567890",
  "viloyat": "507f1f77bcf86cd799439015",
  "tuman": "507f1f77bcf86cd799439016",
  "mfy": "507f1f77bcf86cd799439017",
  "activity": "Oziq-ovqat mahsulotlari ishlab chiqarish va sotish",
  "managerFirstName": "Ali",
  "managerLastName": "Valiyev",
  "managerPhone": "+998901234567"
}
```

**Request Fields:**
- `companyName` (required) - Company name (2-200 characters)
- `inn` (required) - Tax identification number (9 or 12 digits)
- `mfo` (required) - Bank MFO code
- `accountNumber` (required) - Bank account number
- `viloyat` (required) - Region ID (must be type: 'region')
- `tuman` (required) - District ID (must be type: 'district')
- `mfy` (required) - MFY ID (must be type: 'mfy')
- `activity` (required) - Company activity description (max 500 characters)
- `managerFirstName` (required) - Manager first name (2-50 characters)
- `managerLastName` (required) - Manager last name (2-50 characters)
- `managerPhone` (required) - Manager phone number (valid phone format)

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi muvaffaqiyatli yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "marketplaceUser": {
      "_id": "507f1f77bcf86cd799439021",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+998901234567"
    },
    "companyName": "O'zbekiston Tovar",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "226148409010001234567890",
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
    "activity": "Oziq-ovqat mahsulotlari ishlab chiqarish va sotish",
    "managerFirstName": "Ali",
    "managerLastName": "Valiyev",
    "managerPhone": "+998901234567",
    "status": "pending",
    "adminNotes": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "contactedAt": null,
    "approvedAt": null,
    "rejectedAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Missing required fields
  - Invalid region types
  - User already has a pending or reviewing request
  - Validation errors
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **500 Internal Server Error** - Server error

**Example Error Response (Duplicate Request):**

```json
{
  "success": false,
  "message": "Sizda allaqachon ko'rib chiqilayotgan hamkorlik so'rovi mavjud"
}
```

---

### 2. Get My Partnership Requests

Get all partnership requests submitted by the authenticated user.

**Endpoint:** `GET /api/marketplace/marketplace-partnership-requests`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `reviewing`, `contacted`, `approved`, `rejected`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "companyName": "O'zbekiston Tovar",
      "status": "approved",
      "viloyat": {...},
      "tuman": {...},
      "mfy": {...},
      "createdAt": "2024-01-15T10:00:00.000Z",
      ...
    },
    {
      "_id": "507f1f77bcf86cd799439023",
      "companyName": "Yangi Kompaniya",
      "status": "pending",
      "viloyat": {...},
      "tuman": {...},
      "mfy": {...},
      "createdAt": "2024-01-14T10:00:00.000Z",
      ...
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **500 Internal Server Error** - Server error

---

### 3. Get Partnership Request by ID

Get details of a specific partnership request (only own requests).

**Endpoint:** `GET /api/marketplace/marketplace-partnership-requests/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` - Partnership request ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "marketplaceUser": {
      "_id": "507f1f77bcf86cd799439021",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+998901234567"
    },
    "companyName": "O'zbekiston Tovar",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "226148409010001234567890",
    "viloyat": {...},
    "tuman": {...},
    "mfy": {...},
    "activity": "Oziq-ovqat mahsulotlari ishlab chiqarish va sotish",
    "managerFirstName": "Ali",
    "managerLastName": "Valiyev",
    "managerPhone": "+998901234567",
    "status": "approved",
    "adminNotes": "Tasdiqlandi",
    "reviewedBy": {
      "_id": "507f1f77bcf86cd799439010",
      "firstName": "Admin",
      "lastName": "User"
    },
    "reviewedAt": "2024-01-15T11:00:00.000Z",
    "contactedAt": "2024-01-15T12:00:00.000Z",
    "approvedAt": "2024-01-15T13:00:00.000Z",
    "rejectedAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T13:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Request not found or doesn't belong to user
- **500 Internal Server Error** - Server error

---

## Status Flow

The partnership request goes through the following status flow:

1. **pending** - User submits request
2. **reviewing** - Admin starts reviewing the request
3. **contacted** - Admin contacts the company
4. **approved** - Request approved (can be converted to contragent)
5. **rejected** - Request rejected (with reason in adminNotes)

**Note:** Status can also go directly from `pending` to `approved` or `rejected` without going through all intermediate steps.

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

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Bu token marketplace user uchun emas"
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Sizda allaqachon ko'rib chiqilayotgan hamkorlik so'rovi mavjud"
}
```

---

## Validation Rules

### Company Name
- Required
- Minimum length: 2 characters
- Maximum length: 200 characters

### INN
- Required
- Must be exactly 9 or 12 digits
- Pattern: `^\d{9}$|^\d{12}$`

### MFO
- Required
- Non-empty string

### Account Number
- Required
- Non-empty string

### Regions
- All three (viloyat, tuman, mfy) are required
- Must be valid ObjectIds
- Must exist in database
- Must have correct types (region, district, mfy)

### Activity
- Required
- Maximum length: 500 characters

### Manager Information
- First name: Required, 2-50 characters
- Last name: Required, 2-50 characters
- Phone: Required, valid phone format

### Duplicate Request Check
- User cannot have multiple `pending` or `reviewing` requests at the same time
- User can submit new request only after previous one is `approved`, `rejected`, or `contacted`

---

## Examples

### Example 1: Create Partnership Request

**Request:**

```bash
curl -X POST "http://localhost:5000/api/marketplace/marketplace-partnership-requests" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "O'\''zbekiston Tovar",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "226148409010001234567890",
    "viloyat": "507f1f77bcf86cd799439015",
    "tuman": "507f1f77bcf86cd799439016",
    "mfy": "507f1f77bcf86cd799439017",
    "activity": "Oziq-ovqat mahsulotlari ishlab chiqarish va sotish",
    "managerFirstName": "Ali",
    "managerLastName": "Valiyev",
    "managerPhone": "+998901234567"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi muvaffaqiyatli yuborildi",
  "data": {...}
}
```

### Example 2: Get My Requests

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/marketplace-partnership-requests?status=pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [...]
}
```

### Example 3: Get Request by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/marketplace-partnership-requests/507f1f77bcf86cd799439022" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {...}
}
```

---

## Notes

1. **Authentication Required:** All endpoints require a valid marketplace user JWT token.

2. **One Active Request:** Users can only have one `pending` or `reviewing` request at a time. They must wait for the current request to be processed (approved, rejected, or contacted) before submitting a new one.

3. **Status Tracking:** Users can track the status of their requests through the `status` field and related timestamp fields (`reviewedAt`, `contactedAt`, `approvedAt`, `rejectedAt`).

4. **Admin Notes:** When a request is rejected, the `adminNotes` field will contain the reason for rejection.

5. **Region Validation:** All region IDs are validated to ensure they exist and have the correct type (region, district, mfy).

6. **Pagination:** The list endpoint supports pagination with `page` and `limit` query parameters.

7. **Response Ordering:** Requests are returned in descending order by creation date (newest first).

8. **Contragent Conversion:** When a partnership request is approved and converted to contragent:
   - Contragent is created without password (`passwordSetupAllowed: true`)
   - User must complete password setup process via contragent auth endpoints
   - User needs to request SMS code by sending phone number to `/api/contragents/password-setup/step1`
   - SMS template: `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`

---

**Last Updated:** 2024-01-15

