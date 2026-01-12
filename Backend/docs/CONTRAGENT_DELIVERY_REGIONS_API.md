# Kontragent Yetkazib Berish Hududlari API

Bu dokumentatsiya oddiy kontragentlar (tuman kontragentlar) uchun yetkazib berish hududlarini boshqarish API endpoints larini tavsiflaydi.

**Base Path:** `/api/contragents`

**Eslatma:** Bu API faqat `contragentLevel: 'tuman'` (oddiy kontragentlar) uchun ishlaydi. Maxalla kontragentlar uchun `/api/maxalla-contragents` API dan foydalaning.

---

## Table of Contents

1. [Kirish](#kirish)
2. [Get Yetkazib Berish Hududlari](#get-yetkazib-berish-hududlari)
3. [Update Yetkazib Berish Hududlari](#update-yetkazib-berish-hududlari)
4. [Ma'lumotlar Strukturasi](#malumotlar-strukturasi)
5. [Validatsiya Qoidalari](#validatsiya-qoidalari)
6. [Xatoliklar](#xatoliklar)
7. [Misollar](#misollar)

---

## Kirish

Oddiy kontragentlar (tuman kontragentlar) o'z maxsulotlarini yetkazib berish hududlarini profil orqali belgilashlari mumkin. Bu hududlar maxsulot yaratishda yoki yangilashda har safar kiritilish shart emas.

**Asosiy xususiyatlar:**
- Bir necha viloyatlar va ular ichidagi tumanlardan bir nechta tanlash mumkin
- Har bir hudud: `viloyat` (required) va `tuman` (optional)
- Agar `tuman` kiritilmasa, butun viloyatga yetkazib berish mumkin
- Maxsulot yaratishda `deliveryRegions` maydoni ixtiyoriy bo'ldi

**Maxalla Kontragent vs Oddiy Kontragent:**
- **Maxalla Kontragent** (`contragentLevel: 'mfy'`): `/api/maxalla-contragents/me/service-areas` API dan foydalanadi
- **Oddiy Kontragent** (`contragentLevel: 'tuman'`): `/api/contragents/me/delivery-regions` API dan foydalanadi (bu dokumentatsiya)

---

## Get Yetkazib Berish Hududlari

Foydalanuvchining tanlangan yetkazib berish hududlarini olish.

### Endpoint

```
GET /api/contragents/me/delivery-regions
```

### Authentication

**Required:** `contragentAuth`

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
    "deliveryRegions": [
      {
        "viloyat": {
          "_id": "68fda96eb9a140ceec485abc",
          "name": "Andijon viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "6902628ab9a140ceec488052",
          "name": "Buloqboshi tumani",
          "type": "district",
          "code": "1001"
        }
      },
      {
        "viloyat": {
          "_id": "68fda96eb9a140ceec485def",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "27"
        },
        "tuman": null
      }
    ]
  }
}
```

**Eslatma:** Agar foydalanuvchi hali yetkazib berish hududlarini tanlamagan bo'lsa, `deliveryRegions` bo'sh array `[]` bo'ladi.

**Xatolik (404 Not Found):**

```json
{
  "success": false,
  "message": "Kontragent topilmadi"
}
```

**Xatolik (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Yetkazib berish hududlarini olishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Update Yetkazib Berish Hududlari

Foydalanuvchining yetkazib berish hududlarini yangilash.

### Endpoint

```
PATCH /api/contragents/me/delivery-regions
```

### Authentication

**Required:** `contragentAuth`

Token header da yuborilishi kerak:
```
Authorization: Bearer <token>
```

### Request Body

```json
{
  "deliveryRegions": [
    {
      "viloyat": "68fda96eb9a140ceec485abc",
      "tuman": "6902628ab9a140ceec488052"
    },
    {
      "viloyat": "68fda96eb9a140ceec485def",
      "tuman": null
    },
    {
      "viloyat": "68fda96eb9a140ceec485ghi",
      "tuman": "6902628ab9a140ceec488053"
    }
  ]
}
```

**Maydonlar:**

- `deliveryRegions` (array, required) - Yetkazib berish hududlari ro'yxati
  - `viloyat` (string, required) - Viloyat ID (ObjectId)
  - `tuman` (string, optional, null yoki '' bo'lishi mumkin) - Tuman ID (ObjectId)

**Eslatmalar:**

1. `deliveryRegions` array bo'lishi kerak va kamida bitta element bo'lishi kerak.
2. Har bir hududda `viloyat` majburiy, `tuman` ixtiyoriy.
3. Agar `tuman` `null` yoki kiritilmasa, butun viloyatga yetkazib berish mumkin.
4. Tuman tanlangan viloyatga tegishli bo'lishi kerak.
5. Bir xil viloyat-tuman kombinatsiyasi takrorlanmasligi kerak (lekin validatsiya qilinmaydi, faqat ma'lumotlar to'g'ri bo'lishi kerak).

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "message": "Yetkazib berish hududlari yangilandi",
  "data": {
    "deliveryRegions": [
      {
        "viloyat": {
          "_id": "68fda96eb9a140ceec485abc",
          "name": "Andijon viloyati",
          "type": "region",
          "code": "10"
        },
        "tuman": {
          "_id": "6902628ab9a140ceec488052",
          "name": "Buloqboshi tumani",
          "type": "district",
          "code": "1001"
        }
      },
      {
        "viloyat": {
          "_id": "68fda96eb9a140ceec485def",
          "name": "Toshkent viloyati",
          "type": "region",
          "code": "27"
        },
        "tuman": null
      }
    ]
  }
}
```

**Xatolik (400 Bad Request):**

```json
{
  "success": false,
  "message": "Maxalla kontragentlar uchun bu API ishlamaydi. Xizmat ko'rsatish hududlarini boshqa API orqali yangilang."
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish hududlari array bo'lishi kerak"
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish hududi 1: viloyat kiritilishi shart"
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish hududi 1: viloyat topilmadi yoki noto'g'ri tur"
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish hududi 1: tuman topilmadi yoki noto'g'ri tur"
}
```

```json
{
  "success": false,
  "message": "Yetkazib berish hududi 1: tuman tanlangan viloyatga tegishli emas"
}
```

**Xatolik (404 Not Found):**

```json
{
  "success": false,
  "message": "Kontragent topilmadi"
}
```

**Xatolik (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Yetkazib berish hududlarini yangilashda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Ma'lumotlar Strukturasi

### Delivery Region Object

```typescript
{
  viloyat: ObjectId (ref: Region, type: 'region'),
  tuman: ObjectId | null (ref: Region, type: 'district')
}
```

### Contragent Model (deliveryRegions maydoni)

```typescript
{
  _id: ObjectId,
  // ... boshqa maydonlar
  deliveryRegions: [
    {
      viloyat: ObjectId,
      tuman: ObjectId | null
    }
  ],
  // ... boshqa maydonlar
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

1. **deliveryRegions:**
   - Type: `array`
   - Required: `true`
   - Min length: `1` (kamida bitta hudud)
   - Each element must be an object with `viloyat` and optional `tuman`

2. **viloyat:**
   - Type: `string` (MongoDB ObjectId)
   - Required: `true`
   - Must exist in Region collection
   - Must have `type: 'region'`

3. **tuman:**
   - Type: `string` (MongoDB ObjectId) or `null`
   - Required: `false` (optional)
   - If provided, must exist in Region collection
   - Must have `type: 'district'`
   - Must belong to the specified `viloyat` (parent relationship)

### Hierarxiya Qoidalari

1. **Viloyat → Tuman** ketma-ketligi bo'lishi kerak
2. Tuman tanlangan viloyatga tegishli bo'lishi kerak (`tuman.parent === viloyat._id`)
3. Agar tuman kiritilmasa (`null`), butun viloyatga yetkazib berish mumkin

---

## Xatoliklar

### Status Kodlar

- `200 OK` - Muvaffaqiyatli so'rov
- `400 Bad Request` - Noto'g'ri so'rov (validatsiya xatosi, noto'g'ri region ID, hierarxiya xatosi, maxalla kontragent)
- `401 Unauthorized` - Autentifikatsiya talab qilinadi
- `404 Not Found` - Kontragent topilmadi
- `500 Internal Server Error` - Server xatosi

### Xatolik Xabarlari

| Xatolik | Status | Tavsif |
|---------|--------|--------|
| `Kontragent topilmadi` | 404 | Token da ko'rsatilgan kontragent topilmadi |
| `Maxalla kontragentlar uchun bu API ishlamaydi` | 400 | Faqat tuman kontragentlar uchun ishlaydi |
| `Yetkazib berish hududlari array bo'lishi kerak` | 400 | deliveryRegions array emas |
| `Yetkazib berish hududi N: viloyat kiritilishi shart` | 400 | N-chi hududda viloyat kiritilmagan |
| `Yetkazib berish hududi N: viloyat topilmadi yoki noto'g'ri tur` | 400 | Viloyat ID topilmadi yoki region type emas |
| `Yetkazib berish hududi N: tuman topilmadi yoki noto'g'ri tur` | 400 | Tuman ID topilmadi yoki district type emas |
| `Yetkazib berish hududi N: tuman tanlangan viloyatga tegishli emas` | 400 | Tuman tanlangan viloyatga tegishli emas |
| `Noto'g'ri region ID` | 400 | Yuborilgan ID noto'g'ri formatda |
| `Yetkazib berish hududlarini olishda xatolik yuz berdi` | 500 | Server xatosi (GET) |
| `Yetkazib berish hududlarini yangilashda xatolik yuz berdi` | 500 | Server xatosi (PATCH) |

---

## Misollar

### JavaScript/Fetch

#### GET - Yetkazib Berish Hududlarini Olish

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/contragents/me/delivery-regions', {
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
      console.log('Delivery Regions:', data.data.deliveryRegions);
      data.data.deliveryRegions.forEach((region, index) => {
        console.log(`Region ${index + 1}:`, region.viloyat.name, region.tuman?.name || 'Butun viloyat');
      });
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

#### PATCH - Bir Necha Viloyat va Tumanlar Tanlash

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/contragents/me/delivery-regions', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deliveryRegions: [
      {
        viloyat: '68fda96eb9a140ceec485abc', // Andijon viloyati
        tuman: '6902628ab9a140ceec488052'     // Buloqboshi tumani
      },
      {
        viloyat: '68fda96eb9a140ceec485def', // Toshkent viloyati
        tuman: null                           // Butun viloyat
      },
      {
        viloyat: '68fda96eb9a140ceec485ghi', // Farg'ona viloyati
        tuman: '6902628ab9a140ceec488053'     // Qo'qon tumani
      }
    ]
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

#### PATCH - Faqat Viloyatlar (Tumanlarsiz)

```javascript
const token = 'your_jwt_token';

fetch('http://localhost:5000/api/contragents/me/delivery-regions', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deliveryRegions: [
      {
        viloyat: '68fda96eb9a140ceec485abc', // Andijon viloyati
        tuman: null                           // Butun viloyat
      },
      {
        viloyat: '68fda96eb9a140ceec485def', // Toshkent viloyati
        tuman: null                           // Butun viloyat
      }
    ]
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

#### GET - Yetkazib Berish Hududlarini Olish

```bash
curl -X GET \
  http://localhost:5000/api/contragents/me/delivery-regions \
  -H 'Authorization: Bearer your_jwt_token' \
  -H 'Content-Type: application/json'
```

#### PATCH - Yetkazib Berish Hududlarini Yangilash

```bash
curl -X PATCH \
  http://localhost:5000/api/contragents/me/delivery-regions \
  -H 'Authorization: Bearer your_jwt_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "deliveryRegions": [
      {
        "viloyat": "68fda96eb9a140ceec485abc",
        "tuman": "6902628ab9a140ceec488052"
      },
      {
        "viloyat": "68fda96eb9a140ceec485def",
        "tuman": null
      }
    ]
  }'
```

### Axios

#### GET - Yetkazib Berish Hududlarini Olish

```javascript
const axios = require('axios');

axios.get('http://localhost:5000/api/contragents/me/delivery-regions', {
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

#### PATCH - Yetkazib Berish Hududlarini Yangilash

```javascript
const axios = require('axios');

axios.patch('http://localhost:5000/api/contragents/me/delivery-regions', {
  deliveryRegions: [
    {
      viloyat: '68fda96eb9a140ceec485abc',
      tuman: '6902628ab9a140ceec488052'
    },
    {
      viloyat: '68fda96eb9a140ceec485def',
      tuman: null
    }
  ]
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

### Maxsulot CRUD da Yetkazib Berish Hududlari

**MUHIM:** Maxsulot yaratish va yangilashda `deliveryRegions` maydoni **umuman kiritilmaydi**. Barcha maxsulotlar uchun yetkazib berish hududlari avtomatik ravishda kontragent profilidagi `deliveryRegions` dan olinadi.

#### Maxsulot Yaratish (Create Product)

```javascript
// Maxsulot yaratish - deliveryRegions kiritilmaydi
fetch('http://localhost:5000/api/product', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Maxsulot nomi',
    price: 10000,
    originalPrice: 12000,
    quantity: 100,
    unit: 'dona',
    category: 'category_id',
    // deliveryRegions kiritilmaydi - avtomatik kontragent profilidan olinadi
  })
})
```

**Qanday ishlaydi:**
1. Kontragent maxsulot yaratishda `deliveryRegions` maydonini kiritmaydi
2. Server avtomatik ravishda kontragent profilidagi `deliveryRegions` ni oladi
3. Maxsulot yaratilganda bu hududlar maxsulotga avtomatik qo'shiladi

#### Maxsulot Yangilash (Update Product)

```javascript
// Maxsulot yangilash - deliveryRegions kiritilmaydi
fetch('http://localhost:5000/api/product/:id', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Yangi nom',
    price: 15000,
    // deliveryRegions kiritilmaydi - avtomatik kontragent profilidan olinadi
  })
})
```

**Qanday ishlaydi:**
1. Kontragent maxsulotni yangilashda `deliveryRegions` maydonini kiritmaydi
2. Server avtomatik ravishda kontragent profilidagi joriy `deliveryRegions` ni oladi
3. Maxsulot yangilanganda hududlar avtomatik yangilanadi

**Eslatma:** Agar kontragent profilida `deliveryRegions` bo'sh bo'lsa (`[]`), maxsulot ham bo'sh `deliveryRegions` bilan yaratiladi yoki yangilanadi.

### Region Types

- `region` - Viloyat
- `district` - Tuman
- `mfy` - Mahalla Fuqarolar Yig'ini

### Hierarxiya

```
Region (viloyat)
  └── District (tuman)
```

### Eslatmalar

1. Bu API faqat **tuman kontragentlar** (`contragentLevel: 'tuman'`) uchun ishlaydi.
2. Maxalla kontragentlar uchun `/api/maxalla-contragents/me/service-areas` API dan foydalaning.
3. **Maxsulot CRUD da `deliveryRegions` maydoni umuman kiritilmaydi** - avtomatik kontragent profilidan olinadi.
4. Kontragent profilida `deliveryRegions` ni bir marta belgilagandan so'ng, barcha yangi maxsulotlar avtomatik ravishda bu hududlarni oladi.
5. Kontragent profilidagi `deliveryRegions` ni yangilaganda, mavjud maxsulotlar avtomatik yangilanmaydi - faqat yangi maxsulotlar yangi hududlarni oladi.
6. Barcha region ID lar MongoDB ObjectId formatida bo'lishi kerak.
7. Validatsiya server tomonida amalga oshiriladi va barcha hierarxiya qoidalari tekshiriladi.

---

## Maxsulot CRUD O'zgarishlari

### Maxsulot Yaratish (Create Product)

**Oldin:**
```json
{
  "name": "Maxsulot nomi",
  "price": 10000,
  "deliveryRegions": [  // Required - har safar kiritilishi kerak edi
    {
      "viloyat": "...",
      "tuman": "..."
    }
  ]
}
```

**Hozir:**
```json
{
  "name": "Maxsulot nomi",
  "price": 10000
  // deliveryRegions kiritilmaydi - avtomatik kontragent profilidan olinadi
}
```

**Qanday ishlaydi:**
- Kontragent maxsulot yaratishda `deliveryRegions` maydonini kiritmaydi
- Server avtomatik ravishda kontragent profilidagi `deliveryRegions` ni oladi
- Maxsulot yaratilganda bu hududlar maxsulotga avtomatik qo'shiladi

### Maxsulot Yangilash (Update Product)

**Oldin:**
```json
{
  "name": "Yangi nom",
  "deliveryRegions": [...]  // Required if updating - har safar kiritilishi kerak edi
}
```

**Hozir:**
```json
{
  "name": "Yangi nom"
  // deliveryRegions kiritilmaydi - avtomatik kontragent profilidan olinadi
}
```

**Qanday ishlaydi:**
- Kontragent maxsulotni yangilashda `deliveryRegions` maydonini kiritmaydi
- Server avtomatik ravishda kontragent profilidagi joriy `deliveryRegions` ni oladi
- Maxsulot yangilanganda hududlar avtomatik yangilanadi

---

## Foydalanish Ssenariylari

### Ssenariy 1: Birinchi Marta Hududlar Tanlash

1. Kontragent profiliga kirish
2. `GET /api/contragents/me/delivery-regions` - bo'sh array qaytaradi
3. `PATCH /api/contragents/me/delivery-regions` - hududlarni tanlash
4. Endi maxsulot yaratishda `deliveryRegions` kiritish shart emas

### Ssenariy 2: Hududlarni Yangilash

1. `GET /api/contragents/me/delivery-regions` - mavjud hududlarni ko'rish
2. `PATCH /api/contragents/me/delivery-regions` - yangi hududlar bilan yangilash

### Ssenariy 3: Maxsulot Yaratish

1. Kontragent profilida hududlar tanlangan (`PATCH /api/contragents/me/delivery-regions`)
2. Maxsulot yaratishda `deliveryRegions` maydoni **umuman kiritilmaydi**
3. Server avtomatik ravishda kontragent profilidagi `deliveryRegions` ni oladi va maxsulotga qo'shadi
4. Barcha yangi maxsulotlar avtomatik ravishda kontragent profilidagi hududlarni oladi

### Ssenariy 4: Profil Hududlarini O'zgartirish

1. Kontragent profilidagi `deliveryRegions` ni yangilash (`PATCH /api/contragents/me/delivery-regions`)
2. **Mavjud maxsulotlar avtomatik yangilanmaydi** - faqat yangi yaratiladigan maxsulotlar yangi hududlarni oladi
3. Agar mavjud maxsulotlarni ham yangilash kerak bo'lsa, har birini alohida yangilash kerak (lekin `deliveryRegions` kiritmasdan, server avtomatik yangi profil hududlarini oladi)

---

## Xulosa

Bu API oddiy kontragentlarga o'z yetkazib berish hududlarini profil orqali boshqarish imkoniyatini beradi. 

**Asosiy afzalliklar:**
- ✅ Maxsulot yaratishda `deliveryRegions` kiritish shart emas - avtomatik kontragent profilidan olinadi
- ✅ Profilda bir marta hududlar belgilangandan so'ng, barcha yangi maxsulotlar avtomatik bu hududlarni oladi
- ✅ Maxsulot yaratish jarayoni soddalashtirildi - kamroq ma'lumot kiritish kerak
- ✅ Kontragentlar uchun qulaylik - har safar maxsulot yaratishda hududlarni qayta kiritish shart emas

**Eslatma:** Agar kontragent profilida `deliveryRegions` bo'sh bo'lsa (`[]`), maxsulotlar ham bo'sh `deliveryRegions` bilan yaratiladi. Shuning uchun maxsulot yaratishdan oldin profilida hududlarni belgilash tavsiya etiladi.
