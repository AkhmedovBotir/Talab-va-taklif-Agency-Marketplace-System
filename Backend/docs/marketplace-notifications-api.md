# Marketplace user Notifications API

Marketplace foydalanuvchilari uchun notification inbox:
- faqat `target_type = marketplace` va `target_type = all` yozuvlar ko'rinadi
- bitta notificationni o'qildi qilish
- hammasini o'qildi qilish
- `unread_count` (ro'yxat javobida va alohida endpoint)
- real-time socket orqali qabul qilish

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <marketplace_jwt>` (marketplace login tokeni)

Barcha marshrutlar `/marketplace/me` ostida.

## 1) Ro'yxat

`GET /marketplace/me/notifications?page=1&limit=10`

Response (`data`):
- `items`, `total`, `unread_count`, `page`, `limit`, `total_pages`

Har bir element (`data.items[*]`):
- `id`, `title`, `message`, `type`, `target_type`, `is_read`, `read_at`, `created_at`, `updated_at`

### Xabar turi (`type`)

| Qiymat | Ma'nosi (tavsiya) |
|--------|-------------------|
| `info` | Umumiy ma'lumot |
| `warning` | Ogohlantirish |
| `success` | Ijobiy natija |
| `error` | Xato yoki muhim muammo |
| `update` | Tizim/yangilanish xabari |
| `announcement` | Rasmiy e'lon |

### Nishon (`target_type`) — marketplace user uchun

Inboxda faqat:
- `all` — hammaga
- `marketplace` — faqat marketplace foydalanuvchilariga

## 2) O'qilmaganlar soni

`GET /marketplace/me/notifications/unread-count`

Response `data`: `{ "unread_count": 3 }`

## 3) Bittasini o'qildi qilish

`PATCH /marketplace/me/notifications/:id/read`

## 4) Hammasini o'qildi qilish

`PATCH /marketplace/me/notifications/read-all`

## 5) Real-time Socket

`GET /marketplace/me/notifications/ws`

Browser uchun: `ws://localhost:8081/api/v1/marketplace/me/notifications/ws?token=<marketplace_jwt>`

Event: `integration_notification_created` — `target_type` `marketplace` yoki `all` bo'lgan yozuvlar socketga yetadi.
