# Yetkazuvchi (delivery provider) Notifications API

Mahalliy do'kon yetkazuvchilari uchun notification inbox:
- faqat `target_type = deliveryproviders` va `target_type = all` yozuvlar ko'rinadi
- bitta notificationni o'qildi qilish
- hammasini o'qildi qilish
- `unread_count` (ro'yxat javobida va alohida endpoint)
- real-time socket orqali qabul qilish

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <delivery_provider_jwt>` (yetkazuvchi login tokeni)

Barcha marshrutlar `/delivery-providers/me` ostida — ya'ni yetkazuvchi autentifikatsiyasi talab qilinadi.

## 1) Ro'yxat

`GET /delivery-providers/me/notifications?page=1&limit=10`

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
- `target_type` — `deliveryproviders` yoki `all`
- `is_read` (bool)
- `read_at` (nullable)
- `created_at`
- `updated_at`

### Xabar turi (`type`)

`type` maydoni UI da stil/rang tanlash uchun. Integratsiya notification CRUD orqali yaratilganda backend quyidagi qiymatlarni qabul qiladi.

| Qiymat | Ma'nosi (tavsiya) |
|--------|-------------------|
| `info` | Umumiy ma'lumot |
| `warning` | Ogohlantirish |
| `success` | Ijobiy natija |
| `error` | Xato yoki muhim muammo |
| `update` | Tizim/yangilanish xabari |
| `announcement` | Rasmiy e'lon |

### Nishon (`target_type`) — yetkazuvchi uchun

Yetkazuvchi inboxda faqat:
- `all` — hammaga yuborilgan xabarlar
- `deliveryproviders` — faqat yetkazuvchilarga yuborilgan xabarlar

Boshqa nishonlar (`admins`, `agents`, `punkts`, …) yetkazuvchi API da ko'rinmaydi.

## 2) O'qilmaganlar soni (badge)

`GET /delivery-providers/me/notifications/unread-count`

Response `data`:
```json
{ "unread_count": 3 }
```

## 3) Bittasini o'qildi qilish

`PATCH /delivery-providers/me/notifications/:id/read`

- `200` — `"Notification o'qildi deb belgilandi"`
- `404` — topilmadi yoki yetkazuvchi uchun ko'rinmaydi

## 4) Hammasini o'qildi qilish

`PATCH /delivery-providers/me/notifications/read-all`

- `200` — `"Barcha notificationlar o'qildi deb belgilandi"`

## 5) Real-time Socket

`GET /delivery-providers/me/notifications/ws`

Auth:
- Browser WebSocket uchun query token:
  - `ws://localhost:8081/api/v1/delivery-providers/me/notifications/ws?token=<delivery_provider_jwt>`

Event formati (boshqa rollar bilan bir xil):
```json
{
  "event": "integration_notification_created",
  "notification": {
    "id": 123,
    "title": "Title",
    "message": "Message",
    "type": "info",
    "target_type": "deliveryproviders",
    "created_at": "2026-04-08T03:00:00Z",
    "updated_at": "2026-04-08T03:00:00Z"
  },
  "sent_at": "2026-04-08T03:00:01Z"
}
```

Eslatma: `target_type=deliveryproviders` va `target_type=all` eventlar yetkazuvchi socketiga yetkaziladi.
