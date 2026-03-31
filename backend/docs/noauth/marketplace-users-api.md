# NoAuth Marketplace Users API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/marketplace-users?page=1&limit=10&q=`

## Qisqa tavsif

- Faqat `active` marketplace userlar qaytadi.
- `q` bo'yicha `first_name` va `last_name` qidiruvi ishlaydi.
- Minimal maydonlar qaytadi: `id`, `first_name`, `last_name`.

## Javob

```json
{
  "items": [
    {
      "id": 2,
      "first_name": "Ali",
      "last_name": "Valiyev"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```
