# Admin Data Orders API Documentation

## Overview

Admin Data Orders API provides comprehensive endpoints for administrators to view, filter, and analyze all orders in the system. Each endpoint returns full order details including all products, contragents, punkts, agents, and workflow information.

**Base Path:** `/api/admins/data/orders`

**Note:** All endpoints require admin authentication.

---

## Base URL

```
http://localhost:5000/api/admins/data/orders
```

---

## Authentication

All endpoints require authentication using JWT token from Admin login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required User Type:** `admin`

---

## Common Query Parameters

All order endpoints support the following common parameters:

### Pagination
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

### Date Filters
- `startDate` (optional) - Start date (ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`)
- `endDate` (optional) - End date (ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`)

### Status Filters
- `status` (optional) - Filter by order status

---

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "statistics": {
    "totalOrders": 50,
    "totalPrice": 1500000,
    "totalOriginalPrice": 1200000,
    "totalKpiPrice": 300000,
    "totalItems": 150,
    "avgOrderValue": 30000
  },
  "data": [ ... ]
}
```

### Statistics Object
- `totalOrders` - Total number of orders matching the filter
- `totalPrice` - Sum of all order prices
- `totalOriginalPrice` - Sum of all original prices
- `totalKpiPrice` - Sum of all KPI prices
- `totalItems` - Total number of items across all orders
- `avgOrderValue` - Average order value

---

## Endpoints

### 1. Get All Orders

Get all orders in the system with full details and comprehensive filtering options.

**Endpoint:** `GET /api/admins/data/orders`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**

#### Basic Filters:
- `status` (optional) - Filter by order status: `pending`, `confirmed_by_punkt`, `requested_to_contragent`, `accepted_by_contragent`, `delivered_to_punkt`, `assigned_to_agent`, `confirmed_by_agent`, `confirmed_by_customer`, `cancelled`
- `paymentStatus` (optional) - Filter by payment status: `pending`, `paid`, `failed`, `refunded`
- `paymentMethod` (optional) - Filter by payment method: `cash`, `card`
- `user` (optional) - Filter by user ID

#### Search Filters:
- `orderNumber` (optional) - Filter by order number (partial match, case-insensitive)
- `search` (optional) - Search by order number or phone number (case-insensitive)

#### Date Filters:
- `startDate` (optional) - Filter by start date (ISO 8601 format)
- `endDate` (optional) - Filter by end date (ISO 8601 format)

#### Price Filters:
- `minTotalPrice` (optional) - Minimum total price (number)
- `maxTotalPrice` (optional) - Maximum total price (number)

#### Pagination:
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "statistics": {
    "totalOrders": 100,
    "totalPrice": 5000000,
    "totalOriginalPrice": 4000000,
    "totalKpiPrice": 1000000,
    "totalItems": 500,
    "avgOrderValue": 50000
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439022",
        "firstName": "Ali",
        "lastName": "Valiyev",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TASH"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Chirchiq tumani",
          "type": "district",
          "code": "CHIR"
        },
        "mfy": {
          "_id": "507f1f77bcf86cd799439017",
          "name": "MFY 1",
          "type": "mfy",
          "code": "MFY-1"
        },
        "status": "active"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Coca Cola 1.5L",
            "price": 15000,
            "originalPrice": 12000,
            "images": ["data:image/jpeg;base64,..."],
            "category": {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Ichimliklar",
              "slug": "ichimliklar",
              "status": "active"
            },
            "subcategory": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Gazlangan ichimliklar",
              "slug": "gazlangan-ichimliklar",
              "status": "active"
            },
            "contragent": {
              "_id": "507f1f77bcf86cd799439020",
              "name": "ABC MChJ",
              "phone": "+998901234567",
              "viloyat": {
                "_id": "507f1f77bcf86cd799439015",
                "name": "Toshkent viloyati",
                "type": "region"
              },
              "tuman": {
                "_id": "507f1f77bcf86cd799439016",
                "name": "Chirchiq tumani",
                "type": "district"
              },
              "status": "active"
            },
            "quantity": 20,
            "unit": "dona",
            "unitSize": 1.5,
            "status": "active",
            "deliveryRegions": [
              {
                "viloyat": {
                  "_id": "507f1f77bcf86cd799439015",
                  "name": "Toshkent viloyati",
                  "type": "region"
                },
                "tuman": {
                  "_id": "507f1f77bcf86cd799439016",
                  "name": "Chirchiq tumani",
                  "type": "district"
                }
              }
            ],
            "productCode": "001"
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 12000
        }
      ],
      "totalPrice": 30000,
      "totalOriginalPrice": 24000,
      "totalKpiPrice": 6000,
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
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "CHIR"
      },
      "deliveryMfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "MFY 1",
        "type": "mfy",
        "code": "MFY-1"
      },
      "deliveryNote": "Uy oldida qoldiring",
      "phoneNumber": "+998901234567",
      "confirmedByPunkt": null,
      "punktStatus": "pending",
      "currentPunkt": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Punkt 1",
        "phone": "+998901234568",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Chirchiq tumani",
          "type": "district"
        }
      },
      "contragentRequests": [],
      "punktToPunktRequests": [],
      "assignedToAgent": null,
      "assignedByPunkt": null,
      "confirmedByAgent": null,
      "customerConfirmed": false,
      "workflowStage": {
        "stage": "assigned_to_punkt",
        "stageName": "Punktga biriktirilgan",
        "description": "Buyurtma punktga biriktirilgan, punkt tasdiqlashini kutmoqda",
        "canProceed": true,
        "nextAction": "Punkt buyurtmani tasdiqlashi kerak"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Order by ID

Get a specific order by ID with full details.

**Endpoint:** `GET /api/admins/data/orders/:id`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Order ID (MongoDB ObjectId)

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "00001",
    "user": { ... },
    "items": [ ... ],
    "totalPrice": 30000,
    "status": "pending",
    ...
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Buyurtma topilmadi"
}
```

---

### 3. Get Marketplace Orders

Get all orders from marketplace that have not been confirmed by punkt yet (punkt qabul qilmagan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/marketplace`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `paymentStatus` (optional) - Filter by payment status: `pending`, `paid`, `failed`, `refunded`
- `paymentMethod` (optional) - Filter by payment method: `cash`, `card`
- `startDate` (optional) - Filter orders from this date (ISO 8601 format)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders that are still pending punkt confirmation. These are new orders from marketplace that punkt has not yet accepted.

**Filter Logic:**
- `confirmedByPunkt: null` - Order has not been confirmed by any punkt
- `status: { $ne: 'cancelled' }` - Cancelled orders are excluded

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details.

---

### 4. Get Orders Confirmed by Punkt

Get orders that have been confirmed by punkt but no further action has been taken yet (punkt qabul qilgan, lekin hech narsa qilinmagan).

**Endpoint:** `GET /api/admins/data/orders/confirmed-by-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter orders from this date (ISO 8601 format)
- `endDate` (optional) - Filter orders until this date (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where:
- `confirmedByPunkt` is not null (punkt has confirmed)
- `contragentRequests` is empty OR all requests are `pending` or `rejected` (no accepted or delivered requests)
- `assignedToAgent` is null (not yet assigned to agent)

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details.

---

### 5. Get Orders Requested to Contragents

Get orders that have been requested to contragents (kontragentlarga yuborilgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/requested-to-contragents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter by request date from (ISO 8601 format)
- `endDate` (optional) - Filter by request date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where contragent requests have status `pending` or `accepted` (not yet delivered).

**Filter Logic:**
- `contragentRequests.status: { $in: ['pending', 'accepted'] }`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details. The `contragentRequests` array will only contain requests with status `pending` or `accepted`.

---

### 6. Get Orders Delivered to Punkt

Get orders that have been delivered to punkt by contragents (kontragent punktga yetkazgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/delivered-to-punkt`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter by delivery date from (ISO 8601 format)
- `endDate` (optional) - Filter by delivery date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where at least one contragent request has status `delivered_to_punkt`.

**Filter Logic:**
- `contragentRequests.status: 'delivered_to_punkt'`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details. The `contragentRequests` array will only contain requests with status `delivered_to_punkt`.

---

### 7. Get Orders Assigned to Agents

Get orders that have been assigned to agents (agentlarga yuborilgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/assigned-to-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter by assignment date from (ISO 8601 format)
- `endDate` (optional) - Filter by assignment date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where `assignedToAgent` is not null.

**Filter Logic:**
- `assignedToAgent: { $ne: null }`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details. Includes `assignedToAgent`, `assignedByPunkt`, and `assignedAt` fields.

---

### 8. Get Orders Confirmed by Agents

Get orders that have been confirmed by agents (agentlar topshirgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/confirmed-by-agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter by confirmation date from (ISO 8601 format)
- `endDate` (optional) - Filter by confirmation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where `confirmedByAgent` is not null.

**Filter Logic:**
- `confirmedByAgent: { $ne: null }`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details. Includes `confirmedByAgent` and `agentConfirmedAt` fields.

---

### 9. Get Orders Confirmed by Customers

Get orders that have been confirmed by customers (foydalanuvchilar qabul qilgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/confirmed-by-customers`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `status` (optional) - Filter by order status
- `startDate` (optional) - Filter by confirmation date from (ISO 8601 format)
- `endDate` (optional) - Filter by confirmation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where `customerConfirmed` is `true`.

**Filter Logic:**
- `customerConfirmed: true`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details. Includes `customerConfirmed` and `customerConfirmedAt` fields.

---

### 10. Get Cancelled Orders

Get all cancelled orders (qaytarilgan buyurtmalar).

**Endpoint:** `GET /api/admins/data/orders/cancelled`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Filter by cancellation date from (ISO 8601 format)
- `endDate` (optional) - Filter by cancellation date until (ISO 8601 format)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Description:** Returns orders where `status` is `cancelled`.

**Filter Logic:**
- `status: 'cancelled'`

**Success Response (200 OK):**

Returns same format as "Get All Orders" with statistics and full order details.

---

## Order Object Structure

Each order object contains the following fields:

### Basic Information
- `_id` - Order ID (MongoDB ObjectId)
- `orderNumber` - Unique order number (string)
- `user` - Customer information (populated MarketplaceUser)
- `items` - Array of order items
- `totalPrice` - Total order price
- `totalOriginalPrice` - Total original price
- `totalKpiPrice` - Total KPI price
- `itemCount` - Total number of items

### Status Information
- `status` - Order status (enum)
- `paymentStatus` - Payment status (enum)
- `paymentMethod` - Payment method (enum)

### Delivery Information
- `deliveryViloyat` - Delivery viloyat (populated Region)
- `deliveryTuman` - Delivery tuman (populated Region)
- `deliveryMfy` - Delivery MFY (populated Region)
- `deliveryNote` - Delivery notes
- `phoneNumber` - Contact phone number

### Workflow Information
- `confirmedByPunkt` - Punkt that confirmed the order (populated Punkt)
- `punktStatus` - Punkt status (enum)
- `currentPunkt` - Current punkt managing the order (populated Punkt)
- `contragentRequests` - Array of contragent requests
- `punktToPunktRequests` - Array of punkt-to-punkt requests
- `assignedToAgent` - Agent assigned to deliver (populated Agent)
- `assignedByPunkt` - Punkt that assigned to agent (populated Punkt)
- `assignedAt` - Assignment timestamp
- `confirmedByAgent` - Agent that confirmed delivery (populated Agent)
- `agentConfirmedAt` - Agent confirmation timestamp
- `customerConfirmed` - Customer confirmation status (boolean)
- `customerConfirmedAt` - Customer confirmation timestamp

### Timestamps
- `createdAt` - Order creation timestamp
- `updatedAt` - Order last update timestamp

### Workflow Stage Information
- `workflowStage` - Current workflow stage information (buyurtma qayerda to'xtaganini ko'rsatadi)
  - `stage` - Stage code (string)
  - `stageName` - Stage name in Uzbek (string)
  - `description` - Stage description (string)
  - `canProceed` - Whether order can proceed (boolean)
  - `nextAction` - Next action required (string, optional)

**Workflow Stages:**
- `new_order` - Yangi buyurtma (punktga biriktirilishi kerak)
- `assigned_to_punkt` - Punktga biriktirilgan (punkt tasdiqlashini kutmoqda)
- `punkt_confirmed` - Punkt tasdiqlagan (keyingi qadamni kutmoqda)
- `waiting_punkt_response` - Punkt javobini kutmoqda (punkt-to-punkt so'rov)
- `punkt_processing` - Punkt ishlayapti (kontragentlarga so'rov yuborishi kerak)
- `waiting_contragent_response` - Kontragent javobini kutmoqda
- `contragent_preparing` - Kontragent tayyorlamoqda
- `ready_for_agent` - Agentga yuborishga tayyor
- `assigned_to_agent` - Agentga yuborilgan
- `waiting_customer_confirmation` - Mijoz tasdiqlashini kutmoqda
- `completed` - Yakunlangan
- `cancelled` - Bekor qilingan

---

## Order Item Structure

Each item in the `items` array contains:

- `product` - Product information (fully populated)
- `quantity` - Quantity ordered
- `price` - Price per unit at time of order
- `originalPrice` - Original price per unit at time of order
- `kpiBonusPercent` - KPI bonus percentage (removed from response)

---

## Contragent Request Structure

Each request in `contragentRequests` array contains:

- `contragentId` - Contragent ID (populated Contragent)
- `itemIds` - Array of item indices requested from this contragent
- `status` - Request status: `pending`, `accepted`, `rejected`, `delivered_to_punkt`
- `requestedAt` - Request timestamp
- `respondedAt` - Response timestamp
- `deliveredToPunktAt` - Delivery timestamp (if delivered)

---

## Punkt-to-Punkt Request Structure

Each request in `punktToPunktRequests` array contains:

- `fromPunktId` - Source punkt ID (populated Punkt)
- `toPunktId` - Destination punkt ID (populated Punkt)
- `status` - Request status: `pending`, `accepted`, `rejected`, `delivered`
- `requestedAt` - Request timestamp
- `respondedAt` - Response timestamp
- `deliveredAt` - Delivery timestamp (if delivered)

---

## Order Status Values

| Status | Description |
|--------|-------------|
| `pending` | Yangi buyurtma (mijoz tomonidan yaratilgan) |
| `confirmed_by_punkt` | Punkt tomonidan tasdiqlangan |
| `requested_to_contragent` | Contragentga so'rov yuborilgan |
| `accepted_by_contragent` | Contragent tomonidan qabul qilingan |
| `delivered_to_punkt` | Punktga yetkazilgan |
| `assigned_to_agent` | Agentga yuborilgan |
| `confirmed_by_agent` | Agent tomonidan tasdiqlangan (mijozga yetkazilgan) |
| `confirmed_by_customer` | Mijoz tomonidan tasdiqlangan |
| `cancelled` | Bekor qilingan |

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid input or ID format
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Get All Orders with Filters

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders?status=pending&paymentStatus=pending&startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get Marketplace Orders

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/marketplace?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Get Orders Confirmed by Punkt

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/confirmed-by-punkt?startDate=2024-01-15T00:00:00.000Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Orders Requested to Contragents

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/requested-to-contragents?status=requested_to_contragent&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Get Orders Delivered to Punkt

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/delivered-to-punkt?startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-15T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 6: Get Orders Assigned to Agents

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/assigned-to-agents?status=assigned_to_agent&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 7: Get Orders Confirmed by Agents

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/confirmed-by-agents?startDate=2024-01-15T00:00:00.000Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 8: Get Orders Confirmed by Customers

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/confirmed-by-customers?status=confirmed_by_customer&page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 9: Get Cancelled Orders

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/cancelled?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 10: Get Order by ID

**Request:**
```bash
curl -X GET "http://localhost:5000/api/admins/data/orders/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Workflow Stage Details

Each order response includes a `workflowStage` object that indicates exactly where the order is in the processing pipeline. This helps administrators quickly identify:

- **Where the order is stuck** - Which stage is blocking progress
- **What action is needed** - What needs to happen next
- **Who is responsible** - Which party (punkt, contragent, agent, customer) needs to act

### Stage Examples

**Example 1: New Order**
```json
{
  "workflowStage": {
    "stage": "new_order",
    "stageName": "Yangi buyurtma",
    "description": "Yangi buyurtma, punktga biriktirilishi kerak",
    "canProceed": true,
    "nextAction": "Punktga biriktirilishi kerak"
  }
}
```

**Example 2: Waiting for Contragent Response**
```json
{
  "workflowStage": {
    "stage": "waiting_contragent_response",
    "stageName": "Kontragent javobini kutmoqda",
    "description": "Kontragentlarga so'rov yuborilgan, javob kutilmoqda",
    "canProceed": true,
    "nextAction": "Kontragent javob berishi kerak"
  }
}
```

**Example 3: Ready for Agent**
```json
{
  "workflowStage": {
    "stage": "ready_for_agent",
    "stageName": "Agentga yuborishga tayyor",
    "description": "Barcha mahsulotlar punktga yetkazilgan, agentga yuborish mumkin",
    "canProceed": true,
    "nextAction": "Punkt agentga yuborishi kerak"
  }
}
```

---

## Notes

1. **Full Details:** All endpoints return complete order information including all populated relationships (user, products, contragents, punkts, agents, regions).

2. **Statistics:** All list endpoints include statistics object with totals and averages for quick analysis.

3. **KPI Bonus:** The `kpiBonusPercent` field is removed from product objects in all responses for security reasons.

4. **Pagination:** All list endpoints support pagination with `page` and `limit` parameters.

5. **Filtering:** Most endpoints support date range filtering and status filtering.

6. **Workflow Tracking:** Orders include complete workflow information showing the entire order journey from creation to delivery.

7. **Linear Flow:** The system follows a strict linear workflow - no automatic routing, all operations are manual and sequential.

8. **Workflow Stage:** Each order includes a `workflowStage` object that shows exactly where the order is stuck or waiting. This helps identify bottlenecks in the order processing pipeline. The stage information includes:
   - Current stage code and name
   - Description of the current state
   - Whether the order can proceed
   - What action is needed next

8. **Workflow Stage:** Each order includes a `workflowStage` object that shows exactly where the order is stuck or waiting. This helps identify bottlenecks in the order processing pipeline.
8. **Workflow Stage:** Each order includes a `workflowStage` object that shows exactly where the order is stuck or waiting. This helps identify bottlenecks in the order processing pipeline.

