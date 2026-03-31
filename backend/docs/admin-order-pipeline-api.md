# Admin Order Pipeline Monitor API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <admin_jwt>` majburiy.  
Faqat `general admin` uchun.

Maqsad: `marketplace -> punkt -> kontragent -> agent` zanjirida buyurtmalar qayerda to'xtab qolganini tez ko'rish.

## Overview

- `GET /order-pipeline/overview`

`data`:
- `marketplace_created`
- `punkt_inbox`
- `contragent_requests_created`
- `punkt_collected_pending`
- `punkt_ready_pending`
- `agent_assign_pending`
- `agent_payment_pending`
- `payment_confirm_pending`
- `post_payment_delivery_pending`
- `remainder_handover_pending`
- `ready_for_agent_deliver`
- `delivered`

## Stage route'lar (har biri alohida)

Barchasi paginated:
- query: `page` (default 1), `limit` (default 10, max 100)

- `GET /order-pipeline/all`  ← barcha buyurtmalar (stage aralash), har itemda `current_stage` bilan
- `GET /order-pipeline/marketplace-created`
- `GET /order-pipeline/punkt-inbox`
- `GET /order-pipeline/contragent-requests-created`
- `GET /order-pipeline/punkt-collected-pending`
- `GET /order-pipeline/punkt-ready-pending`
- `GET /order-pipeline/agent-assign-pending`
- `GET /order-pipeline/agent-payment-pending`
- `GET /order-pipeline/payment-confirm-pending`
- `GET /order-pipeline/post-payment-delivery-pending`
- `GET /order-pipeline/remainder-handover-pending`
- `GET /order-pipeline/ready-for-agent-deliver`
- `GET /order-pipeline/delivered`

## Stage item formati

Har bir `items[]` elementi:
- `id`
- `status`
- `total_amount`
- `user_id`
- `assigned_punkt_id`
- `punkt_acceptance_status`
- `punkt_collected_at`
- `punkt_ready_at`
- `assigned_agent_id`
- `agent_declared_payment_to_punkt_at`
- `punkt_confirmed_agent_payment_at`
- `punkt_post_payment_delivered_at`
- `punkt_contragent_remainder_handed_over_at`
- `items` (`product_id`, `product_name`, `quantity`, `unit`, `unit_price`, `line_total`, `contragent_id`)
- `current_stage`
- `created_at`
- `updated_at`

## Javob formati

Standart: `message`, `data`, `error`.
