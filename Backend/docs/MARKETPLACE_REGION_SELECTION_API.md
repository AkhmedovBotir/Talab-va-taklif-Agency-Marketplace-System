# Marketplace Region Selection API

Bu dokumentatsiya Marketplace foydalanuvchilari uchun viloyat, tuman va MFY tanlash API endpoints larini tavsiflaydi.

**Base Path:** `/api/marketplace`

---

## Table of Contents

1. [Get Viloyat, Tuman va MFY](#get-viloyat-tuman-va-mfy)
2. [Update Viloyat, Tuman va MFY](#update-viloyat-tuman-va-mfy)
3. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
4. [Validatsiya Qoidalari](#validatsiya-qoidalari)
5. [Xatoliklar](#xatoliklar)
6. [Misollar](#misollar)

---

## Get Viloyat, Tuman va MFY

Foydalanuvchining tanlangan viloyat, tuman va MFY ma'lumotlarini olish.

### Endpoint

```
GET /api/marketplace/me/viloyat-tuman
```

### Authentication

**Required:** `marketplaceUserAuth`

Token header da yuborilishi kerak:
```
Authorization: Bearer <token>
```

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "60f7b3c4e4b0a1b2c3d4e5f6",
    "user": "60f7b3c4e4b0a1b2c3d4e5f7",
    "viloyat": {
      "_id": "68fda96eb9a140ceec485abc",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "6902628ab9a140ceec488052",
      "name": "Olmaliq tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "6902628ab9a140ceec488053",
      "name": "Navruz MFY",
      "type": "mfy",
      "code": "1001001"
    }
  }
}
```

**Eslatma:** Agar foydalanuvchi hali viloyat, tuman yoki MFY tanlamagan bo'lsa, tegishli maydon `null` bo'ladi.

**Xatolik (404 Not Found):**

```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

**Xatolik (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Viloyat, tuman va MFY ni olishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Update Viloyat, Tuman va MFY

Foydalanuvchining viloyat, tuman va MFY tanlashini yangilash.

### Endpoint

```
PATCH /api/marketplace/me/viloyat-tuman
```

### Authentication

**Required:** `marketplaceUserAuth`

Token header da yuborilishi kerak:
```
Authorization: Bearer <token>
```

### Request Body

Barcha maydonlar ixtiyoriy. Faqat o'zgartirmoqchi bo'lgan maydonlarni yuborish mumkin.

```json
{
  "viloyat": "68fda96eb9a140ceec485abc",
  "tuman": "6902628ab9a140ceec488052",
  "mfy": "6902628ab9a140ceec488053"
}
```

**Maydonlar:**

- `viloyat` (string, optional, null yoki '' bo'lishi mumkin) - Viloyat ID (ObjectId)
- `tuman` (string, optional, null yoki '' bo'lishi mumkin) - Tuman ID (ObjectId)
- `mfy` (string, optional, null yoki '' bo'lishi mumkin) - MFY ID (ObjectId)

**Eslatmalar:**

1. Agar `viloyat` `null` yoki bo'sh string bo'lsa, viloyat tozalanadi va avtomatik ravishda `tuman` va `mfy` ham tozalanadi.
2. Agar `tuman` `null` yoki bo'sh string bo'lsa, tuman tozalanadi va avtomatik ravishda `mfy` ham tozalanadi.
3. Agar `mfy` `null` yoki bo'sh string bo'lsa, faqat MFY tozalanadi.
4. Tuman tanlashdan oldin viloyat tanlanishi kerak.
5. MFY tanlashdan oldin tuman tanlanishi kerak.
6. Tuman tanlangan viloyatga tegishli bo'lishi kerak.
7. MFY tanlangan tumanga tegishli bo'lishi kerak.

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Viloyat, tuman va MFY yangilandi",
  "data": {
    "_id": "60f7b3c4e4b0a1b2c3d4e5f6",
    "user": "60f7b3c4e4b0a1b2c3d4e5f7",
    "viloyat": {
      "_id": "68fda96eb9a140ceec485abc",
      "name": "Toshkent viloyati",
      "type": "region",
      "code": "10"
    },
    "tuman": {
      "_id": "6902628ab9a140ceec488052",
      "name": "Olmaliq tumani",
      "type": "district",
      "code": "1001"
    },
    "mfy": {
      "_id": "6902628ab9a140ceec488053",
      "name": "Navruz MFY",
      "type": "mfy",
      "code": "1001001"
    }
  }
}
```

**Xatolik (400 Bad Request):**

```json
{
  "success": false,
  "message": "Viloyat topilmadi yoki noto'g'ri tur"
}
```

```json
{
  "success": false,
  "message": "Tuman topilmadi yoki noto'g'ri tur"
}
```

```json
{
  "success": false,
  "message": "MFY topilmadi yoki noto'g'ri tur"
}
```

```json
{
  "success": false,
  "message": "Tuman tanlangan viloyatga tegishli emas"
}
```

```json
{
  "success": false,
  "message": "MFY tanlangan tumanga tegishli emas"
}
```

```json
{
  "success": false,
  "message": "Avval viloyat tanlashingiz kerak"
}
```

```json
{
  "success": false,
  "message": "Avval tuman tanlashingiz kerak"
}
```

**Xatolik (404 Not Found):**

```json
{
  "success": false,
  "message": "Foydalanuvchi topilmadi"
}
```

**Xatolik (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Viloyat, tuman va MFY ni yangilashda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Ma'lumotlar Strukturasi

### MarketplaceUserRegionSelection

```typescript
{
  _id: ObjectId,
  user: ObjectId (ref: MarketplaceUser),
  viloyat: ObjectId | null (ref: Region, type: 'region'),
  tuman: ObjectId | null (ref: Region, type: 'district'),
  mfy: ObjectId | null (ref: Region, type: 'mfy'),
  createdAt: Date,
  updatedAt: Date
}
```

### Region Object (Populated)

```typescript
{
  _id: ObjectId,
  name: string,
  type: 'region' | 'district' | 'mfy',
  code: string
}
```

---

## Validatsiya Qoidalari

### Request Body Validatsiya

1. **viloyat:**
   - Type: `string`
   - Required: `false` (optional)
   - Allow: `null`, `''` (empty string)
   - Format: Valid MongoDB ObjectId
   - Must be a region type (`type: 'region'`)

2. **tuman:**
   - Type: `string`
   - Required: `false` (optional)
   - Allow: `null`, `''` (empty string)
   - Format: Valid MongoDB ObjectId
   - Must be a district type (`type: 'district'`)
   - Must belong to selected or current viloyat

3. **mfy:**
   - Type: `string`
   - Required: `false` (optional)
   - Allow: `null`, `''` (empty string)
   - Format: Valid MongoDB ObjectId
   - Must be an MFY type (`type: 'mfy'`)
   - Must belong to selected or current tuman

### Hierarxiya Qoidalari

1. **Viloyat → Tuman → MFY** ketma-ketligi bo'lishi kerak
2. Tuman tanlashdan oldin viloyat tanlanishi shart
3. MFY tanlashdan oldin tuman tanlanishi shart
4. Agar viloyat o'zgartirilsa va tuman yangi viloyatga tegishli bo'lmasa, tuman avtomatik tozalanadi
5. Agar tuman o'zgartirilsa va MFY yangi tumanga tegishli bo'lmasa, MFY avtomatik tozalanadi

---

## Xatoliklar

### Status Kodlar

- `200 OK` - Muvaffaqiyatli so'rov
- `400 Bad Request` - Noto'g'ri so'rov (validatsiya xatosi, noto'g'ri region ID, hierarxiya xatosi)
- `401 Unauthorized` - Autentifikatsiya talab qilinadi
- `404 Not Found` - Foydalanuvchi topilmadi
- `500 Internal Server Error` - Server xatosi

### Xatolik Xabarlari

| Xatolik | Status | Tavsif |
|---------|--------|--------|
| `Foydalanuvchi topilmadi` | 404 | Token da ko'rsatilgan foydalanuvchi topilmadi |
| `Viloyat topilmadi yoki noto'g'ri tur` | 400 | Viloyat ID topilmadi yoki region type emas |
| `Tuman topilmadi yoki noto'g'ri tur` | 400 | Tuman ID topilmadi yoki district type emas |
| `MFY topilmadi yoki noto'g'ri tur` | 400 | MFY ID topilmadi yoki mfy type emas |
| `Tuman tanlangan viloyatga tegishli emas` | 400 | Tuman tanlangan viloyatga tegishli emas |
| `MFY tanlangan tumanga tegishli emas` | 400 | MFY tanlangan tumanga tegishli emas |
| `Avval viloyat tanlashingiz kerak` | 400 | Tuman tanlashdan oldin viloyat tanlanishi kerak |
| `Avval tuman tanlashingiz kerak` | 400 | MFY tanlashdan oldin tuman tanlanishi kerak |
| `Noto'g'ri region ID` | 400 | Yuborilgan ID noto'g'ri formatda |
| `Viloyat, tuman va MFY ni olishda xatolik yuz berdi` | 500 | Server xatosi (GET) |
| `Viloyat, tuman va MFY ni yangilashda xatolik yuz berdi` | 500 | Server xatosi (PATCH) |

---

## Misollar

### JavaScript/Fetch

#### GET - Viloyat, Tuman va MFY ni olish

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
    if (data.success) {
      console.log('Viloyat:', data.data.viloyat);
      console.log('Tuman:', data.data.tuman);
      console.log('MFY:', data.data.mfy);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Faqat viloyat tanlash

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    viloyat: '68fda96eb9a140ceec485abc'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Viloyat va tuman tanlash

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    viloyat: '68fda96eb9a140ceec485abc',
    tuman: '6902628ab9a140ceec488052'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Viloyat, tuman va MFY tanlash

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    viloyat: '68fda96eb9a140ceec485abc',
    tuman: '6902628ab9a140ceec488052',
    mfy: '6902628ab9a140ceec488053'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Faqat MFY yangilash (viloyat va tuman o'zgarmaydi)

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mfy: '6902628ab9a140ceec488053'
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Viloyatni tozalash (tuman va MFY ham tozalanadi)

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    viloyat: null
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### cURL

#### GET - Viloyat, Tuman va MFY ni olish

```bash
curl -X GET \
  http://localhost:5000/api/marketplace/me/viloyat-tuman \
  -H 'Authorization: Bearer your_jwt_token' \
  -H 'Content-Type: application/json'
```

#### PATCH - Viloyat, tuman va MFY tanlash

```bash
curl -X PATCH \
  http://localhost:5000/api/marketplace/me/viloyat-tuman \
  -H 'Authorization: Bearer your_jwt_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "viloyat": "68fda96eb9a140ceec485abc",
    "tuman": "6902628ab9a140ceec488052",
    "mfy": "6902628ab9a140ceec488053"
  }'
```

### Axios

#### GET - Viloyat, Tuman va MFY ni olish

```javascript
const axios = require('axios');

axios.get('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response.data);
  });
```

#### PATCH - Viloyat, tuman va MFY tanlash

```javascript
const axios = require('axios');

axios.patch('http://localhost:5000/api/marketplace/me/viloyat-tuman', {
  viloyat: '68fda96eb9a140ceec485abc',
  tuman: '6902628ab9a140ceec488052',
  mfy: '6902628ab9a140ceec488053'
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response.data);
  });
```

---

## Qo'shimcha Ma'lumotlar

### Region Types

- `region` - Viloyat
- `district` - Tuman
- `mfy` - Mahalla Fuqarolar Yig'ini

### Hierarxiya

```
Region (viloyat)
  └── District (tuman)
      └── MFY (mfy)
```

### Avtomatik Tozalash Qoidalari

1. **Viloyat tozalanganda:**
   - Tuman avtomatik tozalanadi
   - MFY avtomatik tozalanadi

2. **Tuman tozalanganda:**
   - MFY avtomatik tozalanadi

3. **Viloyat o'zgartirilganda:**
   - Agar tuman yangi viloyatga tegishli bo'lmasa, tuman avtomatik tozalanadi
   - Agar tuman tozalansa, MFY ham avtomatik tozalanadi

4. **Tuman o'zgartirilganda:**
   - Agar MFY yangi tumanga tegishli bo'lmasa, MFY avtomatik tozalanadi

---

## Eslatmalar

1. Bu API `MarketplaceUserRegionSelection` modelidan foydalanadi, bu `MarketplaceUser` modelidan alohida.
2. Har bir foydalanuvchi uchun faqat bitta region selection yozuvi mavjud (unique index).
3. Agar foydalanuvchi birinchi marta region tanlasa, avtomatik ravishda yangi yozuv yaratiladi.
4. Barcha region ID lar MongoDB ObjectId formatida bo'lishi kerak.
5. Region tanlash ierarxiyasi: viloyat → tuman → MFY.
6. Validatsiya server tomonida amalga oshiriladi va barcha hierarxiya qoidalari tekshiriladi.
