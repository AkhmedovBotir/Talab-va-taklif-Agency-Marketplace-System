# Admin Archive API Documentation

## Overview

Admin Archive API provides endpoints for viewing archived (deleted) staff members (Punkts and Agents) and their complete work history. When a staff member is deleted, they are moved to archive but all their work records are preserved.

**Base Path:** `/api/admins/archive`

**Note:** All endpoints require admin authentication.

---

## Base URL

```
http://localhost:5000/api/admins/archive
```

---

## Authentication

All endpoints require authentication using JWT token from Admin login. The token should be included in the `Authorization` header.

**Format:** `Authorization: Bearer <token>`

**Required User Type:** `admin`

---

## Soft Delete System

The system uses **soft delete** for staff members:

- When a Punkt or Agent is deleted, they are **not permanently removed** from the database
- Instead, `isDeleted` is set to `true` and `deletedAt` timestamp is recorded
- `status` is automatically set to `inactive`
- Deleted staff members **do not appear** in regular API endpoints
- They can only be accessed through Archive API endpoints
- All their work history (orders, assignments, etc.) is preserved and accessible

---

## Endpoints

### 1. Get Archived Punkts

Get all archived (deleted) punkts with pagination and filtering.

**Endpoint:** `GET /api/admins/archive/punkts`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `search` (optional) - Search by name or phone (case-insensitive)
- `viloyat` (optional) - Filter by viloyat ID
- `tuman` (optional) - Filter by tuman ID

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Punkt 1",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "27"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "2701"
      },
      "status": "inactive",
      "isDeleted": true,
      "deletedAt": "2024-01-15T10:00:00.000Z",
      "createdAt": "2023-06-01T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Archived Agents

Get all archived (deleted) agents with pagination and filtering.

**Endpoint:** `GET /api/admins/archive/agents`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `search` (optional) - Search by name or phone (case-insensitive)
- `viloyat` (optional) - Filter by viloyat ID
- `tuman` (optional) - Filter by tuman ID
- `mfy` (optional) - Filter by MFY ID
- `agentType` (optional) - Filter by agent type: `viloyat`, `tuman`, `mfy`

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 10,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Agent 1",
      "phone": "+998901234568",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "27"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Chirchiq tumani",
        "type": "district",
        "code": "2701"
      },
      "mfy": null,
      "status": "inactive",
      "agentType": "tuman",
      "isDeleted": true,
      "deletedAt": "2024-01-15T10:00:00.000Z",
      "createdAt": "2023-07-01T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Archived Punkt with Work History

Get a specific archived punkt with all their work history (orders they were involved in).

**Endpoint:** `GET /api/admins/archive/punkts/:id/work`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Punkt ID (MongoDB ObjectId)

**Description:** Returns the archived punkt along with:
- All orders they confirmed (`confirmedByPunkt`)
- All orders where they were current punkt (`currentPunkt`)
- All orders they assigned to agents (`assignedByPunkt`)
- All punkt-to-punkt requests they were involved in (`punktToPunktRequests`)

**Success Response (200 OK):**

```json
{
  "success": true,
  "punkt": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Punkt 1",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "27"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Chirchiq tumani",
      "type": "district",
      "code": "2701"
    },
    "status": "inactive",
    "isDeleted": true,
    "deletedAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2023-06-01T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "statistics": {
    "totalOrders": 150,
    "totalPrice": 7500000,
    "totalOriginalPrice": 6000000,
    "totalKpiPrice": 1500000,
    "totalItems": 450,
    "avgOrderValue": 50000
  },
  "orders": {
    "total": 150,
    "count": 100,
    "data": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "orderNumber": "00001",
        "user": { ... },
        "items": [ ... ],
        "totalPrice": 30000,
        "status": "confirmed_by_customer",
        "confirmedByPunkt": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Punkt 1",
          "phone": "+998901234567"
        },
        "currentPunkt": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Punkt 1",
          "phone": "+998901234567"
        },
        "assignedByPunkt": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Punkt 1",
          "phone": "+998901234567"
        },
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-12T15:00:00.000Z"
      }
    ]
  }
}
```

**Note:** Only the 100 most recent orders are returned. Use the `total` count to see the full number of orders.

---

### 4. Get Archived Agent with Work History

Get a specific archived agent with all their work history (orders they were involved in).

**Endpoint:** `GET /api/admins/archive/agents/:id/work`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `id` (required) - Agent ID (MongoDB ObjectId)

**Description:** Returns the archived agent along with:
- All orders they were assigned to (`assignedToAgent`)
- All orders they confirmed delivery (`confirmedByAgent`)

**Success Response (200 OK):**

```json
{
  "success": true,
  "agent": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Agent 1",
    "phone": "+998901234568",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "27"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Chirchiq tumani",
      "type": "district",
      "code": "2701"
    },
    "mfy": null,
    "status": "inactive",
    "agentType": "tuman",
    "isDeleted": true,
    "deletedAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2023-07-01T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "statistics": {
    "totalOrders": 85,
    "totalPrice": 4250000,
    "totalOriginalPrice": 3400000,
    "totalKpiPrice": 850000,
    "totalItems": 255,
    "avgOrderValue": 50000
  },
  "orders": {
    "total": 85,
    "count": 85,
    "data": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "orderNumber": "00002",
        "user": { ... },
        "items": [ ... ],
        "totalPrice": 25000,
        "status": "confirmed_by_customer",
        "assignedToAgent": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Agent 1",
          "phone": "+998901234568"
        },
        "assignedByPunkt": { ... },
        "confirmedByAgent": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Agent 1",
          "phone": "+998901234568"
        },
        "agentConfirmedAt": "2024-01-11T14:00:00.000Z",
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-11T14:00:00.000Z"
      }
    ]
  }
}
```

**Note:** Only the 100 most recent orders are returned. Use the `total` count to see the full number of orders.

---

## Order Fields Included in Work History

When retrieving work history, orders include all standard fields plus:

### For Punkts:
- `confirmedByPunkt` - Orders confirmed by this punkt
- `currentPunkt` - Orders where this punkt was managing
- `assignedByPunkt` - Orders assigned to agents by this punkt
- `punktToPunktRequests` - Requests where this punkt was involved (as `fromPunktId` or `toPunktId`)

### For Agents:
- `assignedToAgent` - Orders assigned to this agent
- `confirmedByAgent` - Orders confirmed (delivered) by this agent
- `assignedAt` - When order was assigned
- `agentConfirmedAt` - When agent confirmed delivery

---

## Statistics Object

The statistics object includes:
- `totalOrders` - Total number of orders
- `totalPrice` - Sum of all order prices
- `totalOriginalPrice` - Sum of all original prices
- `totalKpiPrice` - Sum of all KPI prices
- `totalItems` - Total number of items across all orders
- `avgOrderValue` - Average order value

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message in Uzbek"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Token not provided or invalid
- **403 Forbidden** - Not an admin user
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Get All Archived Punkts

```bash
curl -X GET "http://localhost:5000/api/admins/archive/punkts?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Search Archived Agents

```bash
curl -X GET "http://localhost:5000/api/admins/archive/agents?search=Ali&agentType=tuman" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Get Punkt Work History

```bash
curl -X GET "http://localhost:5000/api/admins/archive/punkts/507f1f77bcf86cd799439011/work" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Agent Work History

```bash
curl -X GET "http://localhost:5000/api/admins/archive/agents/507f1f77bcf86cd799439014/work" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Soft Delete:** Staff members are never permanently deleted. They are marked as deleted and moved to archive.

2. **Work Preservation:** All work history is preserved even after staff deletion. Orders, assignments, and confirmations remain linked to the archived staff member.

3. **Regular APIs:** Deleted staff members do not appear in regular API endpoints (e.g., `/api/admins/data/punkts`, `/api/admins/data/agents`).

4. **Replacement:** When a new staff member is hired to replace a deleted one, they are created as a new record. The old staff member's work history remains in archive.

5. **Order Limit:** Work history endpoints return up to 100 most recent orders. The `total` count shows the actual number of orders.

6. **Full Order Details:** All orders in work history include complete details (user, items, products, contragents, etc.) with full population.

7. **Statistics:** Work history includes comprehensive statistics (total orders, revenue, items, etc.) for quick analysis.

---

**Last Updated:** 2024-01-15










