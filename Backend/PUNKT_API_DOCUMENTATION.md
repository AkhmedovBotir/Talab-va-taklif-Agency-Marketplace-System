# Punkt API Documentation

## Umumiy ma'lumotlar

### Base URL
```
/api/punkt
```

### Response Format
Barcha response'lar quyidagi formatda qaytariladi:
```json
{
  "success": true/false,
  "message": "Xabar matni",
  "data": {}
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

---

## Autentifikatsiya

### Token Format
Barcha protected endpoint'lar uchun `Authorization` header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

### Token Olish
Token olish uchun login endpoint'ini ishlatish kerak (qarang: Punkt Auth API).

---

## Tuman Savdo Oqimi

### Oqim Tavsifi

1. **Marketplace User** buyurtma yaratadi (`POST /api/marketplace/orders`)
   - Buyurtma `deliveryViloyat`, `deliveryTuman`, `deliveryMfy` field'lari bilan yaratiladi
   - Status: `pending`
   - **Adminlar** barcha buyurtmalarni ko'radi
   - **Agentlar** faqat ularga yuborilgan buyurtmalarni ko'radi
   - **Punktlar** o'z tumanidagi buyurtmalarni ko'radi

2. **Punkt** o'z tumanidagi buyurtmalarni ko'radi (`GET /api/punkt/orders`)
   - Faqat punktning `tuman` field'i bilan mos keladigan buyurtmalar ko'rinadi
   - Filter: `deliveryTuman = punkt.tuman`

3. **Punkt** buyurtmani tasdiqlaydi (`POST /api/punkt/orders/:id/confirm`)
   - Status: `confirmed_by_punkt`
   - Punkt faqat o'z tumanidagi buyurtmalarni tasdiqlashi mumkin

4. **Punkt** maxsulotlarni tekshiradi va quyidagi holatlardan birini tanlaydi:

   **Holat 1: Maxsulotlar o'z tumanidagi contragentlarda**
   - **Punkt** o'z tumanidagi contragentga so'rov yuboradi (`POST /api/punkt/orders/:id/request-to-contragent`)
   - Status: `requested_to_contragent`
   - **Contragent** so'rovga javob beradi va mahsulotni olib keladi
   - Contragent `delivered_to_punkt` status'ini belgilaydi
   - **Punkt** kontragentdan qabul qiladi (`POST /api/punkt/orders/:id/receive-from-contragent`)
   - Status: `delivered_to_punkt`

   **Holat 2: Maxsulotlar boshqa tumanidagi contragentlarda**
   - **Punkt** boshqa tuman punktiga so'rov yuboradi (`POST /api/punkt/orders/:id/request-to-punkt`)
   - Status: `requested_to_contragent` (punkt-to-punkt request)
   - **Boshqa tuman punkti** so'rovga javob beradi (`POST /api/punkt/punkt-to-punkt-requests/:orderId/respond`)
   - **Boshqa tuman punkti** o'z contragentiga so'rov yuboradi
   - **Contragent** mahsulotni olib kelib boshqa tuman punktiga topshiradi
   - **Boshqa tuman punkti** buyurtmani asosiy tuman punktiga yuboradi (`POST /api/punkt/orders/:id/send-to-punkt`)
   - **Asosiy tuman punkti** buyurtmani qabul qiladi (`POST /api/punkt/orders/:id/receive-from-punkt`)
   - Status: `delivered_to_punkt`

   **Holat 3: Qisman o'z tumanida, qisman boshqa tumanlarda**
   - Ikkala holatdan foydalanadi
   - Punkt barcha qismlarni jamlab oladi

5. **Punkt** barcha qismlarni jamlab olgach, o'z hududidagi MFY agentiga yuboradi (`POST /api/punkt/orders/:id/assign-to-agent`)
   - Status: `assigned_to_agent`
   - Agent faqat buyurtmaning `deliveryMfy` field'i bilan mos keladigan agentlarga yuboriladi

6. **Agent** buyurtmani foydalanuvchiga topshiradi
   - Status: `confirmed_by_agent`

7. **Foydalanuvchi** buyurtmani olganligini tasdiqlaydi
   - Status: `confirmed_by_customer`

---

## Endpoint'lar

### 1. Get My Orders

**GET** `/api/punkt/orders`

Punkt o'z hududidagi buyurtmalarni olish. Punkt faqat o'z tumanidagi buyurtmalarni ko'radi.

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `paymentStatus` (string, optional) - Filter by payment status
- `paymentMethod` (string, optional) - Filter by payment method
- `orderNumber` (string, optional) - Search by order number
- `startDate` (date, optional) - Start date filter
- `endDate` (date, optional) - End date filter
- `minTotalPrice` (number, optional) - Minimum total price
- `maxTotalPrice` (number, optional) - Maximum total price
- `search` (string, optional) - Search in order number or user phone
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

**Filter Logic:**
- Punkt o'z tumanidagi buyurtmalarni ko'radi: `deliveryTuman = punkt.tuman`
- Punkt o'z viloyatidagi buyurtmalarni ko'radi: `deliveryViloyat = punkt.viloyat`
- Punkt `currentPunkt` bo'lgan buyurtmalar
- Punkt punkt-to-punkt so'rovlarida ishtirok etgan buyurtmalar

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
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2024-0001",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Product Name",
            "price": 10000,
            "contragent": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Contragent Name",
              "inn": "123456789",
              "phone": "+998901234567",
              "status": "active",
              "contragentLevel": "tuman",
              "logo": "https://example.com/logo.jpg",
              "viloyat": {
                "_id": "507f1f77bcf86cd799439015",
                "name": "Toshkent viloyati",
                "type": "region",
                "code": "TK"
              },
              "tuman": {
                "_id": "507f1f77bcf86cd799439016",
                "name": "Buloqboshi tumani",
                "type": "district",
                "code": "BQ"
              },
              "mfy": {
                "_id": "507f1f77bcf86cd799439017",
                "name": "Yangiobod MFY",
                "type": "mfy",
                "code": "YB"
              }
            }
          },
          "quantity": 2,
          "price": 10000
        }
      ],
      "totalPrice": 20000,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "cash",
      "deliveryViloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region"
      },
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani",
        "type": "district"
      },
      "deliveryMfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Yangiobod MFY",
        "type": "mfy"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Today's Orders

**GET** `/api/punkt/orders/today`

Bugungi buyurtmalarni olish (faqat punktning tumanidagi).

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2024-0001",
      "status": "pending",
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Order History

**GET** `/api/punkt/orders/history`

O'tgan kunlardagi buyurtmalarni olish (faqat punktning tumanidagi).

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 20,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2024-0001",
      "status": "confirmed_by_customer",
      "deliveryTuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani"
      },
      "createdAt": "2023-12-31T00:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Order By ID

**GET** `/api/punkt/orders/:id`

Buyurtmani ID bo'yicha olish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "phone": "+998901234567"
    },
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Product Name",
          "price": 10000,
          "contragent": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Contragent Name",
            "inn": "123456789",
            "phone": "+998901234567",
            "status": "active",
            "contragentLevel": "tuman",
            "logo": "https://example.com/logo.jpg",
            "viloyat": {
              "_id": "507f1f77bcf86cd799439015",
              "name": "Toshkent viloyati",
              "type": "region",
              "code": "TK"
            },
            "tuman": {
              "_id": "507f1f77bcf86cd799439016",
              "name": "Buloqboshi tumani",
              "type": "district",
              "code": "BQ"
            },
            "mfy": {
              "_id": "507f1f77bcf86cd799439017",
              "name": "Yangiobod MFY",
              "type": "mfy",
              "code": "YB"
            }
          }
        },
        "quantity": 2,
        "price": 10000
      }
    ],
    "totalPrice": 20000,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati",
      "type": "region"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani",
      "type": "district"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY",
      "type": "mfy"
    },
    "contragentRequests": [],
    "punktRequests": [],
    "punktToPunktRequests": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Confirm Order

**POST** `/api/punkt/orders/:id/confirm`

Buyurtmani tasdiqlash. Punkt faqat o'z tumanidagi buyurtmalarni tasdiqlashi mumkin.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Validation:**
- Buyurtma punktning tumaniga tegishli bo'lishi kerak
- Buyurtma allaqachon tasdiqlanmagan bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt Name"
    },
    "confirmedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Bu buyurtma allaqachon tasdiqlangan

---

### 6. Request To Contragent

**POST** `/api/punkt/orders/:id/request-to-contragent`

Kontragentga so'rov yuborish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "contragentId": "507f1f77bcf86cd799439014"
}
```

**Validation:**
- Buyurtma punktning tumaniga tegishli bo'lishi kerak YOKI punkt hozirgi punkt bo'lishi kerak
- Kontragent faol bo'lishi kerak
- Buyurtmada kontragentning mahsulotlari bo'lishi kerak
- Kontragent punktning tumanida yoki boshqa tumanida bo'lishi mumkin (punkt-to-punkt so'rov orqali)

**Response:**
```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Contragent Name",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "contragentRequests": [
      {
        "contragentId": "507f1f77bcf86cd799439014",
        "itemIds": [0, 1],
        "status": "pending",
        "requestedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `404` - Contragent topilmadi
- `400` - Contragent faol emas
- `400` - Bu contragentga allaqachon so'rov yuborilgan
- `400` - Bu buyurtmada tanlangan contragentning mahsulotlari yo'q

---

### 7. Receive From Contragent

**POST** `/api/punkt/orders/:id/receive-from-contragent`

Kontragentdan buyurtma qabul qilish. Kontragent mahsulotni olib kelgandan keyin.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Validation:**
- Buyurtmada `delivered_to_punkt` status'li contragent request bo'lishi kerak
- Punkt buyurtmani so'ragan punkt bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma contragentdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "status": "delivered_to_punkt",
    "contragentRequests": [
      {
        "contragentId": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Contragent Name"
        },
        "status": "delivered_to_punkt",
        "deliveredAt": "2024-01-01T14:00:00.000Z"
      }
    ],
    "currentPunkt": "507f1f77bcf86cd799439018"
  }
}
```

**Error Responses:**
- `404` - Contragentdan buyurtma hali yetkazilmagan
- `403` - Bu buyurtma sizning punktingizga tegishli emas

---

### 8. Assign Order To Agent

**POST** `/api/punkt/orders/:id/assign-to-agent`

Buyurtmani agentga yuborish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439019"
}
```

**Validation:**
- Buyurtma punktning tumaniga tegishli bo'lishi kerak YOKI punkt hozirgi punkt bo'lishi kerak
- Buyurtma punkt tomonidan tasdiqlangan bo'lishi kerak YOKI punkt hozirgi punkt bo'lishi kerak
- Agent faol bo'lishi kerak
- Agent punktning tumanida bo'lishi kerak
- Agent buyurtmaning `deliveryMfy` field'i bilan mos kelishi kerak (agar buyurtmada `deliveryMfy` bo'lsa)
- Agar buyurtmada `deliveryMfy` bo'lmasa, agent buyurtmaning `deliveryTuman` field'i bilan mos kelishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma agentga muvaffaqiyatli yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "status": "assigned_to_agent",
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439019",
      "name": "Agent Name",
      "phone": "+998901234568"
    },
    "assignedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt Name"
    },
    "assignedAt": "2024-01-01T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `403` - Bu buyurtma sizning hududingizga tegishli emas
- `400` - Bu buyurtma hali punkt tomonidan tasdiqlanmagan
- `404` - Agent topilmadi
- `400` - Agent faol emas
- `400` - Agent sizning tumaningizda emas

---

### 9. Get Order Contragent IDs

**GET** `/api/punkt/orders/:id/contragents`

Buyurtmadagi mahsulotlarning contragent ID'larini olish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Response:**
```json
{
  "success": true,
  "contragentIds": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439020"
  ]
}
```

---

### 10. Get Punkt Requests

**GET** `/api/punkt/requests`

O'z punktiga kelgan so'rovlarni olish.

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status: 'pending', 'accepted', 'rejected'
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2024-0001",
      "punktRequests": [
        {
          "punktId": {
            "_id": "507f1f77bcf86cd799439018",
            "name": "Punkt Name"
          },
          "status": "pending",
          "requestedAt": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 11. Respond To Request

**POST** `/api/punkt/requests/:orderId/respond`

So'rovga javob berish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `orderId` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Response Values:**
- `accepted` - So'rov qabul qilindi
- `rejected` - So'rov rad etildi

**Response:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi va buyurtma tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "status": "confirmed_by_punkt",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Punkt Name"
    }
  }
}
```

**Error Responses:**
- `404` - Sizga so'rov yuborilmagan
- `400` - Bu so'rovga allaqachon javob berilgan
- `400` - Javob "accepted" yoki "rejected" bo'lishi kerak

---

### 12. Request To Punkt

**POST** `/api/punkt/orders/:id/request-to-punkt`

Boshqa punktga so'rov yuborish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "toPunktId": "507f1f77bcf86cd799439021"
}
```

**Validation:**
- Buyurtma punktning tumaniga tegishli bo'lishi kerak
- ToPunkt faol bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "From Punkt"
        },
        "toPunktId": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "To Punkt"
        },
        "status": "pending",
        "requestedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 13. Get Punkt To Punkt Requests

**GET** `/api/punkt/punkt-to-punkt-requests`

Boshqa punktlardan kelgan so'rovlarni olish.

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status: 'pending', 'accepted', 'rejected', 'delivered'
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2024-0001",
      "punktToPunktRequests": [
        {
          "fromPunktId": {
            "_id": "507f1f77bcf86cd799439018",
            "name": "From Punkt"
          },
          "toPunktId": {
            "_id": "507f1f77bcf86cd799439021",
            "name": "To Punkt"
          },
          "status": "pending",
          "requestedAt": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 14. Respond To Punkt To Punkt Request

**POST** `/api/punkt/punkt-to-punkt-requests/:orderId/respond`

Punktdan punktga so'rovga javob berish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `orderId` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Response Values:**
- `accepted` - So'rov qabul qilindi
- `rejected` - So'rov rad etildi

**Response:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "507f1f77bcf86cd799439018",
          "name": "From Punkt"
        },
        "toPunktId": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "To Punkt"
        },
        "status": "accepted",
        "respondedAt": "2024-01-01T13:00:00.000Z"
      }
    ]
  }
}
```

---

### 15. Send To Punkt

**POST** `/api/punkt/orders/:id/send-to-punkt`

Buyurtmani boshqa punktga yuborish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Request Body:**
```json
{
  "toPunktId": "507f1f77bcf86cd799439021"
}
```

**Validation:**
- Buyurtma punktning tumaniga tegishli bo'lishi kerak
- ToPunkt faol bo'lishi kerak
- Punkt-to-punkt request qabul qilingan bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma punktga muvaffaqiyatli yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "currentPunkt": "507f1f77bcf86cd799439021",
    "status": "delivered_to_punkt"
  }
}
```

---

### 16. Receive From Punkt

**POST** `/api/punkt/orders/:id/receive-from-punkt`

Boshqa punktdan buyurtma qabul qilish.

**Authentication:** `punktAuth` required

**Path Parameters:**
- `id` (string, required) - Buyurtma ID

**Validation:**
- Buyurtmada punkt-to-punkt request bo'lishi kerak
- Request status `delivered` bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma punktdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2024-0001",
    "currentPunkt": "507f1f77bcf86cd799439021",
    "status": "delivered_to_punkt"
  }
}
```

---

## Order Status Flow

### Tuman Savdo Oqimi

1. **pending** - Marketplace'dan yangi buyurtma
   - Adminlar, agentlar (faqat ularga yuborilganlar), va punktlar (o'z tumanidagilar) ko'radi

2. **confirmed_by_punkt** - Punkt tomonidan tasdiqlangan
   - Punkt o'z tumanidagi buyurtmani tasdiqlaydi

3. **requested_to_contragent** - Kontragentga so'rov yuborilgan
   - O'z tumanidagi contragentga so'rov yuborilgan
   - YOKI boshqa tuman punktiga so'rov yuborilgan (punkt-to-punkt request)

4. **accepted_by_contragent** - Kontragent tomonidan qabul qilingan
   - Contragent so'rovga javob berdi

5. **delivered_to_punkt** - Punktga yetkazilgan
   - Contragent punktga topshirdi
   - YOKI boshqa tuman punkti asosiy tuman punktiga yubordi

6. **assigned_to_agent** - Agentga yuborilgan
   - Punkt o'z hududidagi MFY agentiga yubordi
   - Agent buyurtmaning `deliveryMfy` field'i bilan mos kelishi kerak

7. **confirmed_by_agent** - Agent tomonidan tasdiqlangan
   - Agent foydalanuvchiga topshirdi

8. **confirmed_by_customer** - Mijoz tomonidan tasdiqlangan (yakuniy)
   - Foydalanuvchi buyurtmani olganligini tasdiqladi

---

## Tuman Filter Logic

### Get My Orders Filter

Punkt quyidagi buyurtmalarni ko'radi:

1. **O'z tumanidagi buyurtmalar:**
   ```javascript
   {
     deliveryViloyat: punkt.viloyat._id,
     deliveryTuman: punkt.tuman._id
   }
   ```

2. **O'z punkti currentPunkt bo'lgan buyurtmalar:**
   ```javascript
   {
     currentPunkt: punkt._id
   }
   ```

3. **Punkt-to-punkt so'rovlarida ishtirok etgan buyurtmalar:**
   ```javascript
   {
     'punktToPunktRequests.fromPunktId': punkt._id
   }
   ```
   yoki
   ```javascript
   {
     'punktToPunktRequests.toPunktId': punkt._id
   }
   ```

4. **Eski so'rovlar (punktRequests):**
   ```javascript
   {
     'punktRequests.punktId': punkt._id
   }
   ```

**Muhim:** Punkt faqat o'z tumanidagi (`deliveryTuman = punkt.tuman`) buyurtmalarni ko'radi va ularni boshqarishi mumkin.

---

## Eslatmalar

1. **Tuman Filter:** Punkt faqat o'z tumanidagi buyurtmalarni ko'radi. Bu `getMyOrders`, `getTodayOrders`, va `getOrderHistory` endpoint'larida avtomatik qo'llaniladi.

2. **Confirm Order:** Punkt faqat o'z tumanidagi buyurtmalarni tasdiqlashi mumkin.

3. **Request To Contragent:** Punkt o'z tumanidagi buyurtmalar uchun contragentga so'rov yuborishi mumkin. Contragent o'z tumanida yoki boshqa tumanida bo'lishi mumkin (punkt-to-punkt so'rov orqali).

4. **Request To Punkt:** Punkt o'z tumanidagi buyurtmalar uchun boshqa tuman punktiga so'rov yuborishi mumkin. Faqat o'z viloyatidagi punktlarga so'rov yuboriladi.

5. **Assign To Agent:** Punkt faqat o'z tumanidagi agentlarga buyurtma yuborishi mumkin. Agent buyurtmaning `deliveryMfy` field'i bilan mos kelishi kerak (agar buyurtmada `deliveryMfy` bo'lsa). Agar buyurtmada `deliveryMfy` bo'lmasa, agent buyurtmaning `deliveryTuman` field'i bilan mos kelishi kerak.

6. **Punkt-to-Punkt Workflow:** 
   - Punkt A o'z tumanidagi buyurtma uchun Punkt B (boshqa tuman) ga so'rov yuboradi
   - Punkt B so'rovga javob beradi va o'z contragentiga so'rov yuboradi
   - Contragent mahsulotni olib kelib Punkt B ga topshiradi
   - Punkt B buyurtmani Punkt A ga yuboradi
   - Punkt A buyurtmani qabul qiladi va o'z agentiga yuboradi

7. **KPI Bonus:** Product'lardan `kpiBonusPercent` field'i response'da qaytarilmaydi (punkt uchun).

8. **Admin va Agentlar:** 
   - Adminlar barcha buyurtmalarni ko'radi
   - Agentlar faqat ularga yuborilgan buyurtmalarni ko'radi (assignedToAgent)
   - Punktlar o'z tumanidagi buyurtmalarni ko'radi

---

## Misollar

### cURL Examples

**Get My Orders:**
```bash
curl -X GET "http://localhost:5000/api/punkt/orders?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer <punkt-token>"
```

**Get Today's Orders:**
```bash
curl -X GET "http://localhost:5000/api/punkt/orders/today" \
  -H "Authorization: Bearer <punkt-token>"
```

**Confirm Order:**
```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/confirm \
  -H "Authorization: Bearer <punkt-token>"
```

**Request To Contragent:**
```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/request-to-contragent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <punkt-token>" \
  -d '{
    "contragentId": "507f1f77bcf86cd799439014"
  }'
```

**Receive From Contragent:**
```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/receive-from-contragent \
  -H "Authorization: Bearer <punkt-token>"
```

**Assign To Agent:**
```bash
curl -X POST http://localhost:5000/api/punkt/orders/507f1f77bcf86cd799439011/assign-to-agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <punkt-token>" \
  -d '{
    "agentId": "507f1f77bcf86cd799439019"
  }'
```

---

## Xatolar

### Umumiy xatolar

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Bu buyurtma sizning hududingizga tegishli emas"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Buyurtma topilmadi"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server xatosi",
  "error": "Error message"
}
```

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-01
