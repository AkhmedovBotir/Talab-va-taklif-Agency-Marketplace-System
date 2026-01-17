# Agent Payment API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api/agents
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
Barcha endpoint'lar `agentAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

---

## 1. To'lov Qilish Uchun Buyurtmalarni Olish

**GET** `/api/agents/payments/orders-for-payment`

**Authentication:** `agentAuth` required

**Tavsif:** Agent to'lov qilishi kerak bo'lgan buyurtmalarni olish. Bu API agentga yuborilgan (`assigned_to_agent` yoki `confirmed_by_agent` status) va hali to'lov qilinmagan buyurtmalarni qaytaradi.

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
      "status": "assigned_to_agent",
      "assignedToAgent": "507f1f77bcf86cd799439028",
      "assignedAt": "2024-01-16T10:00:00.000Z",
      "user": {
        "_id": "507f1f77bcf86cd799439030",
        "name": "Mijoz",
        "phone": "+998901234571"
      },
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Andijon viloyati",
        "type": "region"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "BULOQBOSHI",
        "type": "district"
      },
      "assignedByPunkt": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt 1",
        "phone": "+998901234567"
      },
      "paymentStatus": "unpaid",
      "paymentTransaction": null
    }
  ]
}
```

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/agents/payments/orders-for-payment" \
  -H "Authorization: Bearer <token>"
```

---

## 2. Punktga Buyurtma Uchun To'lov Qilish

**POST** `/api/agents/payments/pay-to-punkt/:orderId`

**Authentication:** `agentAuth` required

**Tavsif:** Agent punktdan buyurtmani qabul qilganda (`assigned_to_agent` status), punktga to'liq summani to'laydi.

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `orderId` | string | Yes | Buyurtma ID |

**Response:**
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli amalga oshirildi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "type": "expense",
    "category": "agent_paid_to_punkt",
    "amount": 130000,
    "order": {
      "_id": "507f1f77bcf86cd799439022",
      "orderNumber": "00001",
      "totalPrice": 130000
    },
    "description": "Agent tomonidan punktga buyurtma uchun to'liq to'lov qilindi",
    "fromUser": {
      "userType": "Agent",
      "userId": "507f1f77bcf86cd799439028"
    },
    "toUser": {
      "userType": "Punkt",
      "userId": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt 1",
        "phone": "+998901234567",
        "viloyat": "507f1f77bcf86cd799439015",
        "tuman": "507f1f77bcf86cd799439016"
      }
    },
    "status": "completed",
    "completedAt": "2024-01-16T10:00:00.000Z",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

**Misol So'rov:**
```bash
curl -X POST "http://localhost:5000/api/agents/payments/pay-to-punkt/507f1f77bcf86cd799439022" \
  -H "Authorization: Bearer <token>"
```

**Eslatma:** Bu funksiya faqat agentga yuborilgan buyurtmalar uchun ishlaydi. To'lov buyurtmaning to'liq summasiga teng (`order.totalPrice`).

---

## 3. Agent Tranzaksiyalarini Olish

**GET** `/api/agents/payments/transactions`

**Authentication:** `agentAuth` required

**Tavsif:** Agent o'zining barcha kirim/chiqim tranzaksiyalarini olish.

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
        "totalExpense": 3000000,
        "balance": 2000000,
        "qarz": 0,
        "haq": 2000000
      },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "type": "expense",
      "category": "agent_paid_to_punkt",
      "amount": 130000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
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
        "userId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234567"
        }
      },
      "status": "completed",
      "completedAt": "2024-01-16T10:00:00.000Z",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439029",
      "type": "income",
      "category": "agent_received_from_customer",
      "amount": 130000,
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "totalPrice": 130000
      },
      "description": "Mijoz tomonidan agentga buyurtma uchun to'lov qilindi",
      "fromUser": {
        "userType": "MarketplaceUser",
        "userId": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Mijoz",
          "phone": "+998901234571"
        }
      },
      "toUser": {
        "userType": "Agent",
        "userId": "507f1f77bcf86cd799439028"
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
curl -X GET "http://localhost:5000/api/agents/payments/transactions?type=income&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 4. Agent Balansini Olish

**GET** `/api/agents/payments/balance`

**Authentication:** `agentAuth` required

**Tavsif:** Agent balansini olish (kirim - chiqim).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 5000000,
    "totalExpense": 3000000,
    "balance": 2000000,
    "qarz": 0,
    "haq": 2000000
  }
}
```

**Qarz va Haq:**
- **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (agent qarzda)
- **Haq:** Agar balans musbat bo'lsa, haq = balance (agent haqida)

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/agents/payments/balance" \
  -H "Authorization: Bearer <token>"
```

---

## Tranzaksiya Kategoriyalari

### Agent Tranzaksiyalari:

- **`agent_paid_to_punkt`** - Agent punktga to'lov qiladi (chiqim)
- **`agent_received_from_customer`** - Agent mijozdan pul oladi (kirim)

---

## Workflow

### 1. Agent → Punkt (To'lov)
- Agent punktga buyurtma uchun to'lov qiladi (`agent_paid_to_punkt`)
- Agent punktga to'liq summani to'laydi (`order.totalPrice`)
- Bu agent uchun chiqim, punkt uchun kirim
- **Eslatma:** Punkt agentga buyurtma yuborishdan oldin, agentdan to'lov olinganligini tekshiradi

### 2. Punkt → Agent (Buyurtma Yuklash)
- Punkt agentga buyurtma yuboradi (`assigned_to_agent`)
- **Eslatma:** Punkt agentga bemalol buyurtma yubora oladi (to'lov tekshiruvisiz)

### 3. Agent → Punkt (To'lov)
- Agent punktga buyurtma uchun to'lov qiladi (`agent_paid_to_punkt`)
- Agent punktga to'liq summani to'laydi (`order.totalPrice`)
- Bu agent uchun chiqim, punkt uchun kirim
- **Eslatma:** Agent buyurtmani qabul qilgandan keyin to'lov qilishi kerak

### 4. Agent → Mijoz (Yetkazish)
- Agent mijozga mahsulotni yetkazadi (`confirmed_by_agent`)
- **Eslatma:** Agent buyurtmachiga yetkazishdan oldin, punktga to'lov qilganligini tekshiradi
- Agar to'lov qilinmagan bo'lsa, buyurtmachiga yetkazish mumkin emas

### 5. Mijoz → Agent (To'lov)
- Mijoz buyurtmani qabul qiladi (`confirmed_by_customer`)
- Mijoz agentga to'lov qiladi (avtomatik) - `agent_received_from_customer`
- Bu agent uchun kirim

---

## Eslatmalar

1. **Kirim/Chiqim:** 
   - **Kirim (income):** Agentga kelgan pul (mijozdan)
   - **Chiqim (expense):** Agentdan ketgan pul (punktga)

2. **To'lov:** Agent punktga to'lov qilganda, buyurtmaning to'liq summasini to'laydi (`order.totalPrice`).

3. **To'lov Tekshiruvi:** Punkt agentga buyurtma yuborishdan oldin, agentdan to'lov olinganligini tekshiradi. Agar to'lov qilinmagan bo'lsa, buyurtma yuborilmaydi va xatolik qaytariladi.

4. **Mijoz To'lovi:** Mijoz buyurtmani tasdiqlaganda (`confirmDelivery`), avtomatik ravishda agentga to'lov tranzaksiyasi yaratiladi.

5. **Balance:** Balans = Jami kirim - Jami chiqim

6. **Qarz va Haq:**
   - **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (agent qarzda)
   - **Haq:** Agar balans musbat bo'lsa, haq = balance (agent haqida)

7. **To'lov Qilish Uchun Buyurtmalar:** Agent to'lov qilishi kerak bo'lgan buyurtmalarni ko'rish uchun `/payments/orders-for-payment` API'sidan foydalanish mumkin.

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Agent Payment API - Punktga to'lov, tranzaksiyalar va balans
