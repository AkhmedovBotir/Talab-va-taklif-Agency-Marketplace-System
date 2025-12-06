# Marketplace Reviews API Documentation

Marketplace foydalanuvchilari uchun baholash API.

## Base URL
```
/api/reviews
```

---

## Endpoints

### 1. Get Active Comment Templates

Baholash uchun mavjud shablonlarni olish.

**Endpoint:** `GET /api/reviews/templates`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "text": "Yaxshi",
      "order": 1
    },
    {
      "_id": "64abc124...",
      "text": "Yetkazish tez",
      "order": 2
    },
    {
      "_id": "64abc125...",
      "text": "Boshqa",
      "order": 3
    }
  ]
}
```

---

### 2. Create Review

Mahsulotni baholash va kommentariya qoldirish.

**Endpoint:** `POST /api/reviews`

**Headers:**
```
Authorization: Bearer <marketplace_user_token>
Content-Type: application/json
```

**Request Body:**

**Variant 1: Shablon tanlash**
```json
{
  "orderId": "64order123...",
  "productId": "64product123...",
  "rating": 5,
  "commentTemplateId": "64template123..."
}
```

**Variant 2: Maxsus kommentariya (ijobiy)**
```json
{
  "orderId": "64order123...",
  "productId": "64product123...",
  "rating": 5,
  "customComment": "Mahsulot juda yaxshi, sifat zo'r",
  "isPositive": true
}
```

**Variant 3: Maxsus kommentariya (salbiy)**
```json
{
  "orderId": "64order123...",
  "productId": "64product123...",
  "rating": 2,
  "customComment": "Mahsulot sifat yomon, yetkazish kechikdi",
  "isPositive": false
}
```

**Fields:**
- `orderId` (required) - Buyurtma ID
- `productId` (required) - Mahsulot ID
- `rating` (required) - Baholash (1-5)
- `commentTemplateId` (optional) - Shablon ID (shablon tanlansa)
- `customComment` (optional) - Maxsus kommentariya (agar "Boshqa" tanlansa)
- `isPositive` (optional) - Ijobiy/salbiy (true/false). Faqat `customComment` bilan birga ishlatiladi.

**Response (201):**
```json
{
  "success": true,
  "message": "Baholash yaratildi",
  "data": {
    "_id": "64review123...",
    "order": "64order123...",
    "product": {
      "_id": "64product123...",
      "name": "Mahsulot nomi",
      "images": ["url1", "url2"]
    },
    "user": "64user123...",
    "rating": 5,
    "commentTemplate": {
      "_id": "64template123...",
      "text": "Yaxshi",
      "order": 1
    },
    "customComment": null,
    "contact": null,
    "isPositive": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Eslatmalar:**
- Buyurtma faqat `confirmed_by_customer` holatida bo'lishi kerak
- Har bir mahsulot uchun faqat bitta baholash mumkin
- Agar `customComment` va `isPositive` berilsa, aloqa yaratiladi (admin ko'radi)

---

### 3. Get Product Reviews

Mahsulot baholashlarini olish (public endpoint).

**Endpoint:** `GET /api/reviews/product/:productId`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64review123...",
      "user": {
        "_id": "64user123...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "rating": 5,
      "commentTemplate": {
        "_id": "64template123...",
        "text": "Yaxshi",
        "order": 1
      },
      "customComment": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "statistics": {
    "averageRating": 4.5,
    "totalReviews": 25
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Eslatma:** Public endpointda `contact` va `isPositive` ko'rsatilmaydi.

---

## Workflow

### Baholash jarayoni:

1. **Buyurtma tasdiqlangan** - Mijoz buyurtmani `confirmed_by_customer` holatiga o'tkazadi

2. **Shablonlar olinadi** - `GET /api/reviews/templates` orqali mavjud shablonlar olinadi

3. **Baholash yuboriladi:**
   - **Shablon tanlash:** `commentTemplateId` beriladi
   - **Maxsus kommentariya:** `customComment` va `isPositive` beriladi
     - `isPositive: true` - Ijobiy fikr
     - `isPositive: false` - Salbiy fikr (admin aloqa qismida ko'radi)

4. **Agar salbiy fikr bo'lsa:**
   - `ReviewContact` yaratiladi
   - Admin panelda "Aloqalar" bo'limida ko'rinadi
   - Admin holatini yangilaydi (pending → in_progress → resolved)

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bu mahsulot uchun baholash allaqachon mavjud"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Faqat mijoz tomonidan tasdiqlangan buyurtmalarni baholash mumkin"
}
```

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
  "message": "Bu buyurtma sizga tegishli emas"
}
```

---

## Examples

### Example 1: Shablon tanlash

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "64order123...",
    "productId": "64product123...",
    "rating": 5,
    "commentTemplateId": "64template123..."
  }'
```

### Example 2: Ijobiy maxsus kommentariya

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "64order123...",
    "productId": "64product123...",
    "rating": 5,
    "customComment": "Mahsulot juda yaxshi, sifat zo'r",
    "isPositive": true
  }'
```

### Example 3: Salbiy maxsus kommentariya (aloqa yaratiladi)

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "64order123...",
    "productId": "64product123...",
    "rating": 2,
    "customComment": "Mahsulot sifat yomon, yetkazish kechikdi",
    "isPositive": false
  }'
```

---

## Notes

1. **Rating:** 1-5 ballik tizim
2. **Shablonlar:** Faqat admin tomonidan yaratiladi va boshqariladi
3. **Aloqalar:** Salbiy fikrlar (`isPositive: false`) admin panelda aloqa sifatida ko'rinadi
4. **Bir mahsulot - bir baholash:** Har bir mahsulot uchun faqat bitta baholash mumkin
5. **Buyurtma holati:** Faqat `confirmed_by_customer` holatidagi buyurtmalar baholanadi





