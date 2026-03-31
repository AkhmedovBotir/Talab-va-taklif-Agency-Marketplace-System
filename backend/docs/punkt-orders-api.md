# Punkt buyurtmalar (markaziy yig‘uvchi) API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <punkt_jwt>` majburiy (punkt auth, `docs/punkt-auth-api.md`).

Modul: `modules/punkts` — `domain/punkt_contragent_line_request.go`, `repository/punkt_marketplace_order_repository.go`, `repository/punkt_agent_list_repository.go`, `service/punkt_order_service.go`, `service/punkt_agent_directory_service.go`, `handler/punkt_order_http.go`, `handler/punkt_agents_http.go`. Buyurtma GET javoblarida punkt/agent/kontragent **obyekt**lari `internal/pkg/orderembed` orqali qo‘shiladi.

---

## Mantiq (qisqa)

1. Marketplace buyurtmasi yaratilganda yetkazib berish **tumani** aniqlanadi (`routing_district_id`). Shu tumanda **faol punkt** bo‘lsa, buyurtma shu punktdan **inbox** (`punkt_routing.status = inbox`) holatiga tushadi.
2. Punkt **qabul qiladi** (`accept`) — har bir **buyurtma qatori** alohida ko‘rib chiqiladi: agar mahsulot **kontragenti**ning `contragent_delivery_districts` jadvalida shu **tuman** bo‘lsa, bitta **`punkt_contragent_line_requests`** yozuvi yaratiladi (har bir qator uchun alohida, turli kontragentlar uchun alohida so‘rovlar).
3. Tuman mos kelmaydigan qatorlar uchun so‘rov **yaratilmaydi** (keyingi bosqichda boshqa jarayon qo‘shilishi mumkin).
4. Punkt **rad etsa** (`reject`), buyurtma `punkt_routing.status = rejected` bo‘ladi (tayinlangan punkt `id` saqlanadi).
5. Kontragentlar qatorlarni istalgan tartibda **yetkazib berishi** mumkin (`docs/contragent-punkt-line-requests-api.md`). Shundan keyin punkt quyidagi ketma-ketlikni bajaradi:
   - **Yig‘ildi** — mahsulotlar punktda jamlanganini belgilash.
   - **Tayyorlandi** — buyurtma tayyor holatiga o‘tganini belgilash.
   - **Kontragent foizlari** — har bir **buyurtma qatori** uchun shu qatorning **umumiy summasidan** (`unit_price * quantity`) kontragentga berilgan **foiz**ni (0–100) saqlash (masalan olma qatori summasining 30%, banan qatori summasining 40%).
   - **Agentga topshirish** — buyurtma `snap_mfy_id` bo‘yicha shu MFY da ro‘yxatdan o‘tgan **faol** agentga tayinlanadi. Tayinlash uchun `agent_id` ni tanlash: `docs/punkt-agents-api.md` — **`GET /punkts/me/agents?mfy_id=<buyurtma.snap_mfy_id>`** (mavjud buyurtmada tayinlangan agent **GET** javobida `assigned_agent` obyekti bilan ham keladi).
   - Zarurat bo'lsa punkt buyurtmani (yoki qatorlarni) boshqa punktga yuboradi: `docs/punkt-order-transfers-api.md`. Bu oqim yakunlanmaguncha `assign-agent`ga ruxsat berilmaydi.
6. **Agent → punkt → kontragent** (tayinlangach, batafsil `docs/agent-orders-api.md`):
   - Agent buyurtma **pulini punktda to‘laganini** `payment-to-punkt` bilan e’lon qiladi.
   - Punkt **to‘lovni qabul qilganini** tasdiqlaydi (`confirm-agent-payment`).
   - Punkt **to‘lovdan keyingi yetkazish** bosqichini bajaradi (`post-payment-delivered`).
   - Punkt kontragentlarga **qolgan qism** (mahsulot / hisob bo‘yicha qoldiq) **topshirilganini** belgilaydi (`handover-remainder-to-contragents`).
   - Shundan keyin agent mijozga **yetkazildi** deb belgilashi mumkin.

**Vaqt zonasi:** «bugun» va «tarix» **Asia/Tashkent** kalendari bo‘yicha (UTC ga aylantirilib so‘rov qilinadi).

---

## Javob formati

Standart: `message`, `data`, `error` (`internal/pkg/response`).

---

## Endpointlar

Barcha yo‘llar prefiks: **`/punkts/me`**

> **Agentlar ro‘yxati** (yangi tayinlash uchun `agent_id` tanlash): `docs/punkt-agents-api.md` — `GET /punkts/me/agents`.

### 1) Bugungi buyurtmalar

**GET** `/punkts/me/orders/today?page=1&limit=10`

- Bugun **00:00–23:59:59** (Toshkent) oralig‘ida yaratilgan, **shu punktdan tayinlangan** (`assigned_punkt_id`) buyurtmalar.
- `page`, `limit` — `limit` maks. `100`.

`data` tuzilishi:

```json
{
  "items": [
    {
      "id": 1,
      "marketplace_status": "pending",
      "punkt_acceptance_status": "inbox",
      "total_amount": 150000,
      "routing_district_id": 10,
      "created_at": "2026-03-28T12:00:00Z",
      "items_count": 2,
      "punkt_collected_at": "",
      "punkt_ready_at": "",
      "assigned_agent": null,
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

Agar agent tayinlangan bo‘lsa, `assigned_agent` — to‘liq agent kartasi (`id`, `name`, `viloyat_id`, `tuman_id`, `mfy_id`, `phone`, `status`, `password_setup_allowed`, `created_at`, `updated_at`); qisqa ko‘rinish uchun **`assigned_agent_name`** ham bor. Tayinlanmagan bo‘lsa `assigned_agent` **`null`**, `assigned_agent_name` bo‘sh.

Qatorlar va `contragent_line_requests` uchun: **`contragent`** obyekti + tez chiqarish uchun **`contragent_name`** (kontragent `name` satri).

---

### 2) Tarix (bugundan oldin)

**GET** `/punkts/me/orders/history?page=1&limit=10`

- **Bugungi** kunning boshiga (Toshkent) qadar bo‘lgan vaqtdan **oldin** yaratilgan, shu punktdan tayinlangan buyurtmalar (`created_at < bugun 00:00`).

`data` tuzilishi `today` bilan bir xil.

---

### 3) Bitta buyurtma (batafsil)

**GET** `/punkts/me/orders/{id}`

Faqat **o‘z punktingizga** tayinlangan buyurtma. `data` qo‘shimcha maydonlar:

| Maydon | Tavsif |
|--------|--------|
| `user_id` | Marketplace foydalanuvchi `id` |
| `address_mode` | `default` \| `delivery_area` \| `extra` |
| `snap_area_name`, `snap_region_id`, `snap_district_id`, `snap_mfy_id` | Snapshot (matnli manzil bo‘lsa ko‘pincha bo‘sh) |
| `primary_custom_address` | `extra` bo‘lsa matn |
| `extra_phone`, `address_note` | Buyurtmadagi ixtiyoriy maydonlar |
| `punkt_collected_at`, `punkt_ready_at` | Yig‘ish / tayyorlash vaqti (ISO8601), bo‘sh bo‘lsa hali belgilanmagan |
| `assigned_agent` | MFY agentiga topshirilgandan keyin agent **obyekti**; hali tayinlanmagan bo‘lsa `null` |
| `assigned_agent_name` | Agent nomi (qisqa maydon) |
| `agent_declared_payment_to_punkt_at` | Agent punktda to‘laganini e’lon qilgan vaqt |
| `punkt_confirmed_agent_payment_at` | Punkt to‘lovni qabul qilgan vaqt |
| `punkt_post_payment_delivered_at` | To‘lovdan keyingi punkt yetkazish bosqichi |
| `punkt_contragent_remainder_handed_over_at` | Kontragentlarga qolgan qism topshirilgan vaqt |
| `items` | Qatorlar: `line_total`, `contragent` (obyekt yoki `null`), `contragent_name`, ixtiyoriy `contragent_payout_percent`, `contragent_payout_amount` |
| `contragent_line_requests` | Punkt qabulidan keyin yaratilgan kontragent so‘rovlari |

**`contragent_line_requests` elementi:**

| Maydon | Tavsif |
|--------|--------|
| `id` | So‘rov `id` |
| `order_item_id` | Bog‘langan buyurtma qatori |
| `contragent` | Kontragent **obyekti** yoki `null` |
| `contragent_name` | Shu qator kontragentining nomi |
| `routing_district_id` | Mos kelgan tuman |
| `status` | `pending` \| `accepted` \| `preparing` \| `delivered` \| `rejected` (kontragent oqimi: `docs/contragent-punkt-line-requests-api.md`) |

---

### 4) Buyurtmani qabul qilish

**POST** yoki **PUT** `/punkts/me/orders/{id}/accept`

Tana yo‘q.

- Faqat `punkt_acceptance_status === "inbox"` va marketplace `status === "pending"` bo‘lsa, qabul qilinadi.
- Tranzaksiya: status `contragent_requests_created` ga o‘tadi; mos keladigan har bir qator uchun `punkt_contragent_line_requests` yozuvi yaratiladi.
- **Idempotent:** allaqachon `contragent_requests_created` bo‘lsa, yana `200` (qayta yaratmaydi).

**Muvaffaqiyat:** `200` — `Buyurtma qabul qilindi, kontragent so'rovlari yaratildi`

---

### 5) Buyurtmani rad etish

**PATCH** `/punkts/me/orders/{id}/reject`

Tana ixtiyoriy (hozircha server o‘qimaydi; keyingi qism uchun zaxira).

- Faqat `inbox` holatida rad qilinadi.
- **Idempotent:** allaqachon `rejected` bo‘lsa, `200`.

**Muvaffaqiyat:** `200` — `Buyurtma rad etildi`

---

### 6) Buyurtma yig‘ildi (logistika)

**POST** `/punkts/me/orders/{id}/punkt-collected`

Tana yo‘q.

- Faqat `punkt_acceptance_status === "contragent_requests_created"` va buyurtma marshrut tumani shu punkt tumani bilan mos bo‘lsa.
- **Idempotent:** allaqachon yig‘ilgan bo‘lsa, `200`.

**Muvaffaqiyat:** `200` — `Buyurtma yig‘ildi deb belgilandi`

---

### 7) Buyurtma tayyorlandi

**POST** `/punkts/me/orders/{id}/punkt-ready`

Tana yo‘q.

- Avval **yig‘ilgan** bo‘lishi kerak (`punkt-collected`).
- `punkt_acceptance_status` hali ham `contragent_requests_created`.
- **Idempotent:** allaqachon tayyor bo‘lsa, `200`.

**Muvaffaqiyat:** `200` — `Buyurtma tayyorlandi deb belgilandi`

---

### 8) Har bir qator uchun kontragentga berilgan foiz

**PUT** `/punkts/me/orders/{id}/contragent-payouts`

Tana:

```json
{
  "items": [
    { "order_item_id": 101, "contragent_payout_percent": 30 },
    { "order_item_id": 102, "contragent_payout_percent": 40 }
  ]
}
```

- Buyurtmadagi **barcha** `marketplace_order_items` qatorlari **bittadan** bo‘lishi va ro‘yxatda **to‘liq** qoplanishi kerak (ortiqcha `order_item_id` bo‘lmasin).
- Har bir `contragent_payout_percent` — **0 dan 100 gacha** (shu qator `line_total` dan qancha **foiz** kontragentga berilgani).
- Faqat **tayyorlangan** buyurtmada (`punkt-ready` dan keyin).
- Agent tayinlangach (`assign-agent`) o‘zgartirib bo‘lmaydi.

**Muvaffaqiyat:** `200` — `Kontragent foizlari saqlandi`

---

### 9) Buyurtmani MFY agentiga topshirish

**POST** `/punkts/me/orders/{id}/assign-agent`

Tana:

```json
{
  "agent_id": 5
}
```

- Buyurtmada `snap_mfy_id` **0 emas** bo‘lishi kerak.
- Barcha qatorlarda kontragent foizi allaqachon saqlangan bo‘lishi kerak (8-qadam).
- Agent: `district_id` = punktning `tuman_id`, `mfy_id` = buyurtmaning `snap_mfy_id`, `status = active`.
- **Idempotent:** xuddi shu `agent_id` allaqachon tayinlangan bo‘lsa, `200`.
- Boshqa agent allaqachon tayinlangan bo‘lsa — `409`.

**Muvaffaqiyat:** `200` — `Buyurtma agentga topshirildi`

**Eslatma:** `agent_id` ni `GET /punkts/me/agents?mfy_id=<snap_mfy_id>` dan oling (`docs/punkt-agents-api.md`).

Agent oqimi: `docs/agent-orders-api.md` (`payment-to-punkt`, 10–11-qadamdan keyin `deliver`).

---

### 10) Agent to‘lovini tasdiqlash (punkt)

**POST** `/punkts/me/orders/{id}/confirm-agent-payment`

Tana yo‘q.

- Buyurtmaga **agent tayinlangan** bo‘lishi va agent avval **`payment-to-punkt`** bilan e’lon qilgan bo‘lishi kerak.
- **Idempotent:** allaqachon tasdiqlangan bo‘lsa, `200`.

**Muvaffaqiyat:** `200` — `Agent to'lovi tasdiqlandi`

---

### 11) To‘lovdan keyingi yetkazish (punkt)

**POST** `/punkts/me/orders/{id}/post-payment-delivered`

Tana yo‘q.

- Avval **10-qadam** (punkt to‘lovni tasdiqlagan) bajarilgan bo‘lishi kerak.
- **Idempotent.**

**Muvaffaqiyat:** `200` — `To'lovdan keyingi yetkazish bajarildi`

---

### 12) Kontragentlarga qolgan qismni topshirish (punkt)

**POST** `/punkts/me/orders/{id}/handover-remainder-to-contragents`

Tana yo‘q.

- Avval **11-qadam** bajarilgan bo‘lishi kerak.
- **Idempotent.**

**Muvaffaqiyat:** `200` — `Kontragentlarga qolgan qism topshirildi`

---

## Xatolar (`message` asosida)

| HTTP | Qachon |
|------|--------|
| 401 | Token yo‘q / yaroqsiz |
| 400 | `ID noto'g'ri` |
| 400 | `So'rov formati noto'g'ri` / `Qatorlar ro'yxati bo'sh` / `order_item_id majburiy` / `agent_id majburiy` |
| 404 | `buyurtma topilmadi` (boshqa punkt yoki `id` yo‘q) |
| 409 | `buyurtma inbox holatida emas` — qabul/rad noto‘g‘ri holat |
| 409 | `buyurtma foydalanuvchi tomonidan bekor qilingan yoki yakunlangan` — marketplace `pending` emas |
| 409 | `buyurtma allaqachon qabul yoki rad qilingan` — rad qilishda oldin rad qilingan (acceptdan keyin rad — inbox emas) |
| 409 | `buyurtma punkt logistikasi uchun mos holatda emas` — yig‘ish/tayyorlash/foizlar uchun noto‘g‘ri `punkt_acceptance_status` yoki agent allaqachon tayinlangan |
| 409 | `buyurtma hali yig‘ilmagan` — `punkt-ready` dan oldin |
| 409 | `buyurtma hali tayyorlangan deb belgilanmagan` — foizlardan oldin |
| 409 | `kontragent foizi noto‘g‘ri yoki qatorlar to‘liq emas` — foiz 0–100 dan tashqari yoki qatorlar to‘plami noto‘g‘ri |
| 409 | `buyurtmada MFY ko‘rsatilmagan, agent tayinlanmaydi` |
| 409 | `agent tanlangan tumanda yoki buyurtma MFY si bilan mos emas` |
| 409 | `buyurtmaga boshqa agent allaqachon tayinlangan` |
| 409 | `buyurtmada punktlararo transfer yakunlanmagan` |
| 409 | `buyurtma marshrut tumani bu punkt tumani bilan mos emas` |
| 409 | `buyurtmaga agent tayinlanmagan` |
| 409 | `agent punktga to'lovni hali e'lon qilmagan` |
| 409 | `agent to'lovi punkt tomonidan tasdiqlanmagan` |
| 409 | `to'lovdan keyingi yetkazish bosqichi hali bajarilmagan` |
| 500 | Server ichki xatosi |

---

## Statuslar (`punkt_acceptance_status`)

| Qiymat | Ma’nosi |
|--------|---------|
| `none` | Tuman yo‘q (masalan matnli manzil) — punkt oqimiga kirmaydi |
| `no_punkt` | Tuman bor, lekin shu tumanda faol punkt topilmadi |
| `inbox` | Shu punkt inboxida, qabul/rad kutilmoqda |
| `rejected` | Punkt rad etgan |
| `contragent_requests_created` | Qabul qilingan, qatorlar bo‘yicha kontragent so‘rovlari yaratilgan |

---

## Bog‘liq hujjatlar

- Punkt kirish: `docs/punkt-auth-api.md`
- Marketplace buyurtma + `punkt_routing`: `docs/marketplace-orders-api.md`
- Kontragent yetkazib berish tumanlari: `docs/contragent-region-delivery-api.md`
- Kontragent punkt qator so‘rovlari (qabul / tayyorlash / yetkazish): `docs/contragent-punkt-line-requests-api.md`
- Punkt tumani bo‘yicha agentlar (`agent_id` uchun): `docs/punkt-agents-api.md`
- Punktlararo transfer oqimi: `docs/punkt-order-transfers-api.md`
