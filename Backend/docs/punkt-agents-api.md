# Punkt: o‘z tumanidagi agentlar ro‘yxati

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <punkt_jwt>` majburiy (`docs/punkt-auth-api.md`).

Modul: `modules/punkts` — `repository/punkt_agent_list_repository.go`, `service/punkt_agent_directory_service.go`, `handler/punkt_agents_http.go`.

---

## Maqsad

Buyurtmani **MFY agentiga** topshirishdan oldin punkt `agent_id` ni bilishi kerak. Agentlar **admin** tomonidan yaratiladi (`agents` jadvali: `district_id`, `mfy_id`, …). Ushbu endpoint **shu punktga biriktirilgan tuman** (`punkts.tuman_id`) bo‘yicha **faol** (`status = active`) agentlarni qaytaradi.

**Buyurtma uchun agent tanlash:** `GET /punkts/me/orders/{id}` javobidagi `snap_mfy_id` ni oling va **`GET /punkts/me/agents?mfy_id=<snap_mfy_id>`** bilan shu mahalladagi agentlarni filtrlang. Keyin `POST .../assign-agent` da `agent_id` yuboring (`docs/punkt-orders-api.md`).

---

## Javob formati

Standart: `message`, `data`, `error` (`internal/pkg/response`).

---

## Agentlar ro‘yxati

**GET** `/punkts/me/agents?mfy_id=`

| Query | Tavsif |
|--------|--------|
| `mfy_id` | Ixtiyoriy. Berilsa, faqat shu **MFY** ga biriktirilgan agentlar qaytariladi (buyurtma `snap_mfy_id` bilan moslashtirish uchun). |

- Asosiy filtr: agent `district_id` = **joriy punktning** `tuman_id`.
- Faqat `status === "active"` agentlar.

`data` — massiv:

```json
[
  {
    "id": 5,
    "name": "Agent Ali",
    "viloyat_id": 1,
    "tuman_id": 10,
    "mfy_id": 200,
    "phone": "+998901112233",
    "status": "active"
  }
]
```

**Muvaffaqiyat:** `200` — `Agentlar olindi`

---

## Xatolar

| HTTP | Qachon |
|------|--------|
| 401 | Token yo‘q / yaroqsiz |
| 400 | `mfy_id noto'g'ri` (0 yoki raqam emas) |
| 500 | Server ichki xatosi |

---

## Bog‘liq hujjatlar

- Punkt buyurtmalar (agent tayinlash): `docs/punkt-orders-api.md`
- Agent buyurtmalar (topshirilgach): `docs/agent-orders-api.md`
- Punkt kirish: `docs/punkt-auth-api.md`
