# Admin Dashboard Statistics API

Admin dashboard uchun chartlar va grafiklar uchun to'liq statistikalar API.

## Base URL
```
/api/admins/dashboard/statistics
```

## Authentication
```
Authorization: Bearer <admin_token>
```

---

## 1. Umumiy Statistika

**GET** `/statistics`

**Description:** Dashboard uchun barcha asosiy ko'rsatkichlar (umumiy, bugun, hafta, oy, yil).

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "orders": {
      "total": 1523,
      "today": 34,
      "week": 120,
      "month": 540,
      "year": 1523
    },
    "revenue": {
      "total": 742500000,
      "today": 16800000,
      "week": 58600000,
      "month": 268000000,
      "year": 742500000
    },
    "products": {
      "total": 420,
      "active": 380,
      "inactive": 40
    },
    "categories": {
      "total": 34
    },
    "contragents": {
      "total": 120,
      "active": 110,
      "inactive": 10
    },
    "marketplaceUsers": {
      "total": 18340,
      "active": 17500,
      "inactive": 840
    },
    "punkts": {
      "total": 540,
      "active": 520,
      "inactive": 20
    },
    "agents": {
      "total": 1320,
      "active": 1280,
      "inactive": 40
    },
    "admins": {
      "total": 8
    },
    "reviews": {
      "total": 1250,
      "averageRating": 4.5
    },
    "vacancies": {
      "total": 24,
      "applications": 2040
    },
    "payments": {
      "pending": {
        "amount": 15000000,
        "count": 25
      },
      "paid": {
        "amount": 111000000,
        "count": 180
      }
    },
    "kpi": {
      "totalTransactions": 500,
      "paidTransactions": 450,
      "unpaidTransactions": 50
    }
  }
}
```

---

## 2. Kunlik Statistika (Chart uchun)

**GET** `/statistics/daily`

**Description:** Oxirgi N kun uchun kunlik buyurtmalar va daromad statistikasi (chart uchun).

**Query params:**
- `days` (optional, default: 30) - Necha kunlik statistikani olish

**Response 200**
```json
{
  "success": true,
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-30",
    "days": 30
  },
  "data": [
    {
      "date": "2024-01-01",
      "orders": 15,
      "revenue": 7500000
    },
    {
      "date": "2024-01-02",
      "orders": 23,
      "revenue": 11500000
    },
    ...
  ]
}
```

**Example:**
```
GET /api/admins/dashboard/statistics/daily?days=60
```

---

## 3. Haftalik Statistika (Chart uchun)

**GET** `/statistics/weekly`

**Description:** Oxirgi N hafta uchun haftalik buyurtmalar va daromad statistikasi (chart uchun).

**Query params:**
- `weeks` (optional, default: 12) - Necha haftalik statistikani olish

**Response 200**
```json
{
  "success": true,
  "period": {
    "startDate": "2023-10-01",
    "endDate": "2023-12-24",
    "weeks": 12
  },
  "data": [
    {
      "year": 2023,
      "week": 40,
      "weekLabel": "Hafta 40, 2023",
      "orders": 120,
      "revenue": 60000000,
      "startDate": "2023-10-02T00:00:00.000Z"
    },
    ...
  ]
}
```

**Example:**
```
GET /api/admins/dashboard/statistics/weekly?weeks=24
```

---

## 4. Oylik Statistika (Chart uchun)

**GET** `/statistics/monthly`

**Description:** Oxirgi N oy uchun oylik buyurtmalar va daromad statistikasi (chart uchun).

**Query params:**
- `months` (optional, default: 12) - Necha oylik statistikani olish

**Response 200**
```json
{
  "success": true,
  "period": {
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "months": 12
  },
  "data": [
    {
      "year": 2023,
      "month": 1,
      "monthLabel": "Yanvar 2023",
      "orders": 450,
      "revenue": 225000000
    },
    {
      "year": 2023,
      "month": 2,
      "monthLabel": "Fevral 2023",
      "orders": 520,
      "revenue": 260000000
    },
    ...
  ]
}
```

**Example:**
```
GET /api/admins/dashboard/statistics/monthly?months=24
```

---

## 5. Buyurtmalar Statistikasi

**GET** `/statistics/orders`

**Description:** Buyurtmalar bo'yicha batafsil statistika (status, vaqt, eng ko'p sotilgan mahsulotlar).

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      {
        "status": "confirmed_by_customer",
        "count": 1523,
        "revenue": 742500000
      },
      {
        "status": "pending",
        "count": 45,
        "revenue": 2250000
      },
      ...
    ],
    "today": {
      "count": 34,
      "totalRevenue": 16800000,
      "avgValue": 494117
    },
    "week": {
      "count": 120,
      "totalRevenue": 58600000,
      "avgValue": 488333
    },
    "month": {
      "count": 540,
      "totalRevenue": 268000000,
      "avgValue": 496296
    },
    "averageOrderValue": 488000,
    "topProducts": [
      {
        "productId": "...",
        "productName": "Mahsulot nomi",
        "orderCount": 150,
        "quantitySold": 450,
        "revenue": 22500000
      },
      ...
    ]
  }
}
```

---

## 6. Moliyaviy Statistika

**GET** `/statistics/finance`

**Description:** Moliyaviy ko'rsatkichlar (daromad, xarajatlar, sof foyda).

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "income": {
      "total": 375000000,
      "month": 268000000,
      "year": 375000000
    },
    "expenses": {
      "total": 134800000,
      "kpi": {
        "total": 23800000,
        "month": 18000000,
        "year": 23800000
      },
      "contragent": {
        "total": 111000000,
        "month": 85000000,
        "year": 111000000,
        "count": 180
      }
    },
    "pending": {
      "contragentPayments": {
        "amount": 15000000,
        "count": 25
      }
    },
    "netProfit": {
      "total": 240200000,
      "month": 165000000,
      "year": 240200000
    },
    "financeSubmissions": {
      "totalAmount": 500000000,
      "count": 1200
    }
  }
}
```

**Notes:**
- `income` - Mijozlardan tushgan pul (confirmed_by_customer buyurtmalar)
- `expenses.kpi` - KPI bonuslar (xarajat)
- `expenses.contragent` - Contragentlarga to'langan summa
- `netProfit` = `income` - `expenses.total`

---

## 7. Foydalanuvchilar Statistikasi

**GET** `/statistics/users`

**Description:** Barcha foydalanuvchi turlari bo'yicha statistika (Marketplace Users, Contragents, Punkts, Agents).

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "marketplaceUsers": {
      "byStatus": [
        {
          "status": "active",
          "count": 17500
        },
        {
          "status": "inactive",
          "count": 840
        }
      ],
      "byPeriod": {
        "today": 15,
        "week": 120,
        "month": 450
      }
    },
    "contragents": {
      "byStatus": [
        {
          "status": "active",
          "count": 110
        },
        {
          "status": "inactive",
          "count": 10
        }
      ],
      "byPeriod": {
        "today": 2,
        "week": 8,
        "month": 25
      }
    },
    "punkts": {
      "byStatus": [
        {
          "status": "active",
          "count": 520
        },
        {
          "status": "inactive",
          "count": 20
        }
      ],
      "byPeriod": {
        "today": 1,
        "week": 5,
        "month": 15
      }
    },
    "agents": {
      "byStatus": [
        {
          "status": "active",
          "count": 1280
        },
        {
          "status": "inactive",
          "count": 40
        }
      ],
      "byPeriod": {
        "today": 3,
        "week": 12,
        "month": 45
      },
      "byType": [
        {
          "type": "mfy",
          "count": 800
        },
        {
          "type": "tuman",
          "count": 350
        },
        {
          "type": "viloyat",
          "count": 170
        }
      ]
    }
  }
}
```

---

## 8. Mahsulotlar Statistikasi

**GET** `/statistics/products`

**Description:** Mahsulotlar bo'yicha statistika (status, kategoriya, eng ko'p sotilgan, yangi mahsulotlar).

**Query params:** Yo'q

**Response 200**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      {
        "status": "active",
        "count": 380
      },
      {
        "status": "pending",
        "count": 25
      },
      {
        "status": "rejected",
        "count": 15
      }
    ],
    "byCategory": [
      {
        "categoryId": "...",
        "categoryName": "Kategoriya nomi",
        "count": 45
      },
      ...
    ],
    "topProducts": [
      {
        "productId": "...",
        "productName": "Mahsulot nomi",
        "orderCount": 150,
        "quantitySold": 450,
        "revenue": 22500000
      },
      ...
    ],
    "recentProducts": [
      {
        "_id": "...",
        "name": "Yangi mahsulot",
        "status": "active",
        "price": 50000,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "category": {
          "_id": "...",
          "name": "Kategoriya"
        }
      },
      ...
    ]
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Statistikani olishda xatolik yuz berdi",
  "error": "Error message"
}
```

---

## Notes

1. **Cache:** Barcha endpoint'lar 2 daqiqa cache bilan ishlaydi (real-time ma'lumotlar uchun qisqa vaqt).

2. **Vaqt oralig'i:** 
   - `today` - bugungi kun (00:00:00 - 23:59:59)
   - `week` - oxirgi 7 kun
   - `month` - joriy oy (1-oydan boshlab)
   - `year` - joriy yil (1-yanvardan boshlab)

3. **Buyurtmalar:** Faqat `status = 'confirmed_by_customer'` bo'lgan buyurtmalar hisobga olinadi.

4. **Moliyaviy hisob:**
   - KPI bonuslar xarajat sifatida hisoblanadi
   - Sof foyda = Daromad - (KPI + Contragent to'lovlari)

5. **Chart ma'lumotlari:**
   - Kunlik statistika: oxirgi 30 kun (default)
   - Haftalik statistika: oxirgi 12 hafta (default)
   - Oylik statistika: oxirgi 12 oy (default)

---

## Last Updated
2024-01-15




