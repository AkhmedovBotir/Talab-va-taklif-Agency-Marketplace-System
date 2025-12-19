# Contragent Buyurtmalar API Documentation

## Overview

Contragent Buyurtmalar API provides endpoints for contragents to manage order requests from punkts. Contragents receive requests from punkts, can accept or reject them, and deliver products to their local punkt.

**Base Path:** `/api/contragent`

**Important:** Contragents only work with orders in their own district. They cannot directly interact with orders from other districts.

---

## Authentication

All endpoints require authentication using JWT token from Contragent login.

**Format:** `Authorization: Bearer <token>`

---

## Order Workflow for Contragent

### Linear Flow (Ketma-ketlik)

1. **Punkt sends request** → Contragent receives request (status: `pending`)
2. **Contragent responds** → Accept (`accepted`) or Reject (`rejected`)
3. **Contragent prepares product** → Product is ready
4. **Contragent delivers to punkt** → Status: `delivered_to_punkt`

**Note:** Contragent only deals with products in their own district. If order needs products from other districts, punkt handles inter-district logistics.

---

## Endpoints

### 1. Get Orders for Contragent

Get all order requests sent to this contragent.

**Endpoint:** `GET /api/contragent/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by request status: `pending`, `accepted`, `rejected`, `delivered_to_punkt`
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
      "contragentRequests": [
        {
          "_id": "507f1f77bcf86cd799439030",
          "contragentId": {
            "_id": "507f1f77bcf86cd799439020",
            "name": "Contragent 1",
            "inn": "123456789",
            "phone": "+998901234567"
          },
          "itemIds": [0],
          "status": "pending",
          "requestedAt": "2024-01-15T10:00:00.000Z",
          "respondedAt": null,
          "deliveredToPunktAt": null
        }
      ],
      "currentPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1",
        "phone": "+998901234568"
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
      "status": "requested_to_contragent",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** Only items requested from this contragent are shown in the response. The `itemIds` array contains the indices of items in the original order.

---

### 2. Get Order by ID

Get a specific order request by ID.

**Endpoint:** `GET /api/contragent/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Product 1",
          "price": 10000
        },
        "quantity": 2,
        "price": 10000
      }
    ],
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Contragent 1"
        },
        "itemIds": [0],
        "status": "pending"
      }
    ],
    "currentPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1"
    },
    "status": "requested_to_contragent"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "message": "Bu buyurtma sizga so'rov yuborilmagan"
}
```

---

### 3. Respond to Order Request

Accept or reject an order request.

**Endpoint:** `POST /api/contragent/orders/:orderId/respond`

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

**Status Changes:**
- **If accepted:** 
  - Request status: `pending` → `accepted`
  - Order status: `requested_to_contragent` → `accepted_by_contragent`
- **If rejected:** 
  - Request status: `pending` → `rejected`
  - Order status remains `requested_to_contragent`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Contragent 1"
        },
        "itemIds": [0],
        "status": "accepted",
        "requestedAt": "2024-01-15T10:00:00.000Z",
        "respondedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "status": "accepted_by_contragent"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid response value or request already responded
- **404 Not Found:** Order or request not found

---

### 4. Deliver Order to Punkt

Mark order as delivered to punkt. This should be called when contragent physically delivers the product to their local punkt.

**Endpoint:** `POST /api/contragent/orders/:orderId/deliver-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `orderId` (required) - Order ID

**Request Body:** None

**Status Changes:**
- Request status: `accepted` → `delivered_to_punkt`
- Order status: `accepted_by_contragent` → `delivered_to_punkt`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli punktga yetkazildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Contragent 1"
        },
        "itemIds": [0],
        "status": "delivered_to_punkt",
        "requestedAt": "2024-01-15T10:00:00.000Z",
        "respondedAt": "2024-01-15T10:30:00.000Z",
        "deliveredToPunktAt": "2024-01-15T14:00:00.000Z"
      }
    ],
    "currentPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt 1"
    },
    "status": "delivered_to_punkt"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Request not accepted or already delivered
- **404 Not Found:** Order or request not found

**Important:** Contragent delivers to their local punkt (the punkt in their district). The punkt then handles logistics to the customer's district if needed.

---

## Order Status Flow

```
requested_to_contragent (Punkt sends request)
    ↓
accepted_by_contragent (Contragent accepts)
    ↓
delivered_to_punkt (Contragent delivers to punkt)
```

---

## Request Status Values

| Status | Description |
|--------|-------------|
| `pending` | So'rov yuborilgan, javob kutilmoqda |
| `accepted` | So'rov qabul qilindi |
| `rejected` | So'rov rad etildi |
| `delivered_to_punkt` | Mahsulot punktga yetkazildi |

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
- `403` - Forbidden (access denied)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

---

## Workflow Scenarios

### Scenario 1: Single Order, Single Product from Contractor in Same District

1. Customer creates order → Order automatically assigned to punkt in customer district
2. Punkt confirms order
3. Punkt requests from contragent (same district)
4. **Contragent receives request** → Status: `pending`
5. **Contragent accepts** → Status: `accepted`
6. **Contragent delivers to punkt** → Status: `delivered_to_punkt`
7. Punkt receives from contragent
8. Punkt assigns to agent
9. Agent delivers to customer

### Scenario 2: Single Order, Multiple Products from Multiple Contractors in Same District

1. Customer creates order → Order automatically assigned to punkt in customer district
2. Punkt confirms order
3. Punkt requests from multiple contragents (same district)
4. **Each contragent receives request** → Status: `pending`
5. **Each contragent accepts** → Status: `accepted`
6. **Each contragent delivers to punkt** → Status: `delivered_to_punkt`
7. Punkt receives all products
8. Punkt assigns to agent
9. Agent delivers to customer

### Scenario 3: Single Order, Product from Contractor in Different District

1. Customer creates order → Order automatically assigned to punkt in customer district (Punkt A)
2. Punkt A confirms order
3. Punkt A requests from punkt in contractor district (Punkt B)
4. Punkt B accepts request
5. Punkt B requests from contragent (its own district)
6. **Contragent receives request** → Status: `pending`
7. **Contragent accepts** → Status: `accepted`
8. **Contragent delivers to Punkt B** → Status: `delivered_to_punkt`
9. Punkt B sends back to Punkt A
10. Punkt A receives from Punkt B
11. Punkt A assigns to agent
12. Agent delivers to customer

**Note:** In Scenario 3, contragent only deals with Punkt B (their local punkt). They don't interact with Punkt A directly.

---

## Notes

1. **District Scope:** Contragents only work with orders in their own district. They cannot see or interact with orders from other districts.

2. **Item Filtering:** When viewing orders, only items requested from this contragent are shown. The `itemIds` array in the request indicates which items from the original order are requested.

3. **Linear Flow:** All operations follow a strict linear sequence. No automatic routing - everything is manual and sequential.

4. **Punkt Assignment:** Orders are automatically assigned to a punkt in the customer's district when created. Contragents work with the punkt that requests from them.

5. **Delivery:** Contragents deliver to their local punkt only. The punkt handles all inter-district logistics.



