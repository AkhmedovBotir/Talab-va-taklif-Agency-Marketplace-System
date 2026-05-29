# NoAuth Punkts API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/punkts?page=1&limit=10&q=`

## Qisqa tavsif

- Faqat `active` punktlar qaytadi.
- `q` bo'yicha `name` qidiruvi ishlaydi.

## Javob

```json
{
  "items": [
    {
      "id": 1,
      "name": "Punkt Nomi",
      "viloyat_id": 1,
      "tuman_id": 10,
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```
