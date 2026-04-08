# Manager Marketplace Users API

Menejer faqat o'z viloyatiga tegishli marketplace userlarni ko'radi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <manager_jwt>`

## Endpointlar

- `GET /managers/marketplace-users`
- `GET /managers/marketplace-users/:id`

## `GET /managers/marketplace-users`

Manager regioni avtomatik olinadi (`manager.region_id`) va ro'yxat shu viloyat bilan cheklanadi.

Query parametrlar:

- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)
- `status` (`active`, `inactive`, ...)
- `district_id`
- `mfy_id`
- `phone`
- `q` (ism/familiya bo'yicha qidiruv)

Javob:

```json
{
  "success": true,
  "message": "Viloyatingizdagi marketplace userlar ro'yxati olindi",
  "data": {
    "items": [
      {
        "id": 2,
        "phone": "+998900000002",
        "first_name": "Ali",
        "last_name": "Valiyev",
        "gender": "erkak",
        "avatar": "",
        "region_id": 1,
        "district_id": 10,
        "mfy_id": 101,
        "birth_date": "2000-01-01T00:00:00Z",
        "status": "active",
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-08T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  },
  "error": null
}
```

## `GET /managers/marketplace-users/:id`

Faqat managerning o'z viloyatidagi user bo'lsa qaytadi. Boshqa viloyatdagi yoki o'chirilgan (`status=deleted`) user uchun `404`.

