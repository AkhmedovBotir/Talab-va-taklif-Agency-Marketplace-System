# Contragent Profile API

Kontragentlar uchun profil ma'lumotlarini ko'rish va yangilash, logo yuklash.

## Base URL
```
/api/contragents
```

## Autentifikatsiya
```
Authorization: Bearer <contragent_token>
```
Token turi: `type = contragent`

---

## 1. Profil ma'lumotlarini olish
**GET** `/me`

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "64contragent...",
    "name": "Partner LLC",
    "inn": "123456789",
    "phone": "+998901234567",
    "logo": "data:image/png;base64,...",
    "status": "active",
    "viloyat": { "_id": "...", "name": "Toshkent", "type": "region", "code": "10" },
    "tuman": { "_id": "...", "name": "Yakkasaroy", "type": "district", "code": "1001" },
    "mfy": { "_id": "...", "name": "Navbahor", "type": "mfy", "code": "100101" },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-05T00:00:00.000Z"
  }
}
```

---

## 2. Profilni yangilash
**PUT** `/me`

**Headers**
```
Authorization: Bearer <contragent_token>
Content-Type: application/json
```

**Body (hammasi ixtiyoriy)**
```json
{
  "name": "Yangi nom",
  "phone": "+998901112233",
  "inn": "123456789",
  "viloyat": "64viloyatId",
  "tuman": "64tumanId",
  "mfy": "64mfyId",
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Qoidalar**
- `logo` formati: `data:image/{png|jpg|jpeg|gif|webp};base64,{data}`
- Telefon va INN unikal bo'lishi kerak (boshqa kontragentga tegishli bo'lmasligi kerak).
- Region ierarxiyasi tekshiriladi: tuman -> viloyat, MFY -> tuman.

**Response 200**
```json
{
  "success": true,
  "message": "Profil yangilandi",
  "data": { "...yangilangan profil..." }
}
```

---

## 3. Faqat logoni yangilash
**PATCH** `/me/logo`

**Body**
```json
{
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Logo yangilandi",
  "data": { "...yangilangan profil..." }
}
```

---

## Xatoliklar
- 400: noto'g'ri format (logo base64 emas, telefon/INN dublikat, region ierarxiyasi noto'g'ri)
- 401: token topilmadi yoki noto'g'ri
- 403: token tur noto'g'ri
- 404: kontragent topilmadi
- 500: server xatosi

---

## Eslatma
- Ushbu endpointlar kontragent tokeni bilan ishlaydi (`contragentAuth`).
- Logo hajmi 5MB dan kichik saqlanishi tavsiya etiladi.

