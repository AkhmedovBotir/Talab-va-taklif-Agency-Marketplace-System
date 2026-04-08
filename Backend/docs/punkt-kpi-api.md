# Punkt KPI (faqat GET)

Punkt JWT bilan **bugungi** KPI hisobi, **to‘langan / to‘lanmagan** va **kunlar bo‘yicha tarix**.

Hisoblash [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md) bilan bir xil mantiq: har bir **yetkazilgan** buyurtma uchun margin → KPI havzasi → undan **punkt** ulushi. Punkt hisobotida KPI foizlari **server tavsiyasi (`recommended`)** ishlatiladi (`allocation_note` maydonida yozilgan).

**Kun chegarasi:** UTC bo‘yicha kalendary kun (`date_utc`). Buyurtma **yetkazilgan** (`delivered`) va `updated_at` shu kun oralig‘iga tushganda hisobga olinadi.

**To‘lovlar:** `punkt_kpi_payouts` jadvalidagi yozuvlar (hozircha faqat o‘qiladi). To‘lov yozuvlarini qo‘shish uchun alohida API keyin qo‘shilishi mumkin — to‘lov bo‘lmasa `paid_*` va `unpaid_*` faqat **hisoblangan** KPI ga nisbatan 0 yoki to‘liq qarz ko‘rinishida bo‘ladi.

---

## Autentifikatsiya

```http
Authorization: Bearer <punkt_jwt>
```

Barcha yo‘llar: `/api/v1/punkts/me/...`

---

## GET `/api/v1/punkts/me/kpi/today`

**Javob (200)** — `data`:

| Maydon                 | Tavsif |
|------------------------|--------|
| `date_utc`             | Hisob kalendary kuni (UTC, `YYYY-MM-DD`) |
| `allocation_note`      | Qaysi KPI foizlari ishlatilgani |
| `punkt_kpi_total`      | Shu kungi yetkazilgan buyurtmalardan jami **punkt** KPI summasi |
| `total_kpi_pool`       | Shu buyurtmalar bo‘yicha jami KPI havzasi (ma’lumot) |
| `delivered_orders`     | Hisobga kirgan yetkazilgan buyurtmalar soni |
| `paid_total_today`     | Shu kunda `paid_at` bo‘yicha jami to‘langan |
| `payout_entries_today` | Shu kundagi to‘lov yozuvlari soni |
| `unpaid_today`         | `max(0, punkt_kpi_total - paid_total_today)` |

---

## GET `/api/v1/punkts/me/kpi/history`

Kunlar bo‘yicha yig‘ma (UTC).

**Query (ixtiyoriy):**

| Param  | Tavsif |
|--------|--------|
| `from` | `YYYY-MM-DD` (UTC), default: bugundan 29 kun oldin |
| `to`   | `YYYY-MM-DD` (UTC), default: bugun |

Oraliq: **kamida 1 kun**, **ko‘pi bilan 366 kun**. `from` ≤ `to`.

**Javob (200)** — `data`:

| Maydon   | Tavsif |
|----------|--------|
| `from_utc` | So‘rov `from` |
| `to_utc`   | So‘rov `to` |
| `days`     | `date_utc` bo‘yicha tartiblangan massiv |

Har bir `days[]` elementi:

| Maydon              | Tavsif |
|---------------------|--------|
| `date_utc`          | Kun |
| `punkt_kpi_accrued` | Shu kunda hisoblangan punkt KPI |
| `total_kpi_pool`    | Shu kun KPI havzasi yig‘indisi |
| `delivered_orders`  | Shu kundagi yetkazilgan buyurtmalar |
| `paid_total`        | `paid_at` shu kunga tushgan to‘lovlar yig‘indisi |
| `unpaid`            | `max(0, punkt_kpi_accrued - paid_total)` |

**Xato (400):** noto‘g‘ri sana yoki juda katta oralig‘.

---

## Qisqa eslatma

- Faqat `assigned_punkt_id` shu punkt bo‘lgan va `status = delivered` buyurtmalar.
- Buyurtmada qator bo‘lmasa, KPI 0, lekin `delivered_orders` ga kirishi mumkin.
- To‘lovlar jadvali bo‘sh bo‘lsa, `unpaid` ≈ `punkt_kpi_total` (bugun/tarix bo‘yicha).

**Agent uchun xuddi shunday:** [agent-kpi-api.md](./agent-kpi-api.md) (`/agents/me/kpi/...`, `agent_kpi_payouts`).
