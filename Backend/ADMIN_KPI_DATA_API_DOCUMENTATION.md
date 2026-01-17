# Admin KPI Data API Dokumentatsiyasi

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

---

## 1. Barcha KPI Transaksiyalarni Olish

**GET** `/api/admins/kpi/transactions`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha KPI bonus transaksiyalarni filter va pagination bilan olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `orderId` | string | No | Buyurtma ID bo'yicha filter |
| `productId` | string | No | Maxsulot ID bo'yicha filter |
| `punktId` | string | No | Punkt ID bo'yicha filter |
| `agentId` | string | No | Agent ID bo'yicha filter |
| `managerId` | string | No | Manager ID bo'yicha filter |
| `orderStatus` | string | No | Buyurtma holati bo'yicha filter |
| `isPaid` | boolean | No | To'langan/To'lanmagan filter (`true`/`false`) |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi transaksiyalar soni (default: 50) |

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
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "status": "confirmed_by_customer",
        "totalPrice": 130000
      },
      "orderItem": {
        "product": {
          "_id": "507f1f77bcf86cd799439023",
          "name": "Uzum sirkasi",
          "price": 65000,
          "productCode": "PROD001"
        },
        "quantity": 2,
        "price": 65000,
        "originalPrice": 50000
      },
      "distributionConfig": {
        "_id": "507f1f77bcf86cd799439024",
        "name": "Default Distribution",
        "distribution": {
          "punkt": 20,
          "agent": 30,
          "manager": 15,
          "finance": 20,
          "deliveryService": 15
        }
      },
      "amounts": {
        "punkt": 900,
        "agent": 1350,
        "manager": 675,
        "finance": 900,
        "deliveryService": 675
      },
      "recipients": {
        "punkt": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234567"
        },
        "agent": {
          "_id": "507f1f77bcf86cd799439026",
          "name": "Agent 1",
          "phone": "+998901234568",
          "viloyat": "507f1f77bcf86cd799439015",
          "tuman": "507f1f77bcf86cd799439016",
          "mfy": "507f1f77bcf86cd799439017"
        },
        "manager": {
          "_id": "507f1f77bcf86cd799439027",
          "name": "Manager 1",
          "phone": "+998901234569",
          "viloyat": "507f1f77bcf86cd799439015"
        }
      },
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "createdAt": "2024-01-16T10:00:00.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/transactions?punktId=507f1f77bcf86cd799439025&isPaid=false&page=1&limit=20
```

---

## 2. KPI Transaksiyani ID bo'yicha Olish

**GET** `/api/admins/kpi/transactions/:id`

**Authentication:** `adminAuth` required

**Tavsif:** Bitta KPI bonus transaksiyani ID bo'yicha olish.

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `id` | string | Yes | KPI transaksiya ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "order": {
      "_id": "507f1f77bcf86cd799439022",
      "orderNumber": "00001",
      "status": "confirmed_by_customer",
      "totalPrice": 130000
    },
    "orderItem": {
      "product": {
        "_id": "507f1f77bcf86cd799439023",
        "name": "Uzum sirkasi",
        "price": 65000,
        "productCode": "PROD001"
      },
      "quantity": 2,
      "price": 65000,
      "originalPrice": 50000
    },
    "distributionConfig": {
      "_id": "507f1f77bcf86cd799439024",
      "name": "Default Distribution",
      "distribution": {
        "punkt": 20,
        "agent": 30,
        "manager": 15,
        "finance": 20,
        "deliveryService": 15
      }
    },
    "amounts": {
      "punkt": 900,
      "agent": 1350,
      "manager": 675,
      "finance": 900,
      "deliveryService": 675
    },
    "recipients": {
      "punkt": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt 1",
        "phone": "+998901234567"
      },
      "agent": {
        "_id": "507f1f77bcf86cd799439026",
        "name": "Agent 1",
        "phone": "+998901234568"
      },
      "manager": {
        "_id": "507f1f77bcf86cd799439027",
        "name": "Manager 1",
        "phone": "+998901234569"
      }
    },
    "orderStatus": "confirmed_by_customer",
    "isPaid": false,
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

## 3. KPI Statistika

**GET** `/api/admins/kpi/statistics`

**Authentication:** `adminAuth` required

**Tavsif:** Umumiy KPI statistikasini olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 1000,
    "totalKpiAmount": 5000000,
    "paidKpiAmount": 3000000,
    "unpaidKpiAmount": 2000000,
    "byRecipient": {
      "punkt": {
        "totalAmount": 1000000,
        "paidAmount": 600000,
        "unpaidAmount": 400000
      },
      "agent": {
        "totalAmount": 1500000,
        "paidAmount": 900000,
        "unpaidAmount": 600000
      },
      "manager": {
        "totalAmount": 750000,
        "paidAmount": 450000,
        "unpaidAmount": 300000
      },
      "finance": {
        "totalAmount": 1000000,
        "paidAmount": 600000,
        "unpaidAmount": 400000
      },
      "deliveryService": {
        "totalAmount": 750000,
        "paidAmount": 450000,
        "unpaidAmount": 300000
      }
    }
  }
}
```

---

## 4. Barcha Agentlar KPI Ma'lumotlari

**GET** `/api/admins/kpi/data/agents`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha agentlarning KPI ma'lumotlarini aggregate qilib olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `viloyatId` | string | No | Viloyat ID bo'yicha filter |
| `tumanId` | string | No | Tuman ID bo'yicha filter |
| `mfyId` | string | No | MFY ID bo'yicha filter |
| `agentId` | string | No | Bitta agent ID bo'yicha filter |
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi agentlar soni (default: 50) |

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
      "agent": {
        "_id": "507f1f77bcf86cd799439026",
        "name": "Agent 1",
        "phone": "+998901234568",
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
          "name": "MFY 1"
        }
      },
      "totalTransactions": 100,
      "totalAmount": 135000,
      "paidAmount": 81000,
      "unpaidAmount": 54000
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/agents?viloyatId=507f1f77bcf86cd799439015&isPaid=false&page=1&limit=20
```

---

## 5. Barcha Punktlar KPI Ma'lumotlari

**GET** `/api/admins/kpi/data/punkts`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha punktlarning KPI ma'lumotlarini aggregate qilib olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `viloyatId` | string | No | Viloyat ID bo'yicha filter |
| `tumanId` | string | No | Tuman ID bo'yicha filter |
| `punktId` | string | No | Bitta punkt ID bo'yicha filter |
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi punktlar soni (default: 50) |

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
      "punkt": {
        "_id": "507f1f77bcf86cd799439025",
        "name": "Punkt 1",
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
      "totalTransactions": 150,
      "totalAmount": 90000,
      "paidAmount": 54000,
      "unpaidAmount": 36000
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/punkts?tumanId=507f1f77bcf86cd799439016&isPaid=false&page=1&limit=20
```

---

## 6. Bitta Agent KPI Tafsilotlari

**GET** `/api/admins/kpi/data/agents/:agentId`

**Authentication:** `adminAuth` required

**Tavsif:** Bitta agentning barcha KPI transaksiyalarini tafsilotlari bilan olish.

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `agentId` | string | Yes | Agent ID |

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi transaksiyalar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "agent": {
    "_id": "507f1f77bcf86cd799439026",
    "name": "Agent 1",
    "phone": "+998901234568",
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
      "name": "MFY 1"
    }
  },
  "summary": {
    "totalTransactions": 100,
    "totalAmount": 135000,
    "paidAmount": 81000,
    "unpaidAmount": 54000
  },
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "status": "confirmed_by_customer",
        "totalPrice": 130000
      },
      "orderItem": {
        "product": {
          "_id": "507f1f77bcf86cd799439023",
          "name": "Uzum sirkasi",
          "price": 65000,
          "productCode": "PROD001"
        },
        "quantity": 2,
        "price": 65000,
        "originalPrice": 50000
      },
      "agentAmount": 1350,
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/agents/507f1f77bcf86cd799439026?isPaid=false&page=1&limit=20
```

---

## 7. Barcha Managerlar KPI Ma'lumotlari

**GET** `/api/admins/kpi/data/managers`

**Authentication:** `adminAuth` required

**Tavsif:** Barcha managerlarning KPI ma'lumotlarini aggregate qilib olish.

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `viloyatId` | string | No | Viloyat ID bo'yicha filter |
| `managerId` | string | No | Bitta manager ID bo'yicha filter |
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi managerlar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 20,
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "data": [
    {
      "manager": {
        "_id": "507f1f77bcf86cd799439027",
        "name": "Manager 1",
        "phone": "+998901234569",
        "viloyat": {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "TOSHKENT"
        },
        "status": "active"
      },
      "totalTransactions": 200,
      "totalAmount": 135000,
      "paidAmount": 81000,
      "unpaidAmount": 54000
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/managers?viloyatId=507f1f77bcf86cd799439015&isPaid=false&page=1&limit=20
```

---

## 8. Bitta Punkt KPI Tafsilotlari

**GET** `/api/admins/kpi/data/punkts/:punktId`

**Authentication:** `adminAuth` required

**Tavsif:** Bitta punktning barcha KPI transaksiyalarini tafsilotlari bilan olish.

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `punktId` | string | Yes | Punkt ID |

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi transaksiyalar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "punkt": {
    "_id": "507f1f77bcf86cd799439025",
    "name": "Punkt 1",
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
    "totalTransactions": 150,
    "totalAmount": 90000,
    "paidAmount": 54000,
    "unpaidAmount": 36000
  },
  "count": 10,
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "order": {
        "_id": "507f1f77bcf86cd799439022",
        "orderNumber": "00001",
        "status": "confirmed_by_customer",
        "totalPrice": 130000
      },
      "orderItem": {
        "product": {
          "_id": "507f1f77bcf86cd799439023",
          "name": "Uzum sirkasi",
          "price": 65000,
          "productCode": "PROD001"
        },
        "quantity": 2,
        "price": 65000,
        "originalPrice": 50000
      },
      "punktAmount": 900,
      "orderStatus": "confirmed_by_customer",
      "isPaid": false,
      "createdAt": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/punkts/507f1f77bcf86cd799439025?isPaid=false&page=1&limit=20
```

---

## 9. Bitta Manager KPI Tafsilotlari

**GET** `/api/admins/kpi/data/managers/:managerId`

**Authentication:** `adminAuth` required

**Tavsif:** Bitta managerning barcha KPI transaksiyalarini tafsilotlari bilan olish.

**Path Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `managerId` | string | Yes | Manager ID |

**Query Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `isPaid` | boolean | No | To'langan/To'lanmagan filter |
| `startDate` | date | No | Boshlanish sanasi |
| `endDate` | date | No | Tugash sanasi |
| `page` | number | No | Sahifa raqami (default: 1) |
| `limit` | number | No | Har sahifadagi transaksiyalar soni (default: 50) |

**Response:**
```json
{
  "success": true,
  "data": {
    "manager": {
      "_id": "507f1f77bcf86cd799439027",
      "name": "Manager 1",
      "phone": "+998901234569",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TOSHKENT"
      },
      "status": "active"
    },
    "summary": {
      "totalTransactions": 200,
      "totalAmount": 135000,
      "paidAmount": 81000,
      "unpaidAmount": 54000
    },
    "transactions": {
      "count": 10,
      "total": 200,
      "page": 1,
      "limit": 50,
      "totalPages": 4,
      "data": [
        {
          "_id": "507f1f77bcf86cd799439021",
          "order": {
            "_id": "507f1f77bcf86cd799439022",
            "orderNumber": "00001",
            "status": "confirmed_by_customer",
            "totalPrice": 130000
          },
          "orderItem": {
            "product": {
              "_id": "507f1f77bcf86cd799439023",
              "name": "Uzum sirkasi",
              "price": 65000,
              "productCode": "PROD001"
            },
            "quantity": 2,
            "price": 65000,
            "originalPrice": 50000
          },
          "managerAmount": 675,
          "orderStatus": "confirmed_by_customer",
          "isPaid": false,
          "createdAt": "2024-01-16T10:00:00.000Z"
        }
      ]
    }
  }
}
```

**Misol So'rov:**
```
GET /api/admins/kpi/data/managers/507f1f77bcf86cd799439027?isPaid=false&page=1&limit=20
```

---

## Filter Qoidalari

### Avtomatik Filterlar

1. **Agentlar KPI:** Faqat `orderStatus: 'confirmed_by_customer'` bo'lgan transaksiyalar hisoblanadi.
2. **Punktlar KPI:** Faqat `orderStatus: 'confirmed_by_customer'` bo'lgan transaksiyalar hisoblanadi.

### Filter Parametrlari

- **`viloyatId`:** Viloyat bo'yicha filter (agentlar, punktlar va managerlar uchun)
- **`tumanId`:** Tuman bo'yicha filter (agentlar va punktlar uchun)
- **`mfyId`:** MFY bo'yicha filter (faqat agentlar uchun)
- **`agentId`:** Bitta agent ID (faqat agentlar ro'yxati uchun)
- **`punktId`:** Bitta punkt ID (faqat punktlar ro'yxati uchun)
- **`managerId`:** Bitta manager ID (faqat managerlar ro'yxati uchun)
- **`isPaid`:** To'langan/To'lanmagan filter (`true`/`false`)
- **`startDate` / `endDate`:** Sana oralig'i filter

---

## Pagination

Barcha endpoint'lar pagination qo'llab-quvvatlaydi:

- **page:** Sahifa raqami (default: 1)
- **limit:** Har sahifadagi yozuvlar soni (default: 50)

**Response format:**
```json
{
  "success": true,
  "count": 10,        // Joriy sahifadagi yozuvlar soni
  "total": 50,        // Jami yozuvlar soni
  "page": 1,          // Joriy sahifa
  "limit": 50,        // Har sahifadagi yozuvlar soni
  "totalPages": 1,    // Jami sahifalar soni
  "data": [ ... ]
}
```

---

## Xatoliklar

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Agent topilmadi"
}
```
Yoki:
```json
{
  "success": false,
  "message": "Punkt topilmadi"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Xatolik xabari",
  "error": "Xatolik tafsilotlari"
}
```

---

## Misollar

### Misol 1: To'lanmagan agentlar KPI'larini olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/data/agents?isPaid=false&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Misol 2: Sana oralig'ida punktlar KPI'larini olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/data/punkts?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

### Misol 3: Bitta agentning KPI tafsilotlarini olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/data/agents/507f1f77bcf86cd799439026?isPaid=false&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Misol 4: KPI transaksiyalarni filter bilan olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/transactions?punktId=507f1f77bcf86cd799439025&isPaid=false&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Misol 5: Managerlar KPI'larini olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/data/managers?viloyatId=507f1f77bcf86cd799439015&isPaid=false&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Misol 6: Bitta managerning KPI tafsilotlarini olish
```bash
curl -X GET "http://localhost:5000/api/admins/kpi/data/managers/507f1f77bcf86cd799439027?isPaid=false&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## Eslatmalar

1. **KPI Hisoblash:** KPI sof foydadan (`price - originalPrice`) hisoblanadi va `kpiBonusPercent` ga ko'paytiriladi.

2. **Taqsimot:** Hisoblangan KPI miqdori 100% sifatida qabul qilinadi va quyidagicha taqsimlanadi:
   - Punkt: 20%
   - Agent: 30%
   - Manager: 15%
   - Finance: 20%
   - Delivery Service: 15%

3. **Order Status:** Faqat `confirmed_by_customer` holatidagi buyurtmalar KPI hisoblanadi.

4. **Population:** Barcha endpoint'larda related field'lar (order, product, agent, punkt, manager) populate qilinadi.

5. **Sorting:** 
   - Transaksiyalar: `createdAt: -1` (eng yangisi birinchi)
   - Agentlar/Punktlar ro'yxati: `totalAmount: -1` (eng ko'p KPI birinchi)

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Admin KPI Data API - Transaksiyalar, Statistika, Agentlar va Punktlar KPI ma'lumotlari
