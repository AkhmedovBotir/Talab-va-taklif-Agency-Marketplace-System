# Admin KPI API Dokumentatsiyasi

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

### Authentication
Barcha endpoint'lar `adminAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

---

## KPI Taqsimotini Boshqarish

### KPI Taqsimoti Tushunchasi

KPI (Key Performance Indicator) bonuslari quyidagicha ishlaydi:

1. **KPI Hisoblash:**
   - Har bir maxsulot uchun: `Foyda = Price - OriginalPrice`
   - Masalan: OriginalPrice = 5000 so'm, Price = 6000 so'm
   - Foyda = 6000 - 5000 = 1000 so'm
   - Tuman kontragent KPI foizi: 50%
   - KPI miqdori = 1000 * 50 / 100 = 500 so'm

2. **KPI Taqsimoti:**
   - Bu 500 so'm 100% sifatida olinadi
   - Admin belgilagan foizlar asosida quyidagicha taqsimlanadi:
     - **Punkt** - admin belgilagan foiz
     - **Agent** - admin belgilagan foiz
     - **Menejer (ViloyatManager)** - admin belgilagan foiz
     - **Moliya** - admin belgilagan foiz
     - **Dostavka (DeliveryService)** - admin belgilagan foiz
   - Jami: 100%

3. **Taqsimot Qismlari:**
   - **Punkt**: Buyurtmani tasdiqlagan punkt
   - **Agent**: Buyurtmani mijozga yetkazgan agent
   - **Menejer**: Buyurtmaning delivery viloyatidagi viloyat menejeri
   - **Moliya**: Moliya bo'limi
   - **Dostavka**: Yetkazib berish xizmati (hech qanday recipient ga berilmaydi)

---

## 1. KPI Taqsimot Konfiguratsiyasi

### 1.1. KPI Taqsimot Yaratish
**POST** `/api/admins/kpi/distributions`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "name": "Asosiy KPI Taqsimoti",
  "description": "2024 yil uchun asosiy KPI taqsimoti",
  "distribution": {
    "punkt": 20,
    "agent": 30,
    "manager": 15,
    "finance": 20,
    "deliveryService": 15
  },
  "isActive": true
}
```

**Validation:**
- `name` - majburiy, unique bo'lishi kerak
- `distribution` - majburiy
- `distribution.punkt` - 0-100 orasida
- `distribution.agent` - 0-100 orasida
- `distribution.manager` - 0-100 orasida
- `distribution.finance` - 0-100 orasida
- `distribution.deliveryService` - 0-100 orasida
- **Jami foizlar 100% bo'lishi kerak**

**Response:**
```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439027",
    "name": "Asosiy KPI Taqsimoti",
    "description": "2024 yil uchun asosiy KPI taqsimoti",
    "distribution": {
      "punkt": 20,
      "agent": 30,
      "manager": 15,
      "finance": 20,
      "deliveryService": 15
    },
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439024",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

**Xatoliklar:**
- `400` - Foizlar yig'indisi 100% emas
- `400` - Bu nom bilan taqsimlash allaqachon mavjud

---

### 1.2. Barcha KPI Taqsimotlarni Olish
**GET** `/api/admins/kpi/distributions`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `isActive` (boolean, optional) - Faqat faol taqsimotlarni olish
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi taqsimotlar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439027",
      "name": "Asosiy KPI Taqsimoti",
      "description": "2024 yil uchun asosiy KPI taqsimoti",
      "distribution": {
        "punkt": 20,
        "agent": 30,
        "manager": 15,
        "finance": 20,
        "deliveryService": 15
      },
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439024",
        "name": "Admin Name"
      },
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 1.3. KPI Taqsimotni ID bo'yicha Olish
**GET** `/api/admins/kpi/distributions/:id`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439027",
    "name": "Asosiy KPI Taqsimoti",
    "description": "2024 yil uchun asosiy KPI taqsimoti",
    "distribution": {
      "punkt": 20,
      "agent": 30,
      "manager": 15,
      "finance": 20,
      "deliveryService": 15
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439024",
      "name": "Admin Name"
    },
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

### 1.4. KPI Taqsimotni Yangilash
**PUT** `/api/admins/kpi/distributions/:id`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "name": "Yangilangan KPI Taqsimoti",
  "description": "Yangilangan tavsif",
  "distribution": {
    "punkt": 25,
    "agent": 25,
    "manager": 20,
    "finance": 15,
    "deliveryService": 15
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439027",
    "name": "Yangilangan KPI Taqsimoti",
    "distribution": {
      "punkt": 25,
      "agent": 25,
      "manager": 20,
      "finance": 15,
      "deliveryService": 15
    },
    "isActive": true
  }
}
```

**Eslatma:** Agar `isActive: true` bo'lsa, boshqa barcha taqsimotlar avtomatik ravishda `isActive: false` ga o'zgartiriladi.

---

### 1.5. KPI Taqsimotni O'chirish
**DELETE** `/api/admins/kpi/distributions/:id`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "message": "KPI bonus taqsimlash muvaffaqiyatli o'chirildi"
}
```

---

### 1.6. Boshlang'ich KPI Taqsimot Qiymatlarini Olish
**GET** `/api/admins/kpi/distributions/initial/defaults`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Default KPI Distribution",
    "description": "Tavsiyaviy boshlang'ich taqsimlash. Admin kerak bo'lsa qiymatlarni o'zgartirishi mumkin.",
    "distribution": {
      "punkt": 20,
      "agent": 30,
      "manager": 15,
      "finance": 20,
      "deliveryService": 15
    },
    "notes": [
      "KPI taqsimlashlar (punkt, agent, manager, finance, deliveryService) yig'indisi 100% bo'lishi shart",
      "KPI miqdori (foyda * kpiBonusPercent / 100) 100% sifatida olinadi va admin belgilagan foizlar asosida taqsimlanadi",
      "Yetkazib berish xizmati (deliveryService) faqat moliya bo'limida saqlanadi va hech qanday recipient ga berilmaydi",
      "Bu qiymatlar faqat create formasi uchun boshlang'ich tavsiya"
    ]
  }
}
```

---

## 2. KPI Transaksiyalar

### 2.1. Barcha KPI Transaksiyalarni Olish
**GET** `/api/admins/kpi/transactions`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `orderId` (string, optional) - Buyurtma ID
- `productId` (string, optional) - Maxsulot ID
- `punktId` (string, optional) - Punkt ID
- `agentId` (string, optional) - Agent ID
- `managerId` (string, optional) - Menejer ID
- `orderStatus` (string, optional) - Buyurtma holati
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi transaksiyalar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439028",
      "order": {
        "_id": "507f1f77bcf86cd799439021",
        "orderNumber": "ORD-2024-0001",
        "status": "confirmed_by_customer",
        "totalPrice": 130000
      },
      "orderItem": {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Uzum sirkasi",
          "price": 65000,
          "productCode": "PROD-001"
        },
        "quantity": 2,
        "price": 65000,
        "originalPrice": 50000,
        "kpiBonusPercent": 50
      },
      "totalKpiAmount": 15000,
      "distributionConfig": {
        "_id": "507f1f77bcf86cd799439027",
        "name": "Asosiy KPI Taqsimoti",
        "distribution": {
          "punkt": 20,
          "agent": 30,
          "manager": 15,
          "finance": 20,
          "deliveryService": 15
        }
      },
      "amounts": {
        "punkt": 3000,
        "agent": 4500,
        "manager": 2250,
        "finance": 3000,
        "deliveryService": 2250
      },
      "recipients": {
        "punkt": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt Name",
          "phone": "+998901234567"
        },
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
        },
        "manager": {
          "_id": "507f1f77bcf86cd799439029",
          "name": "Manager Name",
          "phone": "+998901234567",
          "viloyat": {
            "_id": "507f1f77bcf86cd799439015",
            "name": "Toshkent viloyati"
          }
        }
      },
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 2.2. KPI Transaksiyani ID bo'yicha Olish
**GET** `/api/admins/kpi/transactions/:id`

**Authentication:** `adminAuth` required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439028",
    "order": {
      "_id": "507f1f77bcf86cd799439021",
      "orderNumber": "ORD-2024-0001",
      "status": "confirmed_by_customer",
      "totalPrice": 130000,
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "phone": "+998901234567"
      }
    },
    "orderItem": {
      "product": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Uzum sirkasi",
        "price": 65000,
        "productCode": "PROD-001"
      },
      "quantity": 2,
      "price": 65000,
      "originalPrice": 50000,
      "kpiBonusPercent": 50
    },
    "totalKpiAmount": 15000,
    "distributionConfig": {
      "_id": "507f1f77bcf86cd799439027",
      "name": "Asosiy KPI Taqsimoti",
      "distribution": {
        "punkt": 20,
        "agent": 30,
        "manager": 15,
        "finance": 20,
        "deliveryService": 15
      }
    },
    "amounts": {
      "punkt": 3000,
      "agent": 4500,
      "manager": 2250,
      "finance": 3000,
      "deliveryService": 2250
    },
    "recipients": {
      "punkt": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt Name",
        "phone": "+998901234567"
      },
      "agent": {
        "_id": "507f1f77bcf86cd799439022",
        "name": "Agent Name",
        "phone": "+998901234567"
      },
      "manager": {
        "_id": "507f1f77bcf86cd799439029",
        "name": "Manager Name",
        "phone": "+998901234567"
      }
    },
    "orderStatus": "confirmed_by_customer",
    "isPaid": false,
    "createdAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

### 2.3. KPI Statistika
**GET** `/api/admins/kpi/statistics`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `orderId` (string, optional) - Buyurtma ID
- `productId` (string, optional) - Maxsulot ID
- `punktId` (string, optional) - Punkt ID
- `agentId` (string, optional) - Agent ID
- `managerId` (string, optional) - Menejer ID
- `orderStatus` (string, optional) - Buyurtma holati
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 100,
    "totalKpiAmount": 1500000,
    "totalPunkt": 300000,
    "totalAgent": 450000,
    "totalManager": 225000,
    "paidTransactions": 80,
    "unpaidTransactions": 20
  }
}
```

---

## 3. Agentlar KPI Ma'lumotlari

### 3.1. Barcha Agentlar KPI Ma'lumotlari
**GET** `/api/admins/kpi/data/agents`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `viloyatId` (string, optional) - Viloyat ID
- `tumanId` (string, optional) - Tuman ID
- `mfyId` (string, optional) - MFY ID
- `agentId` (string, optional) - Agent ID
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi agentlar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439022",
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
      },
      "totalTransactions": 50,
      "totalAmount": 450000,
      "paidAmount": 300000,
      "unpaidAmount": 150000
    }
  ]
}
```

---

### 3.2. Agent KPI Tafsilotlari
**GET** `/api/admins/kpi/data/agents/:agentId`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi transaksiyalar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
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
    },
    "summary": {
      "totalAmount": 450000,
      "paidAmount": 300000,
      "unpaidAmount": 150000
    },
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439028",
        "order": {
          "_id": "507f1f77bcf86cd799439021",
          "orderNumber": "ORD-2024-0001",
          "status": "confirmed_by_customer",
          "totalPrice": 130000
        },
        "orderItem": {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Uzum sirkasi",
            "price": 65000,
            "productCode": "PROD-001"
          },
          "quantity": 2,
          "price": 65000,
          "originalPrice": 50000,
          "kpiBonusPercent": 50
        },
        "totalKpiAmount": 15000,
        "agentAmount": 4500,
        "isPaid": false,
        "createdAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "count": 50,
    "total": 50,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

## 4. Punktlar KPI Ma'lumotlari

### 4.1. Barcha Punktlar KPI Ma'lumotlari
**GET** `/api/admins/kpi/data/punkts`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `viloyatId` (string, optional) - Viloyat ID
- `tumanId` (string, optional) - Tuman ID
- `punktId` (string, optional) - Punkt ID
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi punktlar soni (default: 50)

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
      "_id": "507f1f77bcf86cd799439025",
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
      },
      "totalTransactions": 30,
      "totalAmount": 300000,
      "paidAmount": 200000,
      "unpaidAmount": 100000
    }
  ]
}
```

---

### 4.2. Punkt KPI Tafsilotlari
**GET** `/api/admins/kpi/data/punkts/:punktId`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `isPaid` (boolean, optional) - To'langanligi
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi transaksiyalar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
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
    },
    "summary": {
      "totalAmount": 300000,
      "paidAmount": 200000,
      "unpaidAmount": 100000
    },
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439028",
        "order": {
          "_id": "507f1f77bcf86cd799439021",
          "orderNumber": "ORD-2024-0001",
          "status": "confirmed_by_customer",
          "totalPrice": 130000
        },
        "orderItem": {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Uzum sirkasi",
            "price": 65000,
            "productCode": "PROD-001"
          },
          "quantity": 2,
          "price": 65000,
          "originalPrice": 50000,
          "kpiBonusPercent": 50
        },
        "totalKpiAmount": 15000,
        "punktAmount": 3000,
        "isPaid": false,
        "createdAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "count": 30,
    "total": 30,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

## 5. KPI To'lovlarini Boshqarish

### 5.1. To'lanmagan To'lovlar Ro'yxati
**GET** `/api/admin-kpi-payments/unpaid`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `recipientType` (string, optional) - Qabul qiluvchi turi (`agent`, `punkt`, `manager`)
- `viloyatId` (string, optional) - Viloyat ID
- `tumanId` (string, optional) - Tuman ID
- `mfyId` (string, optional) - MFY ID
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi to'lovlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "totalAmount": 5000000,
  "totalUnpaidAmount": 5000000,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "recipientType": "agent",
      "recipient": {
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
      },
      "amount": 150000,
      "status": "pending",
      "kpiTransactions": [
        {
          "_id": "507f1f77bcf86cd799439028",
          "order": "507f1f77bcf86cd799439021",
          "orderItem": {
            "product": "507f1f77bcf86cd799439013"
          },
          "totalKpiAmount": 15000
        }
      ],
      "createdAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "recipientType": "punkt",
      "recipient": {
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
      },
      "amount": 100000,
      "status": "pending",
      "kpiTransactions": [
        {
          "_id": "507f1f77bcf86cd799439028",
          "order": "507f1f77bcf86cd799439021",
          "orderItem": {
            "product": "507f1f77bcf86cd799439013"
          },
          "totalKpiAmount": 15000
        }
      ],
      "createdAt": "2024-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439032",
      "recipientType": "manager",
      "recipient": {
        "_id": "507f1f77bcf86cd799439029",
        "name": "Manager Name",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati"
        }
      },
      "amount": 75000,
      "status": "pending",
      "kpiTransactions": [
        {
          "_id": "507f1f77bcf86cd799439028",
          "order": "507f1f77bcf86cd799439021",
          "orderItem": {
            "product": "507f1f77bcf86cd799439013"
          },
          "totalKpiAmount": 15000
        }
      ],
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 5.2. To'lanmagan To'lovlar (Guruhlangan)
**GET** `/api/admin-kpi-payments/unpaid/grouped`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `recipientType` (string, optional) - Qabul qiluvchi turi (`agent`, `punkt`, `manager`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recipient": {
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
      },
      "recipientType": "agent",
      "totalAmount": 150000,
      "paymentsCount": 5
    },
    {
      "recipient": {
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
      },
      "recipientType": "punkt",
      "totalAmount": 100000,
      "paymentsCount": 3
    },
    {
      "recipient": {
        "_id": "507f1f77bcf86cd799439029",
        "name": "Manager Name",
        "phone": "+998901234567",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati"
        }
      },
      "recipientType": "manager",
      "totalAmount": 75000,
      "paymentsCount": 2
    }
  ]
}
```

---

### 5.3. To'lovlarni "To'landi" Deb Belgilash
**POST** `/api/admin-kpi-payments/mark-as-paid`

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "paymentIds": [
    "507f1f77bcf86cd799439030",
    "507f1f77bcf86cd799439031",
    "507f1f77bcf86cd799439032"
  ],
  "notes": "To'lovlar naqd pul orqali amalga oshirildi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 ta to'lov muvaffaqiyatli to'landi deb belgilandi",
  "data": {
    "updatedCount": 3,
    "totalAmount": 325000,
    "updatedPayments": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "recipientType": "agent",
        "amount": 150000,
        "status": "paid",
        "paidAt": "2024-01-16T12:00:00.000Z",
        "paidBy": {
          "_id": "507f1f77bcf86cd799439024",
          "name": "Admin Name"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439031",
        "recipientType": "punkt",
        "amount": 100000,
        "status": "paid",
        "paidAt": "2024-01-16T12:00:00.000Z",
        "paidBy": {
          "_id": "507f1f77bcf86cd799439024",
          "name": "Admin Name"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439032",
        "recipientType": "manager",
        "amount": 75000,
        "status": "paid",
        "paidAt": "2024-01-16T12:00:00.000Z",
        "paidBy": {
          "_id": "507f1f77bcf86cd799439024",
          "name": "Admin Name"
        }
      }
    ],
    "notifications": [
      {
        "_id": "507f1f77bcf86cd799439033",
        "title": "KPI To'lovi To'landi",
        "message": "Hurmatli Agent Name, sizga 150,000 so'm miqdorida KPI to'lovi to'landi."
      }
    ]
  }
}
```

**Eslatma:** To'lovlar "to'landi" deb belgilanganda, avtomatik ravishda:
- KPI transaksiyalar `isPaid: true` ga o'zgartiriladi
- Qabul qiluvchilarga bildirishnomalar yuboriladi
- Socket.io orqali real-time bildirishnomalar yuboriladi

---

### 5.4. To'lovlar Statistikasi
**GET** `/api/admin-kpi-payments/statistics`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `recipientType` (string, optional) - Qabul qiluvchi turi (`agent`, `punkt`, `manager`)
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 100,
    "totalAmount": 5000000,
    "paidPayments": 80,
    "paidAmount": 4000000,
    "unpaidPayments": 20,
    "unpaidAmount": 1000000,
    "byRecipientType": {
      "agent": {
        "total": 50,
        "paid": 40,
        "unpaid": 10,
        "totalAmount": 2500000,
        "paidAmount": 2000000,
        "unpaidAmount": 500000
      },
      "punkt": {
        "total": 30,
        "paid": 25,
        "unpaid": 5,
        "totalAmount": 1500000,
        "paidAmount": 1250000,
        "unpaidAmount": 250000
      },
      "manager": {
        "total": 20,
        "paid": 15,
        "unpaid": 5,
        "totalAmount": 1000000,
        "paidAmount": 750000,
        "unpaidAmount": 250000
      }
    }
  }
}
```

---

### 5.5. To'langan To'lovlar Ro'yxati
**GET** `/api/admin-kpi-payments/paid`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `recipientType` (string, optional) - Qabul qiluvchi turi (`agent`, `punkt`, `manager`)
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi
- `page` (number, optional) - Sahifa raqami (default: 1)
- `limit` (number, optional) - Har sahifadagi to'lovlar soni (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 80,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "recipientType": "agent",
      "recipient": {
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
      },
      "amount": 150000,
      "status": "paid",
      "paidAt": "2024-01-16T12:00:00.000Z",
      "paidBy": {
        "_id": "507f1f77bcf86cd799439024",
        "name": "Admin Name",
        "phone": "+998901234567"
      },
      "kpiTransactions": [
        {
          "_id": "507f1f77bcf86cd799439028",
          "order": "507f1f77bcf86cd799439021",
          "orderItem": {
            "product": "507f1f77bcf86cd799439013"
          },
          "totalKpiAmount": 15000
        }
      ],
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

---

### 5.6. KPI To'lovlarini Sinxronlashtirish
**POST** `/api/admin-kpi-payments/sync`

**Authentication:** `adminAuth` required

**Tavsif:** KPI transaksiyalardan to'lovlarni yaratadi yoki yangilaydi. Bu funksiya:
- To'lanmagan KPI transaksiyalarni topadi
- Har bir recipient (punkt, agent, manager) uchun to'lov yaratadi yoki mavjud to'lovni yangilaydi
- To'lovlar `pending` status bilan yaratiladi

**Response:**
```json
{
  "success": true,
  "message": "KPI to'lovlari muvaffaqiyatli sinxronlashtirildi",
  "data": {
    "created": 10,
    "updated": 5,
    "createdIds": [
      "507f1f77bcf86cd799439030",
      "507f1f77bcf86cd799439031"
    ],
    "updatedIds": [
      "507f1f77bcf86cd799439032"
    ]
  }
}
```

---

## 6. Moliya KPI Ma'lumotlari

### 6.1. Moliya KPI Summasi
**GET** `/api/admin-finance/balance/finance-kpi`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFinanceKpi": 300000,
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

---

### 6.2. Yetkazib Berish Xizmati KPI Summasi
**GET** `/api/admin-finance/balance/delivery-service-kpi`

**Authentication:** `adminAuth` required

**Query Parameters:**
- `startDate` (date, optional) - Boshlanish sanasi
- `endDate` (date, optional) - Tugash sanasi

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDeliveryServiceKpi": 225000,
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

---

## KPI Oqimi

### KPI Yaratilish Oqimi

1. **Buyurtma yaratiladi** (`POST /api/marketplace/orders`)
   - Status: `pending`

2. **Punkt buyurtmani tasdiqlaydi** (`POST /api/punkt/orders/:id/confirm`)
   - Status: `confirmed_by_punkt`

3. **Kontragentdan qabul qilinadi** (`POST /api/punkt/orders/:id/receive-from-contragent`)
   - Status: `delivered_to_punkt`

4. **Agentga yuboriladi** (`POST /api/punkt/orders/:id/assign-to-agent`)
   - Status: `assigned_to_agent`

5. **Agent mijozga yetkazadi** (`POST /api/agent/orders/:id/mark-delivered`)
   - Status: `confirmed_by_agent`

6. **Mijoz tasdiqlaydi** (`POST /api/marketplace/orders/:id/confirm-delivery`)
   - Status: `confirmed_by_customer`
   - **Bu bosqichda KPI transaksiyalar avtomatik yaratiladi**

7. **KPI Hisoblash:**
   - Har bir order item uchun:
     - Foyda = `price - originalPrice`
     - KPI miqdori = `foyda * quantity * kpiBonusPercent / 100`
     - Bu KPI miqdori 100% sifatida olinadi va taqsimlanadi:
       - Punkt: `KPI * distribution.punkt / 100`
       - Agent: `KPI * distribution.agent / 100`
       - Manager: `KPI * distribution.manager / 100`
       - Finance: `KPI * distribution.finance / 100`
       - DeliveryService: `KPI * distribution.deliveryService / 100`

8. **KPI To'lovlari:**
   - Admin `POST /api/admin-kpi-payments/sync` orqali to'lovlarni yaratadi
   - Admin `POST /api/admin-kpi-payments/mark-as-paid` orqali to'lovlarni "to'landi" deb belgilaydi

---

## Misol: KPI Hisoblash

### Masala:
- **Maxsulot:** Uzum sirkasi
- **OriginalPrice:** 50000 so'm
- **Price:** 65000 so'm
- **Quantity:** 1 ta
- **KPI Bonus Percent (Tuman kontragent):** 30%

### Hisoblash:

1. **Foyda hisoblash:**
   ```
   Foyda = Price - OriginalPrice
   Foyda = 65000 - 50000 = 15000 so'm
   ```
   **Eslatma:** Bu 15000 so'm kontragentning sof foydasi.

2. **KPI miqdori:**
   ```
   KPI = Foyda * Quantity * kpiBonusPercent / 100
   KPI = 15000 * 1 * 30 / 100 = 4500 so'm
   ```
   **Eslatma:** Kontragent 30% KPI ajratgan, demak 15000 so'm foydadan 4500 so'm KPI uchun ajratiladi.

3. **KPI taqsimoti (4500 so'm 100% sifatida):**
   ```
   Punkt: 4500 * 20 / 100 = 900 so'm
   Agent: 4500 * 30 / 100 = 1350 so'm
   Manager: 4500 * 15 / 100 = 675 so'm
   Finance: 4500 * 20 / 100 = 900 so'm
   DeliveryService: 4500 * 15 / 100 = 675 so'm
   
   Jami: 900 + 1350 + 675 + 900 + 675 = 4500 so'm ✓
   ```

4. **Kontragent uchun:**
   ```
   Kontragent o'zi: Foyda - KPI = 15000 - 4500 = 10500 so'm
   ```
   **Eslatma:** Kontragent 15000 so'm foydadan 4500 so'm KPI uchun ajratgan, qolgan 10500 so'm uning o'zi uchun.

### Qo'shimcha Misol (2 ta maxsulot):

- **OriginalPrice:** 5000 so'm
- **Price:** 6000 so'm
- **Quantity:** 2 ta
- **KPI Bonus Percent:** 50%

**Hisoblash:**
1. Foyda = (6000 - 5000) * 2 = 2000 so'm
2. KPI = 2000 * 50 / 100 = 1000 so'm
3. KPI taqsimoti (1000 so'm 100% sifatida):
   - Punkt: 1000 * 20 / 100 = 200 so'm
   - Agent: 1000 * 30 / 100 = 300 so'm
   - Manager: 1000 * 15 / 100 = 150 so'm
   - Finance: 1000 * 20 / 100 = 200 so'm
   - DeliveryService: 1000 * 15 / 100 = 150 so'm
4. Kontragent: 2000 - 1000 = 1000 so'm

---

## Eslatmalar

### KPI Taqsimot Qismlari

1. **Punkt:**
   - Buyurtmani tasdiqlagan punkt (`confirmedByPunkt` yoki `currentPunkt`)
   - Punkt buyurtmani tasdiqlaganda KPI olish huquqiga ega bo'ladi

2. **Agent:**
   - Buyurtmani mijozga yetkazgan agent (`assignedToAgent`)
   - Agent buyurtmani mijozga yetkazganda KPI olish huquqiga ega bo'ladi

3. **Menejer (ViloyatManager):**
   - Buyurtmaning `deliveryViloyat` field'i bo'yicha topiladi
   - Faqat `status: 'active'` bo'lgan menejer tanlanadi
   - Agar menejer topilmasa, manager KPI ajratilmaydi

4. **Moliya:**
   - Moliya bo'limi uchun ajratilgan KPI
   - Hech qanday recipient ga berilmaydi, faqat moliya bo'limida saqlanadi

5. **Dostavka (DeliveryService):**
   - Yetkazib berish xizmati uchun ajratilgan KPI
   - Hech qanday recipient ga berilmaydi, faqat moliya bo'limida saqlanadi

### KPI To'lovlari

- KPI transaksiyalar yaratilganda, to'lovlar avtomatik yaratilmaydi
- Admin `POST /api/admin-kpi-payments/sync` orqali to'lovlarni yaratishi kerak
- To'lovlar `pending` status bilan yaratiladi
- Admin `POST /api/admin-kpi-payments/mark-as-paid` orqali to'lovlarni "to'landi" deb belgilaydi
- To'lovlar "to'landi" deb belgilanganda, avtomatik ravishda:
  - KPI transaksiyalar `isPaid: true` ga o'zgartiriladi
  - Qabul qiluvchilarga bildirishnomalar yuboriladi

### Validation Qoidalari

1. **KPI Taqsimot:**
   - Barcha foizlar 0-100 orasida bo'lishi kerak
   - Jami foizlar 100% bo'lishi kerak
   - Faqat bitta taqsimot `isActive: true` bo'lishi mumkin

2. **KPI Transaksiyalar:**
   - Faqat `confirmed_by_customer` status'li buyurtmalar uchun yaratiladi
   - Har bir buyurtma uchun faqat bir marta yaratiladi

3. **KPI To'lovlar:**
   - To'lovlar faqat `pending` status'li transaksiyalardan yaratiladi
   - Har bir recipient uchun bitta `pending` to'lov bo'lishi mumkin

---

## Versiya

**Version:** 2.0.0  
**Last Updated:** 2024-01-16  
**KPI Distribution:** Punkt, Agent, Manager, Finance, DeliveryService
