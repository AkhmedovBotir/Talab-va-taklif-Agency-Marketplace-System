# Admin Hamkorlik So'rovlari API

Admin hamkorlik so'rovlarini ko'radi, aloqaga chiqqanini belgilaydi, bitim holatini yangilaydi va bitim tuzilgan bo'lsa kontragentga aylantiradi.

Base URL: `http://localhost:8081/api/v1`

Auth: `Authorization: Bearer <admin_jwt>`

## Endpoints

### 1) GET `/admin-partner-requests?page=1&limit=10`
- Ro'yxat (pagination bilan).

### 2) GET `/admin-partner-requests/{id}`
- Bitta so'rov tafsiloti.

### 3) PATCH `/admin-partner-requests/{id}/contacted`
- Aloqaga chiqilganini belgilaydi (`status = contacted`).

### 4) PATCH `/admin-partner-requests/{id}/deal`
Body:
```json
{ "signed": true }
```
- `signed=true` -> `status = deal_signed`
- `signed=false` -> `status = deal_not_signed`

### 5) POST `/admin-partner-requests/{id}/convert-to-contragent`
Body (ixtiyoriy):
```json
{ "phone": "+998991112233" }
```

Qoidalar:
- Faqat `deal_signed` holatidagi so'rov kontragentga aylantiriladi.
- Agar so'rov telefoni band bo'lsa, admin shu endpointda `phone` ni boshqa raqamga almashtirib yuborishi mumkin.
- Yangi contragent `status=active` bilan yaratiladi.

## Asosiy statuslar

- `new`
- `contacted`
- `deal_signed`
- `deal_not_signed`
- `converted`

## Xatolar

- `400` — holat noto'g'ri, telefon formati xato, ierarxiya/activity type xato
- `404` — so'rov topilmadi
- `409` — tanlangan telefon raqami contragentlarda band
