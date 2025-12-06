# Punkt Orders API

Base URL: `/api/punkt-orders`

> Barcha endpointlar `punktAuth` middleware orqali himoyalangan.

---

## Autentifikatsiya

Header: `Authorization: Bearer <token>`

---

## Endpointlar

### 1. Bugungi buyurtmalar

Bugungi kun (00:00 - 23:59) ichidagi buyurtmalarni olish.

```
GET /orders/today
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | Buyurtma holati |
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
      "status": "pending",
      "deliveryViloyat": {...},
      "deliveryTuman": {...},
      "deliveryMfy": {...},
      "createdAt": "2025-11-27T09:00:00.000Z"
    }
  ]
}
```

---

### 2. Buyurtmalar tarixi

O'tgan kunlardagi buyurtmalarni olish (bugungi kun bundan mustasno).

```
GET /orders/history
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | Buyurtma holati |
| startDate | string | Boshlanish sanasi (YYYY-MM-DD) |
| endDate | string | Tugash sanasi (YYYY-MM-DD) |
| page | number | Sahifa raqami (default: 1) |
| limit | number | Har sahifadagi buyurtmalar soni (default: 50) |

---

### 3. Barcha buyurtmalar

Punkt hududidagi barcha buyurtmalarni olish.

```
GET /orders
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | Buyurtma holati |
| paymentStatus | string | To'lov holati |
| paymentMethod | string | To'lov usuli |
| orderNumber | string | Buyurtma raqami |
| startDate | string | Boshlanish sanasi |
| endDate | string | Tugash sanasi |
| minTotalPrice | number | Minimal jami narx |
| maxTotalPrice | number | Maksimal jami narx |
| search | string | Qidiruv |
| page | number | Sahifa raqami (default: 1) |
| limit | number | Har sahifadagi buyurtmalar soni (default: 50) |

---

### 4. Buyurtma tafsilotlari

```
GET /orders/:id
```

---

### 5. Buyurtmadagi contragentlar

Buyurtmadagi maxsulotlarning contragent ID'larini olish.

```
GET /orders/:id/contragents
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderNumber": "00001",
    "contragents": [
      {
        "_id": "...",
        "name": "Contragent nomi",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {...},
        "tuman": {...},
        "mfy": {...},
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "...",
            "name": "Maxsulot nomi",
            "quantity": 2,
            "price": 100000
          }
        ],
        "hasRequest": false,
        "requestStatus": null
      }
    ]
  }
}
```

---

### 6. Buyurtmani tasdiqlash

```
POST /orders/:id/confirm
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {...}
}
```

---

### 7. Agentga yuborish

```
POST /orders/:id/assign-to-agent
```

**Request Body:**
```json
{
  "agentId": "agent_id"
}
```

---

### 8. Contragentga so'rov yuborish

```
POST /orders/:id/request-to-contragent
```

**Request Body:**
```json
{
  "contragentId": "contragent_id"
}
```

---

### 9. Boshqa punktga so'rov yuborish

```
POST /orders/:id/request-to-punkt
```

**Request Body:**
```json
{
  "toPunktId": "punkt_id"
}
```

---

### 10. Bir nechta punktlarga so'rov yuborish

```
POST /orders/:id/request-to-punkts
```

**Request Body:**
```json
{
  "tumanIds": ["tuman_id_1", "tuman_id_2"]
}
```

---

### 11. Punktdan qabul qilish

```
POST /orders/:id/receive-from-punkt
```

---

### 12. Contragentdan qabul qilish

```
POST /orders/:id/receive-from-contragent
```

---

### 13. Punkt so'rovlari

O'z punktiga kelgan so'rovlarni olish.

```
GET /requests
```

**Query Parameters:**
| Parametr | Turi | Tavsif |
|----------|------|--------|
| status | string | So'rov holati (`pending`, `accepted`, `rejected`) |
| page | number | Sahifa raqami |
| limit | number | Limit |

---

### 14. So'rovga javob berish

```
POST /requests/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted"  // yoki "rejected"
}
```

---

### 15. Punktdan punktga so'rovlar

```
GET /punkt-to-punkt-requests
```

---

### 16. Punktdan punktga so'rovga javob

```
POST /punkt-to-punkt-requests/:orderId/respond
```

**Request Body:**
```json
{
  "response": "accepted"  // yoki "rejected"
}
```

---

## KPI Bonus Endpointlari

### 17. KPI xulosa

```
GET /kpi/summary
```

### 18. KPI tranzaksiyalari

```
GET /kpi/transactions
```

### 19. KPI kunlik balans

```
GET /kpi/balance
```

### 20. KPI kunlik hisobot

```
GET /kpi/reports/daily
```

---

## Buyurtma holatlari

| Holat | Tavsif |
|-------|--------|
| `pending` | Yangi buyurtma |
| `confirmed_by_punkt` | Punkt tomonidan tasdiqlangan |
| `requested_to_contragent` | Contragentga so'rov yuborilgan |
| `accepted_by_contragent` | Contragent tomonidan qabul qilingan |
| `delivered_to_punkt` | Punktga yetkazilgan |
| `assigned_to_agent` | Agentga yuborilgan |
| `confirmed_by_agent` | Agent tomonidan tasdiqlangan |
| `confirmed_by_customer` | Mijoz tomonidan tasdiqlangan |
| `cancelled` | Bekor qilingan |

---

## Punkt holatlari

| Holat | Tavsif |
|-------|--------|
| `pending` | Kutilmoqda |
| `confirmed` | Tasdiqlangan |
| `rejected` | Rad etilgan |
| `requested` | So'rov yuborilgan |








