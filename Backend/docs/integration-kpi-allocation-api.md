# Integratsiya KPI ajratishi (bitta obyekt)

Tashqi tizim **integratsiya JWT** bilan ([integration-auth-login-api.md](./integration-auth-login-api.md)) o‘z kaliti uchun **bitta** KPI foizlari yozuvini boshqaradi. Ma’lumot **massiv emas**, har doim bitta JSON obyekt: `punkt`, `agent`, `manager`, `finance`, `delivery`.

| JSON kalit  | Ma’nosi            |
|-------------|--------------------|
| `punkt`     | Punkt              |
| `agent`     | Agent              |
| `manager`   | Menejer            |
| `finance`   | Moliya             |
| `delivery`  | Yetkazib berish    |

**Qoida:** beshala qiymat **butun son**, har biri **0–100**, **yig‘indisi aynan 100**.

**Tavsiya:** `GET` javobidagi `recommended` — backend doimiy tavsiya qiymati (hozircha: punkt 22, agent 22, manager 20, finance 18, delivery 18).

**Tranzaksiya / buyurtma bo‘yicha summalarni hisoblash:** [integration-transaction-kpi-api.md](./integration-transaction-kpi-api.md).

---

## Autentifikatsiya

Barcha marshrutlar:

```http
Authorization: Bearer <integration_token>
```

---

## GET `/api/v1/integration-auth/kpi-allocation`

Joriy kalit uchun saqlangan KPI va tavsiya.

**Javob (200)** — `data` bitta obyekt:

| Maydon        | Tavsif                                                |
|---------------|--------------------------------------------------------|
| `allocation`  | Saqlangan foizlar obyekti yoki **`null`** (hali yo‘q) |
| `recommended` | Backend tavsiyasi (har doim to‘ldirilgan)              |

`allocation` / `recommended` tuzilmasi:

```json
{
  "punkt": 22,
  "agent": 22,
  "manager": 20,
  "finance": 18,
  "delivery": 18
}
```

**Eski prefiks:** `GET /api/v1/integration/kpi-allocation` — xuddi shu.

---

## POST `/api/v1/integration-auth/kpi-allocation`

**Yaratish** (bir kalit uchun faqat **bir marta**). Allaqachon yozuv bo‘lsa **409**.

**Body** — bitta obyekt (masalan tavsiyadan nusxa):

```json
{
  "punkt": 22,
  "agent": 22,
  "manager": 20,
  "finance": 18,
  "delivery": 18
}
```

**Javob (201):** `data` — yaratilgan foizlar obyekti.

**Xatolar:** `400` (yig‘indi ≠ 100 yoki 0–100 dan tashqari), `409` (allaqachon mavjud).

---

## PUT `/api/v1/integration-auth/kpi-allocation`

**To‘liq yangilash** (mavjud yozuvni almashtirish). Yozuv bo‘lmasa **404** — avval `POST` qiling.

**Body:** `POST` bilan bir xil bitta obyekt.

**Javob (200):** `data` — yangilangan foizlar.

**Xatolar:** `400`, `404`.

---

## DELETE `/api/v1/integration-auth/kpi-allocation`

Saqlangan KPI yozuvini o‘chirish. Keyingi `GET` da `allocation` yana **`null`** bo‘ladi, `recommended` qoladi.

**Javob (200).** **404** — yozuv bo‘lmasa.

---

## Qisqa ketma-ketlik

1. `POST /integration-auth/login` → `token`
2. `GET /integration-auth/kpi-allocation` → `recommended` ni ko‘rish
3. `POST ...` yoki `PUT ...` bilan saqlash
4. Keyin `PUT` bilan o‘zgartirish, kerak bo‘lsa `DELETE`
