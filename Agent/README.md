# Agent Dasturi

Agent Tizimi - buyurtmalar va moliyaviy operatsiyalarni boshqarish uchun mobil ilova.

## 📱 Loyiha haqida

Agent Dasturi - bu agentlar uchun mo'ljallangan mobil ilova bo'lib, quyidagi funksiyalarni ta'minlaydi:

- **Buyurtmalar boshqaruvi** - buyurtmalarni ko'rish, tasdiqlash va yetkazib berish
- **Buyurtmalar tarixi** - barcha buyurtmalar tarixini ko'rish
- **Moliya boshqaruvi** - moliyaviy hisobotlar, to'lovlar va statistikalar
- **Xabarnomalar** - real-time xabarnomalar va bildirishnomalar
- **KPI kuzatuv** - kunlik balans, hisobotlar va statistikalar
- **Profil** - agent ma'lumotlari va sozlamalar

## 🛠 Texnologiyalar

### Asosiy texnologiyalar

- **React Native** - 0.81.5 (Cross-platform mobil ilova framework)
- **Expo** - ~54.0.25 (Development va build platform)
- **TypeScript** - 5.9.2 (Type-safe JavaScript)
- **Expo Router** - ~6.0.15 (File-based routing tizimi)
- **React** - 19.1.0 (UI library)
- **React DOM** - 19.1.0 (Web uchun)

### Asosiy kutubxonalar

- `@expo/vector-icons` - ^15.0.3 (Ikonlar kutubxonasi)
- `@react-native-async-storage/async-storage` - ^2.1.0 (Lokal ma'lumotlar saqlash)
- `@react-native-community/datetimepicker` - ^8.5.1 (Sana va vaqt tanlash)
- `@react-navigation/bottom-tabs` - ^7.4.0 (Tab navigatsiya)
- `@react-navigation/native` - ^7.1.8 (Navigatsiya asoslari)
- `axios` - ^1.13.2 (HTTP client)
- `react-native-gesture-handler` - ~2.28.0 (Gesturalar)
- `react-native-reanimated` - ~4.1.1 (Animatsiyalar)
- `react-native-safe-area-context` - ~5.6.0 (Xavfsiz hudud konteksti)
- `react-native-screens` - ~4.16.0 (Native screen optimizatsiyasi)
- `expo-constants` - ~18.0.10 (Device constants)
- `expo-font` - ~14.0.9 (Font yuklash)
- `expo-haptics` - ~15.0.7 (Haptic feedback)
- `expo-image` - ~3.0.10 (Optimized image component)
- `expo-linking` - ~8.0.9 (Deep linking)
- `expo-splash-screen` - ~31.0.11 (Splash screen)
- `expo-status-bar` - ~3.0.8 (Status bar)
- `expo-system-ui` - ~6.0.8 (System UI)
- `expo-web-browser` - ~15.0.9 (Web browser)

### Development kutubxonalari

- `eslint` - ^9.25.0 (Code linting)
- `eslint-config-expo` - ~10.0.0 (Expo ESLint config)
- `typescript` - ~5.9.2 (TypeScript compiler)
- `@types/react` - ~19.1.0 (React type definitions)

## 🚀 O'rnatish va ishga tushirish

### Talablar

- **Node.js** - v18 yoki yuqori
- **npm** yoki **yarn** - Package manager
- **Expo CLI** - Global o'rnatilgan bo'lishi kerak
- **Android Studio** (Android uchun) - Emulator va build tools
- **Xcode** (iOS uchun, faqat macOS) - Simulator va build tools

### O'rnatish

1. **Loyihani klonlash va dependencies o'rnatish:**

```bash
# Dependencies o'rnatish
npm install

# Yoki yarn bilan
yarn install
```

2. **API konfiguratsiyasini sozlash:**

`config/api.ts` faylida API base URL ni o'zgartiring:

```typescript
export const API_BASE_URL = 'https://api.ttsa.uz/api';
```

3. **Ilovani ishga tushirish:**

```bash
# Development server ishga tushirish
npm start

# Android uchun (emulator yoki real device)
npm run android

# iOS uchun (faqat macOS, simulator yoki real device)
npm run ios

# Web uchun (browser)
npm run web
```

## 📁 Loyiha strukturası

```
agent/
├── app/                          # Expo Router sahifalar (file-based routing)
│   ├── _layout.tsx              # Root layout (AuthProvider bilan)
│   ├── index.tsx                # Asosiy sahifa (routing logic)
│   ├── login.tsx                # Kirish sahifasi
│   ├── kpi.tsx                  # KPI transaksiyalar sahifasi
│   ├── (tabs)/                  # Tab navigatsiya sahifalari
│   │   ├── _layout.tsx          # Tabs layout (unread count bilan)
│   │   ├── orders.tsx           # Buyurtmalar ro'yxati
│   │   ├── orders-history.tsx   # Buyurtmalar tarixi
│   │   ├── finance.tsx          # Moliya boshqaruvi
│   │   ├── notifications.tsx    # Xabarnomalar
│   │   └── profile.tsx         # Profil sahifasi
│   └── order/                   # Buyurtma detallari
│       └── [id].tsx             # Dynamic route - buyurtma ID bo'yicha
├── assets/                      # Rasmlar va resurslar
│   ├── icon.png                 # App icon
│   └── images/                  # Boshqa rasmlar
├── config/                      # Konfiguratsiya fayllari
│   └── api.ts                   # API endpoints va base URL
├── contexts/                    # React Context'lar
│   └── AuthContext.tsx          # Autentifikatsiya konteksti
├── services/                    # Xizmatlar
│   └── api.ts                   # API xizmati (barcha API so'rovlari)
├── types/                       # TypeScript tiplari
│   └── api.ts                   # API tiplari va interfeyslar
├── utils/                       # Utility funksiyalar
│   └── device.ts                # Device info va ID funksiyalari
├── app.json                     # Expo konfiguratsiyasi
├── eas.json                     # EAS Build konfiguratsiyasi
├── package.json                 # Dependencies va scripts
├── tsconfig.json                 # TypeScript konfiguratsiyasi
└── eslint.config.js             # ESLint konfiguratsiyasi
```

## 🔐 Autentifikatsiya va Xavfsizlik

### Autentifikatsiya jarayoni

1. **Parol o'rnatish (yangi foydalanuvchilar uchun):**
   - **Step 1:** Telefon raqamini kiritish
   - **Step 2:** SMS kodni tasdiqlash (5 ta raqam)
   - **Step 3:** Yangi parol o'rnatish (kamida 6 ta belgi)

2. **Kirish:**
   - Telefon raqami: `+998XXXXXXXXX` formatida (9 ta raqam)
   - Parol kiritish
   - Device verification (yangi qurilmalar uchun)

3. **Qurilma tasdiqlash:**
   - Yangi qurilma aniqlandi
   - SMS kod yuboriladi (5 ta raqam)
   - Kodni tasdiqlash
   - Avtomatik qayta kirish

### Token boshqaruvi

- Token `AsyncStorage` da saqlanadi (`@agent_token` key)
- Barcha API so'rovlarida avtomatik `Authorization: Bearer {token}` header qo'shiladi
- 401 xatolikda token tozalanadi va login sahifasiga yo'naltiriladi
- Request interceptor orqali avtomatik token qo'shiladi

### Device Information

- Har bir qurilma uchun unique ID yaratiladi
- Device ma'lumotlari (nomi, platform, OS, browser) login vaqtida yuboriladi
- Device ID `AsyncStorage` va `localStorage` (web uchun) da saqlanadi

## 👥 Agent rollari va huquqlar

Ilova uch xil agent rolini qo'llab-quvvatlaydi:

### 1. MFY Agent (Mahalla Fuqarolar Yig'ini Agent)

**Buyurtmalar:**
- Barcha buyurtmalarni ko'rish
- Buyurtma detallarini ko'rish
- Buyurtmani tasdiqlash (`assigned_to_agent` statusida)
- Buyurtmani yetkazilgan deb belgilash

**Moliya:**
- Kunlik hisobot ko'rish
- Kutilayotgan to'lovlarni ko'rish
- To'lovlarni qabul qilish (bitta yoki ko'p)
- Qabul qilingan to'lovlarni ko'rish
- Tuman agentga topshirish
- Statistika ko'rish

**KPI:**
- KPI balansini ko'rish
- KPI transaksiyalarini ko'rish

### 2. Tuman Agent

**Buyurtmalar:**
- Barcha buyurtmalarni ko'rish
- Buyurtma detallarini ko'rish

**Moliya:**
- Kunlik hisobot ko'rish
- MFY agentlardan kelgan topshiruvlarni ko'rish
- Topshiruvlarni tasdiqlash (bitta yoki ko'p)
- Qabul qilingan topshiruvlarni ko'rish
- Viloyat agentga topshirish
- Statistika ko'rish

**KPI:**
- KPI balansini ko'rish
- KPI transaksiyalarini ko'rish

### 3. Viloyat Agent

**Buyurtmalar:**
- Barcha buyurtmalarni ko'rish
- Buyurtma detallarini ko'rish

**Moliya:**
- Kunlik hisobot ko'rish
- Tuman agentlardan kelgan topshiruvlarni ko'rish
- Topshiruvlarni tasdiqlash (bitta yoki ko'p)
- Qabul qilingan topshiruvlarni ko'rish
- Moliya bo'limiga topshirish
- Statistika ko'rish

**KPI:**
- KPI balansini ko'rish
- KPI transaksiyalarini ko'rish

## 📋 Asosiy funksiyalar va ish jarayonlari

### 1. Buyurtmalar boshqaruvi

#### Buyurtmalar ro'yxati (`app/(tabs)/orders.tsx`)

**Funksiyalar:**
- Barcha buyurtmalarni ko'rish (pagination bilan)
- Qidiruv (buyurtma raqami yoki telefon raqami bo'yicha)
- Filtrlash (status, to'lov holati, sana bo'yicha)
- Pull-to-refresh
- KPI balans ko'rsatkichi (kunlik)
- Buyurtma detallariga o'tish

**Ish jarayoni:**
1. Sahifa yuklanganda barcha buyurtmalar yuklanadi
2. KPI balans avtomatik yuklanadi
3. Qidiruv yoki filter o'zgarganda yangi so'rov yuboriladi
4. Buyurtma kartasiga bosilganda detallar sahifasiga o'tiladi
5. MFY agent uchun "Tasdiqlash" tugmasi ko'rsatiladi (agar `assigned_to_agent` statusida bo'lsa)

**API so'rovlari:**
- `GET /agent/orders` - Barcha buyurtmalar
- `GET /agent/orders/today` - Bugungi buyurtmalar
- `GET /agent/kpi/summary` - KPI balans

#### Buyurtma detallari (`app/order/[id].tsx`)

**Funksiyalar:**
- To'liq buyurtma ma'lumotlari
- Mijoz ma'lumotlari
- Yetkazib berish manzili
- Mahsulotlar ro'yxati
- To'lov ma'lumotlari
- Agent ma'lumotlari (agar tayinlangan bo'lsa)
- Kontragent so'rovlari
- Punktdan punktga so'rovlar
- Buyurtmani tasdiqlash (MFY agent uchun)
- Buyurtmani yetkazilgan deb belgilash (MFY agent uchun)

**Ish jarayoni:**
1. Buyurtma ID bo'yicha ma'lumotlar yuklanadi
2. Barcha ma'lumotlar ko'rsatiladi
3. MFY agent uchun tasdiqlash/yetkazilgan deb belgilash tugmalari ko'rsatiladi
4. Har bir amal uchun tasdiqlash dialogi ko'rsatiladi

**API so'rovlari:**
- `GET /agent/orders/:id` - Buyurtma detallari
- `POST /agent/orders/:id/confirm` - Buyurtmani tasdiqlash
- `POST /agent/orders/:id/delivered` - Yetkazilgan deb belgilash

#### Buyurtmalar tarixi (`app/(tabs)/orders-history.tsx`)

**Funksiyalar:**
- Barcha buyurtmalar tarixi
- Sana bo'yicha filtrlash (dan-gacha)
- Pagination
- Pull-to-refresh

**Ish jarayoni:**
1. Barcha buyurtmalar yuklanadi
2. Sana filtrlari tanlanishi mumkin
3. Filterlar o'zgarganda yangi so'rov yuboriladi

**API so'rovlari:**
- `GET /agent/orders/history` - Buyurtmalar tarixi

### 2. Moliya boshqaruvi

#### MFY Agent moliya (`app/(tabs)/finance.tsx` - MFY uchun)

**Tablar:**
1. **Kunlik hisobot:**
   - Sana tanlash
   - Buyurtmalar soni
   - Jami summa
   - Qabul qilingan summa
   - Topshirilgan summa
   - Kutilayotgan summa
   - Naqd/Karta bo'limi
   - Transaksiyalar ro'yxati

2. **Kutilayotgan to'lovlar:**
   - Barcha kutilayotgan to'lovlar ro'yxati
   - Bitta yoki ko'p to'lovlarni tanlash
   - "Barchasini tanlash" funksiyasi
   - Tanlangan to'lovlarni qabul qilish
   - Har bir to'lovni alohida qabul qilish

3. **Qabul qilingan to'lovlar:**
   - Qabul qilingan lekin hali topshirilmagan to'lovlar
   - Bitta yoki ko'p to'lovlarni tanlash
   - Tuman agentga topshirish
   - Tanlangan summa ko'rsatkichi

4. **Statistika:**
   - Sana oralig'i tanlash
   - Jami buyurtmalar
   - Jami summa
   - Qabul qilingan summa
   - Topshirilgan summa
   - Naqd/Karta bo'limi

**Ish jarayoni:**

**Kunlik hisobot:**
1. Sana tanlanadi (default: bugun)
2. Kunlik hisobot yuklanadi
3. Barcha ko'rsatkichlar ko'rsatiladi
4. Transaksiyalar ro'yxati ko'rsatiladi

**Kutilayotgan to'lovlar:**
1. Kutilayotgan to'lovlar yuklanadi
2. To'lovlar ro'yxati ko'rsatiladi
3. To'lov tanlash/bekor qilish
4. "Qabul qilish" tugmasi bosilganda tasdiqlash dialogi
5. Qabul qilingandan keyin "Qabul qilingan" tabiga o'tiladi

**Qabul qilingan to'lovlar:**
1. Qabul qilingan lekin topshirilmagan to'lovlar yuklanadi
2. To'lovlar tanlash/bekor qilish
3. "Tuman agentga topshirish" tugmasi bosilganda tasdiqlash dialogi
4. Topshirilgandan keyin ro'yxat yangilanadi

**Statistika:**
1. Sana oralig'i tanlanadi
2. Statistika yuklanadi
3. Barcha ko'rsatkichlar ko'rsatiladi

**API so'rovlari:**
- `GET /agent-finance/mfy/daily-report` - Kunlik hisobot
- `GET /agent-finance/mfy/pending-payments` - Kutilayotgan to'lovlar
- `POST /agent-finance/mfy/collect-payment/:id` - To'lovni qabul qilish
- `POST /agent-finance/mfy/submit-to-district` - Tuman agentga topshirish
- `GET /agent-finance/mfy/statistics` - Statistika

#### Tuman Agent moliya (`app/(tabs)/finance.tsx` - Tuman uchun)

**Tablar:**
1. **Hisobot:**
   - Sana tanlash
   - Topshiruvlar soni
   - Qabul qilingan summa
   - Kutilayotgan summa
   - MFY agentlardan kelgan topshiruvlar ro'yxati

2. **Topshiruvlar:**
   - Kutilayotgan topshiruvlar ro'yxati
   - Bitta yoki ko'p topshiruvlarni tanlash
   - Topshiruvlarni tasdiqlash
   - Tanlangan summa ko'rsatkichi

3. **Qabul qilingan topshiruvlar:**
   - Tasdiqlangan topshiruvlar ro'yxati
   - Topshirilmagan transaksiyalarni ko'rish
   - Viloyat agentga topshirish
   - Topshirilgan/topshirilmagan ko'rsatkichlar

4. **Statistika:**
   - Sana oralig'i tanlash
   - Topshiruvlar soni
   - Qabul qilingan summa
   - Kutilayotgan summa

**Ish jarayoni:**

**Hisobot:**
1. Sana tanlanadi
2. Hisobot yuklanadi
3. MFY agentlardan kelgan topshiruvlar ko'rsatiladi

**Topshiruvlar:**
1. Kutilayotgan topshiruvlar yuklanadi
2. Topshiruvlar tanlash/bekor qilish
3. "Tasdiqlash" tugmasi bosilganda tasdiqlash dialogi
4. Tasdiqlangandan keyin "Qabul qilingan" tabiga o'tiladi

**Qabul qilingan topshiruvlar:**
1. Tasdiqlangan topshiruvlar yuklanadi
2. Har bir topshiruvdan transaksiyalar ajratiladi
3. Topshirilmagan transaksiyalar tanlash
4. "Viloyat agentga topshirish" tugmasi bosilganda tasdiqlash dialogi
5. Topshirilgandan keyin ro'yxat yangilanadi

**API so'rovlari:**
- `GET /agent-finance/district/report` - Hisobot
- `GET /agent-finance/district/submissions` - Topshiruvlar
- `POST /agent-finance/district/confirm-submission/:id` - Topshiruvni tasdiqlash
- `POST /agent-finance/district/submit-to-province` - Viloyat agentga topshirish
- `GET /agent-finance/district/statistics` - Statistika

#### Viloyat Agent moliya (`app/(tabs)/finance.tsx` - Viloyat uchun)

**Tablar:**
1. **Hisobot:**
   - Sana tanlash
   - Topshiruvlar soni
   - Qabul qilingan summa
   - Kutilayotgan summa
   - Tuman agentlardan kelgan topshiruvlar ro'yxati

2. **Topshiruvlar:**
   - Kutilayotgan topshiruvlar ro'yxati
   - Bitta yoki ko'p topshiruvlarni tanlash
   - Topshiruvlarni tasdiqlash
   - Tanlangan summa ko'rsatkichi

3. **Qabul qilingan topshiruvlar:**
   - Tasdiqlangan topshiruvlar ro'yxati
   - Topshirilmagan transaksiyalarni ko'rish
   - Moliya bo'limiga topshirish
   - Topshirilgan/topshirilmagan ko'rsatkichlar

4. **Statistika:**
   - Sana oralig'i tanlash
   - Topshiruvlar soni
   - Qabul qilingan summa
   - Kutilayotgan summa

**Ish jarayoni:**

Tuman agent bilan bir xil, lekin:
- Tuman agentlardan kelgan topshiruvlar ko'rsatiladi
- Viloyat agentga o'rniga moliya bo'limiga topshiriladi

**API so'rovlari:**
- `GET /agent-finance/province/report` - Hisobot
- `GET /agent-finance/province/submissions` - Topshiruvlar
- `POST /agent-finance/province/confirm-submission/:id` - Topshiruvni tasdiqlash
- `POST /agent-finance/province/submit-to-finance` - Moliya bo'limiga topshirish
- `GET /agent-finance/province/statistics` - Statistika

### 3. KPI (Key Performance Indicator) boshqaruvi

#### KPI sahifasi (`app/kpi.tsx`)

**Funksiyalar:**
- KPI transaksiyalar ro'yxati
- Umumiy ma'lumot (summary)
- Filtrlash (sana oralig'i, to'lov holati)
- Pagination
- Pull-to-refresh

**Ish jarayoni:**
1. Sahifa yuklanganda KPI transaksiyalar va summary yuklanadi
2. Filter modal orqali filtrlash mumkin
3. Filterlar qo'llanganda yangi so'rov yuboriladi
4. Har bir transaksiya kartasida to'liq ma'lumotlar ko'rsatiladi

**Filterlar:**
- Boshlanish sanasi
- Tugash sanasi
- To'lov holati (Barchasi/To'langan/To'lanmagan)

**API so'rovlari:**
- `GET /agent/kpi/transactions` - KPI transaksiyalar
- `GET /agent/kpi/summary` - KPI summary
- `GET /agent/kpi/balance` - Kunlik balans
- `GET /agent/kpi/reports/daily` - Kunlik hisobotlar

### 4. Xabarnomalar

#### Xabarnomalar sahifasi (`app/(tabs)/notifications.tsx`)

**Funksiyalar:**
- Barcha xabarnomalar ro'yxati
- Xabarnoma turlari (info, warning, success, error, announcement, promotion, update)
- O'qilmagan xabarnomalar soni
- Xabarnomani o'qilgan deb belgilash
- Barcha xabarnomalarni o'qilgan deb belgilash
- Xabarnoma detallarini ko'rish (modal)
- Infinite scroll (pagination)
- Pull-to-refresh

**Ish jarayoni:**
1. Sahifa yuklanganda xabarnomalar yuklanadi
2. O'qilmagan xabarnomalar soni header'da ko'rsatiladi
3. Xabarnoma kartasiga bosilganda detallar modal'da ochiladi
4. Xabarnoma o'qilgan deb belgilanadi
5. "Barchasini o'qilgan deb belgilash" tugmasi orqali barcha xabarnomalar o'qilgan deb belgilanadi

**Xabarnoma turlari:**
- **info** - Ma'lumot (ko'k rang)
- **warning** - Ogohlantirish (sariq rang)
- **success** - Muvaffaqiyat (yashil rang)
- **error** - Xatolik (qizil rang)
- **announcement** - E'lon (binafsha rang)
- **promotion** - Aksiya (pushti rang)
- **update** - Yangilanish (moviy rang)

**API so'rovlari:**
- `GET /agents/notifications/list` - Xabarnomalar ro'yxati
- `GET /agents/notifications/unread-count` - O'qilmagan xabarnomalar soni
- `POST /agents/notifications/:id/read` - Xabarnomani o'qilgan deb belgilash
- `POST /agents/notifications/read-all` - Barcha xabarnomalarni o'qilgan deb belgilash

### 5. Profil

#### Profil sahifasi (`app/(tabs)/profile.tsx`)

**Funksiyalar:**
- Agent ma'lumotlari (ism, telefon, rol, viloyat, tuman, MFY)
- KPI bonus ko'rsatkichi
- KPI transaksiyalariga o'tish
- Xabarnomalarga o'tish (o'qilmagan soni bilan)
- Hisobdan chiqish

**Ish jarayoni:**
1. Sahifa yuklanganda agent ma'lumotlari va KPI summary yuklanadi
2. O'qilmagan xabarnomalar soni yuklanadi
3. KPI transaksiyalariga o'tish tugmasi
4. Xabarnomalarga o'tish tugmasi (badge bilan)
5. Hisobdan chiqish tugmasi (tasdiqlash dialogi bilan)

**API so'rovlari:**
- `GET /agent/kpi/summary` - KPI summary
- `GET /agents/notifications/unread-count` - O'qilmagan xabarnomalar soni

## 🔌 API Integratsiyasi

### API Service (`services/api.ts`)

API xizmati barcha backend so'rovlarini boshqaradi. Quyidagi funksiyalarni ta'minlaydi:

#### Autentifikatsiya

- `login(credentials, deviceInfo)` - Tizimga kirish
- `logout()` - Tizimdan chiqish
- `getToken()` - Token olish
- `passwordSetupStep1(phone)` - Parol o'rnatish: telefon raqamini yuborish
- `passwordSetupStep2(phone, code)` - Parol o'rnatish: SMS kodni tasdiqlash
- `passwordSetupStep3(phone, newPassword)` - Parol o'rnatish: yangi parol o'rnatish

#### Device Verification

- `requestDeviceVerificationCode(data)` - Qurilma tasdiqlash kodi so'rash
- `verifyDevice(data)` - Qurilmani tasdiqlash
- `resendDeviceVerificationCode(phone, deviceId)` - Kodni qayta yuborish

#### Buyurtmalar

- `getOrders(params)` - Barcha buyurtmalar
- `getTodayOrders(params)` - Bugungi buyurtmalar
- `getOrdersHistory(params)` - Buyurtmalar tarixi
- `getOrderById(id)` - Buyurtma detallari
- `confirmOrder(id)` - Buyurtmani tasdiqlash
- `markOrderAsDelivered(id)` - Yetkazilgan deb belgilash

#### KPI

- `getKPISummary(params)` - KPI summary
- `getKPITransactions(params)` - KPI transaksiyalar
- `getKPIDailyBalance(date)` - Kunlik balans
- `getKPIDailyReport(startDate, endDate)` - Kunlik hisobotlar

#### Xabarnomalar

- `getNotifications(params)` - Xabarnomalar ro'yxati
- `getUnreadNotificationsCount()` - O'qilmagan xabarnomalar soni
- `markNotificationRead(notificationId)` - Xabarnomani o'qilgan deb belgilash
- `markAllNotificationsRead()` - Barcha xabarnomalarni o'qilgan deb belgilash

#### MFY Agent Moliya

- `getMFYDailyReport(date)` - Kunlik hisobot
- `getMFYPendingPayments()` - Kutilayotgan to'lovlar
- `collectPayment(transactionId)` - To'lovni qabul qilish
- `submitToDistrict(data)` - Tuman agentga topshirish
- `getMFYStatistics(params)` - Statistika

#### Tuman Agent Moliya

- `getDistrictReport(date)` - Hisobot
- `getDistrictSubmissions(status)` - Topshiruvlar
- `confirmDistrictSubmission(submissionId)` - Topshiruvni tasdiqlash
- `submitToProvince(data)` - Viloyat agentga topshirish
- `getDistrictStatistics(params)` - Statistika

#### Viloyat Agent Moliya

- `getProvinceReport(date)` - Hisobot
- `getProvinceSubmissions(status)` - Topshiruvlar
- `confirmProvinceSubmission(submissionId)` - Topshiruvni tasdiqlash
- `submitToFinance(data)` - Moliya bo'limiga topshirish
- `getProvinceStatistics(params)` - Statistika

### API Endpoints (`config/api.ts`)

Barcha API endpoint'lar `config/api.ts` faylida belgilangan:

```typescript
export const API_BASE_URL = 'https://api.ttsa.uz/api';

export const API_ENDPOINTS = {
  // Autentifikatsiya
  AGENT_LOGIN: '/agents/login',
  PASSWORD_SETUP_STEP1: '/agents/password-setup/step1',
  PASSWORD_SETUP_STEP2: '/agents/password-setup/step2',
  PASSWORD_SETUP_STEP3: '/agents/password-setup/step3',
  
  // Device Verification
  DEVICE_VERIFICATION_AGENT_REQUEST_CODE: '/device-verification/agent/request-code',
  DEVICE_VERIFICATION_AGENT_VERIFY: '/device-verification/agent/verify',
  DEVICE_VERIFICATION_AGENT_RESEND_CODE: '/device-verification/agent/resend-code',
  
  // Buyurtmalar
  AGENT_ORDERS: '/agent/orders',
  AGENT_ORDERS_TODAY: '/agent/orders/today',
  AGENT_ORDERS_HISTORY: '/agent/orders/history',
  AGENT_ORDER_BY_ID: (id: string) => `/agent/orders/${id}`,
  AGENT_CONFIRM_ORDER: (id: string) => `/agent/orders/${id}/confirm`,
  AGENT_MARK_DELIVERED: (id: string) => `/agent/orders/${id}/delivered`,
  
  // KPI
  AGENT_KPI_SUMMARY: '/agent/kpi/summary',
  AGENT_KPI_TRANSACTIONS: '/agent/kpi/transactions',
  AGENT_KPI_BALANCE: '/agent/kpi/balance',
  AGENT_KPI_DAILY_REPORT: '/agent/kpi/reports/daily',
  
  // Xabarnomalar
  AGENT_NOTIFICATIONS: '/agents/notifications/list',
  AGENT_NOTIFICATIONS_UNREAD_COUNT: '/agents/notifications/unread-count',
  AGENT_NOTIFICATION_READ: (id: string) => `/agents/notifications/${id}/read`,
  AGENT_NOTIFICATIONS_READ_ALL: '/agents/notifications/read-all',
  
  // MFY Agent Moliya
  MFY_DAILY_REPORT: '/agent-finance/mfy/daily-report',
  MFY_PENDING_PAYMENTS: '/agent-finance/mfy/pending-payments',
  MFY_COLLECT_PAYMENT: (id: string) => `/agent-finance/mfy/collect-payment/${id}`,
  MFY_SUBMIT_TO_DISTRICT: '/agent-finance/mfy/submit-to-district',
  MFY_STATISTICS: '/agent-finance/mfy/statistics',
  
  // Tuman Agent Moliya
  DISTRICT_REPORT: '/agent-finance/district/report',
  DISTRICT_SUBMISSIONS: '/agent-finance/district/submissions',
  DISTRICT_CONFIRM_SUBMISSION: (id: string) => `/agent-finance/district/confirm-submission/${id}`,
  DISTRICT_SUBMIT_TO_PROVINCE: '/agent-finance/district/submit-to-province',
  DISTRICT_STATISTICS: '/agent-finance/district/statistics',
  
  // Viloyat Agent Moliya
  PROVINCE_REPORT: '/agent-finance/province/report',
  PROVINCE_SUBMISSIONS: '/agent-finance/province/submissions',
  PROVINCE_CONFIRM_SUBMISSION: (id: string) => `/agent-finance/province/confirm-submission/${id}`,
  PROVINCE_SUBMIT_TO_FINANCE: '/agent-finance/province/submit-to-finance',
  PROVINCE_STATISTICS: '/agent-finance/province/statistics',
};
```

### Request/Response Interceptors

**Request Interceptor:**
- Har bir so'rovdan oldin token `AsyncStorage` dan olinadi
- Token `Authorization: Bearer {token}` header sifatida qo'shiladi
- Device ma'lumotlari login so'rovida header sifatida yuboriladi

**Response Interceptor:**
- 401 xatolikda token tozalanadi
- Xatoliklar avtomatik qayta ishlanadi

## 🎨 UI/UX

### Dizayn prinsiplari

- **Modern va intuitiv interfeys** - Zamonaviy mobil ilova dizayni
- **Uzbek tilida interfeys** - Barcha matnlar o'zbek tilida
- **Responsive dizayn** - Turli ekran o'lchamlari uchun moslashgan
- **Dark/Light mode** - Tizim sozlamalariga moslashgan
- **Real-time yangilanishlar** - Pull-to-refresh va avtomatik yangilanish
- **Loading states** - Barcha operatsiyalar uchun loading ko'rsatkichlari
- **Error handling** - Barcha xatoliklar uchun foydalanuvchiga tushunarli xabarlar

### Komponentlar

- **Cards** - Ma'lumotlarni ko'rsatish uchun kartalar
- **Badges** - Status va ko'rsatkichlar uchun
- **Buttons** - Turli xil tugmalar (primary, secondary, danger)
- **Modals** - Xabarnomalar va filtrlash uchun
- **Date Pickers** - Sana tanlash uchun
- **Search Input** - Qidiruv uchun
- **Tabs** - Turli xil bo'limlar uchun
- **Lists** - Ro'yxatlar (FlatList bilan optimizatsiya qilingan)

### Ranglar

- **Primary:** `#007AFF` (ko'k)
- **Success:** `#34C759` (yashil)
- **Warning:** `#FF9500` (sariq)
- **Error:** `#FF3B30` (qizil)
- **Info:** `#5856D6` (binafsha)

## 📱 Platformalar

- ✅ **Android** - To'liq qo'llab-quvvatlanadi
- ✅ **iOS** - To'liq qo'llab-quvvatlanadi
- ✅ **Web** - Cheklangan qo'llab-quvvatlash (development uchun)

## 🧪 Development

### Linting

```bash
npm run lint
```

### TypeScript tekshiruvi

```bash
npx tsc --noEmit
```

### Development server

```bash
npm start
```

Development server ishga tushganda quyidagi imkoniyatlar mavjud:
- QR kod orqali Expo Go ilovasida ochish
- Metro bundler
- Hot reload
- Error overlay

## 📝 Scripts

- `npm start` - Expo development server ishga tushirish
- `npm run android` - Android emulator/simulator'da ochish
- `npm run ios` - iOS simulator'da ochish
- `npm run web` - Web browser'da ochish
- `npm run lint` - ESLint tekshiruvi

## 🔧 Konfiguratsiya

### API Base URL

`config/api.ts` faylida API base URL ni o'zgartiring:

```typescript
export const API_BASE_URL = 'https://api.ttsa.uz/api';
```

### Expo konfiguratsiyasi

`app.json` faylida quyidagi sozlamalarni o'zgartirishingiz mumkin:

- Ilova nomi
- Slug
- Versiya
- Icon
- Splash screen
- Package name (Android)
- Bundle identifier (iOS)

### EAS Build konfiguratsiyasi

`eas.json` faylida build profillari belgilangan:

- **development** - Development build
- **preview** - Preview build (APK)
- **production** - Production build (App Bundle)
- **production-apk** - Production build (APK)

## 🔄 State Management

### AuthContext

`contexts/AuthContext.tsx` - Autentifikatsiya holatini boshqaradi:

- `agent` - Agent ma'lumotlari
- `role` - Agent roli (mfy, tuman, viloyat)
- `token` - Authentication token
- `isLoading` - Loading holati
- `isAuthenticated` - Autentifikatsiya holati
- `login()` - Kirish funksiyasi
- `logout()` - Chiqish funksiyasi
- `checkAuth()` - Autentifikatsiyani tekshirish

### Local State

Har bir sahifa o'z local state'ini boshqaradi:
- `useState` hook'lari
- Loading states
- Error states
- Data states

## 🛡️ Xavfsizlik

### Token boshqaruvi

- Token `AsyncStorage` da xavfsiz saqlanadi
- Barcha API so'rovlarida avtomatik token qo'shiladi
- 401 xatolikda token tozalanadi va login sahifasiga yo'naltiriladi

### Device Verification

- Har bir yangi qurilma uchun SMS kod orqali tasdiqlash
- Device ID unique va doimiy
- Device ma'lumotlari login vaqtida yuboriladi

### Input Validation

- Telefon raqami formati tekshiriladi
- Parol uzunligi tekshiriladi (kamida 6 ta belgi)
- SMS kod uzunligi tekshiriladi (5 ta raqam)

## 📊 Ma'lumotlar oqimi

### Buyurtma oqimi

1. **Buyurtma yaratiladi** (mijoz tomonidan)
2. **Punkt tomonidan tasdiqlanadi** (`confirmed_by_punkt`)
3. **Kontragentga so'rov yuboriladi** (`requested_to_contragent`)
4. **Kontragent qabul qiladi** (`accepted_by_contragent`)
5. **Punktga yetkaziladi** (`delivered_to_punkt`)
6. **Agentga tayinlanadi** (`assigned_to_agent`)
7. **Agent tasdiqlaydi** (`confirmed_by_agent`)
8. **Mijoz tasdiqlaydi** (`confirmed_by_customer`)

### Moliya oqimi

**MFY Agent:**
1. To'lov kutilmoqda (`pending`)
2. To'lov qabul qilinadi (`collected`)
3. Tuman agentga topshiriladi (`submitted`)
4. Tuman agent tasdiqlaydi (`confirmed`)
5. Viloyat agentga topshiriladi
6. Viloyat agent tasdiqlaydi
7. Moliya bo'limiga topshiriladi

**Tuman Agent:**
1. MFY agentdan topshiruv keladi (`pending`)
2. Tuman agent tasdiqlaydi (`confirmed`)
3. Viloyat agentga topshiriladi
4. Viloyat agent tasdiqlaydi
5. Moliya bo'limiga topshiriladi

**Viloyat Agent:**
1. Tuman agentdan topshiruv keladi (`pending`)
2. Viloyat agent tasdiqlaydi (`confirmed`)
3. Moliya bo'limiga topshiriladi

## 🐛 Xatoliklarni boshqarish

### Xatolik turlari

1. **Network xatoliklar** - Internet aloqasi yo'q
2. **401 Unauthorized** - Token eskirgan yoki noto'g'ri
3. **403 Forbidden** - Device verification kerak
4. **404 Not Found** - Ma'lumot topilmadi
5. **400 Bad Request** - Noto'g'ri so'rov
6. **500 Server Error** - Server xatoligi

### Xatolik boshqaruvi

- Barcha xatoliklar foydalanuvchiga tushunarli xabarlar bilan ko'rsatiladi
- Network xatoliklarida qayta urinish imkoniyati
- 401 xatolikda avtomatik login sahifasiga yo'naltirish
- 403 xatolikda device verification modal ochiladi

## 📈 Performance optimizatsiyalari

### List optimizatsiyalari

- `FlatList` komponenti ishlatiladi (VirtualizedList)
- `keyExtractor` bilan unique key'lar
- `getItemLayout` bilan optimizatsiya (agar mumkin bo'lsa)
- Pagination bilan ma'lumotlar yuklash

### Image optimizatsiyalari

- `expo-image` komponenti ishlatiladi
- Lazy loading
- Caching

### Network optimizatsiyalari

- Request debouncing (qidiruvda)
- Request cancellation (component unmount'da)
- Response caching (AsyncStorage'da)

## 🔄 Yangilanishlar

### Pull-to-refresh

Barcha ro'yxat sahifalarida pull-to-refresh funksiyasi mavjud:
- Buyurtmalar ro'yxati
- Buyurtmalar tarixi
- Moliya sahifalari
- KPI transaksiyalar
- Xabarnomalar

### Avtomatik yangilanish

Ba'zi sahifalarda avtomatik yangilanish mavjud:
- **Xabarnomalar** - Har 1 soniyada o'qilmagan xabarnomalar soni yangilanadi
- **KPI balans** - Buyurtmalar sahifasida kunlik balans ko'rsatiladi
- **Pull-to-refresh** - Barcha sahifalarda qo'lda yangilash imkoniyati

## 📦 Build va Deployment

### EAS Build

Expo Application Services (EAS) orqali build qilish:

```bash
# EAS CLI o'rnatish
npm install -g eas-cli

# EAS'ga login qilish
eas login

# Build profillari
eas build --profile development    # Development build
eas build --profile preview        # Preview build (APK)
eas build --profile production     # Production build (App Bundle)
eas build --profile production-apk # Production build (APK)
```

### Android Build

```bash
# APK build
npm run android

# Yoki EAS orqali
eas build --platform android --profile preview
```

### iOS Build

```bash
# iOS build (faqat macOS)
npm run ios

# Yoki EAS orqali
eas build --platform ios --profile production
```

### Build konfiguratsiyasi

`eas.json` faylida quyidagi build profillari mavjud:

- **development** - Development client bilan ishlash uchun
- **preview** - Test uchun APK
- **production** - Production uchun App Bundle (Android) yoki IPA (iOS)
- **production-apk** - Production uchun APK (Android)

## 🧩 Komponentlar va Utility'lar

### Device Utility (`utils/device.ts`)

Qurilma ma'lumotlarini olish va boshqarish:

- `getDeviceId()` - Unique device ID olish yoki yaratish
- `getDeviceInfo()` - To'liq qurilma ma'lumotlari
- `getUserAgent()` - User agent string
- `getIPAddress()` - IP manzil (backend tomonidan aniqlanadi)

**Device ID yaratish:**
- Mobile: `expo-constants` dan `installationId` ishlatiladi
- Web: `localStorage` dan UUID yaratiladi
- Fallback: UUID v4 yaratiladi

### Type Definitions (`types/api.ts`)

Barcha API tiplari va interfeyslar:

- `AgentRole` - Agent rollari (viloyat, tuman, mfy)
- `OrderStatus` - Buyurtma holatlari
- `PaymentStatus` - To'lov holatlari
- `Agent` - Agent ma'lumotlari
- `Order` - Buyurtma ma'lumotlari
- `PaymentTransaction` - To'lov transaksiyasi
- `FinanceSubmission` - Moliya topshiruvi
- `KPITransaction` - KPI transaksiyasi
- va boshqalar...

## 🔍 Qidiruv va Filtrlash

### Buyurtmalar qidiruvi

- **Buyurtma raqami** bo'yicha qidiruv
- **Telefon raqami** bo'yicha qidiruv
- **Real-time qidiruv** - Har bir belgi kiritilganda so'rov yuboriladi
- **Pagination** - 20 ta buyurtma bir sahifada

### Filtrlash

**Buyurtmalar:**
- Status bo'yicha
- To'lov holati bo'yicha
- To'lov usuli bo'yicha
- Sana oralig'i bo'yicha
- Summa oralig'i bo'yicha

**Buyurtmalar tarixi:**
- Sana oralig'i bo'yicha (dan-gacha)

**KPI:**
- Sana oralig'i bo'yicha
- To'lov holati bo'yicha (Barchasi/To'langan/To'lanmagan)

**Moliya:**
- Sana bo'yicha (kunlik hisobot)
- Sana oralig'i bo'yicha (statistika)

## 📱 Navigation

### Expo Router

File-based routing tizimi ishlatiladi:

- `app/` - Sahifalar papkasi
- `app/(tabs)/` - Tab navigatsiya sahifalari
- `app/order/[id].tsx` - Dynamic route (buyurtma ID)

### Navigation struktura

```
/ (index.tsx)
  ├── /login (login.tsx)
  └── /(tabs) (tabs layout)
      ├── /orders
      ├── /orders-history
      ├── /finance
      ├── /notifications
      └── /profile
  ├── /order/:id (order/[id].tsx)
  └── /kpi (kpi.tsx)
```

### Navigation funksiyalari

- `useRouter()` - Router hook
- `router.push()` - Yangi sahifaga o'tish
- `router.replace()` - Sahifani almashtirish
- `router.back()` - Orqaga qaytish

## 🎯 Status boshqaruvi

### Buyurtma statuslari

1. **pending** - Kutilmoqda
2. **processing** - Jarayonda
3. **shipped** - Yuborilgan
4. **delivered** - Yetkazilgan
5. **cancelled** - Bekor qilingan
6. **confirmed_by_punkt** - Punkt tomonidan tasdiqlangan
7. **requested_to_contragent** - Kontragentga so'rov yuborilgan
8. **accepted_by_contragent** - Kontragent tomonidan qabul qilingan
9. **delivered_to_punkt** - Punktga yetkazilgan
10. **assigned_to_agent** - Agentga tayinlangan
11. **confirmed_by_agent** - Agent tomonidan tasdiqlangan
12. **confirmed_by_customer** - Mijoz tomonidan tasdiqlangan

### To'lov statuslari

1. **pending** - Kutilmoqda
2. **paid** - To'langan
3. **failed** - Xatolik
4. **refunded** - Qaytarilgan

### Moliya transaksiya statuslari

1. **pending** - Kutilmoqda
2. **collected** - Qabul qilingan (MFY agent)
3. **submitted** - Topshirilgan
4. **received** - Qabul qilingan (yuqori daraja)
5. **confirmed** - Tasdiqlangan
6. **rejected** - Rad etilgan

### Topshiruv statuslari

1. **pending** - Kutilmoqda
2. **confirmed** - Tasdiqlangan
3. **rejected** - Rad etilgan

## 💰 Moliya oqimi (batafsil)

### MFY Agent ish jarayoni

1. **To'lov kutilmoqda:**
   - Mijoz to'lov qiladi
   - To'lov transaksiyasi yaratiladi (`pending` status)
   - "Kutilayotgan to'lovlar" tabida ko'rsatiladi

2. **To'lovni qabul qilish:**
   - MFY agent to'lovni ko'radi
   - "Qabul qilish" tugmasini bosadi
   - Tasdiqlash dialogi
   - To'lov `collected` statusiga o'tadi
   - "Qabul qilingan to'lovlar" tabiga o'tadi

3. **Tuman agentga topshirish:**
   - Qabul qilingan to'lovlar tanlanadi
   - "Tuman agentga topshirish" tugmasi
   - Tasdiqlash dialogi
   - Topshiruv yaratiladi
   - Transaksiyalar `submitted` statusiga o'tadi

### Tuman Agent ish jarayoni

1. **Topshiruvni qabul qilish:**
   - MFY agentdan topshiruv keladi
   - "Topshiruvlar" tabida ko'rsatiladi (`pending` status)
   - Topshiruv tanlanadi va tasdiqlanadi
   - Topshiruv `confirmed` statusiga o'tadi

2. **Viloyat agentga topshirish:**
   - Tasdiqlangan topshiruvlar "Qabul qilingan" tabida
   - Topshirilmagan transaksiyalar tanlanadi
   - "Viloyat agentga topshirish" tugmasi
   - Topshiruv yaratiladi

### Viloyat Agent ish jarayoni

1. **Topshiruvni qabul qilish:**
   - Tuman agentdan topshiruv keladi
   - "Topshiruvlar" tabida ko'rsatiladi (`pending` status)
   - Topshiruv tanlanadi va tasdiqlanadi
   - Topshiruv `confirmed` statusiga o'tadi

2. **Moliya bo'limiga topshirish:**
   - Tasdiqlangan topshiruvlar "Qabul qilingan" tabida
   - Topshirilmagan transaksiyalar tanlanadi
   - "Moliya bo'limiga topshirish" tugmasi
   - Topshiruv yaratiladi

## 📊 Statistika va hisobotlar

### MFY Agent statistikasi

- **Jami buyurtmalar** - Tanlangan davr uchun
- **Jami summa** - Barcha buyurtmalar summasi
- **Qabul qilingan summa** - Qabul qilingan to'lovlar
- **Topshirilgan summa** - Tuman agentga topshirilgan
- **Kutilayotgan summa** - Hali qabul qilinmagan
- **Naqd/Karta bo'limi** - To'lov usullari bo'yicha

### Tuman/Viloyat Agent statistikasi

- **Topshiruvlar soni** - Tanlangan davr uchun
- **Qabul qilingan summa** - Tasdiqlangan topshiruvlar
- **Kutilayotgan summa** - Hali tasdiqlanmagan

### Kunlik hisobot

- **Buyurtmalar soni** - Kunlik buyurtmalar
- **Jami summa** - Kunlik jami summa
- **Qabul qilingan** - Kunlik qabul qilingan to'lovlar
- **Topshirilgan** - Kunlik topshirilgan to'lovlar
- **Transaksiyalar ro'yxati** - Barcha kunlik transaksiyalar

## 🔔 Xabarnomalar tizimi

### Xabarnoma turlari

1. **info** - Umumiy ma'lumot
2. **warning** - Ogohlantirish
3. **success** - Muvaffaqiyatli amal
4. **error** - Xatolik
5. **announcement** - E'lon
6. **promotion** - Aksiya yoki taklif
7. **update** - Yangilanish

### Xabarnoma funksiyalari

- **Ro'yxat ko'rish** - Barcha xabarnomalar
- **Detallar** - Xabarnoma detallarini ko'rish (modal)
- **O'qilgan deb belgilash** - Bitta xabarnoma
- **Barchasini o'qilgan deb belgilash** - Barcha xabarnomalar
- **O'qilmagan soni** - Header'da ko'rsatiladi
- **Real-time yangilanish** - Har 1 soniyada yangilanadi

## 🎨 Styling va Theme

### StyleSheet

Barcha komponentlar `StyleSheet.create()` orqali yaratilgan:

- **Consistent colors** - Barcha sahifalarda bir xil ranglar
- **Responsive sizing** - Turli ekran o'lchamlari uchun
- **Shadow va elevation** - Material Design prinsiplari

### Color Palette

```typescript
const colors = {
  primary: '#007AFF',      // Asosiy rang
  success: '#34C759',      // Muvaffaqiyat
  warning: '#FF9500',      // Ogohlantirish
  error: '#FF3B30',        // Xatolik
  info: '#5856D6',         // Ma'lumot
  text: '#333',            // Matn
  textSecondary: '#666',   // Ikkinchi darajali matn
  textTertiary: '#999',    // Uchinchi darajali matn
  background: '#f5f5f5',   // Fon
  card: '#fff',            // Karta fon
  border: '#e0e0e0',       // Chegara
};
```

### Typography

- **Bold** - Sarlavhalar va muhim matnlar
- **Regular** - Oddiy matnlar
- **Small** - Kichik matnlar (12-14px)
- **Medium** - O'rta matnlar (14-16px)
- **Large** - Katta matnlar (18-24px)

## 🧪 Testing

### Manual Testing

Har bir funksiyani quyidagicha test qilish kerak:

1. **Autentifikatsiya:**
   - Parol o'rnatish
   - Kirish
   - Device verification
   - Chiqish

2. **Buyurtmalar:**
   - Ro'yxatni ko'rish
   - Qidiruv
   - Detallarni ko'rish
   - Tasdiqlash
   - Yetkazilgan deb belgilash

3. **Moliya:**
   - Hisobotlarni ko'rish
   - To'lovlarni qabul qilish
   - Topshiruvlarni tasdiqlash
   - Statistika

4. **KPI:**
   - Transaksiyalarni ko'rish
   - Filtrlash
   - Summary

5. **Xabarnomalar:**
   - Ro'yxatni ko'rish
   - O'qilgan deb belgilash
   - Detallar

## 🐛 Ma'lum xatoliklar va yechimlar

### Umumiy xatoliklar

1. **"Network request failed"**
   - Internet aloqasini tekshiring
   - API URL to'g'ri ekanligini tekshiring

2. **"Token expired"**
   - Avtomatik login sahifasiga yo'naltiriladi
   - Qayta kirish kerak

3. **"Device not found"**
   - Device verification kerak
   - SMS kod orqali tasdiqlash

4. **"Order not found"**
   - Buyurtma ID to'g'ri ekanligini tekshiring
   - Buyurtma mavjudligini tekshiring

## 📚 Qo'shimcha resurslar

### Expo dokumentatsiyasi

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)

### Foydali linklar

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 🔄 Versiya tarixi

### v1.0.0 (Joriy versiya)

- ✅ Autentifikatsiya tizimi
- ✅ Parol o'rnatish
- ✅ Device verification
- ✅ Buyurtmalar boshqaruvi
- ✅ Moliya boshqaruvi (MFY, Tuman, Viloyat)
- ✅ KPI boshqaruvi
- ✅ Xabarnomalar
- ✅ Profil
- ✅ Multi-role support

## 📝 Eslatmalar

### Production uchun

1. **API URL** - Production API URL ni sozlang
2. **Build** - Production build yarating
3. **Testing** - To'liq test qiling
4. **Monitoring** - Xatoliklarni kuzatish tizimini sozlang

### Development uchun

1. **Hot Reload** - Development server ishga tushirilganda avtomatik ishlaydi
2. **Error Overlay** - Xatoliklar ekranda ko'rsatiladi
3. **Debugging** - React Native Debugger yoki Chrome DevTools ishlatiladi

## 👥 Jamoa

- **Yaratuvchi:** Botir
- **Loyiha:** Agent Dasturi
- **Versiya:** 1.0.0

## 📞 Aloqa va yordam

Savollar va takliflar uchun loyiha egasiga murojaat qiling.

---

**Eslatma:** Production'da ishlatishdan oldin barcha konfiguratsiyalarni to'g'ri sozlang va to'liq test qiling.

**Litsenziya:** Bu loyiha private loyiha hisoblanadi.