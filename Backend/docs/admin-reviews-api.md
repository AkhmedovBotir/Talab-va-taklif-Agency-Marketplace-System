# Admin Reviews API Documentation

Admin tomonidan baholashlar va aloqalarni boshqarish uchun API.

## Base URL
```
/api/reviews
```

---

## Comment Template Management

### 1. Create Comment Template

Kommentariya shablonini yaratish.

**Endpoint:** `POST /api/reviews/admin/comment-templates`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Yaxshi",
  "order": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Kommentariya shabloni yaratildi",
  "data": {
    "_id": "64abc123...",
    "text": "Yaxshi",
    "order": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Comment Templates

**Endpoint:** `GET /api/reviews/admin/comment-templates`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `isActive` (optional) - Filter by active status

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "text": "Yaxshi",
      "order": 1,
      "isActive": true
    },
    {
      "_id": "64abc124...",
      "text": "Yetkazish tez",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

### 3. Update Comment Template

**Endpoint:** `PUT /api/reviews/admin/comment-templates/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Yaxshi (Updated)",
  "order": 1,
  "isActive": true
}
```

---

### 4. Delete Comment Template

**Endpoint:** `DELETE /api/reviews/admin/comment-templates/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### 5. Create Initial Templates

Boshlang'ich shablonlarni yaratish (faqat bir marta).

**Endpoint:** `POST /api/reviews/admin/initial-templates`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Boshlang'ich shablonlar yaratildi",
  "data": [
    {
      "_id": "64abc123...",
      "text": "Yaxshi",
      "order": 1,
      "isActive": true
    },
    {
      "_id": "64abc124...",
      "text": "Yetkazish tez",
      "order": 2,
      "isActive": true
    },
    {
      "_id": "64abc125...",
      "text": "Boshqa",
      "order": 3,
      "isActive": true
    }
  ]
}
```

---

## Reviews Management

### 6. Get All Reviews

**Endpoint:** `GET /api/reviews/admin`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `rating` (optional) - Filter by rating (1-5)
- `productId` (optional) - Filter by product
- `orderId` (optional) - Filter by order
- `isPositive` (optional) - Filter by positive/negative (true/false/null)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "order": {
        "_id": "64order123...",
        "orderNumber": "ORD-2024-001"
      },
      "product": {
        "_id": "64product123...",
        "name": "Mahsulot nomi",
        "images": ["url1", "url2"]
      },
      "user": {
        "_id": "64user123...",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+998901234567"
      },
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
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 7. Get Review by ID

**Endpoint:** `GET /api/reviews/admin/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## Contact Management

### 8. Get All Contacts

**Endpoint:** `GET /api/reviews/admin/contacts`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional) - pending, in_progress, resolved
- `isPositive` (optional) - true/false

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64contact123...",
      "review": {
        "_id": "64review123...",
        "order": {
          "orderNumber": "ORD-2024-001"
        },
        "product": {
          "name": "Mahsulot nomi",
          "images": ["url1"]
        },
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "+998901234567"
        }
      },
      "message": "Mahsulot sifat yomon",
      "isPositive": false,
      "status": "pending",
      "adminNotes": null,
      "resolvedAt": null,
      "resolvedBy": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
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

---

### 9. Get Positive Contacts

**Endpoint:** `GET /api/reviews/admin/contacts/positive`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional)

---

### 10. Get Negative Contacts

**Endpoint:** `GET /api/reviews/admin/contacts/negative`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional)

---

### 11. Get Contact Statistics

**Endpoint:** `GET /api/reviews/admin/contacts/statistics`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "positive": 60,
    "negative": 40,
    "pending": 20,
    "inProgress": 10,
    "resolved": 70
  }
}
```

---

### 12. Get Contact by ID

**Endpoint:** `GET /api/reviews/admin/contacts/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### 13. Update Contact Status

**Endpoint:** `PUT /api/reviews/admin/contacts/:id/status`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "resolved",
  "adminNotes": "Muammo hal qilindi"
}
```

**Status Values:**
- `pending` - Kutilmoqda
- `in_progress` - Jarayonda
- `resolved` - Hal qilindi

**Response (200):**
```json
{
  "success": true,
  "message": "Aloqa holati yangilandi",
  "data": {
    "_id": "64contact123...",
    "status": "resolved",
    "adminNotes": "Muammo hal qilindi",
    "resolvedAt": "2024-01-15T12:00:00.000Z",
    "resolvedBy": {
      "_id": "64admin123...",
      "name": "Admin User",
      "username": "admin"
    }
  }
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Bu tartib raqami allaqachon mavjud"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Kommentariya shabloni topilmadi"
}
```





