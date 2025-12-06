# Marketplace Cart API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get Cart](#1-get-cart)
  - [Add to Cart](#2-add-to-cart)
  - [Update Cart Item](#3-update-cart-item)
  - [Remove from Cart](#4-remove-from-cart)
  - [Clear Cart](#5-clear-cart)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Cart API provides endpoints for managing shopping cart items. Users can add products to their cart, update quantities, remove items, and clear the entire cart.

**Base Path:** `/api/marketplace/cart`

**Note:** All cart endpoints require authentication. Users must be logged in to access their cart.

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

All cart endpoints **require authentication** using a JWT token obtained from the marketplace authentication endpoints.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Type:** `marketplace_user`

**Token Expiration:** 30 days (as set in authentication)

---

## Endpoints

### 1. Get Cart

Get the current user's shopping cart with all items and calculated totals.

**Endpoint:** `GET /api/marketplace/cart`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
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
          "productCode": "001",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        },
        "quantity": 2
      }
    ],
    "totalItems": 2,
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalDiscount": 6000,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Fields:**
- `_id` - Cart ID
- `items` - Array of cart items, each containing:
  - `product` - Full product object (without `kpiBonusPercent`)
  - `quantity` - Quantity of the product in cart
- `totalItems` - Total number of items (sum of all quantities)
- `totalPrice` - Total price of all items (after discount)
- `totalOriginalPrice` - Total original price of all items
- `totalDiscount` - Total discount amount
- `createdAt` - Cart creation timestamp
- `updatedAt` - Last update timestamp

**Note:** 
- If cart doesn't exist, an empty cart is automatically created
- Inactive products are automatically removed from the cart
- Product `kpiBonusPercent` is excluded from responses

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **500 Internal Server Error** - Server error

---

### 2. Add to Cart

Add a product to the cart or increase its quantity if it already exists.

**Endpoint:** `POST /api/marketplace/cart`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Request Fields:**
- `productId` (required) - MongoDB ObjectId of the product
- `quantity` (optional, default: 1) - Number of items to add (minimum: 1)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot korzinkaga qo'shildi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
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
        "quantity": 2
      }
    ],
    "totalItems": 2,
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalDiscount": 6000
  }
}
```

**Behavior:**
- If product doesn't exist in cart, it's added with the specified quantity
- If product already exists in cart, the quantity is added to existing quantity
- Product must be active and have sufficient available quantity

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - Missing `productId`
  - `quantity` less than 1
  - Product not found
  - Product is inactive
  - Insufficient product quantity available
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

**Example Error Response (Insufficient Quantity):**

```json
{
  "success": false,
  "message": "Mavjud miqdor: 5. Siz 10 ta so'rayapsiz"
}
```

---

### 3. Update Cart Item

Update the quantity of a specific product in the cart.

**Endpoint:** `PUT /api/marketplace/cart/:productId`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `productId` (required) - MongoDB ObjectId of the product to update

**Request Body:**

```json
{
  "quantity": 5
}
```

**Request Fields:**
- `quantity` (required) - New quantity (minimum: 1)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Korzinka yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
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
        "quantity": 5
      }
    ],
    "totalItems": 5,
    "totalPrice": 75000,
    "totalOriginalPrice": 60000,
    "totalDiscount": 15000
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid input:
  - `quantity` missing or less than 1
  - Product not found
  - Product is inactive
  - Insufficient product quantity available
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Cart not found or product not in cart
- **500 Internal Server Error** - Server error

---

### 4. Remove from Cart

Remove a specific product from the cart.

**Endpoint:** `DELETE /api/marketplace/cart/:productId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `productId` (required) - MongoDB ObjectId of the product to remove

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Maxsulot korzinkadan olib tashlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [],
    "totalItems": 0,
    "totalPrice": 0,
    "totalOriginalPrice": 0,
    "totalDiscount": 0
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Cart not found or product not in cart
- **500 Internal Server Error** - Server error

---

### 5. Clear Cart

Remove all items from the cart.

**Endpoint:** `DELETE /api/marketplace/cart`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Korzinka tozalandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [],
    "totalItems": 0,
    "totalPrice": 0,
    "totalOriginalPrice": 0,
    "totalDiscount": 0
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Token not for marketplace user or account inactive
- **404 Not Found** - Cart not found
- **500 Internal Server Error** - Server error

---

## Data Models

### Cart Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "items": "array of CartItem objects",
  "totalItems": "number (sum of all quantities)",
  "totalPrice": "number (total price after discount)",
  "totalOriginalPrice": "number (total original price)",
  "totalDiscount": "number (total discount amount)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Cart Item Object

```json
{
  "product": "Product object (full product details without kpiBonusPercent)",
  "quantity": "number (quantity in cart, min: 1)"
}
```

### Product Object (in Cart)

The product object in cart items includes all product fields except `kpiBonusPercent`. See [Marketplace Data API Documentation](./marketplace-data-api.md) for full product object structure.

**Key Fields:**
- `_id` - Product ID
- `name` - Product name
- `price` - Current price (after discount)
- `originalPrice` - Original price (before discount)
- `images` - Array of base64 images (max 5)
- `category` - Category object
- `subcategory` - Subcategory object (optional)
- `contragent` - Contragent object (without `inn`)
- `quantity` - Available quantity in stock
- `unit` - Unit type ('dona', 'litr', 'kg')
- `unitSize` - Unit size (optional)
- `status` - Product status ('active', 'inactive', 'archived')
- `deliveryRegions` - Array of delivery region objects
- `productCode` - Product code

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
  "message": "Maxsulot ID kiritilishi shart"
}
```

```json
{
  "success": false,
  "message": "Miqdor kamida 1 bo'lishi kerak"
}
```

```json
{
  "success": false,
  "message": "Mavjud miqdor: 5. Siz 10 ta so'rayapsiz"
}
```

```json
{
  "success": false,
  "message": "Bu maxsulot hozir mavjud emas"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Korzinka topilmadi"
}
```

```json
{
  "success": false,
  "message": "Maxsulot korzinkada topilmadi"
}
```

```json
{
  "success": false,
  "message": "Maxsulot topilmadi"
}
```

---

## Examples

### Example 1: Get Cart

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/cart" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [...],
    "totalItems": 3,
    "totalPrice": 45000,
    "totalOriginalPrice": 36000,
    "totalDiscount": 9000
  }
}
```

### Example 2: Add Product to Cart

**Request:**

```bash
curl -X POST "http://localhost:5000/api/marketplace/cart" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 2
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot korzinkaga qo'shildi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [...],
    "totalItems": 2,
    "totalPrice": 30000,
    "totalOriginalPrice": 24000,
    "totalDiscount": 6000
  }
}
```

### Example 3: Update Cart Item Quantity

**Request:**

```bash
curl -X PUT "http://localhost:5000/api/marketplace/cart/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Korzinka yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [...],
    "totalItems": 5,
    "totalPrice": 75000,
    "totalOriginalPrice": 60000,
    "totalDiscount": 15000
  }
}
```

### Example 4: Remove Product from Cart

**Request:**

```bash
curl -X DELETE "http://localhost:5000/api/marketplace/cart/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Maxsulot korzinkadan olib tashlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [...],
    "totalItems": 1,
    "totalPrice": 15000,
    "totalOriginalPrice": 12000,
    "totalDiscount": 3000
  }
}
```

### Example 5: Clear Cart

**Request:**

```bash
curl -X DELETE "http://localhost:5000/api/marketplace/cart" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Korzinka tozalandi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [],
    "totalItems": 0,
    "totalPrice": 0,
    "totalOriginalPrice": 0,
    "totalDiscount": 0
  }
}
```

---

## Notes

1. **Authentication Required:** All cart endpoints require a valid JWT token for marketplace users.

2. **Automatic Cart Creation:** If a user doesn't have a cart, it's automatically created when they first access it.

3. **Product Validation:** 
   - Only active products can be added to cart
   - Product quantity is validated against available stock
   - Inactive products are automatically removed when fetching cart

4. **Quantity Management:**
   - When adding a product that already exists in cart, quantities are added together
   - Total quantity cannot exceed available product stock
   - Minimum quantity is 1

5. **Price Calculation:**
   - `totalPrice` = Sum of (product.price × quantity) for all items
   - `totalOriginalPrice` = Sum of (product.originalPrice × quantity) for all items
   - `totalDiscount` = totalOriginalPrice - totalPrice

6. **Sensitive Data:** Product `kpiBonusPercent` is excluded from all cart responses.

7. **Product Details:** Full product details including category, subcategory, contragent, and delivery regions are included in cart items.

8. **Error Handling:** All validation errors return descriptive messages in Uzbek language.

---

**Last Updated:** 2024-01-15




