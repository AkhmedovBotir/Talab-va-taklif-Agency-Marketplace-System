# Vacancy Applicant Notifications API

Vakansiya nomzodlari uchun notification API endpointlari (punkt/marketplace bilan bir xil oqim).

## Base URL
```
/api/vacancy
```

---

## Socket.io Events

### Client -> Server

```javascript
// Room'ga qo'shilish (login bo'lgandan keyin)
socket.emit('join:room', {
  userType: 'vacancy_applicants',
  userId: '64applicant123...'
});
```

### Server -> Client

```javascript
// Yangi notification
socket.on('notification:new', (data) => {
  // { _id, title, message, type, targetType, createdAt }
});

// O'qilmagan soni yangilandi
socket.on('notification:unread_count', (data) => {
  // { unreadCount: 5 }
});
```

---

## Endpoints

### 1. Notificationlarni olish

**Endpoint:** `GET /api/vacancy/notifications/list`

**Headers:**
```
Authorization: Bearer <vacancy_applicant_token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Sahifa raqami |
| limit | number | 20 | Har sahifadagi elementlar |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "title": "Intervyuga taklif",
      "message": "Sizni intervyuga taklif qilamiz",
      "type": "info",
      "targetType": "vacancy_applicants",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### 2. O'qilmagan notificationlar soni

**Endpoint:** `GET /api/vacancy/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <vacancy_applicant_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 2
  }
}
```

---

### 3. Notificationni o'qildi deb belgilash

**Endpoint:** `POST /api/vacancy/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <vacancy_applicant_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification o'qildi deb belgilandi"
}
```

---

### 4. Barcha notificationlarni o'qildi deb belgilash

**Endpoint:** `POST /api/vacancy/notifications/read-all`

**Headers:**
```
Authorization: Bearer <vacancy_applicant_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Barcha notificationlar o'qildi deb belgilandi"
}
```

---

## Notification Types

| Type | Description |
|------|-------------|
| `info` | Oddiy ma'lumot |
| `warning` | Ogohlantirish |
| `success` | Muvaffaqiyat xabari |
| `error` | Xatolik xabari |
| `announcement` | E'lon |
| `promotion` | Aksiya/chegirma |
| `update` | Yangilanish xabari |

---

## Error Responses

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
  "message": "Notification topilmadi"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Server xatosi"
}
```



