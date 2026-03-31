# NoAuth Categories API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpointlar

- `GET /noauth/categories?page=1&limit=10`
- `GET /noauth/categories/{id}`
- `GET /noauth/subcategories?page=1&limit=10&parent_id=`
- `GET /noauth/subcategories/{id}`

## Qisqa tavsif

- `categories` faqat root kategoriyalar (`parent_id = null`).
- `subcategories` faqat ichki kategoriyalar (`parent_id != null`).
- Barchasi `active` status bo'yicha.

## Paginated javob

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```
