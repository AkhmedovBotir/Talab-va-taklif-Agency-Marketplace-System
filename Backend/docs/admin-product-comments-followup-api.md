# Admin Product Comments Follow-up API

Admin barcha contragent mahsulot kommentlari va menejer/admin harakatlarini kuzatadi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <admin_jwt>` (General admin)

## Endpointlar

- `GET /product-comments?page=1&limit=10&status=open&escalated=true`
- `GET /product-comments/:rating_id`
- `POST /product-comments/:rating_id/notes`
- `POST /product-comments/:rating_id/calls`
- `POST /product-comments/:rating_id/resolve`

## Nima ko'rinadi

- Product rating (`score`, `note`, template comment)
- User ma'lumotlari (`phone`, ism/familiya, region)
- Mahsulot va contragent ma'lumotlari
- Case holati (`open`, `escalated_to_admin`, `resolved`)
- To'liq activity log (manager/admin yozgan note, call, escalate, resolve)

## Action body

```json
{
  "note": "Mijozga qo'ng'iroq qilindi, masala hal qilindi"
}
```

