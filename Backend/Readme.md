# TTSA Backend - Talab va Taklif Agency Backend API

**Versiya:** 1.0.0  
**Texnologiyalar:** Node.js, Express.js, MongoDB, Redis, Socket.io  
**Status:** Production Ready ✅

---

## 📋 Loyiha Haqida

TTSA Backend - bu keng qamrovli e-commerce marketplace platformasi bo'lib, quyidagi asosiy funksiyalarni ta'minlaydi:

- **Multi-role foydalanuvchi tizimi** (Admin, Contragent, Agent, Punkt, Marketplace User)
- **To'liq buyurtma boshqaruvi** (order workflow, punkt-to-punkt exchange)
- **KPI bonus tizimi** (Agent va Punkt uchun)
- **Contragent to'lov tizimi** (KPI dan oshgan summalar)
- **Moliya boshqaruvi** (Agentlar uchun kunlik/haftalik/oylik hisobotlar)
- **Vakansiya tizimi** (Ishga qabul jarayoni, intervyu bosqichlari)
- **Real-time bildirishnomalar** (Socket.io)
- **Review va baholash tizimi**
- **Redis caching** (Performance optimizatsiyasi)

---

## 🚀 Tez Boshlash

### Talablar

- Node.js (v16 yoki yuqori)
- MongoDB (v5 yoki yuqori)
- Redis (v6 yoki yuqori) - ixtiyoriy, lekin tavsiya etiladi

### O'rnatish

```bash
# Repository'ni clone qiling
git clone <repository-url>
cd backend

# Dependencies o'rnatish
npm install

# Environment variables sozlash
cp .env.example .env
# .env faylini to'ldiring

# MongoDB va Redis'ni ishga tushiring

# Server'ni ishga tushiring
npm start

# Yoki development mode (nodemon bilan)
npm run dev
```

### Environment Variables

`.env` faylida quyidagi o'zgaruvchilar kerak:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ttsa

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=30d

# Server
PORT=5000

# SMS (Eskiz)
ESKIZ_EMAIL=your-email@example.com
ESKIZ_PASSWORD=your-password

# Redis (ixtiyoriy)
REDIS_URL=redis://localhost:6379
```

---

## 📁 Proyekt Strukturasi

```
backend/
├── config/              # Konfiguratsiya fayllari
│   ├── database.js      # MongoDB connection
│   ├── redis.js         # Redis client va cache funksiyalari
│   └── socket.js        # Socket.io konfiguratsiyasi
├── controllers/         # Business logic
│   ├── admin*.js        # Admin controller'lar
│   ├── agent*.js        # Agent controller'lar
│   ├── punkt*.js       # Punkt controller'lar
│   ├── contragent*.js  # Contragent controller'lar
│   ├── order*.js       # Order controller'lar
│   └── ...
├── models/              # Mongoose schema'lar
│   ├── Admin.js
│   ├── Agent.js
│   ├── Punkt.js
│   ├── Order.js
│   └── ...
├── routes/              # Express route'lar
│   ├── adminRoutes.js
│   ├── agentRoutes.js
│   ├── punktRoutes.js
│   └── ...
├── middleware/          # Custom middleware'lar
│   ├── auth.js         # Authentication middleware
│   ├── validation.js   # Joi validation
│   └── cache.js        # Redis cache middleware
├── services/            # External services
│   └── smsService.js   # SMS xizmati (Eskiz)
├── utils/               # Utility funksiyalar
│   └── kpiBonusCalculator.js
├── scripts/            # Utility script'lar
│   ├── createGeneralAdmin.js
│   ├── importRegions.js
│   └── test-notifications.js
├── docs/                # API dokumentatsiyasi
│   ├── admin-*.md
│   ├── agent-*.md
│   ├── punkt-*.md
│   └── ...
├── index.js            # Entry point
└── package.json
```

---

## 🔐 Foydalanuvchi Rollari

### 1. Admin
- Barcha tizimlarni boshqarish
- Vakansiyalar yaratish va boshqarish
- KPI va Contragent to'lovlarini boshqarish
- Statistika va hisobotlar
- Arxiv ma'lumotlari

**Endpoint:** `/api/admins`

### 2. Contragent (Yetkazib beruvchi)
- Maxsulotlar yaratish va boshqarish
- Buyurtmalarni qabul qilish va yetkazish
- Statistika ko'rish
- To'lovlar tarixi

**Endpoint:** `/api/contragents`, `/api/contragent`

### 3. Agent (Viloyat/Tuman/MFY)
- Buyurtmalarni qabul qilish va yetkazish
- KPI bonus ko'rish
- Kunlik hisobotlar
- Moliya topshiruvlari

**Endpoint:** `/api/agents`, `/api/agent`

### 4. Punkt (Yetkazib berish punkti)
- Buyurtmalarni qabul qilish
- Agentlarga tayinlash
- Kontragentlarga so'rov yuborish
- Punkt-to-punkt exchange
- KPI bonus ko'rish

**Endpoint:** `/api/punkts`, `/api/punkt`

### 5. Marketplace User (Mijoz)
- Maxsulotlarni ko'rish va qidirish
- Savatga qo'shish
- Buyurtma berish
- Review yozish
- Profil boshqarish

**Endpoint:** `/api/marketplace`

### 6. Vacancy Applicant (Nomzod)
- Vakansiyalarni ko'rish
- Topshirish yuborish
- Intervyu natijalarini ko'rish
- Profil boshqarish

**Endpoint:** `/api/vacancy-auth`, `/api/vacancy`, `/api/vacancy-profile`

---

## 🎯 Asosiy Funksiyalar

### 1. Buyurtma Tizimi

**Buyurtma Workflow:**
1. Marketplace User buyurtma yaratadi
2. Punkt buyurtmani qabul qiladi
3. Punkt kontragentlarga so'rov yuboradi
4. Contragent yetkazadi
5. Punkt agentga tayinlaydi
6. Agent mijozga yetkazadi
7. Mijoz tasdiqlaydi

**Endpoint'lar:**
- `POST /api/marketplace/orders` - Buyurtma yaratish
- `GET /api/punkt/orders` - Punkt buyurtmalari
- `POST /api/punkt/orders/:id/confirm` - Buyurtmani tasdiqlash
- `POST /api/contragent/orders/:orderId/respond` - Contragent javob berish
- `POST /api/agent/orders/:id/confirm` - Agent tasdiqlash

### 2. KPI Bonus Tizimi

**KPI Hisoblash:**
- Agent uchun: `(price - originalPrice) * quantity * agentKpiPercent / 100`
- Punkt uchun: `(price - originalPrice) * quantity * punktKpiPercent / 100`
- Transfer uchun: `(price - originalPrice) * quantity * transferKpiPercent / 100`

**Endpoint'lar:**
- `GET /api/admin-kpi-payments/unpaid` - To'lanmagan KPI'lar
- `POST /api/admin-kpi-payments/mark-as-paid` - To'lovni tasdiqlash
- `GET /api/agent/kpi/summary` - Agent KPI summary
- `GET /api/punkt/kpi/summary` - Punkt KPI summary

### 3. Contragent To'lov Tizimi

**Hisoblash:**
- `paymentAmount = totalPrice - totalKpiPrice`
- KPI dan oshgan summa contragent'ga to'lanadi

**Endpoint'lar:**
- `GET /api/admin-contragent-payments/unpaid` - To'lanmagan to'lovlar
- `POST /api/admin-contragent-payments/sync` - Sinxronlashtirish
- `POST /api/admin-contragent-payments/mark-as-paid` - To'lovni tasdiqlash

### 4. Moliya Boshqaruvi

**Agent Moliya:**
- MFY Agent: Kunlik hisobot, to'lovlarni qabul qilish, tuman agentga topshirish
- Tuman Agent: Tuman hisoboti, MFY agentlardan topshiruvlarni qabul qilish, viloyat agentga topshirish
- Viloyat Agent: Viloyat hisoboti, tuman agentlardan topshiruvlarni qabul qilish, moliya bo'limiga topshirish

**Endpoint'lar:**
- `GET /api/agent-finance/mfy/daily-report` - MFY kunlik hisobot
- `POST /api/agent-finance/mfy/submit-to-district` - Tuman agentga topshirish
- `GET /api/admin-finance/reports/daily` - Admin kunlik hisobot

### 5. Vakansiya Tizimi

**Workflow:**
1. Admin vakansiya yaratadi
2. Nomzodlar topshirish yuboradi
3. Admin qabul qiladi/rad etadi
4. Intervyu bosqichlari o'tkaziladi
5. Yakuniy qaror qilinadi
6. **Yangi:** `hired` bo'lsa, target'ga qarab Punkt yoki Agent yaratiladi

**Endpoint'lar:**
- `POST /api/admins/vacancies` - Vakansiya yaratish
- `POST /api/vacancy/vacancies/:id/apply` - Topshirish yuborish
- `POST /api/admins/applications/:id/final-decision` - Yakuniy qaror
- `GET /api/vacancy/vacancies` - Vakansiyalarni ko'rish

### 6. Redis Caching

**Cache Strategiyasi:**
- Static ma'lumotlar (categories, regions): 1 hour
- Dynamic ma'lumotlar (orders, notifications): 1-5 min
- Real-time ma'lumotlar (unread count): 30 sec
- User-specific ma'lumotlar (cart, profile): 1-5 min

**Avtomatik Cache Invalidation:**
- POST/PUT/DELETE request'larda tegishli cache'lar invalidate qilinadi
- Pattern-based cache deletion

### 7. Real-time Bildirishnomalar

**Socket.io Events:**
- `notification` - Yangi bildirishnoma
- `order-update` - Buyurtma yangilanishi
- `kpi-payment` - KPI to'lovi

**Endpoint'lar:**
- `GET /api/notifications/my/:userType/:userId` - Bildirishnomalarni olish
- `POST /api/notifications/:notificationId/read` - O'qilgan deb belgilash

---

## 📚 API Dokumentatsiyasi

Barcha API endpoint'lar uchun to'liq dokumentatsiya `docs/` papkasida mavjud:

### Admin API
- `docs/admin-api.md` - Admin CRUD
- `docs/admin-data-api.md` - Ma'lumotlar ko'rish
- `docs/admin-kpi-api.md` - KPI boshqaruvi
- `docs/admin-kpi-payment-api.md` - KPI to'lovlari
- `docs/admin-contragent-payment-api.md` - Contragent to'lovlari
- `docs/admin-finance-api.md` - Moliya boshqaruvi
- `docs/admin-vacancy-api.md` - Vakansiyalar
- `docs/admin-vacancy-application-api.md` - Topshirishlar

### Agent API
- `docs/agent-api.md` - Agent CRUD
- `docs/agent-order-api.md` - Buyurtmalar
- `docs/agent-kpi-api.md` - KPI
- `docs/agent-finance-api.md` - Moliya

### Punkt API
- `docs/punkt-api.md` - Punkt CRUD
- `docs/punkt-order-api.md` - Buyurtmalar
- `docs/punkt-kpi-api.md` - KPI
- `docs/punkt-to-punkt-exchange-api.md` - Punkt-to-punkt

### Contragent API
- `docs/contragent-api.md` - Contragent CRUD
- `docs/contragent-order-api.md` - Buyurtmalar

### Marketplace API
- `docs/marketplace-api.md` - Umumiy API
- `docs/marketplace-cart-api.md` - Savat
- `docs/marketplace-order-api.md` - Buyurtmalar
- `docs/marketplace-payment-api.md` - To'lovlar

### Vacancy API
- `docs/vacancy-auth-api.md` - Autentifikatsiya
- `docs/vacancy-application-api.md` - Topshirishlar
- `docs/vacancy-profile-api.md` - Profil

---

## 🛠️ Development Scripts

```bash
# Server'ni ishga tushirish
npm start

# Development mode (nodemon)
npm run dev

# Umumiy admin yaratish
npm run create-admin

# Test bildirishnomalar
npm run create-notification

# Region'larni import qilish
npm run import-regions
```

---

## 🔧 Texnologiyalar

### Core
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Caching
- **Redis** - In-memory cache

### Real-time
- **Socket.io** - WebSocket communication

### Authentication & Security
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Validation
- **Joi** - Schema validation

### External Services
- **Eskiz** - SMS xizmati
- **Axios** - HTTP client

---

## 📊 Performance Optimizatsiyasi

### Redis Caching
- Barcha GET endpoint'lar cache qilinadi
- Cache duration ma'lumot turiga qarab (30 sec - 1 hour)
- Avtomatik cache invalidation (POST/PUT/DELETE)

### Database Indexing
- Barcha asosiy field'lar uchun indexlar
- Compound indexlar (performance uchun)
- Unique indexlar (data integrity uchun)

### Query Optimization
- Populate faqat kerakli field'lar bilan
- Lean queries (memory optimization)
- Pagination barcha list endpoint'larida

---

## 🔒 Xavfsizlik

### Authentication
- JWT token-based authentication
- Token expiration (30 days default)
- Role-based access control

### Password Security
- bcrypt hashing (salt rounds: 10)
- Password minimum length: 6 characters

### Data Validation
- Joi schema validation
- Input sanitization
- SQL injection protection (MongoDB)

### CORS
- Configurable CORS policy
- Production uchun specific domainlar

---

## 🐛 Xatoliklar va Yechimlar

### MongoDB Connection Error
```bash
# MongoDB ishlamayapti
# Yechim: MongoDB'ni ishga tushiring
mongod
```

### Redis Connection Error
```bash
# Redis ishlamayapti
# Yechim: Redis'ni ishga tushiring yoki REDIS_URL'ni o'chiring
redis-server
```

### Port Already in Use
```bash
# Port allaqachon ishlatilmoqda
# Yechim: PORT environment variable'ni o'zgartiring
PORT=5001 npm start
```

---

## 📝 Changelog

### v1.0.0 (2024)
- ✅ Asosiy funksiyalar
- ✅ KPI bonus tizimi
- ✅ Contragent to'lov tizimi
- ✅ Moliya boshqaruvi
- ✅ Vakansiya tizimi (Punkt/Agent yaratish bilan)
- ✅ Redis caching
- ✅ Real-time bildirishnomalar
- ✅ To'liq API dokumentatsiyasi

---

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request yarating

---

## 📄 License

ISC License

---

## 👥 Mualliflar

TTSA Development Team

---

## 📞 Aloqa

Savollar yoki takliflar uchun issue yarating yoki email yuboring.

---

## 🎯 Keyingi Rejalar

- [ ] Unit va Integration testlar
- [ ] API versioning
- [ ] Swagger/OpenAPI dokumentatsiyasi
- [ ] Rate limiting
- [ ] Advanced logging (Winston)
- [ ] Performance monitoring
- [ ] Database backup strategy

---

**Status:** ✅ Production Ready  
**Last Updated:** 2024
