# Marketplace User Notifications API

Marketplace foydalanuvchilari uchun notification API endpointlari.

## Base URL
```
/api/marketplace
```

---

## Socket.io Events

### Client -> Server

```javascript
// Room'ga qo'shilish
socket.emit('join:room', {
  userType: 'marketplace_users',
  userId: '64user123...'
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

**Endpoint:** `GET /api/marketplace/notifications/list`

**Headers:**
```
Authorization: Bearer <marketplace_user_token>
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
      "title": "Maxsus aksiya!",
      "message": "Faqat bugun! Barcha mahsulotlarga 30% chegirma",
      "type": "promotion",
      "targetType": "marketplace_users",
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

**Endpoint:** `GET /api/marketplace/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <marketplace_user_token>
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

**Endpoint:** `POST /api/marketplace/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <marketplace_user_token>
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

**Endpoint:** `POST /api/marketplace/notifications/read-all`

**Headers:**
```
Authorization: Bearer <marketplace_user_token>
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

---

## Flutter Integration Example

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class NotificationService {
  late IO.Socket socket;
  
  void connect(String userId) {
    socket = IO.io('http://your-server:5000', <String, dynamic>{
      'transports': ['websocket'],
    });
    
    // Join room
    socket.emit('join:room', {
      'userType': 'marketplace_users',
      'userId': userId
    });
    
    // Listen for new notifications
    socket.on('notification:new', (data) {
      // Show local notification
      showNotification(data['title'], data['message']);
    });
    
    // Listen for unread count updates
    socket.on('notification:unread_count', (data) {
      // Update badge count
      updateBadge(data['unreadCount']);
    });
  }
}
```


