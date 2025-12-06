# Admin Partnership Request API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get All Partnership Requests](#1-get-all-partnership-requests)
  - [Get Partnership Request by ID](#2-get-partnership-request-by-id)
  - [Update Contact Status](#3-update-contact-status)
  - [Update Request Status](#4-update-request-status)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Filtering and Pagination](#filtering-and-pagination)
- [Examples](#examples)

---

## Overview

Admin Partnership Request API provides endpoints for administrators to manage partnership requests submitted by marketplace users. Admins can view all requests, filter them by status and contact status, update contact status, and approve or reject requests.

**Base Path:** `/api/admins`

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

### PartnershipRequest

```json
{
  "_id": "string (ObjectId)",
  "marketplaceUser": {
    "_id": "string (ObjectId)",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "viloyat": "ObjectId",
    "tuman": "ObjectId",
    "mfy": "ObjectId"
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
  "activity": "string",
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

### 1. Get All Partnership Requests

Get all partnership requests with optional filtering and pagination.

**Endpoint:** `GET /partnership-requests`

**Authentication:** Required (Admin)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `approved`, `rejected` |
| `contactStatus` | string | No | Filter by contact status: `not_contacted`, `contacted`, `in_progress`, `completed` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
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
      "activity": "Qishloq xo'jalik mahsulotlari yetkazib berish",
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
      "marketplaceUser": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
        "firstName": "Bobur",
        "lastName": "Toshmatov",
        "phone": "+998901234569"
      },
      "companyName": "Yana bir kompaniya",
      "inn": "987654321",
      "mfo": "00015",
      "accountNumber": "22614840900000000002",
      "viloyat": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "name": "Samarqand viloyati",
        "type": "region",
        "code": "20"
      },
      "tuman": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
        "name": "Samarqand tumani",
        "type": "district",
        "code": "2001"
      },
      "mfy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0ka",
        "name": "Registon MFY",
        "type": "mfy",
        "code": "2001001"
      },
      "activity": "Elektronika va maishiy texnika",
      "managerFirstName": "Bobur",
      "managerLastName": "Toshmatov",
      "managerPhone": "+998901234570",
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
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
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

### 2. Get Partnership Request by ID

Get a specific partnership request by its ID.

**Endpoint:** `GET /partnership-requests/:id`

**Authentication:** Required (Admin)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Partnership Request ObjectId |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "marketplaceUser": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567",
      "viloyat": "65a1b2c3d4e5f6g7h8i9j0k3",
      "tuman": "65a1b2c3d4e5f6g7h8i9j0k4",
      "mfy": "65a1b2c3d4e5f6g7h8i9j0k5"
    },
    "companyName": "O'zbekiston Tijorat MChJ",
    "inn": "123456789",
    "mfo": "00014",
    "accountNumber": "22614840900000000001",
    "viloyat": {
      "_id": "65a1b3c3d4e5f6g7h8i9j0k3",
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
    "activity": "Qishloq xo'jalik mahsulotlari yetkazib berish",
    "managerFirstName": "Akmal",
    "managerLastName": "Karimov",
    "managerPhone": "+998901234568",
    "contactStatus": "contacted",
    "status": "pending",
    "adminNotes": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid ID:**

```json
{
  "success": false,
  "message": "Noto'g'ri so'rov ID"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Hamkorlik so'rovi topilmadi"
}
```

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
  "message": "Hamkorlik so'rovini olishda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

### 3. Update Contact Status

Update the contact status of a partnership request.

**Endpoint:** `PATCH /partnership-requests/:id/contact-status`

**Authentication:** Required (Admin)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Partnership Request ObjectId |

**Request Body:**

```json
{
  "contactStatus": "not_contacted | contacted | in_progress | completed"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contactStatus` | string | Yes | New contact status value |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Aloqa holati muvaffaqiyatli yangilandi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "marketplaceUser": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567"
    },
    "companyName": "O'zbekiston Tijorat MChJ",
    "contactStatus": "contacted",
    "status": "pending",
    "updatedAt": "2024-01-16T15:30:00.000Z"
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
      "field": "contactStatus",
      "message": "Aloqa holati \"not_contacted\", \"contacted\", \"in_progress\" yoki \"completed\" bo'lishi kerak"
    }
  ]
}
```

**400 Bad Request - Invalid ID:**

```json
{
  "success": false,
  "message": "Noto'g'ri so'rov ID"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Hamkorlik so'rovi topilmadi"
}
```

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
  "message": "Aloqa holatini yangilashda xatolik yuz berdi",
  "error": "Error message details"
}
```

---

### 4. Update Request Status

Update the status of a partnership request (approve or reject) and optionally add admin notes.

**Endpoint:** `PATCH /partnership-requests/:id/status`

**Authentication:** Required (Admin)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Partnership Request ObjectId |

**Request Body:**

```json
{
  "status": "pending | approved | rejected",
  "adminNotes": "string (optional, max 1000 characters)"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New request status value |
| `adminNotes` | string | No | Admin notes/comments (max 1000 characters) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov holati muvaffaqiyatli yangilandi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "marketplaceUser": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Ali",
      "lastName": "Valiyev",
      "phone": "+998901234567"
    },
    "companyName": "O'zbekiston Tijorat MChJ",
    "status": "approved",
    "adminNotes": "Kompaniya ma'lumotlari to'liq va tekshirildi. Hamkorlik shartnomasi tayyorlandi.",
    "updatedAt": "2024-01-16T16:00:00.000Z"
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
      "field": "status",
      "message": "So'rov holati \"pending\", \"approved\" yoki \"rejected\" bo'lishi kerak"
    },
    {
      "field": "adminNotes",
      "message": "Admin eslatmasi 1000 ta belgidan oshmasligi kerak"
    }
  ]
}
```

**400 Bad Request - Invalid ID:**

```json
{
  "success": false,
  "message": "Noto'g'ri so'rov ID"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Hamkorlik so'rovi topilmadi"
}
```

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
  "message": "So'rov holatini yangilashda xatolik yuz berdi",
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
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Validation Rules

### Contact Status
- Required when updating
- Must be one of: `not_contacted`, `contacted`, `in_progress`, `completed`

### Request Status
- Required when updating
- Must be one of: `pending`, `approved`, `rejected`

### Admin Notes
- Optional
- Maximum length: 1000 characters
- Can be `null` or empty string
- Trimmed (leading/trailing spaces removed)

---

## Filtering and Pagination

### Filtering

You can filter partnership requests by:

1. **Status**: Filter by request status
   - `?status=pending` - Only pending requests
   - `?status=approved` - Only approved requests
   - `?status=rejected` - Only rejected requests

2. **Contact Status**: Filter by contact status
   - `?contactStatus=not_contacted` - Not contacted yet
   - `?contactStatus=contacted` - Contact has been made
   - `?contactStatus=in_progress` - In progress
   - `?contactStatus=completed` - Completed

3. **Combined Filters**: You can combine multiple filters
   - `?status=pending&contactStatus=not_contacted` - Pending requests that haven't been contacted

### Pagination

Pagination is supported with the following query parameters:

- `page` - Page number (default: 1, minimum: 1)
- `limit` - Items per page (default: 20, minimum: 1)

**Example:**

```
GET /api/admins/partnership-requests?status=pending&page=2&limit=10
```

**Response includes pagination metadata:**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 2,
  "limit": 10,
  "totalPages": 3,
  "data": [...]
}
```

### Sorting

Requests are automatically sorted by creation date in descending order (newest first).

---

## Examples

### Example 1: Get All Pending Requests

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/partnership-requests?status=pending" \
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

### Example 2: Get Not Contacted Requests

**Request:**

```bash
curl -X GET "http://localhost:5000/api/admins/partnership-requests?contactStatus=not_contacted" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Update Contact Status

**Request:**

```bash
curl -X PATCH http://localhost:5000/api/admins/partnership-requests/65a1b2c3d4e5f6g7h8i9j0k1/contact-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "contactStatus": "contacted"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Aloqa holati muvaffaqiyatli yangilandi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "contactStatus": "contacted",
    "updatedAt": "2024-01-16T15:30:00.000Z"
  }
}
```

### Example 4: Approve Request with Notes

**Request:**

```bash
curl -X PATCH http://localhost:5000/api/admins/partnership-requests/65a1b2c3d4e5f6g7h8i9j0k1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "status": "approved",
    "adminNotes": "Kompaniya ma'lumotlari to'liq va tekshirildi. Hamkorlik shartnomasi tayyorlandi."
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "So'rov holati muvaffaqiyatli yangilandi",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "approved",
    "adminNotes": "Kompaniya ma'lumotlari to'liq va tekshirildi. Hamkorlik shartnomasi tayyorlandi.",
    "updatedAt": "2024-01-16T16:00:00.000Z"
  }
}
```

### Example 5: Reject Request

**Request:**

```bash
curl -X PATCH http://localhost:5000/api/admins/partnership-requests/65a1b2c3d4e5f6g7h8i9j0k1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "status": "rejected",
    "adminNotes": "Kompaniya ma'lumotlari to'liq emas. Qayta ariza berish mumkin."
  }'
```

### Example 6: JavaScript/Fetch Example

```javascript
// Get All Partnership Requests with Filters
async function getAllPartnershipRequests(token, filters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.contactStatus) queryParams.append('contactStatus', filters.contactStatus);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const url = `http://localhost:5000/api/admins/partnership-requests?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data;
}

// Get Partnership Request by ID
async function getPartnershipRequestById(token, requestId) {
  const response = await fetch(
    `http://localhost:5000/api/admins/partnership-requests/${requestId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();
  return data;
}

// Update Contact Status
async function updateContactStatus(token, requestId, contactStatus) {
  const response = await fetch(
    `http://localhost:5000/api/admins/partnership-requests/${requestId}/contact-status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contactStatus })
    }
  );

  const data = await response.json();
  return data;
}

// Update Request Status
async function updateRequestStatus(token, requestId, status, adminNotes = null) {
  const body = { status };
  if (adminNotes) body.adminNotes = adminNotes;

  const response = await fetch(
    `http://localhost:5000/api/admins/partnership-requests/${requestId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();
  return data;
}

// Usage Examples
const token = 'your-admin-jwt-token-here';

// Get all pending requests
getAllPartnershipRequests(token, { status: 'pending' })
  .then(result => console.log('Pending requests:', result))
  .catch(error => console.error('Error:', error));

// Get not contacted requests
getAllPartnershipRequests(token, { contactStatus: 'not_contacted' })
  .then(result => console.log('Not contacted:', result))
  .catch(error => console.error('Error:', error));

// Update contact status
updateContactStatus(token, '65a1b2c3d4e5f6g7h8i9j0k1', 'contacted')
  .then(result => console.log('Updated:', result))
  .catch(error => console.error('Error:', error));

// Approve request
updateRequestStatus(
  token,
  '65a1b2c3d4e5f6g7h8i9j0k1',
  'approved',
  'Kompaniya ma\'lumotlari to\'liq va tekshirildi.'
)
  .then(result => console.log('Approved:', result))
  .catch(error => console.error('Error:', error));
```

---

## Workflow Recommendations

### Typical Admin Workflow

1. **View New Requests**: Get all pending requests that haven't been contacted
   ```
   GET /api/admins/partnership-requests?status=pending&contactStatus=not_contacted
   ```

2. **Review Request Details**: Get full details of a specific request
   ```
   GET /api/admins/partnership-requests/:id
   ```

3. **Mark as Contacted**: After initial contact with the company
   ```
   PATCH /api/admins/partnership-requests/:id/contact-status
   { "contactStatus": "contacted" }
   ```

4. **Update Progress**: As the partnership process continues
   ```
   PATCH /api/admins/partnership-requests/:id/contact-status
   { "contactStatus": "in_progress" }
   ```

5. **Approve or Reject**: After review and decision
   ```
   PATCH /api/admins/partnership-requests/:id/status
   { "status": "approved", "adminNotes": "..." }
   ```

6. **Mark as Completed**: When partnership is fully established
   ```
   PATCH /api/admins/partnership-requests/:id/contact-status
   { "contactStatus": "completed" }
   ```

---

## Notes

1. **Authentication**: All endpoints require valid admin JWT token. Make sure to include the token in the Authorization header.

2. **Status vs Contact Status**: 
   - `status` indicates the final decision (pending/approved/rejected)
   - `contactStatus` indicates the communication progress (not_contacted/contacted/in_progress/completed)

3. **Admin Notes**: Use admin notes to document important information about the request, reasons for approval/rejection, or next steps.

4. **Pagination**: For large datasets, use pagination to improve performance. Default limit is 20 items per page.

5. **Filtering**: Combine multiple filters to get specific subsets of requests. For example, get all pending requests that have been contacted but not yet approved.

6. **Response Ordering**: Requests are returned in descending order by creation date (newest first).

7. **Data Population**: All responses include populated region data (viloyat, tuman, mfy) and marketplace user information for easier display in admin panels.

---

**Last Updated:** 2024-01-15




