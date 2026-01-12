# Maxalla Dokoni API Dokumentatsiyasi

Bu dokumentatsiya Maxalla Dokoni (MFY kontragentlar) uchun to'liq API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/maxalla-contragents`

**Eslatma:** Bu API faqat `contragentLevel: 'mfy'` (Maxalla Dokoni) kontragentlar uchun ishlaydi. Tuman kontragentlar uchun `/api/contragents` API dan foydalaning.

---

## Munda

1. [Kirish](#kirish)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Logout](#logout)
4. [Profil Boshqaruvi](#profil-boshqaruvi)
5. [Ish Vaqti Boshqaruvi](#ish-vaqti-boshqaruvi)
6. [Xizmat Ko'rsatish Hududlari](#xizmat-korsatish-hududlari)
7. [Device Verification](#device-verification)
8. [Yetkazib Beruvchilar CRUD](#yetkazib-beruvchilar-crud)
9. [Maxalla Maxsulotlari CRUD](#maxalla-maxsulotlari-crud)
10. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
11. [Xato Kodlari](#xato-kodlari)
12. [Misollar](#misollar)

---

## Kirish

**Maxalla Dokoni** - bu MFY (Maxalla Fuqarolar Yig'ini) darajasida ishlaydigan kontragentlar. Ular o'z MFYsi va tanlangan boshqa MFYlarda xizmat ko'rsatadi.

**Maxalla Dokoni xususiyatlari:**
- MFY darajasida ishlaydi
- O'z tumani bo'yicha xizmat ko'rsatadi
- Bir nechta MFYlarda xizmat ko'rsatish imkoniyati
- Ish vaqtini belgilash imkoniyati
- `contragentLevel: 'mfy'` maydoni bilan belgilanadi

**Tuman Kontragent vs Maxalla Dokoni:**
- **Tuman Kontragent** (`contragentLevel: 'tuman'`): `/api/contragents` API dan foydalanadi
- **Maxalla Dokoni** (`contragentLevel: 'mfy'`): `/api/maxalla-contragents` API dan foydalanadi (bu dokumentatsiya)

---

## Autentifikatsiya

### Parol O'rnatish (3 bosqich)

Yangi Maxalla Dokoni uchun parol o'rnatish 3 bosqichdan iborat:

#### Bosqich 1: SMS Kod So'rash

```
POST /api/maxalla-contragents/password-setup/step1
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

---

#### Bosqich 2: SMS Kodni Tasdiqlash

```
POST /api/maxalla-contragents/password-setup/step2
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

---

#### Bosqich 3: Parol O'rnatish

```
POST /api/maxalla-contragents/password-setup/step3
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

---

### Login

#### Maxalla Dokoni Login

```
POST /api/maxalla-contragents/login
```

**Request Body:**
```json
{
  "phone": "+998901234567",
  "password": "secret123"
}
```

**Request Headers:**
```
x-device-id: device_unique_id (required)
x-device-name: "iPhone 13" (optional)
x-device-type: "mobile" (optional)
Content-Type: application/json
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
      "name": "ABC Maxalla Dokoni",
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
      "contragentLevel": "mfy",
      "workingHours": {
        "open": "09:00",
        "close": "18:00"
      },
      "serviceAreas": {
        "tuman": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Angren tumani",
          "type": "district",
          "code": "1001"
        },
        "mfys": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Angren MFY",
            "type": "mfy",
            "code": "1001001"
          },
          {
            "_id": "507f1f77bcf86cd799439016",
            "name": "Boshqa MFY",
            "type": "mfy",
            "code": "1001002"
          }
        ]
      },
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

**Authentication:** Required - Bearer token (login'dan keyin)

---

### Logout

#### Maxalla Dokoni Logout

```
POST /api/maxalla-contragents/logout
```

**Authentication:** Required (maxallaContragentAuth)

**Request Headers:**
```
Authorization: Bearer {token}
x-device-id: device_unique_id (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli chiqildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli chiqildi
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

**Eslatmalar:**
- Logout qilganda token invalid qilinmaydi (JWT stateless)
- Qurilma deactivate qilinadi (`isActive: false`)
- Keyingi login uchun device verification talab qilinadi (agar boshqa faol qurilma bo'lmasa)
- Frontend'da token ni o'chirish kerak

---

## Profil Boshqaruvi

### O'z Profilini Ko'rish

```
GET /api/maxalla-contragents/me
```

**Authentication:** Required (maxallaContragentAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Maxalla Dokoni",
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
    "contragentLevel": "mfy",
    "workingHours": {
      "open": "09:00",
      "close": "18:00"
    },
    "serviceAreas": {
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Angren tumani",
        "type": "district",
        "code": "1001"
      },
      "mfys": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Angren MFY",
          "type": "mfy",
          "code": "1001001"
        },
        {
          "_id": "507f1f77bcf86cd799439016",
          "name": "Boshqa MFY",
          "type": "mfy",
          "code": "1001002"
        }
      ]
    },
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Profilni Yangilash

```
PUT /api/maxalla-contragents/me
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "name": "Updated Maxalla Dokoni Name",
  "phone": "+998901234568",
  "inn": "987654321",
  "viloyat": "507f1f77bcf86cd799439012",
  "tuman": "507f1f77bcf86cd799439013",
  "mfy": "507f1f77bcf86cd799439014",
  "logo": "data:image/png;base64,...",
  "activityType": "507f1f77bcf86cd799439015"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profil yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Maxalla Dokoni Name",
    "phone": "+998901234568",
    "logo": "data:image/png;base64,...",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Eslatmalar:**
- INN yoki telefon yangilanayotganda, ular unique bo'lishi kerak
- Regionlar yangilanayotganda, ierarxiya to'g'ri bo'lishi kerak
- Logo base64 formatida bo'lishi kerak

---

## Ish Vaqti Boshqaruvi

### Ish Vaqtini Yangilash

```
PATCH /api/maxalla-contragents/me/working-hours
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:**
```json
{
  "open": "09:00",
  "close": "18:00"
}
```

**Field Descriptions:**
- `open` (optional, string, format: HH:MM): Ochilish vaqti (masalan: "09:00")
- `close` (optional, string, format: HH:MM): Yopilish vaqti (masalan: "18:00")
- Kamida bitta maydon (open yoki close) kiritilishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Ish vaqti yangilandi",
  "data": {
    "workingHours": {
      "open": "09:00",
      "close": "18:00"
    }
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli yangilandi
- `400` - Vaqt formati noto'g'ri yoki kamida bitta maydon kiritilmagan
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

**Validation:**
- Vaqt formati: `HH:MM` (24 soatlik format)
- Masalan: "09:00", "18:30", "23:59"
- `open` va `close` ixtiyoriy, lekin kamida bittasi kiritilishi kerak

**Misollar:**

Faqat ochilish vaqtini yangilash:
```json
{
  "open": "08:00"
}
```

Faqat yopilish vaqtini yangilash:
```json
{
  "close": "20:00"
}
```

Ikkalasini ham yangilash:
```json
{
  "open": "09:00",
  "close": "18:00"
}
```

---

## Xizmat Ko'rsatish Hududlari

### Xizmat Ko'rsatish Hududlarini Yangilash

```
PATCH /api/maxalla-contragents/me/service-areas
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:**
```json
{
  "tuman": "507f1f77bcf86cd799439013",
  "mfys": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439016",
    "507f1f77bcf86cd799439017"
  ]
}
```

**Field Descriptions:**
- `tuman` (optional, ObjectId): Xizmat ko'rsatish tumani ID
- `mfys` (optional, array of ObjectId): Xizmat ko'rsatish MFYlari IDlari (kamida 1 ta)
- Agar `tuman` kiritilmasa, kontragentning o'z tumani ishlatiladi
- `mfys` array kamida 1 ta MFY ID dan iborat bo'lishi kerak
- Barcha MFYlar `tuman`ga tegishli bo'lishi kerak

**Response:**
```json
{
  "success": true,
  "message": "Xizmat ko'rsatish hududlari yangilandi",
  "data": {
    "serviceAreas": {
      "tuman": "507f1f77bcf86cd799439013",
      "mfys": [
        "507f1f77bcf86cd799439014",
        "507f1f77bcf86cd799439016",
        "507f1f77bcf86cd799439017"
      ]
    }
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli yangilandi
- `400` - Validatsiya xatosi (tuman topilmadi, MFY topilmadi, MFY tumanaga tegishli emas)
- `401` - Autentifikatsiya talab qilinadi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

**Validation Rules:**
- `tuman` - Tuman ID bo'lishi kerak va kontragentning viloyatiga tegishli bo'lishi kerak
- `mfys` - Array bo'lishi kerak, kamida 1 ta MFY ID
- Har bir MFY `tuman`ga tegishli bo'lishi kerak
- MFYlar `type: 'mfy'` bo'lishi kerak

**Misollar:**

Faqat MFYlarni yangilash (tuman o'zgarmaydi):
```json
{
  "mfys": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439016"
  ]
}
```

Tuman va MFYlarni yangilash:
```json
{
  "tuman": "507f1f77bcf86cd799439013",
  "mfys": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439016"
  ]
}
```

---

## Device Verification

Maxalla Dokoni uchun alohida device verification API mavjud.

### 1. Request Device Verification Code

**Endpoint:** `POST /api/maxalla-contragents/device-verification/request-code`

**Description:** Qurilma tasdiqlash uchun SMS kod so'rash

**Authentication:** Required - None (Public)

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "device_unique_id",
  "deviceName": "iPhone 13",
  "deviceType": "mobile"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi",
  "data": {
    "phone": "+998901234567",
    "deviceId": "device_unique_id",
    "expiresIn": 600
  }
}
```

---

### 2. Verify Device

**Endpoint:** `POST /api/maxalla-contragents/device-verification/verify`

**Description:** SMS kod bilan qurilmani tasdiqlash

**Authentication:** Required - None (Public)

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "device_unique_id",
  "code": "12345",
  "deviceName": "iPhone 13"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "deviceId": "device_unique_id",
    "deviceName": "iPhone 13",
    "isPrimary": true,
    "isVerified": true
  }
}
```

---

### 3. Resend Device Verification Code

**Endpoint:** `POST /api/maxalla-contragents/device-verification/resend-code`

**Description:** Device verification kodni qayta yuborish

**Authentication:** Required - None (Public)

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "device_unique_id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "data": {
    "phone": "+998901234567",
    "deviceId": "device_unique_id",
    "expiresIn": 600
  }
}
```

---

## Yetkazib Beruvchilar CRUD

Maxalla Dokoni o'z yetkazib beruvchilarini boshqarishi mumkin. Har bir yetkazib beruvchi yaratilganda parol bilan yaratiladi.

### Yetkazib Beruvchi Yaratish

```
POST /api/maxalla-contragents/delivery-providers
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:**
```json
{
  "name": "Yetkazib Beruvchi Nomi",
  "phone": "+998901234567",
  "password": "secret123",
  "notes": "Qo'shimcha eslatmalar (ixtiyoriy)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yetkazib beruvchi muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yetkazib Beruvchi Nomi",
    "phone": "+998901234567",
    "contragent": "507f1f77bcf86cd799439010",
    "status": "active",
    "notes": "Qo'shimcha eslatmalar",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Muvaffaqiyatli yaratildi
- `400` - Validatsiya xatosi yoki telefon raqami allaqachon mavjud
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

**Validation Rules:**
- `name`: 2-200 belgi, required
- `phone`: To'g'ri telefon raqam formati, required, unique (contragent bo'yicha)
- `password`: Kamida 6 ta belgi, required
- `notes`: 1000 belgidan oshmasligi kerak, optional

**Eslatmalar:**
- Parol yaratilganda to'g'ridan-to'g'ri kiritilishi kerak
- Telefon raqami kontragent bo'yicha unique bo'lishi kerak
- Parol bcrypt bilan hash qilinadi
- Status default `active` bo'ladi

---

### Barcha Yetkazib Beruvchilarni Olish

```
GET /api/maxalla-contragents/delivery-providers
```

**Authentication:** Required (maxallaContragentAuth)

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Yetkazib Beruvchi Nomi",
      "phone": "+998901234567",
      "contragent": "507f1f77bcf86cd799439010",
      "status": "active",
      "notes": "Qo'shimcha eslatmalar",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)

**Eslatmalar:**
- Faqat o'z kontragentining yetkazib beruvchilari qaytariladi
- O'chirilgan yetkazib beruvchilar (`isDeleted: true`) qaytarilmaydi
- Natijalar yaratilgan vaqt bo'yicha teskari tartibda (eng yangisi birinchi)

---

### Yetkazib Beruvchini ID bo'yicha Olish

```
GET /api/maxalla-contragents/delivery-providers/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yetkazib Beruvchi Nomi",
    "phone": "+998901234567",
    "contragent": "507f1f77bcf86cd799439010",
    "status": "active",
    "notes": "Qo'shimcha eslatmalar",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri yetkazib beruvchi ID
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Yetkazib beruvchi topilmadi
- `500` - Server xatosi

**Eslatmalar:**
- Faqat o'z kontragentining yetkazib beruvchisini ko'rish mumkin

---

### Yetkazib Beruvchini Yangilash

```
PUT /api/maxalla-contragents/delivery-providers/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "name": "Yangilangan Nomi",
  "phone": "+998901234568",
  "password": "newpassword123",
  "status": "active",
  "notes": "Yangilangan eslatmalar"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yetkazib beruvchi yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yangilangan Nomi",
    "phone": "+998901234568",
    "status": "active",
    "notes": "Yangilangan eslatmalar",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### Yetkazib Beruvchini O'chirish

```
DELETE /api/maxalla-contragents/delivery-providers/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Response:**
```json
{
  "success": true,
  "message": "Yetkazib beruvchi o'chirildi"
}
```

**Eslatma:** Bu soft delete - ma'lumotlar bazadan to'liq o'chirilmaydi, faqat `isDeleted: true` bo'ladi.

**Status Codes:**
- `200` - Muvaffaqiyatli o'chirildi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Yetkazib beruvchi topilmadi
- `500` - Server xatosi

---

## Maxalla Maxsulotlari CRUD

Maxalla Dokoni asosiy maxsulotlarni tanlab, o'z narxi, miqdori va asl narxini kiritadi.

### Mavjud Asosiy Maxsulotlarni Olish

```
GET /api/maxalla-contragents/products/available
```

**Authentication:** Required (maxallaContragentAuth)

**Query Parameters:**
- `category` (optional): Filter by category ID
- `subcategory` (optional): Filter by subcategory ID
- `search` (optional): Search by name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Maxsulot Nomi",
      "description": "Maxsulot tavsifi",
      "images": ["..."],
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kategoriya Nomi",
        "slug": "kategoriya-nomi"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sub Kategoriya Nomi",
        "slug": "sub-kategoriya-nomi"
      },
      "unit": "dona",
      "unitSize": 1,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Eslatma:** Bu endpoint faqat hali qo'shilmagan asosiy maxsulotlarni qaytaradi.

---

### Maxalla Maxsulotini Yaratish

```
POST /api/maxalla-contragents/products
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:**
```json
{
  "baseProductId": "507f1f77bcf86cd799439013",
  "quantity": 100,
  "price": 15000,
  "originalPrice": 20000,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxalla maxsuloti muvaffaqiyatli yaratildi",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "baseProduct": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Maxsulot Nomi",
      "description": "Maxsulot tavsifi",
      "images": ["..."],
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kategoriya Nomi",
        "slug": "kategoriya-nomi"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sub Kategoriya Nomi",
        "slug": "sub-kategoriya-nomi"
      },
      "unit": "dona",
      "unitSize": 1
    },
    "contragent": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Maxalla Dokoni Nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "quantity": 100,
    "price": 15000,
    "originalPrice": 20000,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Muvaffaqiyatli yaratildi
- `400` - Validatsiya xatosi yoki maxsulot allaqachon qo'shilgan
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Asosiy maxsulot topilmadi yoki faol emas
- `500` - Server xatosi

---

### Barcha Maxalla Maxsulotlarini Olish

```
GET /api/maxalla-contragents/products
```

**Authentication:** Required (maxallaContragentAuth)

**Query Parameters:**
- `status` (optional): Filter by status (`active` or `inactive`)
- `category` (optional): Filter by category ID
- `subcategory` (optional): Filter by subcategory ID
- `search` (optional): Search by base product name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "baseProduct": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Maxsulot Nomi",
        "description": "Maxsulot tavsifi",
        "images": ["..."],
        "category": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Kategoriya Nomi",
          "slug": "kategoriya-nomi"
        },
        "subcategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Sub Kategoriya Nomi",
          "slug": "sub-kategoriya-nomi"
        },
        "unit": "dona",
        "unitSize": 1
      },
      "contragent": {
        "_id": "507f1f77bcf86cd799439010",
        "name": "Maxalla Dokoni Nomi",
        "inn": "123456789",
        "phone": "+998901234567"
      },
      "quantity": 100,
      "price": 15000,
      "originalPrice": 20000,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `500` - Server xatosi

---

### Maxalla Maxsulotini ID bo'yicha Olish

```
GET /api/maxalla-contragents/products/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "baseProduct": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Maxsulot Nomi",
      "description": "Maxsulot tavsifi",
      "images": ["..."],
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kategoriya Nomi",
        "slug": "kategoriya-nomi"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sub Kategoriya Nomi",
        "slug": "sub-kategoriya-nomi"
      },
      "unit": "dona",
      "unitSize": 1
    },
    "contragent": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Maxalla Dokoni Nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "quantity": 100,
    "price": 15000,
    "originalPrice": 20000,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Noto'g'ri maxalla maxsulot ID
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Maxalla maxsuloti topilmadi
- `500` - Server xatosi

---

### Maxalla Maxsulotini Yangilash

```
PUT /api/maxalla-contragents/products/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Request Body:** (Barcha maydonlar ixtiyoriy)
```json
{
  "quantity": 150,
  "price": 18000,
  "originalPrice": 22000,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maxalla maxsuloti yangilandi",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "baseProduct": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Maxsulot Nomi",
      "description": "Maxsulot tavsifi",
      "images": ["..."],
      "category": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Kategoriya Nomi",
        "slug": "kategoriya-nomi"
      },
      "subcategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sub Kategoriya Nomi",
        "slug": "sub-kategoriya-nomi"
      },
      "unit": "dona",
      "unitSize": 1
    },
    "contragent": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Maxalla Dokoni Nomi",
      "inn": "123456789",
      "phone": "+998901234567"
    },
    "quantity": 150,
    "price": 18000,
    "originalPrice": 22000,
    "status": "active",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli yangilandi
- `400` - Validatsiya xatosi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Maxalla maxsuloti topilmadi
- `500` - Server xatosi

---

### Maxalla Maxsulotini O'chirish

```
DELETE /api/maxalla-contragents/products/:id
```

**Authentication:** Required (maxallaContragentAuth)

**Response:**
```json
{
  "success": true,
  "message": "Maxalla maxsuloti o'chirildi"
}
```

**Status Codes:**
- `200` - Muvaffaqiyatli o'chirildi
- `403` - Bu funksiya faqat Maxalla kontragentlar uchun
- `404` - Maxalla maxsuloti topilmadi
- `500` - Server xatosi

---

## Ma'lumotlar Strukturasi

### Maxalla Dokoni Ob'ekti

```typescript
interface MaxallaDokoni {
  _id: string;                    // ObjectId
  name: string;                   // 2-200 belgi
  inn: string;                    // 9 yoki 12 raqam (unique)
  phone: string;                  // Telefon raqami (unique)
  logo: string | null;            // Base64 format
  viloyat: Region;                // Viloyat ob'ekti
  tuman: Region;                  // Tuman ob'ekti
  mfy: Region;                    // MFY ob'ekti
  activityType: ContragentType;   // Faoliyat turi
  contragentLevel: "mfy";         // Kontragent darajasi (faqat "mfy")
  workingHours: {                  // Ish vaqti
    open: string | null;          // Ochilish vaqti (HH:MM)
    close: string | null;         // Yopilish vaqti (HH:MM)
  };
  serviceAreas: {                  // Xizmat ko'rsatish hududlari
    tuman: ObjectId | null;       // Xizmat ko'rsatish tumani
    mfys: ObjectId[];             // Xizmat ko'rsatish MFYlari
  };
  status: "active" | "inactive";  // Status
  createdAt: Date;                 // Yaratilgan sana
  updatedAt: Date;                 // Yangilangan sana
}
```

### Working Hours Ob'ekti

```typescript
interface WorkingHours {
  open: string | null;    // Ochilish vaqti (HH:MM format, masalan: "09:00")
  close: string | null;  // Yopilish vaqti (HH:MM format, masalan: "18:00")
}
```

### Service Areas Ob'ekti

```typescript
interface ServiceAreas {
  tuman: ObjectId | null;  // Xizmat ko'rsatish tumani ID
  mfys: ObjectId[];        // Xizmat ko'rsatish MFYlari IDlari array
}
```

### Delivery Provider Ob'ekti

```typescript
interface DeliveryProvider {
  _id: string;                    // ObjectId
  name: string;                   // 2-200 belgi
  phone: string;                  // Telefon raqami (contragent bo'yicha unique)
  password: string;               // Hash qilingan parol (select: false, required)
  contragent: ObjectId;          // Maxalla kontragent ID
  status: "active" | "inactive"; // Status
  notes: string | null;          // Eslatmalar (max 1000 belgi)
  isDeleted: boolean;            // Soft delete flag
  deletedAt: Date | null;        // O'chirilgan vaqt
  createdAt: Date;               // Yaratilgan sana
  updatedAt: Date;               // Yangilangan sana
}
```

### MaxallaProduct Ob'ekti

```typescript
interface MaxallaProduct {
  _id: string;                    // ObjectId
  baseProduct: BaseProduct;      // Asosiy maxsulot ob'ekti
  contragent: Contragent;        // Maxalla kontragent ob'ekti
  quantity: number;              // Miqdor (min: 0)
  price: number;                 // Narx (min: 0)
  originalPrice: number;          // Asl narx (min: 0)
  status: "active" | "inactive"; // Status
  createdAt: Date;               // Yaratilgan sana
  updatedAt: Date;               // Yangilangan sana
}
```

---

## Xato Kodlari

| Kod | Xabar | Tavsif |
|-----|-------|--------|
| 200 | OK | Muvaffaqiyatli so'rov |
| 400 | Bad Request | Validatsiya xatosi yoki noto'g'ri so'rov |
| 401 | Unauthorized | Autentifikatsiya talab qilinadi yoki token noto'g'ri |
| 403 | Forbidden | Bu funksiya faqat Maxalla kontragentlar uchun, hisob faol emas |
| 404 | Not Found | Maxalla kontragent topilmadi |
| 500 | Internal Server Error | Server xatosi |

---

## Validatsiya Qoidalari

### Ish Vaqti
- Format: `HH:MM` (24 soatlik format)
- Masalan: "09:00", "18:30", "23:59"
- `open` va `close` ixtiyoriy, lekin kamida bittasi kiritilishi kerak

### Xizmat Ko'rsatish Hududlari
- `tuman`: Tuman ID, kontragentning viloyatiga tegishli bo'lishi kerak
- `mfys`: Array, kamida 1 ta MFY ID
- Har bir MFY `tuman`ga tegishli bo'lishi kerak

### Telefon Raqami
- To'g'ri telefon raqam formati
- Unique bo'lishi kerak (Maxalla kontragent uchun)
- Yetkazib beruvchi uchun: kontragent bo'yicha unique

### INN
- 9 yoki 12 ta raqamdan iborat bo'lishi kerak
- Unique bo'lishi kerak

### Yetkazib Beruvchi
- `name`: 2-200 belgi, required
- `phone`: To'g'ri telefon raqam formati, required, unique (contragent bo'yicha)
- `notes`: 1000 belgidan oshmasligi kerak, optional
- `status`: `active` yoki `inactive`, default: `active`
- Parol: kamida 6 ta belgidan iborat bo'lishi kerak

---

## Misollar

### Profilni Yangilash

```bash
curl -X PUT https://api.example.com/api/maxalla-contragents/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Updated Maxalla Dokoni",
    "phone": "+998901234568"
  }'
```

### Ish Vaqtini Yangilash

```bash
curl -X PATCH https://api.example.com/api/maxalla-contragents/me/working-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "open": "09:00",
    "close": "18:00"
  }'
```

### Xizmat Ko'rsatish Hududlarini Yangilash

```bash
curl -X PATCH https://api.example.com/api/maxalla-contragents/me/service-areas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "tuman": "507f1f77bcf86cd799439013",
    "mfys": [
      "507f1f77bcf86cd799439014",
      "507f1f77bcf86cd799439016"
    ]
  }'
```

### Logout

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -H "x-device-id: device_unique_id"
```

### Yetkazib Beruvchi Yaratish

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/delivery-providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "Yetkazib Beruvchi Nomi",
    "phone": "+998901234567",
    "notes": "Qo'shimcha eslatmalar"
  }'
```


### JavaScript/Fetch Misollari

```javascript
// Profilni olish
const getMyProfile = async (token) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Profilni yangilash
const updateMyProfile = async (token, profileData) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  return await response.json();
};

// Ish vaqtini yangilash
const updateWorkingHours = async (token, workingHours) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/me/working-hours', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workingHours)
  });

  return await response.json();
};

// Xizmat ko'rsatish hududlarini yangilash
const updateServiceAreas = async (token, serviceAreas) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/me/service-areas', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceAreas)
  });

  return await response.json();
};

// Logout
const logout = async (token, deviceId) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-device-id': deviceId || ''
    }
  });

  const data = await response.json();
  
  if (data.success) {
    // Frontend'da token ni o'chirish
    localStorage.removeItem('token');
    localStorage.removeItem('contragent');
    localStorage.removeItem('deviceId');
  }

  return data;
};

// Yetkazib beruvchi yaratish
const createDeliveryProvider = async (token, providerData) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/delivery-providers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(providerData)
  });

  return await response.json();
};

// Barcha yetkazib beruvchilarni olish
const getAllDeliveryProviders = async (token, status) => {
  const url = status 
    ? `https://api.example.com/api/maxalla-contragents/delivery-providers?status=${status}`
    : 'https://api.example.com/api/maxalla-contragents/delivery-providers';
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Yetkazib beruvchini yangilash
const updateDeliveryProvider = async (token, providerId, updateData) => {
  const response = await fetch(`https://api.example.com/api/maxalla-contragents/delivery-providers/${providerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  return await response.json();
};

// Mavjud asosiy maxsulotlarni olish
const getAvailableBaseProducts = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`https://api.example.com/api/maxalla-contragents/products/available?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Maxalla maxsulotini yaratish
const createMaxallaProduct = async (token, productData) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await response.json();
};

// Barcha maxalla maxsulotlarini olish
const getAllMaxallaProducts = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`https://api.example.com/api/maxalla-contragents/products?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};

// Maxalla maxsulotini yangilash
const updateMaxallaProduct = async (token, productId, updateData) => {
  const response = await fetch(`https://api.example.com/api/maxalla-contragents/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  return await response.json();
};

// Maxalla maxsulotini o'chirish
const deleteMaxallaProduct = async (token, productId) => {
  const response = await fetch(`https://api.example.com/api/maxalla-contragents/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
};
```

---

## Qo'shimcha Ma'lumotlar

- **Tuman Kontragent API:** [Contragent API Documentation](./CONTRAGENT_API.md)
- **Maxalla Kontragent Auth API:** [Maxalla Contragent API Documentation](./MAXALLA_CONTRAGENT_API.md)
- **Umumiy API:** [API Documentation](./API.md)

---

**Dokumentatsiya versiyasi:** 1.0  
**Yaratilgan sana:** 2024  
**Yangilangan sana:** 2024
