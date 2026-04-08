# Manager Product Comments Follow-up API

Menejer o'z viloyatidagi contragent mahsulot kommentlarini ko'radi, telefonlashuv jarayonini note qiladi, muammoni hal qiladi yoki adminga yuboradi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <manager_jwt>`

## Endpointlar

- `GET /managers/product-comments?page=1&limit=10&status=open&escalated=false`
- `GET /managers/product-comments/:rating_id`
- `POST /managers/product-comments/:rating_id/notes`
- `POST /managers/product-comments/:rating_id/calls`
- `POST /managers/product-comments/:rating_id/escalate`
- `POST /managers/product-comments/:rating_id/resolve`

## Izoh

- `notes` va `calls` endpointlarini qayta-qayta ishlatish mumkin.
- `escalate` qilinsa case statusi `escalated_to_admin` bo'ladi va admin panelida ko'rinadi.
- `resolve` qilinsa status `resolved` bo'ladi.
- Region cheklovi avtomatik: manager faqat o'z `viloyat_id` bo'yicha kommentlarni ko'radi.

## Action body

```json
{
  "note": "Mijoz bilan gaplashildi, qayta tekshirilyapti"
}
```

