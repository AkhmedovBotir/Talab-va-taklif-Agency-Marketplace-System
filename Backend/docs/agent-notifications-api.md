# Agent Notifications API

Agentlar uchun notification inbox:
- faqat `target_type = agents` va `target_type = all` yozuvlar ko'rinadi
- bitta notificationni o'qildi qilish
- hammasini o'qildi qilish
- `unread_count` (ro'yxat javobida va alohida endpoint)
- real-time socket orqali qabul qilish

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <agent_jwt>` (agent login tokeni)

Barcha marshrutlar `/agents/me` ostida — ya'ni agent autentifikatsiyasi talab qilinadi.

## 1) Ro'yxat

`GET /agents/me/notifications?page=1&limit=10`

Response (`data`):
- `items` — sahifadagi elementlar
- `total` — jami ko'rinadigan notificationlar soni
- `unread_count` — o'qilmaganlar soni (butun ro'yxat bo'yicha, sahifadan mustaqil)
- `page`, `limit`, `total_pages`

Har bir element (`data.items[*]`):
- `id`
- `title`
- `message`
- `type` — xabar turi (quyidagi jadval)
- `target_type` — `agents` yoki `all`
- `is_read` (bool)
- `read_at` (nullable)
- `created_at`
- `updated_at`

### Xabar turi (`type`)

`type` maydoni UI da stil/rang tanlash uchun. Backend faqat quyidagi qiymatlarni qabul qiladi (integratsiya CRUD orqali yaratiladi).

| Qiymat | Ma'nosi (tavsiya) |
|--------|-------------------|
| `info` | Umumiy ma'lumot |
| `warning` | Ogohlantirish |
| `success` | Ijobiy natija |
| `error` | Xato yoki muhim muammo |
| `update` | Tizim/yangilanish xabari |
| `announcement` | Rasmiy e'lon |

### Nishon (`target_type`) — agent uchun

Agent inboxda faqat:
- `all` — hammaga
- `agents` — faqat agentlarga

Boshqa nishonlar (`admins`, `marketplace`, …) agent API da ko'rinmaydi.

## 2) O'qilmaganlar soni (badge)

`GET /agents/me/notifications/unread-count`

Response `data`:
```json
{ "unread_count": 3 }
```

## 3) Bittasini o'qildi qilish

`PATCH /agents/me/notifications/:id/read`

- `200` — `"Notification o'qildi deb belgilandi"`
- `404` — topilmadi yoki agent uchun ko'rinmaydi

## 4) Hammasini o'qildi qilish

`PATCH /agents/me/notifications/read-all`

- `200` — `"Barcha notificationlar o'qildi deb belgilandi"`

## 5) Real-time Socket

`GET /agents/me/notifications/ws`

Auth:
- Browser WebSocket uchun query token:
  - `ws://localhost:8081/api/v1/agents/me/notifications/ws?token=<agent_jwt>`

Event formati (admin bilan bir xil):
```json
{
  "event": "integration_notification_created",
  "notification": {
    "id": 123,
    "title": "Title",
    "message": "Message",
    "type": "info",
    "target_type": "agents",
    "created_at": "2026-04-08T03:00:00Z",
    "updated_at": "2026-04-08T03:00:00Z"
  },
  "sent_at": "2026-04-08T03:00:01Z"
}
```

Eslatma: `target_type=agents` va `target_type=all` eventlar agent socketga yetkaziladi.
