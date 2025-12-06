# Marketplace Order API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Create Order](#1-create-order)
  - [Get Orders](#2-get-orders)
  - [Get Order by ID](#3-get-order-by-id)
  - [Cancel Order](#4-cancel-order)
  - [Confirm Delivery](#5-confirm-delivery)
- [Data Models](#data-models)
- [Order Number Generation](#order-number-generation)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Order API provides endpoints for creating and managing orders. Users can create orders from their cart, view their order history, and cancel pending orders. When an order is created, product quantities are reserved (decreased). When an order is cancelled, product quantities are returned to inventory.

**Base Path:** `/api/marketplace/orders`

**Note:** All order endpoints require authentication. Users must be logged in to create and manage orders.

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

All order endpoints **require authentication** using a JWT token obtained from the marketplace authentication endpoints.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Type:** `marketplace_user`

**Token Expiration:** 30 days (as set in authentication)

---

## Endpoints

### 1. Create Order

Create a new order from the user's cart. The order will be created with status "pending" and payment status "pending".

**Endpoint:** `POST /api/marketplace/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "paymentMethod": "cash",
  "deliveryViloyat": "507f1f77bcf86cd799439015",
  "deliveryTuman": "507f1f77bcf86cd799439016",
  "deliveryMfy": "507f1f77bcf86cd799439017",
  "deliveryNote": "Uy eshigiga qo'ng'iroq qiling",
  "phoneNumber": "+998901234567",
  "clearCart": true
}
```

**Request Fields:**
- `paymentMethod` (required) - Payment method: `"cash"` or `"card"`
- `deliveryViloyat` (required) - Delivery viloyat (region) ID (MongoDB ObjectId)
- `deliveryTuman` (optional) - Delivery tuman (district) ID (MongoDB ObjectId)
- `deliveryMfy` (optional) - Delivery MFY ID (MongoDB ObjectId)
- `deliveryNote` (optional) - Additional delivery notes (max 1000 characters)
- `phoneNumber` (optional) - Phone number for this order. If not provided, user's default phone number will be used
- `clearCart` (optional, default: `true`) - Whether to clear the cart after creating the order

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439021",
    "orderNumber": "00001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Coca Cola 1.5L",
          "price": 15000,
          "originalPrice": 12000,
          "images": ["data:image/jpeg;base64,..."],
          "category": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Ichimliklar",
            "slug": "ichimliklar",
            "status": "active"
          },
          "subcategory": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Gazlangan ichimliklar",
            "slug": "gazlangan-ichimliklar",
            "status": "active"
          },
          "contragent": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Test Contragent",
            "phone": "+998901234567",
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
            "status": "active"
          },
          "quantity": 20,
          "unit": "dona",
          "unitSize": 1.5,
          "length": 30,
          "width": 10,
          "weight": 1.5,
          "status": "active",
          "deliveryRegions": [
            {
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
              }
            }
          ],
          "productCode": "001"
        },
        "quantity": 2,
        "price": 15000,
        "originalPrice": 12000,
        "kpiBonusPercent": 5
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
      "code": "TASH-TUM"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "MFY 1",
      "type": "mfy",
      "code": "MFY-1"
    },
    "deliveryNote": "Uy eshigiga qo'ng'iroq qiling",
    "phoneNumber": "+998901234567",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response Fields:**
- `_id` - Order ID
- `user` - User ID who created the order
- `orderNumber` - Unique order number (see [Order Number Generation](#order-number-generation))
- `items` - Array of order items, each containing:
  - `product` - Full product object (without `kpiBonusPercent` in product details)
  - `quantity` - Quantity ordered
  - `price` - Price per unit at time of order
  - `originalPrice` - Original price per unit at time of order
  - `kpiBonusPercent` - KPI bonus percentage for this item
- `totalPrice` - Total price of all items (after discount)
- `totalOriginalPrice` - Total original price of all items
- `totalKpiPrice` - Total KPI price (calculated from totalPrice × kpiBonusPercent for each item)
- `itemCount` - Total number of items (sum of all quantities)
- `status` - Order status: `"pending"`, `"confirmed_by_punkt"`, `"requested_to_contragent"`, `"accepted_by_contragent"`, `"delivered_to_punkt"`, `"assigned_to_agent"`, `"confirmed_by_agent"`, `"confirmed_by_customer"`, `"cancelled"` (default: `"pending"`)
- `paymentStatus` - Payment status: `"pending"`, `"paid"`, `"failed"`, `"refunded"` (default: `"pending"`)
- `paymentMethod` - Payment method: `"cash"` or `"card"`
- `deliveryViloyat` - Delivery viloyat (region) object with `_id`, `name`, `type`, `code`
- `deliveryTuman` - Delivery tuman (district) object with `_id`, `name`, `type`, `code` (optional, can be null)
- `deliveryMfy` - Delivery MFY object with `_id`, `name`, `type`, `code` (optional, can be null)
- `deliveryNote` - Delivery notes (optional)
- `phoneNumber` - Phone number for this order
- `createdAt` - Order creation timestamp
- `updatedAt` - Last update timestamp

**Behavior:**
- Order is created from the user's current cart
- All cart items are validated (product exists, is active, has sufficient quantity)
- Region IDs are validated (viloyat must be type 'region', tuman must be type 'district' and belong to viloyat, mfy must be type 'mfy' and belong to tuman if provided)
- Order number is automatically generated
- Cart is cleared by default (can be disabled with `clearCart: false`)
- If `phoneNumber` is not provided, user's default phone number is used

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Missing required fields
  - Cart is empty
  - Product not found or inactive
  - Insufficient product quantity
  - Invalid region ID (not a valid viloyat, tuman, or mfy)
  - Tuman does not belong to the specified viloyat
  - MFY does not belong to the specified tuman
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

**Example Error Response (Empty Cart):**

```json
{
  "success": false,
  "message": "Korzinka bo'sh"
}
```

**Example Error Response (Insufficient Quantity):**

```json
{
  "success": false,
  "message": "Maxsulot \"Coca Cola 1.5L\" uchun mavjud miqdor: 5. Siz 10 ta so'rayapsiz"
}
```

---

### 2. Get Orders

Get all orders for the authenticated user with optional filtering and pagination.

**Endpoint:** `GET /api/marketplace/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status: `"pending"`, `"confirmed_by_punkt"`, `"requested_to_contragent"`, `"accepted_by_contragent"`, `"delivered_to_punkt"`, `"assigned_to_agent"`, `"confirmed_by_agent"`, `"confirmed_by_customer"`, `"cancelled"`
- `paymentStatus` (optional) - Filter by payment status: `"pending"`, `"paid"`, `"failed"`, `"refunded"`
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

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
      "_id": "507f1f77bcf86cd799439030",
      "user": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Coca Cola 1.5L",
            "price": 15000,
            "originalPrice": 12000,
            "images": ["data:image/jpeg;base64,..."],
            "category": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "Ichimliklar",
              "slug": "ichimliklar",
              "status": "active"
            },
            "subcategory": {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Gazlangan ichimliklar",
              "slug": "gazlangan-ichimliklar",
              "status": "active"
            },
            "contragent": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Test Contragent",
              "phone": "+998901234567",
              "status": "active"
            },
            "quantity": 20,
            "unit": "dona",
            "unitSize": 1.5,
            "status": "active",
            "productCode": "001"
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000,
          "kpiBonusPercent": 5
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
        "code": "TASH-TUM"
      },
      "deliveryMfy": null,
      "deliveryNote": "Uy eshigiga qo'ng'iroq qiling",
      "phoneNumber": "+998901234567",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **500 Internal Server Error** - Server error

---

### 3. Get Order by ID

Get a specific order by its ID. Only the order owner can access their orders.

**Endpoint:** `GET /api/marketplace/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439021",
    "orderNumber": "00001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Coca Cola 1.5L",
          "price": 15000,
          "originalPrice": 12000,
          "images": ["data:image/jpeg;base64,..."],
          "category": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Ichimliklar",
            "slug": "ichimliklar",
            "status": "active"
          },
          "subcategory": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Gazlangan ichimliklar",
            "slug": "gazlangan-ichimliklar",
            "status": "active"
          },
          "contragent": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Test Contragent",
            "phone": "+998901234567",
            "status": "active"
          },
          "quantity": 20,
          "unit": "dona",
          "unitSize": 1.5,
          "length": 30,
          "width": 10,
          "weight": 1.5,
          "status": "active",
          "productCode": "001"
        },
        "quantity": 2,
        "price": 15000,
        "originalPrice": 12000,
        "kpiBonusPercent": 5
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
      "code": "TASH-TUM"
    },
    "deliveryMfy": null,
    "deliveryNote": "Uy eshigiga qo'ng'iroq qiling",
    "phoneNumber": "+998901234567",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid order ID format
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Order not found or doesn't belong to user
- **500 Internal Server Error** - Server error

---

### 4. Cancel Order

Cancel a pending order. When an order is cancelled, product quantities are returned to inventory and the order status is changed to "cancelled". Only pending orders can be cancelled.

**Endpoint:** `DELETE /api/marketplace/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "user": "507f1f77bcf86cd799439021",
    "orderNumber": "00001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Coca Cola 1.5L",
          "price": 15000,
          "originalPrice": 12000,
          "images": ["data:image/jpeg;base64,..."],
          "category": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Ichimliklar",
            "slug": "ichimliklar",
            "status": "active"
          },
          "subcategory": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Gazlangan ichimliklar",
            "slug": "gazlangan-ichimliklar",
            "status": "active"
          },
          "contragent": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Test Contragent",
            "phone": "+998901234567",
            "status": "active"
          },
          "quantity": 20,
          "unit": "dona",
          "unitSize": 1.5,
          "length": 30,
          "width": 10,
          "weight": 1.5,
          "status": "active",
          "productCode": "001"
        },
        "quantity": 2,
        "price": 15000,
        "originalPrice": 12000,
        "kpiBonusPercent": 5
      }
    ],
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalKpiPrice": 1500,
    "itemCount": 2,
    "status": "cancelled",
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
      "code": "TASH-TUM"
    },
    "deliveryMfy": null,
    "deliveryNote": "Uy eshigiga qo'ng'iroq qiling",
    "phoneNumber": "+998901234567",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Behavior:**
- Order status is changed to "cancelled"
- Product quantities are returned to inventory (increased by the ordered quantity)
- Order cannot be cancelled if it's not in "pending" status

**Error Responses:**

- **400 Bad Request** - Order is not in "pending" status
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Order not found or doesn't belong to user
- **500 Internal Server Error** - Server error

**Example Error Response (Order Not Pending):**

```json
{
  "success": false,
  "message": "Faqat \"pending\" holatdagi buyurtmalarni bekor qilish mumkin"
}
```

---

## Data Models

### Order Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "user": "string (MongoDB ObjectId, reference to MarketplaceUser)",
  "orderNumber": "string (unique, auto-generated)",
  "items": "array of OrderItem objects",
  "totalPrice": "number (total price after discount)",
  "totalOriginalPrice": "number (total original price)",
  "totalKpiPrice": "number (total KPI price for agents)",
  "itemCount": "number (sum of all quantities)",
  "status": "string (enum: 'pending' | 'confirmed_by_punkt' | 'requested_to_contragent' | 'accepted_by_contragent' | 'delivered_to_punkt' | 'assigned_to_agent' | 'confirmed_by_agent' | 'confirmed_by_customer' | 'cancelled')",
  "paymentStatus": "string (enum: 'pending' | 'paid' | 'failed' | 'refunded')",
  "paymentMethod": "string (enum: 'cash' | 'card')",
  "deliveryViloyat": "Region object (required, with _id, name, type, code)",
  "deliveryTuman": "Region object (optional, can be null, with _id, name, type, code)",
  "deliveryMfy": "Region object (optional, can be null, with _id, name, type, code)",
  "deliveryNote": "string (max 1000 characters, optional)",
  "phoneNumber": "string (phone number for this order)",
  "punktStatus": "string (enum: 'pending' | 'confirmed', optional, can be null)",
  "confirmedByPunkt": "ObjectId (reference to Punkt, optional, can be null)",
  "assignedToAgent": "ObjectId (reference to Agent, optional, can be null)",
  "assignedByPunkt": "ObjectId (reference to Punkt, optional, can be null)",
  "assignedAt": "Date (optional, can be null)",
  "confirmedByAgent": "ObjectId (reference to Agent, optional, can be null)",
  "agentConfirmedAt": "Date (optional, can be null)",
  "customerConfirmed": "boolean (default: false)",
  "customerConfirmedAt": "Date (optional, can be null)",
  "currentPunkt": "ObjectId (reference to Punkt, optional, can be null)",
  "contragentRequests": "array of ContragentRequest objects (optional)",
  "punktToPunktRequests": "array of PunktToPunktRequest objects (optional)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Order Item Object

```json
{
  "product": "Product object (full product details without kpiBonusPercent in product object)",
  "quantity": "number (quantity ordered, min: 1)",
  "price": "number (price per unit at time of order)",
  "originalPrice": "number (original price per unit at time of order)",
  "kpiBonusPercent": "number (KPI bonus percentage for this item)"
}
```

**Note:** The `kpiBonusPercent` field in the order item is the KPI bonus percentage for that specific item. The product object itself does not include `kpiBonusPercent` in its details.

---

## Order Number Generation

Order numbers are automatically generated in a sequential format:

1. **Initial Format:** `00001`, `00002`, `00003`, ... up to `99999`
2. **After 99999:** When the number exceeds `99999`, letter suffixes are added:
   - `00001a`, `00001b`, `00001c`, ... `00001z`
   - `00001za`, `00001zb`, ... `00001zz`
   - And so on, with more letters added as needed
3. **Flexible Growth:** The system can handle any number of orders by adding more letter suffixes as needed

**Examples:**
- First order: `00001`
- 99999th order: `99999`
- 100000th order: `00001a`
- 100026th order: `00001z`
- 100027th order: `00001za`
- And so on...

This system ensures:
- Unique order numbers
- Sequential ordering
- Scalability for unlimited orders
- Human-readable format

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
- **201 Created** - Order created successfully
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

```json
{
  "success": false,
  "message": "Token noto'g'ri yoki muddati tugagan"
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Bu token marketplace user uchun emas"
}
```

```json
{
  "success": false,
  "message": "Hisobingiz faol emas"
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "message": "To'lov usuli kiritilishi shart"
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish viloyati kiritilishi shart"
}
```

```json
{
  "success": false,
  "message": "Noto'g'ri viloyat ID"
}
```

```json
{
  "success": false,
  "message": "Noto'g'ri tuman ID"
}
```

```json
{
  "success": false,
  "message": "Tuman viloyatga tegishli emas"
}
```

```json
{
  "success": false,
  "message": "Noto'g'ri MFY ID"
}
```

```json
{
  "success": false,
  "message": "MFY tumanaga tegishli emas"
}
```

```json
{
  "success": false,
  "message": "Korzinka bo'sh"
}
```

```json
{
  "success": false,
  "message": "Faqat \"pending\" holatdagi buyurtmalarni yangilash mumkin"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Buyurtma topilmadi"
}
```

---

## Examples

### Example 1: Create Order

**Request:**

```bash
curl -X POST "http://localhost:5000/api/marketplace/orders" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "cash",
    "deliveryViloyat": "507f1f77bcf86cd799439015",
    "deliveryTuman": "507f1f77bcf86cd799439016",
    "deliveryMfy": "507f1f77bcf86cd799439017",
    "deliveryNote": "Uy eshigiga qo'\''ng'\''iroq qiling",
    "phoneNumber": "+998901234567",
    "clearCart": true
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "orderNumber": "00001",
    "items": [...],
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalKpiPrice": 1500,
    "itemCount": 2,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash"
  }
}
```

### Example 2: Get All Orders

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/orders?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "data": [...]
}
```

### Example 3: Get Orders by Status

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/orders?status=pending&paymentStatus=pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Order by ID

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/orders/507f1f77bcf86cd799439030" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Cancel Order

**Request:**

```bash
curl -X DELETE "http://localhost:5000/api/marketplace/orders/507f1f77bcf86cd799439030" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "orderNumber": "00001",
    "status": "cancelled",
    ...
  }
}
```

---

### Confirm Delivery

Confirm that you have received the order.

**Endpoint:** `POST /api/marketplace/orders/:id/confirm-delivery`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Status Changes:**
- **Before:** `confirmed_by_agent`
- **After:** `confirmed_by_customer`

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "customerConfirmed": true,
    "customerConfirmedAt": "2024-01-15T14:00:00.000Z",
    "status": "confirmed_by_customer",
    "confirmedByAgent": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Agent Name",
      "phone": "+998901234567"
    },
    "agentConfirmedAt": "2024-01-15T13:00:00.000Z"
  }
}
```

**Response Fields:**
- `customerConfirmed` - Boolean indicating customer confirmation
- `customerConfirmedAt` - Timestamp when customer confirmed
- `status` - Updated order status (will be `"confirmed_by_customer"`)
- `confirmedByAgent` - Agent who delivered the order
- `agentConfirmedAt` - Timestamp when agent confirmed delivery

**Behavior:**
- **Order status is automatically updated:** `confirmed_by_agent` → `confirmed_by_customer`
- Order must be confirmed by agent first (`confirmed_by_agent` status)
- Order can only be confirmed once by the customer
- Only the order owner can confirm their order
- Sets `customerConfirmed` to `true` and `customerConfirmedAt` timestamp

**Error Responses:**
- **400 Bad Request** - Order already confirmed by customer OR order not confirmed by agent yet
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Order does not belong to this user OR token not for marketplace user
- **404 Not Found** - Order not found
- **500 Internal Server Error** - Server error

**Example Error Response (Not Confirmed by Agent):**

```json
{
  "success": false,
  "message": "Buyurtma hali agent tomonidan tasdiqlanmagan"
}
```

**Example Error Response (Already Confirmed):**

```json
{
  "success": false,
  "message": "Buyurtma allaqachon tasdiqlangan"
}
```

---

## Notes

1. **Authentication Required:** All order endpoints require a valid JWT token for marketplace users.

2. **Order Creation:**
   - Orders are created from the user's current cart
   - All cart items are validated before order creation
   - **Product quantities are reserved (decreased) when order is created**
   - Cart is cleared by default after order creation (can be disabled)
   - Order number is automatically generated

3. **Order Status:**
   - Initial status is always `"pending"`
   - Initial payment status is always `"pending"`
   - Only pending orders can be cancelled by users
   - **Order status flow with automatic status changes:**
     - `pending` → New order created (when customer creates order)
     - `confirmed_by_punkt` → Punkt confirmed the order (when punkt confirms)
     - `requested_to_contragent` → Request sent to contragent (when punkt requests to contragent)
     - `accepted_by_contragent` → Contragent accepted the request (when contragent accepts)
     - `delivered_to_punkt` → Contragent delivered to punkt (when contragent delivers OR punkt receives from punkt)
     - `assigned_to_agent` → Punkt assigned to agent (when punkt assigns to agent)
     - `confirmed_by_agent` → Agent confirmed delivery to customer (when agent confirms)
     - `confirmed_by_customer` → Customer confirmed receipt (when customer confirms via this endpoint)
     - `cancelled` → Order cancelled (when customer cancels pending order)
   - **Status changes are automatic** - Each action automatically updates the order status to reflect the current stage

4. **Order Cancellation:**
   - Only pending orders can be cancelled
   - **Product quantities are returned to inventory (increased) when order is cancelled**
   - Order status is changed to `"cancelled"`

4. **Price Calculation:**
   - `totalPrice` = Sum of (product.price × quantity) for all items
   - `totalOriginalPrice` = Sum of (product.originalPrice × quantity) for all items
   - `totalKpiPrice` = Sum of ((product.price × quantity × kpiBonusPercent) / 100) for all items

5. **Product Information:**
   - Product details are saved at the time of order creation
   - Product `kpiBonusPercent` is stored in order items but not shown in product details
   - Product information in order items reflects the state at order time

6. **Phone Number:**
   - If not provided, user's default phone number is used
   - Can be customized per order

7. **Delivery Regions:**
   - `deliveryViloyat` is required and must be a valid region ID with type 'region'
   - `deliveryTuman` is optional but if provided, must be a valid district ID with type 'district' and must belong to the specified viloyat
   - `deliveryMfy` is optional but if provided, must be a valid MFY ID with type 'mfy' and must belong to the specified tuman (if tuman is provided)
   - All region IDs are validated before order creation
   - Region objects are populated in responses with full details (name, type, code)

8. **Product Quantity Management:**
   - When order is created: Product quantities are decreased (reserved)
   - When order is cancelled: Product quantities are increased (returned to inventory)
   - This ensures accurate inventory tracking

9. **Order Number:**
   - Automatically generated
   - Sequential format with letter suffixes for scalability
   - Unique across all orders

10. **Validation:**
   - All products must be active and have sufficient quantity
   - Order cannot be created with empty cart
   - Only pending orders can be cancelled

11. **Pagination:** The get orders endpoint supports pagination with `page` and `limit` query parameters.

---

**Last Updated:** 2024-01-15

