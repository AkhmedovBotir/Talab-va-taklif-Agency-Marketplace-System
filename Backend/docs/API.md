# Complete API Documentation

This is the comprehensive API documentation for the Talab va Taklif Agency backend system. It includes all endpoints, request/response formats, authentication requirements, validation rules, and error codes.

---

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Admin APIs](#admin-apis)
4. [Region APIs](#region-apis)
5. [Contragent APIs](#contragent-apis)
6. [Agent APIs](#agent-apis)
7. [Punkt APIs](#punkt-apis)
8. [Category APIs](#category-apis)
9. [Product APIs](#product-apis)
10. [Marketplace APIs](#marketplace-apis)
11. [Order APIs](#order-apis)
12. [Payment APIs](#payment-apis)
13. [Notification APIs](#notification-apis)
14. [Review APIs](#review-apis)
15. [Finance APIs](#finance-apis)
17. [KPI APIs](#kpi-apis)
18. [Device Verification APIs](#device-verification-apis)
19. [Error Codes](#error-codes)
20. [Response Formats](#response-formats)

---

## Base Information

### Base URL
```
http://localhost:5000/api
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server ishlamoqda",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Format
- JWT tokens are issued after successful login
- Tokens contain user ID, type, and device ID (if applicable)
- Token expiration is set per user type

### User Types
- `Admin` - Admin users
- `Contragent` - Contragent users
- `Agent` - Agent users (viloyat/tuman/mfy)
- `Punkt` - Punkt users
- `MarketplaceUser` - Marketplace users

### Device Verification
Some user types (Admin, Contragent, Agent, Punkt) require device verification:
- Device ID must be in token
- Device must be active
- Device last activity is tracked

---

## Admin APIs

**Base Path:** `/api/admins`

### Authentication

#### Login Admin
```
POST /api/admins/login
```

**Request Body:**
```json
{
  "username": "string (required)",
  "parol": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "admin": {
    "_id": "string",
    "name": "string",
    "username": "string",
    "role": "general|admin",
    "telefonRaqam": "string",
    "status": "active|inactive",
    "permissions": ["array of strings"]
  }
}
```

---

### Admin Management

#### Create Admin
```
POST /api/admins
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 100)",
  "role": "general|admin (default: general)",
  "telefonRaqam": "string (required, phone format)",
  "username": "string (required, alphanum, min: 3, max: 30, lowercase)",
  "parol": "string (required, min: 6)",
  "status": "active|inactive (default: active)"
}
```

**Response:**
```json
{
  "success": true,
  "admin": { /* admin object */ }
}
```

#### Get All Admins
```
GET /api/admins
```

**Authentication:** Not required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (active/inactive)
- `role` - Filter by role (general/admin)
- `search` - Search by name or username

**Response:**
```json
{
  "success": true,
  "admins": [/* array of admin objects */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

#### Get Admin by ID
```
GET /api/admins/:id
```

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "admin": { /* admin object */ }
}
```

#### Update Admin
```
PUT /api/admins/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)
```json
{
  "name": "string (min: 2, max: 100)",
  "role": "general|admin",
  "telefonRaqam": "string (phone format)",
  "username": "string (alphanum, min: 3, max: 30, lowercase)",
  "parol": "string (min: 6)",
  "status": "active|inactive"
}
```

#### Delete Admin
```
DELETE /api/admins/:id
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Admin o'chirildi"
}
```

---

### Dashboard & Statistics

#### Dashboard Overview
```
GET /api/admins/dashboard/overview
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "overview": {
    "totalOrders": 1000,
    "totalUsers": 500,
    "totalProducts": 2000,
    "totalRevenue": 50000000,
    "todayOrders": 50,
    "todayRevenue": 2500000,
    "pendingProducts": 25,
    "pendingPartnershipRequests": 10
  }
}
```

#### Dashboard Statistics
```
GET /api/admins/dashboard/statistics
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `period` - Period type (daily/weekly/monthly/yearly)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "orders": { /* order statistics */ },
    "finance": { /* finance statistics */ },
    "users": { /* user statistics */ },
    "products": { /* product statistics */ }
  }
}
```

#### Daily Statistics
```
GET /api/admins/dashboard/statistics/daily
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `date` - Date (ISO format, default: today)

#### Weekly Statistics
```
GET /api/admins/dashboard/statistics/weekly
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `week` - Week number (1-52)
- `year` - Year (default: current year)

#### Monthly Statistics
```
GET /api/admins/dashboard/statistics/monthly
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `month` - Month (1-12)
- `year` - Year (default: current year)

#### Order Statistics
```
GET /api/admins/dashboard/statistics/orders
```

**Authentication:** Required (adminAuth)

#### Finance Statistics
```
GET /api/admins/dashboard/statistics/finance
```

**Authentication:** Required (adminAuth)

#### User Statistics
```
GET /api/admins/dashboard/statistics/users
```

**Authentication:** Required (adminAuth)

#### Product Statistics
```
GET /api/admins/dashboard/statistics/products
```

**Authentication:** Required (adminAuth)

---

### Category Management

#### Create Category
```
POST /api/admins/categories
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "name": "string (required, min: 2)",
  "image": "string (optional, base64 image)",
  "censored": "boolean (default: false)",
  "status": "active|inactive (default: active)"
}
```

#### Get All Categories
```
GET /api/admins/categories
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status
- `search` - Search by name
- `page` - Page number
- `limit` - Items per page

#### Get Category by ID
```
GET /api/admins/categories/:id
```

**Authentication:** Required (adminAuth)

#### Update Category
```
PUT /api/admins/categories/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)
```json
{
  "name": "string (min: 2)",
  "image": "string (base64 image)",
  "censored": "boolean",
  "status": "active|inactive"
}
```

#### Update Category Status
```
PUT /api/admins/categories/:id/status
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "status": "active|inactive (required)"
}
```

#### Delete Category
```
DELETE /api/admins/categories/:id
```

**Authentication:** Required (adminAuth)

#### Create Subcategory
```
POST /api/admins/categories/subcategories
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "name": "string (required, min: 2)",
  "parent": "string (required, category ID)",
  "status": "active|inactive (default: active)"
}
```

#### Get All Subcategories
```
GET /api/admins/categories/subcategories
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `parent` - Filter by parent category ID
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Update Subcategory
```
PUT /api/admins/categories/subcategories/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)
```json
{
  "name": "string (min: 2)",
  "parent": "string (category ID)",
  "status": "active|inactive"
}
```

#### Update Subcategory Status
```
PUT /api/admins/categories/subcategories/:id/status
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "status": "active|inactive (required)"
}
```

#### Delete Subcategory
```
DELETE /api/admins/categories/subcategories/:id
```

**Authentication:** Required (adminAuth)

---

### Admin Data Access

#### Get All Categories (for Admin)
```
GET /api/admins/data/categories
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status
- `search` - Search by name
- `page` - Page number
- `limit` - Items per page

#### Get All Subcategories (for Admin)
```
GET /api/admins/data/subcategories
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `parent` - Filter by parent category ID
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Get Category by ID (for Admin)
```
GET /api/admins/data/categories/:id
```

**Authentication:** Required (adminAuth)

#### Get All Products (for Admin)
```
GET /api/admins/data/products
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status (active/inactive/archived)
- `moderationStatus` - Filter by moderation status (pending/approved/rejected)
- `contragent` - Filter by contragent ID
- `category` - Filter by category ID
- `subcategory` - Filter by subcategory ID
- `search` - Search by name
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `page` - Page number
- `limit` - Items per page

#### Get Product by ID (for Admin)
```
GET /api/admins/data/products/:id
```

**Authentication:** Required (adminAuth)

#### Update Product
```
PUT /api/admins/products/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional, same as product update)

#### Get All SMS Verifications
```
GET /api/admins/data/sms-verifications
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `phone` - Filter by phone number
- `type` - Filter by type (register/login/forgot_password/etc.)
- `status` - Filter by status (pending/verified/expired)
- `page` - Page number
- `limit` - Items per page

#### Get SMS Verification by ID
```
GET /api/admins/data/sms-verifications/:id
```

**Authentication:** Required (adminAuth)

#### Get All Marketplace Users
```
GET /api/admins/data/marketplace-users
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status (active/inactive)
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `search` - Search by firstName, lastName, or phone
- `page` - Page number
- `limit` - Items per page

#### Get Marketplace User by ID
```
GET /api/admins/data/marketplace-users/:id
```

**Authentication:** Required (adminAuth)

#### Get All Orders (for Admin)
```
GET /api/admins/data/orders
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `paymentMethod` - Filter by payment method (cash/card)
- `orderNumber` - Filter by order number
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `minPrice` - Minimum total price
- `maxPrice` - Maximum total price
- `search` - Search in order number or customer info
- `viloyat` - Filter by delivery viloyat ID
- `tuman` - Filter by delivery tuman ID
- `mfy` - Filter by delivery MFY ID
- `page` - Page number
- `limit` - Items per page

#### Get Marketplace Orders
```
GET /api/admins/data/orders/marketplace
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Confirmed by Punkt
```
GET /api/admins/data/orders/confirmed-by-punkt
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Requested to Contragents
```
GET /api/admins/data/orders/requested-to-contragents
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Delivered to Punkt
```
GET /api/admins/data/orders/delivered-to-punkt
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Assigned to Agents
```
GET /api/admins/data/orders/assigned-to-agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Confirmed by Agents
```
GET /api/admins/data/orders/confirmed-by-agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Orders Confirmed by Customers
```
GET /api/admins/data/orders/confirmed-by-customers
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Cancelled Orders
```
GET /api/admins/data/orders/cancelled
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as Get All Orders)

#### Get Order by ID (for Admin)
```
GET /api/admins/data/orders/:id
```

**Authentication:** Required (adminAuth)

#### Get Agents in Region
```
GET /api/admins/data/agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `status` - Filter by status
- `agentType` - Filter by agent type (viloyat/tuman/mfy)
- `page` - Page number
- `limit` - Items per page

#### Get Punkts in Region
```
GET /api/admins/data/punkts
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

---

### Product Moderation

#### Get Pending Products
```
GET /api/admins/products/moderation/pending
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

#### Get Pending Product by ID
```
GET /api/admins/products/moderation/pending/:id
```

**Authentication:** Required (adminAuth)

#### Get All Products for Moderation
```
GET /api/admins/products/moderation
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `moderationStatus` - Filter by moderation status (pending/approved/rejected)
- `contragent` - Filter by contragent ID
- `page` - Page number
- `limit` - Items per page

#### Approve Product
```
POST /api/admins/products/moderation/:id/approve
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot tasdiqlandi",
  "product": { /* product object */ }
}
```

#### Reject Product
```
POST /api/admins/products/moderation/:id/reject
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "rejectionReason": "string (required, min: 1, max: 1000)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot rad etildi",
  "product": { /* product object */ }
}
```

---

### KPI Management

#### Create KPI Distribution
```
POST /api/admins/kpi/distributions
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "distribution": {
    "punkt": "number (0-100)",
    "viloyatAgent": "number (0-100)",
    "tumanAgent": "number (0-100)",
    "mfyAgent": "number (0-100)",
    "finance": "number (0-100)",
    "deliveryService": "number (0-100)",
    "punktTransfer": "number (0-100)"
  },
  "isActive": "boolean (default: false)",
  "description": "string (optional)"
}
```

**Note:** All distribution percentages should sum to 100.

#### Get All KPI Distributions
```
GET /api/admins/kpi/distributions
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `isActive` - Filter by active status
- `page` - Page number
- `limit` - Items per page

#### Get KPI Distribution by ID
```
GET /api/admins/kpi/distributions/:id
```

**Authentication:** Required (adminAuth)

#### Update KPI Distribution
```
PUT /api/admins/kpi/distributions/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)

#### Delete KPI Distribution
```
DELETE /api/admins/kpi/distributions/:id
```

**Authentication:** Required (adminAuth)

#### Get Initial KPI Distribution Defaults
```
GET /api/admins/kpi/distributions/initial/defaults
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "defaults": {
    "distribution": {
      "punkt": 20,
      "viloyatAgent": 15,
      "tumanAgent": 15,
      "mfyAgent": 20,
      "finance": 10,
      "deliveryService": 10,
      "punktTransfer": 10
    }
  }
}
```

#### Get All KPI Transactions
```
GET /api/admins/kpi/transactions
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `order` - Filter by order ID
- `isPaid` - Filter by paid status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get KPI Transaction by ID
```
GET /api/admins/kpi/transactions/:id
```

**Authentication:** Required (adminAuth)

#### Get KPI Statistics
```
GET /api/admins/kpi/statistics
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `groupBy` - Group by (agent/punkt/region)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalKpiAmount": 10000000,
    "totalPaid": 5000000,
    "totalUnpaid": 5000000,
    "byAgent": [/* agent statistics */],
    "byPunkt": [/* punkt statistics */],
    "byRegion": [/* region statistics */]
  }
}
```

#### Get Viloyat Agents KPI
```
GET /api/admins/kpi/data/viloyat-agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Tuman Agents KPI
```
GET /api/admins/kpi/data/tuman-agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `tuman` - Filter by tuman ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get MFY Agents KPI
```
GET /api/admins/kpi/data/mfy-agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `mfy` - Filter by MFY ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Punkts KPI
```
GET /api/admins/kpi/data/punkts
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Agent KPI Details
```
GET /api/admins/kpi/data/agents/:agentId
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Punkt KPI Details
```
GET /api/admins/kpi/data/punkts/:punktId
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

---

### Sales Statistics

#### Get Sales Statistics Summary
```
GET /api/admins/stats/sales/summary
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalSales": 100000000,
    "totalOrders": 5000,
    "averageOrderValue": 20000,
    "byViloyat": [/* viloyat statistics */],
    "byTuman": [/* tuman statistics */],
    "byMfy": [/* MFY statistics */]
  }
}
```

#### Get Sales Statistics by Viloyats
```
GET /api/admins/stats/sales/viloyats
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Sales Statistics by Viloyat ID
```
GET /api/admins/stats/sales/viloyats/:viloyatId
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Sales Statistics by Tuman ID
```
GET /api/admins/stats/sales/tumans/:tumanId
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Sales Statistics by MFY ID
```
GET /api/admins/stats/sales/mfys/:mfyId
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

---

### Featured Contragents

#### Get Featured Contragents (for Admin)
```
GET /api/admins/featured-contragents
```

**Authentication:** Required (adminAuth)

#### Update Featured Contragents
```
PUT /api/admins/featured-contragents
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "contragentIds": ["array of contragent IDs (required, can be empty array)"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Featured contragents yangilandi",
  "featuredContragents": [/* array of contragent objects */]
}
```

---

### Partnership Requests

#### Get All Partnership Requests
```
GET /api/admins/partnership-requests
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status (pending/approved/rejected)
- `contactStatus` - Filter by contact status (not_contacted/contacted/in_progress/completed)
- `page` - Page number
- `limit` - Items per page

#### Get Partnership Request by ID
```
GET /api/admins/partnership-requests/:id
```

**Authentication:** Required (adminAuth)

#### Update Contact Status
```
PATCH /api/admins/partnership-requests/:id/contact-status
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "contactStatus": "not_contacted|contacted|in_progress|completed (required)"
}
```

#### Update Request Status
```
PATCH /api/admins/partnership-requests/:id/status
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "status": "pending|approved|rejected (required)",
  "adminNotes": "string (optional, max: 1000)"
}
```

#### Convert Partnership Request to Contragent
```
POST /api/admins/partnership-requests/:id/convert-to-contragent
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Partnership request contragentga aylantirildi",
  "contragent": { /* contragent object */ }
}
```

---

### Marketplace Partnership Requests

#### Get All Marketplace Partnership Requests
```
GET /api/admins/marketplace-partnership-requests
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status (pending/reviewing/contacted/approved/rejected)
- `page` - Page number
- `limit` - Items per page

#### Get Marketplace Partnership Request by ID
```
GET /api/admins/marketplace-partnership-requests/:id
```

**Authentication:** Required (adminAuth)

#### Update Status to Reviewing
```
PATCH /api/admins/marketplace-partnership-requests/:id/reviewing
```

**Authentication:** Required (adminAuth)

#### Update Status to Contacted
```
PATCH /api/admins/marketplace-partnership-requests/:id/contacted
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "adminNotes": "string (optional, max: 1000)"
}
```

#### Approve Marketplace Partnership Request
```
PATCH /api/admins/marketplace-partnership-requests/:id/approve
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "adminNotes": "string (optional, max: 1000)"
}
```

#### Reject Marketplace Partnership Request
```
PATCH /api/admins/marketplace-partnership-requests/:id/reject
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "adminNotes": "string (required, max: 1000)"
}
```

#### Convert Marketplace Partnership Request to Contragent
```
POST /api/admins/marketplace-partnership-requests/:id/convert-to-contragent
```

**Authentication:** Required (adminAuth)

---

### Archive

#### Get Archived Punkts
```
GET /api/admins/archive/punkts
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `page` - Page number
- `limit` - Items per page

#### Get Archived Agents
```
GET /api/admins/archive/agents
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `agentType` - Filter by agent type
- `page` - Page number
- `limit` - Items per page

#### Get Archived Punkt with Work
```
GET /api/admins/archive/punkts/:id/work
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "punkt": { /* punkt object */ },
  "work": {
    "totalOrders": 100,
    "totalRevenue": 5000000,
    "orders": [/* order objects */]
  }
}
```

#### Get Archived Agent with Work
```
GET /api/admins/archive/agents/:id/work
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "agent": { /* agent object */ },
  "work": {
    "totalOrders": 50,
    "totalRevenue": 2500000,
    "orders": [/* order objects */]
  }
}
```

---

### Device Management

#### Get All Devices
```
GET /api/admins/devices
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `userModel` - Filter by user model (Admin/Contragent/Agent/Punkt)
- `userId` - Filter by user ID
- `isActive` - Filter by active status
- `page` - Page number
- `limit` - Items per page

#### Get Device Statistics
```
GET /api/admins/devices/statistics
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalDevices": 1000,
    "activeDevices": 800,
    "inactiveDevices": 200,
    "byUserType": {
      "Admin": 10,
      "Contragent": 200,
      "Agent": 300,
      "Punkt": 290
    }
  }
}
```

#### Get Device by ID
```
GET /api/admins/devices/:id
```

**Authentication:** Required (adminAuth)

#### Get User's Devices
```
GET /api/admins/devices/user/:userModel/:userId
```

**Authentication:** Required (adminAuth)

**Path Parameters:**
- `userModel` - User model (Admin/Contragent/Agent/Punkt)
- `userId` - User ID

#### Deactivate Device
```
PUT /api/admins/devices/:id/deactivate
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Qurilma nofaol qilindi",
  "device": { /* device object */ }
}
```

#### Activate Device
```
PUT /api/admins/devices/:id/activate
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Qurilma faollashtirildi",
  "device": { /* device object */ }
}
```

#### Delete Device
```
DELETE /api/admins/devices/:id
```

**Authentication:** Required (adminAuth)

---

## Region APIs

**Base Path:** `/api/regions`

### Create Region
```
POST /api/regions
```

**Request Body:**
```json
{
  "name": "string (required)",
  "type": "region|district|mfy (required)",
  "parent": "string (optional, parent region ID)",
  "code": "string (required)",
  "status": "active|inactive (default: active)"
}
```

### Get All Regions
```
GET /api/regions
```

**Query Parameters:**
- `type` - Filter by type (region/district/mfy)
- `parent` - Filter by parent ID
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

### Get Regions by Type
```
GET /api/regions/type/:type
```

**Path Parameters:**
- `type` - Region type (region/district/mfy)

**Query Parameters:**
- `status` - Filter by status
- `parent` - Filter by parent ID

### Get Region Children
```
GET /api/regions/:id/children
```

**Query Parameters:**
- `status` - Filter by status

### Get Region by ID
```
GET /api/regions/:id
```

### Update Region
```
PUT /api/regions/:id
```

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "type": "region|district|mfy",
  "parent": "string",
  "code": "string",
  "status": "active|inactive"
}
```

### Update Region Status
```
PATCH /api/regions/:id/status
```

**Request Body:**
```json
{
  "status": "active|inactive (required)"
}
```

### Delete Region
```
DELETE /api/regions/:id
```

---

## Contragent APIs

**Base Path:** `/api/contragents`

### Authentication

#### Password Setup Step 1
```
POST /api/contragents/password-setup/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS kod yuborildi",
  "expiresIn": 300
}
```

#### Password Setup Step 2
```
POST /api/contragents/password-setup/step2
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "code": "string (required, 5 digits)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod tasdiqlandi",
  "sessionToken": "session_token"
}
```

#### Password Setup Step 3
```
POST /api/contragents/password-setup/step3
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "newPassword": "string (required, min: 6)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Parol o'rnatildi",
  "contragent": { /* contragent object */ }
}
```

#### Login Contragent
```
POST /api/contragents/login
POST /api/contragents/auth/login
```

**Request Body:**
```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "contragent": { /* contragent object */ }
}
```

---

### Contragent Management

#### Get Current Contragent (Me)
```
GET /api/contragents/me
```

**Authentication:** Required (contragentAuth)

#### Update My Profile
```
PUT /api/contragents/me
```

**Authentication:** Required (contragentAuth)

**Request Body:** (all fields optional)
```json
{
  "name": "string (min: 2, max: 200)",
  "phone": "string (phone format)",
  "inn": "string (9 or 12 digits)",
  "viloyat": "string (viloyat ID)",
  "tuman": "string (tuman ID)",
  "mfy": "string (MFY ID)",
  "logo": "string (base64 image)"
}
```

#### Update Logo
```
PATCH /api/contragents/me/logo
```

**Authentication:** Required (contragentAuth)

**Request Body:**
```json
{
  "logo": "string (required, base64 image)"
}
```

#### Create Contragent
```
POST /api/contragents
```

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 200)",
  "inn": "string (required, 9 or 12 digits)",
  "viloyat": "string (required, viloyat ID)",
  "tuman": "string (required, tuman ID)",
  "mfy": "string (required, MFY ID)",
  "phone": "string (required, phone format)",
  "password": "string (required, min: 6)",
  "logo": "string (optional, base64 image)",
  "activityType": "string (required, contragent type ID)",
  "contragentLevel": "tuman|mfy (default: tuman)",
  "status": "active|inactive (default: active)"
}
```

**Notes:**
- `contragentLevel`: Kontragent darajasi - "tuman" (tuman kontragenti) yoki "mfy" (maxalla kontragenti)
- Tuman kontragentlari: Tuman darajasida ishlaydi
- Maxalla kontragentlari: MFY darajasida ishlaydi
- Har ikkala tur uchun ham viloyat, tuman va MFY maydonlari required

#### Get All Contragents
```
GET /api/contragents
```

**Query Parameters:**
- `status` - Filter by status
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `contragentLevel` - Filter by contragent level (tuman|mfy)
- `page` - Page number
- `limit` - Items per page

#### Get Contragent by ID
```
GET /api/contragents/:id
```

#### Update Contragent
```
PUT /api/contragents/:id
```

**Request Body:** (all fields optional, same as create)

#### Delete Contragent
```
DELETE /api/contragents/:id
```

---

### Contragent Notifications

#### Get Contragent Notifications
```
GET /api/contragents/notifications/list
```

**Authentication:** Required (contragentAuth)

**Query Parameters:**
- `read` - Filter by read status (true/false)
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

#### Get Unread Count
```
GET /api/contragents/notifications/unread-count
```

**Authentication:** Required (contragentAuth)

**Response:**
```json
{
  "success": true,
  "unreadCount": 5
}
```

#### Mark Notification as Read
```
POST /api/contragents/notifications/:notificationId/read
```

**Authentication:** Required (contragentAuth)

#### Mark All Notifications as Read
```
POST /api/contragents/notifications/read-all
```

**Authentication:** Required (contragentAuth)

---

### Contragent Payments

#### Get My Paid Payments
```
GET /api/contragents/payments/paid
```

**Authentication:** Required (contragentAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get My Unpaid Payments
```
GET /api/contragents/payments/unpaid
```

**Authentication:** Required (contragentAuth)

**Query Parameters:** (same as paid payments)

#### Get My Payment Statistics
```
GET /api/contragents/payments/statistics
```

**Authentication:** Required (contragentAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPaid": 10000000,
    "totalUnpaid": 5000000,
    "totalAmount": 15000000,
    "paidCount": 50,
    "unpaidCount": 25
  }
}
```

#### Get My Payment by ID
```
GET /api/contragents/payments/:id
```

**Authentication:** Required (contragentAuth)

---

## Contragent Order APIs

**Base Path:** `/api/contragent`

**Note:** All routes require contragent authentication.

### Get Orders for Contragent
```
GET /api/contragent/orders
```

**Query Parameters:**
- `status` - Filter by order status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

### Get Order by ID
```
GET /api/contragent/orders/:id
```

### Respond to Order Request
```
POST /api/contragent/orders/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted|rejected (required)",
  "notes": "string (optional)"
}
```

### Deliver Order to Punkt
```
POST /api/contragent/orders/:orderId/deliver-to-punkt
```

**Request Body:**
```json
{
  "deliveryNote": "string (optional)",
  "deliveredAt": "date (ISO format, optional, default: now)"
}
```

### Get Contragent Statistics
```
GET /api/contragent/statistics
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalOrders": 100,
    "acceptedOrders": 80,
    "rejectedOrders": 20,
    "deliveredOrders": 70,
    "totalRevenue": 35000000
  }
}
```

### Get Today's Orders
```
GET /api/contragent/today
```

### Get Order History
```
GET /api/contragent/history
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

---

## Agent APIs

**Base Path:** `/api/agents`

### Authentication

#### Password Setup Step 1
```
POST /api/agents/password-setup/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)"
}
```

#### Password Setup Step 2
```
POST /api/agents/password-setup/step2
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "code": "string (required, 5 digits)"
}
```

#### Password Setup Step 3
```
POST /api/agents/password-setup/step3
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "newPassword": "string (required, min: 6)"
}
```

#### Login Agent
```
POST /api/agents/login
```

**Request Body:**
```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "agent": { /* agent object */ }
}
```

---

### Agent Management

#### Create Agent
```
POST /api/agents
```

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 200)",
  "viloyat": "string (required, viloyat ID)",
  "tuman": "string (optional, tuman ID)",
  "mfy": "string (optional, MFY ID)",
  "phone": "string (required, phone format)",
  "password": "string (required, min: 6)",
  "status": "active|inactive (default: active)"
}
```

**Note:** Agent type is determined by which region fields are provided:
- Only `viloyat` → viloyat agent
- `viloyat` + `tuman` → tuman agent
- `viloyat` + `tuman` + `mfy` → MFY agent

#### Get Agents for Selection
```
GET /api/agents/selection
```

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `agentType` - Filter by agent type (viloyat/tuman/mfy)
- `status` - Filter by status (default: active)

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "_id": "string",
      "name": "string",
      "phone": "string",
      "viloyat": { /* region object */ },
      "tuman": { /* region object */ },
      "mfy": { /* region object */ }
    }
  ]
}
```

#### Get All Agents
```
GET /api/agents
```

**Query Parameters:**
- `status` - Filter by status
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `mfy` - Filter by MFY ID
- `agentType` - Filter by agent type (viloyat/tuman/mfy)
- `search` - Search by name or phone
- `page` - Page number
- `limit` - Items per page

#### Get Agent by ID
```
GET /api/agents/:id
```

#### Update Agent
```
PUT /api/agents/:id
```

**Request Body:** (all fields optional, same as create)

#### Delete Agent
```
DELETE /api/agents/:id
```

---

### Agent Notifications

#### Get Agent Notifications
```
GET /api/agents/notifications/list
```

**Authentication:** Required (agentAuth)

**Query Parameters:**
- `read` - Filter by read status
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

#### Get Unread Count
```
GET /api/agents/notifications/unread-count
```

**Authentication:** Required (agentAuth)

#### Mark Notification as Read
```
POST /api/agents/notifications/:notificationId/read
```

**Authentication:** Required (agentAuth)

#### Mark All Notifications as Read
```
POST /api/agents/notifications/read-all
```

**Authentication:** Required (agentAuth)

---

## Agent Order APIs

**Base Path:** `/api/agent`

**Note:** All routes require agent authentication.

### Get My Orders
```
GET /api/agent/orders
```

**Query Parameters:**
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

**Note:** Returns orders based on agent type:
- Viloyat agent: All orders in viloyat
- Tuman agent: All orders in tuman
- MFY agent: All orders in MFY

### Get Today's Orders
```
GET /api/agent/orders/today
```

### Get Order History
```
GET /api/agent/orders/history
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

### Get Order by ID
```
GET /api/agent/orders/:id
```

### Confirm Order by Agent
```
POST /api/agent/orders/:id/confirm
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Note:** Only MFY agents can confirm orders (customer confirmation).

### Mark Order as Delivered
```
POST /api/agent/orders/:id/delivered
```

**Request Body:**
```json
{
  "deliveryNote": "string (optional)",
  "deliveredAt": "date (ISO format, optional, default: now)"
}
```

**Note:** Only MFY agents can mark orders as delivered.

---

### Agent KPI

#### Get My KPI Summary
```
GET /api/agent/kpi/summary
```

**Authentication:** Required (agentAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalKpiAmount": 5000000,
    "paidAmount": 3000000,
    "unpaidAmount": 2000000,
    "totalTransactions": 100,
    "paidTransactions": 60,
    "unpaidTransactions": 40
  }
}
```

#### Get My KPI Transactions
```
GET /api/agent/kpi/transactions
```

**Authentication:** Required (agentAuth)

**Query Parameters:**
- `isPaid` - Filter by paid status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get My KPI Daily Balance
```
GET /api/agent/kpi/balance
```

**Authentication:** Required (agentAuth)

**Query Parameters:**
- `date` - Date (ISO format, default: today)

**Response:**
```json
{
  "success": true,
  "balance": {
    "date": "2024-01-01",
    "totalKpiAmount": 100000,
    "paidAmount": 50000,
    "unpaidAmount": 50000
  }
}
```

#### Get My KPI Daily Report
```
GET /api/agent/kpi/reports/daily
```

**Authentication:** Required (agentAuth)

**Query Parameters:**
- `date` - Date (ISO format, default: today)

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-01",
    "totalOrders": 10,
    "totalKpiAmount": 100000,
    "transactions": [/* transaction objects */]
  }
}
```

---

## Punkt APIs

**Base Path:** `/api/punkts`

### Authentication

#### Password Setup Step 1
```
POST /api/punkts/password-setup/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)"
}
```

#### Password Setup Step 2
```
POST /api/punkts/password-setup/step2
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "code": "string (required, 5 digits)"
}
```

#### Password Setup Step 3
```
POST /api/punkts/password-setup/step3
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "newPassword": "string (required, min: 6)"
}
```

#### Login Punkt
```
POST /api/punkts/login
```

**Request Body:**
```json
{
  "phone": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "punkt": { /* punkt object */ }
}
```

---

### Punkt Management

#### Create Punkt
```
POST /api/punkts
```

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 200)",
  "phone": "string (required, phone format)",
  "password": "string (required, min: 6)",
  "viloyat": "string (required, viloyat ID)",
  "tuman": "string (optional, tuman ID)",
  "status": "active|inactive (default: active)"
}
```

#### Get Punkts for Selection
```
GET /api/punkts/selection
```

**Query Parameters:**
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `status` - Filter by status (default: active)

**Response:**
```json
{
  "success": true,
  "punkts": [
    {
      "_id": "string",
      "name": "string",
      "phone": "string",
      "viloyat": { /* region object */ },
      "tuman": { /* region object */ }
    }
  ]
}
```

#### Get All Punkts
```
GET /api/punkts
```

**Query Parameters:**
- `status` - Filter by status
- `viloyat` - Filter by viloyat ID
- `tuman` - Filter by tuman ID
- `search` - Search by name or phone
- `page` - Page number
- `limit` - Items per page

#### Get Punkt by ID
```
GET /api/punkts/:id
```

#### Update Punkt
```
PUT /api/punkts/:id
```

**Request Body:** (all fields optional, same as create)

#### Delete Punkt
```
DELETE /api/punkts/:id
```

#### Get Contragents in Region
```
GET /api/punkts/data/contragents
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `status` - Filter by status (default: active)
- `search` - Search by name or INN

---

### Punkt Notifications

#### Get Punkt Notifications
```
GET /api/punkts/notifications/list
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `read` - Filter by read status
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

#### Get Unread Count
```
GET /api/punkts/notifications/unread-count
```

**Authentication:** Required (punktAuth)

#### Mark Notification as Read
```
POST /api/punkts/notifications/:notificationId/read
```

**Authentication:** Required (punktAuth)

#### Mark All Notifications as Read
```
POST /api/punkts/notifications/read-all
```

**Authentication:** Required (punktAuth)

---

## Punkt Order APIs

**Base Path:** `/api/punkt`

**Note:** All routes require punkt authentication.

### Get My Orders
```
GET /api/punkt/orders
```

**Query Parameters:**
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `paymentMethod` - Filter by payment method (cash/card)
- `orderNumber` - Filter by order number
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `minPrice` - Minimum total price
- `maxPrice` - Maximum total price
- `search` - Search in order number
- `page` - Page number
- `limit` - Items per page

### Get Today's Orders
```
GET /api/punkt/orders/today
```

### Get Order History
```
GET /api/punkt/orders/history
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

### Get Order by ID
```
GET /api/punkt/orders/:id
```

### Get Contragent IDs from Order
```
GET /api/punkt/orders/:id/contragents
```

**Response:**
```json
{
  "success": true,
  "contragentIds": ["contragent_id_1", "contragent_id_2"]
}
```

### Confirm Order
```
POST /api/punkt/orders/:id/confirm
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Note:** Changes order status to `confirmed_by_punkt`.

### Assign Order to Agent
```
POST /api/punkt/orders/:id/assign-to-agent
```

**Request Body:**
```json
{
  "agentId": "string (required, agent ID)"
}
```

### Request to Contragent
```
POST /api/punkt/orders/:id/request-to-contragent
```

**Request Body:**
```json
{
  "contragentId": "string (required, contragent ID)",
  "items": [
    {
      "productId": "string (required)",
      "quantity": "number (required, min: 1)"
    }
  ],
  "notes": "string (optional)"
}
```

### Request to Punkt
```
POST /api/punkt/orders/:id/request-to-punkt
```

**Request Body:**
```json
{
  "toPunktId": "string (required, punkt ID)",
  "items": [
    {
      "productId": "string (required)",
      "quantity": "number (required, min: 1)"
    }
  ],
  "notes": "string (optional)"
}
```

### Request to Punkts (Multiple)
```
POST /api/punkt/orders/:id/request-to-punkts
```

**Request Body:**
```json
{
  "punktIds": ["string (required, array of punkt IDs)"],
  "items": [
    {
      "productId": "string (required)",
      "quantity": "number (required, min: 1)"
    }
  ],
  "notes": "string (optional)"
}
```

### Send to Punkt
```
POST /api/punkt/orders/:id/send-to-punkt
```

**Request Body:**
```json
{
  "toPunktId": "string (required, punkt ID)",
  "notes": "string (optional)"
}
```

**Note:** Sends order from current punkt to another punkt.

### Receive from Punkt
```
POST /api/punkt/orders/:id/receive-from-punkt
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Note:** Receives order from another punkt.

### Receive from Contragent
```
POST /api/punkt/orders/:id/receive-from-contragent
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Note:** Receives order from contragent.

### Get Punkt to Punkt Requests
```
GET /api/punkt/punkt-to-punkt-requests
```

**Query Parameters:**
- `status` - Filter by status (pending/accepted/rejected/delivered)
- `page` - Page number
- `limit` - Items per page

### Respond to Punkt to Punkt Request
```
POST /api/punkt/punkt-to-punkt-requests/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted|rejected (required)",
  "notes": "string (optional)"
}
```

### Get Requests to My Punkt
```
GET /api/punkt/requests
```

**Query Parameters:**
- `status` - Filter by status (pending/accepted/rejected)
- `page` - Page number
- `limit` - Items per page

### Respond to Request
```
POST /api/punkt/requests/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted|rejected (required)",
  "notes": "string (optional)"
}
```

---

### Punkt KPI

#### Get My KPI Summary
```
GET /api/punkt/kpi/summary
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get My KPI Transactions
```
GET /api/punkt/kpi/transactions
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `isPaid` - Filter by paid status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get My KPI Daily Balance
```
GET /api/punkt/kpi/balance
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `date` - Date (ISO format, default: today)

#### Get My KPI Daily Report
```
GET /api/punkt/kpi/reports/daily
```

**Authentication:** Required (punktAuth)

**Query Parameters:**
- `date` - Date (ISO format, default: today)

---

## Category APIs

**Base Path:** `/api/category`

### Get All Categories
```
GET /api/category/list
```

**Authentication:** Optional (optionalContragentAuth)

**Query Parameters:**
- `status` - Filter by status (default: active)
- `search` - Search by name

**Response:**
```json
{
  "success": true,
  "categories": [/* category objects */]
}
```

### Get Category by ID
```
GET /api/category/:id
```

**Authentication:** Optional (optionalContragentAuth)

### Get All Subcategories
```
GET /api/category/subcategory/list
```

**Authentication:** Optional (optionalContragentAuth)

**Query Parameters:**
- `parent` - Filter by parent category ID
- `status` - Filter by status (default: active)

---

## Product APIs

**Base Path:** `/api/product`

### Create Product
```
POST /api/product/create
```

**Authentication:** Required (contragentAuth)

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 500)",
  "description": "object|string (optional, Delta format or string)",
  "price": "number (required, min: 0)",
  "originalPrice": "number (required, min: 0)",
  "images": ["array of strings (max: 5, base64 images)"],
  "category": "string (required, category ID)",
  "subcategory": "string (optional, subcategory ID)",
  "quantity": "number (required, min: 0)",
  "unit": "dona|litr|kg (required)",
  "unitSize": "number (optional, min: 0)",
  "length": "number (optional, min: 0)",
  "width": "number (optional, min: 0)",
  "weight": "number (optional, min: 0)",
  "status": "active|inactive|archived (default: active)",
  "deliveryRegions": [
    {
      "viloyat": "string (required, viloyat ID)",
      "tuman": "string (optional, tuman ID)"
    }
  ],
  "kpiBonusPercent": "number (required, min: 0, max: 100)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot yaratildi va moderatsiyaga yuborildi",
  "product": { /* product object */ }
}
```

**Note:** Product is created with `moderationStatus: 'pending'` and must be approved by admin.

### Get My Products
```
GET /api/product/my
```

**Authentication:** Required (contragentAuth)

**Query Parameters:**
- `status` - Filter by status
- `moderationStatus` - Filter by moderation status
- `page` - Page number
- `limit` - Items per page

### Get All Products
```
GET /api/product/list
```

**Query Parameters:**
- `status` - Filter by status (default: active)
- `moderationStatus` - Filter by moderation status (default: approved)
- `contragent` - Filter by contragent ID
- `category` - Filter by category ID
- `subcategory` - Filter by subcategory ID
- `search` - Search by name
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `viloyat` - Filter by delivery viloyat ID
- `tuman` - Filter by delivery tuman ID
- `page` - Page number
- `limit` - Items per page

### Get Product by ID
```
GET /api/product/:id
```

### Update Product
```
PUT /api/product/:id
```

**Authentication:** Required (contragentAuth, only owner)

**Request Body:** (all fields optional, same as create)

**Note:** If product is pending moderation, update will reset moderation status to pending.

### Update Product Status
```
PUT /api/product/:id/status
```

**Authentication:** Required (contragentAuth, only owner)

**Request Body:**
```json
{
  "status": "active|inactive|archived (required)"
}
```

### Delete Product
```
DELETE /api/product/:id
```

**Authentication:** Required (contragentAuth, only owner)

---

## Marketplace APIs

**Base Path:** `/api/marketplace`

### Authentication

#### Check Phone Exists
```
GET /api/marketplace/check-phone?phone=998901234567
```

**Query Parameters:**
- `phone` - Phone number (required)

**Response:**
```json
{
  "success": true,
  "exists": true|false
}
```

#### Register Step 1
```
POST /api/marketplace/register/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS kod yuborildi",
  "expiresIn": 300
}
```

#### Register Step 2
```
POST /api/marketplace/register/step2
```

**Request Body:**
```json
{
  "firstName": "string (required, min: 2, max: 50)",
  "lastName": "string (required, min: 2, max: 50)",
  "phone": "string (required, phone format)",
  "gender": "ayol|erkak (required)",
  "viloyat": "string (required, viloyat ID)",
  "tuman": "string (required, tuman ID)",
  "mfy": "string (required, MFY ID)",
  "birthDate": "date (required, ISO format)",
  "password": "string (required, min: 6)",
  "code": "string (required, 5 digits)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { /* marketplace user object */ }
}
```

#### Login Step 1
```
POST /api/marketplace/login/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS kod yuborildi",
  "expiresIn": 300
}
```

#### Login Step 2
```
POST /api/marketplace/login/step2
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "code": "string (required, 5 digits)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { /* marketplace user object */ }
}
```

#### Forgot Password Step 1
```
POST /api/marketplace/forgot-password/step1
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)"
}
```

#### Forgot Password Step 2
```
POST /api/marketplace/forgot-password/step2
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "code": "string (required, 5 digits)",
  "newPassword": "string (required, min: 6)"
}
```

#### Resend SMS Code
```
POST /api/marketplace/resend-code
```

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "type": "login|register|forgot_password (required)"
}
```

---

### Marketplace Data

#### Search
```
GET /api/marketplace/search?q=search_term
```

**Query Parameters:**
- `q` - Search query (required)
- `category` - Filter by category ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `page` - Page number
- `limit` - Items per page

#### Filter Products
```
GET /api/marketplace/filter
```

**Query Parameters:**
- `category` - Filter by category ID
- `subcategory` - Filter by subcategory ID
- `contragent` - Filter by contragent ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `viloyat` - Filter by delivery viloyat ID
- `tuman` - Filter by delivery tuman ID
- `sortBy` - Sort by (price_asc/price_desc/newest/popular)
- `page` - Page number
- `limit` - Items per page

#### Get All Products
```
GET /api/marketplace/products
```

**Query Parameters:** (same as Filter Products)

#### Get Product by ID
```
GET /api/marketplace/products/:id
```

#### Get All Categories
```
GET /api/marketplace/categories
```

#### Get Products by Category
```
GET /api/marketplace/categories/:id/products
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

#### Get Category by ID
```
GET /api/marketplace/categories/:id
```

#### Get All Contragents
```
GET /api/marketplace/contragents
```

**Query Parameters:**
- `status` - Filter by status (default: active)
- `search` - Search by name
- `page` - Page number
- `limit` - Items per page

#### Get Contragent by ID
```
GET /api/marketplace/contragents/:id
```

#### Get Featured Contragents
```
GET /api/marketplace/featured-contragents
```

**Response:**
```json
{
  "success": true,
  "contragents": [/* array of contragent objects with short info */]
}
```

---

### Cart Management

#### Get Cart
```
GET /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

**Response:**
```json
{
  "success": true,
  "cart": {
    "_id": "string",
    "user": "string",
    "items": [
      {
        "product": { /* product object */ },
        "quantity": "number",
        "addedAt": "date"
      }
    ],
    "totalPrice": "number",
    "totalItems": "number",
    "updatedAt": "date"
  }
}
```

#### Add to Cart
```
POST /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "productId": "string (required)",
  "quantity": "number (optional, default: 1, min: 1)"
}
```

#### Update Cart Item
```
PUT /api/marketplace/cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "quantity": "number (required, min: 1)"
}
```

#### Remove from Cart
```
DELETE /api/marketplace/cart/:productId
```

**Authentication:** Required (marketplaceUserAuth)

#### Clear Cart
```
DELETE /api/marketplace/cart
```

**Authentication:** Required (marketplaceUserAuth)

---

### Order Management

#### Create Order
```
POST /api/marketplace/orders
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "paymentMethod": "cash|card (required)",
  "deliveryViloyat": "string (required, viloyat ID)",
  "deliveryTuman": "string (optional, tuman ID)",
  "deliveryMfy": "string (optional, MFY ID)",
  "deliveryNote": "string (optional, max: 1000)",
  "phoneNumber": "string (optional, phone format)",
  "clearCart": "boolean (default: true)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yaratildi",
  "order": { /* order object */ }
}
```

#### Get Orders
```
GET /api/marketplace/orders
```

**Authentication:** Required (marketplaceUserAuth)

**Query Parameters:**
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get Order by ID
```
GET /api/marketplace/orders/:id
```

**Authentication:** Required (marketplaceUserAuth)

#### Cancel Order
```
DELETE /api/marketplace/orders/:id
```

**Authentication:** Required (marketplaceUserAuth)

**Note:** Only orders with status `pending` or `confirmed_by_punkt` can be cancelled.

#### Confirm Delivery
```
POST /api/marketplace/orders/:id/confirm-delivery
```

**Authentication:** Required (marketplaceUserAuth)

**Note:** Changes order status to `confirmed_by_customer`.

---

### Profile Management

#### Get Me
```
GET /api/marketplace/me
```

**Authentication:** Required (marketplaceUserAuth)

#### Update Profile
```
PUT /api/marketplace/me
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:** (all fields optional)
```json
{
  "firstName": "string (min: 2, max: 50)",
  "lastName": "string (min: 2, max: 50)",
  "gender": "ayol|erkak",
  "birthDate": "date (ISO format)"
}
```

#### Update Password
```
PATCH /api/marketplace/me/password
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min: 6)"
}
```

#### Update Avatar
```
PATCH /api/marketplace/me/avatar
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "avatar": "string (required, base64 image)"
}
```

#### Update Location
```
PATCH /api/marketplace/me/location
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "viloyat": "string (viloyat ID)",
  "tuman": "string (tuman ID)",
  "mfy": "string (MFY ID)"
}
```

#### Get Viloyat Tuman
```
GET /api/marketplace/me/viloyat-tuman
```

**Authentication:** Required (marketplaceUserAuth)

**Response:**
```json
{
  "success": true,
  "viloyat": { /* region object */ },
  "tuman": { /* region object */ }
}
```

#### Update Viloyat Tuman
```
PATCH /api/marketplace/me/viloyat-tuman
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "viloyat": "string (viloyat ID)",
  "tuman": "string (optional, tuman ID)"
}
```

---

### Notifications

#### Get Marketplace Notifications
```
GET /api/marketplace/notifications/list
```

**Authentication:** Required (marketplaceUserAuth)

**Query Parameters:**
- `read` - Filter by read status
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

#### Get Unread Count
```
GET /api/marketplace/notifications/unread-count
```

**Authentication:** Required (marketplaceUserAuth)

#### Mark Notification as Read
```
POST /api/marketplace/notifications/:notificationId/read
```

**Authentication:** Required (marketplaceUserAuth)

#### Mark All Notifications as Read
```
POST /api/marketplace/notifications/read-all
```

**Authentication:** Required (marketplaceUserAuth)

---

### Partnership Requests

#### Create Partnership Request
```
POST /api/marketplace/partnership-requests
```

**Authentication:** Optional (optionalMarketplaceUserAuth)

**Request Body:**
```json
{
  "companyName": "string (required, min: 2, max: 200)",
  "inn": "string (required, 9 or 12 digits)",
  "mfo": "string (required)",
  "accountNumber": "string (required)",
  "viloyat": "string (required, viloyat ID)",
  "tuman": "string (required, tuman ID)",
  "mfy": "string (required, MFY ID)",
  "activityType": "string (required, contragent type ID)",
  "managerFirstName": "string (required, min: 2, max: 50)",
  "managerLastName": "string (required, min: 2, max: 50)",
  "managerPhone": "string (required, phone format)"
}
```

#### Get My Partnership Requests
```
GET /api/marketplace/partnership-requests
```

**Authentication:** Required (marketplaceUserAuth)

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

---

### Marketplace Partnership Requests (New System)

#### Create Marketplace Partnership Request
```
POST /api/marketplace/marketplace-partnership-requests
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:** (same as Create Partnership Request)

#### Get My Marketplace Partnership Requests
```
GET /api/marketplace/marketplace-partnership-requests
```

**Authentication:** Required (marketplaceUserAuth)

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Get My Marketplace Partnership Request by ID
```
GET /api/marketplace/marketplace-partnership-requests/:id
```

**Authentication:** Required (marketplaceUserAuth)

---

## Payment APIs

**Base Path:** `/api/payment`

### Pay Order
```
POST /api/payment/orders/:orderId/pay
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "paymentMethod": "cash|card (required)",
  "amount": "number (required, must match order total)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli amalga oshirildi",
  "payment": { /* payment transaction object */ },
  "order": { /* updated order object */ }
}
```

### Get Payment Status
```
GET /api/payment/orders/:orderId/payment-status
```

**Authentication:** Required (marketplaceUserAuth)

**Response:**
```json
{
  "success": true,
  "paymentStatus": "pending|paid|failed",
  "payment": { /* payment transaction object */ }
}
```

---

## Notification APIs

**Base Path:** `/api/notifications`

### Admin Routes

#### Create Notification
```
POST /api/notifications
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "title": "string (required)",
  "message": "string (required)",
  "type": "info|warning|success|error|announcement|promotion|update (required)",
  "targetType": "all|punkts|viloyat_agents|tuman_agents|mfy_agents|marketplace_users|contragents (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xabar yuborildi",
  "notification": { /* notification object */ },
  "sentCount": 1000
}
```

#### Get All Notifications
```
GET /api/notifications
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `targetType` - Filter by target type
- `type` - Filter by notification type
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

#### Get Notification Statistics
```
GET /api/notifications/stats
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalNotifications": 1000,
    "byType": {
      "info": 200,
      "warning": 150,
      "success": 300,
      "error": 50,
      "announcement": 100,
      "promotion": 150,
      "update": 50
    },
    "byTargetType": {
      "all": 500,
      "punkts": 100,
      "agents": 200,
      "marketplace_users": 200
    }
  }
}
```

#### Get Notification by ID
```
GET /api/notifications/:id
```

**Authentication:** Required (adminAuth)

#### Update Notification
```
PUT /api/notifications/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)

#### Delete Notification
```
DELETE /api/notifications/:id
```

**Authentication:** Required (adminAuth)

---

### User Routes

#### Get My Notifications
```
GET /api/notifications/my/:userType/:userId
```

**Path Parameters:**
- `userType` - User type (punkt/agent/marketplace_user/etc.)
- `userId` - User ID

**Query Parameters:**
- `read` - Filter by read status
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

#### Mark as Read
```
POST /api/notifications/:notificationId/read
```

**Request Body:**
```json
{
  "userType": "string (required)",
  "userId": "string (required)"
}
```

---

## Review APIs

**Base Path:** `/api/reviews`

### Public Routes

#### Get Active Templates
```
GET /api/reviews/templates
```

**Response:**
```json
{
  "success": true,
  "templates": [/* comment template objects */]
}
```

#### Get Product Reviews
```
GET /api/reviews/product/:productId
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "success": true,
  "reviews": [/* review objects */],
  "pagination": { /* pagination object */ }
}
```

---

### Marketplace User Routes

#### Create Review
```
POST /api/reviews
```

**Authentication:** Required (marketplaceUserAuth)

**Request Body:**
```json
{
  "productId": "string (required)",
  "rating": "number (required, 1-5)",
  "comment": "string (optional)",
  "commentTemplate": "string (optional, template ID)",
  "contact": {
    "type": "positive|negative (required)",
    "phone": "string (required, phone format)",
    "notes": "string (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sharh yaratildi",
  "review": { /* review object */ }
}
```

---

### Admin Routes

#### Create Comment Template
```
POST /api/reviews/admin/comment-templates
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "text": "string (required)",
  "type": "positive|negative (required)",
  "status": "active|inactive (default: active)"
}
```

#### Get All Comment Templates
```
GET /api/reviews/admin/comment-templates
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `type` - Filter by type
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Get Comment Template by ID
```
GET /api/reviews/admin/comment-templates/:id
```

**Authentication:** Required (adminAuth)

#### Update Comment Template
```
PUT /api/reviews/admin/comment-templates/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)

#### Delete Comment Template
```
DELETE /api/reviews/admin/comment-templates/:id
```

**Authentication:** Required (adminAuth)

---

#### Create Initial Templates
```
POST /api/reviews/admin/initial-templates
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "message": "Boshlang'ich shablonlar yaratildi",
  "templates": [/* template objects */]
}
```

---

#### Get Contact Statistics
```
GET /api/reviews/admin/contacts/statistics
```

**Authentication:** Required (adminAuth)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalContacts": 1000,
    "positiveContacts": 700,
    "negativeContacts": 300,
    "byStatus": {
      "pending": 100,
      "contacted": 500,
      "resolved": 400
    }
  }
}
```

#### Get Positive Contacts
```
GET /api/reviews/admin/contacts/positive
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Get Negative Contacts
```
GET /api/reviews/admin/contacts/negative
```

**Authentication:** Required (adminAuth)

**Query Parameters:** (same as positive contacts)

#### Get All Contacts
```
GET /api/reviews/admin/contacts
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `type` - Filter by type (positive/negative)
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### Get Contact by ID
```
GET /api/reviews/admin/contacts/:id
```

**Authentication:** Required (adminAuth)

#### Update Contact Status
```
PUT /api/reviews/admin/contacts/:id/status
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "status": "pending|contacted|resolved (required)"
}
```

---

#### Get All Reviews (Admin)
```
GET /api/reviews/admin
```

**Authentication:** Required (adminAuth)

**Query Parameters:**
- `productId` - Filter by product ID
- `rating` - Filter by rating (1-5)
- `page` - Page number
- `limit` - Items per page

#### Get Review by ID (Admin)
```
GET /api/reviews/admin/:id
```

**Authentication:** Required (adminAuth)

---

## Finance APIs

### Agent Finance APIs

**Base Path:** `/api/agent-finance`

**Note:** All routes require agent authentication.

#### MFY Agent Routes

##### Get MFY Daily Report
```
GET /api/agent-finance/mfy/daily-report
```

**Query Parameters:**
- `date` - Date (ISO format, default: today)

**Response:**
```json
{
  "success": true,
  "report": {
    "date": "2024-01-01",
    "totalCollected": 5000000,
    "totalTransactions": 50,
    "transactions": [/* transaction objects */]
  }
}
```

##### Get MFY Pending Payments
```
GET /api/agent-finance/mfy/pending-payments
```

**Response:**
```json
{
  "success": true,
  "payments": [/* payment transaction objects */],
  "totalAmount": 2000000
}
```

##### Collect Payment
```
POST /api/agent-finance/mfy/collect-payment/:transactionId
```

**Request Body:**
```json
{
  "amount": "number (required)",
  "notes": "string (optional)"
}
```

##### Submit to District
```
POST /api/agent-finance/mfy/submit-to-district
```

**Request Body:**
```json
{
  "date": "date (ISO format, required)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Topshiruv yaratildi",
  "submission": { /* finance submission object */ }
}
```

##### Get MFY Statistics
```
GET /api/agent-finance/mfy/statistics
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

---

#### Tuman Agent Routes

##### Get District Report
```
GET /api/agent-finance/district/report
```

**Query Parameters:**
- `date` - Date (ISO format, default: today)

##### Get District Submissions
```
GET /api/agent-finance/district/submissions
```

**Query Parameters:**
- `status` - Filter by status (pending/confirmed/rejected)
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

##### Confirm District Submission
```
POST /api/agent-finance/district/confirm-submission/:submissionId
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

##### Submit to Province
```
POST /api/agent-finance/district/submit-to-province
```

**Request Body:**
```json
{
  "date": "date (ISO format, required)",
  "notes": "string (optional)"
}
```

##### Get District Statistics
```
GET /api/agent-finance/district/statistics
```

---

#### Viloyat Agent Routes

##### Get Province Report
```
GET /api/agent-finance/province/report
```

**Query Parameters:**
- `date` - Date (ISO format, default: today)

##### Get Province Submissions
```
GET /api/agent-finance/province/submissions
```

**Query Parameters:** (same as district submissions)

##### Confirm Province Submission
```
POST /api/agent-finance/province/confirm-submission/:submissionId
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

##### Submit to Finance
```
POST /api/agent-finance/province/submit-to-finance
```

**Request Body:**
```json
{
  "date": "date (ISO format, required)",
  "notes": "string (optional)"
}
```

##### Get Province Statistics
```
GET /api/agent-finance/province/statistics
```

---

### Admin Finance APIs

**Base Path:** `/api/admin-finance`

**Note:** All routes require admin authentication.

#### Reports

##### Get Daily Report
```
GET /api/admin-finance/reports/daily
```

**Query Parameters:**
- `date` - Date (ISO format, default: today)

##### Get Weekly Report
```
GET /api/admin-finance/reports/weekly
```

**Query Parameters:**
- `week` - Week number (1-52)
- `year` - Year (default: current year)

##### Get Monthly Report
```
GET /api/admin-finance/reports/monthly
```

**Query Parameters:**
- `month` - Month (1-12)
- `year` - Year (default: current year)

##### Get Yearly Report
```
GET /api/admin-finance/reports/yearly
```

**Query Parameters:**
- `year` - Year (default: current year)

##### Get Custom Report
```
GET /api/admin-finance/reports/custom
```

**Query Parameters:**
- `startDate` - Start date (ISO format, required)
- `endDate` - End date (ISO format, required)

---

#### Submissions

##### Get Pending Submissions
```
GET /api/admin-finance/submissions/pending
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

##### Confirm Submission
```
POST /api/admin-finance/submissions/:submissionId/confirm
```

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

##### Reject Submission
```
POST /api/admin-finance/submissions/:submissionId/reject
```

**Request Body:**
```json
{
  "rejectionReason": "string (required)",
  "notes": "string (optional)"
}
```

---

#### Transactions

##### Get All Transactions
```
GET /api/admin-finance/transactions
```

**Query Parameters:**
- `type` - Filter by type
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `page` - Page number
- `limit` - Items per page

---

#### Statistics

##### Get Statistics
```
GET /api/admin-finance/statistics
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

##### Get Statistics by Region
```
GET /api/admin-finance/statistics/region
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

##### Get Statistics by District
```
GET /api/admin-finance/statistics/district
```

**Query Parameters:** (same as region)

##### Get Statistics by MFY
```
GET /api/admin-finance/statistics/mfy
```

**Query Parameters:** (same as region)

##### Get Agent Performance
```
GET /api/admin-finance/statistics/agent-performance
```

**Query Parameters:**
- `agentId` - Filter by agent ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

---

#### Finance Balances

##### Get Finance Balance
```
GET /api/admin-finance/balance
```

**Response:**
```json
{
  "success": true,
  "balance": {
    "totalReceived": 100000000,
    "totalDistributed": 50000000,
    "financeKpiAmount": 10000000,
    "deliveryServiceKpiAmount": 5000000,
    "totalBalance": 50000000
  }
}
```

##### Get Total Received
```
GET /api/admin-finance/balance/total-received
```

##### Get Total Distributed
```
GET /api/admin-finance/balance/total-distributed
```

##### Get Finance KPI Amount
```
GET /api/admin-finance/balance/finance-kpi
```

##### Get Delivery Service KPI Amount
```
GET /api/admin-finance/balance/delivery-service-kpi
```

##### Get Total Balance
```
GET /api/admin-finance/balance/total-balance
```

---

## KPI Payment APIs

### Admin KPI Payment APIs

**Base Path:** `/api/admin-kpi-payments`

**Note:** All routes require admin authentication.

#### Get Unpaid Payments
```
GET /api/admin-kpi-payments/unpaid
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `agentId` - Filter by agent ID
- `punktId` - Filter by punkt ID
- `page` - Page number
- `limit` - Items per page

#### Get Unpaid Payments Grouped
```
GET /api/admin-kpi-payments/unpaid/grouped
```

**Query Parameters:** (same as unpaid payments)

**Response:**
```json
{
  "success": true,
  "grouped": {
    "byAgent": [
      {
        "agent": { /* agent object */ },
        "totalAmount": 5000000,
        "transactionCount": 50
      }
    ],
    "byPunkt": [
      {
        "punkt": { /* punkt object */ },
        "totalAmount": 3000000,
        "transactionCount": 30
      }
    ]
  }
}
```

#### Mark Payments as Paid
```
POST /api/admin-kpi-payments/mark-as-paid
```

**Request Body:**
```json
{
  "paymentIds": ["array of payment IDs (required)"],
  "paidAt": "date (ISO format, optional, default: now)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar to'landi deb belgilandi",
  "updatedCount": 10
}
```

#### Get Payment Statistics
```
GET /api/admin-kpi-payments/statistics
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalUnpaid": 50000000,
    "totalPaid": 100000000,
    "totalAmount": 150000000,
    "unpaidCount": 500,
    "paidCount": 1000
  }
}
```

#### Get Paid Payments
```
GET /api/admin-kpi-payments/paid
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `agentId` - Filter by agent ID
- `punktId` - Filter by punkt ID
- `page` - Page number
- `limit` - Items per page

#### Sync KPI Payments
```
POST /api/admin-kpi-payments/sync
```

**Response:**
```json
{
  "success": true,
  "message": "KPI to'lovlari sinxronlashtirildi",
  "created": 50,
  "updated": 20
}
```

---

### Admin Contragent Payment APIs

**Base Path:** `/api/admin-contragent-payments`

**Note:** All routes require admin authentication.

#### Pay Contragent Payment
```
POST /api/admin-contragent-payments/:id/pay
```

**Request Body:**
```json
{
  "paidAt": "date (ISO format, optional, default: now)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lov to'landi",
  "payment": { /* payment object */ }
}
```

#### Pay Contragent Payments by Date Range
```
POST /api/admin-contragent-payments/pay-by-date-range
```

**Request Body:**
```json
{
  "startDate": "date (ISO format, required)",
  "endDate": "date (ISO format, required)",
  "contragentId": "string (optional, contragent ID)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To'lovlar to'landi",
  "paidCount": 25,
  "totalAmount": 50000000
}
```

#### Get Unpaid Payments
```
GET /api/admin-contragent-payments/unpaid
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `contragentId` - Filter by contragent ID
- `page` - Page number
- `limit` - Items per page

#### Get Unpaid Payments Grouped
```
GET /api/admin-contragent-payments/unpaid/grouped
```

**Query Parameters:** (same as unpaid payments)

**Response:**
```json
{
  "success": true,
  "grouped": {
    "byContragent": [
      {
        "contragent": { /* contragent object */ },
        "totalAmount": 10000000,
        "paymentCount": 20
      }
    ],
    "byDate": [
      {
        "date": "2024-01-01",
        "totalAmount": 5000000,
        "paymentCount": 10
      }
    ]
  }
}
```

#### Mark Payments as Paid
```
POST /api/admin-contragent-payments/mark-as-paid
```

**Request Body:**
```json
{
  "paymentIds": ["array of payment IDs (required)"],
  "paidAt": "date (ISO format, optional, default: now)",
  "notes": "string (optional)"
}
```

#### Get Payment Statistics
```
GET /api/admin-contragent-payments/statistics
```

**Query Parameters:**
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

#### Get Paid Payments
```
GET /api/admin-contragent-payments/paid
```

**Query Parameters:** (same as unpaid payments)

#### Sync Contragent Payments
```
POST /api/admin-contragent-payments/sync
```

**Response:**
```json
{
  "success": true,
  "message": "Kontragent to'lovlari sinxronlashtirildi",
  "created": 100,
  "updated": 50
}
```

---

## Contragent Type APIs

**Base Path:** `/api/contragent-types`

### Get All Contragent Types
```
GET /api/contragent-types
```

**Query Parameters:**
- `status` - Filter by status (default: active)
- `search` - Search by name

**Response:**
```json
{
  "success": true,
  "contragentTypes": [
    {
      "_id": "string",
      "name": "string",
      "icon": "string",
      "status": "active|inactive"
    }
  ]
}
```

### Get Contragent Type by ID
```
GET /api/contragent-types/:id
```

---

### Admin Routes

#### Create Contragent Type
```
POST /api/contragent-types
```

**Authentication:** Required (adminAuth)

**Request Body:**
```json
{
  "name": "string (required, min: 2, max: 200)",
  "icon": "string (required)",
  "status": "active|inactive (default: active)"
}
```

#### Update Contragent Type
```
PUT /api/contragent-types/:id
```

**Authentication:** Required (adminAuth)

**Request Body:** (all fields optional)
```json
{
  "name": "string (min: 2, max: 200)",
  "icon": "string",
  "status": "active|inactive"
}
```

#### Delete Contragent Type
```
DELETE /api/contragent-types/:id
```

**Authentication:** Required (adminAuth)

---

## Device Verification APIs

**Base Path:** `/api/device-verification`

### Request Device Verification Code
```
POST /api/device-verification/:userModel/request-code
```

**Path Parameters:**
- `userModel` - User model (Admin/Contragent/Agent/Punkt)

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "deviceId": "string (required)",
  "deviceName": "string (optional)",
  "deviceType": "string (optional)",
  "platform": "string (optional)",
  "os": "string (optional)",
  "browser": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi yuborildi",
  "expiresIn": 300
}
```

### Verify Device
```
POST /api/device-verification/:userModel/verify
```

**Path Parameters:**
- `userModel` - User model (Admin/Contragent/Agent/Punkt)

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "deviceId": "string (required)",
  "code": "string (required, 5 digits)",
  "deviceName": "string (optional)",
  "deviceType": "string (optional)",
  "platform": "string (optional)",
  "os": "string (optional)",
  "browser": "string (optional)",
  "location": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Qurilma tasdiqlandi",
  "device": { /* device object */ },
  "token": "jwt_token"
}
```

### Resend Device Verification Code
```
POST /api/device-verification/:userModel/resend-code
```

**Path Parameters:**
- `userModel` - User model (Admin/Contragent/Agent/Punkt)

**Request Body:**
```json
{
  "phone": "string (required, phone format)",
  "deviceId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "expiresIn": 300
}
```

---

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions or inactive device)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error message in Uzbek",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Messages

#### Authentication Errors
- `Token topilmadi` - Token not found
- `Token noto'g'ri yoki muddati tugagan` - Invalid or expired token
- `Bu token [userType] uchun emas` - Wrong token type
- `Hisobingiz faol emas` - Account is inactive
- `Qurilma topilmadi yoki nofaol` - Device not found or inactive
- `Qurilma ID topilmadi. Iltimos, qayta login qiling` - Device ID not found

#### Validation Errors
- `Validatsiya xatosi` - Validation error
- Field-specific messages in Uzbek

#### Not Found Errors
- `[Entity] topilmadi` - Entity not found
- `Route topilmadi` - Route not found

#### Business Logic Errors
- `Bu amalni bajarish uchun ruxsat yo'q` - Permission denied
- `Buyurtma allaqachon [status] holatida` - Order already in status
- `Maxsulot moderatsiyada` - Product is in moderation
- `Parol noto'g'ri` - Incorrect password
- `Telefon raqami allaqachon ro'yxatdan o'tgan` - Phone already registered

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful message",
  "data": { /* response data */ }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### List Response

```json
{
  "success": true,
  "items": [/* array of items */],
  "count": 100
}
```

### Single Item Response

```json
{
  "success": true,
  "item": { /* item object */ }
}
```

### Statistics Response

```json
{
  "success": true,
  "statistics": {
    "total": 1000,
    "byCategory": { /* category breakdown */ },
    "byDate": [/* date-based data */]
  }
}
```

---

## Notes

### Date Formats
- All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2024-01-01T00:00:00.000Z`

### Phone Number Format
- Phone numbers should be in international format
- Example: `998901234567` or `+998901234567`
- The system automatically formats phone numbers

### Base64 Images
- Images should be in base64 format with data URI prefix
- Format: `data:image/png;base64,...` or `data:image/jpeg;base64,...`
- Supported formats: PNG, JPG, JPEG, GIF, WebP

### Pagination
- Default page size: 10 items
- Maximum page size: 100 items
- Page numbers start from 1

### Rate Limiting
- SMS codes: 1 request per phone number per 60 seconds
- API requests: 100 requests per minute per IP (may vary)

### WebSocket Events
- Real-time notifications are sent via Socket.io
- Join room: `join:room` with `{ userType, userId }`
- Notification event: `notification` with notification object

---

## Support

For API support or questions, please contact the development team.

**Last Updated:** 2026-01-04