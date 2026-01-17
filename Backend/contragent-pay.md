# Contragent Payment API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api/contragents
```

### Response Format
Barcha API javoblari quyidagi formatda qaytariladi:

**Muvaffaqiyatli javob:**
```json
{
  "success": true,
  "message": "Xabar",
  "data": { ... }
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
Barcha endpoint'lar `contragentAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

---

## 1. Kontragent Zaklad Ma'lumotlarini Olish (Qarz/Haq)

**GET** `/api/contragents/finance/zaklad-info`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining zaklad ma'lumotlarini olish (qarz/haq). Bu API kontragentga berilgan zakladlarni va hali berilmagan zakladlarni ko'rsatadi.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `orderId` | string | No | Buyurtma ID (filtrlash uchun) |
| `contragentRequestId` | string | No | Kontragent so'rovi ID (filtrlash uchun) |

**Response:**
```json
{
  "success": true,
  "data": {
    "zakladTransactions": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "type": "income",
        "category": "contragent_received_zaklad",
        "amount": 52000,
        "order": {
          "_id": "507f1f77bcf86cd799439022",
          "orderNumber": "00001",
          "totalPrice": 130000,
          "totalOriginalPrice": 100000
        },
        "contragentRequest": "507f1f77bcf86cd799439023",
        "zakladPercentage": 40,
        "fromUser": {
          "userType": "Punkt",
          "userId": {
            "_id": "507f1f77bcf86cd799439025",
            "name": "Punkt 1",
            "phone": "+998901234567"
          }
        },
        "status": "completed",
        "completedAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "zakladTotal": 52000,
    "pendingZaklads": [
      {
        "orderId": "507f1f77bcf86cd799439022",
        "orderNumber": "00002",
        "contragentRequestId": "507f1f77bcf86cd799439024",
        "potentialZakladAmount": 60000,
        "deliveredAt": "2024-01-16T11:00:00.000Z"
      }
    ],
    "summary": {
      "totalZakladReceived": 52000,
      "pendingZakladCount": 1,
      "pendingZakladTotal": 60000
    }
  }
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/finance/zaklad-info?orderId=507f1f77bcf86cd799439022" \
  -H "Authorization: Bearer <token>"
```

---

## 2. Kontragent Tranzaksiyalarini Olish (Yangi Moliya Tizimi)

**GET** `/api/contragents/finance/transactions`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining barcha kirim/chiqim tranzaksiyalarini olish (yangi moliya tizimi - FinanceTransaction).

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `type` | string | No | Tranzaksiya turi (`income`, `expense`) |
| `category` | string | No | Tranzaksiya kategoriyasi |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi tranzaksiyalar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
      "summary": {
        "totalIncome": 5000000,
        "totalExpense": 0,
        "balance": 5000000,
        "qarz": 0,
        "haq": 5000000
      },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "type": "income",
      "category": "contragent_received_zaklad",
      "amount": 52000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "contragentRequest": "507f1f77bcf86cd799439023",
      "zakladPercentage": 40,
      "description": "Punkt tomonidan kontragentga zaklad berildi (40%)",
      "fromUser": {
        "userType": "Punkt",
        "userId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234567"
        }
      },
      "toUser": {
        "userType": "Contragent",
        "userId": "507f1f77bcf86cd799439026"
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439027",
      "type": "income",
      "category": "contragent_received_final_payment",
      "amount": 78000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "contragentRequest": "507f1f77bcf86cd799439023",
      "description": "Punkt tomonidan kontragentga qolgan asl narx to'landi",
      "fromUser": {
        "userType": "Punkt",
        "userId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234567"
        }
      },
      "toUser": {
        "userType": "Contragent",
        "userId": "507f1f77bcf86cd799439026"
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439028",
      "type": "income",
      "category": "contragent_received_profit",
      "amount": 30000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "contragentRequest": "507f1f77bcf86cd799439023",
      "description": "Punkt tomonidan kontragentga sof foyda to'landi",
      "fromUser": {
        "userType": "Punkt",
        "userId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234567"
        }
      },
      "toUser": {
        "userType": "Contragent",
        "userId": "507f1f77bcf86cd799439026"
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/finance/transactions?type=income&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 3. Kontragent Balansini Olish (Yangi Moliya Tizimi)

**GET** `/api/contragents/finance/balance`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent balansini olish (kirim - chiqim) - yangi moliya tizimi.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 5000000,
    "totalExpense": 0,
    "balance": 5000000,
    "qarz": 0,
    "haq": 5000000
  }
}
```

**Qarz va Haq:**
- **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (kontragent qarzda)
- **Haq:** Agar balans musbat bo'lsa, haq = balance (kontragent haqida)

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/finance/balance" \
  -H "Authorization: Bearer <token>"
```

---

## 4. To'langan To'lovlarni Olish (Eski KPI Payment Tizimi)

**GET** `/api/contragents/payments/paid`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining to'langan to'lovlarini olish (eski KPI payment tizimi - ContragentPaymentDistribution).

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi to'lovlar soni (default: 50) |
| `startDate` | date | No | To'lov sanasi boshlanishi |
| `endDate` | date | No | To'lov sanasi tugashi |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "contragent": "507f1f77bcf86cd799439026",
      "amount": 500000,
      "status": "paid",
      "paidAt": "2024-01-16T10:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Admin",
        "phone": "+998901234567"
      },
      "orders": [
        {
          "_id": "507f1f77bcf86cd799439022",
          "orderNumber": "00001",
          "totalPrice": 130000,
          "totalKpiPrice": 19500,
          "createdAt": "2024-01-16T10:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-20T10:00:00.000Z",
      "isOverdue": false,
      "notes": "To'lov muvaffaqiyatli amalga oshirildi",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/paid?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

---

## 5. To'lanmagan To'lovlarni Olish (Eski KPI Payment Tizimi)

**GET** `/api/contragents/payments/unpaid`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining to'lanmagan to'lovlarini olish (eski KPI payment tizimi).

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi to'lovlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "contragent": "507f1f77bcf86cd799439026",
      "amount": 300000,
      "status": "pending",
      "paidAt": null,
      "paidBy": null,
      "orders": [
        {
          "_id": "507f1f77bcf86cd799439022",
          "orderNumber": "00002",
          "totalPrice": 200000,
          "totalKpiPrice": 30000,
          "createdAt": "2024-01-16T10:00:00.000Z"
        }
      ],
      "dueDate": "2024-01-18T10:00:00.000Z",
      "isOverdue": true,
      "notes": null,
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/unpaid?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 6. To'lov Statistikalari (Eski KPI Payment Tizimi)

**GET** `/api/contragents/payments/statistics`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining to'lov statistikasini olish (eski KPI payment tizimi).

**Response:**
```json
{
  "success": true,
  "data": {
    "paid": {
      "total": 5000000,
      "count": 25
    },
    "unpaid": {
      "total": 1500000,
      "count": 8
    }
  }
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/statistics" \
  -H "Authorization: Bearer <token>"
```

---

## 7. To'lovni ID bo'yicha Olish (Eski KPI Payment Tizimi)

**GET** `/api/contragents/payments/payment/:id`

**Authentication:** `contragentAuth` required

**Tavsif:** Kontragent o'zining to'lovini ID bo'yicha olish (eski KPI payment tizimi).

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `id` | string | Yes | To'lov ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "contragent": "507f1f77bcf86cd799439026",
    "amount": 500000,
    "status": "paid",
    "paidAt": "2024-01-16T10:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Admin",
      "phone": "+998901234567"
    },
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000,
        "totalKpiPrice": 19500,
        "createdAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "dueDate": "2024-01-20T10:00:00.000Z",
    "isOverdue": false,
    "notes": "To'lov muvaffaqiyatli amalga oshirildi",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/contragents/payments/payment/507f1f77bcf86cd799439021" \
  -H "Authorization: Bearer <token>"
```

---

## Tranzaksiya Kategoriyalari (Yangi Moliya Tizimi)

### Kontragent Tranzaksiyalari:

- **`contragent_received_zaklad`** - Kontragent punktdan zaklad oladi (kirim) - kontragent mahsulotni punktga yetkazgandan keyin
- **`contragent_received_final_payment`** - Kontragent punktdan qolgan asl narx oladi (kirim) - mijoz buyurtmani tasdiqlagandan keyin
- **`contragent_received_profit`** - Kontragent punktdan sof foyda oladi (kirim) - mijoz buyurtmani tasdiqlagandan keyin
- **`contragent_received_full_payment`** - Kontragent punktdan to'liq to'lov oladi (kirim) - deprecated

---

## Workflow

### 1. Punkt → Kontragent (Zaklad)
- Kontragent buyurtmani punktga yetkazadi (`delivered_to_punkt`)
- Punkt kontragentga zaklad (30-40%) beradi
- Bu kontragent uchun kirim

**Zaklad Hisoblash:**
- Zaklad buyurtma itemlarining jami narxidan (`price * quantity`) foiz bo'yicha hisoblanadi
- Masalan: Buyurtmada 2 ta item, har birining narxi 65000 so'm = 130000 so'm jami
- 40% zaklad = 52000 so'm

### 2. Mijoz Tasdiqlagandan Keyin - Punkt → Kontragent (Qolgan Summalar)
- Mijoz buyurtmani tasdiqlaydi (`confirmed_by_customer`)
- Punkt kontragentga qolgan summalarni to'laydi:
  - **Qolgan asl narx** (`contragent_received_final_payment`): Jami asl narx - zaklad (proportional)
  - **Sof foyda** (`contragent_received_profit`): Jami narx - jami asl narx
- Bu kontragent uchun kirim

**Hisoblash:**
- Qolgan asl narx = Jami asl narx - (zaklad * original/price ratio)
- Sof foyda = Jami narx - Jami asl narx

**Misol:**
- Jami narx: 130,000 so'm
- Jami asl narx: 100,000 so'm
- Zaklad (40%): 52,000 so'm (narxdan)
- Qolgan asl narx: 100,000 - (52,000 * 100,000/130,000) = 100,000 - 40,000 = 60,000 so'm
- Sof foyda: 130,000 - 100,000 = 30,000 so'm

---

## Eslatmalar

1. **Ikki Xil Moliya Tizimi:**
   - **Yangi Moliya Tizimi** (`/finance/*`): `FinanceTransaction` modeli - zaklad, qolgan asl narx, sof foyda
   - **Eski KPI Payment Tizimi** (`/payments/*`): `ContragentPaymentDistribution` modeli - KPI to'lovlari

2. **Kirim/Chiqim (Yangi Tizim):** 
   - **Kirim (income):** Kontragentga kelgan pul (punktdan zaklad, qolgan asl narx, sof foyda)
   - **Chiqim (expense):** Kontragentdan ketgan pul (hozircha yo'q)

3. **Zaklad:** Zaklad faqat kontragent buyurtmani punktga yetkazgandan keyin beriladi. Zaklad buyurtma itemlarining jami narxidan (`price * quantity`) foiz bo'yicha hisoblanadi.

4. **Qolgan Summalar:** Mijoz buyurtmani tasdiqlagandan keyin, punkt kontragentga qolgan summalarni to'laydi:
   - **Qolgan asl narx:** Jami asl narx - zaklad (zaklad price dan hisoblangani uchun, original ga proportional qilib hisoblanadi)
   - **Sof foyda:** Jami narx - jami asl narx

5. **Balance:** Balans = Jami kirim - Jami chiqim

6. **Zaklad Foizi:** Punkt har bir buyurtma uchun o'zi belgilagan foizda (30-40%) zaklad beradi.

7. **To'lov Muddati:** Eski KPI payment tizimida `dueDate` maydoni mavjud. Agar to'lov muddati o'tgan bo'lsa va hali to'lanmagan bo'lsa, `isOverdue: true` bo'ladi.

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-17  
**Structure:** Contragent Payment API - Tranzaksiyalar, balans va to'lovlar (yangi va eski tizimlar)
