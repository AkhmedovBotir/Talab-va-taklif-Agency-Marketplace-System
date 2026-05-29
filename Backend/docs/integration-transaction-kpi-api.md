# Tranzaksiya / buyurtma bo‘yicha KPI ajratish (integratsiya JWT)

Integratsiya kaliti bilan olingan token orqali KPI **foiz sozlamangiz** ([integration-kpi-allocation-api.md](./integration-kpi-allocation-api.md)) ishlatiladi va **tranzaksiya (buyurtma qatorlari)** bo‘yicha pul miqdorlari hisoblanadi.

## Hisoblash mantig‘i

1. **Margin (qoldiq)** har bir qator uchun:  
   `(sotuv narxi − asl narx) × miqdor`  
   Agar sotuv asldan kichik bo‘lsa, margin **0** qabul qilinadi.

2. **KPI havzasi** (kontragent foizi):  
   `margin × (kpi_bonus_percent ÷ 100)`  
   Bu yerda `kpi_bonus_percent` — mahsulotda kontragent belgilagan foiz (masalan marginning 50% i KPI ga ketadi).

3. Barcha qatorlardan kelgan **KPI havzalari yig‘indisi** sizning KPI sozlamangizdagi **100%** sifatida olinadi va quyidagicha bo‘linadi:  
   `punkt`, `agent`, `manager`, `finance`, `delivery` (sozlamada yig‘indisi 100 bo‘lishi kerak).

Agar KPI sozlamasi saqlanmagan bo‘lsa, backend **tavsiya** foizlari ishlatiladi (`recommended` bilan bir xil).

Buyurtmadagi maydonlar: yangi buyurtmalar `unit_original_price` va `kpi_bonus_percent` ni buyurtma vaqtidagi mahsulotdan snapshot qiladi. Eski buyurtmalar uchun mahsulot jadvalidan zaxira o‘qiladi.

---

## Autentifikatsiya

```http
Authorization: Bearer <integration_token>
```

---

## POST `/api/v1/integration-auth/transaction-kpi/compute`

Qo‘lda berilgan qatorlar bo‘yicha hisob (massiv — **KPI sozlamasi emas**, tranzaksiya qatorlari).

**Body:**

```json
{
  "lines": [
    {
      "unit_sale": 100000,
      "unit_cost": 80000,
      "quantity": 1,
      "kpi_bonus_percent": 50
    }
  ]
}
```

| Maydon              | Tavsif                                      |
|---------------------|---------------------------------------------|
| `unit_sale`         | Sotuv narxi (birlik)                        |
| `unit_cost`         | Asl narx (birlik)                           |
| `quantity`          | Miqdor (> 0)                                |
| `kpi_bonus_percent` | Margindan KPI havzasiga foiz (0–100)       |

**Javob (200)** — `data` ichida:

| Maydon                 | Tavsif                                      |
|------------------------|---------------------------------------------|
| `explanation`          | Qisqa mantiq matni                          |
| `total_line_sale`      | Barcha qator sotuv yig‘indisi               |
| `total_line_cost`      | Barcha qator asl xarajat yig‘indisi         |
| `total_margin`         | Margin yig‘indisi                           |
| `total_kpi_pool`       | KPI havzasi (yig‘indi)                      |
| `allocation_used`      | Qo‘llangan foiz obyekti                     |
| `allocation_source`    | `"saved"` yoki `"recommended"`              |
| `punkt`, `agent`, …    | Har bir yo‘nalishga tushgan summa (2 xona)  |
| `lines`                | Qator bo‘yicha `margin`, `kpi_pool_from_line` |

**Xatolar:** `400` (bo‘sh `lines`, noto‘g‘ri miqdor/foiz), `401`.

**Eski prefiks:** `POST /api/v1/integration/transaction-kpi/compute`

---

## POST `/api/v1/integration-auth/transaction-kpi/by-order`

Marketplace **buyurtma ID** bo‘yicha (bazadagi qatorlar + snapshot / mahsulot zaxirasi).

**Body:**

```json
{
  "order_id": 42
}
```

**Javob** — `compute` bilan bir xil tuzilish.

**Xatolar:** `404` (buyurtma yo‘q), `400` (qatorlar bo‘sh yoki validatsiya), `401`.

**Eski prefiks:** `POST /api/v1/integration/transaction-kpi/by-order`

---

## Misol (sizning formulangiz)

- Asl 80 000, sotuv 100 000, miqdor 1 → margin **20 000**.  
- `kpi_bonus_percent` = **50** → KPI havzasi **10 000**.  
- KPI sozlamasi masalan 22 / 22 / 20 / 18 / 18 bo‘lsa, shu **10 000** shu foizlar bo‘yicha bo‘linadi (yig‘indisi 10 000 ga tenglashtiriladi).
