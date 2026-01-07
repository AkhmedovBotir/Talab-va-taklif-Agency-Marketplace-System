# Certificate Integration API Documentation

Bu hujjat sertifikat integratsiya API endpoints va ularning ishlatilishini tushuntiradi. Bu API ikki qismdan iborat:
1. **Public API** - Kompaniyalar uchun sertifikat ma'lumotlarini olish
2. **Admin API** - Adminlar uchun sertifikat egasini lavozimga tayinlash

---

## 1. Public Company Integration API

### Base URL

```
http://localhost:3000/api/company-integration
```

**Eslatma:** `localhost:3000` - bu public API (tashqi tizimlar uchun). Kompaniyalar o'z tizimlariga integratsiya qilishda bu API dan foydalanadilar.

### Authentication

**Bu API endpointlar authentication talab qilmaydi (public endpoints).** Barcha endpointlar ochiq va hech qanday token yoki autentifikatsiya kerak emas.

---

### Endpoints

#### 1.1 Get Candidate Data by Certificate ID

Sertifikat ID orqali nomzodning barcha ma'lumotlarini olish.

**Endpoint:** `GET /api/company-integration/certificate/:certificateId`

**Access:** Public (Authentication talab qilmaydi)

**URL Parameters:**
- `certificateId` (required) - Sertifikat ID (MongoDB ObjectId)

**Request Headers:**
```
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "507f1f77bcf86cd799439071",
      "certificateNumber": "CERT-20240120-1",
      "qrCode": "c959393d10c6a7404a43d403e020dc084e662b5bb75315e9b45da188010fc679",
      "issuedDate": "2024-01-21T10:00:00.000Z",
      "status": "active"
    },
    "candidate": {
      "id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "+998901234567",
      "telegramId": "@johndoe",
      "registrationType": "web"
    },
    "vacancy": {
      "title": "Senior Full Stack Developer",
      "department": "IT",
      "position": "Senior Developer"
    },
    "interview": {
      "date": "2024-01-20T00:00:00.000Z",
      "averageRating": 8.0
    },
    "application": {
      "status": "passed"
    },
    "testResults": [],
    "averageTestScore": 83.34,
    "issuedBy": {
      "id": "507f1f77bcf86cd799439001",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Sertifikat bekor qilingan:
```json
{
  "success": false,
  "message": "Certificate is revoked"
}
```

**404 Not Found** - Sertifikat topilmadi:
```json
{
  "success": false,
  "message": "Sertifikat topilmadi"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

#### 1.2 Get Candidate Data by Certificate Number

Sertifikat raqami orqali nomzodning barcha ma'lumotlarini olish.

**Endpoint:** `GET /api/company-integration/certificate-number/:certificateNumber`

**Access:** Public (Authentication talab qilmaydi)

**URL Parameters:**
- `certificateNumber` (required) - Sertifikat raqami (format: CERT-YYYYMMDD-N, masalan: CERT-20240120-1)

**Request Headers:**
```
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "507f1f77bcf86cd799439071",
      "certificateNumber": "CERT-20240120-1",
      "qrCode": "c959393d10c6a7404a43d403e020dc084e662b5bb75315e9b45da188010fc679",
      "issuedDate": "2024-01-21T10:00:00.000Z",
      "status": "active"
    },
    "candidate": {
      "id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "+998901234567",
      "telegramId": "@johndoe",
      "registrationType": "web"
    },
    "vacancy": {
      "title": "Senior Full Stack Developer",
      "department": "IT",
      "position": "Senior Developer"
    },
    "interview": {
      "date": "2024-01-20T00:00:00.000Z",
      "averageRating": 8.0
    },
    "application": {
      "status": "passed"
    },
    "testResults": [],
    "averageTestScore": 83.34,
    "issuedBy": {
      "id": "507f1f77bcf86cd799439001",
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Sertifikat bekor qilingan:
```json
{
  "success": false,
  "message": "Certificate is revoked"
}
```

**404 Not Found** - Sertifikat topilmadi:
```json
{
  "success": false,
  "message": "Certificate not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## 2. Admin Certificate Assignment API

### Base URL

```
http://localhost:5000/api/admin/certificate-assignment
```

**Eslatma:** `localhost:5000` - bu bizning ichki backend serverimiz. Bu API faqat adminlar tomonidan ishlatiladi.

### Authentication

**Bu API endpointlar admin authentication talab qiladi.** Barcha so'rovlarda Authorization header'da Bearer token bo'lishi kerak.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>
```

---

### Endpoints

#### 2.1 Assign Certificate to Position

Sertifikat egasini punkt, viloyat agenti, tuman agenti yoki MFY agenti lavozimiga tayinlash.

**Endpoint:** `POST /api/admin/certificate-assignment/assign`

**Access:** Admin only (Authentication required)

**Request Body:**
```json
{
  "certificateCode": "CERT-20240120-1",
  "positionType": "mfy_agent",
  "viloyatId": "507f1f77bcf86cd799439012",
  "tumanId": "507f1f77bcf86cd799439013",
  "mfyId": "507f1f77bcf86cd799439014",
  "name": "John Doe",
  "phone": "+998901234567"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certificateCode` | String | Yes | Sertifikat raqami yoki QR kod |
| `positionType` | String | Yes | Lavozim turi: `punkt`, `viloyat_agent`, `tuman_agent`, `mfy_agent` |
| `viloyatId` | ObjectId | Yes | Viloyat ID |
| `tumanId` | ObjectId | Conditional | Tuman ID (tuman_agent va mfy_agent uchun talab qilinadi) |
| `mfyId` | ObjectId | Conditional | MFY ID (faqat mfy_agent uchun talab qilinadi) |
| `name` | String | Optional | Foydalanuvchi ismi (agar berilmasa, sertifikatdagi nomzod ismi ishlatiladi) |
| `phone` | String | Optional | Telefon raqami (agar berilmasa, sertifikatdagi nomzod telefon raqami ishlatiladi) |

**Position Type Requirements:**

| Position Type | Required Fields |
|---------------|----------------|
| `punkt` | `viloyatId` |
| `viloyat_agent` | `viloyatId` |
| `tuman_agent` | `viloyatId`, `tumanId` |
| `mfy_agent` | `viloyatId`, `tumanId`, `mfyId` |

**Note:** `name` va `phone` ixtiyoriy. Agar ular berilmasa, sertifikatdagi nomzod ma'lumotlari (`candidate.firstName`, `candidate.lastName`, `candidate.phone`) ishlatiladi.

**Success Response (200 OK):**

Agar yangi foydalanuvchi yaratilgan bo'lsa:
```json
{
  "success": true,
  "message": "Nomzod muvaffaqiyatli ishga tayinlandi",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439080",
      "name": "John Doe",
      "phone": "+998901234567",
      "positionType": "mfy_agent",
      "viloyat": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Toshkent viloyati",
        "type": "region",
        "code": "TK"
      },
      "tuman": {
        "id": "507f1f77bcf86cd799439013",
        "name": "Yunusobod tumani",
        "type": "district",
        "code": "YU"
      },
      "mfy": {
        "id": "507f1f77bcf86cd799439014",
        "name": "MFY-1",
        "type": "mfy",
        "code": "MFY-001"
      },
      "status": "active",
      "passwordSetupAllowed": true,
      "isNew": true
    },
    "certificate": {
      "id": "507f1f77bcf86cd799439071",
      "certificateNumber": "CERT-20240120-1",
      "status": "active"
    },
    "candidate": {
      "id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "+998901234567"
    }
  }
}
```

Agar mavjud foydalanuvchi yangilangan bo'lsa:
```json
{
  "success": true,
  "message": "Nomzod ma'lumotlari yangilandi va ishga tayinlandi",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439080",
      "name": "John Doe",
      "phone": "+998901234567",
      "positionType": "mfy_agent",
      "viloyat": {...},
      "tuman": {...},
      "mfy": {...},
      "status": "active",
      "passwordSetupAllowed": true,
      "isNew": false
    },
    ...
  }
}
```

**Error Responses:**

**400 Bad Request** - Sertifikat kodi kiritilmagan:
```json
{
  "success": false,
  "message": "Sertifikat kodi kiritilishi shart"
}
```

**400 Bad Request** - Noto'g'ri lavozim turi:
```json
{
  "success": false,
  "message": "Lavozim turi noto'g'ri. Quyidagilardan birini tanlang: punkt, viloyat_agent, tuman_agent, mfy_agent"
}
```

**400 Bad Request** - Majburiy maydonlar yo'q:
```json
{
  "success": false,
  "message": "MFY agenti uchun viloyat, tuman va MFY kiritilishi shart"
}
```

**400 Bad Request** - Sertifikatda nomzod ma'lumotlari yo'q (agar name/phone berilmagan bo'lsa):
```json
{
  "success": false,
  "message": "Ism kiritilishi shart (yoki sertifikatda nomzod ismi bo'lishi kerak)"
}
```

**400 Bad Request** - Sertifikat bekor qilingan:
```json
{
  "success": false,
  "message": "Sertifikat bekor qilingan"
}
```

**400 Bad Request** - Telefon raqami allaqachon boshqa lavozimda ishlatilgan:
```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon agent sifatida ro'yxatdan o'tgan. Telefon raqami: +998901234567",
  "existingUser": {
    "type": "agent",
    "id": "507f1f77bcf86cd799439080",
    "name": "John Doe"
  }
}
```

Yoki punkt uchun:
```json
{
  "success": false,
  "message": "Bu telefon raqami allaqachon punkt sifatida ro'yxatdan o'tgan. Telefon raqami: +998901234567",
  "existingUser": {
    "type": "punkt",
    "id": "507f1f77bcf86cd799439081",
    "name": "Punkt Nomi"
  }
}
```

**400 Bad Request** - Hudud topilmadi:
```json
{
  "success": false,
  "message": "Viloyat topilmadi yoki noto'g'ri"
}
```

**401 Unauthorized** - Token topilmadi:
```json
{
  "success": false,
  "message": "Token topilmadi"
}
```

**404 Not Found** - Sertifikat topilmadi:
```json
{
  "success": false,
  "message": "Sertifikat topilmadi"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Response Data Structure

### Certificate Object
- `id` - Sertifikat ID
- `certificateNumber` - Sertifikat raqami (CERT-YYYYMMDD-N formatida)
- `qrCode` - QR kod token
- `issuedDate` - Berilgan sana
- `status` - Status (active yoki revoked)

### Candidate Object
- `id` - Nomzod ID
- `firstName` - Ism
- `lastName` - Familiya
- `fullName` - To'liq ism (virtual field)
- `phone` - Telefon raqami
- `telegramId` - Telegram ID (ixtiyoriy)
- `registrationType` - Ro'yxatdan o'tish turi (bot yoki web)

### Vacancy Object
- `title` - Vakansiya nomi
- `department` - Bo'lim
- `position` - Lavozim

### Interview Object
- `date` - Suhbat kuni
- `averageRating` - O'rtacha baxo (1-10)

### Application Object
- `status` - Status (pending, passed, failed)

### Issued By Object
- `id` - Admin ID
- `username` - Admin username
- `email` - Admin email

---

## Notes

1. **Public Access:** Company Integration API endpointlar authentication talab qilmaydi va ochiqdir. Har qanday kompaniya o'z tizimlariga integratsiya qilish uchun foydalanishi mumkin.

2. **Certificate Status:** Faqat `active` statusdagi sertifikatlar uchun ma'lumotlar qaytariladi. Agar sertifikat `revoked` bo'lsa, 400 Bad Request xatosi qaytariladi.

3. **Password Setup:** Assignment API orqali yaratilgan yoki yangilangan foydalanuvchilar uchun `passwordSetupAllowed` maydoni `true` bo'ladi, ya'ni parol kiritish shart emas. Foydalanuvchi keyinchalik parolni o'zi o'rnatishi mumkin.

4. **Existing Users:** Agar berilgan telefon raqami bilan foydalanuvchi allaqachon mavjud bo'lsa, uning ma'lumotlari yangilanadi va `isDeleted` flag'i `false` qilinadi. Bu holatda `isNew: false` qaytariladi.

5. **Region Validation:** Viloyat, tuman va MFY IDlari tekshiriladi va ularning to'g'ri ierarxik munosabati validatsiya qilinadi.

6. **Certificate Code:** `certificateCode` parametri ham sertifikat raqami (`certificateNumber`), ham QR kod (`qrCode`) bo'lishi mumkin.

---

## Example Usage

### JavaScript (Fetch API)

```javascript
// Get candidate data by certificate number (Public API)
const getCandidateByCertificateNumber = async (certificateNumber) => {
  const response = await fetch(
    `http://localhost:3000/api/company-integration/certificate-number/${certificateNumber}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data;
};

// Assign certificate to position (Admin API)
const assignCertificateToPosition = async (token, assignmentData) => {
  const response = await fetch(
    'http://localhost:5000/api/admin/certificate-assignment/assign',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(assignmentData)
    }
  );
  
  const data = await response.json();
  return data;
};

// Example usage
const certificateNumber = 'CERT-20240120-1';
const candidateData = await getCandidateByCertificateNumber(certificateNumber);

if (candidateData.success) {
  console.log('Candidate:', candidateData.data.candidate.fullName);
  console.log('Phone:', candidateData.data.candidate.phone);
}

// Assign to MFY Agent
const assignmentData = {
  certificateCode: certificateNumber,
  positionType: 'mfy_agent',
  viloyatId: '507f1f77bcf86cd799439012',
  tumanId: '507f1f77bcf86cd799439013',
  mfyId: '507f1f77bcf86cd799439014',
  name: 'John Doe',
  phone: '+998901234567'
};

const adminToken = 'your-admin-jwt-token';
const assignmentResult = await assignCertificateToPosition(adminToken, assignmentData);

if (assignmentResult.success) {
  console.log('User assigned:', assignmentResult.data.user.id);
  console.log('Is new user:', assignmentResult.data.user.isNew);
}
```

### cURL

```bash
# Get candidate data by certificate number (Public API)
curl -X GET "http://localhost:3000/api/company-integration/certificate-number/CERT-20240120-1" \
  -H "Content-Type: application/json"

# Assign certificate to position (Admin API)
curl -X POST "http://localhost:5000/api/admin/certificate-assignment/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "certificateCode": "CERT-20240120-1",
    "positionType": "mfy_agent",
    "viloyatId": "507f1f77bcf86cd799439012",
    "tumanId": "507f1f77bcf86cd799439013",
    "mfyId": "507f1f77bcf86cd799439014",
    "name": "John Doe",
    "phone": "+998901234567"
  }'
```

### Python

```python
import requests

# Get candidate data by certificate number (Public API)
def get_candidate_by_certificate_number(certificate_number):
    url = f"http://localhost:3000/api/company-integration/certificate-number/{certificate_number}"
    response = requests.get(url)
    return response.json()

# Assign certificate to position (Admin API)
def assign_certificate_to_position(token, assignment_data):
    url = "http://localhost:5000/api/admin/certificate-assignment/assign"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    response = requests.post(url, json=assignment_data, headers=headers)
    return response.json()

# Example usage
certificate_number = "CERT-20240120-1"
data = get_candidate_by_certificate_number(certificate_number)

if data['success']:
    candidate = data['data']['candidate']
    print(f"Candidate: {candidate['fullName']}")
    print(f"Phone: {candidate['phone']}")

# Assign to MFY Agent
assignment_data = {
    "certificateCode": certificate_number,
    "positionType": "mfy_agent",
    "viloyatId": "507f1f77bcf86cd799439012",
    "tumanId": "507f1f77bcf86cd799439013",
    "mfyId": "507f1f77bcf86cd799439014",
    "name": "John Doe",
    "phone": "+998901234567"
}

admin_token = "your-admin-jwt-token"
result = assign_certificate_to_position(admin_token, assignment_data)

if result['success']:
    print(f"User assigned: {result['data']['user']['id']}")
    print(f"Is new user: {result['data']['user']['isNew']}")
```

---

## Error Handling

Barcha endpointlar quyidagi umumiy xato kodlarini qaytarishi mumkin:

- **400 Bad Request** - Noto'g'ri so'rov parametrlari
- **401 Unauthorized** - Token topilmadi yoki noto'g'ri (faqat Admin API)
- **404 Not Found** - Sertifikat topilmadi
- **500 Internal Server Error** - Server xatosi

Xato javoblari quyidagi formatda bo'ladi:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Rate Limiting

Hozircha rate limiting qo'llanmaydi, lekin kelajakda qo'shilishi mumkin. Kompaniyalar o'z integratsiyalarida retry logic va error handling qo'llashlari tavsiya etiladi.

---

## Security Considerations

1. **Public Endpoints:** Company Integration API endpointlar public bo'lgani uchun, faqat sertifikat ID yoki raqami orqali ma'lumotlar olinadi. Boshqa ma'lumotlar olinmaydi.

2. **Certificate Status:** Faqat `active` statusdagi sertifikatlar uchun ma'lumotlar qaytariladi.

3. **Admin Authentication:** Assignment API faqat admin token bilan ishlaydi. Token har doim Authorization header'da bo'lishi kerak.

4. **Password Setup:** Tayinlangan foydalanuvchilar uchun parol majburiy emas. `passwordSetupAllowed: true` flag'i orqali foydalanuvchi keyinchalik parolni o'zi o'rnatishi mumkin.

5. **Data Privacy:** Kompaniyalar olingan ma'lumotlarni xavfsiz saqlashlari va faqat kerakli maqsadlar uchun ishlatishlari kerak.

6. **HTTPS:** Production muhitida HTTPS protokoli ishlatilishi tavsiya etiladi.

