# NoAuth Contragents API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/contragents?page=1&limit=10&nested_limit=30&include=&q=`

## Query paramlar

- `q` - kontragent nomi/INN/telefon bo'yicha qidiruv.
- `include` - `products`, `categories` (vergul bilan).
- `nested_limit` - ichki ro'yxatlar limiti (`1..100`).

## Javob

`data`:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```
