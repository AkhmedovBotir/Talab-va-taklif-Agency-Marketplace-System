# Vakansiya Nomzodlari Profil API Dokumentatsiyasi

Bu API vakansiya nomzodlari uchun profil ma'lumotlarini ko'rish va yangilash imkoniyatlarini ta'minlaydi.

## Base URL
```
/api/vacancy-profile
```

## Autentifikatsiya

Barcha endpointlar JWT token talab qiladi. Token `Authorization` headerida quyidagi formatda yuborilishi kerak:
```
Authorization: Bearer <token>
```

Token `vacancy_applicant` role bilan yaratilgan bo'lishi kerak.

---

## Endpointlar

### 1. Profil ma'lumotlarini olish

Joriy nomzodning profil ma'lumotlarini olish.

**Endpoint:** `GET /me`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "applicant_id",
    "firstName": "Ism",
    "lastName": "Familiya",
    "phone": "+998901234567",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "viloyat": {
      "_id": "region_id",
      "name": "Andijon viloyati",
      "type": "region",
      "code": "17"
    },
    "tuman": {
      "_id": "region_id",
      "name": "Buloqboshi tumani",
      "type": "district",
      "code": "1701"
    },
    "mfy": {
      "_id": "region_id",
      "name": "Buyuk turon MFY",
      "type": "mfy",
      "code": "1701001"
    },
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Nomzod topilmadi
- `500`: Server xatosi

---

### 2. Profil ma'lumotlarini yangilash

Nomzodning asosiy profil ma'lumotlarini yangilash (ism, familiya, jins, tug'ilgan sana).

**Endpoint:** `PUT /me`

**Request Body:**
```json
{
  "firstName": "Yangi ism",
  "lastName": "Yangi familiya",
  "gender": "female",
  "birthDate": "1995-05-15"
}
```

**Field Descriptions:**
- `firstName` (optional): Yangi ism (min 2 belgi)
- `lastName` (optional): Yangi familiya (min 2 belgi)
- `gender` (optional): Jins - `male`, `female`, yoki `other`
- `birthDate` (optional): Tug'ilgan sana (ISO format)

**Response:**
```json
{
  "success": true,
  "message": "Profil yangilandi",
  "data": {
    "_id": "applicant_id",
    "firstName": "Yangi ism",
    "lastName": "Yangi familiya",
    "phone": "+998901234567",
    "gender": "female",
    "birthDate": "1995-05-15T00:00:00.000Z",
    "viloyat": { /* region object */ },
    "tuman": { /* region object */ },
    "mfy": { /* region object */ },
    "avatar": "data:image/png;base64,...",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Ism yoki familiya 2 belgidan kam
  - Jins noto'g'ri
  - Tug'ilgan sana noto'g'ri format
- `404`: Nomzod topilmadi
- `500`: Server xatosi

---

### 3. Parolni yangilash

Nomzodning parolini yangilash.

**Endpoint:** `PATCH /me/password`

**Request Body:**
```json
{
  "currentPassword": "eski_parol",
  "newPassword": "yangi_parol"
}
```

**Field Descriptions:**
- `currentPassword` (required): Joriy parol
- `newPassword` (required): Yangi parol (min 6 belgi)

**Response:**
```json
{
  "success": true,
  "message": "Parol yangilandi"
}
```

**Error Responses:**
- `400`: 
  - Joriy parol yoki yangi parol kiritilmagan
  - Yangi parol 6 belgidan kam
  - Joriy parol noto'g'ri
- `404`: Nomzod topilmadi
- `500`: Server xatosi

---

### 4. Avatarni yangilash

Nomzodning avatar rasmini yangilash (base64 format).

**Endpoint:** `PATCH /me/avatar`

**Request Body:**
```json
{
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Field Descriptions:**
- `avatar` (required): Base64 formatdagi rasm
  - Format: `data:image/{type};base64,{base64_data}`
  - Qo'llab-quvvatlanadigan formatlar: `png`, `jpg`, `jpeg`, `gif`, `webp`
  - Maksimal hajmi: 5MB

**Response:**
```json
{
  "success": true,
  "message": "Avatar yangilandi",
  "data": {
    "_id": "applicant_id",
    "firstName": "Ism",
    "lastName": "Familiya",
    "phone": "+998901234567",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "viloyat": { /* region object */ },
    "tuman": { /* region object */ },
    "mfy": { /* region object */ },
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Avatar kiritilmagan
  - Avatar base64 formatida emas
  - Avatar hajmi 5MB dan oshgan
- `404`: Nomzod topilmadi
- `500`: Server xatosi

**Eslatma:**
- Avatar base64 formatida bo'lishi kerak
- Format: `data:image/png;base64,{base64_data}` yoki `data:image/jpeg;base64,{base64_data}`
- Maksimal hajmi: 5MB

---

### 5. Manzilni yangilash

Nomzodning manzil ma'lumotlarini yangilash (viloyat, tuman, MFY).

**Endpoint:** `PATCH /me/location`

**Request Body:**
```json
{
  "viloyat": "viloyat_region_id",
  "tuman": "tuman_region_id",
  "mfy": "mfy_region_id"
}
```

**Field Descriptions:**
- `viloyat` (optional): Viloyat region ID
- `tuman` (optional): Tuman region ID (viloyatga tegishli bo'lishi kerak)
- `mfy` (optional): MFY region ID (tumanga tegishli bo'lishi kerak)

**Response:**
```json
{
  "success": true,
  "message": "Manzil yangilandi",
  "data": {
    "_id": "applicant_id",
    "firstName": "Ism",
    "lastName": "Familiya",
    "phone": "+998901234567",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "viloyat": {
      "_id": "region_id",
      "name": "Andijon viloyati",
      "type": "region",
      "code": "17"
    },
    "tuman": {
      "_id": "region_id",
      "name": "Buloqboshi tumani",
      "type": "district",
      "code": "1701"
    },
    "mfy": {
      "_id": "region_id",
      "name": "Buyuk turon MFY",
      "type": "mfy",
      "code": "1701001"
    },
    "avatar": "data:image/png;base64,...",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Viloyat topilmadi yoki noto'g'ri tur
  - Tuman topilmadi yoki noto'g'ri tur
  - Tuman tanlangan viloyatga tegishli emas
  - MFY topilmadi yoki noto'g'ri tur
  - MFY tanlangan tumanga tegishli emas
  - Noto'g'ri region ID
- `404`: Nomzod topilmadi
- `500`: Server xatosi

**Eslatma:**
- Regionlar ierarxiyasi tekshiriladi (viloyat > tuman > MFY)
- Tuman tanlangan viloyatga tegishli bo'lishi kerak
- MFY tanlangan tumanga tegishli bo'lishi kerak

---

## Ma'lumotlar tuzilishi

### Applicant Object
```typescript
{
  _id: ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  viloyat: Region;
  tuman: Region;
  mfy: Region;
  avatar: string | null; // base64 format
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### Region Object
```typescript
{
  _id: ObjectId;
  name: string;
  type: 'region' | 'district' | 'mfy';
  code: string;
}
```

---

## Eslatmalar

1. **Autentifikatsiya:** Barcha endpointlar JWT token talab qiladi. Token `vacancy_applicant` role bilan yaratilgan bo'lishi kerak.

2. **Avatar Format:** Avatar base64 formatida bo'lishi kerak. Format: `data:image/{type};base64,{base64_data}`. Qo'llab-quvvatlanadigan formatlar: `png`, `jpg`, `jpeg`, `gif`, `webp`. Maksimal hajmi: 5MB.

3. **Region Hierarchy:** Manzil yangilashda regionlar ierarxiyasi tekshiriladi. Tuman tanlangan viloyatga, MFY tanlangan tumanga tegishli bo'lishi kerak.

4. **Password Security:** Parol yangilashda joriy parol tekshiriladi va yangi parol hash qilinadi.

5. **Partial Updates:** Barcha yangilash endpointlari qisman yangilashni qo'llab-quvvatlaydi. Faqat yuborilgan maydonlar yangilanadi.

---

## Misollar

### Profil ma'lumotlarini olish
```bash
curl -X GET "http://localhost:5000/api/vacancy-profile/me" \
  -H "Authorization: Bearer <token>"
```

### Profil ma'lumotlarini yangilash
```bash
curl -X PUT "http://localhost:5000/api/vacancy-profile/me" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Yangi ism",
    "lastName": "Yangi familiya",
    "gender": "female",
    "birthDate": "1995-05-15"
  }'
```

### Parolni yangilash
```bash
curl -X PATCH "http://localhost:5000/api/vacancy-profile/me/password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "eski_parol",
    "newPassword": "yangi_parol"
  }'
```

### Avatarni yangilash
```bash
curl -X PATCH "http://localhost:5000/api/vacancy-profile/me/avatar" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }'
```

### Manzilni yangilash
```bash
curl -X PATCH "http://localhost:5000/api/vacancy-profile/me/location" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "viloyat_region_id",
    "tuman": "tuman_region_id",
    "mfy": "mfy_region_id"
  }'
```

---

## Xatoliklar

### 400 Bad Request
- Maydonlar validatsiyadan o'tmadi
- Format noto'g'ri
- Ierarxiya qoidasi buzilgan

### 401 Unauthorized
- Token kiritilmagan yoki noto'g'ri
- Token muddati o'tgan

### 404 Not Found
- Nomzod topilmadi
- Region topilmadi

### 500 Internal Server Error
- Server xatosi
- Ma'lumotlar bazasi xatosi





