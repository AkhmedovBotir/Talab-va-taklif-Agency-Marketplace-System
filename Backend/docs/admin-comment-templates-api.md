# Admin Kommentariya Shablonlari API

Admin uchun kommentariya shablonlarini boshqarish: CRUD va o'rnini almashtirish.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <admin_jwt>`

## Endpointlar

- `POST /comment-templates`
- `GET /comment-templates?page=1&limit=10`
- `GET /comment-templates/{id}`
- `PUT /comment-templates/{id}`
- `DELETE /comment-templates/{id}`
- `PATCH /comment-templates/reorder`

## Model

```json
{
  "id": 1,
  "comment": "Hozircha xizmat ko'rsatib bo'lmaydi.",
  "sort_order": 1,
  "status": "active",
  "created_at": "2026-04-07T12:00:00Z",
  "updated_at": "2026-04-07T12:00:00Z"
}
```

## Reorder

`PATCH /comment-templates/reorder`

Body:

```json
{
  "from_id": 5,
  "to_id": 2
}
```

Natija: `from_id` va `to_id` shablonlarning `sort_order` qiymatlari o'zaro almashtiriladi.

## Xatolar

- `400` — noto'g'ri so'rov, `comment/status` xato, yoki `from_id/to_id` noto'g'ri
- `404` — shablon topilmadi
- `500` — server xatosi
