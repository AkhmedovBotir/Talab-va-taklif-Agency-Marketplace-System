# Admin Notifications API

Adminlar uchun notification inbox:
- faqat `target_type = admins` va `target_type = all` yozuvlar ko'rinadi
- bitta notificationni o'qildi qilish
- hammasini o'qildi qilish
- real-time socket orqali qabul qilish

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <admin_jwt>`

## 1) Ro'yxat

`GET /admin-notifications?page=1&limit=10`

Response (`data`):
- `items` — sahifadagi elementlar
- `total` — jami ko'rinadigan notificationlar soni
- `unread_count` — o'qilmaganlar soni (butun ro'yxat bo'yicha, sahifadan mustaqil)
- `page`, `limit`, `total_pages`

Har bir element (`data.items[*]`):
- `id`
- `title`
- `message`
- `type`
- `target_type`
- `is_read` (bool)
- `read_at` (nullable)
- `created_at`
- `updated_at`

### Notification turi (`type`)

Integratsiya tomonidan yaratilgan har bir yozuvda `type` maydoni bor. Bu maydon **UI da qanday ko‘rinish/stil** tanlash uchun mo‘ljallangan (masalan, rang, ikonka). Backend faqat quyidagi qiymatlarni qabul qiladi; admin inbox va socket eventlarida ham shu stringlar keladi.

| Qiymat | Ma’nosi (tavsiya) |
|--------|-------------------|
| `info` | Umumiy ma’lumot, xabar |
| `warning` | Diqqat talab qiladigan ogohlantirish |
| `success` | Muvaffaqiyat / ijobiy natija |
| `error` | Xato yoki muhim muammo |
| `update` | Tizim/yangilanish haqida xabar |
| `announcement` | Rasmiy e’lon / muhim e’lon (barchaga yoki adminlarga ko‘rinadigan “yangilik”) |

**Eslatma:** `type` matn bo‘lib, ixtiyoriy biznes mantiq emas — frontend shu qiymatga qarab badge/rang tanlaydi. Noto‘g‘ri `type` integratsiya API da rad etiladi; admin faqat mavjud yozuvlarni o‘qiydi.

### Nishon (`target_type`) — admin uchun

Adminlar faqat quyidagi `target_type` li yozuvlarni ko‘radi (qolganlari inboxda yo‘q):
- `all` — hammaga yuborilgan (admin ham ichida)
- `admins` — faqat adminlarga

Boshqa nishonlar (`agents`, `marketplace`, …) integratsiya tomonida ishlatiladi; admin API ularni ro‘yxatda ko‘rsatmaydi.

## 2) Faqat o'qilmagan soni (badge)

`GET /admin-notifications/unread-count`

Response `data`:
```json
{ "unread_count": 3 }
```

## 3) Bittasini o'qildi qilish

`PATCH /admin-notifications/:id/read`

Response:
- `200` — `"Notification o'qildi deb belgilandi"`
- `404` — notification topilmadi yoki admin uchun ko'rinmaydi

## 4) Hammasini o'qildi qilish

`PATCH /admin-notifications/read-all`

Response:
- `200` — `"Barcha notificationlar o'qildi deb belgilandi"`

## 5) Real-time Socket

`GET /admin-notifications/ws`

Auth:
- Browser websocket uchun query token ham ishlaydi:
  - `ws://localhost:8081/api/v1/admin-notifications/ws?token=<admin_jwt>`

Yuboriladigan event:
```json
{
  "event": "integration_notification_created",
  "notification": {
    "id": 123,
    "title": "Title",
    "message": "Message",
    "type": "info",
    "target_type": "admins",
    "created_at": "2026-04-08T03:00:00Z",
    "updated_at": "2026-04-08T03:00:00Z"
  },
  "sent_at": "2026-04-08T03:00:01Z"
}
```

Eslatma:
- `target_type=admins` va `target_type=all` eventlar admin socketga yetkaziladi.
