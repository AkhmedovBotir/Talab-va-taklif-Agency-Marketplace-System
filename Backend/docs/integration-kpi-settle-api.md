# Integratsiya KPI avtomatik to'lov API

Barcha marshrutlar **integratsiya tokeni** bilan:

```http
Authorization: Bearer <integration_token>
```

**Prefiks:** `/api/v1/integration-auth/...` (yoki `/api/v1/integration/...`).

## POST `/integration-auth/kpi/reports/settle`

Tanlangan rol bo'yicha **to'lanmay qolgan KPI** summalarini avtomatik "paid" qiladi.

- `amount` yuborilmaydi.
- `paid_at` avtomatik qo'yiladi (server UTC vaqti).
- `from`/`to` query oralig'idagi `unpaid` summalar olinadi.

### Query

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Ikkalasi bo'sh bo'lsa default oxirgi 7 kun ishlatiladi.

### Body

```json
{
  "category": "agent",
  "target_ids": [12, 18],
  "select_all": false,
  "note": "aprel KPI to'lovi"
}
```

### Qoidalar

- `category`: `punkt | agent | manager | finance | delivery`
- `agent/punkt/manager`:
  - `target_ids` bilan tanlanganlar to'lanadi, yoki
  - `select_all: true` bo'lsa shu rol bo'yicha hammasi to'lanadi.
- `finance/delivery`:
  - `target_ids` yuborilmaydi
  - role bo'yicha umumiy `unpaid` to'liq to'lanadi.

### 201 Javob

```json
{
  "category": "agent",
  "period_from": "2026-04-01",
  "period_to": "2026-04-07",
  "created_entries": 2,
  "paid_total": 520000,
  "paid_at": "2026-04-06T12:10:00Z",
  "selected_target_ids": [12, 18]
}
```

### 400 holatlar

- noto'g'ri `category`
- `agent/punkt/manager`da `target_ids` ham, `select_all` ham berilmagan
- `finance/delivery`da `target_ids` yuborilgan
