# Admin Vacancy API

Admin uchun Agent yoki Punkt vakansiyalarini yaratish va boshqarish.

## Model

`Vacancy`:
```json
{
  "name": "string, required",
  "target": "string, enum ['agent','punkt'], required",
  "experience": "string",
  "type": "string, enum ['parttime','fulltime'], required",
  "salary": "string",
  "description": "object | null (delta format)",
  "responsibilities": "object | null (delta format)",
  "preferences": "object | null (delta format)",
  "skills": ["string"],
  "minAge": "number | null",
  "maxAge": "number | null",
  "questions": [
    {
      "question": "string, required",
      "type": "string, enum ['text','textarea','number','email','phone','select','radio','checkbox','date','file'], required",
      "required": "boolean, default false",
      "options": ["string"],
      "placeholder": "string"
    }
  ]
}
```

## Endpoints

### 1) Vakansiya yaratish
- **POST** `/api/admin/vacancies`
- **Auth**: adminAuth
- **Body:**
```json
{
  "name": "Punkt uchun operator",
  "target": "punkt",
  "experience": "1-2 yil",
  "type": "fulltime",
  "salary": "5 000 000 - 7 000 000 so'm",
  "description": { "ops": [{ "insert": "Ish tavsifi..." }] },
  "responsibilities": { "ops": [{ "insert": "Majburiyatlar..." }] },
  "preferences": { "ops": [{ "insert": "Afzalliklar..." }] },
  "skills": ["mijoz bilan ishlash", "CRM"],
  "minAge": 20,
  "maxAge": 35,
  "questions": [
    {
      "question": "Telefon raqamingiz",
      "type": "phone",
      "required": true,
      "placeholder": "+99891..."
    },
    {
      "question": "Qaysi hududda ishlaysiz?",
      "type": "select",
      "options": ["Toshkent", "Farg'ona", "Buxoro"]
    }
  ]
}
```
- **Response 201:**
```json
{
  "success": true,
  "message": "Vakansiya muvaffaqiyatli yaratildi",
  "data": { ...vacancy }
}
```

### 2) Vakansiyalar ro'yxati
- **GET** `/api/admin/vacancies?target=punkt&type=fulltime&search=operator&page=1&limit=20`
- **Auth**: adminAuth
- **Query:** `target`, `type`, `search`, `page`, `limit`
- **Response 200:** `data` massiv, `total`, `page`, `limit`, `totalPages`

### 3) Vakansiyani ID bo'yicha olish
- **GET** `/api/admin/vacancies/:id`
- **Auth**: adminAuth
- **Response 200:**
```json
{
  "success": true,
  "data": { ...vacancy }
}
```

### 4) Vakansiyani to'liq yangilash
- **PUT** `/api/admin/vacancies/:id`
- **Auth**: adminAuth
- **Body:** (barcha maydonlar ixtiyoriy, lekin yuborilgan maydonlar yangilanadi)
```json
{
  "name": "Yangi nom",
  "target": "agent",
  "experience": "3-5 yil",
  "type": "parttime",
  "salary": "3 000 000 - 5 000 000 so'm",
  "description": { "ops": [{ "insert": "Yangi tavsif..." }] },
  "responsibilities": { "ops": [{ "insert": "Yangi majburiyatlar..." }] },
  "preferences": { "ops": [{ "insert": "Yangi afzalliklar..." }] },
  "skills": ["yangi skill 1", "yangi skill 2"],
  "minAge": 25,
  "maxAge": 40,
  "questions": [
    {
      "question": "Yangi savol",
      "type": "text",
      "required": true,
      "placeholder": "Javob kiriting"
    },
    {
      "question": "Tanlov savoli",
      "type": "radio",
      "required": false,
      "options": ["Variant 1", "Variant 2", "Variant 3"]
    }
  ]
}
```
- **Response 200:**
```json
{
  "success": true,
  "message": "Vakansiya muvaffaqiyatli yangilandi",
  "data": { ...updatedVacancy }
}
```
- **Eslatma:** 
  - Barcha maydonlar ixtiyoriy, lekin yuborilgan maydonlar to'liq yangilanadi
  - Agar `questions` yuborilsa, u to'liq almashtiriladi (qo'shish emas, almashtirish)
  - `questions` yuborilganda, kamida bitta savol bo'lishi kerak
  - Har bir savol uchun `question` va `type` majburiy

### 5) Vakansiyani o'chirish
- **DELETE** `/api/admin/vacancies/:id`
- **Auth**: adminAuth
- **Response 200:**
```json
{
  "success": true,
  "message": "Vakansiya muvaffaqiyatli o'chirildi"
}
```

## Xatoliklar
- 400 – majburiy maydon yetishmasa yoki savol turi noto'g'ri bo'lsa
- 404 – vakansiya topilmasa
- 500 – server xatoliklari


