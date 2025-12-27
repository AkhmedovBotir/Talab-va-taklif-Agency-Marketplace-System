# Device Verification API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Punkt uchun](#punkt-uchun)
    - [1. Request Device Verification Code](#1-request-device-verification-code-punkt)
    - [2. Verify Device](#2-verify-device-punkt)
    - [3. Resend Verification Code](#3-resend-verification-code-punkt)
  - [Admin uchun](#admin-uchun)
    - [1. Request Device Verification Code](#1-request-device-verification-code-admin)
    - [2. Verify Device](#2-verify-device-admin)
    - [3. Resend Verification Code](#3-resend-verification-code-admin)
  - [Contragent uchun](#contragent-uchun)
    - [1. Request Device Verification Code](#1-request-device-verification-code-contragent)
    - [2. Verify Device](#2-verify-device-contragent)
    - [3. Resend Verification Code](#3-resend-verification-code-contragent)
  - [Agent uchun](#agent-uchun)
    - [1. Request Device Verification Code](#1-request-device-verification-code-agent)
    - [2. Verify Device](#2-verify-device-agent)
    - [3. Resend Verification Code](#3-resend-verification-code-agent)
- [Admin Device Management](#admin-device-management)
- [Workflow](#workflow)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

Device Verification API har bir foydalanuvchi (Punkt, Admin, Contragent, Agent) uchun faqat bitta qurilma bilan login qilishni ta'minlaydi. Agar foydalanuvchi boshqa qurilmadan kirishga harakat qilsa, SMS kod orqali qurilmani tasdiqlash kerak bo'ladi.

**Asosiy Xususiyatlar:**
- Har bir foydalanuvchi uchun faqat bitta faol qurilma
- Yangi qurilma aniqlandi: SMS kod orqali tasdiqlash
- Login jarayonida avtomatik qurilma tekshiruvi
- SMS kod 5 daqiqa amal qiladi
- SMS kodni qayta yuborish imkoniyati

**Base Path:** `/api/device-verification`

---

## Base URL

```
http://localhost:5000/api/device-verification
```

---

## Authentication

- **Device Verification Endpoints:** No authentication required (public endpoints)
- **Admin Device Management Endpoints:** Require Admin JWT token

---

## Data Models

### Device Object

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "user": "507f1f77bcf86cd799439012",
  "userModel": "Punkt",
  "deviceId": "unique-device-id-12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "isActive": true,
  "isPrimary": true,
  "lastLoginAt": "2024-01-15T10:30:00.000Z",
  "lastActivityAt": "2024-01-15T10:30:00.000Z",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent",
    "latitude": 41.2995,
    "longitude": 69.2401
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Device Verification Request

```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent",
    "latitude": 41.2995,
    "longitude": 69.2401
  }
}
```

### Device Verification Response

```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "iPhone 13 Pro",
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "isNew": true
  }
}
```

---

## Endpoints

### Punkt uchun

#### 1. Request Device Verification Code (Punkt)

Qurilma tasdiqlash kodi so'rash.

**Endpoint:** `POST /api/device-verification/punkt/request-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Punkt telefon raqami
- `deviceId` (string, required): Qurilma ID (unique)

**Optional Fields:**
- `deviceName` (string): Qurilma nomi
- `deviceType` (string, enum: 'mobile', 'tablet', 'desktop', 'web', 'unknown'): Qurilma turi
- `platform` (string): Platforma (iOS, Android, Windows, etc.)
- `os` (string): Operatsion tizim
- `browser` (string): Brauzer
- `ipAddress` (string): IP manzil
- `userAgent` (string): User agent
- `location` (object): Joylashuv ma'lumotlari

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

---

#### 2. Verify Device (Punkt)

SMS kod bilan qurilmani tasdiqlash.

**Endpoint:** `POST /api/device-verification/punkt/verify`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "code": "12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Punkt telefon raqami
- `deviceId` (string, required): Qurilma ID
- `code` (string, required): SMS kod (5 raqam)

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "iPhone 13 Pro",
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "isNew": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Noto'g'ri kod yoki kod muddati tugagan"
}
```

---

#### 3. Resend Verification Code (Punkt)

Tasdiqlash kodini qayta yuborish.

**Endpoint:** `POST /api/device-verification/punkt/resend-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345"
}
```

**Required Fields:**
- `phone` (string, required): Punkt telefon raqami
- `deviceId` (string, required): Qurilma ID

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Admin uchun

#### 1. Request Device Verification Code (Admin)

Qurilma tasdiqlash kodi so'rash (Admin telefon raqami orqali).

**Endpoint:** `POST /api/device-verification/admin/request-code`

**Request Body:**
```json
{
  "username": "admin",
  "deviceId": "unique-device-id-12345",
  "deviceName": "MacBook Pro",
  "deviceType": "desktop",
  "platform": "macOS",
  "os": "macOS 13.0",
  "browser": "Chrome",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Alternative Request Body (with phone or adminId):**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345"
}
```

yoki

```json
{
  "adminId": "507f1f77bcf86cd799439012",
  "deviceId": "unique-device-id-12345"
}
```

**Required Fields (Admin uchun):**
- `deviceId` (string, required): Qurilma ID
- `username` (string, required) YOKI `adminId` (string, required) YOKI `phone` (string, required): Admin username, ID yoki telefon raqami

**Note:** Admin login username bilan davom etadi, lekin qurilma tasdiqlash admin profilidagi telefon raqami orqali amalga oshiriladi. Admin uchun `username`, `adminId` yoki `phone` dan birini yuborish kifoya.

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

#### 2. Verify Device (Admin)

SMS kod bilan qurilmani tasdiqlash.

**Endpoint:** `POST /api/device-verification/admin/verify`

**Request Body:**
```json
{
  "username": "admin",
  "deviceId": "unique-device-id-12345",
  "code": "12345",
  "deviceName": "MacBook Pro",
  "deviceType": "desktop",
  "platform": "macOS",
  "os": "macOS 13.0",
  "browser": "Chrome",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields (Admin uchun):**
- `deviceId` (string, required): Qurilma ID
- `code` (string, required): SMS kod (5 raqam)
- `username` (string, required) YOKI `adminId` (string, required) YOKI `phone` (string, required): Admin username, ID yoki telefon raqami

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "MacBook Pro",
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "isNew": true
  }
}
```

---

#### 3. Resend Verification Code (Admin)

Tasdiqlash kodini qayta yuborish.

**Endpoint:** `POST /api/device-verification/admin/resend-code`

**Request Body:**
```json
{
  "username": "admin",
  "deviceId": "unique-device-id-12345"
}
```

**Alternative Request Body:**
```json
{
  "adminId": "507f1f77bcf86cd799439012",
  "deviceId": "unique-device-id-12345"
}
```

yoki

```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345"
}
```

**Required Fields (Admin uchun):**
- `deviceId` (string, required): Qurilma ID
- `username` (string, required) YOKI `adminId` (string, required) YOKI `phone` (string, required): Admin username, ID yoki telefon raqami

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Contragent uchun

#### 1. Request Device Verification Code (Contragent)

Qurilma tasdiqlash kodi so'rash.

**Endpoint:** `POST /api/device-verification/contragent/request-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Contragent telefon raqami
- `deviceId` (string, required): Qurilma ID (unique)

**Optional Fields:**
- `deviceName` (string): Qurilma nomi
- `deviceType` (string, enum: 'mobile', 'tablet', 'desktop', 'web', 'unknown'): Qurilma turi
- `platform` (string): Platforma (iOS, Android, Windows, etc.)
- `os` (string): Operatsion tizim
- `browser` (string): Brauzer
- `ipAddress` (string): IP manzil
- `userAgent` (string): User agent
- `location` (object): Joylashuv ma'lumotlari

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi yoki faol emas"
}
```

---

#### 2. Verify Device (Contragent)

SMS kod bilan qurilmani tasdiqlash.

**Endpoint:** `POST /api/device-verification/contragent/verify`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "code": "12345",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "mobile",
  "platform": "iOS",
  "os": "iOS 15.0",
  "browser": "Safari",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Contragent telefon raqami
- `deviceId` (string, required): Qurilma ID
- `code` (string, required): SMS kod (5 raqam)

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "iPhone 13 Pro",
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "isNew": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Noto'g'ri kod yoki kod muddati tugagan"
}
```

---

#### 3. Resend Verification Code (Contragent)

Tasdiqlash kodini qayta yuborish.

**Endpoint:** `POST /api/device-verification/contragent/resend-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345"
}
```

**Required Fields:**
- `phone` (string, required): Contragent telefon raqami
- `deviceId` (string, required): Qurilma ID

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Agent uchun

#### 1. Request Device Verification Code (Agent)

Qurilma tasdiqlash kodi so'rash.

**Endpoint:** `POST /api/device-verification/agent/request-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "deviceName": "Samsung Galaxy S21",
  "deviceType": "mobile",
  "platform": "Android",
  "os": "Android 12",
  "browser": "Chrome",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Agent telefon raqami
- `deviceId` (string, required): Qurilma ID (unique)

**Optional Fields:**
- `deviceName` (string): Qurilma nomi
- `deviceType` (string, enum: 'mobile', 'tablet', 'desktop', 'web', 'unknown'): Qurilma turi
- `platform` (string): Platforma (iOS, Android, Windows, etc.)
- `os` (string): Operatsion tizim
- `browser` (string): Brauzer
- `ipAddress` (string): IP manzil
- `userAgent` (string): User agent
- `location` (object): Joylashuv ma'lumotlari

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi yoki faol emas"
}
```

---

#### 2. Verify Device (Agent)

SMS kod bilan qurilmani tasdiqlash.

**Endpoint:** `POST /api/device-verification/agent/verify`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345",
  "code": "12345",
  "deviceName": "Samsung Galaxy S21",
  "deviceType": "mobile",
  "platform": "Android",
  "os": "Android 12",
  "browser": "Chrome",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "location": {
    "country": "Uzbekistan",
    "city": "Tashkent"
  }
}
```

**Required Fields:**
- `phone` (string, required): Agent telefon raqami
- `deviceId` (string, required): Qurilma ID
- `code` (string, required): SMS kod (5 raqam)

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli tasdiqlandi",
  "data": {
    "device": {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "Samsung Galaxy S21",
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "isNew": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Noto'g'ri kod yoki kod muddati tugagan"
}
```

---

#### 3. Resend Verification Code (Agent)

Tasdiqlash kodini qayta yuborish.

**Endpoint:** `POST /api/device-verification/agent/resend-code`

**Request Body:**
```json
{
  "phone": "+998901234567",
  "deviceId": "unique-device-id-12345"
}
```

**Required Fields:**
- `phone` (string, required): Agent telefon raqami
- `deviceId` (string, required): Qurilma ID

**Response:**
```json
{
  "success": true,
  "message": "Tasdiqlash kodi qayta yuborildi",
  "data": {
    "phone": "+998 90 123 45 67",
    "expiresAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## Admin Device Management

**Note:** Bu endpointlar Admin tomonidan barcha foydalanuvchi turlari (Admin, Contragent, Punkt, Agent) uchun qurilmalarni boshqarish uchun ishlatiladi.

### Get All Devices

Barcha qurilmalarni olish (Admin). Contragent, Punkt, Agent va Admin qurilmalarini ko'rish mumkin.

**Endpoint:** `GET /api/admins/devices`

**Query Parameters:**
- `userModel` (optional): Foydalanuvchi modeli ('Admin', 'Contragent', 'Punkt', 'Agent')
- `userId` (optional): Foydalanuvchi ID
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 50): Har bir sahifadagi elementlar soni

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Botir",
        "phone": "+998901234567"
      },
      "userModel": "Punkt",
      "deviceId": "unique-device-id-12345",
      "deviceName": "iPhone 13 Pro",
      "isActive": true,
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z",
      "lastActivityAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get Device by ID

Qurilma ma'lumotlarini ID bo'yicha olish (Admin).

**Endpoint:** `GET /api/admins/devices/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Botir",
      "phone": "+998901234567"
    },
    "userModel": "Punkt",
    "deviceId": "unique-device-id-12345",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "mobile",
    "platform": "iOS",
    "os": "iOS 15.0",
    "browser": "Safari",
    "ipAddress": "192.168.1.1",
    "isActive": true,
    "isPrimary": true,
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastActivityAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get User's Devices

Foydalanuvchi qurilmalarini olish (Admin).

**Endpoint:** `GET /api/admins/devices/user/:userModel/:userId`

**Path Parameters:**
- `userModel`: Foydalanuvchi modeli ('Admin', 'Contragent', 'Punkt', 'Agent')
- `userId`: Foydalanuvchi ID

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "deviceId": "unique-device-id-12345",
      "deviceName": "iPhone 13 Pro",
      "isActive": true,
      "isPrimary": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "deviceId": "unique-device-id-67890",
      "deviceName": "Samsung Galaxy",
      "isActive": false,
      "isPrimary": false,
      "lastLoginAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

---

### Deactivate Device

Qurilmani deaktivatsiya qilish (Admin).

**Endpoint:** `PUT /api/admins/devices/:id/deactivate`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli deaktivatsiya qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    "lastActivityAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Activate Device

Qurilmani aktivatsiya qilish (Admin).

**Endpoint:** `PUT /api/admins/devices/:id/activate`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli aktivatsiya qilindi",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** Qurilma aktivatsiya qilinganda, foydalanuvchining boshqa barcha qurilmalari avtomatik deaktivatsiya qilinadi.

---

### Delete Device

Qurilmani o'chirish (Admin).

**Endpoint:** `DELETE /api/admins/devices/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Qurilma muvaffaqiyatli o'chirildi"
}
```

---

### Get Device Statistics

Qurilma statistikasini olish (Admin).

**Endpoint:** `GET /api/admins/devices/statistics`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "active": 850,
    "inactive": 150,
    "byUserModel": [
      {
        "_id": "Punkt",
        "total": 300,
        "active": 250,
        "inactive": 50
      },
      {
        "_id": "Admin",
        "total": 50,
        "active": 45,
        "inactive": 5
      },
      {
        "_id": "Contragent",
        "total": 400,
        "active": 350,
        "inactive": 50
      },
      {
        "_id": "Agent",
        "total": 250,
        "active": 205,
        "inactive": 45
      }
    ],
    "byDeviceType": [
      {
        "_id": "mobile",
        "count": 700
      },
      {
        "_id": "desktop",
        "count": 200
      },
      {
        "_id": "tablet",
        "count": 100
      }
    ]
  }
}
```

---

## Workflow

### 1. Normal Login (Registered Device)

```
1. Foydalanuvchi login qiladi (phone + password yoki username + password)
2. System deviceId ni tekshiradi
3. Agar deviceId ro'yxatdan o'tgan va active bo'lsa:
   - Login muvaffaqiyatli
   - Device lastActivityAt yangilanadi
4. Agar deviceId ro'yxatdan o'tgan lekin inactive bo'lsa:
   - Error qaytariladi: "Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so'rang"
   - requiresDeviceVerification: true
5. Agar deviceId ro'yxatdan o'tmagan:
   - Agar bu birinchi qurilma bo'lsa (boshqa aktiv qurilma yo'q):
     - Qurilma avtomatik yaratiladi va aktiv bo'ladi
     - Login muvaffaqiyatli
   - Agar boshqa aktiv qurilma bor bo'lsa:
     - Error qaytariladi: "Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak"
     - requiresDeviceVerification: true
```

### 2. New Device Verification

```
1. Foydalanuvchi login qiladi
2. System yangi qurilma aniqlandi deb xabar qaytaradi
3. Foydalanuvchi device verification endpoint ga so'rov yuboradi
4. System SMS kod yuboradi
5. Foydalanuvchi SMS kodni kiritadi
6. System kodni tekshiradi va qurilmani ro'yxatga oladi
7. Foydalanuvchi endi login qila oladi
```

### 3. Device Replacement

```
1. Foydalanuvchi yangi qurilma bilan login qilishga harakat qiladi
2. System yangi qurilma aniqlandi deb xabar qaytaradi
3. Foydalanuvchi device verification endpoint ga so'rov yuboradi
4. System SMS kod yuboradi
5. Foydalanuvchi kodni kiritadi
6. System eski qurilmani deaktivatsiya qiladi
7. Yangi qurilma aktiv bo'ladi
8. Foydalanuvchi endi login qila oladi
```

### 4. Inactive Device Login Attempt

```
1. Foydalanuvchi nofaol qurilma bilan login qilishga harakat qiladi
2. System qurilma nofaol ekanligini aniqlaydi
3. Error qaytariladi: "Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so'rang"
4. requiresDeviceVerification: true flag qaytariladi
5. Login rad etiladi
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Telefon raqami va qurilma ID kiritilishi shart"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**403 Forbidden (Yangi qurilma aniqlandi):**
```json
{
  "success": false,
  "message": "Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak",
  "requiresDeviceVerification": true,
  "data": {
    "phone": "+998901234567",
    "deviceId": "unique-device-id-12345"
  }
}
```

**403 Forbidden (Nofaol qurilma):**
```json
{
  "success": false,
  "message": "Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so'rang",
  "requiresDeviceVerification": true
}
```

**403 Forbidden (Qurilma topilmadi):**
```json
{
  "success": false,
  "message": "Qurilma topilmadi yoki nofaol. Iltimos, qurilmani tasdiqlang",
  "requiresDeviceVerification": true
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Tasdiqlash kodini yuborishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Examples

### Example 1: Punkt Login with New Device

```bash
# Step 1: Login attempt
curl -X POST "http://localhost:5000/api/punkts/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'

# Response: requiresDeviceVerification: true

# Step 2: Request verification code
curl -X POST "http://localhost:5000/api/device-verification/punkt/request-code" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "mobile"
  }'

# Step 3: Verify device
curl -X POST "http://localhost:5000/api/device-verification/punkt/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "code": "12345"
  }'

# Step 4: Login again (now successful)
curl -X POST "http://localhost:5000/api/punkts/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

### Example 2: Admin Login with Device Verification

```bash
# Step 1: Login attempt
curl -X POST "http://localhost:5000/api/admins/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "username": "admin",
    "parol": "password123"
  }'

# Response: requiresDeviceVerification: true (phone from admin profile)

# Step 2: Request verification code (using admin's username)
curl -X POST "http://localhost:5000/api/device-verification/admin/request-code" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "deviceId": "new-device-id-12345",
    "deviceName": "MacBook Pro",
    "deviceType": "desktop"
  }'

# Step 3: Verify device
curl -X POST "http://localhost:5000/api/device-verification/admin/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "deviceId": "new-device-id-12345",
    "code": "12345"
  }'

# Step 4: Login again (now successful)
curl -X POST "http://localhost:5000/api/admins/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "username": "admin",
    "parol": "password123"
  }'
```

### Example 3: Resend Verification Code (Punkt)

```bash
curl -X POST "http://localhost:5000/api/device-verification/punkt/resend-code" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345"
  }'
```

### Example 4: Resend Verification Code (Admin)

```bash
curl -X POST "http://localhost:5000/api/device-verification/admin/resend-code" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "deviceId": "new-device-id-12345"
  }'
```

### Example 5: Resend Verification Code (Contragent)

```bash
curl -X POST "http://localhost:5000/api/device-verification/contragent/resend-code" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345"
  }'
```

### Example 6: Contragent Login with New Device

```bash
# Step 1: Login attempt
curl -X POST "http://localhost:5000/api/contragents/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'

# Response: requiresDeviceVerification: true

# Step 2: Request verification code
curl -X POST "http://localhost:5000/api/device-verification/contragent/request-code" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "mobile"
  }'

# Step 3: Verify device
curl -X POST "http://localhost:5000/api/device-verification/contragent/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "code": "12345"
  }'

# Step 4: Login again (now successful)
curl -X POST "http://localhost:5000/api/contragents/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

### Example 7: Agent Login with New Device

```bash
# Step 1: Login attempt
curl -X POST "http://localhost:5000/api/agents/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'

# Response: requiresDeviceVerification: true

# Step 2: Request verification code
curl -X POST "http://localhost:5000/api/device-verification/agent/request-code" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "deviceName": "Samsung Galaxy S21",
    "deviceType": "mobile"
  }'

# Step 3: Verify device
curl -X POST "http://localhost:5000/api/device-verification/agent/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "deviceId": "new-device-id-12345",
    "code": "12345"
  }'

# Step 4: Login again (now successful)
curl -X POST "http://localhost:5000/api/agents/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: new-device-id-12345" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

### Example 8: Admin Get All Devices (including Contragent devices)

```bash
curl -X GET "http://localhost:5000/api/admins/devices?userModel=Punkt&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

### Example 9: Admin Get Contragent Devices

```bash
# Get all devices for a specific Contragent
curl -X GET "http://localhost:5000/api/admins/devices/user/Contragent/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <admin_token>"
```

### Example 10: Admin Deactivate Device

```bash
curl -X PUT "http://localhost:5000/api/admins/devices/507f1f77bcf86cd799439011/deactivate" \
  -H "Authorization: Bearer <admin_token>"
```

### Example 11: Admin Activate Contragent Device

```bash
curl -X PUT "http://localhost:5000/api/admins/devices/507f1f77bcf86cd799439011/activate" \
  -H "Authorization: Bearer <admin_token>"
```

---

## SMS Template

**Template:**
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.
```

**Example:**
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: 12345. Kod 5 daqiqa amal qiladi.
```

---

## Important Notes

1. **Device ID:** Har bir qurilma uchun unique deviceId kerak. Bu frontend tomonidan yaratilishi va saqlanishi kerak.

2. **One Device Per User:** Har bir foydalanuvchi uchun faqat bitta faol qurilma bo'lishi mumkin. Yangi qurilma aktivatsiya qilinganda, eski qurilma avtomatik deaktivatsiya qilinadi.

3. **SMS Code Expiration:** SMS kod 5 daqiqa amal qiladi.

4. **Admin Login:** Admin login username bilan davom etadi, lekin qurilma tasdiqlash admin profilidagi telefon raqami orqali amalga oshiriladi.

5. **Automatic Detection:** Login jarayonida qurilma avtomatik aniqlanadi va tekshiriladi.

6. **Device Headers:** Qurilma ma'lumotlari header'lar orqali ham yuborilishi mumkin:
   - `X-Device-Id`: Qurilma ID
   - `X-Device-Name`: Qurilma nomi
   - `X-Device-Type`: Qurilma turi
   - `X-Platform`: Platforma
   - `X-OS`: Operatsion tizim
   - `X-Browser`: Brauzer

---

**Yaratilgan:** 2024  
**Versiya:** 1.0.0

