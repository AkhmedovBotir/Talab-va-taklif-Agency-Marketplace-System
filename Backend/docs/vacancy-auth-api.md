# Vacancy Applicant Auth API (SMS with Eskiz)

Registratsiya, login va parolni tiklash jarayonlari (kod orqali tasdiqlash).

Base URL: `/api/vacancy-auth`

All SMS are sent via `services/eskizService.js`.

---

## Regions
**GET** `/regions?type=region|district|mfy&parentId=...`
```json
{ "success": true, "count": 3, "data": [ { "_id": "...", "name": "...", "type": "region", "code": "...", "parent": "..." } ] }
```

---

## Data Model (VacancyApplicant)
- `firstName` (string, required)
- `lastName` (string, required)
- `phone` (string, required, unique)
- `gender` (enum: `male|female|other`, default `other`)
- `birthDate` (date, required)
- `viloyat` (Region ref, required)
- `tuman` (Region ref, required)
- `mfy` (Region ref, required)
- `password` (string, required, hashed)
- `status` (enum: `active|inactive`, default `active`)

Codes are stored in `VacancyApplicantCode` (phone, code, purpose, expiresAt).

---

## Endpoints

### 0) Telefonni tekshirish
**GET** `/register/check?phone=+998901234567`
```json
{ "success": true, "exists": false }
```

### 1) Register: send code
**POST** `/register/send-code`
```json
{ "phone": "+998901234567" }
```
**Response 200**
```json
{ "success": true, "message": "Tasdiqlash kodi yuborildi" }
```

### 2) Register: confirm & create account
**POST** `/register/confirm`
```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "phone": "+998901234567",
  "gender": "male",
  "birthDate": "1995-01-01",
  "viloyat": "64viloyatId",
  "tuman": "64tumanId",
  "mfy": "64mfyId",
  "password": "secret123",
  "code": "12345"
}
```
**Response 201**
```json
{
  "success": true,
  "message": "Ro'yxatdan o'tish muvaffaqiyatli",
  "data": { "token": "<jwt>", "applicant": { ... } }
}
```

### 3) Register: faqat kodni tekshirish (ixtiyoriy)
**POST** `/register/verify-code`
```json
{ "phone": "+998901234567", "code": "12345" }
```
**Response 200**
```json
{ "success": true, "message": "Kod tasdiqlandi" }
```

### 3) Login: send code (after password check)
**POST** `/login/send-code`
```json
{ "phone": "+998901234567", "password": "secret123" }
```
**Response 200**
```json
{ "success": true, "message": "Tasdiqlash kodi yuborildi" }
```

### 4) Login: confirm code
**POST** `/login/confirm`
```json
{ "phone": "+998901234567", "code": "12345" }
```
**Response 200**
```json
{
  "success": true,
  "message": "Kirish muvaffaqiyatli",
  "data": { "token": "<jwt>", "applicant": { ... } }
}
```

### 5) Forgot password: send code
**POST** `/password/forgot/send-code`
```json
{ "phone": "+998901234567" }
```
**Response 200**
```json
{ "success": true, "message": "Tasdiqlash kodi yuborildi" }
```

### 6) Forgot password: confirm & set new password
**POST** `/password/forgot/confirm`
```json
{ "phone": "+998901234567", "code": "12345", "newPassword": "newSecret123" }
```
**Response 200**
```json
{ "success": true, "message": "Parol muvaffaqiyatli yangilandi" }
```

### 7) Kodni qayta yuborish (generic)
**POST** `/resend-code`
```json
{ "phone": "+998901234567", "purpose": "register" }
```
- `purpose`: `register` | `login` | `forgot_password`
- Agar `purpose = login` bo'lsa, `password` talab qilinadi:
```json
{ "phone": "+998901234567", "purpose": "login", "password": "secret123" }
```
**Response 200**
```json
{ "success": true, "message": "Kod qayta yuborildi" }
```

---

## Notes
- Kod muddati: 5 daqiqa.
- Har bir purpose bo‘yicha eski kodlar almashtiriladi.
- Telefon format validatsiya `VacancyApplicant` modeli va `eskizService` dagi normalize jarayoni bilan ishlaydi (`998` prefiks).
- JWT paydo bo‘lishi: `role = vacancy_applicant`, default expire `7d` (env orqali sozlanadi).

---

## Integration Reminder
Routerni serverga ulang:
```js
// index.js yoki app.js
const vacancyAuthRoutes = require('./routes/vacancyAuthRoutes');
app.use('/api/vacancy-auth', vacancyAuthRoutes);
```

