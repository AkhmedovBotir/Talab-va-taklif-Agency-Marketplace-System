# NoAuth Products API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpointlar

- `GET /noauth/products?page=1&limit=10&category_id=&subcategory_id=&contragent_id=&q=`
- `GET /noauth/products/{id}`

## Qisqa tavsif

- Faqat `approved + active` mahsulotlar qaytadi.
- `q` bo'yicha `name/description` qidiruv ishlaydi.
- Javob formati: `message`, `data`, `error`.

## `GET /noauth/products` javobi

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

## `GET /noauth/products/{id}` javobi

- Topilsa: mahsulot obyekti.
- Topilmasa: `404` (`Mahsulot topilmadi`).
