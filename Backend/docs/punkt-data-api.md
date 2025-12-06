# Punkt Data API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Get Punkts for Selection](#1-get-punkts-for-selection)
  - [Get Agents for Selection](#2-get-agents-for-selection)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Punkt Data API provides endpoints for retrieving punkt and agent data, primarily for selection purposes (punkt ID va agent ID tanlash uchun). This API allows filtering punkts and agents by regions (viloyat, tuman, mfy) and searching by name or phone number.

**Base Path:** `/api/punkts` va `/api/agents`

---

## Base URL

```
http://localhost:5000/api/punkts
```

---

## Authentication

The selection endpoint is **public** and does not require authentication. This allows frontend applications to fetch punkt lists for dropdown/selection components.

---

## Data Models

### Punkt Object (for selection)

```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string",
  "phone": "string",
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
  } | null,
  "status": "string (enum: 'active' | 'inactive')"
}
```

---

## Endpoints

### 1. Get Punkts for Selection

Get list of punkts filtered by regions for selection purposes. This endpoint returns minimal punkt information suitable for dropdown/selection components.

**Endpoint:** `GET /api/punkts/selection`

**Query Parameters:**

- `status` (optional, default: 'active') - Filter by status: 'active' or 'inactive'
- `viloyat` (optional) - Filter by viloyat ID (MongoDB ObjectId)
- `tuman` (optional) - Filter by tuman ID (MongoDB ObjectId)
- `search` (optional) - Search by punkt name or phone number (case-insensitive)
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 100) - Number of items per page (max recommended: 100)

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "limit": 100,
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
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "status": "active"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Punkt 2",
      "phone": "+998901234568",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Chilonzor tumani",
        "type": "district",
        "code": "CHI"
      },
      "status": "active"
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Punkt 3",
      "phone": "+998901234569",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": null,
      "status": "active"
    }
  ]
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

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
- **500 Internal Server Error** - Server error

---

## Examples

### Example 1: Get All Active Punkts

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts/selection"
```

**Response:**

```json
{
  "success": true,
  "count": 25,
  "total": 25,
  "page": 1,
  "limit": 100,
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
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "status": "active"
    }
  ]
}
```

### Example 2: Filter by Viloyat

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts/selection?viloyat=507f1f77bcf86cd799439012"
```

**Response:**

Returns only punkts in the specified viloyat.

### Example 3: Filter by Viloyat and Tuman

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts/selection?viloyat=507f1f77bcf86cd799439012&tuman=507f1f77bcf86cd799439013"
```

**Response:**

Returns only punkts in the specified viloyat and tuman.

### Example 4: Search by Name or Phone

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts/selection?search=Punkt"
```

**Response:**

Returns punkts whose name or phone contains "Punkt" (case-insensitive).

### Example 5: Combined Filters

**Request:**

```bash
curl -X GET "http://localhost:5000/api/punkts/selection?viloyat=507f1f77bcf86cd799439012&status=active&search=1&page=1&limit=10"
```

**Response:**

Returns active punkts in the specified viloyat, whose name or phone contains "1", with pagination.

### Example 6: Get All Active Agents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents/selection"
```

**Response:**

Returns all active agents with minimal information for selection.

### Example 7: Filter Agents by Viloyat

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents/selection?viloyat=507f1f77bcf86cd799439012"
```

**Response:**

Returns only agents in the specified viloyat.

### Example 8: Filter Agents by Agent Type

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents/selection?agentType=tuman"
```

**Response:**

Returns only tuman-level agents (agents with tuman but no mfy).

### Example 9: Filter Agents by Viloyat, Tuman, and Agent Type

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents/selection?viloyat=507f1f77bcf86cd799439012&tuman=507f1f77bcf86cd799439013&agentType=mfy"
```

**Response:**

Returns MFY-level agents in the specified viloyat and tuman.

### Example 10: Search Agents

**Request:**

```bash
curl -X GET "http://localhost:5000/api/agents/selection?search=Agent"
```

**Response:**

Returns agents whose name or phone contains "Agent" (case-insensitive).

---

## Notes

1. **Public Endpoint**: This endpoint is public and does not require authentication, making it suitable for frontend selection components.

2. **Default Status**: By default, only active punkts/agents are returned. To get all punkts/agents, explicitly set `status` parameter.

3. **Minimal Data**: These endpoints return only essential fields needed for selection:
   
   **For Punkts:**
   - `_id` - Punkt ID for selection
   - `name` - Punkt name for display
   - `phone` - Phone number
   - `viloyat` - Viloyat information
   - `tuman` - Tuman information (can be null)
   - `status` - Punkt status
   
   **For Agents:**
   - `_id` - Agent ID for selection
   - `name` - Agent name for display
   - `phone` - Phone number
   - `viloyat` - Viloyat information
   - `tuman` - Tuman information (can be null)
   - `mfy` - MFY information (can be null)
   - `status` - Agent status
   - `agentType` - Agent type ('viloyat', 'tuman', or 'mfy')

4. **Sorting**: Results are sorted by name in ascending order for better user experience in selection components.

5. **Pagination**: Default limit is 100 items per page. Adjust `limit` parameter as needed, but keep in mind that very large limits may impact performance.

6. **Region Filtering**: 
   - **For Punkts:**
     - Filter by `viloyat` to get all punkts in a specific viloyat
     - Filter by both `viloyat` and `tuman` to get punkts in a specific tuman
     - Punkts with `tuman: null` are viloyat-level punkts
   - **For Agents:**
     - Filter by `viloyat` to get all agents in a specific viloyat
     - Filter by `viloyat` and `tuman` to get agents in a specific tuman
     - Filter by `viloyat`, `tuman`, and `mfy` to get agents in a specific MFY
     - Use `agentType` parameter to filter by agent level (viloyat, tuman, or mfy)

7. **Search**: The search parameter searches in both `name` and `phone` fields using case-insensitive regex matching.

8. **Agent Types**: Agents can be filtered by type:
   - `viloyat` - Viloyat-level agents (no tuman, no mfy)
   - `tuman` - Tuman-level agents (has tuman, no mfy)
   - `mfy` - MFY-level agents (has mfy)

9. **Agent Selection**: The agent selection endpoint returns `agentType` field which indicates the level of the agent (viloyat, tuman, or mfy).

10. **Base URL for Agents**: Agent selection endpoint is available at `/api/agents/selection`.

