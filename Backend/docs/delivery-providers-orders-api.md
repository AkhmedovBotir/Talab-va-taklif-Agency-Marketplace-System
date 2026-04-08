# Delivery Providers Orders API

Yetkazib beruvchi o'ziga biriktirilgan buyurtmalarni boshqaradi.

Base URL: `http://localhost:8081/api/v1`

Auth:

`Authorization: Bearer <delivery_provider_token>`

## Endpointlar

- `GET /delivery-providers/me/orders/today`
- `GET /delivery-providers/me/orders/history`
- `GET /delivery-providers/me/orders/{id}`
- `PATCH /delivery-providers/me/orders/{id}/accept`
- `PATCH /delivery-providers/me/orders/{id}/deliver`
- `PATCH /delivery-providers/me/orders/{id}/collect-payment`
- `PATCH /delivery-providers/me/orders/{id}/transfer-payment-to-shop`

## Biznes oqimi

1. Kuryer buyurtmani qabul qiladi (`accept`)
2. Yetkazib bo'lgach `deliver` qiladi
3. To'lovni mijozdan olgach `collect-payment` qiladi
4. To'lovni do'konga topshirgach `transfer-payment-to-shop` qiladi

## Bugungi va tarix

- `today`: bugun yaratilgan va shu kuryerga biriktirilgan buyurtmalar
- `history`: bugundan oldingi buyurtmalar

Har ikkalasida ham pagination bor: `page`, `limit`.

## Status/o'tishlar

- `accept`: faqat do'kon tomonidan tasdiqlangan (`approved`) buyurtmaga
- `deliver`: faqat `accept` qilingan buyurtmaga
- `collect-payment`: faqat `delivered` buyurtmaga
- `transfer-payment-to-shop`: faqat to'lov qabul qilingan buyurtmaga

## Buyurtma obyekti

- `id`, `local_shop_id`, `user_id`, `status`, `total_amount`
- `courier_accepted_at`
- `delivered_at`
- `payment_collected_at`
- `payment_transferred_to_shop_at`
- `items[]` (`local_shop_product_id`, `product_name`, `quantity`, `unit`, `unit_price`, `line_total`)
- `created_at`, `updated_at`

## Status kodlar

- `200` — OK
- `400` — noto'g'ri id/query
- `401` — token yaroqsiz
- `404` — buyurtma topilmadi
- `409` — noto'g'ri bosqichda amal bajarildi
- `500` — server xatoligi
