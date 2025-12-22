# Admin Marketplace Partnership Request API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get All Partnership Requests](#1-get-all-partnership-requests)
  - [Get Partnership Request by ID](#2-get-partnership-request-by-id)
  - [Update Status to Reviewing](#3-update-status-to-reviewing)
  - [Update Status to Contacted](#4-update-status-to-contacted)
  - [Approve Partnership Request](#5-approve-partnership-request)
  - [Reject Partnership Request](#6-reject-partnership-request)
  - [Convert to Contragent](#7-convert-to-contragent)
- [Status Flow](#status-flow)
- [Error Handling](#error-handling)
- [Filtering and Pagination](#filtering-and-pagination)
- [Examples](#examples)

---

## Overview

Admin Marketplace Partnership Request API provides endpoints for administrators to manage partnership requests submitted by marketplace users. Admins can view all requests, filter them by status, update request status (reviewing, contacted, approved, rejected), and convert approved requests to contragents.

**Base Path:** `/api/admins/marketplace-partnership-requests`

**Note:** All endpoints require admin authentication.

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

All endpoints require admin authentication. Include the JWT token in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Token Type:** Admin Token (obtained from admin login)

**Token Expiration:** Default is 7 days (configurable via `JWT_EXPIRE` environment variable)

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
- **reviewing** - Admin is reviewing the request (automatically set when admin starts review)
- **contacted** - Admin has contacted the company
- **approved** - Request approved, company can become contragent
- **rejected** - Request rejected (adminNotes required)

---

## Endpoints

### 1. Get All Partnership Requests

Get all marketplace partnership requests with optional filtering and pagination.

**Endpoint:** `GET /api/admins/marketplace-partnership-requests`

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
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "marketplaceUser": {...},
      "companyName": "O'zbekiston Tovar",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z",
      ...
    },
    ...
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **500 Internal Server Error** - Server error

---

### 2. Get Partnership Request by ID

Get detailed information about a specific partnership request.

**Endpoint:** `GET /api/admins/marketplace-partnership-requests/:id`

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
      "phone": "+998901234567",
      "viloyat": {...},
      "tuman": {...},
      "mfy": {...}
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
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

---

### 3. Update Status to Reviewing

Mark a partnership request as being reviewed. This automatically sets the `reviewedBy` and `reviewedAt` fields.

**Endpoint:** `PATCH /api/admins/marketplace-partnership-requests/:id/reviewing`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` - Partnership request ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov ko'rib chiqilmoqda deb belgilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "status": "reviewing",
    "reviewedBy": {
      "_id": "507f1f77bcf86cd799439010",
      "firstName": "Admin",
      "lastName": "User"
    },
    "reviewedAt": "2024-01-15T11:00:00.000Z",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

---

### 4. Update Status to Contacted

Mark a partnership request as contacted. This indicates that admin has spoken with the company.

**Endpoint:** `PATCH /api/admins/marketplace-partnership-requests/:id/contacted`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` - Partnership request ID

**Request Body:**

```json
{
  "adminNotes": "Kompaniya bilan gaplashildi. Qo'shimcha ma'lumotlar talab qilindi."
}
```

**Request Fields:**
- `adminNotes` (optional) - Admin notes about the contact (max 1000 characters)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov gaplashilgan deb belgilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "status": "contacted",
    "contactedAt": "2024-01-15T12:00:00.000Z",
    "adminNotes": "Kompaniya bilan gaplashildi. Qo'shimcha ma'lumotlar talab qilindi.",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format or validation error
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

---

### 5. Approve Partnership Request

Approve a partnership request. Approved requests can be converted to contragents.

**Endpoint:** `PATCH /api/admins/marketplace-partnership-requests/:id/approve`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` - Partnership request ID

**Request Body:**

```json
{
  "adminNotes": "Barcha hujjatlar to'g'ri. Tasdiqlash mumkin."
}
```

**Request Fields:**
- `adminNotes` (optional) - Admin notes about the approval (max 1000 characters)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "status": "approved",
    "approvedAt": "2024-01-15T13:00:00.000Z",
    "adminNotes": "Barcha hujjatlar to'g'ri. Tasdiqlash mumkin.",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format or validation error
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

---

### 6. Reject Partnership Request

Reject a partnership request. Admin notes are required when rejecting.

**Endpoint:** `PATCH /api/admins/marketplace-partnership-requests/:id/reject`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id` - Partnership request ID

**Request Body:**

```json
{
  "adminNotes": "INN noto'g'ri. Qayta tekshirib yuborish kerak."
}
```

**Request Fields:**
- `adminNotes` (required) - Reason for rejection (max 1000 characters, cannot be empty)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi rad etildi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "status": "rejected",
    "rejectedAt": "2024-01-15T14:00:00.000Z",
    "adminNotes": "INN noto'g'ri. Qayta tekshirib yuborish kerak.",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format, missing adminNotes, or validation error
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

**Example Error Response (Missing adminNotes):**

```json
{
  "success": false,
  "message": "Rad etish sababi (adminNotes) kiritilishi shart"
}
```

---

### 7. Convert to Contragent

Convert an approved partnership request to a contragent account.

**Endpoint:** `POST /api/admins/marketplace-partnership-requests/:id/convert-to-contragent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` - Partnership request ID

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Hamkor muvaffaqiyatli contragentga aylantirildi",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "O'zbekiston Tovar",
    "inn": "123456789",
    "phone": "+998901234567",
    "viloyat": {...},
    "tuman": {...},
    "mfy": {...},
    "status": "active",
    ...
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid request ID format or request not approved:
  - Request status is not `approved`
  - Contragent with same INN already exists
  - Contragent with same phone already exists
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for admin
- **404 Not Found** - Request not found
- **500 Internal Server Error** - Server error

**Example Error Response (Not Approved):**

```json
{
  "success": false,
  "message": "Faqat tasdiqlangan (approved) hamkorlik so'rovlari contragentga aylantirilishi mumkin"
}
```

**Example Error Response (Duplicate INN):**

```json
{
  "success": false,
  "message": "Ushbu INN bilan contragent allaqachon mavjud"
}
```

---

## Status Flow

The partnership request goes through the following status flow:

1. **pending** - User submits request
2. **reviewing** - Admin starts reviewing (sets `reviewedBy` and `reviewedAt`)
3. **contacted** - Admin contacts the company (sets `contactedAt`)
4. **approved** - Request approved (sets `approvedAt`) → Can be converted to contragent
5. **rejected** - Request rejected (sets `rejectedAt`, requires `adminNotes`)

**Note:** 
- Status can go directly from `pending` to `approved` or `rejected` without intermediate steps
- Status can go from `reviewing` to `contacted`, `approved`, or `rejected`
- Only `approved` requests can be converted to contragents

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
- **403 Forbidden** - Token not for admin
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
  "message": "Bu token admin uchun emas"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Hamkorlik so'rovi topilmadi"
}
```

---

## Filtering and Pagination

### Filtering

Use the `status` query parameter to filter requests:

```
GET /api/admins/marketplace-partnership-requests?status=pending
```

Available status values:
- `pending` - Waiting for review
- `reviewing` - Being reviewed
- `contacted` - Admin has contacted
- `approved` - Approved
- `rejected` - Rejected

### Pagination

Use `page` and `limit` query parameters for pagination:

```
GET /api/admins/marketplace-partnership-requests?page=1&limit=20
```

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response includes pagination metadata:**
- `count` - Number of items in current page
- `total` - Total number of items
- `page` - Current page number
- `limit` - Items per page
- `totalPages` - Total number of pages

---

## Examples

### Example 1: Get All Pending Requests

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/marketplace-partnership-requests?status=pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [...]
}
```

### Example 2: Start Reviewing

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/admins/marketplace-partnership-requests/507f1f77bcf86cd799439022/reviewing" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "So'rov ko'rib chiqilmoqda deb belgilandi",
  "data": {...}
}
```

### Example 3: Mark as Contacted

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/admins/marketplace-partnership-requests/507f1f77bcf86cd799439022/contacted" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "adminNotes": "Kompaniya bilan gaplashildi"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "So'rov gaplashilgan deb belgilandi",
  "data": {...}
}
```

### Example 4: Approve Request

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/admins/marketplace-partnership-requests/507f1f77bcf86cd799439022/approve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "adminNotes": "Barcha hujjatlar to'\''g'\''ri"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi tasdiqlandi",
  "data": {...}
}
```

### Example 5: Reject Request

**Request:**

```bash
curl -X PATCH "http://localhost:5000/api/admins/marketplace-partnership-requests/507f1f77bcf86cd799439022/reject" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "adminNotes": "INN noto'\''g'\''ri"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Hamkorlik so'rovi rad etildi",
  "data": {...}
}
```

### Example 6: Convert to Contragent

**Request:**

```bash
curl -X POST "http://localhost:5000/api/admins/marketplace-partnership-requests/507f1f77bcf86cd799439022/convert-to-contragent" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Hamkor muvaffaqiyatli contragentga aylantirildi. Parol o'rnatish uchun telefon raqam orqali kirish kerak.",
  "data": {
    "contragent": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "O'zbekiston Tovar",
      "inn": "123456789",
      "phone": "+998901234567",
      "passwordSetupAllowed": true
    }
  }
}
```

**Note:** 
- Contragent is created without password
- SMS code is automatically sent to marketplace user's phone (if user exists)
- User must complete password setup via `/api/contragents/password-setup/step1` and `/step2` endpoints

---

## Workflow Recommendations

### Typical Admin Workflow

1. **View New Requests**: Get all pending requests
   ```
   GET /api/admins/marketplace-partnership-requests?status=pending
   ```

2. **Review Request Details**: Get full details of a specific request
   ```
   GET /api/admins/marketplace-partnership-requests/:id
   ```

3. **Start Reviewing**: Mark request as being reviewed
   ```
   PATCH /api/admins/marketplace-partnership-requests/:id/reviewing
   ```

4. **Contact Company**: After speaking with the company
   ```
   PATCH /api/admins/marketplace-partnership-requests/:id/contacted
   { "adminNotes": "..." }
   ```

5. **Approve or Reject**: After review and decision
   ```
   PATCH /api/admins/marketplace-partnership-requests/:id/approve
   { "adminNotes": "..." }
   ```
   or
   ```
   PATCH /api/admins/marketplace-partnership-requests/:id/reject
   { "adminNotes": "Rad etish sababi" }
   ```

6. **Convert to Contragent**: For approved requests
   ```
   POST /api/admins/marketplace-partnership-requests/:id/convert-to-contragent
   ```

---

## Notes

1. **Authentication**: All endpoints require valid admin JWT token. Make sure to include the token in the Authorization header.

2. **Status Management**: 
   - Use `reviewing` to indicate you're actively reviewing a request
   - Use `contacted` after speaking with the company
   - Use `approve` or `reject` for final decisions

3. **Admin Notes**: 
   - Optional for `contacted` and `approve` actions
   - Required for `reject` action (must provide reason)
   - Maximum 1000 characters

4. **Rejection Requirements**: When rejecting a request, `adminNotes` is required and cannot be empty. This ensures users understand why their request was rejected.

5. **Conversion Requirements**: Only `approved` requests can be converted to contragents. The system checks for duplicate INN and phone numbers before conversion.

6. **Conversion Requirements**: Only `approved` requests can be converted to contragents. The system checks for duplicate INN and phone numbers before conversion.

7. **Contragent Creation**: When converting to contragent:
   - Contragent is created **without password** (`passwordSetupAllowed: true`)
   - User must request SMS code by sending phone number to `/api/contragents/password-setup/step1`
   - SMS template: `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`
   - User must complete password setup via contragent auth endpoints before login

8. **Pagination**: For large datasets, use pagination to improve performance. Default limit is 20 items per page.

9. **Response Ordering**: Requests are returned in descending order by creation date (newest first).

10. **Automatic Tracking**: The system automatically tracks:
   - `reviewedBy` - Admin who started reviewing
   - `reviewedAt` - When review started
   - `contactedAt` - When company was contacted
   - `approvedAt` - When request was approved
   - `rejectedAt` - When request was rejected

---

**Last Updated:** 2024-01-15

