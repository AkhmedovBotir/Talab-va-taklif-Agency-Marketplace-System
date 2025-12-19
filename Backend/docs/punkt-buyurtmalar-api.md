# Punkt Buyurtmalar API Documentation

## Overview

Punkt Buyurtmalar API provides endpoints for punkt users to manage orders in their region. Punkts act as central hubs for order management, coordinating between customers, contragents, other punkts, and agents.

**Base Path:** `/api/punkt`

**Important:** Punkt is the central hub. All order coordination happens through punkt. No automatic routing - everything follows a linear sequence.

---

## Authentication

All endpoints require authentication using JWT token from Punkt login.

**Format:** `Authorization: Bearer <token>`

---

## Order Workflow for Punkt

### Linear Flow (Ketma-ketlik)

1. **Order created** → Automatically assigned to punkt in customer district
2. **Punkt confirms order** → Status: `confirmed_by_punkt`
3. **Punkt requests from contragents** → Status: `requested_to_contragent`
   - OR **Punkt requests from other punkts** → Punkt-to-punkt request
4. **Contragents/punkts respond** → Status: `accepted_by_contragent` or punkt request accepted
5. **Products delivered to punkt** → Status: `delivered_to_punkt`
6. **Punkt assigns to agent** → Status: `assigned_to_agent`
7. **Agent confirms delivery** → Status: `confirmed_by_agent`
8. **Customer confirms receipt** → Status: `confirmed_by_customer`

**Note:** All operations are manual and sequential. No automatic routing.

---

## Endpoints

### 1. Get My Orders

Get all orders visible to this punkt (orders in punkt's region or orders where punkt is involved).

**Endpoint:** `GET /api/punkt/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `paymentStatus` (optional) - Filter by payment status
- `paymentMethod` (optional) - Filter by payment method
- `orderNumber` (optional) - Search by order number
- `startDate` (optional) - Filter by start date (ISO 8601)
- `endDate` (optional) - Filter by end date (ISO 8601)
- `minTotalPrice` (optional) - Filter by minimum total price
- `maxTotalPrice` (optional) - Filter by maximum total price
- `search` (optional) - Search by order number or phone number
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 20,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "00001",
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Product 1",
            "price": 10000,
            "contragent": {
              "_id": "507f1f77bcf86cd799439020",
              "name": "Contragent 1"
            }
          },
          "quantity": 2,
          "price": 10000
        }
      ],
      "totalPrice": 20000,
      "status": "pending",
      "currentPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1"
      },
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Chirchiq tumani",
        "type": "district"
      },
      "contragentRequests": [],
      "punktToPunktRequests": [],
      "createdAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Order by ID

Get a specific order by ID.

**Endpoint:** `GET /api/punkt/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Success Response (200 OK):**

Returns full order details with all populated fields.

---

### 3. Confirm Order

Confirm an order. This makes the punkt the current punkt for this order.

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:** None

**Status Changes:**
- Order status: `pending` → `confirmed_by_punkt`
- `punktStatus`: `pending` → `confirmed`
- `confirmedByPunkt`: Set to this punkt
- `currentPunkt`: Set to this punkt

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1"
    },
    "currentPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Order already confirmed
- **403 Forbidden:** Order not in punkt's region or products don't match delivery regions

**Note:** After confirming, punkt must manually request from contragents or other punkts. No automatic routing.

---

### 4. Request to Contragent

Send a request to a contragent for specific items in the order.

**Endpoint:** `POST /api/punkt/orders/:id/request-to-contragent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:**

```json
{
  "contragentId": "507f1f77bcf86cd799439020"
}
```

**Status Changes:**
- Adds entry to `contragentRequests` array with status: `pending`
- Order status: `pending` or `confirmed_by_punkt` → `requested_to_contragent`
- `currentPunkt`: Set to this punkt

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
      "name": "Contragent 1"
    },
    "contragentRequests": [
      {
        "contragentId": "507f1f77bcf86cd799439020",
        "itemIds": [0, 1],
        "status": "pending",
        "requestedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Note:** The system automatically determines which items belong to this contragent based on product ownership.

---

### 5. Request to Another Punkt

Send a request to another punkt (for orders that need products from other districts).

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:**

```json
{
  "toPunktId": "507f1f77bcf86cd799439019"
}
```

**Status Changes:**
- Adds entry to `punktToPunktRequests` array with status: `pending`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "toPunkt": {
      "_id": "507f1f77bcf86cd799439019",
      "name": "Punkt 2"
    },
    "punktToPunktRequests": [
      {
        "fromPunktId": "507f1f77bcf86cd799439018",
        "toPunktId": "507f1f77bcf86cd799439019",
        "status": "pending",
        "requestedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 6. Get Punkt-to-Punkt Requests

Get requests sent to this punkt from other punkts.

**Endpoint:** `GET /api/punkt/punkt-to-punkt-requests`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by request status: `pending`, `accepted`, `rejected`, `delivered`
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

Returns orders with punkt-to-punkt requests where this punkt is the recipient.

---

### 7. Respond to Punkt-to-Punkt Request

Accept or reject a request from another punkt.

**Endpoint:** `POST /api/punkt/punkt-to-punkt-requests/:orderId/respond`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `orderId` (required) - Order ID

**Request Body:**

```json
{
  "response": "accepted"  // or "rejected"
}
```

**Status Changes (if accepted):**
- Request status: `pending` → `accepted`
- `currentPunkt`: Set to this punkt
- `confirmedByPunkt`: Set to this punkt
- `punktStatus`: `pending` → `confirmed`
- Order status: `pending` or `requested_to_contragent` → `confirmed_by_punkt`

**Note:** After accepting, this punkt becomes the current punkt and should request from contragents in its district.

---

### 8. Receive from Punkt

Mark that order has been physically received from another punkt.

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:** None

**Status Changes:**
- Request status: `accepted` → `delivered`
- `currentPunkt`: Set to this punkt
- Order status: → `delivered_to_punkt`

**Note:** This should be called when the order is physically received from the sending punkt.

---

### 9. Receive from Contragent

Mark that order has been physically received from a contragent.

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-contragent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:** None

**Status Changes:**
- `currentPunkt`: Set to this punkt
- Order status: → `delivered_to_punkt`

**Note:** This should be called when the order is physically received from the contragent.

---

### 10. Send to Another Punkt

Send order to another punkt (used when receiving from contragent in different district and need to send to customer's district).

**Endpoint:** `POST /api/punkt/orders/:id/send-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:**

```json
{
  "toPunktId": "507f1f77bcf86cd799439018"
}
```

**Status Changes:**
- Adds or updates entry in `punktToPunktRequests` with status: `delivered`
- `currentPunkt`: Set to `toPunktId`
- Order status: → `delivered_to_punkt`

**Note:** Only the current punkt can send orders to other punkts.

---

### 11. Assign Order to Agent

Assign order to an MFY agent for final delivery to customer.

**Endpoint:** `POST /api/punkt/orders/:id/assign-to-agent`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Request Body:**

```json
{
  "agentId": "507f1f77bcf86cd799439025"
}
```

**Status Changes:**
- `assignedToAgent`: Set to agent ID
- `assignedByPunkt`: Set to this punkt
- `assignedAt`: Set to current timestamp
- Order status: `delivered_to_punkt` or `confirmed_by_punkt` → `assigned_to_agent`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli agentga yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439025",
      "name": "Agent 1"
    },
    "assignedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1"
    },
    "assignedAt": "2024-01-15T15:00:00.000Z",
    "status": "assigned_to_agent"
  }
}
```

---

### 12. Get Order Contragent IDs

Get list of contragent IDs for products in an order (useful for determining which contragents to request from).

**Endpoint:** `GET /api/punkt/orders/:id/contragent-ids`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "contragentIds": [
      {
        "contragentId": "507f1f77bcf86cd799439020",
        "contragentName": "Contragent 1",
        "itemIndices": [0, 1],
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Chirchiq tumani"
        }
      }
    ]
  }
}
```

---

## Order Status Flow

```
pending (Order created, assigned to punkt)
    ↓
confirmed_by_punkt (Punkt confirms)
    ↓
requested_to_contragent (Punkt requests from contragents)
    ↓
accepted_by_contragent (Contragents accept)
    ↓
delivered_to_punkt (Contragents deliver to punkt)
    ↓
assigned_to_agent (Punkt assigns to agent)
    ↓
confirmed_by_agent (Agent confirms delivery)
    ↓
confirmed_by_customer (Customer confirms receipt)
```

---

## Punkt-to-Punkt Request Status Flow

```
pending (Request sent)
    ↓
accepted (Recipient punkt accepts)
    ↓
delivered (Order physically delivered)
```

---

## Workflow Scenarios

### Scenario 1: Single Order, Single Product from Contractor in Same District

1. **Customer creates order** → Order automatically assigned to punkt in customer district (Punkt A)
2. **Punkt A confirms order** → `POST /api/punkt/orders/:id/confirm`
3. **Punkt A requests from contragent** → `POST /api/punkt/orders/:id/request-to-contragent`
4. Contragent accepts and delivers
5. **Punkt A receives from contragent** → `POST /api/punkt/orders/:id/receive-from-contragent`
6. **Punkt A assigns to agent** → `POST /api/punkt/orders/:id/assign-to-agent`
7. Agent delivers to customer

### Scenario 2: Single Order, Multiple Products from Multiple Contractors in Same District

1. **Customer creates order** → Order automatically assigned to punkt in customer district (Punkt A)
2. **Punkt A confirms order** → `POST /api/punkt/orders/:id/confirm`
3. **Punkt A requests from multiple contragents** → Multiple calls to `POST /api/punkt/orders/:id/request-to-contragent`
4. Each contragent accepts and delivers
5. **Punkt A receives from all contragents** → `POST /api/punkt/orders/:id/receive-from-contragent` (when all delivered)
6. **Punkt A assigns to agent** → `POST /api/punkt/orders/:id/assign-to-agent`
7. Agent delivers to customer

### Scenario 3: Single Order, Product from Contractor in Different District

1. **Customer creates order** → Order automatically assigned to punkt in customer district (Punkt A)
2. **Punkt A confirms order** → `POST /api/punkt/orders/:id/confirm`
3. **Punkt A requests from punkt in contractor district** → `POST /api/punkt/orders/:id/request-to-punkt` (to Punkt B)
4. **Punkt B accepts request** → `POST /api/punkt/punkt-to-punkt-requests/:orderId/respond` (accepted)
5. **Punkt B requests from contragent** → `POST /api/punkt/orders/:id/request-to-contragent`
6. Contragent accepts and delivers to Punkt B
7. **Punkt B receives from contragent** → `POST /api/punkt/orders/:id/receive-from-contragent`
8. **Punkt B sends to Punkt A** → `POST /api/punkt/orders/:id/send-to-punkt`
9. **Punkt A receives from Punkt B** → `POST /api/punkt/orders/:id/receive-from-punkt`
10. **Punkt A assigns to agent** → `POST /api/punkt/orders/:id/assign-to-agent`
11. Agent delivers to customer

---

## Important Notes

1. **No Automatic Routing:** All operations are manual and sequential. Punkt must explicitly request from contragents or other punkts.

2. **Current Punkt:** The `currentPunkt` field indicates which punkt is currently managing the order. Only the current punkt can perform certain operations.

3. **Linear Sequence:** All operations follow a strict linear sequence. No parallel automatic operations.

4. **District Scope:** Punkts work with orders in their region. When requesting from other districts, they use punkt-to-punkt requests.

5. **Central Hub:** Punkt is the central coordination point. All logistics flow through punkt.

6. **Agent Assignment:** Only after all products are received at punkt can the order be assigned to an agent for final delivery.

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input, business logic error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (access denied, order not in region)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error



