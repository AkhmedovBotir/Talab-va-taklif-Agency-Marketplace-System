# Mahalla do'kon (local shop) Notifications API

Mahalla do'konlari uchun notification inbox:
- faqat `target_type = localshops` va `target_type = all` yozuvlar ko'rinadi
- bitta notificationni o'qildi qilish
- hammasini o'qildi qilish
- `unread_count` (ro'yxat javobida va alohida endpoint)
- real-time socket orqali qabul qilish

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <local_shop_jwt>` (mahalla do'kon login tokeni)

Barcha marshrutlar `/local-shops/me` ostida.

## 1) Ro'yxat

`GET /local-shops/me/notifications?page=1&limit=10`

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

### Nishon (`target_type`) — mahalla do'kon uchun

Inboxda faqat:
- `all` — hammaga
- `localshops` — faqat mahalla do'konlarga (integratsiya API dagi qiymat)

## 2) O'qilmaganlar soni

`GET /local-shops/me/notifications/unread-count`

Response `data`: `{ "unread_count": 3 }`

## 3) Bittasini o'qildi qilish

`PATCH /local-shops/me/notifications/:id/read`

## 4) Hammasini o'qildi qilish

`PATCH /local-shops/me/notifications/read-all`

## 5) Real-time Socket

`GET /local-shops/me/notifications/ws`

Browser uchun: `ws://localhost:8081/api/v1/local-shops/me/notifications/ws?token=<local_shop_jwt>`

Event: `integration_notification_created` — `target_type` `localshops` yoki `all` bo'lgan yozuvlar socketga yetadi.
