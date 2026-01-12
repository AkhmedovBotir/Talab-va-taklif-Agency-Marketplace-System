# Kontragent API Dokumentatsiyasi

Bu dokumentatsiya Kontragent CRUD operatsiyalari va boshqaruv funksiyalari uchun to'liq API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/contragents`

---

## Munda

1. [Kontragent Turlari](#kontragent-turlari)
2. [Autentifikatsiya](#autentifikatsiya)
3. [CRUD Operatsiyalari](#crud-operatsiyalari)
4. [To'lovlar](#tolovlar)
5. [Xabarnomalar](#xabarnomalar)
6. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)

---

## Kontragent Turlari

Kontragentlar ikki xil darajada bo'lishi mumkin:

1. **Tuman Kontragenti** (`contragentLevel: "tuman"`)
   - Tuman darajasida ishlaydi
   - Barcha tuman bo'yicha buyurtmalarni qabul qiladi

2. **Maxalla Kontragenti** (`contragentLevel: "mfy"`)
   - MFY (Maxalla Fuqarolar Yig'ini) darajasida ishlaydi
   - Faqat o'z MFYsi bo'yicha buyurtmalarni qabul qiladi

**Eslatma:** Har ikkala kontragent turi uchun ham `viloyat`, `tuman` va `mfy` maydonlari required bo'lishi kerak. Farqi faqat ularning ish darajasida (`contragentLevel`).

---

## Autentifikatsiya

### Parol O'rnatish (3 bosqich)

Yangi kontragentlar uchun parol o'rnatish 3 bosqichdan iborat:

#### Bosqich 1: SMS Kod So'rash

```
POST /api/contragents/password-setup/step1
```

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
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Kontragent topilmadi
- `400` - Parol allaqachon o'rnatilgan
- `403` - Hisob faol emas

---

#### Bosqich 2: SMS Kodni Tasdiqlash

```
POST /api/contragents/password-setup/step2
```

**Request Body:**
```json
{
  "phone": "+998901234567",
  "code": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kod muvaffaqiyatli tasdiqlandi. Endi parol o'rnatishingiz mumkin"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Kod noto'g'ri yoki muddati tugagan
- `404` - Kontragent topilmadi

---

#### Bosqich 3: Parol O'rnatish

```
POST /api/contragents/password-setup/step3
```

**Request Body:**
```json
{
  "phone": "+998901234567",
  "newPassword": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'rnatildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - SMS kod tasdiqlanmagan yoki parol qisqa
- `404` - Kontragent topilmadi

---

### Login

#### Login (Eski endpoint)

```
POST /api/contragents/login
```

#### Login (Yangi endpoint)

```
POST /api/contragents/auth/login
```

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "secret123"
}
```

**Headers:**
```
x-device-id: device_unique_id (required)
x-device-name: "iPhone 13" (optional)
x-device-type: "mobile" (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "contragent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC Company",
      "inn": "123456789",
      "phone": "+998901234567",
      "logo": "data:image/png;base64,...",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "10"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Angren tumani",
        "type": "district",
        "code": "1001"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Angren MFY",
        "type": "mfy",
        "code": "1001001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Oziq-ovqat",
        "icon": "food-icon"
      },
      "contragentLevel": "tuman",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "device": {
      "deviceId": "device_unique_id",
      "deviceName": "iPhone 13",
      "isPrimary": true
    }
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Qurilma ID topilmadi
- `401` - Telefon raqami yoki parol noto'g'ri
- `403` - Qurilma tasdiqlash kerak yoki hisob faol emas

---

## CRUD Operatsiyalari

### Create - Kontragent Yaratish

```
POST /api/contragents
```

**Request Body:**
```json
{
  "name": "ABC Company",
  "inn": "123456789",
  "viloyat": "507f1f77bcf86cd799439012",
  "tuman": "507f1f77bcf86cd799439013",
  "mfy": "507f1f77bcf86cd799439014",
  "phone": "+998901234567",
  "password": "secret123",
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "activityType": "507f1f77bcf86cd799439015",
  "contragentLevel": "tuman",
  "status": "active"
}
```

**Field Descriptions:**
- `name` (required, string, 2-200 belgi): Kontragent nomi
- `inn` (required, string, 9 yoki 12 raqam): INN (Individual Taxpayer Number)
- `viloyat` (required, ObjectId): Viloyat ID
- `tuman` (required, ObjectId): Tuman ID
- `mfy` (required, ObjectId): MFY ID
- `phone` (required, string): Telefon raqami (unique)
- `password` (required, string, min: 6): Parol
- `logo` (optional, string): Logo (base64 format)
- `activityType` (required, ObjectId): Faoliyat turi ID
- `contragentLevel` (optional, enum: "tuman"|"mfy", default: "tuman"): Kontragent darajasi
- `status` (optional, enum: "active"|"inactive", default: "active"): Status

**Response:**
```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Company",
    "inn": "123456789",
    "phone": "+998901234567",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Angren tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Angren MFY",
      "type": "mfy",
      "code": "1001001"
    },
    "activityType": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Oziq-ovqat",
      "icon": "food-icon"
    },
    "contragentLevel": "tuman",
    "status": "active",
    "logo": "data:image/png;base64,...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Muvaffaqiyatli yaratildi
- `400` - Validatsiya xatosi (INN yoki telefon mavjud, noto'g'ri regionlar)
- `500` - Server xatosi

**Validation Rules:**
- INN unique bo'lishi kerak
- Telefon raqami unique bo'lishi kerak
- Viloyat → Tuman → MFY ierarxiyasi to'g'ri bo'lishi kerak
- Faoliyat turi active bo'lishi kerak

---

### Read - Barcha Kontragentlarni Olish

```
GET /api/contragents
```

**Query Parameters:**
- `status` (optional, enum: "active"|"inactive"): Status bo'yicha filter
- `viloyat` (optional, ObjectId): Viloyat ID bo'yicha filter
- `tuman` (optional, ObjectId): Tuman ID bo'yicha filter
- `mfy` (optional, ObjectId): MFY ID bo'yicha filter
- `contragentLevel` (optional, enum: "tuman"|"mfy"): Kontragent darajasi bo'yicha filter
- `page` (optional, number, default: 1): Sahifa raqami
- `limit` (optional, number, default: 10): Sahifadagi elementlar soni

**Example Request:**
```
GET /api/contragents?status=active&contragentLevel=tuman&viloyat=507f1f77bcf86cd799439012&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC Company",
      "inn": "123456789",
      "phone": "+998901234567",
      "logo": "data:image/png;base64,...",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "10"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Angren tumani",
        "type": "district",
        "code": "1001"
      },
      "mfy": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Angren MFY",
        "type": "mfy",
        "code": "1001001"
      },
      "activityType": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Oziq-ovqat",
        "icon": "food-icon"
      },
      "contragentLevel": "tuman",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli

---

### Read - Kontragentni ID Bo'yicha Olish

```
GET /api/contragents/:id
```

**Path Parameters:**
- `id` (required, ObjectId): Kontragent ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Company",
    "inn": "123456789",
    "phone": "+998901234567",
    "logo": "data:image/png;base64,...",
    "viloyat": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Angren tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Angren MFY",
      "type": "mfy",
      "code": "1001001"
    },
    "activityType": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Oziq-ovqat",
      "icon": "food-icon"
    },
    "contragentLevel": "tuman",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Kontragent topilmadi
- `400` - Noto'g'ri ID format

---

### Update - Kontragentni Yangilash

```
PUT /api/contragents/:id
```

**Path Parameters:**
- `id` (required, ObjectId): Kontragent ID

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "name": "Updated Company Name",
  "inn": "987654321",
  "viloyat": "507f1f77bcf86cd799439012",
  "tuman": "507f1f77bcf86cd799439013",
  "mfy": "507f1f77bcf86cd799439014",
  "phone": "+998901234568",
  "password": "newpassword123",
  "logo": "data:image/png;base64,...",
  "activityType": "507f1f77bcf86cd799439016",
  "contragentLevel": "mfy",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Company Name",
    "inn": "987654321",
    "phone": "+998901234568",
    "viloyat": { /* region object */ },
    "tuman": { /* region object */ },
    "mfy": { /* region object */ },
    "activityType": { /* activity type object */ },
    "contragentLevel": "mfy",
    "status": "active",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli yangilandi
- `400` - Validatsiya xatosi
- `404` - Kontragent topilmadi
- `500` - Server xatosi

**Eslatmalar:**
- INN yoki telefon yangilanayotganda, ular unique bo'lishi kerak
- Regionlar yangilanayotganda, ierarxiya to'g'ri bo'lishi kerak
- Parol yangilanayotganda, avtomatik hash qilinadi

---

### Delete - Kontragentni O'chirish

```
DELETE /api/contragents/:id
```

**Path Parameters:**
- `id` (required, ObjectId): Kontragent ID

**Response:**
```json
{
  "success": true,
  "message": "Kontragent muvaffaqiyatli o'chirildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli o'chirildi
- `404` - Kontragent topilmadi
- `400` - Noto'g'ri ID format

---

## O'z Profilini Boshqarish

### O'z Profilini Ko'rish (Me)

```
GET /api/contragents/me
```

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Company",
    "inn": "123456789",
    "phone": "+998901234567",
    "logo": "data:image/png;base64,...",
    "viloyat": { /* region object */ },
    "tuman": { /* region object */ },
    "mfy": { /* region object */ },
    "activityType": { /* activity type object */ },
    "contragentLevel": "tuman",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `401` - Autentifikatsiya talab qilinadi
- `404` - Kontragent topilmadi

---

### O'z Profilini Yangilash

```
PUT /api/contragents/me
```

**Authentication:** Required (Bearer token)

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "name": "Updated Name",
  "phone": "+998901234568",
  "inn": "987654321",
  "viloyat": "507f1f77bcf86cd799439012",
  "tuman": "507f1f77bcf86cd799439013",
  "mfy": "507f1f77bcf86cd799439014",
  "logo": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profil yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "phone": "+998901234568",
    "logo": "data:image/png;base64,...",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Validatsiya xatosi
- `401` - Autentifikatsiya talab qilinadi

---

### Logoni Yangilash

```
PATCH /api/contragents/me/logo
```

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logo yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "logo": "data:image/png;base64,...",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Logo formati noto'g'ri
- `401` - Autentifikatsiya talab qilinadi

---

## To'lovlar

### To'langan To'lovlarni Ko'rish

```
GET /api/contragents/payments/paid
```

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `startDate` (optional, ISO date): Boshlanish sanasi
- `endDate` (optional, ISO date): Tugash sanasi
- `page` (optional, number, default: 1): Sahifa raqami
- `limit` (optional, number, default: 10): Sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "contragent": "507f1f77bcf86cd799439011",
      "amount": 5000000,
      "status": "paid",
      "paidAt": "2024-01-15T00:00:00.000Z",
      "paidBy": "507f1f77bcf86cd799439021",
      "dueDate": "2024-01-10T00:00:00.000Z",
      "orders": ["507f1f77bcf86cd799439030"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### To'lanmagan To'lovlarni Ko'rish

```
GET /api/contragents/payments/unpaid
```

**Authentication:** Required (Bearer token)

**Query Parameters:** (To'langan to'lovlar bilan bir xil)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "contragent": "507f1f77bcf86cd799439011",
      "amount": 3000000,
      "status": "pending",
      "dueDate": "2024-02-01T00:00:00.000Z",
      "isOverdue": false,
      "orders": ["507f1f77bcf86cd799439035"],
      "createdAt": "2024-01-20T00:00:00.000Z"
    }
  ]
}
```

---

### To'lov Statistikasini Ko'rish

```
GET /api/contragents/payments/statistics
```

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `startDate` (optional, ISO date): Boshlanish sanasi
- `endDate` (optional, ISO date): Tugash sanasi

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPaid": 50000000,
    "totalUnpaid": 15000000,
    "totalAmount": 65000000,
    "paidCount": 50,
    "unpaidCount": 15
  }
}
```

---

### To'lovni ID Bo'yicha Ko'rish

```
GET /api/contragents/payments/:id
```

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `id` (required, ObjectId): To'lov ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "contragent": "507f1f77bcf86cd799439011",
    "amount": 5000000,
    "status": "paid",
    "paidAt": "2024-01-15T00:00:00.000Z",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Admin Name"
    },
    "dueDate": "2024-01-10T00:00:00.000Z",
    "orders": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "orderNumber": "00001",
        "totalPrice": 5000000
      }
    ],
    "notes": "To'lov tasdiqlandi",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Xabarnomalar

### Xabarnomalar Ro'yxatini Olish

```
GET /api/contragents/notifications/list
```

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `read` (optional, boolean): O'qilgan/o'qilmagan filter
- `type` (optional, string): Xabarnoma turi
- `page` (optional, number, default: 1): Sahifa raqami
- `limit` (optional, number, default: 10): Sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "title": "Yangi buyurtma",
      "message": "Sizga yangi buyurtma kelgan",
      "type": "info",
      "readBy": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### O'qilmagan Xabarnomalar Sonini Olish

```
GET /api/contragents/notifications/unread-count
```

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

### Xabarnomani O'qilgan Deb Belgilash

```
POST /api/contragents/notifications/:notificationId/read
```

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `notificationId` (required, ObjectId): Xabarnoma ID

**Response:**
```json
{
  "success": true,
  "message": "Xabarnoma o'qilgan deb belgilandi"
}
```

---

### Barcha Xabarnomalarni O'qilgan Deb Belgilash

```
POST /api/contragents/notifications/read-all
```

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Barcha xabarnomalar o'qilgan deb belgilandi"
}
```

---

## Ma'lumotlar Strukturasi

### Kontragent Ob'ekti

```typescript
interface Contragent {
  _id: string;                    // ObjectId
  name: string;                   // 2-200 belgi
  inn: string;                    // 9 yoki 12 raqam (unique)
  phone: string;                  // Telefon raqami (unique)
  password: string;               // Hash qilingan (select: false)
  logo: string | null;            // Base64 format
  viloyat: Region;                // Viloyat ob'ekti
  tuman: Region;                  // Tuman ob'ekti
  mfy: Region;                    // MFY ob'ekti
  activityType: ContragentType;   // Faoliyat turi
  contragentLevel: "tuman" | "mfy"; // Kontragent darajasi
  status: "active" | "inactive";  // Status
  isFeaturedForMarketplace: boolean; // Marketplace uchun tanlangan
  passwordSetupAllowed: boolean;  // Parol o'rnatishga ruxsat
  createdAt: Date;                // Yaratilgan sana
  updatedAt: Date;                // Yangilangan sana
}
```

### Region Ob'ekti

```typescript
interface Region {
  _id: string;                    // ObjectId
  name: string;                   // Nom
  type: "region" | "district" | "mfy"; // Tur
  code: string;                   // Kod (unique)
  parent: string | null;          // Ota region ID
  status: "active" | "inactive";  // Status
}
```

### ContragentType Ob'ekti

```typescript
interface ContragentType {
  _id: string;                    // ObjectId
  name: string;                   // Nom (2-200 belgi)
  icon: string;                   // Icon
  status: "active" | "inactive";  // Status
}
```

---

## Xato Kodlari

| Kod | Xabar | Tavsif |
|-----|-------|--------|
| 200 | OK | Muvaffaqiyatli so'rov |
| 201 | Created | Muvaffaqiyatli yaratildi |
| 400 | Bad Request | Validatsiya xatosi yoki noto'g'ri so'rov |
| 401 | Unauthorized | Autentifikatsiya talab qilinadi |
| 403 | Forbidden | Ruxsat berilmagan yoki hisob faol emas |
| 404 | Not Found | Resurs topilmadi |
| 500 | Internal Server Error | Server xatosi |

---

## Validatsiya Qoidalari

### INN
- 9 yoki 12 ta raqamdan iborat bo'lishi kerak
- Unique bo'lishi kerak

### Telefon
- To'g'ri telefon raqam formati
- Unique bo'lishi kerak

### Parol
- Kamida 6 ta belgi
- Yaratishda required
- Yangilashda ixtiyoriy

### Logo
- Base64 format: `data:image/(png|jpg|jpeg|gif|webp);base64,{base64_data}`
- Ixtiyoriy

### Regionlar
- Viloyat → Tuman → MFY ierarxiyasi to'g'ri bo'lishi kerak
- Har biri o'z turiga ega bo'lishi kerak (region, district, mfy)

### ContragentLevel
- Enum: "tuman" | "mfy"
- Default: "tuman"

---

## Misollar

### Tuman Kontragentini Yaratish

```bash
curl -X POST https://api.example.com/api/contragents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Tuman Company",
    "inn": "123456789",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439014",
    "phone": "+998901234567",
    "password": "secret123",
    "activityType": "507f1f77bcf86cd799439015",
    "contragentLevel": "tuman",
    "status": "active"
  }'
```

### Maxalla Kontragentini Yaratish

```bash
curl -X POST https://api.example.com/api/contragents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XYZ Maxalla Company",
    "inn": "987654321",
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439014",
    "phone": "+998901234568",
    "password": "secret456",
    "activityType": "507f1f77bcf86cd799439015",
    "contragentLevel": "mfy",
    "status": "active"
  }'
```

### Faqat Maxalla Kontragentlarini Olish

```bash
curl -X GET "https://api.example.com/api/contragents?contragentLevel=mfy&status=active" \
  -H "Content-Type: application/json"
```

### Faqat Tuman Kontragentlarini Olish

```bash
curl -X GET "https://api.example.com/api/contragents?contragentLevel=tuman&status=active" \
  -H "Content-Type: application/json"
```

---

## Socket.IO Real-time Updates

Kontragentlar Socket.IO orqali real-time xabarnomalar olishadi.

### Connect

```javascript
const socket = io('https://api.example.com', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Join Room

```javascript
socket.emit('join:room', {
  userType: 'Contragent',
  userId: 'your_contragent_id'
});
```

### Receive Notifications

```javascript
socket.on('notification', (notification) => {
  console.log('Yangi xabarnoma:', notification);
});
```

---

**Dokumentatsiya versiyasi:** 1.0  
**Yangi qo'shilgan:** `contragentLevel` maydoni - Tuman va Maxalla kontragentlarni farqlash uchun
