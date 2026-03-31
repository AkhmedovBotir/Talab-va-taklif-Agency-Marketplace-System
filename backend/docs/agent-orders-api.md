# Agent buyurtmalar API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <agent_jwt>` majburiy (`docs/agent-auth-api.md`).

Modul: `modules/agents` — `repository/agent_order_repository.go`, `service/agent_order_service.go`, `handler/agent_order_http.go`. GET javoblarda punkt/kontragent obyektlari `internal/pkg/orderembed` orqali beriladi.

---

## Mantiq (qisqa)

1. Punkt buyurtmani MFY bo‘yicha tayinlagach (`assigned_agent_id`, `docs/punkt-orders-api.md`), buyurtma shu agentning **faol** ro‘yxatida paydo bo‘ladi (`marketplace_status = pending`).
2. Agent buyurtma bo‘yicha **pulni punktda to‘laganini** **`payment-to-punkt`** bilan e’lon qiladi (amalda naqd/hisob — tashqi jarayon; API faqat vaqtni belgilaydi).
3. Punkt ketma-ket: to‘lovni **tasdiqlaydi** va **to‘lovdan keyingi yetkazish** bosqichini bajaradi (`docs/punkt-orders-api.md` — 10–11-qadamlar).
4. **11-qadam bajarilgach** agent mijozga yetkazib, **`deliver`** bilan buyurtmani `delivered` qiladi. Bosqich bajarilmagan bo‘lsa — `409` (`punkt to'lovdan keyingi yetkazish bosqichini yakunlamagan`).
5. Bekor qilingan buyurtmalar (`cancelled`) **tarix**da ko‘rinadi; ularga to‘lov e’loni / yetkazish mumkin emas.

---

## Javob formati

Standart: `message`, `data`, `error` (`internal/pkg/response`).

---

Barcha yo‘llar prefiks: **`/agents/me`**

### 1) Faol buyurtmalar (ish navbati)

**GET** `/agents/me/orders/active?page=1&limit=10`

- Faqat **shu agentga** tayinlangan (`assigned_agent_id`) va hali **`pending`** bo‘lgan buyurtmalar.
- `page`, `limit` — `limit` maks. `100`.

`data` tuzilishi (qisman):

```json
{
  "items": [
    {
      "id": 1,
      "marketplace_status": "pending",
      "total_amount": 150000,
      "assigned_punkt": {
        "id": 3,
        "name": "Markaz punkt",
        "viloyat_id": 1,
        "tuman_id": 10,
        "phone": "998901234567",
        "status": "active",
        "password_setup_allowed": true,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
      },
      "routing_district_id": 10,
      "created_at": "2026-03-28T12:00:00Z",
      "items_count": 2,
      "address_mode": "delivery_area",
      "snap_area_name": "Mfy nomi",
      "snap_mfy_id": 200,
      "primary_custom_address": "",
      "agent_declared_payment_to_punkt_at": "",
      "punkt_confirmed_agent_payment_at": "",
      "punkt_post_payment_delivered_at": "",
      "punkt_contragent_remainder_handed_over_at": ""
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

`assigned_punkt` — tayinlangan punktning to‘liq kartasi; punkt bo‘lmasa `null` yoki maydon yo‘q (`omitempty`).

---

### 2) Tarix

**GET** `/agents/me/orders/history?page=1&limit=10`

- Shu agentga tayinlangan va **`delivered`** yoki **`cancelled`** bo‘lgan buyurtmalar.

`data` tuzilishi `active` bilan bir xil.

---

### 3) Batafsil

**GET** `/agents/me/orders/{id}`

Faqat **o‘zingizga** tayinlangan buyurtma. `data` qo‘shimcha maydonlar:

| Maydon | Tavsif |
|--------|--------|
| `user_id` | Marketplace foydalanuvchi |
| `user` | Marketplace foydalanuvchi qisqa kartasi: `id`, `phone`, `first_name`, `last_name` |
| `user_phone` | Foydalanuvchining asosiy telefoni (qulay maydon) |
| `contact_phones` | Aloqa telefonlari ro‘yxati: avval `user_phone`, bo‘lsa keyin `extra_phone` |
| `extra_phone`, `address_note` | Yetkazish uchun |
| `snap_region_id`, `snap_district_id` | Snapshot |
| `agent_declared_payment_to_punkt_at`, … | Punkt zanjiri vaqtlari (ro‘yxatdagi kabi) |
| `items` | Qatorlar: `line_total`, har bir qatorda `contragent` obyekti, ixtiyoriy `contragent_payout_percent` / `contragent_payout_amount` |

---

### 4) Punktda to‘lov e’loni

**POST** `/agents/me/orders/{id}/payment-to-punkt`

Tana yo‘q.

- Faqat **`pending`** va sizga tayinlangan buyurtma.
- **Idempotent:** allaqachon e’lon qilingan bo‘lsa, `200`.

**Muvaffaqiyat:** `200` — `Punktga to'lov e'lon qilindi`

---

### 5) Mijozga yetkazildi

**POST** `/agents/me/orders/{id}/deliver`

Tana yo‘q.

- `marketplace_status === "pending"` va punkt **`post-payment-delivered`** bosqichini yakunlagan bo‘lishi kerak (`punkt_post_payment_delivered_at` to‘ldirilgan).
- **Idempotent:** allaqachon `delivered` bo‘lsa, `200`.
- `cancelled` yoki zanjir tugamagan — `409`.

**Muvaffaqiyat:** `200` — `Buyurtma yetkazildi deb belgilandi`

---

## Xatolar (`message` asosida)

| HTTP | Qachon |
|------|--------|
| 401 | Token yo‘q / yaroqsiz |
| 400 | `ID noto'g'ri` |
| 404 | `buyurtma topilmadi` — boshqa agent yoki tayinlanmagan |
| 409 | `buyurtma yetkazish uchun mos emas` — `pending` emas |
| 409 | `punktga to'lov e'lon qilish uchun holat mos emas` — masalan `pending` emas |
| 409 | `punkt to'lovdan keyingi yetkazish bosqichini yakunlamagan` — `deliver` dan oldin |
| 500 | Server ichki xatosi |

---

## Bog‘liq hujjatlar

- Agent kirish: `docs/agent-auth-api.md`
- Punkt buyurtma, agent tayinlash va 10–12 zanjir: `docs/punkt-orders-api.md`
- Punkt agentlar ro‘yxati (yangi tayinlash uchun `agent_id`): `docs/punkt-agents-api.md`
