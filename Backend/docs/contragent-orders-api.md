# Contragent Orders API

Base URL: `/api/contragent-orders`

> Barcha endpointlar `contragentAuth` middleware orqali himoyalangan.

---

## Autentifikatsiya

Header: `Authorization: Bearer <token>`

---

## Endpointlar

### 1. Bugungi buyurtmalar

Bugungi kun (00:00 - 23:59) ichida kelgan buyurtmalarni olish.

```
GET /today
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | So'rov holati (`pending`, `accepted`, `rejected`, `delivered_to_punkt`) |
| page | number | Sahifa raqami (default: 1) |
| limit | number | Har sahifadagi buyurtmalar soni (default: 50) |

**Response:**
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
      "_id": "...",
      "orderNumber": "00001",
      "items": [...],
      "totalPrice": 500000,
      "status": "requested_to_contragent",
      "contragentRequests": [
        {
          "contragentId": {...},
          "status": "pending",
          "requestedAt": "2025-11-27T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-11-27T09:00:00.000Z"
    }
  ]
}
```

---

### 2. Buyurtmalar tarixi

O'tgan kunlardagi buyurtmalarni olish (bugungi kun bundan mustasno).

```
GET /history
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | So'rov holati |
| startDate | string | Boshlanish sanasi (YYYY-MM-DD) |
| endDate | string | Tugash sanasi (YYYY-MM-DD) |
| page | number | Sahifa raqami (default: 1) |
| limit | number | Har sahifadagi buyurtmalar soni (default: 50) |

**Response:** Bugungi buyurtmalar bilan bir xil format.

---

### 3. Barcha buyurtmalar

Contragentga kelgan barcha so'rovlarni olish.

```
GET /orders
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | So'rov holati |
| page | number | Sahifa raqami (default: 1) |
| limit | number | Har sahifadagi buyurtmalar soni (default: 50) |

---

### 4. Buyurtma tafsilotlari

```
GET /orders/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNumber": "00001",
    "user": { "name": "...", "phone": "..." },
    "items": [...],
    "totalPrice": 500000,
    "status": "requested_to_contragent",
    "deliveryViloyat": {...},
    "deliveryTuman": {...},
    "deliveryMfy": {...},
    "contragentRequests": [...]
  }
}
```

---

### 5. So'rovga javob berish

Buyurtma so'rovini qabul qilish yoki rad etish.

```
POST /orders/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted"  // yoki "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {...}
}
```

---

### 6. Punktga yetkazish

Qabul qilingan buyurtmani punktga yetkazilganini belgilash.

```
POST /orders/:orderId/deliver-to-punkt
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli punktga yetkazildi",
  "data": {...}
}
```

---

### 7. Statistikalar

Contragent statistikalarini olish.

```
GET /statistics
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| startDate | string | Boshlanish sanasi (YYYY-MM-DD) |
| endDate | string | Tugash sanasi (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 100,
      "pendingOrders": 10,
      "acceptedOrders": 50,
      "rejectedOrders": 5,
      "deliveredOrders": 35,
      "totalRevenue": 5000000,
      "totalItems": 200,
      "acceptanceRate": "85.00"
    },
    "monthly": [
      {
        "year": 2025,
        "month": 11,
        "orders": 20,
        "revenue": 1000000
      }
    ]
  }
}
```

---

## So'rov holatlari

| Holat | Tavsif |
|-------|--------|
| `pending` | Kutilmoqda |
| `accepted` | Qabul qilindi |
| `rejected` | Rad etildi |
| `delivered_to_punkt` | Punktga yetkazildi |








