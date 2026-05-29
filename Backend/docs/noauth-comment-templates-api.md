# NoAuth Comment Templates API

Marketplace rating uchun comment shablonlarini public olish API.

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

### GET `/noauth/comment-templates`

## Response (`data`)

```json
[
  {
    "id": 1,
    "comment": "Sifatli mahsulot",
    "sort_order": 1
  },
  {
    "id": 2,
    "comment": "Yaxshi yetkazib berildi",
    "sort_order": 2
  }
]
```

## Izoh

- Faqat `status = active` shablonlar qaytadi.
- Tartib `sort_order` bo'yicha (keyin `id`).
