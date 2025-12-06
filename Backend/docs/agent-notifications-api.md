# Agent Notifications API

Viloyat, Tuman va MFY agentlari uchun notification API endpointlari.

## Base URL
```
/api/agents
```

---

## Socket.io Events

### Client -> Server

```javascript
// Viloyat agent uchun
socket.emit('join:room', {
  userType: 'viloyat_agents',
  userId: '64agent123...'
});

// Tuman agent uchun
socket.emit('join:room', {
  userType: 'tuman_agents',
  userId: '64agent123...'
});

// MFY agent uchun
socket.emit('join:room', {
  userType: 'mfy_agents',
  userId: '64agent123...'
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

**Endpoint:** `GET /api/agents/notifications/list`

**Headers:**
```
Authorization: Bearer <agent_token>
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
      "title": "Yangi vazifa!",
      "message": "Sizga yangi buyurtma tayinlandi",
      "type": "info",
      "targetType": "viloyat_agents",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

**Eslatma:** Agent o'z roliga (viloyat/tuman/mfy) mos notificationlarni ko'radi. Masalan, viloyat agenti `all` va `viloyat_agents` targetType li notificationlarni ko'radi.

---

### 2. O'qilmagan notificationlar soni

**Endpoint:** `GET /api/agents/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

---

### 3. Notificationni o'qildi deb belgilash

**Endpoint:** `POST /api/agents/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <agent_token>
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

**Endpoint:** `POST /api/agents/notifications/read-all`

**Headers:**
```
Authorization: Bearer <agent_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Barcha notificationlar o'qildi deb belgilandi"
}
```

---

## Agent Types

| Type | Target Type | Description |
|------|-------------|-------------|
| Viloyat Agent | `viloyat_agents` | Viloyat darajasidagi agent |
| Tuman Agent | `tuman_agents` | Tuman darajasidagi agent |
| MFY Agent | `mfy_agents` | MFY darajasidagi agent |

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


