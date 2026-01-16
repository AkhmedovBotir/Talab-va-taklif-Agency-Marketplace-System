# Admin Buyurtmalar API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api/admins
```

### Response Format
Barcha API javoblari quyidagi formatda qaytariladi:

**Muvaffaqiyatli javob:**
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
    "totalPrice": 5000000,
    "totalOriginalPrice": 4000000,
    "totalKpiPrice": 1000000,
    "totalItems": 100,
    "avgOrderValue": 100000
  },
  "data": [ ... ]
}
```

**Xatolik javobi:**
```json
{
  "success": false,
  "message": "Xatolik xabari",
  "error": "Xatolik tafsilotlari"
}
```

### HTTP Status Codes
- `200` - Muvaffaqiyatli so'rov
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

### Authentication
Barcha endpoint'lar `adminAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

### Umumiy Query Parametrlar

Barcha endpoint'lar quyidagi parametrlarni qo'llab-quvvatlaydi:

| Parametr | Type | Tavsif | Misol |
|----------|------|--------|-------|
| `status` | string | Buyurtma holati | `pending`, `confirmed_by_punkt`, `assigned_to_agent`, `confirmed_by_customer`, `cancelled` |
| `paymentStatus` | string | To'lov holati | `pending`, `paid`, `failed`, `refunded` |
| `paymentMethod` | string | To'lov usuli | `cash`, `card` |
| `orderNumber` | string | Buyurtma raqami (regex) | `00001`, `ORD-2024` |
| `user` | string | Foydalanuvchi ID | `507f1f77bcf86cd799439012` |
| `startDate` | date | Boshlanish sanasi | `2024-01-01` |
| `endDate` | date | Tugash sanasi | `2024-01-31` |
| `minTotalPrice` | number | Minimal jami narx | `100000` |
| `maxTotalPrice` | number | Maksimal jami narx | `500000` |
| `search` | string | Qidiruv (orderNumber yoki phoneNumber) | `00001`, `+998901234567` |
| `page` | number | Sahifa raqami (default: 1) | `1` |
| `limit` | number | Har sahifadagi buyurtmalar soni (default: 50) | `50` |

---

## Tuman Kontragentlari Sotuvi

### 1. Barcha Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha tuman buyurtmalarini olish. MaxallaProduct buyurtmalari va dokon buyurtmalari kiritilmaydi.

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi

**Response:**
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
    "totalPrice": 5000000,
    "totalOriginalPrice": 4000000,
    "totalKpiPrice": 1000000,
    "totalItems": 100,
    "avgOrderValue": 100000
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Uzum sirkasi",
            "price": 65000,
            "originalPrice": 50000
          },
          "quantity": 2,
          "price": 65000,
          "originalPrice": 50000,
          "productType": "tuman"
        }
      ],
      "totalPrice": 130000,
      "totalOriginalPrice": 100000,
      "totalKpiPrice": 9000,
      "status": "confirmed_by_customer",
      "paymentStatus": "paid",
      "paymentMethod": "cash",
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani"
      },
      "confirmedByPunkt": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt Name"
      },
      "assignedToAgent": {
        "_id": "507f1f77bcf86cd799439022",
        "name": "Agent Name"
      },
      "orderType": "tuman",
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Marketplace dan Buyurilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/marketplace`

**Authentication:** `adminAuth` required

**Tavsif:** Marketplace dan buyurilgan, lekin punkt tomonidan hali qabul qilinmagan tuman buyurtmalari.

**Filter:**
- `status: { $ne: 'cancelled' }`
- `confirmedByPunkt: null`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi

**Response:** (1-bosqichdagi kabi format)

---

### 3. Punkt Qabul Qilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/confirmed-by-punkt`

**Authentication:** `adminAuth` required

**Tavsif:** Punkt tomonidan qabul qilingan, lekin hali hech narsa qilinmagan tuman buyurtmalari.

**Filter:**
- `confirmedByPunkt: { $ne: null }`
- `assignedToAgent: null`
- `contragentRequests` bo'sh yoki hammasi `pending`/`rejected`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi

**Response:** (1-bosqichdagi kabi format)

**Eslatma:** Bu endpoint'da `contragentRequests` bo'sh yoki faqat `pending`/`rejected` bo'lgan buyurtmalar ko'rsatiladi.

---

### 4. Kontragentlarga Yuborilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/requested-to-contragents`

**Authentication:** `adminAuth` required

**Tavsif:** Kontragentlarga so'rov yuborilgan tuman buyurtmalari.

**Filter:**
- `contragentRequests.status: { $in: ['pending', 'accepted'] }`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `contragentRequests.requestedAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

**Eslatma:** Response'da faqat `pending` yoki `accepted` status'li `contragentRequests` ko'rsatiladi.

---

### 5. Punktga Yetkazilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/delivered-to-punkt`

**Authentication:** `adminAuth` required

**Tavsif:** Kontragent tomonidan punktga yetkazilgan tuman buyurtmalari.

**Filter:**
- `contragentRequests.status: 'delivered_to_punkt'`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `contragentRequests.deliveredToPunktAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

---

### 6. Agentga Yuborilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/assigned-to-agents`

**Authentication:** `adminAuth` required

**Tavsif:** Punkt tomonidan agentga yuborilgan tuman buyurtmalari.

**Filter:**
- `assignedToAgent: { $ne: null }`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `assignedAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

---

### 7. Agent Topshirgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/confirmed-by-agents`

**Authentication:** `adminAuth` required

**Tavsif:** Agent tomonidan mijozga yetkazilgan va tasdiqlangan tuman buyurtmalari.

**Filter:**
- `confirmedByAgent: { $ne: null }`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `agentConfirmedAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

---

### 8. Mijoz Qabul Qilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/confirmed-by-customers`

**Authentication:** `adminAuth` required

**Tavsif:** Mijoz tomonidan qabul qilingan (yakuniy) tuman buyurtmalari.

**Filter:**
- `customerConfirmed: true`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `customerConfirmedAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

---

### 9. Qaytarilgan Tuman Buyurtmalari
**GET** `/api/admins/sales/tuman/orders/cancelled`

**Authentication:** `adminAuth` required

**Tavsif:** Bekor qilingan tuman buyurtmalari.

**Filter:**
- `status: 'cancelled'`
- `orderType: 'tuman'` yoki `orderType` mavjud emas
- MaxallaProduct buyurtmalari exclude qilinadi

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi (`status` parametri qo'llanilmaydi)
- `startDate` va `endDate` `updatedAt` bo'yicha filter qiladi

**Response:** (1-bosqichdagi kabi format)

---

## Maxalla Do'konlari Sotuvi

### 10. Barcha Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha maxalla/dokon buyurtmalarini olish.

**Filter:**
- `orderType: 'dokon'` YOKI
- `items: { $elemMatch: { productType: 'maxalla' } }`

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "statistics": {
    "totalOrders": 30,
    "totalPrice": 2000000,
    "totalOriginalPrice": 1500000,
    "totalKpiPrice": 0,
    "totalItems": 60,
    "avgOrderValue": 66666.67
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00002",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Maxalla maxsulot",
            "price": 50000,
            "originalPrice": 40000
          },
          "quantity": 2,
          "price": 50000,
          "originalPrice": 40000,
          "productType": "maxalla"
        }
      ],
      "totalPrice": 100000,
      "totalOriginalPrice": 80000,
      "totalKpiPrice": 0,
      "status": "requested_to_contragent",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "orderType": "dokon",
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 11. Marketplace dan Buyurilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/marketplace`

**Authentication:** `adminAuth` required

**Tavsif:** Marketplace dan buyurilgan, lekin punkt tomonidan hali qabul qilinmagan maxalla buyurtmalari.

**Filter:**
- `status: { $ne: 'cancelled' }`
- `confirmedByPunkt: null`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi

**Response:** (10-bosqichdagi kabi format)

---

### 12. Kontragentlarga Yuborilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/requested-to-contragents`

**Authentication:** `adminAuth` required

**Tavsif:** Kontragentlarga so'rov yuborilgan maxalla buyurtmalari.

**Filter:**
- `contragentRequests.status: { $in: ['pending', 'accepted'] }`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `contragentRequests.requestedAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

### 13. Punktga Yetkazilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/delivered-to-punkt`

**Authentication:** `adminAuth` required

**Tavsif:** Kontragent tomonidan punktga yetkazilgan maxalla buyurtmalari.

**Filter:**
- `contragentRequests.status: 'delivered_to_punkt'`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `contragentRequests.deliveredToPunktAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

### 14. Agentga Yuborilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/assigned-to-agents`

**Authentication:** `adminAuth` required

**Tavsif:** Punkt tomonidan agentga yuborilgan maxalla buyurtmalari.

**Filter:**
- `assignedToAgent: { $ne: null }`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `assignedAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

### 15. Agent Topshirgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/confirmed-by-agents`

**Authentication:** `adminAuth` required

**Tavsif:** Agent tomonidan mijozga yetkazilgan va tasdiqlangan maxalla buyurtmalari.

**Filter:**
- `confirmedByAgent: { $ne: null }`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `agentConfirmedAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

### 16. Mijoz Qabul Qilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/confirmed-by-customers`

**Authentication:** `adminAuth` required

**Tavsif:** Mijoz tomonidan qabul qilingan (yakuniy) maxalla buyurtmalari.

**Filter:**
- `customerConfirmed: true`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi
- `startDate` va `endDate` `customerConfirmedAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

### 17. Qaytarilgan Maxalla Buyurtmalari
**GET** `/api/admins/sales/maxalla/orders/cancelled`

**Authentication:** `adminAuth` required

**Tavsif:** Bekor qilingan maxalla buyurtmalari.

**Filter:**
- `status: 'cancelled'`
- `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor

**Query Parameters:**
- Barcha umumiy parametrlar qo'llaniladi (`status` parametri qo'llanilmaydi)
- `startDate` va `endDate` `updatedAt` bo'yicha filter qiladi

**Response:** (10-bosqichdagi kabi format)

---

## Buyurtma Holatlari (Status)

### Tuman Buyurtmalari Holatlari:

1. **`pending`** - Marketplace dan yangi buyurtma
2. **`confirmed_by_punkt`** - Punkt tomonidan tasdiqlangan
3. **`requested_to_contragent`** - Kontragentga so'rov yuborilgan
4. **`accepted_by_contragent`** - Kontragent tomonidan qabul qilingan
5. **`delivered_to_punkt`** - Punktga yetkazilgan
6. **`assigned_to_agent`** - Agentga yuborilgan
7. **`confirmed_by_agent`** - Agent tomonidan tasdiqlangan (mijozga yetkazilgan)
8. **`confirmed_by_customer`** - Mijoz tomonidan tasdiqlangan (yakuniy)
9. **`cancelled`** - Bekor qilingan

### Maxalla Buyurtmalari Holatlari:

Maxalla buyurtmalari punkt orqali o'tmaydi, shuning uchun quyidagi holatlar mavjud:

1. **`pending`** - Marketplace dan yangi buyurtma
2. **`requested_to_contragent`** - Kontragentga so'rov yuborilgan
3. **`accepted_by_contragent`** - Kontragent tomonidan qabul qilingan
4. **`delivered_to_punkt`** - Punktga yetkazilgan (agar punkt orqali o'tsa)
5. **`assigned_to_agent`** - Agentga yuborilgan
6. **`confirmed_by_agent`** - Agent tomonidan tasdiqlangan
7. **`confirmed_by_customer`** - Mijoz tomonidan tasdiqlangan (yakuniy)
8. **`cancelled`** - Bekor qilingan

---

## Buyurtma Qayerda To'xtab Turganini Aniqlash

### Tuman Buyurtmalari:

1. **Marketplace dan buyurilgan** (`/sales/tuman/orders/marketplace`)
   - `status: { $ne: 'cancelled' }`
   - `confirmedByPunkt: null`
   - **To'xtagan joy:** Marketplace → Punkt (punkt hali qabul qilmagan)

2. **Punkt qabul qilgan** (`/sales/tuman/orders/confirmed-by-punkt`)
   - `confirmedByPunkt: { $ne: null }`
   - `assignedToAgent: null`
   - `contragentRequests` bo'sh yoki hammasi `pending`/`rejected`
   - **To'xtagan joy:** Punkt → Kontragent (punkt qabul qildi, lekin kontragentga yuborilmagan)

3. **Kontragentlarga yuborilgan** (`/sales/tuman/orders/requested-to-contragents`)
   - `contragentRequests.status: { $in: ['pending', 'accepted'] }`
   - **To'xtagan joy:** Kontragent (kontragent hali javob bermagan yoki qabul qilgan, lekin yetkazmagan)

4. **Punktga yetkazilgan** (`/sales/tuman/orders/delivered-to-punkt`)
   - `contragentRequests.status: 'delivered_to_punkt'`
   - **To'xtagan joy:** Punkt → Agent (kontragent punktga yetkazdi, lekin agentga yuborilmagan)

5. **Agentga yuborilgan** (`/sales/tuman/orders/assigned-to-agents`)
   - `assignedToAgent: { $ne: null }`
   - `confirmedByAgent: null`
   - **To'xtagan joy:** Agent → Mijoz (agentga yuborilgan, lekin mijozga yetkazilmagan)

6. **Agent topshirgan** (`/sales/tuman/orders/confirmed-by-agents`)
   - `confirmedByAgent: { $ne: null }`
   - `customerConfirmed: false`
   - **To'xtagan joy:** Mijoz (agent mijozga yetkazdi, lekin mijoz hali tasdiqlamagan)

7. **Mijoz qabul qilgan** (`/sales/tuman/orders/confirmed-by-customers`)
   - `customerConfirmed: true`
   - **To'xtagan joy:** Yakuniy (buyurtma muvaffaqiyatli yakunlandi)

8. **Qaytarilgan** (`/sales/tuman/orders/cancelled`)
   - `status: 'cancelled'`
   - **To'xtagan joy:** Bekor qilingan

### Maxalla Buyurtmalari:

1. **Marketplace dan buyurilgan** (`/sales/maxalla/orders/marketplace`)
   - `status: { $ne: 'cancelled' }`
   - `confirmedByPunkt: null`
   - **To'xtagan joy:** Marketplace → Kontragent (kontragentga hali yuborilmagan)

2. **Kontragentlarga yuborilgan** (`/sales/maxalla/orders/requested-to-contragents`)
   - `contragentRequests.status: { $in: ['pending', 'accepted'] }`
   - **To'xtagan joy:** Kontragent (kontragent hali javob bermagan yoki qabul qilgan, lekin yetkazmagan)

3. **Punktga yetkazilgan** (`/sales/maxalla/orders/delivered-to-punkt`)
   - `contragentRequests.status: 'delivered_to_punkt'`
   - **To'xtagan joy:** Punkt → Agent (kontragent punktga yetkazdi, lekin agentga yuborilmagan)

4. **Agentga yuborilgan** (`/sales/maxalla/orders/assigned-to-agents`)
   - `assignedToAgent: { $ne: null }`
   - `confirmedByAgent: null`
   - **To'xtagan joy:** Agent → Mijoz (agentga yuborilgan, lekin mijozga yetkazilmagan)

5. **Agent topshirgan** (`/sales/maxalla/orders/confirmed-by-agents`)
   - `confirmedByAgent: { $ne: null }`
   - `customerConfirmed: false`
   - **To'xtagan joy:** Mijoz (agent mijozga yetkazdi, lekin mijoz hali tasdiqlamagan)

6. **Mijoz qabul qilgan** (`/sales/maxalla/orders/confirmed-by-customers`)
   - `customerConfirmed: true`
   - **To'xtagan joy:** Yakuniy (buyurtma muvaffaqiyatli yakunlandi)

7. **Qaytarilgan** (`/sales/maxalla/orders/cancelled`)
   - `status: 'cancelled'`
   - **To'xtagan joy:** Bekor qilingan

---

## Misollar

### Misol 1: Marketplace dan buyurilgan tuman buyurtmalarini olish

**Request:**
```
GET /api/admins/sales/tuman/orders/marketplace?page=1&limit=20&status=pending
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "statistics": {
    "totalOrders": 45,
    "totalPrice": 4500000,
    "totalOriginalPrice": 3500000,
    "totalKpiPrice": 1000000,
    "totalItems": 90,
    "avgOrderValue": 100000
  },
  "data": [ ... ]
}
```

### Misol 2: Qidiruv bilan tuman buyurtmalarini olish

**Request:**
```
GET /api/admins/sales/tuman/orders?search=00001&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "statistics": {
    "totalOrders": 1,
    "totalPrice": 130000,
    "totalOriginalPrice": 100000,
    "totalKpiPrice": 9000,
    "totalItems": 2,
    "avgOrderValue": 130000
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "00001",
      ...
    }
  ]
}
```

### Misol 3: Sana oralig'ida maxalla buyurtmalarini olish

**Request:**
```
GET /api/admins/sales/maxalla/orders?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "count": 30,
  "total": 30,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "statistics": {
    "totalOrders": 30,
    "totalPrice": 2000000,
    "totalOriginalPrice": 1500000,
    "totalKpiPrice": 0,
    "totalItems": 60,
    "avgOrderValue": 66666.67
  },
  "data": [ ... ]
}
```

---

## Eslatmalar

### Tuman va Maxalla Buyurtmalari Farqi

1. **Tuman Buyurtmalari:**
   - `orderType: 'tuman'` yoki `orderType` mavjud emas
   - MaxallaProduct buyurtmalari exclude qilinadi
   - Punkt orqali o'tadi
   - KPI hisoblanadi

2. **Maxalla Buyurtmalari:**
   - `orderType: 'dokon'` yoki `items` ichida `productType: 'maxalla'` bor
   - Punkt orqali o'tmaydi (to'g'ridan-to'g'ri kontragentga yuboriladi)
   - KPI hisoblanmaydi

### Filter Qoidalari

1. **Tuman Buyurtmalari:**
   - `orderType: 'tuman'` yoki `orderType: { $exists: false }`
   - `items: { $not: { $elemMatch: { productType: 'maxalla' } } }`

2. **Maxalla Buyurtmalari:**
   - `orderType: 'dokon'` yoki `items: { $elemMatch: { productType: 'maxalla' } }`

### Statistika

Barcha endpoint'lar quyidagi statistikani qaytaradi:
- `totalOrders` - Jami buyurtmalar soni
- `totalPrice` - Jami narx (mijozdan olingan)
- `totalOriginalPrice` - Jami asl narx (kontragentga to'lanadigan)
- `totalKpiPrice` - Jami KPI narx (faqat tuman buyurtmalari uchun)
- `totalItems` - Jami maxsulotlar soni
- `avgOrderValue` - O'rtacha buyurtma qiymati

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Tuman kontragentlari sotuvi va Maxalla do'konlari sotuvi
