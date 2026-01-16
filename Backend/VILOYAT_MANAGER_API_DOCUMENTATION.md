# Viloyat Manager API Documentation

## Umumiy ma'lumotlar

### Base URL
```
/api/viloyat-managers
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
Token olish uchun login endpoint'ini ishlatish kerak (qarang: Login endpoint).

---

## Endpoint'lar

### 1. Login

**POST** `/api/viloyat-managers/login`

Viloyat menejeri login qilish.

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "password123",
  "deviceId": "optional-device-id",
  "deviceInfo": {
    "optional": "device information"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "status": "active"
  }
}
```

**Validation Errors:**
- `phone` - Telefon raqami kiritilishi shart
- `password` - Parol kiritilishi shart

---

### 2. Create Viloyat Manager

**POST** `/api/viloyat-managers`

Yangi viloyat menejeri yaratish (faqat admin).

**Authentication:** `adminAuth` required

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+998901234567",
  "password": "password123",
  "viloyat": "507f1f77bcf86cd799439012",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Viloyat menejeri muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Errors:**
- `name` - Ismi kiritilishi shart (2-200 belgi)
- `phone` - Telefon raqami kiritilishi shart (to'g'ri format)
- `password` - Parol kiritilishi shart (min 6 belgi)
- `viloyat` - Viloyat kiritilishi shart

**Error Responses:**
- `400` - Telefon raqami allaqachon mavjud
- `400` - Viloyat topilmadi yoki noto'g'ri tur

---

### 3. Get All Viloyat Managers

**GET** `/api/viloyat-managers`

Barcha viloyat menejerlarini olish (faqat admin).

**Authentication:** `adminAuth` required

**Query Parameters:**
- `status` (string, optional) - Filter by status: 'active' or 'inactive'
- `viloyat` (string, optional) - Filter by viloyat ID
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

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
      "name": "John Doe",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "10"
      },
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Viloyat Manager By ID

**GET** `/api/viloyat-managers/:id`

Viloyat menejerini ID bo'yicha olish (faqat admin).

**Authentication:** `adminAuth` required

**Path Parameters:**
- `id` (string, required) - Viloyat menejeri ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Viloyat menejeri topilmadi
- `400` - Noto'g'ri viloyat menejeri ID

---

### 5. Update Viloyat Manager

**PUT** `/api/viloyat-managers/:id`

Viloyat menejerini yangilash (faqat admin).

**Authentication:** `adminAuth` required

**Path Parameters:**
- `id` (string, required) - Viloyat menejeri ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+998901234568",
  "password": "newpassword123",
  "viloyat": "507f1f77bcf86cd799439013",
  "status": "inactive"
}
```

**Note:** Barcha field'lar optional. Faqat yangilanishi kerak bo'lgan field'larni yuborish kifoya.

**Response:**
```json
{
  "success": true,
  "message": "Viloyat menejeri muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "phone": "+998901234568",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Samarqand viloyati",
      "type": "region",
      "code": "20"
    },
    "status": "inactive",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Validation Errors:**
- `name` - Ismi 2-200 belgi bo'lishi kerak
- `phone` - To'g'ri telefon raqam formatini kiriting
- `password` - Parol min 6 belgi bo'lishi kerak
- `viloyat` - Viloyat ID to'g'ri formatda bo'lishi kerak
- `status` - Status "active" yoki "inactive" bo'lishi kerak

**Error Responses:**
- `404` - Viloyat menejeri topilmadi
- `400` - Telefon raqami allaqachon mavjud
- `400` - Viloyat topilmadi yoki noto'g'ri tur

---

### 6. Delete Viloyat Manager

**DELETE** `/api/viloyat-managers/:id`

Viloyat menejerini o'chirish (faqat admin).

**Authentication:** `adminAuth` required

**Path Parameters:**
- `id` (string, required) - Viloyat menejeri ID

**Response:**
```json
{
  "success": true,
  "message": "Viloyat menejeri muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**
- `404` - Viloyat menejeri topilmadi
- `400` - Noto'g'ri viloyat menejeri ID

---

## Model Schema

### ViloyatManager

```javascript
{
  _id: ObjectId,
  name: String (required, 2-200 chars),
  phone: String (required, unique),
  password: String (required, min 6 chars, hashed),
  viloyat: ObjectId (required, ref: 'Region'),
  status: String (enum: ['active', 'inactive'], default: 'active'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `viloyat` - Index
- `phone` - Unique index
- `status` - Index

---

## Eslatmalar

1. **Password:** Parol avtomatik ravishda bcrypt bilan hash qilinadi va response'da qaytarilmaydi.

2. **Viloyat Validation:** Viloyat ID mavjud bo'lishi va `type: 'region'` bo'lishi kerak.

3. **Phone Uniqueness:** Telefon raqami unique bo'lishi kerak.

4. **Status:** Faqat 'active' statusdagi viloyat menejerlari login qila oladi.

5. **Device Management:** Login paytida `deviceId` va `deviceInfo` yuborilishi mumkin. Bu device tracking uchun ishlatiladi.

6. **Token Expiry:** Token default 30 kun muddatga yaroqlidir (JWT_EXPIRE environment variable orqali o'zgartirish mumkin).

---

## Misollar

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:5000/api/viloyat-managers/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

**Create Viloyat Manager (Admin):**
```bash
curl -X POST http://localhost:5000/api/viloyat-managers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "John Doe",
    "phone": "+998901234567",
    "password": "password123",
    "viloyat": "507f1f77bcf86cd799439012",
    "status": "active"
  }'
```

**Get All Viloyat Managers (Admin):**
```bash
curl -X GET "http://localhost:5000/api/viloyat-managers?status=active&page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

**Update Viloyat Manager (Admin):**
```bash
curl -X PUT http://localhost:5000/api/viloyat-managers/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "John Doe Updated",
    "status": "inactive"
  }'
```

**Delete Viloyat Manager (Admin):**
```bash
curl -X DELETE http://localhost:5000/api/viloyat-managers/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin-token>"
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
  "message": "Hisobingiz faol emas"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Viloyat menejeri topilmadi"
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
