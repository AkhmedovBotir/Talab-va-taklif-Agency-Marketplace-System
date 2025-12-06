# Vakansiya Nomzodlari API Dokumentatsiyasi

Bu API vakansiya nomzodlari uchun vakansiyalarni ko'rish, topshirish, saqlab olish va boshqarish imkoniyatlarini ta'minlaydi.

## Base URL
```
/api/vacancy
```

## Autentifikatsiya

Barcha endpointlar JWT token talab qiladi. Token `Authorization` headerida quyidagi formatda yuborilishi kerak:
```
Authorization: Bearer <token>
```

Token `vacancy_applicant` role bilan yaratilgan bo'lishi kerak.

---

## Endpointlar

### 1. Vakansiyalarni olish

Vakansiyalarni filtrlash va pagination bilan olish.

**Endpoint:** `GET /vacancies`

**Query Parameters:**
- `target` (optional): `agent` yoki `punkt` - vakansiya turi
- `type` (optional): `parttime` yoki `fulltime` - ish turi
- `search` (optional): Vakansiya nomi bo'yicha qidiruv
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 20): Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "_id": "vacancy_id",
      "name": "Vakansiya nomi",
      "target": "agent",
      "type": "fulltime",
      "experience": "2+ yil",
      "salary": "5000000 so'm",
      "description": { /* delta format */ },
      "responsibilities": { /* delta format */ },
      "preferences": { /* delta format */ },
      "skills": ["skill1", "skill2"],
      "minAge": 18,
      "maxAge": 45,
      "questions": [ /* savollar */ ],
      "applicationStatus": "pending" | "reviewed" | "accepted" | "rejected" | null,
      "isBookmarked": true | false,
      "applicationCount": 15,
      "viewCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500`: Server xatosi

---

### 2. Vakansiyani ID bo'yicha olish

Bitta vakansiyaning to'liq ma'lumotlarini olish.

**Endpoint:** `GET /vacancies/:id`

**Path Parameters:**
- `id`: Vakansiya ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "vacancy_id",
    "name": "Vakansiya nomi",
    "target": "agent",
    "type": "fulltime",
    "experience": "2+ yil",
    "salary": "5000000 so'm",
    "description": { /* delta format */ },
    "responsibilities": { /* delta format */ },
    "preferences": { /* delta format */ },
    "skills": ["skill1", "skill2"],
    "minAge": 18,
    "maxAge": 45,
    "questions": [
      {
        "question": "Savol matni",
        "type": "text",
        "required": true,
        "options": [],
        "placeholder": "Javob kiriting"
      }
    ],
    "applicationStatus": "pending" | null,
    "isBookmarked": true,
    "applicationCount": 15,
    "viewCount": 20,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri vakansiya ID
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

---

### 3. Vakansiyani ko'rishni qayd etish

Vakansiyani ko'rgani haqida ma'lumotni saqlash. Bitta user bir necha marta ko'rsa ham faqat 1 marta hisoblanadi.

**Endpoint:** `POST /vacancies/:id/view`

**Path Parameters:**
- `id`: Vakansiya ID

**Response (Yangi ko'rish qayd etildi):**
```json
{
  "success": true,
  "message": "Ko'rish muvaffaqiyatli qayd etildi",
  "viewCount": 21
}
```

**Response (Allaqachon ko'rilgan):**
```json
{
  "success": true,
  "message": "Ko'rish allaqachon qayd etilgan",
  "viewCount": 20
}
```

**Error Responses:**
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

**Eslatma:** 
- Bitta user bir vakansiyani bir necha marta ko'rsa ham faqat 1 marta hisoblanadi
- Unique index tufayli takroriy ko'rishlar qayd etilmaydi
- View count real vaqtda yangilanadi

---

### 4. Vakansiyaga topshirish

**Path Parameters:**
- `id`: Vakansiya ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "vacancy_id",
    "name": "Vakansiya nomi",
    "target": "agent",
    "type": "fulltime",
    "experience": "2+ yil",
    "salary": "5000000 so'm",
    "description": { /* delta format */ },
    "responsibilities": { /* delta format */ },
    "preferences": { /* delta format */ },
    "skills": ["skill1", "skill2"],
    "minAge": 18,
    "maxAge": 45,
    "questions": [
      {
        "question": "Savol matni",
        "type": "text",
        "required": true,
        "options": [],
        "placeholder": "Javob kiriting"
      }
    ],
    "applicationStatus": "pending" | null,
    "isBookmarked": true,
    "applicationCount": 15,
    "viewCount": 15,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri vakansiya ID
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

---

### 3. Vakansiyaga topshirish

Vakansiyaga topshirish va savollarga javob berish.

**Endpoint:** `POST /vacancies/:id/apply`

**Path Parameters:**
- `id`: Vakansiya ID

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "0",
      "answer": "Javob matni"
    },
    {
      "questionId": "1",
      "answer": 25
    },
    {
      "questionId": "2",
      "answer": "option1"
    },
    {
      "questionId": "3",
      "answer": ["option1", "option2"]
    }
  ]
}
```

**Answer Types:**
- `text`, `textarea`, `email`, `phone`: String
- `number`: Number
- `select`, `radio`: String (variantlardan biri)
- `checkbox`: Array of strings (bir nechta variant)
- `date`: String (ISO date format)
- `file`: Object yoki String (file URL yoki base64)

**Response:**
```json
{
  "success": true,
  "message": "Vakansiyaga muvaffaqiyatli topshirildi",
  "data": {
    "_id": "application_id",
    "vacancy": {
      "_id": "vacancy_id",
      "name": "Vakansiya nomi",
      "target": "agent",
      "type": "fulltime"
    },
    "applicant": {
      "_id": "applicant_id",
      "firstName": "Ism",
      "lastName": "Familiya",
      "phone": "+998901234567"
    },
    "answers": [ /* javoblar */ ],
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Javoblar kiritilmagan
  - Barcha savollarga javob berilmagan
  - Majburiy savolga javob berilmagan
  - Javob formati noto'g'ri
  - Bu vakansiyaga allaqachon topshirilgan
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

**Validation Rules:**
- Barcha savollarga javob berilishi kerak
- Majburiy savollarga javob berilishi shart
- `number` turi uchun raqam bo'lishi kerak
- `email` turi uchun to'g'ri email format
- `phone` turi uchun to'g'ri telefon format
- `select` va `radio` uchun berilgan variantlardan biri
- `checkbox` uchun berilgan variantlardan tanlash

---

### 5. Topshirgan vakansiyalarni olish

Foydalanuvchi tomonidan topshirilgan barcha vakansiyalarni olish.

**Endpoint:** `GET /applications`

**Query Parameters:**
- `status` (optional): `pending`, `reviewed`, `accepted`, `rejected` - topshirish holati
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 20): Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "application_id",
      "vacancy": {
        "_id": "vacancy_id",
        "name": "Vakansiya nomi",
        "target": "agent",
        "type": "fulltime",
        "experience": "2+ yil",
        "salary": "5000000 so'm"
      },
      "applicant": "applicant_id",
      "answers": [ /* javoblar */ ],
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500`: Server xatosi

---

### 6. Topshirishni ID bo'yicha olish (to'liq ma'lumotlar)

Bitta topshirishning to'liq ma'lumotlarini olish (javoblar, baholashlar, intervyu bosqichlari, yakuniy qaror bilan).

**Endpoint:** `GET /applications/:id`

**Path Parameters:**
- `id`: Topshirish ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "application_id",
    "vacancy": {
      "_id": "vacancy_id",
      "name": "Vakansiya nomi",
      "target": "agent",
      "type": "fulltime",
      "experience": "2+ yil",
      "salary": "5000000 so'm",
      "description": { /* delta format */ },
      "responsibilities": { /* delta format */ },
      "preferences": { /* delta format */ },
      "skills": ["skill1", "skill2"],
      "minAge": 18,
      "maxAge": 45,
      "questions": [ /* savollar */ ]
    },
    "applicant": {
      "_id": "applicant_id",
      "firstName": "Ism",
      "lastName": "Familiya",
      "phone": "+998901234567",
      "gender": "male",
      "birthDate": "1990-01-01T00:00:00.000Z",
      "viloyat": {
        "_id": "region_id",
        "name": "Andijon viloyati",
        "type": "region",
        "code": "17"
      },
      "tuman": {
        "_id": "region_id",
        "name": "Buloqboshi tumani",
        "type": "district",
        "code": "1701"
      },
      "mfy": {
        "_id": "region_id",
        "name": "Buyuk turon MFY",
        "type": "mfy",
        "code": "1701001"
      },
      "avatar": "data:image/png;base64,..."
    },
    "answers": [
      {
        "questionId": "0",
        "question": "Savol matni",
        "type": "text",
        "answer": "Javob matni"
      }
    ],
    "status": "accepted",
    "adminDecision": "accepted",
    "adminEvaluation": [
      {
        "name": "texnik",
        "score": 5
      },
      {
        "name": "Muomila",
        "score": 5
      }
    ],
    "adminNotes": "Yaxshi nomzod",
    "adminDecidedAt": "2024-01-05T00:00:00.000Z",
    "adminDecidedBy": {
      "_id": "admin_id",
      "username": "admin"
    },
    "interviewStages": [
      {
        "_id": "stage_id",
        "stageName": "Texnik intervyu",
        "stageOrder": 1,
        "interviewDate": "2024-01-15T00:00:00.000Z",
        "interviewTime": "14:30",
        "location": "Ofis, 3-qavat",
        "interviewer": "Ahmadjon Ahmadov",
        "notes": "Qo'shimcha izohlar",
        "status": "completed",
        "result": "passed",
        "evaluation": [
          {
            "name": "texnik",
            "score": 8
          },
          {
            "name": "Muomila",
            "score": 7
          }
        ],
        "completedAt": "2024-01-15T15:00:00.000Z"
      }
    ],
    "finalDecision": {
      "result": "hired",
      "reason": "Barcha bosqichlardan muvaffaqiyatli o'tdi",
      "responseStatus": "waiting",
      "respondedAt": null,
      "decidedAt": "2024-01-20T00:00:00.000Z",
      "decidedBy": "Ahmadjon Ahmadov"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri topshirish ID
- `404`: Topshirish topilmadi
- `500`: Server xatosi

---

### 7. Topshirish baholashlarini olish

Topshirishning barcha baholashlarini olish (admin baholash va intervyu bosqichlari baholashlari).

**Endpoint:** `GET /applications/:id/evaluations`

**Path Parameters:**
- `id`: Topshirish ID

**Response:**
```json
{
  "success": true,
  "data": {
    "adminEvaluation": [
      {
        "name": "texnik",
        "score": 5
      },
      {
        "name": "Muomila",
        "score": 5
      }
    ],
    "interviewStages": [
      {
        "stageId": "stage_id",
        "stageName": "Texnik intervyu",
        "stageOrder": 1,
        "evaluation": [
          {
            "name": "texnik",
            "score": 8
          },
          {
            "name": "Muomila",
            "score": 7
          }
        ]
      },
      {
        "stageId": "stage_id_2",
        "stageName": "HR intervyu",
        "stageOrder": 2,
        "evaluation": [
          {
            "name": "Muomila",
            "score": 9
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri topshirish ID
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Admin baholash - admin tomonidan qabul qilish/bekor qilish paytida qo'yilgan baholash
- Intervyu bosqichlari baholashlari - har bir intervyu bosqichida qo'yilgan baholashlar

---

### 8. Intervyu bosqichlarini olish

Topshirishning barcha intervyu bosqichlarini olish.

**Endpoint:** `GET /applications/:id/interview-stages`

**Path Parameters:**
- `id`: Topshirish ID

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "stage_id",
      "stageName": "Texnik intervyu",
      "stageOrder": 1,
      "interviewDate": "2024-01-15T00:00:00.000Z",
      "interviewTime": "14:30",
      "location": "Ofis, 3-qavat",
      "interviewer": "Ahmadjon Ahmadov",
      "notes": "Qo'shimcha izohlar",
      "status": "completed",
      "result": "passed",
      "evaluation": [
        {
          "name": "texnik",
          "score": 8
        },
        {
          "name": "Muomila",
          "score": 7
        }
      ],
      "completedAt": "2024-01-15T15:00:00.000Z"
    },
    {
      "_id": "stage_id_2",
      "stageName": "HR intervyu",
      "stageOrder": 2,
      "interviewDate": "2024-01-20T00:00:00.000Z",
      "interviewTime": "10:00",
      "location": "Ofis, 5-qavat",
      "interviewer": "Zarina Karimova",
      "notes": "",
      "status": "scheduled",
      "result": "pending",
      "evaluation": [],
      "completedAt": null
    }
  ]
}
```

**Error Responses:**
- `400`: Noto'g'ri topshirish ID
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Bosqichlar `stageOrder` bo'yicha tartiblangan
- Har bir bosqich uchun to'liq ma'lumotlar ko'rsatiladi

---

### 9. Bitta intervyu bosqichini olish

Bitta intervyu bosqichining to'liq ma'lumotlarini olish.

**Endpoint:** `GET /applications/:id/interview-stages/:stageId`

**Path Parameters:**
- `id`: Topshirish ID
- `stageId`: Intervyu bosqichi ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "stage_id",
    "stageName": "Texnik intervyu",
    "stageOrder": 1,
    "interviewDate": "2024-01-15T00:00:00.000Z",
    "interviewTime": "14:30",
    "location": "Ofis, 3-qavat",
    "interviewer": "Ahmadjon Ahmadov",
    "notes": "Qo'shimcha izohlar",
    "status": "completed",
    "result": "passed",
    "evaluation": [
      {
        "name": "texnik",
        "score": 8
      },
      {
        "name": "Muomila",
        "score": 7
      }
    ],
    "completedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri ID
- `404`: Topshirish yoki intervyu bosqichi topilmadi
- `500`: Server xatosi

---

### 10. Yakuniy qarorga javob berish

Yakuniy qarorga javob berish (qabul qilish yoki rad etish).

**Endpoint:** `POST /applications/:id/final-decision/respond`

**Path Parameters:**
- `id`: Topshirish ID

**Response:**
```json
{
  "success": true,
  "message": "Yakuniy qarorga javob berildi",
  "data": {
    "finalDecision": {
      "result": "hired",
      "reason": "Barcha bosqichlardan muvaffaqiyatli o'tdi",
      "responseStatus": "responded",
      "respondedAt": "2024-01-21T00:00:00.000Z",
      "decidedAt": "2024-01-20T00:00:00.000Z",
      "decidedBy": "Ahmadjon Ahmadov"
    }
  }
}
```

**Error Responses:**
- `400`: 
  - Yakuniy qaror hali qilinmagan
  - Yakuniy qarorga allaqachon javob berilgan
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Bu endpoint yakuniy qarorga javob berishni qayd etadi
- `responseStatus` `responded` ga o'zgaradi
- `respondedAt` avtomatik to'ldiriladi

---

### 11. Vakansiyani saqlab olish/o'chirish

Vakansiyani saqlanganlar ro'yxatiga qo'shish yoki olib tashlash.

**Endpoint:** `POST /vacancies/:id/bookmark`

**Path Parameters:**
- `id`: Vakansiya ID

**Response (Qo'shildi):**
```json
{
  "success": true,
  "message": "Vakansiya saqlanganlar ro'yxatiga qo'shildi",
  "isBookmarked": true
}
```

**Response (Olib tashlandi):**
```json
{
  "success": true,
  "message": "Vakansiya saqlanganlar ro'yxatidan olib tashlandi",
  "isBookmarked": false
}
```

**Error Responses:**
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

---

### 12. Saqlangan vakansiyalarni olish

Foydalanuvchi tomonidan saqlab olingan vakansiyalarni olish.

**Endpoint:** `GET /bookmarks`

**Query Parameters:**
- `page` (optional, default: 1): Sahifa raqami
- `limit` (optional, default: 20): Har bir sahifadagi elementlar soni

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "data": [
    {
      "_id": "vacancy_id",
      "name": "Vakansiya nomi",
      "target": "agent",
      "type": "fulltime",
      "experience": "2+ yil",
      "salary": "5000000 so'm",
      "description": { /* delta format */ },
      "responsibilities": { /* delta format */ },
      "preferences": { /* delta format */ },
      "skills": ["skill1", "skill2"],
      "minAge": 18,
      "maxAge": 45,
      "questions": [ /* savollar */ ],
      "applicationStatus": "pending" | null,
      "isBookmarked": true,
      "applicationCount": 15,
      "bookmarkedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500`: Server xatosi

---

## Ma'lumotlar tuzilishi

### Vacancy Object
```typescript
{
  _id: ObjectId;
  name: string;
  target: 'agent' | 'punkt';
  type: 'parttime' | 'fulltime';
  experience: string;
  salary: string;
  description: DeltaFormat | null;
  responsibilities: DeltaFormat | null;
  preferences: DeltaFormat | null;
  skills: string[];
  minAge: number | null;
  maxAge: number | null;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Question Object
```typescript
{
  question: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options: string[];
  placeholder: string;
}
```

### Application Object
```typescript
{
  _id: ObjectId;
  vacancy: ObjectId | Vacancy;
  applicant: ObjectId | VacancyApplicant;
  answers: Answer[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

### Answer Object
```typescript
{
  questionId: string;
  question: string;
  type: string;
  answer: string | number | string[] | object;
}
```

---

## Eslatmalar

1. **Autentifikatsiya:** Barcha endpointlar JWT token talab qiladi. Token `vacancy_applicant` role bilan yaratilgan bo'lishi kerak.

2. **Pagination:** Barcha ro'yxat endpointlari pagination qo'llab-quvvatlaydi.

3. **Validation:** Vakansiyaga topshirishda barcha savollarga javob berilishi kerak va majburiy savollarga javob berilishi shart.

4. **Application Status:**
   - `pending`: Ko'rib chiqilmoqda
   - `reviewed`: Ko'rib chiqilgan
   - `accepted`: Qabul qilingan
   - `rejected`: Rad etilgan

5. **Admin Decision:**
   - `pending`: Hali qaror qilinmagan
   - `accepted`: Qabul qilingan
   - `rejected`: Bekor qilingan

6. **Interview Stage Status:**
   - `scheduled`: Rejalashtirilgan
   - `in_progress`: Davom etmoqda
   - `completed`: Yakunlangan
   - `cancelled`: Bekor qilingan

7. **Interview Stage Result:**
   - `pending`: Hali natija yo'q
   - `passed`: Muvaffaqiyatli o'tdi
   - `failed`: Muvaffaqiyatsiz

8. **Final Decision:**
   - `pending`: Hali qaror qilinmagan
   - `hired`: Ishga qabul qilindi
   - `rejected`: Rad etildi

9. **View Count:** Har bir vakansiya uchun ko'rganlar soni alohida hisoblanadi. Bitta user bir vakansiyani bir necha marta ko'rsa ham faqat 1 marta hisoblanadi. View tracking uchun `POST /vacancies/:id/view` endpointidan foydalaning.

10. **Bookmark:** Bir nomzod bir vakansiyani bir marta saqlab olishi mumkin.

11. **Evaluations:** Baholashlar ikki turda bo'lishi mumkin:
    - Admin baholash: Admin tomonidan qabul qilish/bekor qilish paytida qo'yilgan baholash
    - Intervyu bosqichlari baholashlari: Har bir intervyu bosqichida qo'yilgan baholashlar

12. **Final Decision Response:** Yakuniy qarorga javob berish uchun `POST /applications/:id/final-decision/respond` endpointidan foydalaning. Bu endpoint `responseStatus` ni `responded` ga o'zgartiradi.

---

## Misollar

### Vakansiyalarni olish
```bash
curl -X GET "http://localhost:5000/api/vacancy/vacancies?target=agent&type=fulltime&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Vakansiyaga topshirish
```bash
curl -X POST "http://localhost:5000/api/vacancy/vacancies/vacancy_id/apply" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "0",
        "answer": "Javob matni"
      },
      {
        "questionId": "1",
        "answer": 25
      }
    ]
  }'
```

### Vakansiyani ko'rishni qayd etish
```bash
curl -X POST "http://localhost:5000/api/vacancy/vacancies/vacancy_id/view" \
  -H "Authorization: Bearer <token>"
```

### Topshirish baholashlarini olish
```bash
curl -X GET "http://localhost:5000/api/vacancy/applications/application_id/evaluations" \
  -H "Authorization: Bearer <token>"
```

### Intervyu bosqichlarini olish
```bash
curl -X GET "http://localhost:5000/api/vacancy/applications/application_id/interview-stages" \
  -H "Authorization: Bearer <token>"
```

### Bitta intervyu bosqichini olish
```bash
curl -X GET "http://localhost:5000/api/vacancy/applications/application_id/interview-stages/stage_id" \
  -H "Authorization: Bearer <token>"
```

### Yakuniy qarorga javob berish
```bash
curl -X POST "http://localhost:5000/api/vacancy/applications/application_id/final-decision/respond" \
  -H "Authorization: Bearer <token>"
```

### Vakansiyani saqlab olish
```bash
curl -X POST "http://localhost:5000/api/vacancy/vacancies/vacancy_id/bookmark" \
  -H "Authorization: Bearer <token>"
```

