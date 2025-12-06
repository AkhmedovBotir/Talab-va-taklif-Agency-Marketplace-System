# Agent Orders API

Base URL: `/api/agent-orders`

> Barcha endpointlar `agentAuth` middleware orqali himoyalangan.

---

## Autentifikatsiya

Header: `Authorization: Bearer <token>`

---

## Agent turlari

| Turi | Tavsif |
|------|--------|
| `mfy` | MFY agenti - faqat o'ziga yuborilgan buyurtmalarni ko'radi |
| `tuman` | Tuman agenti - tumandagi barcha buyurtmalarni ko'radi |
| `viloyat` | Viloyat agenti - viloyatdagi barcha buyurtmalarni ko'radi |

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
      "status": "assigned_to_agent",
      "assignedToAgent": {...},
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

**Response:** Bugungi buyurtmalar bilan bir xil format.

---

### 3. Barcha buyurtmalar

Agent turiga qarab barcha buyurtmalarni olish.

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
| search | string | Qidiruv (buyurtma raqami yoki telefon) |
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
    "status": "assigned_to_agent",
    "assignedToAgent": {...},
    "confirmedByAgent": null,
    "deliveredAt": null
  }
}
```

---

### 5. Buyurtmani tasdiqlash

MFY agenti mijozga borib buyurtmani tasdiqlaydi.

```
POST /orders/:id/confirm
```

> Faqat MFY agentlari uchun

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {...}
}
```

---

### 6. Yetkazilganini belgilash

MFY agenti buyurtmani mijozga yetkazib berganini belgilaydi.

```
POST /orders/:id/delivered
```

> Faqat MFY agentlari uchun. Buyurtma avval tasdiqlanishi kerak.

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yetkazilgan deb belgilandi",
  "data": {...}
}
```

---

## KPI Bonus Endpointlari

### 7. KPI xulosa

```
GET /kpi/summary
```

### 8. KPI tranzaksiyalari

```
GET /kpi/transactions
```

### 9. KPI kunlik balans

```
GET /kpi/balance
```

### 10. KPI kunlik hisobot

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








