# Notifications API Documentation

Admin tomonidan Punktlar, Viloyat/Tuman/MFY agentlari va Marketplace foydalanuvchilariga xabarlar yuborish uchun API.

## Base URL
```
/api/notifications
```

---

## Socket.io Events

### Client Events (Client -> Server)

#### `join:room`
Foydalanuvchi o'z room'iga qo'shilish uchun.

```javascript
socket.emit('join:room', {
  userType: 'punkts', // 'punkts' | 'viloyat_agents' | 'tuman_agents' | 'mfy_agents' | 'marketplace_users'
  userId: '64abc123...' // Foydalanuvchi ID
});
```

#### `leave:room`
Room'dan chiqish.

```javascript
socket.emit('leave:room', {
  userType: 'punkts',
  userId: '64abc123...'
});
```

### Server Events (Server -> Client)

#### `notification:new`
Yangi xabar kelganda.

```javascript
socket.on('notification:new', (data) => {
  console.log(data);
  // {
  //   _id: '64abc123...',
  //   title: 'Yangi aksiya!',
  //   message: 'Barcha mahsulotlarga 20% chegirma',
  //   type: 'promotion',
  //   targetType: 'punkts',
  //   createdAt: '2024-01-15T10:30:00.000Z'
  // }
});
```

---

## Admin Endpoints

### 1. Create Notification

Yangi xabar yaratish va yuborish.

**Endpoint:** `POST /api/notifications`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Yangi aksiya!",
  "message": "Barcha mahsulotlarga 20% chegirma. Bu aksiya 1 hafta davom etadi.",
  "type": "promotion",
  "targetType": "punkts",
  "targetIds": [],
  "viloyatId": null,
  "tumanId": null,
  "mfyId": null
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Xabar sarlavhasi (max 200 chars) |
| message | string | Yes | Xabar matni (max 2000 chars) |
| type | string | No | Xabar turi: `info`, `warning`, `success`, `error`, `announcement`, `promotion`, `update`. Default: `info` |
| targetType | string | Yes | Qabul qiluvchilar turi: `all`, `punkts`, `viloyat_agents`, `tuman_agents`, `mfy_agents`, `marketplace_users` |
| targetIds | array | No | Aniq foydalanuvchilar ID lari (bo'sh bo'lsa, barcha targetType ga yuboriladi) |
| viloyatId | ObjectId | No | Viloyat bo'yicha filter |
| tumanId | ObjectId | No | Tuman bo'yicha filter |
| mfyId | ObjectId | No | MFY bo'yicha filter |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Notification yaratildi va yuborildi",
  "data": {
    "_id": "64abc123...",
    "title": "Yangi aksiya!",
    "message": "Barcha mahsulotlarga 20% chegirma...",
    "type": "promotion",
    "targetType": "punkts",
    "targetIds": [],
    "sentBy": "64admin123...",
    "isActive": true,
    "readBy": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Notifications

Barcha xabarlarni olish (pagination bilan).

**Endpoint:** `GET /api/notifications`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Sahifa raqami |
| limit | number | 20 | Har sahifadagi elementlar soni |
| targetType | string | - | Filter by target type |
| type | string | - | Filter by notification type |
| isActive | boolean | - | Filter by active status |

**Example:**
```
GET /api/notifications?page=1&limit=10&targetType=punkts&type=promotion
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "title": "Yangi aksiya!",
      "message": "Barcha mahsulotlarga 20% chegirma...",
      "type": "promotion",
      "targetType": "punkts",
      "sentBy": {
        "_id": "64admin123...",
        "name": "Admin User",
        "username": "admin"
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 3. Get Notification by ID

**Endpoint:** `GET /api/notifications/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "title": "Yangi aksiya!",
    "message": "Barcha mahsulotlarga 20% chegirma...",
    "type": "promotion",
    "targetType": "punkts",
    "targetIds": [],
    "sentBy": {
      "_id": "64admin123...",
      "name": "Admin User",
      "username": "admin"
    },
    "readBy": [
      {
        "recipientId": "64punkt123...",
        "recipientType": "Punkt",
        "readAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Notification

**Endpoint:** `PUT /api/notifications/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Yangilangan sarlavha",
  "message": "Yangilangan xabar matni",
  "type": "info",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification yangilandi",
  "data": {
    "_id": "64abc123...",
    "title": "Yangilangan sarlavha",
    "message": "Yangilangan xabar matni",
    "type": "info",
    "isActive": false,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### 5. Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification o'chirildi"
}
```

---

### 6. Get Notification Statistics

**Endpoint:** `GET /api/notifications/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "byTargetType": [
      { "_id": "punkts", "count": 45, "activeCount": 40 },
      { "_id": "viloyat_agents", "count": 30, "activeCount": 25 },
      { "_id": "tuman_agents", "count": 35, "activeCount": 30 },
      { "_id": "mfy_agents", "count": 20, "activeCount": 15 },
      { "_id": "marketplace_users", "count": 20, "activeCount": 10 }
    ]
  }
}
```

---

## User Endpoints

### 7. Get My Notifications

Foydalanuvchi uchun xabarlarni olish.

**Endpoint:** `GET /api/notifications/my/:userType/:userId`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userType | string | `punkt`, `viloyat_agent`, `tuman_agent`, `mfy_agent`, `marketplace_user` |
| userId | string | Foydalanuvchi ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Sahifa raqami |
| limit | number | 20 | Har sahifadagi elementlar soni |

**Example:**
```
GET /api/notifications/my/punkt/64punkt123?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "title": "Yangi aksiya!",
      "message": "Barcha mahsulotlarga 20% chegirma...",
      "type": "promotion",
      "targetType": "punkts",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

---

### 8. Mark Notification as Read

Xabarni o'qildi deb belgilash.

**Endpoint:** `POST /api/notifications/:notificationId/read`

**Request Body:**
```json
{
  "recipientId": "64punkt123...",
  "recipientType": "Punkt"
}
```

**recipientType values:** `Punkt`, `Agent`, `MarketplaceUser`, `Contragent`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification o'qildi deb belgilandi"
}
```

---

## Target Types

| Value | Description |
|-------|-------------|
| `all` | Barcha foydalanuvchilarga |
| `punkts` | Barcha punktlarga |
| `viloyat_agents` | Viloyat agentlariga |
| `tuman_agents` | Tuman agentlariga |
| `mfy_agents` | MFY agentlariga |
| `marketplace_users` | Marketplace foydalanuvchilariga |
| `contragents` | Kontragentlarga |

---

## Notification Types

| Value | Description |
|-------|-------------|
| `info` | Oddiy ma'lumot |
| `warning` | Ogohlantirish |
| `success` | Muvaffaqiyat xabari |
| `error` | Xatolik xabari |
| `announcement` | E'lon |
| `promotion` | Aksiya/chegirma |
| `update` | Yangilanish xabari |

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Noto'g'ri user type"
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
  "message": "Notification topilmadi"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Notification yaratishda xatolik",
  "error": "Error message"
}
```

---

## Client Integration Example

### React/React Native

```javascript
import { io } from 'socket.io-client';

// Connect to socket
const socket = io('http://your-server-url:5000');

// Join room on login
const joinNotificationRoom = (userType, userId) => {
  socket.emit('join:room', { userType, userId });
};

// Listen for new notifications
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
  // Show toast/alert to user
  // Update notification badge count
});

// Usage
joinNotificationRoom('punkts', '64punkt123...');
```

### Flutter

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket socket = IO.io('http://your-server-url:5000', <String, dynamic>{
  'transports': ['websocket'],
});

// Join room
socket.emit('join:room', {
  'userType': 'punkts',
  'userId': '64punkt123...'
});

// Listen for notifications
socket.on('notification:new', (data) {
  print('New notification: $data');
});
```

