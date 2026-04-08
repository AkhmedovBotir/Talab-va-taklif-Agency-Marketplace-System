# NoAuth Local Shop Products API

Base URL: `http://localhost:8081/api/v1`

Auth talab qilinmaydi.

## Endpoint

- `GET /noauth/local-shop-products`

## Query params

- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)
- `q` (ixtiyoriy, shablon nomi yoki do'kon nomi bo'yicha qidiruv)
- `district_id` (ixtiyoriy)
- `mfy_id` (ixtiyoriy)
- `local_shop_id` (ixtiyoriy)

## Qisqa tavsif

Bu endpoint maxalla do'koni mahsulotlarini qaytaradi va har bir item ichida:

- mahsulotning o'zi (`quantity`, `price`, `original_price`)
- shablon ma'lumotlari (`name`, `description`, `images`, `category_id`, `subcategory_id`, `unit`, `unit_size`)
- do'kon ma'lumotlari
- do'konning yetkazib berish hududlari (`delivery_areas`) qaytadi.

## Response (200) namunasi

```json
{
  "success": true,
  "message": "NoAuth maxalla do'koni mahsulotlari ro'yxati olindi",
  "data": {
    "items": [
      {
        "id": 7,
        "local_shop_id": 3,
        "template_id": 12,
        "quantity": 25,
        "price": 15000,
        "original_price": 17000,
        "template": {
          "id": 12,
          "name": "Shakar",
          "description": "{\"ops\":[{\"insert\":\"...\"}]}",
          "category_id": 2,
          "subcategory_id": 9,
          "unit": "kg",
          "unit_size": "1",
          "images": ["data:image/jpeg;base64,..."]
        },
        "shop": {
          "id": 3,
          "name": "Navro'z do'koni",
          "region_id": 1,
          "district_id": 12,
          "mfy_id": 144,
          "phone": "998901112233"
        },
        "delivery_areas": [
          { "mfy_id": 144, "mfy_name": "Yangi hayot" },
          { "mfy_id": 145, "mfy_name": "Do'stlik" }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

## Status kodlar

- `200` - OK
- `400` - query param noto'g'ri
- `500` - server xatoligi
