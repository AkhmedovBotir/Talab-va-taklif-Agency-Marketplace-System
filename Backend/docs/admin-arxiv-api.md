# Admin Arxiv API

Admin tomonidan o'chirilgan obyektlar arxivga yoziladi va keyin ko'rish mumkin.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <admin_jwt>` (general admin)

## Qachon arxivga yoziladi

Quyidagi entitylar `DELETE` qilinganda:
- `agent`
- `contragent`
- `local-shop`
- `marketplace-user`
- `punkt`

Arxivda saqlanadi:
- `entity_type`
- `entity_id`
- `deleted_by_id` (qaysi admin o'chirgan)
- `payload` (o'sha paytdagi to'liq snapshot + action metama'lumotlari)
- `archived_at`

## Routelar (`/api/v1/arxiv` dan keyin)

- `GET /agent?page=1&limit=10`
- `GET /agent/:id`
- `GET /contragent?page=1&limit=10`
- `GET /contragent/:id`
- `GET /local-shop?page=1&limit=10`
- `GET /local-shop/:id`
- `GET /marketplace-user?page=1&limit=10`
- `GET /marketplace-user/:id`
- `GET /punkt?page=1&limit=10`
- `GET /punkt/:id`

## Eslatma

- `:id` bu arxiv yozuvi IDsi (`admin_archive_logs.id`), entity ID emas.
- `payload` ichida quyidagi strukturada saqlanadi:
  - `action`: doim `delete`
  - `deleted_at`: o'chirish vaqti (UTC)
  - `deleted_by_admin_id`: o'chirgan admin ID
  - `snapshot`: o'chirishdan oldingi obyektning to'liq holati
  - `entity_type`: entity turi (`agent`, `contragent`, `local-shop`, `marketplace-user`, `punkt`)
  - `related`: o'sha entity bilan bog'liq barcha asosiy ish jadvallari

## `related` ichidagi ma'lumotlar (entity bo'yicha)

- `agent`:
  - `marketplace_orders` (agentga tayinlangan buyurtmalar)
  - `marketplace_order_items` (yuqoridagi buyurtma itemlari)
  - `agent_kpi_payouts` (agent KPI to'lovlari)
- `punkt`:
  - `marketplace_orders` (punktga tayinlangan buyurtmalar)
  - `marketplace_order_items`
  - `punkt_kpi_payouts`
  - `punkt_order_transfers`
  - `punkt_order_transfer_items`
- `contragent`:
  - `products`
  - `product_images`
  - `marketplace_order_items` (contragent itemlari)
  - `punkt_contragent_line_requests`
- `local-shop`:
  - `local_shop_products`
  - `marketplace_local_shop_orders`
  - `marketplace_local_shop_order_items`
  - `local_shop_working_hours`
  - `local_shop_service_areas`
  - `local_shop_couriers`
- `marketplace-user`:
  - `marketplace_orders`
  - `marketplace_order_items`
  - `marketplace_local_shop_orders`
  - `marketplace_local_shop_order_items`
  - `marketplace_delivery_areas`
  - `marketplace_cart_items`
  - `marketplace_local_shop_cart_items`
  - `marketplace_product_ratings`

## Payload namunasi

```json
{
  "action": "delete",
  "deleted_at": "2026-04-08T07:10:00Z",
  "deleted_by_admin_id": 1,
  "entity_type": "agent",
  "snapshot": {
    "id": 12,
    "name": "Test Agent",
    "viloyat_id": 1,
    "tuman_id": 10,
    "mfy_id": 101,
    "phone": "+998901234567",
    "status": "active",
    "password_setup_allowed": false,
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-08T07:09:00Z"
  },
  "related": {
    "marketplace_orders": [],
    "marketplace_order_items": [],
    "agent_kpi_payouts": []
  }
}
```
