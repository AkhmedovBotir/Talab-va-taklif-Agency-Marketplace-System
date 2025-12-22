# Marketplace Data API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Search & Filter](#search--filter)
    - [Search](#1-search)
    - [Filter Products](#2-filter-products)
  - [Products](#products)
    - [Get All Products](#3-get-all-products)
    - [Get Product by ID](#4-get-product-by-id)
  - [Categories](#categories)
    - [Get All Categories](#5-get-all-categories)
    - [Get Category by ID](#6-get-category-by-id)
    - [Get Products by Category](#7-get-products-by-category)
  - [Contragents](#contragents)
    - [Get All Contragents](#8-get-all-contragents)
    - [Get Contragent by ID](#9-get-contragent-by-id)
  - [Cart](#cart)
    - [Get Cart](#10-get-cart)
    - [Add to Cart](#11-add-to-cart)
    - [Update Cart Item](#12-update-cart-item)
    - [Remove from Cart](#13-remove-from-cart)
    - [Clear Cart](#14-clear-cart)
- [Data Models](#data-models)
- [Filtering Options](#filtering-options)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Marketplace Data API provides public endpoints for viewing products, categories, and contragents. These endpoints are designed for marketplace users to browse and search for products.

**Important:** Only products with `moderationStatus: 'approved'` and `status: 'active'` are visible in the marketplace. Products that are pending moderation or rejected by admins are not displayed.

**Base Path:** `/api/marketplace`

**Note:** These endpoints are public and do not require authentication. However, sensitive information like `kpiBonusPercent` (for products) and `inn` (for contragents) are excluded from responses.

---

## Base URL

```
http://localhost:5000/api/marketplace
```

---

## Authentication

Most endpoints are **public** and do not require authentication. However, **Cart endpoints require authentication** using a JWT token obtained from the marketplace authentication endpoints.

**For Cart endpoints**, include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Search & Filter

#### 1. Search

Search across products, categories, and contragents with a single query string.

**Endpoint:** `GET /api/marketplace/search`

**Query Parameters:**
- `q` (required) - Search query string
- `page` (optional, default: 1) - Page number for pagination (applies to products only)
- `limit` (optional, default: 20) - Number of items per page (applies to products only)

**Success Response (200 OK):**

```json
{
  "success": true,
  "query": "coca",
  "results": {
    "products": {
      "count": 5,
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "data": [
        {
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
          "productCode": "001",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      ]
    },
    "categories": {
      "count": 1,
      "data": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Ichimliklar",
          "slug": "ichimliklar",
          "parent": null,
          "status": "active",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      ]
    },
    "contragents": {
      "count": 0,
      "data": []
    }
  }
}
```

**Note:** 
- Search is case-insensitive
- Products are searched by name and product code
- Categories are searched by name
- Contragents are searched by name
- The `kpiBonusPercent` field is excluded from product responses
- The `inn` field is excluded from contragent responses

**Error Responses:**

- **400 Bad Request** - Search query is missing or empty
- **500 Internal Server Error** - Server error

---

#### 2. Filter Products

Filter products with advanced filters including price range, contragent, category, and subcategory. Returns available filter options based on selected filters.

**Endpoint:** `GET /api/marketplace/filter`

**Query Parameters:**
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `contragent` (optional) - Filter by contragent ID
- `category` (optional) - Filter by category ID (must be a category used by the selected contragent if contragent is provided)
- `subcategory` (optional) - Filter by subcategory ID (must be a subcategory of the selected category if category is provided)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "filters": {
    "minPrice": 10000,
    "maxPrice": 20000,
    "contragent": "507f1f77bcf86cd799439014",
    "category": "507f1f77bcf86cd799439012",
    "subcategory": null
  },
  "availableFilters": {
    "contragents": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "phone": "+998901234567",
        "status": "active"
      }
    ],
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar",
        "status": "active"
      }
    ],
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active"
      }
    ]
  },
  "results": {
    "count": 5,
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "data": [
      {
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
        "productCode": "001",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Filter Logic:**

1. **Price Range:** Filters products by price range
2. **Contragent:** When a contragent is selected:
   - `availableFilters.categories` shows only categories used by that contragent
   - `availableFilters.subcategories` shows only subcategories used by that contragent
   - `availableFilters.contragents` is empty (since one is already selected)
3. **Category:** When a category is selected:
   - `availableFilters.subcategories` shows subcategories of that category
   - If a contragent is also selected, only subcategories used by that contragent within the selected category are shown
4. **Subcategory:** When a subcategory is selected, it filters products to that specific subcategory

**Note:** 
- The `kpiBonusPercent` field is excluded from all product responses
- The `inn` field is excluded from all contragent responses
- All filters can be combined
- `availableFilters` helps build dynamic filter UIs

**Error Responses:**

- **400 Bad Request** - Invalid filter parameter
- **500 Internal Server Error** - Server error

---

### Products

#### 3. Get All Products

Get all active products with filtering and pagination options. The `kpiBonusPercent` field is excluded from responses.

**Endpoint:** `GET /api/marketplace/products`

**Query Parameters:**
- `category` (optional) - Filter by category ID
- `subcategory` (optional) - Filter by subcategory ID
- `contragent` (optional) - Filter by contragent ID
- `status` (optional) - Filter by status (default: 'active')
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `search` (optional) - Search in product name or product code (case-insensitive)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Coca Cola 1.5L",
      "description": {
        "ops": [
          {"insert": "Coca Cola - dunyoning eng mashhur gazlangan ichimligi.\n"}
        ]
      },
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
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "length": 30,
      "width": 10,
      "weight": 1.5,
      "status": "active",
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
        },
        {
          "viloyat": {
            "_id": "507f1f77bcf86cd799439018",
            "name": "Samarqand",
            "type": "region",
            "code": "02"
          },
          "tuman": null
        }
      ],
      "productCode": "001",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** The `kpiBonusPercent` field is excluded from all product responses.

---

#### 4. Get Product by ID

Get a specific product by its ID. The `kpiBonusPercent` field is excluded from the response.

**Endpoint:** `GET /api/marketplace/products/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Coca Cola 1.5L",
    "description": {
      "ops": [
        {"insert": "Coca Cola - dunyoning eng mashhur gazlangan ichimligi.\n"}
      ]
    },
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
    "quantity": 20,
    "unit": "dona",
    "unitSize": 1.5,
    "status": "active",
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
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid product ID format
- **404 Not Found** - Product not found
- **500 Internal Server Error** - Server error

---

### Categories

#### 5. Get All Categories

Get all parent categories with optional subcategories.

**Endpoint:** `GET /api/marketplace/categories`

**Query Parameters:**
- `status` (optional) - Filter by status (default: 'active')
- `includeSubcategories` (optional) - Include subcategories: 'true' or 'false' (default: 'false')

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ichimliklar",
      "slug": "ichimliklar",
      "parent": null,
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Gazlangan ichimliklar",
          "slug": "gazlangan-ichimliklar",
          "status": "active",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

#### 6. Get Category by ID

Get a specific category by its ID with optional subcategories.

**Endpoint:** `GET /api/marketplace/categories/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Query Parameters:**
- `includeSubcategories` (optional) - Include subcategories: 'true' or 'false' (default: 'false')

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Ichimliklar",
    "slug": "ichimliklar",
    "parent": null,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid category ID format
- **404 Not Found** - Category not found
- **500 Internal Server Error** - Server error

---

#### 7. Get Products by Category

Get all products belonging to a specific category with filtering and pagination options.

**Endpoint:** `GET /api/marketplace/categories/:id/products`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the category

**Query Parameters:**
- `subcategory` (optional) - Filter by subcategory ID
- `contragent` (optional) - Filter by contragent ID
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `search` (optional) - Search in product name or product code (case-insensitive)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
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
      "quantity": 20,
      "unit": "dona",
      "unitSize": 1.5,
      "length": 30,
      "width": 10,
      "weight": 1.5,
      "status": "active",
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Test Contragent",
        "phone": "+998901234567",
        "status": "active"
      },
      "productCode": "001",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** The `kpiBonusPercent` field is excluded from all product responses.

**Error Responses:**

- **400 Bad Request** - Invalid category ID format
- **500 Internal Server Error** - Server error

---

### Contragents

#### 8. Get All Contragents

Get all active contragents with pagination. The `inn` field is excluded from responses.

**Endpoint:** `GET /api/marketplace/contragents`

**Query Parameters:**
- `status` (optional) - Filter by status (default: 'active')
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Number of items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
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
      "status": "active",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** The `inn` field is excluded from all contragent responses.

---

#### 9. Get Contragent by ID

Get a specific contragent by its ID with optional categories, subcategories, and products. The `inn` field is excluded from the response.

**Endpoint:** `GET /api/marketplace/contragents/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the contragent

**Query Parameters:**
- `includeProducts` (optional) - Include products: 'true' or 'false' (default: 'false')
- `includeCategories` (optional) - Include categories and subcategories: 'true' or 'false' (default: 'false')

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
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
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ichimliklar",
        "slug": "ichimliklar",
        "status": "active"
      }
    ],
    "subcategories": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Gazlangan ichimliklar",
        "slug": "gazlangan-ichimliklar",
        "status": "active"
      }
    ],
    "products": [
      {
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
        "quantity": 20,
        "unit": "dona",
        "unitSize": 1.5,
        "status": "active",
        "productCode": "001",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Note:** 
- The `inn` field is excluded from the contragent response.
- The `kpiBonusPercent` field is excluded from all product responses.
- `categories`, `subcategories`, and `products` are only included if the respective query parameters are set to 'true'.

**Error Responses:**

- **400 Bad Request** - Invalid contragent ID format
- **404 Not Found** - Contragent not found
- **500 Internal Server Error** - Server error

---

## Data Models

### Product Object (Marketplace)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required)",
  "description": "object | null (Delta format, optional)",
  "price": "number (required, min: 0)",
  "originalPrice": "number (required, min: 0)",
  "images": "array of strings (max 5, base64 format)",
  "category": "object (reference to Category)",
  "subcategory": "object | null (reference to Category)",
  "quantity": "number (required, min: 0)",
  "unit": "string (enum: 'dona' | 'litr' | 'kg')",
  "unitSize": "number | null (optional)",
  "status": "string (enum: 'active' | 'inactive' | 'archived')",
  "contragent": "object (reference to Contragent, inn excluded)",
  "deliveryRegions": "array of objects",
  "productCode": "string (auto-generated)",
  "moderationStatus": "string (always 'approved' for marketplace products)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** 
- `kpiBonusPercent` is excluded from all product responses.
- Only products with `moderationStatus: 'approved'` and `status: 'active'` are displayed in the marketplace.
- `moderatedBy`, `moderatedAt`, and `rejectionReason` fields are not included in marketplace responses.

### Category Object

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required)",
  "slug": "string (unique, auto-generated)",
  "parent": "object | null (reference to Category)",
  "status": "string (enum: 'active' | 'inactive')",
  "subcategories": "array of Category objects (optional, when includeSubcategories=true)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Contragent Object (Marketplace)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string (required)",
  "phone": "string (required, unique)",
  "viloyat": "object (reference to Region, type: 'region')",
  "tuman": "object (reference to Region, type: 'district')",
  "mfy": "object (reference to Region, type: 'mfy')",
  "status": "string (enum: 'active' | 'inactive')",
  "categories": "array of Category objects (optional, when includeCategories=true)",
  "subcategories": "array of Category objects (optional, when includeCategories=true)",
  "products": "array of Product objects (optional, when includeProducts=true)",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

**Note:** `inn` is excluded from all contragent responses.

### Delivery Region Object

```json
{
  "viloyat": {
    "_id": "string",
    "name": "string",
    "type": "string (enum: 'region')",
    "code": "string"
  },
  "tuman": {
    "_id": "string",
    "name": "string",
    "type": "string (enum: 'district')",
    "code": "string"
  } | null
}
```

---

## Filtering Options

### Product Filters

The product endpoints support comprehensive filtering:

#### Category and Subcategory Filters
- Filter by category: `?category=507f1f77bcf86cd799439012`
- Filter by subcategory: `?subcategory=507f1f77bcf86cd799439013`

#### Contragent Filter
- Filter by contragent: `?contragent=507f1f77bcf86cd799439014`

#### Status Filter
- Filter by status: `?status=active`

#### Price Range Filters
- Minimum price: `?minPrice=10000`
- Maximum price: `?maxPrice=20000`
- Price range: `?minPrice=10000&maxPrice=20000`

#### Search Filter
- Search by name or product code: `?search=coca`
- Case-insensitive search

#### Combined Filters
You can combine multiple filters:
```
?category=507f1f77bcf86cd799439012&minPrice=10000&maxPrice=20000&search=coca
```

### Pagination

All list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20 for products, default: 20 for contragents)

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
- **400 Bad Request** - Invalid input or ID format
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Common Error Messages

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Noto'g'ri maxsulot ID"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "Maxsulot topilmadi"
}
```

#### Internal Server Error (500)

```json
{
  "success": false,
  "message": "Maxsulotlarni olishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Examples

### Example 1: Get All Products

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/products?page=1&limit=10"
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
  "data": [...]
}
```

### Example 5: Get Products with Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/products?category=507f1f77bcf86cd799439012&minPrice=10000&maxPrice=20000&search=coca"
```

### Example 6: Get All Categories with Subcategories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/categories?includeSubcategories=true"
```

### Example 7: Get Products by Category

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/categories/507f1f77bcf86cd799439012/products?page=1&limit=20"
```

### Example 8: Get All Contragents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/contragents?page=1&limit=20"
```

### Example 9: Get Contragent with Products and Categories

**Request:**

```bash
curl -X GET "http://localhost:5000/api/marketplace/contragents/507f1f77bcf86cd799439014?includeProducts=true&includeCategories=true"
```

---

## Notes

1. **Public Access:** All endpoints are public and do not require authentication.

2. **Sensitive Data:** 
   - Product `kpiBonusPercent` is excluded from all responses
   - Contragent `inn` is excluded from all responses

3. **Active Status:** By default, only active products and contragents are returned.

4. **Pagination:** All list endpoints support pagination with `page` and `limit` query parameters.

5. **Filtering:** Multiple filters can be combined. All filters are optional.

6. **Search:** The search filter searches in both product name and product code fields (case-insensitive).

7. **Full Details:** All endpoints return full details including populated references (category, subcategory, contragent, regions, etc.).

8. **Performance:** For large datasets, use pagination and specific filters to improve performance.

---

**Last Updated:** 2024-01-15

