# Manager Order Pipeline API

Manager uchun buyurtmalar monitoringi (admin `order-pipeline`ga o'xshash), lekin faqat managerning o'z viloyati bo'yicha.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <manager_jwt>`

## Asosiy endpointlar

- `GET /managers/order-pipeline/overview`
- `GET /managers/order-pipeline/all?page=1&limit=10`

## Stage endpointlar

- `GET /managers/order-pipeline/marketplace-created`
- `GET /managers/order-pipeline/punkt-inbox`
- `GET /managers/order-pipeline/contragent-requests-created`
- `GET /managers/order-pipeline/punkt-collected-pending`
- `GET /managers/order-pipeline/punkt-ready-pending`
- `GET /managers/order-pipeline/agent-assign-pending`
- `GET /managers/order-pipeline/agent-payment-pending`
- `GET /managers/order-pipeline/payment-confirm-pending`
- `GET /managers/order-pipeline/post-payment-delivery-pending`
- `GET /managers/order-pipeline/remainder-handover-pending`
- `GET /managers/order-pipeline/ready-for-agent-deliver`
- `GET /managers/order-pipeline/delivered`

## Muhim qoidalar

- Manager `region_id` token orqali aniqlanadi (`manager_id -> manager profile -> region_id`).
- Faqat shu viloyatdagi `marketplace_users`ga tegishli buyurtmalar qaytadi.
- `status = deleted` bo'lgan marketplace userlarning buyurtmalari monitoringga kirmaydi.

## `all` javobidagi asosiy maydonlar

- `id`, `status`, `total_amount`, `user_id`
- `assigned_punkt_id`, `assigned_punkt_name`
- `assigned_agent_id`, `assigned_agent_name`
- `current_stage`
- `items[]` ichida:
  - `product_id`, `product_name`, `quantity`, `unit`
  - `contragent_id`, `contragent_name`
  - `unit_price`, `line_total`

## Query parametrlar

- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)

