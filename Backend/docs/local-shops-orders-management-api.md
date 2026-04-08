# Local Shops Orders Management API

Maxalla do'koni o'ziga tushgan buyurtmalarni ko'radi, tasdiqlaydi, bekor qiladi va tasdiqlangandan keyin kuryer biriktiradi.

Base URL: `http://localhost:8081/api/v1`

Auth:

`Authorization: Bearer <local_shop_token>`

## Endpointlar

- `GET /local-shops/me/orders`
- `GET /local-shops/me/orders/{id}`
- `PATCH /local-shops/me/orders/{id}/approve`
- `PATCH /local-shops/me/orders/{id}/cancel`
- `PATCH /local-shops/me/orders/{id}/assign-courier`
- `PATCH /local-shops/me/orders/{id}/accept-payment`
- `GET /local-shops/me/orders/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Status oqimi

- `pending` -> `approved` (do'kon tasdiqlaydi)
- `pending` yoki `approved` -> `cancelled` (do'kon bekor qiladi)
- `assign-courier` faqat `approved` holatda
- `accept-payment` faqat kuryer to'lovni do'konga topshirganidan keyin

## 1) Buyurtmalar ro'yxati

`GET /local-shops/me/orders?page=1&limit=10`

Javob:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

## 2) Bitta buyurtma

`GET /local-shops/me/orders/{id}`

Buyurtma maydonlari:
- `id`, `user_id`, `local_shop_id`, `status`
- `buyer` (buyurtmachi to'liq ma'lumotlari: `id`, `phone`, `first_name`, `last_name`, `gender`, `avatar`, `region_id`, `district_id`, `mfy_id`, `birth_date`, `status`, `created_at`, `updated_at`)
- `can_approve`, `can_cancel`, `can_assign_courier`
- `assigned_courier_id`, `courier_assigned_at`
- `payment_transferred_to_shop_at`, `shop_payment_accepted_at`
- `total_amount`, `extra_phone`, `address_note`
- `items[]`

## 3) Tasdiqlash

`PATCH /local-shops/me/orders/{id}/approve`

Faqat `pending` buyurtmaga ruxsat.

## 4) Bekor qilish

`PATCH /local-shops/me/orders/{id}/cancel`

Faqat `pending` yoki `approved` buyurtmaga ruxsat.

## 5) Kuryer biriktirish

`PATCH /local-shops/me/orders/{id}/assign-courier`

Body:

```json
{
  "courier_id": 4
}
```

Qoidalar:
- buyurtma `approved` bo'lishi kerak
- `courier_id` shu do'konga tegishli bo'lishi kerak

## 6) To'lovni qabul qilish

`PATCH /local-shops/me/orders/{id}/accept-payment`

Qoidalar:
- buyurtmada `payment_transferred_to_shop_at` bo'lishi kerak
- muvaffaqiyatli bo'lsa `shop_payment_accepted_at` to'ldiriladi

## 7) Analitika

`GET /local-shops/me/orders/analytics?from=2026-04-01&to=2026-04-30`

Qaytaradi:
- `total_orders`
- `total_amount`
- `delivered_amount`
- `undelivered_amount`
- `transferred_amount`
- `untransferred_amount`

## Status kodlar

- `200` — muvaffaqiyatli
- `400` — noto'g'ri request yoki kuryer topilmadi
- `401` — token yaroqsiz
- `404` — buyurtma topilmadi
- `409` — status bo'yicha amaliyotga ruxsat yo'q
- `500` — server xatoligi
