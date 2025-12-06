# Agent API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Agent Types](#agent-types)
- [Endpoints](#endpoints)
  - [Login Agent](#1-login-agent)
  - [Create Agent](#2-create-agent)
  - [Get All Agents](#3-get-all-agents)
  - [Get Agent by ID](#4-get-agent-by-id)
  - [Update Agent](#5-update-agent)
  - [Delete Agent](#6-delete-agent)
- [Error Handling](#error-handling)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Overview

Agent API provides endpoints for managing agents in the system. Agents are categorized into three types based on their assigned regions: Viloyat Agent, Tuman Agent, and MFY Agent. Each agent has a name, assigned regions, phone number, and authentication credentials.

**Base Path:** `/api/agents`

---

## Base URL

```
http://localhost:5000/api/agents
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login, you will receive a JWT token that should be included in the `Authorization` header for protected endpoints.

**Format:** `Authorization: Bearer <token>`

**Token Expiration:** 24 hours

**Note:** Currently, most endpoints do not require authentication. However, it is recommended to implement authentication middleware for production use.

---

## Data Models

### Agent Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (2-200 characters)",
  "viloyat": "object (reference to Region, type: 'region', required)",
  "tuman": "object | null (reference to Region, type: 'district', optional)",
  "mfy": "object | null (reference to Region, type: 'mfy', optional)",
  "phone": "string (valid phone number, unique)",
  "status": "string (enum: 'active' | 'inactive', default: 'active')",
  "agentType": "string (computed: 'viloyat' | 'tuman' | 'mfy')",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Region Object (when populated):**
```json
{
  "_id": "string",
  "name": "string",
  "type": "string",
  "code": "string"
}
```

**Note:** The `password` field is never returned in API responses for security reasons.

---

## Agent Types

Agent type is automatically determined based on the selected regions:

1. **Viloyat Agent** (`agentType: 'viloyat'`)
   - Only `viloyat` is selected
   - `tuman` and `mfy` are `null`

2. **Tuman Agent** (`agentType: 'tuman'`)
   - `viloyat` and `tuman` are selected
   - `mfy` is `null`

3. **MFY Agent** (`agentType: 'mfy'`)
   - `viloyat`, `tuman`, and `mfy` are all selected

---

## Endpoints

### 1. Login Agent

Authenticate an agent and receive a JWT token.

**Endpoint:** `POST /api/agents/login`

**Request Body:**

```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Validation Rules:**
- `phone`: Required, valid phone number format
- `password`: Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": null,
      "phone": "+998901234567",
      "status": "active",
      "agentType": "tuman",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Account is inactive
- **500 Internal Server Error** - Server error

---

### 2. Create Agent

Create a new agent.

**Endpoint:** `POST /api/agents`

**Request Body:**

```json
{
  "name": "string (required, 2-200 chars)",
  "viloyat": "string (required, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string | null (optional, MongoDB ObjectId of Region with type: 'district')",
  "mfy": "string | null (optional, MongoDB ObjectId of Region with type: 'mfy')",
  "phone": "string (required, valid phone format, unique)",
  "password": "string (required, min 6 chars)",
  "status": "string (optional, 'active' | 'inactive', default: 'active')"
}
```

**Validation Rules:**
- `name`: Required, 2-200 characters
- `viloyat`: Required, must be a valid Region ID with type 'region'
- `tuman`: Optional, must be a valid Region ID with type 'district', and must be a child of the selected viloyat
- `mfy`: Optional, must be a valid Region ID with type 'mfy', and must be a child of the selected tuman. Can only be set if `tuman` is also set.
- `phone`: Required, must be a valid phone number format, unique
- `password`: Required, minimum 6 characters
- `status`: Optional, defaults to 'active'

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate phone, invalid region, or hierarchy violation
- **500 Internal Server Error** - Server error

---

### 3. Get All Agents

Retrieve all agents with optional filtering and pagination.

**Endpoint:** `GET /api/agents`

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of items per page
- `status` (optional) - Filter by status: 'active' or 'inactive'
- `viloyat` (optional) - Filter by viloyat (Region ID)
- `tuman` (optional) - Filter by tuman (Region ID)
- `mfy` (optional) - Filter by mfy (Region ID)
- `agentType` (optional) - Filter by agent type: 'viloyat', 'tuman', or 'mfy'

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
      "name": "John Doe",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": null,
      "mfy": null,
      "phone": "+998901234567",
      "status": "active",
      "agentType": "viloyat",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Smith",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Yunusobod MFY",
        "type": "mfy",
        "code": "YUN-MFY"
      },
      "phone": "+998901234568",
      "status": "active",
      "agentType": "mfy",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

---

### 4. Get Agent by ID

Retrieve a specific agent by its ID.

**Endpoint:** `GET /api/agents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the agent

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid agent ID format
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

---

### 5. Update Agent

Update an existing agent's information.

**Endpoint:** `PUT /api/agents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the agent

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (optional, 2-200 chars)",
  "viloyat": "string (optional, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string | null (optional, MongoDB ObjectId of Region with type: 'district')",
  "mfy": "string | null (optional, MongoDB ObjectId of Region with type: 'mfy')",
  "phone": "string (optional, valid phone format, unique)",
  "password": "string (optional, min 6 chars)",
  "status": "string (optional, 'active' | 'inactive')"
}
```

**Validation Rules:**
- Same as create, but all fields are optional
- Phone must be unique (cannot duplicate existing values)
- If updating viloyat, tuman, or mfy, hierarchy validation applies
- If viloyat is changed, tuman and mfy are automatically reset to null
- If tuman is changed, mfy is automatically reset to null

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe (Updated)",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error, duplicate phone, invalid region, hierarchy violation, or invalid ID
- **404 Not Found** - Agent not found
- **500 Internal Server Error** - Server error

---

### 6. Delete Agent

Delete an agent.

**Endpoint:** `DELETE /api/agents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the agent

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid agent ID format
- **404 Not Found** - Agent not found
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
- **401 Unauthorized** - Authentication failed
- **403 Forbidden** - Account is inactive
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
      "message": "Ismi kiritilishi shart"
    },
    {
      "field": "viloyat",
      "message": "Viloyat kiritilishi shart"
    }
  ]
}
```

#### Duplicate Phone Number (400)

```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon mavjud"
}
```

#### Invalid Region (400)

```json
{
  "success": false,
  "message": "Viloyat topilmadi yoki noto'g'ri tur"
}
```

#### Hierarchy Violation (400)

```json
{
  "success": false,
  "message": "Tuman tanlangan viloyatga tegishli emas"
}
```

```json
{
  "success": false,
  "message": "MFY tanlash uchun tuman ham tanlanishi kerak"
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

#### Not Found (404)

```json
{
  "success": false,
  "message": "Agent topilmadi"
}
```

#### Invalid ID (400)

```json
{
  "success": false,
  "message": "Noto'g'ri agent ID"
}
```

---

## Validation Rules

### Name
- **Type:** String
- **Required:** Yes (for create)
- **Min Length:** 2 characters
- **Max Length:** 200 characters
- **Trim:** Yes

### Viloyat
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** Yes (for create)
- **Description:** Must be a valid Region ID with type 'region' from the regions collection

### Tuman
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** No
- **Default:** `null`
- **Description:** Must be a valid Region ID with type 'district' from the regions collection. Must be a child of the selected viloyat. Can only be set if viloyat is set.

### MFY
- **Type:** MongoDB ObjectId (reference to Region)
- **Required:** No
- **Default:** `null`
- **Description:** Must be a valid Region ID with type 'mfy' from the regions collection. Must be a child of the selected tuman. Can only be set if both viloyat and tuman are set.

### Phone
- **Type:** String
- **Required:** Yes (for create)
- **Format:** Valid phone number pattern
- **Pattern:** `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`
- **Unique:** Yes
- **Examples:**
  - `+998901234567`
  - `998901234567`
  - `(998) 90-123-45-67`

### Password
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

---

## Examples

### Example 1: Login Agent

**Request:**

```bash
curl -X POST http://localhost:5000/api/agents/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "securepass123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInBob25lIjoiKzk5ODkwMTIzNDU2NyIsImFnZW50VHlwZSI6InR1bWFuIiwidHlwZSI6ImFnZW50IiwiaWF0IjoxNzA1MzI0MDAwLCJleHAiOjE3MDU0MTA0MDB9.abc123...",
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": null,
      "phone": "+998901234567",
      "status": "active",
      "agentType": "tuman",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Example 2: Create Viloyat Agent

**Request:**

```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "viloyat": "507f1f77bcf86cd799439012",
    "phone": "+998901234567",
    "password": "securepass123",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": null,
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "viloyat",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 3: Create Tuman Agent

**Request:**

```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "phone": "+998901234568",
    "password": "securepass456",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Jane Smith",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234568",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Example 4: Create MFY Agent

**Request:**

```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Johnson",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439015",
    "phone": "+998901234569",
    "password": "securepass789",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Bob Johnson",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Yunusobod MFY",
      "type": "mfy",
      "code": "YUN-MFY"
    },
    "phone": "+998901234569",
    "status": "active",
    "agentType": "mfy",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### Example 5: Get All Agents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents?page=1&limit=10&status=active&agentType=tuman"
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
      "_id": "507f1f77bcf86cd799439014",
      "name": "Jane Smith",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": null,
      "phone": "+998901234568",
      "status": "active",
      "agentType": "tuman",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Example 6: Get Agent by ID

**Request:**

```bash
curl -X GET http://localhost:5000/api/agents/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example 7: Update Agent

**Request:**

```bash
curl -X PUT http://localhost:5000/api/agents/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe (Updated)",
    "status": "active"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe (Updated)",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "mfy": null,
    "phone": "+998901234567",
    "status": "active",
    "agentType": "tuman",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 8: Delete Agent

**Request:**

```bash
curl -X DELETE http://localhost:5000/api/agents/507f1f77bcf86cd799439011
```

**Response:**

```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli o'chirildi"
}
```

### Example 9: Validation Error

**Request:**

```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "J",
    "phone": "123",
    "password": "123"
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
      "message": "Ismi kamida 2 ta belgidan iborat bo'lishi kerak"
    },
    {
      "field": "viloyat",
      "message": "Viloyat kiritilishi shart"
    },
    {
      "field": "phone",
      "message": "To'g'ri telefon raqam formatini kiriting"
    },
    {
      "field": "password",
      "message": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
    }
  ]
}
```

---

## Notes

1. **Password Security:** Passwords are automatically hashed using bcrypt before being stored in the database. The password is never returned in API responses.

2. **Phone Number Uniqueness:** Phone numbers must be unique across all agents.

3. **Agent Type Determination:** Agent type is automatically determined based on selected regions:
   - Only viloyat → `agentType: 'viloyat'`
   - Viloyat + tuman → `agentType: 'tuman'`
   - Viloyat + tuman + mfy → `agentType: 'mfy'`

4. **Region Hierarchy:** Regions must follow the hierarchy:
   - Tuman must be a child of viloyat
   - MFY must be a child of tuman
   - MFY can only be set if tuman is also set

5. **Region Population:** All region fields (viloyat, tuman, mfy) are automatically populated when fetching agents.

6. **JWT Token:** Login tokens expire after 24 hours. The token includes agent ID, phone, agentType, and type ('agent').

7. **Status Filtering:** You can filter agents by status in the `getAllAgents` endpoint.

8. **Agent Type Filtering:** You can filter agents by agent type (viloyat, tuman, mfy) in the `getAllAgents` endpoint.

9. **Pagination:** The `getAllAgents` endpoint supports pagination with `page` and `limit` query parameters.

10. **Timestamps:** All agent records include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

11. **Cascading Updates:** When updating regions:
    - If viloyat is changed, tuman and mfy are automatically reset to null
    - If tuman is changed, mfy is automatically reset to null

---

**Last Updated:** 2024-01-15



