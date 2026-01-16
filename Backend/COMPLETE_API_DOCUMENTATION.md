# TTSA Backend - To'liq API Dokumentatsiyasi

## Umumiy Ma'lumot

### Base URL
```
http://localhost:5000/api
```

### Response Format
Barcha API javoblari quyidagi formatda qaytariladi:

**Muvaffaqiyatli javob:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Ma'lumotlar muvaffaqiyatli olingan"
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

---

## 1. BUYURTMACHI (MARKETPLACE USER) API

### Autentifikatsiya

#### 1.1. Ro'yxatdan o'tish - Step 1
**POST** `/api/marketplace/auth/register/step1`

Telefon raqamini yuborish va SMS kod olish.

**Request Body:**
```json
{
  "phone": "+998901234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS kodi yuborildi",
  "smsCodeId": "507f1f77bcf86cd799439011"
}
```

---

#### 1.2. Ro'yxatdan o'tish - Step 2
**POST** `/api/marketplace/auth/register/step2`

SMS kodini tasdiqlash va foydalanuvchi yaratish.

**Request Body:**
```json
{
  "smsCodeId": "507f1f77bcf86cd799439011",
  "code": "123456",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ro'yxatdan muvaffaqiyatli o'tildi",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+998901234567"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 1.3. Kirish - Step 1
**POST** `/api/marketplace/auth/login/step1`

Telefon raqamini yuborish va SMS kod olish.

**Request Body:**
```json
{
  "phone": "+998901234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS kodi yuborildi",
  "smsCodeId": "507f1f77bcf86cd799439011"
}
```

---

#### 1.4. Kirish - Step 2
**POST** `/api/marketplace/auth/login/step2`

SMS kodini tasdiqlash va token olish.

**Request Body:**
```json
{
  "smsCodeId": "507f1f77bcf86cd799439011",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+998901234567"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Profil

#### 1.5. O'z profilini olish
**GET** `/api/marketplace/profile/me`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati",
      "type": "region"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani",
      "type": "district"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY",
      "type": "mfy"
    }
  }
}
```

---

#### 1.6. Profilni yangilash
**PUT** `/api/marketplace/profile/me`

**Authentication:** `marketplaceUserAuth` required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profil muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+998901234567"
  }
}
```

---

### Maxsulotlar

#### 1.7. Barcha maxsulotlarni olish
**GET** `/api/marketplace/products`

**Query Parameters:**
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi maxsulotlar soni (default: 20)
- `category` (string, optional) - Kategoriya slug'i
- `subcategory` (string, optional) - Subkategoriya slug'i
- `minPrice` (number, optional) - Minimal narx
- `maxPrice` (number, optional) - Maksimal narx
- `search` (string, optional) - Qidiruv so'rovi

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Uzum sirkasi",
      "price": 65000,
      "originalPrice": 50000,
      "images": ["https://example.com/image1.jpg"],
      "category": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Oziq-ovqat",
        "slug": "oziq-ovqat"
      },
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Contragent Name"
      }
    }
  ]
}
```

---

#### 1.8. Maxsulotni ID bo'yicha olish
**GET** `/api/marketplace/products/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Uzum sirkasi",
    "description": "Tabiiy uzum sirkasi",
    "price": 65000,
    "originalPrice": 50000,
    "images": ["https://example.com/image1.jpg"],
    "quantity": 100,
    "unit": "litr",
    "category": {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Oziq-ovqat",
      "slug": "oziq-ovqat"
    },
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Contragent Name",
      "phone": "+998901234567"
    }
  }
}
```

---

### Kategoriyalar

#### 1.9. Barcha kategoriyalarni olish
**GET** `/api/marketplace/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "name": "Oziq-ovqat",
      "slug": "oziq-ovqat",
      "subcategories": [
        {
          "_id": "507f1f77bcf86cd799439019",
          "name": "Sirkalar",
          "slug": "sirkalar"
        }
      ]
    }
  ]
}
```

---

### Savat (Cart)

#### 1.10. Savatni olish
**GET** `/api/marketplace/cart`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "productType": "tuman"
      }
    ],
    "totalPrice": 130000,
    "itemCount": 2
  }
}
```

---

#### 1.11. Savatga maxsulot qo'shish
**POST** `/api/marketplace/cart/add`

**Authentication:** `marketplaceUserAuth` required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "quantity": 2,
  "productType": "tuman"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot savatga qo'shildi",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2
      }
    ],
    "totalPrice": 130000
  }
}
```

---

#### 1.12. Savatdan maxsulotni olib tashlash
**DELETE** `/api/marketplace/cart/remove/:productId`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot savatdan olib tashlandi"
}
```

---

#### 1.13. Savatni tozalash
**DELETE** `/api/marketplace/cart/clear`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Savat tozalandi"
}
```

---

### Buyurtmalar

#### 1.14. Buyurtma yaratish
**POST** `/api/marketplace/orders`

**Authentication:** `marketplaceUserAuth` required

**Request Body:**
```json
{
  "paymentMethod": "cash",
  "deliveryViloyat": "507f1f77bcf86cd799439015",
  "deliveryTuman": "507f1f77bcf86cd799439016",
  "deliveryMfy": "507f1f77bcf86cd799439017",
  "deliveryNote": "Eshik oldida qoldiring",
  "phoneNumber": "+998901234567",
  "clearCart": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2024-0001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "price": 65000
      }
    ],
    "totalPrice": 130000,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 1.15. Barcha buyurtmalarni olish
**GET** `/api/marketplace/orders`

**Authentication:** `marketplaceUserAuth` required

**Query Parameters:**
- `status` (string, optional) - Buyurtma holati
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi buyurtmalar soni (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "totalPrice": 130000,
      "status": "pending",
      "paymentStatus": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 1.16. Buyurtmani ID bo'yicha olish
**GET** `/api/marketplace/orders/:id`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2024-0001",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "price": 65000
      }
    ],
    "totalPrice": 130000,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 1.17. Buyurtmani bekor qilish
**POST** `/api/marketplace/orders/:id/cancel`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "cancelled"
  }
}
```

---

#### 1.18. Yetkazib berilgan deb tasdiqlash
**POST** `/api/marketplace/orders/:id/confirm-delivery`

**Authentication:** `marketplaceUserAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yetkazib berilgan deb tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "confirmed_by_customer"
  }
}
```

---

### Qidiruv

#### 1.19. Qidiruv
**GET** `/api/marketplace/search?q=uzum`

**Query Parameters:**
- `q` (string, required) - Qidiruv so'rovi

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Uzum sirkasi",
        "price": 65000
      }
    ],
    "categories": [],
    "contragents": []
  }
}
```

---

## 2. AGENT API

### Autentifikatsiya

#### 2.1. Agent kirish
**POST** `/api/agents/login`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Agent Name",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY"
    }
  }
}
```

---

#### 2.2. O'z profilini olish
**GET** `/api/agents/profile/me`

**Authentication:** `agentAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Agent Name",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati",
      "type": "region"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani",
      "type": "district"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY",
      "type": "mfy"
    }
  }
}
```

---

### Buyurtmalar

#### 2.3. Barcha buyurtmalarni olish
**GET** `/api/agent/orders`

**Authentication:** `agentAuth` required

**Query Parameters:**
- `status` (string, optional) - Buyurtma holati
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi buyurtmalar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
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
            "name": "Uzum sirkasi",
            "price": 65000
          },
          "quantity": 2,
          "price": 65000
        }
      ],
      "totalPrice": 130000,
      "status": "assigned_to_agent",
      "deliveryMfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Yangiobod MFY"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 2.4. Bugungi buyurtmalarni olish
**GET** `/api/agent/orders/today`

**Authentication:** `agentAuth` required

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
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "status": "assigned_to_agent",
      "user": {
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "totalPrice": 130000
    }
  ]
}
```

---

#### 2.5. Buyurtma tarixini olish
**GET** `/api/agent/orders/history`

**Authentication:** `agentAuth` required

**Query Parameters:**
- `status` (string, optional) - Buyurtma holati
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi buyurtmalar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "status": "confirmed_by_customer",
      "user": {
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "totalPrice": 130000,
      "createdAt": "2023-12-31T00:00:00.000Z"
    }
  ]
}
```

---

#### 2.6. Buyurtmani ID bo'yicha olish
**GET** `/api/agent/orders/:id`

**Authentication:** `agentAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
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
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "price": 65000
      }
    ],
    "totalPrice": 130000,
    "status": "assigned_to_agent",
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY"
    },
    "assignedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

#### 2.7. Buyurtmani mijozga yetkazilgan deb belgilash
**POST** `/api/agent/orders/:id/mark-delivered`

**Authentication:** `agentAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma yetkazilgan deb belgilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "confirmed_by_agent",
    "deliveredAt": "2024-01-01T15:00:00.000Z"
  }
}
```

---

#### 2.8. Buyurtmani mijoz tomonidan tasdiqlangan deb belgilash
**POST** `/api/agent/orders/:id/confirm`

**Authentication:** `agentAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma mijoz tomonidan tasdiqlangan deb belgilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "confirmed_by_customer"
  }
}
```

---

### Statistika

#### 2.9. KPI statistika
**GET** `/api/agent-finance/statistics`

**Authentication:** `agentAuth` required

**Query Parameters:**
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "statistics": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalOrders": 50,
    "totalAmount": 6500000
  }
}
```

---

#### 2.10. Kunlik hisobot
**GET** `/api/agent-finance/daily-report`

**Authentication:** `agentAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439023",
    "date": "2024-01-01T00:00:00.000Z",
    "ordersCount": 5,
    "totalAmount": 650000,
    "collectedAmount": 0,
    "submittedAmount": 0,
    "pendingAmount": 0
  }
}
```

---

### ⚠️ Olib Tashlangan Funksiyalar (Agent)

Quyidagi pul yig'ish funksiyalari **OLIB TASHLANDI** va endi ishlamaydi:

#### ~~2.11. Kutilayotgan to'lovlarni ko'rish~~ ❌ OLIB TASHLANDI
**GET** `/api/agent-finance/pending-payments`

**Status:** `410 Gone` - Bu funksiya olib tashlangan. Pul yig'ish endi amalga oshirilmaydi.

**Sabab:** Agentlar endi mijozlardan pul yig'maydi. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi.

---

#### ~~2.12. To'lovni qabul qilish~~ ❌ OLIB TASHLANDI
**POST** `/api/agent-finance/collect-payment/:transactionId`

**Status:** `410 Gone` - Bu funksiya olib tashlangan. Pul yig'ish endi amalga oshirilmaydi.

**Sabab:** Agentlar endi mijozlardan pul yig'maydi. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi.

**Eski ishlash usuli:**
- Mijoz buyurtma yaratgandan keyin agentga pul to'lash uchun transaksiya yaratardi
- Agent to'lovni qabul qilardi (`collectPayment`)
- Status: `pending` → `collected`

**Yangi ishlash usuli:**
- To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi
- Agentlar endi pul yig'maydi

---

#### ~~2.13. Moliya bo'limiga topshirish~~ ❌ OLIB TASHLANDI
**POST** `/api/agent-finance/submit-to-finance`

**Status:** `410 Gone` - Bu funksiya olib tashlangan. Pul yig'ish endi amalga oshirilmaydi.

**Sabab:** Agentlar endi adminga pul topshirmaydi. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi.

**Eski ishlash usuli:**
- Agent to'lovlarni qabul qilgandan keyin moliya bo'limiga topshirardi
- Status: `collected` → `submitted`

**Yangi ishlash usuli:**
- To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi
- Agentlar endi pul topshirmaydi

---

## 3. ADMIN API

### Autentifikatsiya

#### 3.1. Admin kirish
**POST** `/api/admins/login`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "507f1f77bcf86cd799439024",
    "name": "Admin Name",
    "phone": "+998901234567",
    "role": "admin"
  }
}
```

---

### Buyurtmalar

#### 3.2. Barcha buyurtmalarni olish
**GET** `/api/admins/data/orders`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `status` (string, optional) - Buyurtma holati
- `paymentStatus` (string, optional) - To'lov holati
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi buyurtmalar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 100,
  "total": 500,
  "page": 1,
  "limit": 50,
  "totalPages": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
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
            "name": "Uzum sirkasi",
            "price": 65000
          },
          "quantity": 2,
          "price": 65000
        }
      ],
      "totalPrice": 130000,
      "status": "confirmed_by_customer",
      "paymentStatus": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 3.3. Buyurtmani ID bo'yicha olish
**GET** `/api/admins/data/orders/:id`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
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
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "price": 65000
      }
    ],
    "totalPrice": 130000,
    "status": "confirmed_by_customer",
    "paymentStatus": "pending",
    "deliveryViloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati"
    },
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    },
    "deliveryMfy": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Yangiobod MFY"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Statistika

#### 3.4. Dashboard statistika
**GET** `/api/admins/dashboard/overview`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "totalRevenue": 65000000,
    "totalUsers": 500,
    "totalAgents": 100,
    "totalPunkts": 50,
    "totalContragents": 200
  }
}
```

---

#### 3.5. Savdo statistika
**GET** `/api/admins/data/statistics/sales/summary`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "totalRevenue": 65000000,
    "totalItems": 5000,
    "byViloyat": [
      {
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati"
        },
        "ordersCount": 500,
        "revenue": 32500000
      }
    ]
  }
}
```

---

### Agentlar

#### 3.6. Barcha agentlarni olish
**GET** `/api/admins/data/agents`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `status` (string, optional) - Agent holati
- `viloyat` (string, optional) - Viloyat ID
- `tuman` (string, optional) - Tuman ID
- `mfy` (string, optional) - MFY ID
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi agentlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "name": "Agent Name",
      "phone": "+998901234567",
      "status": "active",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Yangiobod MFY"
      }
    }
  ]
}
```

---

#### 3.7. Agent yaratish
**POST** `/api/agents`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "name": "Agent Name",
  "phone": "+998901234567",
  "password": "password123",
  "viloyat": "507f1f77bcf86cd799439015",
  "tuman": "507f1f77bcf86cd799439016",
  "mfy": "507f1f77bcf86cd799439017",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Agent Name",
    "phone": "+998901234567",
    "status": "active"
  }
}
```

---

#### 3.8. Agentni yangilash
**PUT** `/api/agents/:id`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "name": "Updated Agent Name",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Updated Agent Name",
    "phone": "+998901234567",
    "status": "active"
  }
}
```

---

#### 3.9. Agentni o'chirish
**DELETE** `/api/agents/:id`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Agent muvaffaqiyatli o'chirildi"
}
```

---

### Punktlar

#### 3.10. Barcha punktlarni olish
**GET** `/api/admins/data/punkts`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `status` (string, optional) - Punkt holati
- `viloyat` (string, optional) - Viloyat ID
- `tuman` (string, optional) - Tuman ID
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi punktlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "name": "Punkt Name",
      "phone": "+998901234567",
      "status": "active",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Buloqboshi tumani"
      }
    }
  ]
}
```

---

### Maxsulotlar

#### 3.11. Barcha maxsulotlarni olish (Admin)
**GET** `/api/admins/data/products`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `status` (string, optional) - Maxsulot holati
- `moderationStatus` (string, optional) - Moderatsiya holati
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi maxsulotlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 100,
  "total": 500,
  "page": 1,
  "limit": 50,
  "totalPages": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Uzum sirkasi",
      "price": 65000,
      "originalPrice": 50000,
      "status": "active",
      "moderationStatus": "approved",
      "contragent": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Contragent Name"
      }
    }
  ]
}
```

---

#### 3.12. Maxsulotni tasdiqlash
**POST** `/api/admins/product-moderation/:id/approve`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "moderationStatus": "approved"
  }
}
```

---

#### 3.13. Maxsulotni rad etish
**POST** `/api/admins/product-moderation/:id/reject`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "rejectionReason": "Maxsulot talablarga javob bermaydi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxsulot rad etildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "moderationStatus": "rejected"
  }
}
```

---

### ⚠️ Olib Tashlangan Funksiyalar (Admin)

Quyidagi pul yig'ish bilan bog'liq funksiyalar **OLIB TASHLANDI**:

#### ~~3.14. Agent to'lovlarini qabul qilish~~ ❌ OLIB TASHLANDI
**POST** `/api/admin-finance/submissions/:submissionId/confirm`

**Status:** `410 Gone` - Bu funksiya olib tashlangan. Pul yig'ish endi amalga oshirilmaydi.

**Sabab:** Agentlar endi adminga pul topshirmaydi. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi.

**Eski ishlash usuli:**
- Agent to'lovlarni moliya bo'limiga topshirardi
- Admin to'lovlarni tasdiqlardi
- Status: `submitted` → `confirmed`

**Yangi ishlash usuli:**
- To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi
- Adminlar endi agentlardan pul qabul qilmaydi

---

#### ~~3.15. Agent to'lovlarini ko'rish~~ ❌ OLIB TASHLANDI
**GET** `/api/admin-finance/submissions`

**Status:** `410 Gone` - Bu funksiya olib tashlangan. Pul yig'ish endi amalga oshirilmaydi.

**Sabab:** Agentlar endi adminga pul topshirmaydi. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi.

---

**Eslatma:** Barcha pul yig'ish funksiyalari olib tashlangan. To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi. Agentlar va adminlar endi pul yig'maydi va qabul qilmaydi.

---

## 4. PUNKT API

### Autentifikatsiya

#### 4.1. Punkt kirish
**POST** `/api/punkts/login`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "punkt": {
    "_id": "507f1f77bcf86cd799439025",
    "name": "Punkt Name",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Toshkent viloyati"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    }
  }
}
```

---

### Buyurtmalar

#### 4.2. Barcha buyurtmalarni olish
**GET** `/api/punkt/orders`

**Authentication:** `punktAuth` required

**Query Parameters:**
- `status` (string, optional) - Buyurtma holati
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi buyurtmalar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439021",
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
            "name": "Uzum sirkasi",
            "price": 65000,
            "contragent": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Contragent Name",
              "viloyat": {
                "_id": "507f1f77bcf86cd799439015",
                "name": "Toshkent viloyati"
              },
              "tuman": {
                "_id": "507f1f77bcf86cd799439016",
                "name": "Buloqboshi tumani"
              }
            }
          },
          "quantity": 2,
          "price": 65000
        }
      ],
      "totalPrice": 130000,
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

#### 4.3. Bugungi buyurtmalarni olish
**GET** `/api/punkt/orders/today`

**Authentication:** `punktAuth` required

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
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "status": "pending",
      "user": {
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "totalPrice": 130000
    }
  ]
}
```

---

#### 4.4. Buyurtma tarixini olish
**GET** `/api/punkt/orders/history`

**Authentication:** `punktAuth` required

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
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "status": "confirmed_by_customer",
      "user": {
        "name": "John Doe",
        "phone": "+998901234567"
      },
      "totalPrice": 130000,
      "createdAt": "2023-12-31T00:00:00.000Z"
    }
  ]
}
```

---

#### 4.5. Buyurtmani ID bo'yicha olish
**GET** `/api/punkt/orders/:id`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
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
          "name": "Uzum sirkasi",
          "price": 65000
        },
        "quantity": 2,
        "price": 65000
      }
    ],
    "totalPrice": 130000,
    "status": "pending",
    "deliveryTuman": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Buloqboshi tumani"
    }
  }
}
```

---

#### 4.6. Buyurtmadagi contragent ID'larini olish
**GET** `/api/punkt/orders/:id/contragents`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2024-0001",
    "contragents": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Contragent Name",
        "inn": "123456789",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati"
        },
        "tuman": {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Buloqboshi tumani"
        },
        "status": "active",
        "isInRegion": true,
        "products": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Uzum sirkasi",
            "quantity": 2,
            "price": 65000
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

#### 4.7. Buyurtmani tasdiqlash
**POST** `/api/punkt/orders/:id/confirm`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "confirmed_by_punkt",
    "punktStatus": "confirmed",
    "confirmedByPunkt": {
      "_id": "507f1f77bcf86cd799439025",
      "name": "Punkt Name"
    }
  }
}
```

---

#### 4.8. Kontragentga so'rov yuborish
**POST** `/api/punkt/orders/:id/request-to-contragent`

**Authentication:** `punktAuth` required

**Request Body:**
```json
{
  "contragentId": "507f1f77bcf86cd799439014"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contragentga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2024-0001",
    "contragent": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Contragent Name"
    },
    "contragentRequests": [
      {
        "contragentId": "507f1f77bcf86cd799439014",
        "status": "pending",
        "requestedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

---

#### 4.9. Kontragentdan qabul qilish
**POST** `/api/punkt/orders/:id/receive-from-contragent`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma contragentdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "delivered_to_punkt"
  }
}
```

---

#### 4.10. Boshqa punktga so'rov yuborish
**POST** `/api/punkt/orders/:id/request-to-punkt`

**Authentication:** `punktAuth` required

**Request Body:**
```json
{
  "toPunktId": "507f1f77bcf86cd799439026"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Punktga so'rov yuborildi",
  "data": {
    "orderId": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2024-0001",
    "punktToPunktRequests": [
      {
        "fromPunktId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "From Punkt"
        },
        "toPunktId": {
          "_id": "507f1f77bcf86cd799439026",
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

#### 4.11. Punktdan qabul qilish
**POST** `/api/punkt/orders/:id/receive-from-punkt`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma punktdan muvaffaqiyatli qabul qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "delivered_to_punkt",
    "currentPunkt": "507f1f77bcf86cd799439025"
  }
}
```

---

#### 4.12. Agentga yuborish
**POST** `/api/punkt/orders/:id/assign-to-agent`

**Authentication:** `punktAuth` required

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439022"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma agentga muvaffaqiyatli yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "assigned_to_agent",
    "assignedToAgent": {
      "_id": "507f1f77bcf86cd799439022",
      "name": "Agent Name",
      "phone": "+998901234567"
    },
    "assignedAt": "2024-01-01T15:00:00.000Z"
  }
}
```

---

### KPI

#### 4.13. KPI statistika
**GET** `/api/punkt/kpi/summary`

**Authentication:** `punktAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalKpiAmount": 195000,
    "paidAmount": 100000,
    "unpaidAmount": 95000
  }
}
```

---

## Buyurtma Oqimi

### Tuman Savdo Oqimi

1. **Buyurtmachi** buyurtma yaratadi (`POST /api/marketplace/orders`)
   - Status: `pending`
   - PaymentStatus: `pending`

2. **Punkt** o'z tumanidagi buyurtmalarni ko'radi (`GET /api/punkt/orders`)
   - Punkt faqat o'z tumanidagi buyurtmalarni ko'radi

3. **Punkt** buyurtmani tasdiqlaydi (`POST /api/punkt/orders/:id/confirm`)
   - Status: `confirmed_by_punkt`

4. **Punkt** kontragentga so'rov yuboradi (`POST /api/punkt/orders/:id/request-to-contragent`)
   - Status: `requested_to_contragent`
   - YOKI boshqa tuman punktiga so'rov yuboradi (`POST /api/punkt/orders/:id/request-to-punkt`)

5. **Contragent** so'rovga javob beradi va mahsulotni olib keladi
   - Contragent `delivered_to_punkt` status'ini belgilaydi

6. **Punkt** kontragentdan qabul qiladi (`POST /api/punkt/orders/:id/receive-from-contragent`)
   - Status: `delivered_to_punkt`

7. **Punkt** agentga yuboradi (`POST /api/punkt/orders/:id/assign-to-agent`)
   - Status: `assigned_to_agent`
   - Agent faqat buyurtmaning `deliveryMfy` field'i bilan mos keladigan agentlarga yuboriladi

8. **Agent** buyurtmani foydalanuvchiga topshiradi (`POST /api/agent/orders/:id/mark-delivered`)
   - Status: `confirmed_by_agent`

9. **Agent** buyurtmani mijoz tomonidan tasdiqlangan deb belgilaydi (`POST /api/agent/orders/:id/confirm`)
   - Status: `confirmed_by_customer`

10. **Buyurtmachi** buyurtmani olganligini tasdiqlaydi (`POST /api/marketplace/orders/:id/confirm-delivery`)
    - Status: `confirmed_by_customer` (yakuniy)

---

## Eslatmalar

### Pul Yig'ish Olib Tashlandi

**REMOVED:** Pul yig'ish funksiyalari olib tashlangan:
- Buyurtmachi agentga pul to'lash - **OLIB TASHLANDI**
- Agent to'lovni qabul qilish - **OLIB TASHLANDI**
- Agent adminga pul topshirish - **OLIB TASHLANDI**

To'lov buyurtma yaratilganda to'g'ridan-to'g'ri amalga oshiriladi. Agentlar va adminlar endi pul yig'maydi.

### Buyurtma Status Oqimi

1. `pending` - Yangi buyurtma
2. `confirmed_by_punkt` - Punkt tomonidan tasdiqlangan
3. `requested_to_contragent` - Kontragentga so'rov yuborilgan
4. `delivered_to_punkt` - Punktga yetkazilgan
5. `assigned_to_agent` - Agentga yuborilgan
6. `confirmed_by_agent` - Agent tomonidan tasdiqlangan
7. `confirmed_by_customer` - Mijoz tomonidan tasdiqlangan (yakuniy)

---

## Versiya

**Version:** 2.0.0  
**Last Updated:** 2024-01-16  
**Payment Collection:** REMOVED
