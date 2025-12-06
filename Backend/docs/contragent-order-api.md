# Contragent Order API Documentation

## Overview

Contragent Order API provides endpoints for contragents to manage order requests from punkts. Contragents can view requests, accept/reject them, and deliver orders to punkts.

**Base Path:** `/api/contragent`

---

## Endpoints

### 1. Get Orders for Contragent

Get all order requests sent to this contragent.

**Endpoint:** `GET /api/contragent/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by request status: 'pending', 'accepted', 'rejected', 'delivered_to_punkt'
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

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
      "contragentRequests": [
        {
          "contragentId": {
            "_id": "507f1f77bcf86cd799439020",
            "name": "Contragent 1",
            "inn": "123456789"
          },
          "status": "pending",
          "requestedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "currentPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1"
      }
    }
  ]
}
```

---

### 2. Get Order by ID

Get a specific order request by ID.

**Endpoint:** `GET /api/contragent/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

---

### 3. Respond to Order Request

Accept or reject an order request.

**Endpoint:** `POST /api/contragent/orders/:orderId/respond`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**

```json
{
  "response": "accepted" // or "rejected"
}
```

**Status Changes:**
- **If accepted:** Order status: `requested_to_contragent` → `accepted_by_contragent`
- **If rejected:** Order status remains `requested_to_contragent`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "contragentRequests": [
      {
        "status": "accepted",
        "respondedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Deliver Order to Punkt

Mark order as delivered to punkt.

**Endpoint:** `POST /api/contragent/orders/:orderId/deliver-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Status Changes:**
- **Before:** `accepted_by_contragent` or `requested_to_contragent`
- **After:** `delivered_to_punkt`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli punktga yetkazildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "contragentRequests": [
      {
        "status": "delivered_to_punkt",
        "deliveredToPunktAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Status Flow

### Contragent Request Status Flow

1. **pending** - Request sent by punkt, waiting for contragent response
2. **accepted** - Contragent accepted the request
3. **rejected** - Contragent rejected the request
4. **delivered_to_punkt** - Contragent delivered order to punkt

### Order Status Changes

**When Contragent Responds to Request:**
- **Accept:** Order status changes from `requested_to_contragent` → `accepted_by_contragent`
- **Reject:** Order status remains `requested_to_contragent`

**When Contragent Delivers to Punkt:**
- Order status changes from `accepted_by_contragent` or `requested_to_contragent` → `delivered_to_punkt`


