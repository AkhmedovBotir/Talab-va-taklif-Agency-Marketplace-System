# NoAuth Managers API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/managers?page=1&limit=10&q=`

## Qisqa tavsif

- Faqat `active` menejerlar qaytadi.
- `q` bo'yicha `name` qidiruvi ishlaydi.

## Javob

```json
{
  "items": [
    {
      "id": 1,
      "name": "Manager Nomi",
      "viloyat_id": 1,
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```
