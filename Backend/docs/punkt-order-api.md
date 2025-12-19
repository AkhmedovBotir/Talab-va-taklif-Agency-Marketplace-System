# Punkt Order API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Login](#1-login)
  - [Get My Orders](#2-get-my-orders)
  - [Get Order by ID](#3-get-order-by-id)
  - [Confirm Order](#4-confirm-order)
  - [Request to Punkts](#5-request-to-punkts)
  - [Get Punkt Requests](#6-get-punkt-requests)
  - [Respond to Request](#7-respond-to-request)
  - [Assign Order to Agent](#8-assign-order-to-agent)
  - [Get Order Contragent IDs](#9-get-order-contragent-ids)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Punkt Order API provides endpoints for punkt users to manage orders in their region. Punkts can view orders in their area, confirm orders if products' delivery regions include their tuman's MFY, and request other punkts for orders that cannot be confirmed directly.

**Base Path:** `/api/punkt`

---

## Base URL

```
http://localhost:5000/api/punkt
```

---

## Authentication

All endpoints (except login) require authentication using JWT token from Punkt login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required for:**
- Getting orders
- Confirming orders
- Requesting to punkts
- Getting requests
- Responding to requests

**Not required for:**
- Login

---

## Data Models

### Order Object (with Punkt fields)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "user": "object (reference to MarketplaceUser)",
  "orderNumber": "string (unique)",
  "items": "array of order items",
  "totalPrice": "number",
  "totalOriginalPrice": "number",
  "totalKpiPrice": "number",
  "itemCount": "number",
  "status": "string (enum: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled')",
  "paymentStatus": "string (enum: 'pending' | 'paid' | 'failed' | 'refunded')",
  "paymentMethod": "string (enum: 'cash' | 'card')",
  "deliveryViloyat": "object (reference to Region)",
  "deliveryTuman": "object | null (reference to Region)",
  "deliveryMfy": "object | null (reference to Region)",
  "deliveryNote": "string",
  "phoneNumber": "string",
  "punktRequests": [
    {
      "punktId": "object (reference to Punkt)",
      "status": "string (enum: 'pending' | 'accepted' | 'rejected')",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string | null (ISO 8601 date)"
    }
  ],
  "contragentRequests": [
    {
      "contragentId": "object (reference to Contragent)",
      "itemIds": "array of numbers (indices of items requested from this contragent)",
      "status": "string (enum: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt')",
      "requestedAt": "string (ISO 8601 date)",
      "respondedAt": "string | null (ISO 8601 date)",
      "deliveredToPunktAt": "string | null (ISO 8601 date)"
    }
  ],
  "confirmedByPunkt": "object | null (reference to Punkt)",
  "punktStatus": "string (enum: 'pending' | 'confirmed' | 'rejected' | 'requested')",
  "assignedToAgent": "object | null (reference to Agent)",
  "assignedByPunkt": "object | null (reference to Punkt)",
  "assignedAt": "string | null (ISO 8601 date)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Punkt Request Object

```json
{
  "punktId": "string (MongoDB ObjectId, reference to Punkt)",
  "status": "string (enum: 'pending' | 'accepted' | 'rejected')",
  "requestedAt": "string (ISO 8601 date)",
  "respondedAt": "string | null (ISO 8601 date)"
}
```

---

## Endpoints

### 1. Login

Login to punkt account using phone number and password.

**Endpoint:** `POST /api/punkts/login`

**Request Body:**

```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567",
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
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Account is inactive

---

### 2. Get My Orders

Get all orders in punkt's region (o'z hududidagi buyurtmalar).

**Endpoint:** `GET /api/punkt/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

- `status` (optional) - Filter by order status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `paymentStatus` (optional) - Filter by payment status: 'pending', 'paid', 'failed', 'refunded'
- `paymentMethod` (optional) - Filter by payment method: 'cash', 'card'
- `orderNumber` (optional) - Search by order number (case-insensitive)
- `startDate` (optional) - Filter orders from this date (ISO 8601 format)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format)
- `minTotalPrice` (optional) - Filter orders with total price >= this value
- `maxTotalPrice` (optional) - Filter orders with total price <= this value
- `search` (optional) - Search by order number or phone number (case-insensitive)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Coca Cola 1.5L",
            "price": 15000,
            "originalPrice": 12000,
            "category": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Ichimliklar",
              "slug": "ichimliklar"
            },
            "deliveryRegions": [
              {
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
                }
              }
            ]
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000
        }
      ],
      "totalPrice": 30000,
      "totalOriginalPrice": 24000,
      "totalKpiPrice": 1500,
      "itemCount": 2,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "deliveryMfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "phoneNumber": "+998901234567",
      "punktRequests": [],
      "confirmedByPunkt": null,
      "punktStatus": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 3. Get Order by ID

Get a specific order by its ID. Only orders in punkt's region can be accessed.

**Endpoint:** `GET /api/punkt/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "phone": "+998901234567"
    },
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Coca Cola 1.5L",
          "price": 15000,
          "originalPrice": 12000
        },
        "quantity": 2,
        "price": 15000,
        "originalPrice": 12000
      }
    ],
    "totalPrice": 30000,
    "status": "pending",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "TASH"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Yunusobod tumani",
      "type": "district",
      "code": "YUN"
    },
    "punktStatus": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

### 4. Confirm Order

Confirm an order. Punkt can only confirm orders if:
- Order's delivery region matches punkt's viloyat and tuman
- At least one product's delivery region includes punkt's tuman MFY, OR
- Order's deliveryMfy is in punkt's tuman

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Status Changes:**
- **Before:** `pending`
- **After:** `confirmed_by_punkt`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod tumani"
      }
    },
    "punktStatus": "confirmed",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Order already confirmed
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region OR punkt cannot confirm this order
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

### 5. Request to Punkts

Request other punkts in specified tumans to handle an order. This is used when punkt cannot directly confirm an order because products' delivery regions don't include punkt's tuman MFY.

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkts`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Request Body:**

```json
{
  "tumanIds": [
    "507f1f77bcf86cd799439016",
    "507f1f77bcf86cd799439017"
  ]
}
```

**Validation Rules:**
- `tumanIds`: Required, array of MongoDB ObjectIds
- All tumanIds must belong to punkt's viloyat
- All tumanIds must be valid district type regions

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "3 ta punktga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "requestedPunkts": [
      {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 2",
        "phone": "+998901234568"
      },
      {
        "_id": "507f1f77bcf86cd799439019",
        "name": "Punkt 3",
        "phone": "+998901234569"
      }
    ],
    "punktRequests": [
      {
        "punktId": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Punkt 2",
          "phone": "+998901234568"
        },
        "status": "pending",
        "requestedAt": "2024-01-15T11:00:00.000Z",
        "respondedAt": null
      }
    ]
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid tumanIds or validation error
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region
- **404 Not Found** - Order not found OR no active punkts in specified tumans
- **500 Internal Server Error** - Server error

---

### 6. Get Punkt Requests

Get all requests sent to punkt's account (o'z punktiga kelgan so'rovlar).

**Endpoint:** `GET /api/punkt/requests`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

- `status` (optional) - Filter by request status: 'pending', 'accepted', 'rejected'
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Coca Cola 1.5L",
            "price": 15000
          },
          "quantity": 2
        }
      ],
      "totalPrice": 30000,
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Yunusobod tumani"
      },
      "punktRequests": [
        {
          "punktId": {
            "_id": "507f1f77bcf86cd799439018",
            "name": "Punkt 1",
            "phone": "+998901234567"
          },
          "status": "pending",
          "requestedAt": "2024-01-15T11:00:00.000Z",
          "respondedAt": null
        }
      ],
      "punktStatus": "requested",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 7. Respond to Request

Respond to a request sent to punkt (accept or reject).

**Endpoint:** `POST /api/punkt/requests/:orderId/respond`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `orderId` (required) - MongoDB ObjectId of the order

**Request Body:**

```json
{
  "response": "accepted"
}
```

**Validation Rules:**
- `response`: Required, must be 'accepted' or 'rejected'
- If 'accepted', the order will be confirmed by this punkt

**Status Changes:**
- **If accepted:** Order status: `pending` or `requested_to_contragent` → `confirmed_by_punkt`
- **If rejected:** Order status remains unchanged

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov qabul qilindi va buyurtma tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1",
      "phone": "+998901234567"
    },
    "punktStatus": "confirmed",
    "punktRequests": [
      {
        "punktId": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "Punkt 1"
        },
        "status": "accepted",
        "requestedAt": "2024-01-15T11:00:00.000Z",
        "respondedAt": "2024-01-15T11:30:00.000Z"
      }
    ],
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid response value OR request already responded
- **401 Unauthorized** - Token not provided or invalid
- **404 Not Found** - Order not found OR no request sent to this punkt
- **500 Internal Server Error** - Server error

---

### 8. Assign Order to Agent

Assign an order to an MFY agent for delivery. Only the punkt that confirmed the order can assign it to an agent.

**Endpoint:** `POST /api/punkt/orders/:id/assign-to-agent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Request Body:**

```json
{
  "agentId": "507f1f77bcf86cd799439020"
}
```

**Status Changes:**
- **Before:** `delivered_to_punkt` or `confirmed_by_punkt`
- **After:** `assigned_to_agent`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma agentga yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567"
    },
    "assignedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1",
      "phone": "+998901234568"
    },
    "assignedAt": "2024-01-15T12:00:00.000Z",
    "status": "assigned_to_agent"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Order already assigned to agent OR order not in correct status
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region OR punkt did not confirm this order
- **404 Not Found** - Order not found OR agent not found
- **500 Internal Server Error** - Server error

---

### 9. Get Order Contragent IDs

Get all contragent IDs from order products. This endpoint helps punkts identify which contragents they need to request products from.

**Endpoint:** `GET /api/punkt/orders/:id/contragents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
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
          "_id": "507f1f77bcf86cd799439014",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY-1"
        },
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Coca Cola 1.5L",
            "quantity": 2,
            "price": 15000
          }
        ],
        "hasRequest": false,
        "requestStatus": null,
        "requestedAt": null
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "name": "Contragent 2",
        "inn": "987654321",
        "phone": "+998901234568",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Ho'jaobod tumani",
          "type": "district",
          "code": "HOJ"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "MFY 2",
          "type": "mfy",
          "code": "MFY-2"
        },
        "status": "active",
        "isInRegion": false,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439018",
            "name": "Pepsi 1.5L",
            "quantity": 1,
            "price": 14000
          }
        ],
        "hasRequest": true,
        "requestStatus": "pending",
        "requestedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**
- `contragents`: Array of contragent objects with their details
  - `_id`: Contragent ID (use this for requesting via `POST /api/punkt/orders/:id/request-to-contragent`)
  - `name`: Contragent name
  - `inn`: Contragent INN
  - `phone`: Contragent phone
  - `viloyat`, `tuman`, `mfy`: Contragent regions
  - `status`: Contragent status
  - `isInRegion`: Boolean indicating if contragent is in punkt's region
  - `products`: Array of products from this contragent in the order
    - `_id`: Product ID
    - `name`: Product name
    - `quantity`: Quantity in order
    - `price`: Product price
  - `hasRequest`: Boolean indicating if request already sent to this contragent
  - `requestStatus`: Status of existing request ('pending', 'accepted', 'rejected', 'delivered_to_punkt', or null)
  - `requestedAt`: Date when request was sent (if exists)

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

**Note:** This endpoint returns all unique contragents that have products in the order. Use the `_id` field from each contragent to send requests via the `POST /api/punkt/orders/:id/request-to-contragent` endpoint.

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "error": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Access denied
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Login and Get Orders

**Step 1: Login**

```bash
curl -X POST http://localhost:5000/api/punkts/login \
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
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567"
    }
  }
}
```

**Step 2: Get Orders**

```bash
curl -X GET "http://localhost:5000/api/punkt/orders?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Confirm Order

```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/confirm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Request to Punkts

```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/request-to-punkts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "tumanIds": [
      "507f1f77bcf86cd799439016",
      "507f1f77bcf86cd799439017"
    ]
  }'
```

### Example 4: Respond to Request

```bash
curl -X POST http://localhost:5000/api/punkt/requests/507f1f77bcf86cd799439011/respond \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "response": "accepted"
  }'
```

### Example 5: Assign Order to Agent

```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/assign-to-agent \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "507f1f77bcf86cd799439020"
  }'
```

### Example 6: Get Order Contragent IDs

```bash
curl -X GET http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/contragents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
        "isInRegion": true,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Coca Cola 1.5L",
            "quantity": 2,
            "price": 15000
          }
        ],
        "hasRequest": false,
        "requestStatus": null
      }
    ]
  }
}
```

---

## Additional Endpoints

### Request to Contragent

Send order request to a contragent. **Important:** This endpoint automatically filters and sends request only for products that belong to the selected contragent. If an order contains products from multiple contragents, you need to send separate requests to each contragent for their respective products.

**Endpoint:** `POST /api/punkt/orders/:id/request-to-contragent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "contragentId": "507f1f77bcf86cd799439020"
}
```

**Validation Rules:**
- `contragentId`: Required, must be a valid MongoDB ObjectId
- The contragent must have at least one product in the order
- The contragent must be active
- The contragent must not already have a pending request for this order

**Status Changes:**
- **Before:** `pending` or `confirmed_by_punkt`
- **After:** `requested_to_contragent`

**How It Works:**
1. The system automatically identifies which items in the order belong to the selected contragent
2. Only those items are included in the request sent to the contragent
3. The `itemIds` array in `contragentRequests` contains the indices of items requested from this contragent
4. When the contragent views the order, they will only see their own products

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Contragent 1",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Contragent 1",
          "inn": "123456789",
          "phone": "+998901234567"
        },
        "itemIds": [0, 2],
        "status": "pending",
        "requestedAt": "2024-01-15T10:00:00.000Z",
        "respondedAt": null,
        "deliveredToPunktAt": null
      }
    ]
  }
}
```

**Response Fields:**
- `contragent`: The contragent object that received the request
- `contragentRequests`: Array of contragent requests (includes the newly created request)
  - `contragentId`: Reference to the contragent
  - `itemIds`: Array of item indices (0-based) that belong to this contragent and are included in the request
  - `status`: Request status ('pending', 'accepted', 'rejected', 'delivered_to_punkt')
  - `requestedAt`: Date when request was sent
  - `respondedAt`: Date when contragent responded (null if pending)
  - `deliveredToPunktAt`: Date when contragent delivered to punkt (null if not delivered)

**Error Responses:**

- **400 Bad Request** - Contragent ID not provided OR contragent has no products in this order OR contragent already has a request for this order OR contragent is inactive
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region
- **404 Not Found** - Order not found OR contragent not found
- **500 Internal Server Error** - Server error

**Example Scenario:**

If an order has 3 items:
- Item 0: Product from Contragent A
- Item 1: Product from Contragent B
- Item 2: Product from Contragent A

When you send a request to Contragent A:
- Only items 0 and 2 will be included in the request
- `itemIds` will be `[0, 2]`
- Contragent A will only see items 0 and 2 when viewing the order

You need to send a separate request to Contragent B for item 1.

---

### Request to Another Punkt

Send order request to another punkt.

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "toPunktId": "507f1f77bcf86cd799439021"
}
```

**Status Changes:**
- Order status remains unchanged (stays `pending` or `requested_to_contragent`)
- Punkt-to-punkt request is created with status `pending`

---

### Receive from Punkt

Receive order from another punkt.

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Status Changes:**
- **Before:** Any status (order must have accepted punkt-to-punkt request)
- **After:** `delivered_to_punkt` (if not already `assigned_to_agent`, `confirmed_by_agent`, or `confirmed_by_customer`)
- Punkt-to-punkt request status: `accepted` → `delivered`

---

### Receive from Contragent

Receive order from contragent.

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-contragent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Status Changes:**
- **Before:** `accepted_by_contragent` or `requested_to_contragent`
- **After:** `delivered_to_punkt` (if not already set)
- Contragent request status: `accepted` → `delivered_to_punkt`

---

### Get Punkt to Punkt Requests

Get incoming requests from other punkts.

**Endpoint:** `GET /api/punkt/punkt-requests`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by status: 'pending', 'accepted', 'rejected', 'delivered'
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

---

### Respond to Punkt to Punkt Request

Accept or reject request from another punkt.

**Endpoint:** `POST /api/punkt/punkt-requests/:orderId/respond`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "response": "accepted" // or "rejected"
}
```

**Status Changes:**
- **If accepted:** Order status: `pending` or `requested_to_contragent` → `confirmed_by_punkt`
- **If rejected:** Order status remains unchanged
- Punkt-to-punkt request status: `pending` → `accepted` or `rejected`

---

### 9. Get Order Contragent IDs

Get all contragent IDs from order products. This endpoint helps punkts identify which contragents they need to request products from.

**Endpoint:** `GET /api/punkt/orders/:id/contragents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Contragent 1",
        "inn": "123456789",
        "phone": "+998901234567",
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
          "_id": "507f1f77bcf86cd799439014",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY-1"
        },
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Coca Cola 1.5L",
            "quantity": 2,
            "price": 15000
          }
        ],
        "hasRequest": false,
        "requestStatus": null,
        "requestedAt": null
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "name": "Contragent 2",
        "inn": "987654321",
        "phone": "+998901234568",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Ho'jaobod tumani",
          "type": "district",
          "code": "HOJ"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "MFY 2",
          "type": "mfy",
          "code": "MFY-2"
        },
        "status": "active",
        "isInRegion": false,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439018",
            "name": "Pepsi 1.5L",
            "quantity": 1,
            "price": 14000
          }
        ],
        "hasRequest": true,
        "requestStatus": "pending",
        "requestedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**
- `contragents`: Array of contragent objects with their details
  - `_id`: Contragent ID (use this for requesting)
  - `name`: Contragent name
  - `inn`: Contragent INN
  - `phone`: Contragent phone
  - `viloyat`, `tuman`, `mfy`: Contragent regions
  - `status`: Contragent status
  - `isInRegion`: Boolean indicating if contragent is in punkt's region
  - `products`: Array of products from this contragent in the order
  - `hasRequest`: Boolean indicating if request already sent to this contragent
  - `requestStatus`: Status of existing request ('pending', 'accepted', 'rejected', 'delivered_to_punkt', or null)
  - `requestedAt`: Date when request was sent (if exists)

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Order does not belong to punkt's region
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

## Notes

1. **Region Filtering**: Punkts can only see orders in their viloyat and tuman (if tuman is specified).

2. **Order Confirmation**: A punkt can confirm an order only if:
   - The order's delivery region matches punkt's viloyat and tuman
   - At least one product's delivery region includes punkt's tuman MFY, OR
   - The order's deliveryMfy is in punkt's tuman

3. **Request to Punkts**: If a punkt cannot directly confirm an order, they can request other punkts in specified tumans (within the same viloyat) to handle the order.

4. **Request Response**: When a punkt receives a request, they can accept or reject it. If accepted, the order is automatically confirmed by that punkt.

5. **Request to Contragent - Multiple Contragents Support**: 
   - **Important:** When an order contains products from multiple contragents, you must send separate requests to each contragent
   - The system automatically filters and sends requests only for products that belong to the selected contragent
   - Each `contragentRequest` includes an `itemIds` array containing the indices (0-based) of items requested from that contragent
   - When a contragent views the order, they will only see their own products (filtered by `itemIds`)
   - Example: If an order has items [0, 1, 2] where item 0 and 2 belong to Contragent A, and item 1 belongs to Contragent B:
     - Request to Contragent A will have `itemIds: [0, 2]`
     - Request to Contragent B will have `itemIds: [1]`
     - Contragent A will only see items 0 and 2
     - Contragent B will only see item 1

6. **KPI Bonus**: The `kpiBonusPercent` field is automatically removed from product objects in responses for security/privacy reasons.

7. **Pagination**: All list endpoints support pagination with `page` and `limit` query parameters.

8. **Agent Assignment**: After confirming an order, a punkt can assign it to an agent. Only the punkt that confirmed the order can assign it to an agent. Each order can only be assigned to one agent.
   - **Status Change:** `delivered_to_punkt` or `confirmed_by_punkt` → `assigned_to_agent`

9. **Status Tracking**: All status changes are automatically tracked and reflected in the order object. Each action updates the order status to reflect the current stage of the delivery process:
   - **Punkt confirms:** `pending` → `confirmed_by_punkt`
   - **Punkt requests to contragent:** `pending` or `confirmed_by_punkt` → `requested_to_contragent`
   - **Contragent accepts:** `requested_to_contragent` → `accepted_by_contragent`
   - **Contragent delivers:** `accepted_by_contragent` → `delivered_to_punkt`
   - **Punkt receives from punkt (accepted):** `pending` or `requested_to_contragent` → `confirmed_by_punkt`
   - **Punkt receives from punkt (delivered):** → `delivered_to_punkt` (if not already advanced)
   - **Punkt assigns to agent:** `delivered_to_punkt` or `confirmed_by_punkt` → `assigned_to_agent`
   - **Agent confirms:** `assigned_to_agent` → `confirmed_by_agent`
   - **Customer confirms:** `confirmed_by_agent` → `confirmed_by_customer`

