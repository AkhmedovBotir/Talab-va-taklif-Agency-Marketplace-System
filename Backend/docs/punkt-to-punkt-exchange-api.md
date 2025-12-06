# Punkt to Punkt Exchange API Documentation

Punktlar o'rtasidagi buyurtma almashinuv API'larini boshqarish.

## Base URL
```
/api/punkt
```

---

## Overview

Punktlar o'rtasida buyurtmalarni almashish uchun quyidagi jarayonlar mavjud:

1. **Avtomatik routing** - Punkt buyurtmani tasdiqlaganda yoki qabul qilganda, maxsulotlar mavjudligiga qarab avtomatik routing qilinadi
2. **So'rov yuborish** - Bir punkt boshqa punktga yoki bir nechta punktlarga so'rov yuboradi
3. **So'rovlarni ko'rish** - Kelgan so'rovlarni ko'rish
4. **Javob berish** - So'rovga qabul qilish yoki rad etish
5. **Qabul qilish** - Qabul qilingan buyurtmani qabul qilish

### Avtomatik Routing Logikasi

Sistema quyidagi logika bo'yicha ishlaydi:

1. **O'z tumanidagi contragentlar**: Agar buyurtmadagi maxsulotlar punktning o'z tumanidagi contragentlarda mavjud bo'lsa, punkt to'g'ridan-to'g'ri o'sha contragentlarga so'rov yuboradi.

2. **Boshqa tuman punktlari**: Agar buyurtmadagi maxsulotlar boshqa tumanlardagi contragentlarda mavjud bo'lsa, punkt o'sha tuman punktiga so'rov yuboradi. O'sha punkt qabul qilgach, o'z tumanidagi contragentlarga so'rov yuboradi.

3. **Aralash holat**: Agar bir qismi maxsulotlar o'z tumanida, bir qismi boshqa tumanlarda bo'lsa, ikkala qism ham ishlaydi.

---

## Authentication

Barcha endpointlar punkt autentifikatsiyasini talab qiladi.

**Headers:**
```
Authorization: Bearer <punkt_token>
```

---

## Data Models

### Punkt to Punkt Request Object

```json
{
  "fromPunktId": "string (MongoDB ObjectId, reference to Punkt)",
  "toPunktId": "string (MongoDB ObjectId, reference to Punkt)",
  "status": "string (enum: 'pending' | 'accepted' | 'rejected' | 'delivered')",
  "requestedAt": "string (ISO 8601 date)",
  "respondedAt": "string | null (ISO 8601 date)",
  "deliveredAt": "string | null (ISO 8601 date)"
}
```

**Status Values:**
- `pending` - Kutilmoqda
- `accepted` - Qabul qilindi
- `rejected` - Rad etildi
- `delivered` - Yetkazildi

---

## Endpoints

### 1. Auto-Route Order

Buyurtmani avtomatik routing qilish (maxsulotlar mavjudligiga qarab).

**Endpoint:** `POST /api/punkt/orders/:id/auto-route`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**URL Parameters:**
- `id` - Buyurtma ID

**Response (200):**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli routing qilindi",
  "data": {
    "orderId": "64order123...",
    "orderNumber": "ORD-2024-001",
    "analysis": {
      "ownTumanContragents": [
        {
          "contragent": {
            "_id": "64contragent123...",
            "name": "Dovuchcha Contragent",
            "inn": "123456789",
            "phone": "+998901234567",
            "viloyat": {
              "_id": "64region123...",
              "name": "Andijon viloyati",
              "type": "region"
            },
            "tuman": {
              "_id": "64region456...",
              "name": "Buloqboshi tumani",
              "type": "district"
            },
            "mfy": {
              "_id": "64region789...",
              "name": "Buyuk turon MFY",
              "type": "mfy"
            },
            "status": "active"
          },
          "products": [
            {
              "_id": "64product123...",
              "name": "Maxsulot nomi",
              "quantity": 2,
              "price": 15000
            }
          ]
        }
      ],
      "otherTumanPunkts": [
        {
          "tuman": {
            "_id": "64region789...",
            "name": "Ho'jaobod tumani",
            "type": "district"
          },
          "contragents": [
            {
              "contragent": {
                "_id": "64contragent456...",
                "name": "Contragent 2",
                "inn": "987654321",
                "phone": "+998901234568",
                "viloyat": {
                  "_id": "64region123...",
                  "name": "Andijon viloyati",
                  "type": "region"
                },
                "tuman": {
                  "_id": "64region789...",
                  "name": "Ho'jaobod tumani",
                  "type": "district"
                },
                "status": "active"
              },
              "products": [
                {
                  "_id": "64product456...",
                  "name": "Maxsulot 2",
                  "quantity": 1,
                  "price": 20000
                }
              ]
            }
          ]
        }
      ],
      "allProductsCovered": true
    },
    "routingResults": {
      "ownTumanRequests": [
        {
          "contragentId": "64contragent123...",
          "contragentName": "Dovuchcha Contragent",
          "status": "requested"
        }
      ],
      "otherTumanRequests": [
        {
          "tumanId": "64region789...",
          "tumanName": "Ho'jaobod tumani",
          "punktId": "64punkt456...",
          "punktName": "Ho'jaobod tumani punkti",
          "status": "requested"
        }
      ],
      "errors": []
    },
    "order": {
      "contragentRequests": [
        {
          "contragentId": {
            "_id": "64contragent123...",
            "name": "Dovuchcha Contragent"
          },
          "status": "pending",
          "requestedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "punktToPunktRequests": [
        {
          "fromPunktId": {
            "_id": "64punkt123...",
            "name": "Buloqboshi tumani punkti"
          },
          "toPunktId": {
            "_id": "64punkt456...",
            "name": "Ho'jaobod tumani punkti"
          },
          "status": "pending",
          "requestedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "status": "requested_to_contragent",
      "currentPunkt": "64punkt123..."
    }
  }
}
```

**Validation:**
- Buyurtma punktning hududiga tegishli bo'lishi kerak yoki joriy punkt bo'lishi kerak
- Buyurtma mavjud bo'lishi kerak

**Eslatma:** Bu endpoint avtomatik ravishda:
- O'z tumanidagi contragentlarga so'rov yuboradi
- Boshqa tuman punktlariga so'rov yuboradi
- Buyurtma holatini yangilaydi

---

### 2. Request to Single Punkt

Bitta punktga so'rov yuborish.

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkt`

**Headers:**
```
Authorization: Bearer <punkt_token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - Buyurtma ID

**Request Body:**
```json
{
  "toPunktId": "64punkt123..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "64order123...",
    "orderNumber": "ORD-2024-001",
    "toPunkt": {
      "_id": "64punkt456...",
      "name": "Punkt 2",
      "phone": "+998901234568"
    },
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "64punkt123...",
          "name": "Punkt 1",
          "phone": "+998901234567"
        },
        "toPunktId": {
          "_id": "64punkt456...",
          "name": "Punkt 2",
          "phone": "+998901234568"
        },
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Validation:**
- Buyurtma punktning hududiga tegishli bo'lishi kerak
- To'g'ri punkt ID bo'lishi kerak
- Punkt faol bo'lishi kerak
- Bir xil punktga ikki marta so'rov yuborilmaydi

---

### 3. Request to Multiple Punkts

Bir nechta punktlarga so'rov yuborish (tuman bo'yicha).

**Endpoint:** `POST /api/punkt/orders/:id/request-to-punkts`

**Headers:**
```
Authorization: Bearer <punkt_token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - Buyurtma ID

**Request Body:**
```json
{
  "tumanIds": ["64tuman123...", "64tuman456..."]
}
```

**Fields:**
- `tumanIds` (required, array) - Tuman ID'lari ro'yxati. Bu tumanlardagi barcha faol punktlarga so'rov yuboriladi.

**Response (200):**
```json
{
  "success": true,
  "message": "5 ta punktga so'rov yuborildi",
  "data": {
    "orderId": "64order123...",
    "orderNumber": "ORD-2024-001",
    "requestedPunkts": [
      {
        "_id": "64punkt456...",
        "name": "Punkt 2",
        "phone": "+998901234568"
      },
      {
        "_id": "64punkt789...",
        "name": "Punkt 3",
        "phone": "+998901234569"
      }
    ],
    "punktRequests": [
      {
        "punktId": {
          "_id": "64punkt456...",
          "name": "Punkt 2",
          "phone": "+998901234568"
        },
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Validation:**
- Barcha tumanlar punktning viloyatiga tegishli bo'lishi kerak
- Kamida bitta faol punkt topilishi kerak
- Joriy punkt so'rov ro'yxatiga kiritilmaydi

---

### 4. Get Punkt to Punkt Requests

O'z punktiga kelgan so'rovlarni olish.

**Endpoint:** `GET /api/punkt/punkt-to-punkt-requests`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `accepted`, `rejected`, `delivered`
- `page` (default: 1) - Sahifa raqami
- `limit` (default: 50) - Har sahifadagi elementlar soni

**Response (200):**
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
      "_id": "64order123...",
      "orderNumber": "ORD-2024-001",
      "user": {
        "_id": "64user123...",
        "name": "Botir",
        "phone": "+998901234567"
      },
      "items": [
        {
          "product": {
            "_id": "64product123...",
            "name": "Mahsulot nomi",
            "category": {
              "name": "Kategoriya"
            }
          },
          "quantity": 2,
          "price": 15000
        }
      ],
      "totalPrice": 30000,
      "deliveryViloyat": {
        "_id": "64region123...",
        "name": "Andijon viloyati",
        "type": "region"
      },
      "deliveryTuman": {
        "_id": "64region456...",
        "name": "Buloqboshi tumani",
        "type": "district"
      },
      "deliveryMfy": {
        "_id": "64region789...",
        "name": "Buyuk turon MFY",
        "type": "mfy"
      },
      "punktToPunktRequests": [
        {
          "fromPunktId": {
            "_id": "64punkt123...",
            "name": "Buloqboshi tumani punkti",
            "phone": "+998901234567",
            "viloyat": {
              "name": "Andijon viloyati"
            },
            "tuman": {
              "name": "Buloqboshi tumani"
            }
          },
          "toPunktId": {
            "_id": "64punkt456...",
            "name": "Ho'jaobod tumani punkti",
            "phone": "+998901234568"
          },
          "status": "pending",
          "requestedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Eslatma:** Faqat o'z punktiga kelgan so'rovlar ko'rsatiladi.

---

### 5. Respond to Punkt to Punkt Request

So'rovga javob berish (qabul qilish yoki rad etish).

**Endpoint:** `POST /api/punkt/punkt-to-punkt-requests/:orderId/respond`

**Headers:**
```
Authorization: Bearer <punkt_token>
Content-Type: application/json
```

**URL Parameters:**
- `orderId` - Buyurtma ID

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Fields:**
- `response` (required) - `"accepted"` yoki `"rejected"`

**Response (200) - Accepted:**
```json
{
  "success": true,
  "message": "So'rov qabul qilindi",
  "data": {
    "_id": "64order123...",
    "orderNumber": "ORD-2024-001",
    "status": "confirmed_by_punkt",
    "confirmedByPunkt": "64punkt456...",
    "punktStatus": "confirmed",
    "currentPunkt": "64punkt456...",
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "64punkt123...",
          "name": "Punkt 1"
        },
        "toPunktId": {
          "_id": "64punkt456...",
          "name": "Punkt 2"
        },
        "status": "accepted",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "respondedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

**Response (200) - Rejected:**
```json
{
  "success": true,
  "message": "So'rov rad etildi",
  "data": {
    "_id": "64order123...",
    "orderNumber": "ORD-2024-001",
    "punktToPunktRequests": [
      {
        "status": "rejected",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "respondedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

**Status Changes:**
- **Accepted:**
  - Request status: `pending` → `accepted`
  - Order status: `pending` → `confirmed_by_punkt` (agar `pending` yoki `requested_to_contragent` bo'lsa)
  - `confirmedByPunkt` = joriy punkt
  - `punktStatus` = `confirmed`
  - `currentPunkt` = joriy punkt
  - **Avtomatik routing:** Qabul qilingandan keyin, punkt o'z tumanidagi contragentlarga avtomatik so'rov yuboradi

- **Rejected:**
  - Request status: `pending` → `rejected`
  - Order status o'zgarmaydi

---

### 6. Receive from Punkt

Qabul qilingan buyurtmani punktdan qabul qilish.

**Endpoint:** `POST /api/punkt/orders/:id/receive-from-punkt`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**URL Parameters:**
- `id` - Buyurtma ID

**Response (200):**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "64order123...",
    "orderNumber": "ORD-2024-001",
    "status": "delivered_to_punkt",
    "currentPunkt": "64punkt456...",
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "64punkt123...",
          "name": "Punkt 1"
        },
        "toPunktId": {
          "_id": "64punkt456...",
          "name": "Punkt 2"
        },
        "status": "delivered",
        "requestedAt": "2024-01-15T10:30:00.000Z",
        "respondedAt": "2024-01-15T11:00:00.000Z",
        "deliveredAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

**Validation:**
- So'rov `accepted` holatida bo'lishi kerak
- Joriy punkt `toPunktId` bo'lishi kerak

**Status Changes:**
- Request status: `accepted` → `delivered`
- Order status: `delivered_to_punkt` (agar `assigned_to_agent`, `confirmed_by_agent`, yoki `confirmed_by_customer` bo'lmasa)
- `currentPunkt` = joriy punkt
- **Avtomatik routing:** Qabul qilingandan keyin, punkt o'z tumanidagi contragentlarga avtomatik so'rov yuboradi

---

### 7. Confirm Order

Buyurtmani tasdiqlash. Tasdiqlangandan keyin avtomatik routing qilinadi.

**Endpoint:** `POST /api/punkt/orders/:id/confirm`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**URL Parameters:**
- `id` - Buyurtma ID

**Response (200):**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "64order123...",
    "orderNumber": "ORD-2024-001",
    "status": "confirmed_by_punkt",
    "confirmedByPunkt": "64punkt123...",
    "punktStatus": "confirmed",
    "currentPunkt": "64punkt123..."
  }
}
```

**Eslatma:** Tasdiqlangandan keyin avtomatik ravishda:
- O'z tumanidagi contragentlarga so'rov yuboriladi
- Boshqa tuman punktlariga so'rov yuboriladi

---

## Workflow

### Scenario 1: O'z tumanidagi contragentlar

1. **Foydalanuvchi** (Botir) Andijon viloyati, Buloqboshi tumani, Buyuk turon MFY da buyurtma beradi
2. **Buloqboshi tumani punkti** buyurtmani ko'radi va tasdiqlaydi
3. **Avtomatik routing:** Sistema tekshiradi va maxsulotlar Buloqboshi tumanidagi Dovuchcha Contragent da mavjud ekanligini aniqlaydi
4. **Buloqboshi tumani punkti** → Dovuchcha Contragent ga so'rov yuboradi
5. **Dovuchcha Contragent** → So'rovni qabul qiladi va punktga yetkazadi
6. **Buloqboshi tumani punkti** → Buyuk turon MFY Agentiga topshiradi
7. **Buyuk turon MFY agenti** → Foydalanuvchiga yetkazadi
8. **Foydalanuvchi** → Olganligini tasdiqlaydi

### Scenario 2: Boshqa tuman punktlari

1. **Foydalanuvchi** (Botir) Andijon viloyati, Buloqboshi tumani, Buyuk turon MFY da buyurtma beradi
2. **Buloqboshi tumani punkti** buyurtmani ko'radi va tasdiqlaydi
3. **Avtomatik routing:** Sistema tekshiradi va maxsulotlar Ho'jaobod tumanidagi contragentlarda mavjud ekanligini aniqlaydi
4. **Buloqboshi tumani punkti** → Ho'jaobod tumani punktiga so'rov yuboradi
5. **Ho'jaobod tumani punkti** → So'rovni qabul qiladi
6. **Avtomatik routing:** Ho'jaobod tumani punkti o'z tumanidagi contragentlarga so'rov yuboradi
7. **Contragent** → So'rovni qabul qiladi va Ho'jaobod tumani punktiga yetkazadi
8. **Ho'jaobod tumani punkti** → Buloqboshi tumani punktiga yuborilayotganini bildiradi
9. **Buloqboshi tumani punkti** → Buyurtmani qabul qiladi
10. **Buloqboshi tumani punkti** → Buyuk turon MFY Agentiga topshiradi
11. **Buyuk turon MFY agenti** → Foydalanuvchiga yetkazadi
12. **Foydalanuvchi** → Olganligini tasdiqlaydi

### Scenario 3: Aralash holat

1. **Foydalanuvchi** (Botir) Andijon viloyati, Buloqboshi tumani, Buyuk turon MFY da buyurtma beradi
2. **Buloqboshi tumani punkti** buyurtmani ko'radi va tasdiqlaydi
3. **Avtomatik routing:** Sistema tekshiradi va:
   - Bir qismi maxsulotlar Buloqboshi tumanidagi contragentlarda mavjud
   - Bir qismi Ho'jaobod tumanidagi contragentlarda mavjud
4. **Buloqboshi tumani punkti** → O'z tumanidagi contragentlarga so'rov yuboradi
5. **Buloqboshi tumani punkti** → Ho'jaobod tumani punktiga so'rov yuboradi
6. **Ikki parallel jarayon:**
   - O'z tumanidagi contragent → Punktga yetkazadi
   - Ho'jaobod tumani punkti → O'z tumanidagi contragentga so'rov yuboradi → Contragent punktga yetkazadi → Buloqboshi punktiga yuboradi
7. **Buloqboshi tumani punkti** → Barcha maxsulotlarni jamlab olgach, Buyuk turon MFY Agentiga topshiradi
8. **Buyuk turon MFY agenti** → Foydalanuvchiga yetkazadi
9. **Foydalanuvchi** → Olganligini tasdiqlaydi

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Punkt ID kiritilishi shart"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bu punktga allaqachon so'rov yuborilgan"
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
  "message": "Sizga so'rov yuborilmagan"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Sizga bu buyurtma yuborilmagan yoki qabul qilinmagan"
}
```

---

## Notes

1. **Hudud tekshiruvi:** Buyurtma faqat punktning hududiga tegishli bo'lsa, punkt uni ko'ra oladi va boshqara oladi

2. **So'rov holatlari:**
   - `pending` - Kutilmoqda
   - `accepted` - Qabul qilindi (keyin `receive-from-punkt` chaqirilishi kerak)
   - `rejected` - Rad etildi
   - `delivered` - Yetkazildi

3. **Buyurtma holati:**
   - So'rov qabul qilinganda: `pending` → `confirmed_by_punkt`
   - Qabul qilinganda: `delivered_to_punkt`

4. **Multiple Requests:** Bir buyurtma bir nechta punktlarga yuborilishi mumkin, lekin faqat bitta punkt qabul qiladi

5. **Current Punkt:** `currentPunkt` field buyurtma hozir qaysi punktda ekanligini ko'rsatadi

6. **Avtomatik routing:** Quyidagi holatlarda avtomatik routing ishlaydi:
   - Buyurtma tasdiqlanganda (`confirmOrder`)
   - Punktdan punktga so'rov qabul qilinganda (`respondToPunktToPunktRequest` - accepted)
   - Punktdan buyurtma qabul qilinganda (`receiveFromPunkt`)

---

## Examples

### Example 1: Auto-Route Order

```bash
curl -X POST http://localhost:5000/api/punkt/orders/64order123/auto-route \
  -H "Authorization: Bearer <token>"
```

### Example 2: Request to Single Punkt

```bash
curl -X POST http://localhost:5000/api/punkt/orders/64order123/request-to-punkt \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toPunktId": "64punkt456"
  }'
```

### Example 3: Request to Multiple Punkts

```bash
curl -X POST http://localhost:5000/api/punkt/orders/64order123/request-to-punkts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tumanIds": ["64tuman123", "64tuman456"]
  }'
```

### Example 4: Get Incoming Requests

```bash
curl -X GET "http://localhost:5000/api/punkt/punkt-to-punkt-requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Example 5: Accept Request

```bash
curl -X POST http://localhost:5000/api/punkt/punkt-to-punkt-requests/64order123/respond \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "accepted"
  }'
```

### Example 6: Receive Order

```bash
curl -X POST http://localhost:5000/api/punkt/orders/64order123/receive-from-punkt \
  -H "Authorization: Bearer <token>"
```

### Example 7: Confirm Order

```bash
curl -X POST http://localhost:5000/api/punkt/orders/64order123/confirm \
  -H "Authorization: Bearer <token>"
```

---

## Comparison: requestToPunkts vs requestToPunkt

| Feature | requestToPunkts | requestToPunkt |
|---------|-----------------|----------------|
| **Target** | Bir nechta punktlar (tuman bo'yicha) | Bitta punkt |
| **Input** | Tuman ID'lari array | Punkt ID |
| **Use Case** | Bir nechta tumanlardagi barcha punktlarga yuborish | Aniq bir punktga yuborish |
| **Request Type** | `punktRequests` (eski format) | `punktToPunktRequests` (yangi format) |

**Eslatma:** `requestToPunkts` eski format (`punktRequests`) ishlatadi, `requestToPunkt` esa yangi format (`punktToPunktRequests`) ishlatadi.

---

## Avtomatik Routing Tafsilotlari

### Qachon ishlaydi?

1. **Buyurtma tasdiqlanganda** (`POST /api/punkt/orders/:id/confirm`)
   - Punkt buyurtmani tasdiqlaganda, sistema avtomatik ravishda maxsulotlar mavjudligini tekshiradi va routing qiladi

2. **Punktdan punktga so'rov qabul qilinganda** (`POST /api/punkt/punkt-to-punkt-requests/:orderId/respond` - `accepted`)
   - Boshqa punktdan kelgan so'rov qabul qilinganda, sistema avtomatik ravishda o'z tumanidagi contragentlarga so'rov yuboradi

3. **Punktdan buyurtma qabul qilinganda** (`POST /api/punkt/orders/:id/receive-from-punkt`)
   - Boshqa punktdan buyurtma qabul qilinganda, sistema avtomatik ravishda o'z tumanidagi contragentlarga so'rov yuboradi

4. **Qo'lda chaqirilganda** (`POST /api/punkt/orders/:id/auto-route`)
   - Punkt istalgan vaqtda qo'lda avtomatik routingni chaqirishi mumkin

### Qanday ishlaydi?

1. **Maxsulotlarni tahlil qilish:**
   - Har bir maxsulotning contragenti aniqlanadi
   - Contragentning tumani aniqlanadi
   - Maxsulotlar o'z tumani va boshqa tumanlar bo'yicha guruhlanadi

2. **O'z tumanidagi contragentlar:**
   - Agar maxsulotlar punktning o'z tumanidagi contragentlarda mavjud bo'lsa, to'g'ridan-to'g'ri so'rov yuboriladi

3. **Boshqa tuman punktlari:**
   - Agar maxsulotlar boshqa tumanlardagi contragentlarda mavjud bo'lsa, o'sha tuman punktiga so'rov yuboriladi
   - O'sha punkt qabul qilgach, o'z tumanidagi contragentlarga so'rov yuboradi

4. **Aralash holat:**
   - Agar bir qismi o'z tumanida, bir qismi boshqa tumanlarda bo'lsa, ikkala qism ham parallel ishlaydi

---
