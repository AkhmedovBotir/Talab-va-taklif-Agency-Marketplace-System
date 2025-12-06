# Admin Vakansiya Topshirishlari API Dokumentatsiyasi

Bu API admin tomonidan vakansiyaga topshirgan nomzodlarni ko'rish, javoblarini ko'rish, qabul qilish/bekor qilish, intervyu rejalashtirish va yakuniy qaror qilish imkoniyatlarini ta'minlaydi.

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

### 1. Vakansiyaga topshirgan nomzodlarni olish

Muayyan vakansiyaga topshirgan barcha nomzodlarni olish.

**Endpoint:** `GET /vacancies/:vacancyId/applications`

**Path Parameters:**
- `vacancyId`: Vakansiya ID

**Query Parameters:**
- `status` (optional): `pending`, `reviewed`, `accepted`, `rejected` - topshirish holati
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
      "_id": "application_id",
      "vacancy": "vacancy_id",
      "applicant": {
        "_id": "applicant_id",
        "firstName": "Ism",
        "lastName": "Familiya",
        "phone": "+998901234567",
        "gender": "male",
        "birthDate": "1990-01-01T00:00:00.000Z",
        "avatar": "data:image/png;base64,...",
        "viloyat": {
          "_id": "region_id",
          "name": "Andijon viloyati"
        },
        "tuman": {
          "_id": "region_id",
          "name": "Buloqboshi tumani"
        },
        "mfy": {
          "_id": "region_id",
          "name": "Buyuk turon MFY"
        }
      },
      "answers": [ /* javoblar */ ],
      "status": "pending",
      "adminDecision": "pending",
      "adminEvaluation": [],
      "adminNotes": "",
      "interviewStages": [],
      "finalDecision": {
        "result": "pending",
        "reason": "",
        "responseStatus": "waiting",
        "respondedAt": null,
        "decidedAt": null,
        "decidedBy": ""
      },
      "appliedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404`: Vakansiya topilmadi
- `500`: Server xatosi

---

### 2. Topshirishni ID bo'yicha olish

Bitta topshirishning to'liq ma'lumotlarini olish (javoblar bilan).

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
    "status": "pending",
    "adminDecision": "pending",
    "adminEvaluation": [],
    "adminNotes": "",
    "adminDecidedAt": null,
    "adminDecidedBy": null,
    "interviewStages": [],
    "finalDecision": {
      "result": "pending",
      "reason": "",
      "responseStatus": "waiting",
      "respondedAt": null,
      "decidedAt": null,
      "decidedBy": ""
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Noto'g'ri topshirish ID
- `404`: Topshirish topilmadi
- `500`: Server xatosi

---

### 3. Topshirishni qabul qilish yoki bekor qilish

Nomzodni qabul qilish yoki bekor qilish (baholash bilan).

**Endpoint:** `POST /applications/:id/decide`

**Path Parameters:**
- `id`: Topshirish ID

**Request Body:**
```json
{
  "decision": "accepted",
  "evaluation": [
    {
      "name": "texnik",
      "score": 5
    },
    {
      "name": "Muomila",
      "score": 5
    }
  ],
  "notes": "Qo'shimcha izohlar"
}
```

**Field Descriptions:**
- `decision` (required): `accepted` yoki `rejected` - qaror
- `evaluation` (optional): Baholash ro'yxati
  - `name` (required): Baholash nomi (masalan: "texnik", "Muomila")
  - `score` (required): Baho (0 dan 10 gacha)
- `notes` (optional): Qo'shimcha izohlar

**Response:**
```json
{
  "success": true,
  "message": "Topshirish qabul qilindi",
  "data": {
    "_id": "application_id",
    "vacancy": "vacancy_id",
    "applicant": { /* applicant object */ },
    "answers": [ /* javoblar */ ],
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
    "adminNotes": "Qo'shimcha izohlar",
    "adminDecidedAt": "2024-01-01T00:00:00.000Z",
    "adminDecidedBy": "admin_id",
    "interviewStages": [],
    "finalDecision": { /* final decision object */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Qaror kiritilmagan yoki noto'g'ri
  - Baholash formati noto'g'ri
  - Baho 0 dan 10 gacha bo'lishi kerak
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Qabul qilingan topshirishlar uchun intervyu rejalashtirish mumkin
- Bekor qilingan topshirishlar uchun intervyu rejalashtirish mumkin emas

---

### 4. Intervyu bosqichini qo'shish

Qabul qilingan topshirish uchun intervyu bosqichini qo'shish.

**Endpoint:** `POST /applications/:id/interview-stages`

**Path Parameters:**
- `id`: Topshirish ID

**Request Body:**
```json
{
  "stageName": "Texnik intervyu",
  "stageOrder": 1,
  "interviewDate": "2024-01-15",
  "interviewTime": "14:30",
  "location": "Ofis, 3-qavat",
  "interviewer": "Ahmadjon Ahmadov",
  "notes": "Qo'shimcha izohlar"
}
```

**Field Descriptions:**
- `stageName` (required): Bosqich nomi
- `stageOrder` (required): Bosqich tartibi (1, 2, 3, ...)
- `interviewDate` (required): Intervyu sanasi (ISO format)
- `interviewTime` (required): Intervyu vaqti (HH:MM format, masalan: "14:30")
- `location` (optional): Intervyu joyi
- `interviewer` (optional): Intervyu oluvchi
- `notes` (optional): Qo'shimcha izohlar

**Response:**
```json
{
  "success": true,
  "message": "Intervyu bosqichi qo'shildi",
  "data": {
    "_id": "application_id",
    "vacancy": "vacancy_id",
    "applicant": { /* applicant object */ },
    "answers": [ /* javoblar */ ],
    "status": "accepted",
    "adminDecision": "accepted",
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
        "status": "scheduled",
        "result": "pending",
        "evaluation": [],
        "completedAt": null
      }
    ],
    "finalDecision": { /* final decision object */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Majburiy maydonlar kiritilmagan
  - Intervyu sanasi noto'g'ri
  - Vaqt formati noto'g'ri (HH:MM)
  - Topshirish qabul qilinmagan
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Faqat qabul qilingan topshirishlar uchun intervyu rejalashtirish mumkin
- Bir topshirish uchun bir nechta intervyu bosqichlari bo'lishi mumkin

---

### 5. Intervyu bosqichini olish

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
    "application": {
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
        }
      },
      "status": "accepted",
      "adminDecision": "accepted"
    },
    "interviewStage": {
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
}
```

**Error Responses:**
- `404`: Topshirish yoki intervyu bosqichi topilmadi
- `500`: Server xatosi

---

### 6. Intervyu bosqichini yangilash

Intervyu bosqichining ma'lumotlarini yangilash.

**Endpoint:** `PUT /applications/:id/interview-stages/:stageId`

**Path Parameters:**
- `id`: Topshirish ID
- `stageId`: Intervyu bosqichi ID

**Request Body:**
```json
{
  "stageName": "Texnik intervyu (yangilangan)",
  "stageOrder": 1,
  "interviewDate": "2024-01-16",
  "interviewTime": "15:00",
  "location": "Yangi ofis, 5-qavat",
  "interviewer": "Yangi intervyu oluvchi",
  "notes": "Yangilangan izohlar",
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
  ]
}
```

**Field Descriptions:**
- `stageName` (optional): Bosqich nomi
- `stageOrder` (optional): Bosqich tartibi
- `interviewDate` (optional): Intervyu sanasi
- `interviewTime` (optional): Intervyu vaqti (HH:MM)
- `location` (optional): Intervyu joyi
- `interviewer` (optional): Intervyu oluvchi
- `notes` (optional): Qo'shimcha izohlar
- `status` (optional): `scheduled`, `in_progress`, `completed`, `cancelled`
- `result` (optional): `pending`, `passed`, `failed`
- `evaluation` (optional): Baholash ro'yxati

**Response:**
```json
{
  "success": true,
  "message": "Intervyu bosqichi yangilandi",
  "data": {
    "_id": "application_id",
    "vacancy": "vacancy_id",
    "applicant": { /* applicant object */ },
    "interviewStages": [
      {
        "_id": "stage_id",
        "stageName": "Texnik intervyu (yangilangan)",
        "stageOrder": 1,
        "interviewDate": "2024-01-16T00:00:00.000Z",
        "interviewTime": "15:00",
        "location": "Yangi ofis, 5-qavat",
        "interviewer": "Yangi intervyu oluvchi",
        "notes": "Yangilangan izohlar",
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
        "completedAt": "2024-01-16T15:00:00.000Z"
      }
    ],
    "finalDecision": { /* final decision object */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-16T15:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: 
  - Status yoki natija noto'g'ri
  - Baholash formati noto'g'ri
  - Baho 0 dan 10 gacha bo'lishi kerak
- `404`: Topshirish yoki intervyu bosqichi topilmadi
- `500`: Server xatosi

**Eslatma:**
- `status` `completed` ga o'zgarganda, `completedAt` avtomatik to'ldiriladi
- Barcha intervyu bosqichlari `completed` bo'lgandan keyin yakuniy qaror qilish mumkin

---

### 7. Intervyu natijasini kiritish

Intervyu natijasini kiritish (result va evaluation bilan). Bu endpoint faqat natija bilan ishlaydi.

**Endpoint:** `POST /applications/:id/interview-stages/:stageId/result`

**Path Parameters:**
- `id`: Topshirish ID
- `stageId`: Intervyu bosqichi ID

**Request Body:**
```json
{
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
  "notes": "Qo'shimcha izohlar"
}
```

**Field Descriptions:**
- `result` (required): `passed` yoki `failed` - intervyu natijasi
- `evaluation` (optional): Baholash ro'yxati
  - `name` (required): Baholash nomi
  - `score` (required): Baho (0 dan 10 gacha)
- `notes` (optional): Qo'shimcha izohlar

**Response:**
```json
{
  "success": true,
  "message": "Intervyu natijasi: Muvaffaqiyatli o'tdi",
  "data": {
    "application": {
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
      "status": "accepted"
    },
    "interviewStage": {
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
}
```

**Error Responses:**
- `400`: 
  - Natija kiritilmagan yoki noto'g'ri
  - Baholash formati noto'g'ri
  - Baho 0 dan 10 gacha bo'lishi kerak
- `404`: Topshirish yoki intervyu bosqichi topilmadi
- `500`: Server xatosi

**Eslatma:**
- Natija kiritilganda, `status` avtomatik `completed` ga o'zgaradi
- `completedAt` avtomatik to'ldiriladi
- Bu endpoint faqat natija bilan ishlaydi, boshqa maydonlarni yangilash uchun `PUT /applications/:id/interview-stages/:stageId` dan foydalaning

---

### 8. Intervyu bosqichini o'chirish

Intervyu bosqichini o'chirish.

**Endpoint:** `DELETE /applications/:id/interview-stages/:stageId`

**Path Parameters:**
- `id`: Topshirish ID
- `stageId`: Intervyu bosqichi ID

**Response:**
```json
{
  "success": true,
  "message": "Intervyu bosqichi o'chirildi",
  "data": {
    "_id": "application_id",
    "vacancy": "vacancy_id",
    "applicant": { /* applicant object */ },
    "interviewStages": [ /* qolgan bosqichlar */ ],
    "finalDecision": { /* final decision object */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Topshirish yoki intervyu bosqichi topilmadi
- `500`: Server xatosi

---

### 9. Yakuniy qaror qilish

Barcha intervyu bosqichlari yakunlangandan keyin yakuniy qaror qilish.

**Endpoint:** `POST /applications/:id/final-decision`

**Path Parameters:**
- `id`: Topshirish ID

**Request Body:**
```json
{
  "result": "hired",
  "reason": "Barcha bosqichlardan muvaffaqiyatli o'tdi",
  "decidedBy": "Ahmadjon Ahmadov"
}
```

**Field Descriptions:**
- `result` (required): `hired` yoki `rejected` - yakuniy qaror
- `reason` (optional): Qaror sababi
- `decidedBy` (optional): Qaror qilgan shaxs nomi

**Response:**
```json
{
  "success": true,
  "message": "Yakuniy qaror: Ishga qabul qilindi",
  "data": {
    "_id": "application_id",
    "vacancy": "vacancy_id",
    "applicant": { /* applicant object */ },
    "answers": [ /* javoblar */ ],
    "status": "accepted",
    "adminDecision": "accepted",
    "interviewStages": [ /* barcha bosqichlar */ ],
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
- `400`: 
  - Yakuniy qaror kiritilmagan yoki noto'g'ri
  - Barcha intervyu bosqichlari yakunlanmagan
  - Muvaffaqiyatsiz intervyu bosqichlari bor (hired uchun)
- `404`: Topshirish topilmadi
- `500`: Server xatosi

**Eslatma:**
- Yakuniy qaror qilishdan oldin barcha intervyu bosqichlari `completed` bo'lishi kerak
- Agar biror intervyu bosqichi `failed` bo'lsa, `hired` qaror qilish mumkin emas
- Yakuniy qaror qilingandan keyin `status` avtomatik yangilanadi

---

## Ma'lumotlar tuzilishi

### Application Object
```typescript
{
  _id: ObjectId;
  vacancy: ObjectId | Vacancy;
  applicant: ObjectId | VacancyApplicant;
  answers: Answer[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  adminDecision: 'pending' | 'accepted' | 'rejected';
  adminEvaluation: Evaluation[];
  adminNotes: string;
  adminDecidedAt: Date | null;
  adminDecidedBy: ObjectId | Admin | null;
  interviewStages: InterviewStage[];
  finalDecision: FinalDecision;
  createdAt: Date;
  updatedAt: Date;
}
```

### Evaluation Object
```typescript
{
  name: string;
  score: number; // 0-10
}
```

### InterviewStage Object
```typescript
{
  _id: ObjectId;
  stageName: string;
  stageOrder: number;
  interviewDate: Date;
  interviewTime: string; // HH:MM format
  location: string;
  interviewer: string;
  notes: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  result: 'pending' | 'passed' | 'failed';
  evaluation: Evaluation[];
  completedAt: Date | null;
}
```

### FinalDecision Object
```typescript
{
  result: 'pending' | 'hired' | 'rejected';
  reason: string;
  responseStatus: 'waiting' | 'responded';
  respondedAt: Date | null;
  decidedAt: Date | null;
  decidedBy: string;
}
```

---

## Eslatmalar

1. **Autentifikatsiya:** Barcha endpointlar JWT token talab qiladi. Token `admin` role bilan yaratilgan bo'lishi kerak.

2. **Workflow:**
   - Topshirish keladi → `pending` status
   - Admin ko'rib chiqadi → `reviewed` status
   - Admin qabul qiladi/bekor qiladi → `accepted`/`rejected` status + `adminDecision`
   - Qabul qilinganlar uchun intervyu rejalashtiriladi → `interviewStages`
   - Barcha intervyu bosqichlari yakunlanadi → `completed` status
   - Yakuniy qaror qilinadi → `finalDecision`

3. **Baholash:**
   - Admin qabul qilish/bekor qilishda baholash qo'shishi mumkin
   - Har bir intervyu bosqichida ham baholash qo'shish mumkin
   - Baho 0 dan 10 gacha bo'lishi kerak

4. **Intervyu Bosqichlari:**
   - Faqat qabul qilingan topshirishlar uchun rejalashtiriladi
   - Bir topshirish uchun bir nechta bosqich bo'lishi mumkin
   - Har bir bosqich uchun alohida baholash qo'shish mumkin

5. **Yakuniy Qaror:**
   - Barcha intervyu bosqichlari yakunlanishi kerak
   - Muvaffaqiyatsiz bosqichlar bo'lsa, `hired` qaror qilish mumkin emas

---

## Misollar

### Vakansiyaga topshirgan nomzodlarni olish
```bash
curl -X GET "http://localhost:5000/api/admins/vacancies/vacancy_id/applications?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Topshirishni qabul qilish
```bash
curl -X POST "http://localhost:5000/api/admins/applications/application_id/decide" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "accepted",
    "evaluation": [
      {
        "name": "texnik",
        "score": 5
      },
      {
        "name": "Muomila",
        "score": 5
      }
    ],
    "notes": "Yaxshi nomzod"
  }'
```

### Intervyu bosqichini qo'shish
```bash
curl -X POST "http://localhost:5000/api/admins/applications/application_id/interview-stages" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stageName": "Texnik intervyu",
    "stageOrder": 1,
    "interviewDate": "2024-01-15",
    "interviewTime": "14:30",
    "location": "Ofis, 3-qavat",
    "interviewer": "Ahmadjon Ahmadov"
  }'
```

### Intervyu bosqichini olish
```bash
curl -X GET "http://localhost:5000/api/admins/applications/application_id/interview-stages/stage_id" \
  -H "Authorization: Bearer <token>"
```

### Intervyu bosqichini yangilash
```bash
curl -X PUT "http://localhost:5000/api/admins/applications/application_id/interview-stages/stage_id" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
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
    ]
  }'
```

### Intervyu natijasini kiritish
```bash
curl -X POST "http://localhost:5000/api/admins/applications/application_id/interview-stages/stage_id/result" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
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
    "notes": "Yaxshi natija"
  }'
```

### Yakuniy qaror qilish
```bash
curl -X POST "http://localhost:5000/api/admins/applications/application_id/final-decision" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "hired",
    "reason": "Barcha bosqichlardan muvaffaqiyatli o'tdi",
    "decidedBy": "Ahmadjon Ahmadov"
  }'
```

---

## Xatoliklar

### 400 Bad Request
- Maydonlar validatsiyadan o'tmadi
- Format noto'g'ri
- Workflow qoidasi buzilgan

### 401 Unauthorized
- Token kiritilmagan yoki noto'g'ri
- Token muddati o'tgan

### 403 Forbidden
- Admin huquqi yo'q

### 404 Not Found
- Topshirish topilmadi
- Intervyu bosqichi topilmadi
- Vakansiya topilmadi

### 500 Internal Server Error
- Server xatosi
- Ma'lumotlar bazasi xatosi

