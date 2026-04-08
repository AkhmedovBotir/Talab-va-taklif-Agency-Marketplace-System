# Agent KPI (faqat GET)

Agent JWT bilan **bugungi** KPI, **to‘langan / to‘lanmagan** va **kunlar bo‘yicha tarix**.

Hisoblash [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md) bilan bir xil: margin → KPI havzasi → undan **agent** ulushi. Foizlar **server tavsiyasi (`recommended`)** ([punkt-kpi-api.md](./punkt-kpi-api.md) bilan bir xil asos).

**Buyurtmalar:** `assigned_agent_id` shu agent, `status = delivered`, kun **`updated_at` (UTC)**.

**To‘lovlar:** `agent_kpi_payouts` jadvali (hozircha faqat o‘qish; yozuv bo‘lmasa `paid_*` 0).

---

## Autentifikatsiya

```http
Authorization: Bearer <agent_jwt>
```

Yo‘llar: `/api/v1/agents/me/...`

---

## GET `/api/v1/agents/me/kpi/today`

**Javob (200)** — `data`:

| Maydon                 | Tavsif |
|------------------------|--------|
| `date_utc`             | UTC kalendary kuni |
| `allocation_note`      | Qaysi KPI foizlari ishlatilgani |
| `agent_kpi_total`      | Shu kungi yetkazilgan buyurtmalardan jami **agent** KPI |
| `total_kpi_pool`       | Shu buyurtmalar bo‘yicha jami KPI havzasi |
| `delivered_orders`     | Hisobga kirgan buyurtmalar soni |
| `paid_total_today`     | Shu kunda `paid_at` bo‘yicha to‘langan |
| `payout_entries_today` | Shu kundagi to‘lov yozuvlari soni |
| `unpaid_today`         | `max(0, agent_kpi_total - paid_total_today)` |

---

## GET `/api/v1/agents/me/kpi/history`

**Query:** `from`, `to` — `YYYY-MM-DD` (UTC), ixtiyoriy (default oxirgi 30 kun).

**Javob:** `days[]` — har kun uchun `agent_kpi_accrued`, `total_kpi_pool`, `delivered_orders`, `paid_total`, `unpaid`.

**400:** noto‘g‘ri sana yoki oralig‘i > 366 kun.

---

Punkt versiyasi: [punkt-kpi-api.md](./punkt-kpi-api.md).
