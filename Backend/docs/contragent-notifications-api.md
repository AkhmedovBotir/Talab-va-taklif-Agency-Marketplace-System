# Contragent Notifications API

Kontragentlar uchun notification API endpointlari.

## Base URL
```
/api/contragents
```

---

## Socket.io Events

### Client -> Server

```javascript
// Room'ga qo'shilish
socket.emit('join:room', {
  userType: 'contragents',
  userId: '64contragent123...'
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

**Endpoint:** `GET /api/contragents/notifications/list`

**Headers:**
```
Authorization: Bearer <contragent_token>
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
      "title": "Yangi mahsulotlar!",
      "message": "Yangi mahsulotlar katalogga qo'shildi",
      "type": "info",
      "targetType": "contragents",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

### 2. O'qilmagan notificationlar soni

**Endpoint:** `GET /api/contragents/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <contragent_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 4
  }
}
```

---

### 3. Notificationni o'qildi deb belgilash

**Endpoint:** `POST /api/contragents/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <contragent_token>
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

**Endpoint:** `POST /api/contragents/notifications/read-all`

**Headers:**
```
Authorization: Bearer <contragent_token>
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


