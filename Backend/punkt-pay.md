# Punkt Payment API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api/punkts
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
- `201` - Muvaffaqiyatli yaratildi
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya talab qilinadi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

### Authentication
Barcha endpoint'lar `punktAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

---

## 1. Zaklad Berish Uchun Buyurtmalarni Olish

**GET** `/api/punkts/payments/orders-for-zaklad`

**Authentication:** `punktAuth` required

**Tavsif:** Punkt kontragentlarga zaklad berish uchun buyurtmalarni olish. Bu API kontragentlar tomonidan punktga yetkazilgan (`delivered_to_punkt` status) va hali zaklad berilmagan buyurtmalarni qaytaradi.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "orderNumber": "00001",
      "totalPrice": 130000,
      "totalOriginalPrice": 100000,
      "status": "delivered_to_punkt",
      "contragentRequestsForZaklad": [
        {
          "_id": "507f1f77bcf86cd799439023",
          "contragentId": {
            "_id": "507f1f77bcf86cd799439026",
            "name": "Kontragent 1",
            "inn": "123456789",
            "phone": "+998901234569"
          },
          "status": "delivered_to_punkt",
          "deliveredToPunktAt": "2024-01-16T10:00:00.000Z",
          "potentialZakladAmount": 52000
        }
      ]
    }
  ]
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/punkts/payments/orders-for-zaklad" \
  -H "Authorization: Bearer <token>"
```

---

## 2. Kontragentga Zaklad Berish

**POST** `/api/punkts/payments/pay-zaklad`

**Authentication:** `punktAuth` required

**Tavsif:** Punkt kontragentga zaklad (foiz) beradi. Bu kontragent buyurtmani punktga yetkazgandan keyin (`delivered_to_punkt` status) amalga oshiriladi.

**Request Body:**
```json
{
  "orderId": "507f1f77bcf86cd799439022",
  "contragentRequestId": "507f1f77bcf86cd799439023",
  "zakladPercentage": 40
}
```

**Request Body Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `orderId` | string | Yes | Buyurtma ID |
| `contragentRequestId` | string | Yes | Kontragent so'rovi ID (order.contragentRequests[]._id) |
| `zakladPercentage` | number | Yes | Zaklad foizi (0-100) |

**Response:**
```json
{
  "success": true,
  "message": "Zaklad muvaffaqiyatli berildi",
  "data": {
    "punktTransaction": {
      "_id": "507f1f77bcf86cd799439021",
      "type": "expense",
      "category": "punkt_to_contragent_zaklad",
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
        "userId": "507f1f77bcf86cd799439025"
      },
      "toUser": {
        "userType": "Contragent",
        "userId": {
          "_id": "507f1f77bcf86cd799439026",
          "name": "Kontragent 1",
          "inn": "123456789",
          "phone": "+998901234569"
        }
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    "contragentTransaction": {
      "_id": "507f1f77bcf86cd799439027",
      "type": "income",
      "category": "contragent_received_zaklad",
      "amount": 52000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "toUser": {
        "userType": "Contragent",
        "userId": {
          "_id": "507f1f77bcf86cd799439026",
          "name": "Kontragent 1",
          "inn": "123456789",
          "phone": "+998901234569"
        }
      },
      "zakladPercentage": 40,
      "description": "Kontragent punktdan zaklad oldi (40%)",
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z"
    }
  }
}
```

**Eslatma:** Bu API ikkita transaction yaratadi:
- **Punkt uchun:** `punkt_to_contragent_zaklad` (expense) - punkt uchun chiqim
- **Kontragent uchun:** `contragent_received_zaklad` (income) - kontragent uchun kirim

**Misol So'rov:**
```bash
curl -X POST "http://localhost:5000/api/punkts/payments/pay-zaklad" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "507f1f77bcf86cd799439022",
    "contragentRequestId": "507f1f77bcf86cd799439023",
    "zakladPercentage": 40
  }'
```

**Eslatma:** Zaklad summasi buyurtma itemlarining jami narxidan (`price * quantity`) foiz bo'yicha hisoblanadi. Masalan, agar buyurtmada 2 ta item bo'lsa va har birining narxi 65000 so'm bo'lsa, jami 130000 so'm. 40% zaklad = 52000 so'm.

---

## 3. Punkt Tranzaksiyalarini Olish

**GET** `/api/punkts/payments/transactions`

**Authentication:** `punktAuth` required

**Tavsif:** Punkt o'zining barcha kirim/chiqim tranzaksiyalarini olish.

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
        "totalExpense": 2000000,
        "balance": 3000000,
        "qarz": 0,
        "haq": 3000000
      },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "type": "income",
      "category": "punkt_received_from_admin",
      "amount": 1000000,
      "description": "Admin tomonidan punktga pul yuborildi",
      "order": null,
      "fromUser": {
        "userType": "Admin",
        "userId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Admin",
          "phone": "+998901234567"
        }
      },
      "toUser": {
        "userType": "Punkt",
        "userId": "507f1f77bcf86cd799439025"
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "type": "expense",
      "category": "punkt_to_contragent_zaklad",
      "amount": 52000,
      "order": {
        "_id": "507f1f77bcf86cd799439023",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "zakladPercentage": 40,
      "description": "Punkt tomonidan kontragentga zaklad berildi (40%)",
      "fromUser": {
        "userType": "Punkt",
        "userId": "507f1f77bcf86cd799439025"
      },
      "toUser": {
        "userType": "Contragent",
        "userId": {
          "_id": "507f1f77bcf86cd799439026",
          "name": "Kontragent 1",
          "inn": "123456789",
          "phone": "+998901234569"
        }
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439027",
      "type": "income",
      "category": "punkt_received_from_agent",
      "amount": 130000,
      "order": {
        "_id": "507f1f77bcf86cd799439023",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "description": "Agent tomonidan punktga buyurtma uchun to'liq to'lov qilindi",
      "fromUser": {
        "userType": "Agent",
        "userId": {
          "_id": "507f1f77bcf86cd799439028",
          "name": "Agent 1",
          "phone": "+998901234570"
        }
      },
      "toUser": {
        "userType": "Punkt",
        "userId": "507f1f77bcf86cd799439025"
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
curl -X GET "http://localhost:5000/api/punkts/payments/transactions?type=income&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 4. Punkt Balansini Olish

**GET** `/api/punkts/payments/balance`

**Authentication:** `punktAuth` required

**Tavsif:** Punkt balansini olish (kirim - chiqim).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 5000000,
    "totalExpense": 2000000,
    "balance": 3000000,
    "qarz": 0,
    "haq": 3000000
  }
}
```

**Qarz va Haq:**
- **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (punkt qarzda)
- **Haq:** Agar balans musbat bo'lsa, haq = balance (punkt haqida)

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/punkts/payments/balance" \
  -H "Authorization: Bearer <token>"
```

---

## Tranzaksiya Kategoriyalari

### Punkt Tranzaksiyalari:

- **`punkt_received_from_admin`** - Punkt admin'dan pul oladi (kirim)
- **`punkt_to_contragent_zaklad`** - Punkt kontragentga zaklad beradi (chiqim) - kontragent mahsulotni punktga yetkazgandan keyin
- **`punkt_to_contragent_final_payment`** - Punkt kontragentga qolgan asl narx to'laydi (chiqim) - mijoz buyurtmani tasdiqlagandan keyin
- **`punkt_to_contragent_profit`** - Punkt kontragentga sof foyda to'laydi (chiqim) - mijoz buyurtmani tasdiqlagandan keyin
- **`punkt_received_from_agent`** - Punkt agentdan pul oladi (kirim) - agent buyurtma uchun to'lov qilganda

---

## Workflow

### 1. Admin → Punkt
- Admin punktga pul yuboradi
- Punkt bu pulni kirim sifatida qabul qiladi

### 2. Punkt → Kontragent (Zaklad)
- Kontragent buyurtmani punktga yetkazadi (`delivered_to_punkt`)
- Punkt kontragentga zaklad (30-40%) beradi
- Zaklad summasi buyurtma itemlarining jami narxidan (`price * quantity`) foiz bo'yicha hisoblanadi
- Bu operatsiya ikkita transaction yaratadi:
  - **Punkt uchun:** `punkt_to_contragent_zaklad` (expense) - punkt uchun chiqim
  - **Kontragent uchun:** `contragent_received_zaklad` (income) - kontragent uchun kirim

### 3. Punkt → Agent (Buyurtma Yuklash)
- Punkt agentga buyurtma yuboradi (`assigned_to_agent`)
- **Eslatma:** Punkt agentga bemalol buyurtma yubora oladi (to'lov tekshiruvisiz)

### 4. Agent → Punkt (To'lov)
- Agent buyurtmani qabul qilgandan keyin punktga to'liq summani to'laydi (`agent_paid_to_punkt`)
- Punkt bu pulni kirim sifatida qabul qiladi

### 5. Agent → Mijoz (Yetkazish)
- Agent punktga to'lov qilgach, mijozga mahsulotni yetkazadi (`confirmed_by_agent`)
- **Eslatma:** Agent buyurtmachiga yetkazishdan oldin, punktga to'lov qilganligini tekshiradi

### 6. Mijoz → Agent (To'lov)
- Mijoz buyurtmani tasdiqlaydi (`confirmed_by_customer`)
- Mijoz agentga to'lov qiladi (avtomatik) - bu agent uchun kirim

### 7. Punkt → Kontragent (Qolgan Summalar)
- Mijoz buyurtmani tasdiqlagandan keyin, punkt kontragentga qolgan summalarni to'laydi:
  - **Qolgan asl narx** (`punkt_to_contragent_final_payment`): Jami asl narx - zaklad (proportional)
  - **Sof foyda** (`punkt_to_contragent_profit`): Jami narx - jami asl narx
- Bu kontragent uchun kirim, punkt uchun chiqim

---

## Eslatmalar

1. **Kirim/Chiqim:** 
   - **Kirim (income):** Punktga kelgan pul (admin'dan, agentdan)
   - **Chiqim (expense):** Punktdan ketgan pul (kontragentga zaklad, qolgan asl narx, sof foyda)

2. **Zaklad:** Zaklad faqat kontragent buyurtmani punktga yetkazgandan keyin beriladi. Zaklad buyurtma itemlarining jami narxidan (`price * quantity`) foiz bo'yicha hisoblanadi.

3. **Qolgan Summalar:** Mijoz buyurtmani tasdiqlagandan keyin, punkt kontragentga qolgan summalarni to'laydi:
   - **Qolgan asl narx:** Jami asl narx - zaklad (zaklad price dan hisoblangani uchun, original ga proportional qilib hisoblanadi)
   - **Sof foyda:** Jami narx - jami asl narx

4. **Agent To'lov Tekshiruvi:** Punkt agentga bemalol buyurtma yubora oladi. Agent buyurtmani qabul qilgandan keyin punktga to'lov qilishi kerak. Agent to'lov qilgach, buyurtmachiga yetkazish mumkin.

5. **Balance:** Balans = Jami kirim - Jami chiqim

6. **Qarz va Haq:**
   - **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (punkt qarzda)
   - **Haq:** Agar balans musbat bo'lsa, haq = balance (punkt haqida)

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Punkt Payment API - Kontragentga zaklad berish, tranzaksiyalar va balans
