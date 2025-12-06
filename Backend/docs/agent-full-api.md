# Agent Full API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Agent Roles](#agent-roles)
- [Order Workflow](#order-workflow)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Login](#1-login)
  - [Get My Orders](#2-get-my-orders)
  - [Get Order by ID](#3-get-order-by-id)
  - [Confirm Order by Agent](#4-confirm-order-by-agent)
  - [Mark Order as Delivered](#5-mark-order-as-delivered)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Agent Full API provides comprehensive endpoints for agents to manage orders based on their role (viloyat, tuman, or MFY). Each agent type has different access levels and permissions for viewing and managing orders.

**Base Path:** `/api/agent`

---

## Base URL

```
http://localhost:5000/api/agent
```

---

## Authentication

All endpoints (except login) require authentication using JWT token from Agent login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required for:**
- Getting orders
- Getting order by ID
- Confirming orders

**Not required for:**
- Login (uses `/api/agents/login`)

---

## Agent Roles

Agents have three types based on their region assignment:

1. **Viloyat Agent** (`role: 'viloyat'`)
   - Can view all orders in their viloyat
   - Can monitor all punkts, tuman agents, and MFY agents in their viloyat
   - Has full visibility into order flow within their region

2. **Tuman Agent** (`role: 'tuman'`)
   - Can view orders in their tuman
   - Can view orders assigned to agents in their tuman
   - Can monitor all agents and punkts in their tuman
   - Has visibility into order flow within their district

3. **MFY Agent** (`role: 'mfy'`)
   - Can only view orders assigned to them
   - Can confirm orders by visiting the customer (mijozga borib tasdiqlash)
   - Has direct interaction with customers

---

## Order Workflow

The complete order workflow from customer order to delivery confirmation with status changes:

1. **Customer Places Order** (Marketplace)
   - Customer creates order via marketplace
   - **Order status:** `pending` → `pending`
   - Order visible to admin, punkt, and agents in the region

2. **Punkt Reviews Order**
   - Punkt sees orders in their region
   - Punkt can:
     - Confirm order if products available in their region's contragents
     - Request products from contragents
     - Request order from other punkts if products not available locally

3. **Punkt Confirms Order**
   - Punkt confirms order directly
   - **Order status:** `pending` → `confirmed_by_punkt`

4. **Punkt Requests to Contragent**
   - Punkt sends request to contragent for products
   - **Order status:** `pending` or `confirmed_by_punkt` → `requested_to_contragent`

5. **Contragent Processing**
   - Contragent receives request from punkt
   - Contragent accepts: **Order status:** `requested_to_contragent` → `accepted_by_contragent`
   - Contragent rejects: Status remains `requested_to_contragent`
   - Contragent delivers to punkt: **Order status:** `accepted_by_contragent` → `delivered_to_punkt`

6. **Punkt to Punkt Transfer** (if needed)
   - If products from different tumans, punkt requests from other punkts
   - Receiving punkt accepts: **Order status:** `pending` or `requested_to_contragent` → `confirmed_by_punkt`
   - Receiving punkt receives order: **Order status:** → `delivered_to_punkt` (if not already)

7. **Punkt Assigns to Agent**
   - Punkt assigns order to MFY agent
   - Agent receives notification
   - **Order status:** `delivered_to_punkt` or `confirmed_by_punkt` → `assigned_to_agent`

8. **Agent Confirms Delivery**
   - MFY agent visits customer
   - Agent confirms order delivery
   - **Order status:** `assigned_to_agent` → `confirmed_by_agent`
   - `agentConfirmedAt` timestamp recorded

9. **Agent Marks as Delivered**
   - MFY agent marks order as delivered
   - **Order status:** Remains `confirmed_by_agent`
   - `deliveredAt` timestamp recorded

10. **Customer Confirms Receipt**
    - Customer confirms they received the order
    - **Order status:** `confirmed_by_agent` → `confirmed_by_customer`
    - `customerConfirmed` set to `true`
    - `customerConfirmedAt` timestamp recorded

---

## Data Models

### Order Object (Full)

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
  "punktRequests": "array of punkt requests",
  "confirmedByPunkt": "object | null (reference to Punkt)",
  "punktStatus": "string (enum: 'pending' | 'confirmed' | 'rejected' | 'requested')",
  "assignedToAgent": "object | null (reference to Agent)",
  "assignedByPunkt": "object | null (reference to Punkt)",
  "assignedAt": "string | null (ISO 8601 date)",
  "confirmedByAgent": "object | null (reference to Agent)",
  "agentConfirmedAt": "string | null (ISO 8601 date)",
  "deliveredAt": "string | null (ISO 8601 date)",
  "contragentRequests": "array of contragent requests",
  "punktToPunktRequests": "array of punkt to punkt requests",
  "customerConfirmed": "boolean",
  "customerConfirmedAt": "string | null (ISO 8601 date)",
  "currentPunkt": "object | null (reference to Punkt)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Contragent Request Object

```json
{
  "contragentId": "object (reference to Contragent)",
  "status": "string (enum: 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt')",
  "requestedAt": "string (ISO 8601 date)",
  "respondedAt": "string | null (ISO 8601 date)",
  "deliveredToPunktAt": "string | null (ISO 8601 date)"
}
```

### Punkt to Punkt Request Object

```json
{
  "fromPunktId": "object (reference to Punkt)",
  "toPunktId": "object (reference to Punkt)",
  "status": "string (enum: 'pending' | 'accepted' | 'rejected' | 'delivered')",
  "requestedAt": "string (ISO 8601 date)",
  "respondedAt": "string | null (ISO 8601 date)",
  "deliveredAt": "string | null (ISO 8601 date)"
}
```

---

## Endpoints

### 1. Login

Login to agent account using phone number and password. All agent types use the same login endpoint.

**Endpoint:** `POST /api/agents/login`

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
    "role": "mfy",
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Agent 1",
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
      "agentType": "mfy",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Response Fields:**
- `role`: Agent role ('viloyat', 'tuman', or 'mfy')
- `agent`: Agent object with all details including `agentType`

**Error Responses:**

- **401 Unauthorized** - Invalid phone or password
- **403 Forbidden** - Account is inactive

---

### 2. Get My Orders

Get orders based on agent's role and region assignment.

**Endpoint:** `GET /api/agent/orders`

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

**Access Rules:**

- **MFY Agent**: Only orders assigned to this agent (`assignedToAgent = agent._id`)
- **Tuman Agent**: Orders in tuman (`deliveryTuman = agent.tuman`) OR orders assigned to agents in tuman
- **Viloyat Agent**: All orders in viloyat (`deliveryViloyat = agent.viloyat`)

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
      "confirmedByAgent": null,
      "agentConfirmedAt": null,
      "customerConfirmed": false,
      "customerConfirmedAt": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token not provided or invalid
- **500 Internal Server Error** - Server error

---

### 3. Get Order by ID

Get a specific order by its ID. Access is based on agent's role.

**Endpoint:** `GET /api/agent/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Access Rules:**

- **MFY Agent**: Can only access orders assigned to them
- **Tuman Agent**: Can access orders in their tuman or assigned to agents in their tuman
- **Viloyat Agent**: Can access orders in their viloyat

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
          "price": 15000
        },
        "quantity": 2
      }
    ],
    "totalPrice": 30000,
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567"
    },
    "confirmedByAgent": null,
    "customerConfirmed": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Agent does not have access to this order
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

### 4. Confirm Order by Agent

Confirm an order by visiting the customer. Only MFY agents can confirm orders.

**Endpoint:** `POST /api/agent/orders/:id/confirm`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Access Rules:**

- Only **MFY agents** can confirm orders
- Order must be assigned to the agent
- Order must not be already confirmed by an agent

**Status Change:**
- **Before:** `assigned_to_agent`
- **After:** `confirmed_by_agent`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "confirmedByAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "MFY 1"
      }
    },
    "agentConfirmedAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Order already confirmed by agent
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Only MFY agents can confirm orders OR order not assigned to this agent
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

---

### 5. Mark Order as Delivered

Mark an order as delivered to the customer. Only MFY agents can mark orders as delivered. The order must be confirmed by the agent first.

**Endpoint:** `POST /api/agent/orders/:id/delivered`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Access Rules:**

- Only **MFY agents** can mark orders as delivered
- Order must be assigned to the agent
- Order must be confirmed by the agent first (`confirmedByAgent` must be set)
- Order must not be already marked as delivered

**Status Change:**
- **Before:** `confirmed_by_agent`
- **After:** `confirmed_by_agent` (status remains the same, only `deliveredAt` timestamp is set)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma yetkazilgan deb belgilandi",
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
          "price": 15000
        },
        "quantity": 2
      }
    ],
    "totalPrice": 30000,
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567"
    },
    "confirmedByAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567"
    },
    "agentConfirmedAt": "2024-01-15T12:00:00.000Z",
    "deliveredAt": "2024-01-15T12:30:00.000Z",
    "customerConfirmed": false,
    "status": "confirmed_by_agent",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

**Response Fields:**
- `deliveredAt`: Timestamp when the order was marked as delivered

**Error Responses:**

- **400 Bad Request** - Order not confirmed by agent yet OR order already marked as delivered
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Only MFY agents can mark orders as delivered OR order not assigned to this agent
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

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
curl -X POST http://localhost:5000/api/agents/login \
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
    "role": "mfy",
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Agent 1",
      "phone": "+998901234567",
      "agentType": "mfy"
    }
  }
}
```

**Step 2: Get Orders**

```bash
curl -X GET "http://localhost:5000/api/agent/orders?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Confirm Order (MFY Agent)

```bash
curl -X POST http://localhost:5000/api/agent/orders/507f1f77bcf86cd799439011/confirm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "confirmedByAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent 1",
      "phone": "+998901234567"
    },
    "agentConfirmedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Example 3: Mark Order as Delivered (MFY Agent)

```bash
curl -X POST http://localhost:5000/api/agent/orders/507f1f77bcf86cd799439011/delivered \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Buyurtma yetkazilgan deb belgilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "deliveredAt": "2024-01-15T12:30:00.000Z"
  }
}
```

---

## Notes

1. **Agent Roles**: Agents have three roles based on their region assignment:
   - `viloyat` - Viloyat-level agents
   - `tuman` - Tuman-level agents
   - `mfy` - MFY-level agents

2. **Access Control**: Each agent type has different access levels:
   - **MFY Agent**: Only orders assigned to them
   - **Tuman Agent**: Orders in tuman + orders assigned to tuman agents
   - **Viloyat Agent**: All orders in viloyat

3. **Order Confirmation**: Only MFY agents can confirm orders by visiting customers. This is done after the order is assigned to them by a punkt.

4. **Order Delivery**: After confirming an order, MFY agents can mark it as delivered. The order must be confirmed first before it can be marked as delivered.

5. **KPI Bonus**: The `kpiBonusPercent` field is automatically removed from product objects in responses for security/privacy reasons.

5. **Pagination**: All list endpoints support pagination with `page` and `limit` query parameters.

6. **Login Response**: The login response includes a `role` field indicating the agent's role (viloyat, tuman, or mfy).

7. **Order Assignment**: Orders are assigned to agents by punkts. Only assigned orders can be confirmed by MFY agents.

8. **Order Status Flow**: 
   - `pending` → `confirmed_by_punkt` → `requested_to_contragent` → `accepted_by_contragent` → `delivered_to_punkt` → `assigned_to_agent` → `confirmed_by_agent` → `confirmed_by_customer`
   - Orders can be `cancelled` at any time before delivery
   - Status changes are automatic based on actions performed

9. **Order Delivery Workflow**:
   - Agent confirms order (`/orders/:id/confirm`) - **Status:** `assigned_to_agent` → `confirmed_by_agent`, Sets `confirmedByAgent` and `agentConfirmedAt`
   - Agent marks as delivered (`/orders/:id/delivered`) - **Status:** Remains `confirmed_by_agent`, Sets `deliveredAt` timestamp
   - Customer confirms receipt (via marketplace API) - **Status:** `confirmed_by_agent` → `confirmed_by_customer`, Sets `customerConfirmed` and `customerConfirmedAt`

10. **Customer Confirmation**: After agent marks order as delivered, customer must confirm receipt to complete the order.

11. **Status Tracking**: All status changes are automatically tracked and reflected in the order object. Each action updates the order status to reflect the current stage of the delivery process.


