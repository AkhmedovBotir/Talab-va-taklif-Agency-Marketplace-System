# Admin Sales Statistics API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Sales Summary](#sales-summary)
  - [Sales by Viloyats](#sales-by-viloyats)
  - [Sales by Tumans](#sales-by-tumans)
  - [Sales by MFYs](#sales-by-mfys)
  - [Single Viloyat Statistics](#single-viloyat-statistics)
  - [Single Tuman Statistics](#single-tuman-statistics)
  - [Single MFY Statistics](#single-mfy-statistics)
- [Common Query Parameters](#common-query-parameters)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Admin Sales Statistics API provides endpoints for viewing sales statistics across different regions (viloyat, tuman, MFY). Admins can analyze sales performance, track revenue, and monitor order trends by geographic location.

**Base Path:** `/api/admins/stats`

**Key Features:**
- View overall sales summary with daily breakdown
- Analyze sales by viloyat (region)
- Analyze sales by tuman (district)
- Analyze sales by MFY (neighborhood)
- Filter by date range and order status
- Get detailed statistics for specific regions

---

## Base URL

```
http://localhost:5000/api/admins
```

---

## Authentication

All endpoints require admin authentication using JWT token from Admin login.

**Format:** `Authorization: Bearer <token>`

---

## Common Query Parameters

These parameters are available on most statistics endpoints:

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string (ISO 8601) | Filter from date (e.g., `2024-01-01`) |
| `endDate` | string (ISO 8601) | Filter until date (e.g., `2024-01-31`) |
| `status` | string | Order status filter. Default: `confirmed_by_customer` |

**Available Status Values:**
- `pending` - Kutilmoqda
- `confirmed_by_punkt` - Punkt tasdiqlagan
- `assigned_to_agent` - Agentga yuborilgan
- `confirmed_by_agent` - Agent tasdiqlagan
- `confirmed_by_customer` - Mijoz qabul qilgan (default)
- `cancelled` - Bekor qilingan

---

## Endpoints

### Sales Summary

Get overall sales statistics summary with daily breakdown and status distribution.

**Endpoint:** `GET /api/admins/stats/sales/summary`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `viloyatId` (optional) - Viloyat bo'yicha filter
- `tumanId` (optional) - Tuman bo'yicha filter
- `mfyId` (optional) - MFY bo'yicha filter
- `status` (optional) - Buyurtma holati

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 1500,
      "totalRevenue": 75000000,
      "totalItems": 4500,
      "avgOrderValue": 50000,
      "minOrderValue": 15000,
      "maxOrderValue": 500000
    },
    "dailyStats": [
      {
        "date": "2024-01-01",
        "totalOrders": 45,
        "totalRevenue": 2250000
      },
      {
        "date": "2024-01-02",
        "totalOrders": 52,
        "totalRevenue": 2600000
      }
    ],
    "statusBreakdown": [
      {
        "status": "confirmed_by_customer",
        "count": 1200,
        "revenue": 60000000
      },
      {
        "status": "pending",
        "count": 150,
        "revenue": 7500000
      },
      {
        "status": "cancelled",
        "count": 50,
        "revenue": 2500000
      }
    ]
  }
}
```

---

### Sales by Viloyats

Get sales statistics grouped by all viloyats (regions).

**Endpoint:** `GET /api/admins/stats/sales/viloyats`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 14,
  "totals": {
    "totalOrders": 1500,
    "totalRevenue": 75000000,
    "totalItems": 4500
  },
  "data": [
    {
      "viloyat": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent viloyati",
        "code": "27"
      },
      "totalOrders": 350,
      "totalRevenue": 17500000,
      "totalItems": 1050,
      "avgOrderValue": 50000
    },
    {
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Samarqand viloyati",
        "code": "18"
      },
      "totalOrders": 280,
      "totalRevenue": 14000000,
      "totalItems": 840,
      "avgOrderValue": 50000
    }
  ]
}
```

---

### Sales by Tumans

Get sales statistics grouped by tumans (districts).

**Endpoint:** `GET /api/admins/stats/sales/tumans`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Filter by specific viloyat
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 45,
  "totals": {
    "totalOrders": 350,
    "totalRevenue": 17500000,
    "totalItems": 1050
  },
  "data": [
    {
      "viloyat": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent viloyati",
        "code": "27"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Chirchiq tumani",
        "code": "2701"
      },
      "totalOrders": 85,
      "totalRevenue": 4250000,
      "totalItems": 255,
      "avgOrderValue": 50000
    }
  ]
}
```

---

### Sales by MFYs

Get sales statistics grouped by MFYs (neighborhoods).

**Endpoint:** `GET /api/admins/stats/sales/mfys`

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `viloyatId` (optional) - Filter by specific viloyat
- `tumanId` (optional) - Filter by specific tuman
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 120,
  "totals": {
    "totalOrders": 85,
    "totalRevenue": 4250000,
    "totalItems": 255
  },
  "data": [
    {
      "viloyat": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent viloyati",
        "code": "27"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Chirchiq tumani",
        "code": "2701"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Guliston MFY",
        "code": "270101"
      },
      "totalOrders": 25,
      "totalRevenue": 1250000,
      "totalItems": 75,
      "avgOrderValue": 50000
    }
  ]
}
```

---

### Single Viloyat Statistics

Get detailed sales statistics for a specific viloyat.

**Endpoint:** `GET /api/admins/stats/sales/viloyats/:viloyatId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `viloyatId` (required) - Viloyat ID

**Query Parameters:**
- `groupBy` (optional) - Guruhlash turi: `tuman` (default), `mfy`, `day`
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK) - groupBy=tuman:**

```json
{
  "success": true,
  "viloyat": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent viloyati",
    "code": "27"
  },
  "groupBy": "tuman",
  "count": 15,
  "totals": {
    "totalOrders": 350,
    "totalRevenue": 17500000,
    "totalItems": 1050
  },
  "data": [
    {
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Chirchiq tumani",
        "code": "2701"
      },
      "totalOrders": 85,
      "totalRevenue": 4250000,
      "totalItems": 255,
      "avgOrderValue": 50000
    }
  ]
}
```

**Success Response (200 OK) - groupBy=day:**

```json
{
  "success": true,
  "viloyat": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Toshkent viloyati",
    "code": "27"
  },
  "groupBy": "day",
  "count": 30,
  "totals": {
    "totalOrders": 350,
    "totalRevenue": 17500000,
    "totalItems": 1050
  },
  "data": [
    {
      "date": "2024-01-01",
      "totalOrders": 12,
      "totalRevenue": 600000,
      "totalItems": 36,
      "avgOrderValue": 50000
    },
    {
      "date": "2024-01-02",
      "totalOrders": 15,
      "totalRevenue": 750000,
      "totalItems": 45,
      "avgOrderValue": 50000
    }
  ]
}
```

---

### Single Tuman Statistics

Get detailed sales statistics for a specific tuman.

**Endpoint:** `GET /api/admins/stats/sales/tumans/:tumanId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `tumanId` (required) - Tuman ID

**Query Parameters:**
- `groupBy` (optional) - Guruhlash turi: `mfy` (default), `day`
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK) - groupBy=mfy:**

```json
{
  "success": true,
  "tuman": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Chirchiq tumani",
    "code": "2701",
    "parent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Toshkent viloyati",
      "code": "27"
    }
  },
  "groupBy": "mfy",
  "count": 25,
  "totals": {
    "totalOrders": 85,
    "totalRevenue": 4250000,
    "totalItems": 255
  },
  "data": [
    {
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Guliston MFY",
        "code": "270101"
      },
      "totalOrders": 25,
      "totalRevenue": 1250000,
      "totalItems": 75,
      "avgOrderValue": 50000
    }
  ]
}
```

---

### Single MFY Statistics

Get detailed sales statistics for a specific MFY.

**Endpoint:** `GET /api/admins/stats/sales/mfys/:mfyId`

**Headers:**
- `Authorization: Bearer <token>` (required)

**URL Parameters:**
- `mfyId` (required) - MFY ID

**Query Parameters:**
- `startDate` (optional) - Boshlanish sanasi
- `endDate` (optional) - Tugash sanasi
- `status` (optional) - Buyurtma holati

**Success Response (200 OK):**

```json
{
  "success": true,
  "mfy": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Guliston MFY",
    "code": "270101",
    "parent": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Chirchiq tumani",
      "code": "2701",
      "parent": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Toshkent viloyati",
        "code": "27"
      }
    }
  },
  "count": 30,
  "totals": {
    "totalOrders": 25,
    "totalRevenue": 1250000,
    "totalItems": 75
  },
  "data": [
    {
      "date": "2024-01-01",
      "totalOrders": 2,
      "totalRevenue": 100000,
      "totalItems": 6,
      "avgOrderValue": 50000
    },
    {
      "date": "2024-01-02",
      "totalOrders": 3,
      "totalRevenue": 150000,
      "totalItems": 9,
      "avgOrderValue": 50000
    }
  ]
}
```

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
- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Authentication required or invalid token
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Get Overall Sales Summary

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get Sales by Viloyats for Last Month

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/viloyats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Get Tumans Statistics for Specific Viloyat

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/tumans?viloyatId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Get Daily Breakdown for Specific Viloyat

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/viloyats/507f1f77bcf86cd799439011?groupBy=day&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 5: Get MFY Statistics for Specific Tuman

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/mfys?tumanId=507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 6: Get All Order Statuses (not just confirmed)

```bash
curl -X GET "http://localhost:5000/api/admins/stats/sales/summary?status=pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notes

1. **Default Status Filter:** By default, all statistics endpoints filter by `confirmed_by_customer` status. Use the `status` parameter to change this.

2. **Date Range:** If no date range is specified, statistics include all historical data.

3. **Revenue Calculation:** Revenue is calculated from `totalPrice` field of orders.

4. **Sorting:** Results are sorted by `totalRevenue` in descending order (except daily breakdowns which are sorted by date).

5. **Null Values:** If a region field is null in orders (e.g., deliveryViloyat), those orders will be grouped under `null` in the response.

---

**Last Updated:** 2024-01-15












