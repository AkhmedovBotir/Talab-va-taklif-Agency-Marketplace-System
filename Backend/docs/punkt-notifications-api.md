# Punkt Notifications API

Punktlar uchun notification API endpointlari.

## Base URL
```
/api/punkts
```

---

## Socket.io Events

### Client -> Server

```javascript
// Room'ga qo'shilish
socket.emit('join:room', {
  userType: 'punkts',
  userId: '64punkt123...'
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

**Endpoint:** `GET /api/punkts/notifications/list`

**Headers:**
```
Authorization: Bearer <punkt_token>
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
      "title": "Yangi aksiya!",
      "message": "Barcha mahsulotlarga 20% chegirma",
      "type": "promotion",
      "targetType": "punkts",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

---

### 2. O'qilmagan notificationlar soni

**Endpoint:** `GET /api/punkts/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### 3. Notificationni o'qildi deb belgilash

**Endpoint:** `POST /api/punkts/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <punkt_token>
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

**Endpoint:** `POST /api/punkts/notifications/read-all`

**Headers:**
```
Authorization: Bearer <punkt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Barcha notificationlar o'qildi deb belgilandi"
}
```

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


