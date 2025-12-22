# Admin Vakansiya Topshirishlarini Punkt/Agent ga Aylantirish API

Bu API admin tomonidan intervyudan keyin qabul qilingan vakansiya topshirishlarini Punkt yoki Agent ga aylantirish imkoniyatini ta'minlaydi.

## Base URL
```
/api/admins
```

## Autentifikatsiya

Barcha endpointlar JWT token talab qiladi. Token `Authorization` headerida quyidagi formatda yuborilishi kerak:
```
Authorization: Bearer <token>
```

Token `admin` role bilan yaratilgan bo'lishi kerak.

---

## Endpointlar

### 1. Topshirishni Punkt ga Aylantirish

Intervyudan keyin qabul qilingan vakansiya topshirishini Punkt ga aylantirish. Admin viloyat va tuman tanlaydi. Punkt parol o'rnatish uchun telefon raqam orqali kirishi kerak.

**Endpoint:** `POST /applications/:id/convert-to-punkt`

**Path Parameters:**
- `id` (required) - Topshirish ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "viloyat": "string (required, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string | null (optional, MongoDB ObjectId of Region with type: 'district')"
}
```

**Validation Rules:**
- `viloyat`: Majburiy, Region modelida mavjud bo'lishi kerak, `type: 'region'` bo'lishi kerak
- `tuman`: Ixtiyoriy, agar kiritilsa Region modelida mavjud bo'lishi kerak, `type: 'district'` bo'lishi kerak, va tanlangan viloyatga tegishli bo'lishi kerak
- Agar tanlangan viloyat va tuman uchun allaqachon faol punkt mavjud bo'lsa, xatolik qaytariladi

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Topshirish muvaffaqiyatli punkt ga aylantirildi. Parol o'rnatish uchun telefon raqam orqali kirish kerak.",
  "data": {
    "punkt": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "passwordSetupAllowed": true
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation xatosi yoki noto'g'ri ma'lumot
  ```json
  {
    "success": false,
    "message": "Viloyat kiritilishi shart"
  }
  ```

- **400 Bad Request** - Bu vakansiya punkt uchun emas
  ```json
  {
    "success": false,
    "message": "Bu vakansiya punkt uchun emas"
  }
  ```

- **400 Bad Request** - Topshirish qabul qilinmagan
  ```json
  {
    "success": false,
    "message": "Faqat qabul qilingan (hired) topshirishlar punkt ga aylantirilishi mumkin"
  }
  ```

- **400 Bad Request** - Bu viloyat va tuman uchun allaqachon faol punkt mavjud
  ```json
  {
    "success": false,
    "message": "Bu viloyat va tuman uchun allaqachon faol punkt mavjud"
  }
  ```

- **404 Not Found** - Topshirish topilmadi
  ```json
  {
    "success": false,
    "message": "Topshirish topilmadi"
  }
  ```

- **500 Internal Server Error** - Server xatosi

---

### 2. Topshirishni Agent ga Aylantirish

Intervyudan keyin qabul qilingan vakansiya topshirishini Agent ga aylantirish. Admin viloyat, tuman va MFY tanlaydi. Agent parol o'rnatish uchun telefon raqam orqali kirishi kerak.

**Endpoint:** `POST /applications/:id/convert-to-agent`

**Path Parameters:**
- `id` (required) - Topshirish ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "viloyat": "string (required, MongoDB ObjectId of Region with type: 'region')",
  "tuman": "string | null (optional, MongoDB ObjectId of Region with type: 'district')",
  "mfy": "string | null (optional, MongoDB ObjectId of Region with type: 'mfy')"
}
```

**Validation Rules:**
- `viloyat`: Majburiy, Region modelida mavjud bo'lishi kerak, `type: 'region'` bo'lishi kerak
- `tuman`: Ixtiyoriy, agar kiritilsa Region modelida mavjud bo'lishi kerak, `type: 'district'` bo'lishi kerak, va tanlangan viloyatga tegishli bo'lishi kerak
- `mfy`: Ixtiyoriy, agar kiritilsa Region modelida mavjud bo'lishi kerak, `type: 'mfy'` bo'lishi kerak, va tanlangan tumanga tegishli bo'lishi kerak. MFY tanlash uchun tuman ham tanlanishi kerak
- Agar tanlangan viloyat, tuman va MFY uchun allaqachon faol agent mavjud bo'lsa, xatolik qaytariladi

**Agent Types:**
- **Viloyat Agent:** Faqat `viloyat` tanlangan bo'lsa
- **Tuman Agent:** `viloyat` va `tuman` tanlangan bo'lsa
- **MFY Agent:** `viloyat`, `tuman` va `mfy` tanlangan bo'lsa

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Topshirish muvaffaqiyatli agent ga aylantirildi. Parol o'rnatish uchun telefon raqam orqali kirish kerak.",
  "data": {
    "agent": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "+998901234567",
      "viloyat": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TASH"
      },
      "tuman": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YUN"
      },
      "mfy": null,
      "agentType": "tuman",
      "passwordSetupAllowed": true
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation xatosi yoki noto'g'ri ma'lumot
  ```json
  {
    "success": false,
    "message": "Viloyat kiritilishi shart"
  }
  ```

- **400 Bad Request** - Bu vakansiya agent uchun emas
  ```json
  {
    "success": false,
    "message": "Bu vakansiya agent uchun emas"
  }
  ```

- **400 Bad Request** - Topshirish qabul qilinmagan
  ```json
  {
    "success": false,
    "message": "Faqat qabul qilingan (hired) topshirishlar agent ga aylantirilishi mumkin"
  }
  ```

- **400 Bad Request** - Bu viloyat, tuman va MFY uchun allaqachon faol agent mavjud
  ```json
  {
    "success": false,
    "message": "Bu viloyat va tuman uchun allaqachon faol agent mavjud"
  }
  ```

- **404 Not Found** - Topshirish topilmadi
  ```json
  {
    "success": false,
    "message": "Topshirish topilmadi"
  }
  ```

- **500 Internal Server Error** - Server xatosi

---

## Workflow

1. Admin vakansiya topshirishini ko'radi va intervyu o'tkazadi
2. Intervyudan keyin admin yakuniy qaror qiladi (`makeFinalDecision` endpoint orqali)
3. Agar qaror `hired` bo'lsa, admin topshirishni Punkt yoki Agent ga aylantirishi mumkin:
   - Punkt uchun: `POST /applications/:id/convert-to-punkt` - Admin viloyat va tuman tanlaydi
   - Agent uchun: `POST /applications/:id/convert-to-agent` - Admin viloyat, tuman va MFY tanlaydi
4. Punkt yoki Agent yaratiladi, `passwordSetupAllowed: true` bilan
5. Punkt yoki Agent telefon raqam orqali parol o'rnatadi (3 bosqichli jarayon)

---

## Eslatmalar

- **Parol o'rnatish:** Punkt va Agent yaratilganda parol avtomatik qilinmaydi. Punkt yoki Agent o'zi telefon raqam orqali parol o'rnatishi kerak (3 bosqichli jarayon).
- **Aktiv pozitsiya tekshiruvi:** Agar tanlangan viloyat, tuman yoki MFY uchun allaqachon faol punkt yoki agent mavjud bo'lsa, yangi punkt yoki agent yaratib bo'lmaydi.
- **Topshirish holati:** Faqat `status: 'accepted'` va `finalDecision.result: 'hired'` bo'lgan topshirishlar aylantirilishi mumkin.
- **Vakansiya target:** Punkt ga aylantirish uchun vakansiya `target: 'punkt'` bo'lishi kerak. Agent ga aylantirish uchun vakansiya `target: 'agent'` bo'lishi kerak.

---

## Misollar

### Punkt ga Aylantirish

```bash
curl -X POST "http://localhost:5000/api/admins/applications/507f1f77bcf86cd799439011/convert-to-punkt" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013"
  }'
```

### Agent ga Aylantirish (Viloyat Agent)

```bash
curl -X POST "http://localhost:5000/api/admins/applications/507f1f77bcf86cd799439011/convert-to-agent" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "507f1f77bcf86cd799439012"
  }'
```

### Agent ga Aylantirish (Tuman Agent)

```bash
curl -X POST "http://localhost:5000/api/admins/applications/507f1f77bcf86cd799439011/convert-to-agent" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013"
  }'
```

### Agent ga Aylantirish (MFY Agent)

```bash
curl -X POST "http://localhost:5000/api/admins/applications/507f1f77bcf86cd799439011/convert-to-agent" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "viloyat": "507f1f77bcf86cd799439012",
    "tuman": "507f1f77bcf86cd799439013",
    "mfy": "507f1f77bcf86cd799439014"
  }'
```

