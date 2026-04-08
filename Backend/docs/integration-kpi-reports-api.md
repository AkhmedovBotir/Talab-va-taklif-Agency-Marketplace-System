# Integratsiya KPI hisobotlari (JWT)

Barcha marshrutlar **integratsiya tokeni** bilan ([integration-auth-login-api.md](./integration-auth-login-api.md)):

```http
Authorization: Bearer <integration_token>
```

**Prefiks:** `/api/v1/integration-auth/...` (yoki `/api/v1/integration/...` — bir xil).

---

## Umumiy

- **Yetkazilgan buyurtmalar:** `status = delivered`, `updated_at` UTC oralig‘ida.
- **KPI hisobi:** [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md) formulasi; foizlar shu integratsiya kaliti uchun **saqlangan KPI sozlama** yoki **recommended**.
- **Filtr (ixtiyoriy):** `punkt_id`, `agent_id`, `manager_id`.
- **Sana:** `from`, `to` — `YYYY-MM-DD` (UTC), ikkalasi ham majburiy **yoki** ikkalasi ham bo‘sh (default: **oxirgi 7 kun**, bugungi kun oxirigacha).
- Oraliq: **1–366 kun**.

### To‘lov holati

- Integratsiya KPI to‘lovlari `POST /kpi/reports/settle` orqali avtomatik amalga oshiriladi.
- To‘lov summasi backendda `unpaid`dan olinadi, `paid_at` avtomatik server vaqtida yoziladi.

---

## GET `/integration-auth/kpi/reports/accrual`

Barcha rollar bo‘yicha **yig‘ilgan** (`accrued`), **to‘langan** (`paid`), **to‘lanmagan** (`unpaid`) KPIlar.

**Query:** `from`, `to`, `punkt_id`, `agent_id`, `manager_id`

**Javob `data`:** `from_utc`, `to_utc`, `orders_count`, `allocation_source`, `allocation_used`, `accrued` / `paid` / `unpaid` (har biri: `total_kpi_pool`, `punkt`, `agent`, `manager`, `finance`, `delivery`).

`paid` / `unpaid` integratsiya payout yozuvlari asosida hisoblanadi.

---

## Rol bo‘yicha (alohida GET)

Query xuddi `accrual` kabi.

| Yo‘l | Rol |
|------|-----|
| `GET .../kpi/reports/punkt` | Punkt |
| `GET .../kpi/reports/agent` | Agent |
| `GET .../kpi/reports/manager` | Menejer |
| `GET .../kpi/reports/finance` | Moliya |
| `GET .../kpi/reports/delivery` | Yetkazib berish |

**Javob `data`:**
- `role`, `from_utc`, `to_utc`, `orders_count`, `allocation_source`
- `accrued`, `paid`, `unpaid`, `total_kpi_pool`
- `people` — har bir odam kesimida:
  - `id`, `name`, `accrued`, `paid`, `unpaid`
  - `days` — kunlik kesim: `date_utc`, `accrued`, `paid`, `unpaid`

**Filter ishlashi:**
- `punkt` roli uchun `punkt_id` bitta punktni chiqaradi.
- `agent` roli uchun `agent_id` bitta agentni chiqaradi.
- `manager` roli uchun `manager_id` bitta menejerni chiqaradi.
- Sana filtri (`from`,`to`) barcha rolda kunlik ma’lumotga qo‘llanadi.

---

## Bog‘liq hujjatlar

- Kalit va login: [integration-auth-login-api.md](./integration-auth-login-api.md)
- KPI foiz sozlama CRUD: [integration-kpi-allocation-api.md](./integration-kpi-allocation-api.md)
- Bitta buyurtma/qator hisobi: [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md)
- Avtomatik KPI to‘lov: [integration-kpi-settle-api.md](./integration-kpi-settle-api.md)
