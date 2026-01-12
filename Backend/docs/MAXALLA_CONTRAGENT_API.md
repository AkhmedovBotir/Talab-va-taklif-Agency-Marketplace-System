# Maxalla Kontragent API Dokumentatsiyasi

Bu dokumentatsiya Maxalla Kontragentlar uchun autentifikatsiya va login API spetsifikatsiyasini o'z ichiga oladi.

**Base Path:** `/api/maxalla-contragents`

**Eslatma:** Bu API faqat `contragentLevel: 'mfy'` (Maxalla) kontragentlar uchun ishlaydi. Tuman kontragentlar uchun `/api/contragents` API dan foydalaning.

---

## Munda

1. [Kirish](#kirish)
2. [Autentifikatsiya](#autentifikatsiya)
3. [API Endpointlari](#api-endpointlari)
4. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
5. [Xato Kodlari](#xato-kodlari)
6. [Misollar](#misollar)

---

## Kirish

Maxalla Kontragent API - bu faqat Maxalla darajasidagi kontragentlar uchun alohida autentifikatsiya va login funksiyalarini ta'minlaydi.

**Maxalla Kontragent nima?**
- Maxalla (MFY) darajasida ishlaydigan kontragentlar
- Faqat o'z MFYsi bo'yicha buyurtmalarni qabul qiladi
- `contragentLevel: 'mfy'` maydoni bilan belgilanadi

**Tuman Kontragent vs Maxalla Kontragent:**
- **Tuman Kontragent** (`contragentLevel: 'tuman'`): `/api/contragents` API dan foydalanadi
- **Maxalla Kontragent** (`contragentLevel: 'mfy'`): `/api/maxalla-contragents` API dan foydalanadi (bu dokumentatsiya)

---

## Autentifikatsiya

### Parol O'rnatish (3 bosqich)

Yangi maxalla kontragentlar uchun parol o'rnatish 3 bosqichdan iborat:

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

**Status Codes:**
- `200` - Muvaffaqiyatli
- `404` - Maxalla kontragent topilmadi
- `400` - Parol allaqachon o'rnatilgan
- `403` - Hisob faol emas
- `500` - Server xatosi

**Eslatmalar:**
- Faqat `contragentLevel: 'mfy'` bo'lgan kontragentlar uchun ishlaydi
- Kontragent `passwordSetupAllowed: true` bo'lishi kerak
- SMS kod 5 daqiqa muddatiga yuboriladi

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

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - Kod noto'g'ri yoki muddati tugagan
- `404` - Maxalla kontragent topilmadi
- `500` - Server xatosi

**Eslatmalar:**
- Kod 5 daqiqa ichida ishlatilishi kerak
- Faqat `contragentLevel: 'mfy'` bo'lgan kontragentlar uchun ishlaydi

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

**Status Codes:**
- `200` - Muvaffaqiyatli
- `400` - SMS kod tasdiqlanmagan yoki parol qisqa
- `404` - Maxalla kontragent topilmadi
- `500` - Server xatosi

**Validation:**
- `newPassword` kamida 6 ta belgidan iborat bo'lishi kerak
- Avval SMS kodni tasdiqlashingiz kerak (Step 2)
- Parol o'rnatilgandan keyin `passwordSetupAllowed: false` bo'ladi

---

### Login

#### Maxalla Kontragent Login

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
      "name": "ABC Maxalla Company",
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
- `200` - Muvaffaqiyatli kirildi
- `400` - Qurilma ID topilmadi
- `401` - Telefon raqami yoki parol noto'g'ri
- `403` - Qurilma tasdiqlash kerak yoki hisob faol emas
- `500` - Server xatosi

**Eslatmalar:**
- Faqat `contragentLevel: 'mfy'` bo'lgan kontragentlar uchun ishlaydi
- `x-device-id` header talab qilinadi
- Device verification bilan ishlaydi (qurilma tasdiqlash kerak bo'lishi mumkin)
- JWT token 24 soatga amal qiladi
- Token ichida `contragentLevel: 'mfy'` maydoni mavjud

**Device Verification:**
- Agar qurilma birinchi marta ishlatilayotgan bo'lsa va boshqa faol qurilmalar bo'lsa, device verification talab qilinadi
- Agar qurilma nofaol bo'lsa, login rad etiladi
- Agar qurilma birinchi va yagona qurilma bo'lsa, avtomatik aktivlashtiriladi

**Device Verification Xatosi (403):**
```json
{
  "success": false,
  "message": "Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak",
  "requiresDeviceVerification": true,
  "data": {
    "phone": "+998901234567",
    "deviceId": "device_unique_id"
  }
}
```

Bu holatda `/api/maxalla-contragents/device-verification` API dan foydalanib qurilmani tasdiqlashingiz kerak.

---

## API Endpointlari

### 1. Password Setup Step 1

**Endpoint:** `POST /api/maxalla-contragents/password-setup/step1`

**Description:** Parol o'rnatish uchun SMS kod so'rash

**Authentication:** Required - None (Public)

**Request:**
```json
{
  "phone": "+998901234567"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi"
}
```

**Error Responses:**
- `404` - Maxalla kontragent topilmadi
- `400` - Parol allaqachon o'rnatilgan
- `403` - Hisob faol emas

---

### 2. Password Setup Step 2

**Endpoint:** `POST /api/maxalla-contragents/password-setup/step2`

**Description:** SMS kodni tasdiqlash

**Authentication:** Required - None (Public)

**Request:**
```json
{
  "phone": "+998901234567",
  "code": "12345"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Kod muvaffaqiyatli tasdiqlandi. Endi parol o'rnatishingiz mumkin"
}
```

**Error Responses:**
- `400` - Kod noto'g'ri yoki muddati tugagan
- `404` - Maxalla kontragent topilmadi

---

### 3. Password Setup Step 3

**Endpoint:** `POST /api/maxalla-contragents/password-setup/step3`

**Description:** Parol o'rnatish

**Authentication:** Required - None (Public)

**Request:**
```json
{
  "phone": "+998901234567",
  "newPassword": "secret123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'rnatildi"
}
```

**Error Responses:**
- `400` - SMS kod tasdiqlanmagan yoki parol qisqa (min: 6)
- `404` - Maxalla kontragent topilmadi

---

### 4. Login

**Endpoint:** `POST /api/maxalla-contragents/login`

**Note:** Agar login paytida device verification talab qilinsa, avval device verification qiling va keyin login qiling.

**Description:** Maxalla kontragent login

**Authentication:** Required - None (Public, but device verification may be required)

**Request:**
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
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "contragent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC Maxalla Company",
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

**Error Responses:**
- `400` - Qurilma ID topilmadi
- `401` - Telefon raqami yoki parol noto'g'ri
- `403` - Qurilma tasdiqlash kerak yoki qurilma nofaol
- `500` - Server xatosi

**Device Verification Required (403):**
```json
{
  "success": false,
  "message": "Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak",
  "requiresDeviceVerification": true,
  "data": {
    "phone": "+998901234567",
    "deviceId": "device_unique_id"
  }
}
```

---

## Ma'lumotlar Strukturasi

### Maxalla Kontragent Ob'ekti

```typescript
interface MaxallaContragent {
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
  status: "active" | "inactive";  // Status
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
}
```

### ContragentType Ob'ekti

```typescript
interface ContragentType {
  _id: string;                    // ObjectId
  name: string;                   // Nom
  icon: string;                   // Icon
}
```

### JWT Token Payload

```typescript
interface JWTTokenPayload {
  id: string;                     // Kontragent ID
  phone: string;                  // Telefon raqami
  inn: string;                    // INN
  type: "contragent";             // User type
  contragentLevel: "mfy";         // Kontragent darajasi
  deviceId: string;               // Qurilma ID
  iat: number;                    // Token yaratilgan vaqt
  exp: number;                    // Token muddati
}
```

---

## Xato Kodlari

| Kod | Xabar | Tavsif |
|-----|-------|--------|
| 200 | OK | Muvaffaqiyatli so'rov |
| 400 | Bad Request | Validatsiya xatosi yoki noto'g'ri so'rov (qurilma ID topilmadi, kod noto'g'ri, parol qisqa) |
| 401 | Unauthorized | Telefon raqami yoki parol noto'g'ri |
| 403 | Forbidden | Hisob faol emas, qurilma tasdiqlash kerak, qurilma nofaol |
| 404 | Not Found | Maxalla kontragent topilmadi |
| 500 | Internal Server Error | Server xatosi |

---

## Validatsiya Qoidalari

### Telefon Raqami
- To'g'ri telefon raqam formati
- Unique bo'lishi kerak
- Required

### Parol
- Kamida 6 ta belgi
- Required (login uchun)

### SMS Kod
- 5 ta raqamdan iborat
- 5 daqiqa muddatida amal qiladi
- Bir marta ishlatiladi

### Qurilma ID
- Required (login uchun)
- Header orqali yuboriladi: `x-device-id`

---

## Misollar

### Parol O'rnatish (3 bosqich)

#### Bosqich 1: SMS Kod So'rash

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/password-setup/step1 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567"
  }'
```

#### Bosqich 2: SMS Kodni Tasdiqlash

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/password-setup/step2 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "code": "12345"
  }'
```

#### Bosqich 3: Parol O'rnatish

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/password-setup/step3 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "newPassword": "secret123"
  }'
```

### Login

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/login \
  -H "Content-Type: application/json" \
  -H "x-device-id: device_unique_id" \
  -H "x-device-name: iPhone 13" \
  -H "x-device-type: mobile" \
  -d '{
    "phone": "+998901234567",
    "password": "secret123"
  }'
```

### Device Verification

#### Request Code

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/device-verification/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "device_unique_id",
    "deviceName": "iPhone 13",
    "deviceType": "mobile"
  }'
```

#### Verify Device

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/device-verification/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "device_unique_id",
    "code": "12345",
    "deviceName": "iPhone 13"
  }'
```

#### Resend Code

```bash
curl -X POST https://api.example.com/api/maxalla-contragents/device-verification/resend-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "device_unique_id"
  }'
```

### JavaScript/Fetch Misoli

```javascript
// Login
const loginMaxallaContragent = async (phone, password, deviceId) => {
  try {
    const response = await fetch('https://api.example.com/api/maxalla-contragents/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-device-name': 'iPhone 13',
        'x-device-type': 'mobile'
      },
      body: JSON.stringify({
        phone,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      // Token ni saqlash
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('contragent', JSON.stringify(data.data.contragent));
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Parol o'rnatish (Step 1)
const requestPasswordSetupCode = async (phone) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/password-setup/step1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  });

  return await response.json();
};

// Parol o'rnatish (Step 2)
const verifyPasswordSetupCode = async (phone, code) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/password-setup/step2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, code })
  });

  return await response.json();
};

// Parol o'rnatish (Step 3)
const setPassword = async (phone, newPassword) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/password-setup/step3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, newPassword })
  });

  return await response.json();
};

// Device Verification - Request Code
const requestDeviceVerificationCode = async (phone, deviceId, deviceInfo = {}) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/device-verification/request-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone,
      deviceId,
      ...deviceInfo
    })
  });

  return await response.json();
};

// Device Verification - Verify Device
const verifyDevice = async (phone, deviceId, code, deviceInfo = {}) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/device-verification/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone,
      deviceId,
      code,
      ...deviceInfo
    })
  });

  return await response.json();
};

// Device Verification - Resend Code
const resendDeviceVerificationCode = async (phone, deviceId) => {
  const response = await fetch('https://api.example.com/api/maxalla-contragents/device-verification/resend-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, deviceId })
  });

  return await response.json();
};
```

---

## Tuman Kontragent vs Maxalla Kontragent

### Tuman Kontragent

**Base Path:** `/api/contragents`

**Contragent Level:** `contragentLevel: 'tuman'`

**Login Endpoint:** `POST /api/contragents/login`

**Funksiyalar:**
- Tuman darajasida ishlaydi
- Barcha tuman bo'yicha buyurtmalarni qabul qiladi
- CRUD operatsiyalari mavjud

### Maxalla Kontragent

**Base Path:** `/api/maxalla-contragents`

**Contragent Level:** `contragentLevel: 'mfy'`

**Login Endpoint:** `POST /api/maxalla-contragents/login`

**Funksiyalar:**
- MFY darajasida ishlaydi
- Faqat o'z MFYsi bo'yicha buyurtmalarni qabul qiladi
- Autentifikatsiya, login va device verification mavjud

---

## Device Verification

Maxalla kontragentlar uchun alohida device verification API mavjud. Login paytida qurilma tasdiqlash talab qilinishi mumkin.

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
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 17.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": "Toshkent"
}
```

**Required Fields:**
- `phone` (required): Maxalla kontragent telefon raqami
- `deviceId` (required): Qurilma unique ID

**Optional Fields:**
- `deviceName`, `deviceType`, `platform`, `os`, `browser`, `ipAddress`, `userAgent`, `location`

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

**Error Responses:**
- `400` - Qurilma ID yoki telefon raqami topilmadi
- `404` - Maxalla kontragent topilmadi yoki faol emas
- `429` - SMS kod yaqinda yuborilgan (30 soniyadan kam)
- `500` - Server xatosi

**Eslatmalar:**
- SMS kod 10 daqiqa muddatiga yuboriladi
- 30 soniya ichida qayta so'rash mumkin emas
- Agar qurilma allaqachon tasdiqlangan bo'lsa, xabar qaytariladi

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
  "deviceName": "iPhone 13",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 17.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": "Toshkent"
}
```

**Required Fields:**
- `phone` (required): Maxalla kontragent telefon raqami
- `deviceId` (required): Qurilma unique ID
- `code` (required): SMS kod (5 raqam)

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

**Error Responses:**
- `400` - Kod noto'g'ri yoki muddati tugagan, yoki required fieldlar topilmadi
- `404` - Maxalla kontragent topilmadi yoki faol emas
- `500` - Server xatosi

**Eslatmalar:**
- Kod 10 daqiqa ichida ishlatilishi kerak
- Birinchi qurilma avtomatik `isPrimary: true` bo'ladi
- Qurilma tasdiqlanganidan keyin login qilish mumkin

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

**Required Fields:**
- `phone` (required): Maxalla kontragent telefon raqami
- `deviceId` (required): Qurilma unique ID

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

**Error Responses:**
- `400` - Qurilma ID yoki telefon raqami topilmadi
- `404` - Maxalla kontragent topilmadi yoki faol emas
- `429` - SMS kod yaqinda yuborilgan (30 soniyadan kam)
- `500` - Server xatosi

**Eslatmalar:**
- 30 soniya ichida qayta so'rash mumkin emas
- Agar qurilma allaqachon tasdiqlangan bo'lsa, xabar qaytariladi

---

### Login'dan keyin Device Verification

Agar login paytida device verification talab qilinsa, quyidagi xatolik qaytariladi:

```json
{
  "success": false,
  "message": "Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak",
  "requiresDeviceVerification": true,
  "data": {
    "phone": "+998901234567",
    "deviceId": "device_unique_id"
  }
}
```

Bu holatda:
1. Avval `/api/maxalla-contragents/device-verification/request-code` endpointiga so'rov yuboring
2. SMS kodni oling
3. `/api/maxalla-contragents/device-verification/verify` endpointiga kod bilan so'rov yuboring
4. Qurilma tasdiqlanganidan keyin login qilish mumkin

---

## Qo'shimcha Ma'lumotlar

- **Tuman Kontragent API:** [Contragent API Documentation](./CONTRAGENT_API.md)
- **Umumiy API:** [API Documentation](./API.md)
- **Tuman Kontragent Device Verification:** `/api/device-verification/contragent/*`
- **Maxalla Kontragent Device Verification:** `/api/maxalla-contragents/device-verification/*` (bu dokumentatsiya)

---

**Dokumentatsiya versiyasi:** 1.0  
**Yaratilgan sana:** 2024  
**Yangilangan sana:** 2024
