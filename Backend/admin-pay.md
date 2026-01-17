# Admin Payment API Dokumentatsiyasi

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
Barcha endpoint'lar `adminAuth` middleware talab qiladi. Header'da token yuborilishi kerak:
```
Authorization: Bearer <token>
```

---

## 1. Punktga Pul Yuborish

**POST** `/api/admins/payments/send-to-punkt`

**Authentication:** `adminAuth` required

**Tavsif:** Admin punktga pul yuboradi. Bu punkt uchun kirim, admin uchun chiqim hisoblanadi.

**Request Body:**
```json
{
  "punktId": "507f1f77bcf86cd799439025",
  "amount": 1000000,
  "description": "Punkt uchun boshlang'ich mablag'"
}
```

**Request Body Parameters:**

| Parametr | Type | Required | Tavsif |
|----------|------|----------|--------|
| `punktId` | string | Yes | Punkt ID |
| `amount` | number | Yes | Yuboriladigan summa (0 dan katta) |
| `description` | string | No | Tavsif (maksimal 1000 belgi) |

**Response:**
```json
{
  "success": true,
  "message": "Pul muvaffaqiyatli punktga yuborildi",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "type": "expense",
    "category": "admin_to_punkt",
    "amount": 1000000,
    "description": "Punkt uchun boshlang'ich mablag'",
    "fromUser": {
      "userType": "Admin",
      "userId": "507f1f77bcf86cd799439020"
    },
    "toUser": {
      "userType": "Punkt",
      "userId": "507f1f77bcf86cd799439025",
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
  }
}
```

**Misol So'rov:**
```bash
curl -X POST "http://localhost:5000/api/admins/payments/send-to-punkt" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "punktId": "507f1f77bcf86cd799439025",
    "amount": 1000000,
    "description": "Punkt uchun boshlang'ich mablag'"
  }'
```

---

## 2. Admin Tranzaksiyalarini Olish

**GET** `/api/admins/payments/transactions`

**Authentication:** `adminAuth` required

**Tavsif:** Admin o'zining barcha kirim/chiqim tranzaksiyalarini olish.

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
      "category": "admin_to_punkt",
      "amount": 1000000,
      "description": "Punkt uchun boshlang'ich mablag'",
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
        "userId": {
          "_id": "507f1f77bcf86cd799439025",
          "name": "Punkt 1",
          "phone": "+998901234568"
        }
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
curl -X GET "http://localhost:5000/api/admins/payments/transactions?type=expense&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## 3. Admin Balansini Olish

**GET** `/api/admins/payments/balance`

**Authentication:** `adminAuth` required

**Tavsif:** Admin balansini olish (kirim - chiqim).

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
- **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (admin qarzda)
- **Haq:** Agar balans musbat bo'lsa, haq = balance (admin haqida)

**Misol So'rov:**
```bash
curl -X GET "http://localhost:5000/api/admins/payments/balance" \
  -H "Authorization: Bearer <token>"
```

---

## Tranzaksiya Kategoriyalari

### Admin Tranzaksiyalari:

- **`admin_to_punkt`** - Admin punktga pul yuboradi (chiqim)

---

## Workflow

### Admin → Punkt
- Admin punktga pul yuboradi (`admin_to_punkt`)
- Bu punkt uchun kirim, admin uchun chiqim
- Punkt bu pulni kontragentlarga zaklad berish va boshqa operatsiyalar uchun ishlatadi

---

## Eslatmalar

1. **Kirim/Chiqim:** 
   - **Kirim (income):** Adminga kelgan pul (hozircha yo'q)
   - **Chiqim (expense):** Admindan ketgan pul (punktga yuborilgan)

2. **Status:** Tranzaksiyalar `completed` status bilan yaratiladi.

3. **Balance:** Balans = Jami kirim - Jami chiqim

4. **Qarz va Haq:**
   - **Qarz:** Agar balans manfiy bo'lsa, qarz = |balance| (admin qarzda)
   - **Haq:** Agar balans musbat bo'lsa, haq = balance (admin haqida)

5. **Punktga Pul Yuborish:** Admin punktga boshlang'ich mablag' yoki qo'shimcha mablag' yuborishi mumkin. Bu punktning moliya operatsiyalarini amalga oshirish uchun zarur.

---

## Versiya

**Version:** 1.0.0  
**Last Updated:** 2024-01-16  
**Structure:** Admin Payment API - Punktga pul yuborish, tranzaksiyalar va balans
