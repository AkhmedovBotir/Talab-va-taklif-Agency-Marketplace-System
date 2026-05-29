# Kontragent: punkt yuborgan qator so‘rovlari API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <contragent_jwt>` majburiy (`docs/contragent-auth-api.md`).

Modul: `modules/contragents` — `repository/contragent_punkt_line_request_repository.go`, `service/contragent_punkt_line_request_service.go`, `handler/contragent_punkt_line_request_http.go`. Ma’lumotlar `punkt_contragent_line_requests` jadvalida (`modules/punkts/domain/punkt_contragent_line_request.go`). GET javoblarda punkt va agent obyektlari `internal/pkg/orderembed` orqali qo‘shiladi.

---

## Mantiq (qisqa)

1. Marketplace buyurtmasi punkt tomonidan **qabul** qilingach, har bir mos **buyurtma qatori** uchun shu mahsulot **kontragentiga** alohida yozuv yaratiladi (`status = pending`).
2. Kontragent **qabul qiladi** (`accept`) — `pending` → `accepted`.
3. Keyin **tayyorlash** (`preparing`) — `accepted` → `preparing`.
4. **Yetkazib berildi** (`deliver`) — `preparing` → `delivered`.
5. Bir xil holatga qayta chaqirish **idempotent**: masalan, allaqachon `accepted` bo‘lsa, `accept` yana `200` qaytaradi.

Barcha yo‘llar prefiks: **`/contragents/me`**

---

## Javob formati

Standart: `message`, `data`, `error` (`internal/pkg/response`).

---

## 1) Ro‘yxat

**GET** `/contragents/me/punkt-line-requests?page=1&limit=10&status=`

| Query | Tavsif |
|--------|--------|
| `page` | Sahifa, default `1` |
| `limit` | Sahifa hajmi, default `10`, maks. `100` |
| `status` | Ixtiyoriy filtr: `pending`, `accepted`, `preparing`, `delivered`, `rejected` |

`data`:

```json
{
  "items": [
    {
      "id": 1,
      "order_id": 10,
      "order_item_id": 55,
      "punkt": {
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
      "assigned_agent": null,
      "routing_district_id": 12,
      "status": "pending",
      "order_status": "pending",
      "product_name": "Un 50kg",
      "quantity": 2,
      "unit": "dona",
      "unit_price": 250000,
      "created_at": "2026-03-28T12:00:00Z",
      "updated_at": "2026-03-28T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

- `punkt` — so‘rov yuborilgan punkt kartasi (`punkt_id` o‘rniga).
- `assigned_agent` — bog‘langan buyurtmada agent tayinlangan bo‘lsa, agent kartasi; aks holda `null` yoki `omitempty`.

---

## 2) Bitta so‘rov (batafsil)

**GET** `/contragents/me/punkt-line-requests/{id}`

Faqat **shu kontragentga** tegishli yozuv.

| Maydon | Tavsif |
|--------|--------|
| `punkt` | So‘rov punktingizga bog‘langan punkt **obyekti** |
| `order` | Buyurtma **obyekti**: `id`, `status`, `total_amount`, ixtiyoriy `assigned_punkt`, `assigned_agent` (marketplace buyurtmasidagi tayinlangan punkt va agent kartalari) |
| `product_id` | Mahsulot `id` |
| `product_name`, `quantity`, `unit`, `unit_price` | Qator snapshot |

`order_id`, `punkt_id`, alohida `order_status` / `order_total_amount` maydonlari **yo‘q** — ularning ma’nosi `order` ichida jamlangan.

`data` misol (qisqartirilgan):

```json
{
  "id": 1,
  "order_item_id": 55,
  "routing_district_id": 12,
  "status": "pending",
  "punkt": { "id": 3, "name": "Markaz punkt", "viloyat_id": 1, "tuman_id": 10, "phone": "998901234567", "status": "active", "password_setup_allowed": true },
  "order": {
    "id": 10,
    "status": "pending",
    "total_amount": 500000,
    "assigned_punkt": { "id": 3, "name": "Markaz punkt", "viloyat_id": 1, "tuman_id": 10, "phone": "998901234567", "status": "active", "password_setup_allowed": true },
    "assigned_agent": null
  },
  "product_id": 100,
  "product_name": "Un 50kg",
  "quantity": 2,
  "unit": "dona",
  "unit_price": 250000,
  "created_at": "2026-03-28T12:00:00Z",
  "updated_at": "2026-03-28T12:00:00Z"
}
```

---

## 3) Qabul qilish

**POST** `/contragents/me/punkt-line-requests/{id}/accept`

Tana yo‘q.

- `pending` → `accepted` (takroriy chaqirish: allaqachon `accepted` bo‘lsa ham `200`).

**Muvaffaqiyat:** `200` — `Qabul qilindi`

---

## 4) Tayyorlash

**POST** `/contragents/me/punkt-line-requests/{id}/preparing`

Tana yo‘q.

- `accepted` → `preparing` (idempotent: allaqachon `preparing` bo‘lsa `200`).

**Muvaffaqiyat:** `200` — `Tayyorlanmoqda`

---

## 5) Yetkazib berish

**POST** `/contragents/me/punkt-line-requests/{id}/deliver`

Tana yo‘q.

- `preparing` → `delivered` (idempotent: allaqachon `delivered` bo‘lsa `200`).

**Muvaffaqiyat:** `200` — `Yetkazib berildi`

---

## Xatolar (`message` asosida)

| HTTP | Qachon |
|------|--------|
| 401 | Token yo‘q / yaroqsiz |
| 400 | `ID noto'g'ri` |
| 404 | `so'rov topilmadi` — boshqa kontragent yoki `id` yo‘q |
| 409 | `so'rov holati bu amal uchun mos emas` — noto‘g‘ri ketma-ketlik (masalan `deliver` `pending` da) |
| 500 | Server ichki xatosi |

---

## Statuslar (`punkt_contragent_line_requests.status`)

| Qiymat | Ma’nosi |
|--------|---------|
| `pending` | Punkt qabulidan keyin yaratilgan, kontragent javobi kutilmoqda |
| `accepted` | Kontragent qabul qilgan |
| `preparing` | Tayyorlanmoqda |
| `delivered` | Yetkazib berilgan (qator bo‘yicha yakuniy) |
| `rejected` | Rad (hozirgi API orqali o‘zgartirilmaydi; kelajakda alohida endpoint bo‘lishi mumkin) |

---

## Bog‘liq hujjatlar

- Kontragent kirish: `docs/contragent-auth-api.md`
- Punkt buyurtma va so‘rov yaratilishi: `docs/punkt-orders-api.md`
- Marketplace buyurtma: `docs/marketplace-orders-api.md`
