# Punktlararo transfer API

Base URL: `http://localhost:8081/api/v1`

`Authorization: Bearer <punkt_jwt>` majburiy.

Faqat punkt oqimida ishlaydi: bir punkt buyurtmani (yoki buyurtmadagi mahsulot qatorlarini) boshqa punktga yuboradi, u punkt yig'ib qaytaradi, birinchi punkt qabul qiladi.

## Statuslar

| status | Ma'nosi |
|---|---|
| `sent` | 1-punktdan 2-punktga yuborildi |
| `accepted_by_target` | 2-punkt transferni qabul qildi |
| `returned_to_source` | 2-punkt qaytarib yubordi |
| `received_by_source` | 1-punkt qabul qildi (yakun) |

## Endpointlar (`/punkts/me`)

- `POST /orders/{id}/transfers`
- `GET /transfers/outgoing?page=1&limit=10`
- `GET /transfers/incoming?page=1&limit=10`
- `GET /transfers/{transfer_id}`
- `POST /transfers/{transfer_id}/accept`
- `POST /transfers/{transfer_id}/return`
- `POST /transfers/{transfer_id}/confirm-received`

---

## 1) Transfer yaratish

**POST** `/punkts/me/orders/{id}/transfers`

Body:

```json
{
  "target_punkt_id": 5,
  "note": "shu qatorlarni yig'ib qaytaring",
  "order_item_ids": [101, 102]
}
```

- `order_item_ids` bo'sh yuborilsa, buyurtmaning barcha qatorlari transferga olinadi.
- Bir buyurtmada tugallanmagan (`sent`, `accepted_by_target`, `returned_to_source`) transfer bo'lsa, yangisi ochilmaydi.
- Buyurtma `contragent_requests_created` holatida bo'lishi kerak.

## 2) Outgoing / Incoming ro'yxat

`GET /transfers/outgoing` — men yuborganlar  
`GET /transfers/incoming` — menga kelganlar

`data`:

```json
{
  "items": [
    {
      "id": 12,
      "order_id": 6,
      "source_punkt_id": 4,
      "target_punkt_id": 5,
      "status": "accepted_by_target",
      "order_item_ids": [7, 8],
      "sent_at": "2026-03-30T08:00:00Z",
      "target_accepted_at": "2026-03-30T08:10:00Z",
      "target_returned_at": "",
      "source_received_at": "",
      "created_at": "2026-03-30T08:00:00Z",
      "updated_at": "2026-03-30T08:10:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

## 3) Qabul qilish / qaytarish / yakunlash

- `POST /transfers/{transfer_id}/accept` — faqat target punkt
- `POST /transfers/{transfer_id}/return` — faqat target punkt
- `POST /transfers/{transfer_id}/confirm-received` — faqat source punkt

Ketma-ketlik: `sent -> accepted_by_target -> returned_to_source -> received_by_source`.

## Eslatma

`/punkts/me/orders/{id}/assign-agent` da endi buyurtmada tugallanmagan transfer bo'lsa (`received_by_source` bo'lmaguncha), agentga topshirish bloklanadi.
