# Kontragent Dasturi - Batafsil Hujjat

## 📋 Loyiha haqida

**Kontragent Dasturi** - bu yetkazib beruvchilar (kontragentlar) uchun yaratilgan mobil ilova bo'lib, ularga maxsulotlarni boshqarish, buyurtmalarni qabul qilish, statistikalarni kuzatish va xabarlar bilan ishlash imkoniyatini beradi. Ilova React Native va Expo framework asosida qurilgan.

**API Base URL**: `https://api.ttsa.uz`

---

## 🏗️ Arxitektura va Texnologiyalar

### Asosiy Texnologiyalar

- **Framework**: React Native 0.81.5
- **Expo SDK**: ~54.0.25
- **Routing**: Expo Router 6.0.15 (file-based routing)
- **Dasturlash tili**: TypeScript 5.9.2
- **State Management**: React Context API
- **Storage**: @react-native-async-storage/async-storage 2.2.0
- **UI Icons**: @expo/vector-icons 15.0.3 (Ionicons)

### Qo'shimcha Kutubxonalar

- **Image Picker**: react-native-image-picker 7.2.3
- **Date Picker**: @react-native-community/datetimepicker 8.5.1
- **Rich Text Editor**: Quill Editor (WebView orqali)
- **Image Viewer**: Custom komponent (zoom, swipe qo'llab-quvvatlash)
- **Navigation**: @react-navigation/native 7.1.8

---

## 📁 Loyiha Strukturasi

```
contragent/
├── app/                          # Expo Router fayllari (file-based routing)
│   ├── _layout.tsx              # Root layout (authentication guard)
│   ├── index.tsx                # Entry point (routing logic)
│   ├── login.tsx                # Login ekrani
│   ├── device-verification.tsx  # Qurilma tasdiqlash ekrani
│   ├── password-setup/          # Parol o'rnatish (3 bosqich)
│   │   ├── step1.tsx           # Telefon raqami kiritish
│   │   ├── step2.tsx           # SMS kod tasdiqlash
│   │   └── step3.tsx           # Yangi parol o'rnatish
│   └── (tabs)/                  # Tab navigation ekranlari
│       ├── _layout.tsx         # Tab layout (badge, icons)
│       ├── index.tsx           # Bosh sahifa (Dashboard)
│       ├── ombor.tsx           # Ombor bosh sahifasi
│       │   ├── kategoriyalar.tsx      # Kategoriyalar ro'yxati
│       │   ├── subcategory.tsx        # Subkategoriyalar
│       │   ├── maxsulotlar.tsx        # Maxsulotlar ro'yxati
│       │   └── product/               # Maxsulot boshqaruvi
│       │       ├── create.tsx         # Yangi maxsulot yaratish
│       │       ├── edit.tsx           # Maxsulot tahrirlash
│       │       ├── view.tsx           # Maxsulot ko'rish
│       │       └── select-regions.tsx # Yetkazib berish hududlari
│       ├── buyurtmalar.tsx     # Bugungi buyurtmalar
│       │   ├── history.tsx     # Buyurtmalar tarixi
│       │   └── order/
│       │       └── view.tsx    # Buyurtma tafsilotlari
│       ├── statistika.tsx      # Statistika ekrani
│       │   ├── payments.tsx     # To'lovlar ro'yxati
│       │   └── payment-detail.tsx # To'lov tafsilotlari
│       ├── profile.tsx         # Profil ekrani
│       └── habarlar.tsx        # Xabarlar ekrani
│
├── components/                  # Reusable komponentlar
│   ├── ImageViewer.tsx         # Rasm ko'ruvchi (zoom, swipe)
│   └── QuillEditor.tsx         # Rich text editor (WebView)
│
├── contexts/                    # React Context providers
│   └── AuthContext.tsx         # Autentifikatsiya context
│
├── services/                    # API xizmatlari
│   └── api.ts                  # API client (1358 qator kod)
│
├── utils/                       # Utility funksiyalar
│   ├── deviceId.ts             # Qurilma ID va ma'lumotlari
│   └── formatNumber.ts         # Raqamlarni formatlash
│
├── assets/                      # Rasmlar va boshqa assetlar
│   ├── icon.png                # App ikoni
│   └── images/                 # Boshqa rasmlar
│
├── android/                     # Android native kod (tashqarida)
│
├── app.json                     # Expo konfiguratsiyasi
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript konfiguratsiyasi
├── eas.json                     # EAS Build konfiguratsiyasi
└── README.md                    # Bu hujjat
```

---

## 🔐 Autentifikatsiya va Xavfsizlik

### Autentifikatsiya Jarayoni

1. **Login Ekrani** (`app/login.tsx`)
   - Telefon raqami va parol orqali kirish
   - Telefon raqami formati: `+998 XX XXX XX XX`
   - Parol ko'rsatish/yashirish funksiyasi
   - Qurilma ma'lumotlarini avtomatik yig'ish

2. **Qurilma Tasdiqlash** (Device Verification)
   - Yangi qurilma aniqlandi: SMS kod orqali tasdiqlash
   - 5 xonali SMS kod
   - Kod avtomatik yuboriladi
   - Kod qayta yuborish imkoniyati
   - API endpoint: `/api/device-verification/contragent/`

3. **Token Boshqaruvi**
   - Token AsyncStorage'da saqlanadi (`@auth_token`)
   - Har bir API so'rovida token avtomatik qo'shiladi
   - Token yaroqsiz bo'lsa, avtomatik logout

### Parol O'rnatish Jarayoni (Yangi Kontragentlar uchun)

**3 bosqichli jarayon:**

1. **Step 1** (`app/password-setup/step1.tsx`)
   - Telefon raqami kiritish
   - API: `POST /api/contragents/password-setup/step1`
   - SMS kod yuboriladi

2. **Step 2** (`app/password-setup/step2.tsx`)
   - 5 xonali SMS kod kiritish
   - API: `POST /api/contragents/password-setup/step2`
   - Kod tasdiqlanadi

3. **Step 3** (`app/password-setup/step3.tsx`)
   - Yangi parol o'rnatish (min 6 belgi)
   - Parolni takrorlash
   - API: `POST /api/contragents/password-setup/step3`
   - Muvaffaqiyatli bo'lsa, avtomatik login

### AuthContext (`contexts/AuthContext.tsx`)

**Funksiyalar:**
- `login()` - Tizimga kirish
- `logout()` - Tizimdan chiqish
- `refreshContragent()` - Kontragent ma'lumotlarini yangilash
- `isAuthenticated` - Autentifikatsiya holati
- `token` - JWT token
- `contragent` - Kontragent ma'lumotlari

**Avtomatik yangilanish:**
- Ilova ochilganda token tekshiriladi
- Token yaroqsiz bo'lsa, avtomatik logout
- Kontragent ma'lumotlari avtomatik yangilanadi

---

## 🏠 Bosh Sahifa (Dashboard)

**Fayl**: `app/(tabs)/index.tsx`

**Funksiyalar:**
- Kontragent ma'lumotlarini ko'rsatish:
  - Nomi
  - INN
  - Telefon raqami
  - Manzil (Viloyat, Tuman, MFY)
  - Holat (active/inactive)
- Tezkor amallar bo'limi

---

## 📦 Ombor Boshqaruvi

### Kategoriyalar (`app/(tabs)/ombor/kategoriyalar.tsx`)

**Funksiyalar:**
- Kategoriyalar ro'yxatini ko'rsatish
- Kategoriya tanlash
- Subkategoriyalarni ko'rsatish
- API: `GET /api/category/list`

**Kategoriya ma'lumotlari:**
- Nomi
- Slug
- Rasm (ixtiyoriy)
- Status (active/inactive)
- Subkategoriyalar

### Subkategoriyalar (`app/(tabs)/ombor/subcategory.tsx`)

**Funksiyalar:**
- Subkategoriyalar ro'yxatini ko'rsatish
- Parent kategoriya bo'yicha filtrlash
- API: `GET /api/category/subcategory/list`

### Maxsulotlar Ro'yxati (`app/(tabs)/ombor/maxsulotlar.tsx`)

**Funksiyalar:**
- Maxsulotlar ro'yxatini ko'rsatish
- Status bo'yicha filtrlash (active/inactive/archived)
- Kategoriya bo'yicha filtrlash
- Pagination qo'llab-quvvatlash
- Pull-to-refresh
- API: `GET /api/product/my`

**Maxsulot kartasi:**
- Rasmlar (birinchi rasm ko'rsatiladi)
- Nomi
- Narxi
- Miqdori
- Status

### Maxsulot Yaratish (`app/(tabs)/ombor/product/create.tsx`)

**Jarayon:**

1. **Asosiy ma'lumotlar:**
   - Nomi (majburiy)
   - Kategoriya tanlash (majburiy)
   - Subkategoriya tanlash (ixtiyoriy)
   - Tavsif (Rich text editor)

2. **Rasmlar:**
   - Maksimal 5 ta rasm
   - Image picker orqali yuklash
   - Base64 formatida saqlash
   - Rasm ko'ruvchi (zoom, swipe)

3. **Narx va miqdor:**
   - Narx (majburiy)
   - Original narx (majburiy)
   - Miqdor (majburiy)
   - Birlik (dona/litr/kg)
   - KPI bonus foizi

4. **O'lchamlar (ixtiyoriy):**
   - Unit size
   - Uzunlik
   - Kenglik
   - Og'irlik

5. **Yetkazib berish hududlari:**
   - Viloyat tanlash (majburiy)
   - Tuman tanlash (ixtiyoriy)
   - Bir nechta hudud tanlash mumkin

6. **Status:**
   - active / inactive / archived

**API**: `POST /api/product/create`

### Maxsulot Tahrirlash (`app/(tabs)/ombor/product/edit.tsx`)

**Funksiyalar:**
- Mavjud maxsulot ma'lumotlarini yuklash
- Barcha maydonlarni tahrirlash
- Rasmlarni o'chirish/qo'shish
- API: `PUT /api/product/{id}`

### Maxsulot Ko'rish (`app/(tabs)/ombor/product/view.tsx`)

**Funksiyalar:**
- Maxsulotning barcha ma'lumotlarini ko'rsatish
- Rasmlarni ko'rish (ImageViewer komponenti)
- Rich text tavsifni ko'rsatish
- Tahrirlash tugmasi
- Status o'zgartirish

**Rasm ko'ruvchi xususiyatlari:**
- Zoom (pinch gesture)
- Swipe orqali rasm o'zgartirish
- To'liq ekran ko'rinish
- Ko'rsatkichlar (indicators)

### Yetkazib Berish Hududlari (`app/(tabs)/ombor/product/select-regions.tsx`)

**Funksiyalar:**
- Viloyatlar ro'yxatini ko'rsatish
- Tumanlar ro'yxatini ko'rsatish (viloyat bo'yicha)
- Bir nechta hudud tanlash
- Tanlangan hududlarni ko'rsatish
- API: `GET /api/regions`

---

## 📋 Buyurtmalar Boshqaruvi

### Bugungi Buyurtmalar (`app/(tabs)/buyurtmalar.tsx`)

**Funksiyalar:**
- Bugungi buyurtmalar ro'yxatini ko'rsatish
- Status bo'yicha filtrlash:
  - Barchasi
  - Kutilmoqda (pending)
  - Qabul qilindi (accepted)
  - Rad etildi (rejected)
  - Yetkazildi (delivered_to_punkt)
- Pagination qo'llab-quvvatlash
- Pull-to-refresh
- API: `GET /api/contragent/today`

**Buyurtma kartasi:**
- Buyurtma raqami
- Status (rang bilan ko'rsatiladi)
- Buyurtma sanasi
- Umumiy summa
- Maxsulotlar soni

**Status ranglari:**
- Pending: `#FF9500` (Orange)
- Accepted: `#34C759` (Green)
- Rejected: `#FF3B30` (Red)
- Delivered: `#007AFF` (Blue)

### Buyurtma Tafsilotlari (`app/(tabs)/buyurtmalar/order/view.tsx`)

**Ko'rsatiladigan ma'lumotlar:**
- Buyurtma raqami
- Buyurtma sanasi
- Mijoz telefon raqami
- Yetkazib berish manzili:
  - Viloyat
  - Tuman
  - MFY
  - Qo'shimcha eslatma
- To'lov usuli (cash/card/transfer)
- To'lov holati (pending/paid/refunded)
- Maxsulotlar ro'yxati:
  - Maxsulot nomi
  - Miqdori
  - Narxi
  - KPI bonus foizi
- Umumiy summalar:
  - Umumiy narx
  - Original narx
  - KPI narxi

**Amallar:**
- Qabul qilish (accepted)
- Rad etish (rejected)
- Punktga yetkazish (delivered_to_punkt)

**API:**
- Ko'rish: `GET /api/contragent/orders/{id}`
- Javob berish: `POST /api/contragent/orders/{id}/respond`
- Punktga yetkazish: `POST /api/contragent/orders/{id}/deliver-to-punkt`

### Buyurtmalar Tarixi (`app/(tabs)/buyurtmalar/history.tsx`)

**Funksiyalar:**
- Barcha buyurtmalar tarixini ko'rsatish
- Sana bo'yicha filtrlash (startDate, endDate)
- Status bo'yicha filtrlash
- Pagination
- API: `GET /api/contragent/history`

---

## 📊 Statistika

### Asosiy Statistika (`app/(tabs)/statistika.tsx`)

**Ko'rsatiladigan ma'lumotlar:**

1. **Umumiy statistika:**
   - Jami buyurtmalar soni
   - Kutilayotgan buyurtmalar
   - Qabul qilingan buyurtmalar
   - Rad etilgan buyurtmalar
   - Yetkazilgan buyurtmalar
   - Jami daromad
   - Jami maxsulotlar soni
   - Qabul qilish foizi

2. **Oylik statistika:**
   - Har bir oy uchun:
     - Buyurtmalar soni
     - Daromad

**Funksiyalar:**
- Sana bo'yicha filtrlash (startDate, endDate)
- Filtrlarni tozalash
- Pull-to-refresh
- API: `GET /api/contragent/statistics`

### To'lovlar (`app/(tabs)/statistika/payments.tsx`)

**Funksiyalar:**
- To'langan to'lovlar ro'yxati
- To'lanmagan to'lovlar ro'yxati
- Muddat o'tgan to'lovlar
- Sana bo'yicha filtrlash
- Pagination
- API:
  - To'langan: `GET /api/contragents/payments/paid`
  - To'lanmagan: `GET /api/contragents/payments/unpaid`
  - Statistika: `GET /api/contragents/payments/statistics`

**To'lov ma'lumotlari:**
- To'lov ID
- Summa
- Status (pending/paid/cancelled)
- To'langan sana
- To'lov qilgan shaxs
- Buyurtmalar ro'yxati
- Muddat (dueDate)
- Muddat o'tganligi (isOverdue)

### To'lov Tafsilotlari (`app/(tabs)/statistika/payment-detail.tsx`)

**Ko'rsatiladigan ma'lumotlar:**
- To'lov ma'lumotlari
- Buyurtmalar ro'yxati
- To'lov qilgan shaxs ma'lumotlari
- To'lov sanasi
- Qo'shimcha eslatmalar

**API**: `GET /api/contragents/payments/{id}`

---

## 👤 Profil

**Fayl**: `app/(tabs)/profile.tsx`

**Funksiyalar:**

1. **Kontragent ma'lumotlari:**
   - Nomi
   - INN
   - Telefon raqami
   - Manzil (Viloyat, Tuman, MFY)
   - Status

2. **Logo boshqaruvi:**
   - Logo yuklash
   - Logo yangilash
   - Base64 formatida saqlash
   - API: `PATCH /api/contragents/me/logo`

3. **Profil yangilash:**
   - Nomi
   - Telefon raqami
   - INN
   - Manzil (Viloyat, Tuman, MFY)
   - API: `PUT /api/contragents/me`

4. **Xabarlar:**
   - O'qilmagan xabarlar soni (badge)
   - Real-time yangilanish (har 1 soniyada)

5. **Tizimdan chiqish:**
   - Logout funksiyasi
   - Token va ma'lumotlarni tozalash

---

## 💬 Xabarlar (Notifications)

**Fayl**: `app/(tabs)/habarlar.tsx`

**Funksiyalar:**
- Xabarlar ro'yxatini ko'rsatish
- Xabar turlari:
  - `info` - Ma'lumot (ko'k)
  - `warning` - Ogohlantirish (sariq)
  - `success` - Muvaffaqiyat (yashil)
  - `error` - Xatolik (qizil)
  - `announcement` - E'lon (binafsha)
  - `promotion` - Aksiya (pushti)
  - `update` - Yangilanish (cyan)
- Xabarni o'qilgan deb belgilash
- Barcha xabarlarni o'qilgan deb belgilash
- Pagination qo'llab-quvvatlash
- Pull-to-refresh
- Xabar tafsilotlarini ko'rsatish (Modal)

**API:**
- Ro'yxat: `GET /api/contragents/notifications/list`
- O'qilgan deb belgilash: `POST /api/contragents/notifications/{id}/read`
- Barchasini o'qilgan deb belgilash: `POST /api/contragents/notifications/read-all`
- O'qilmagan soni: `GET /api/contragents/notifications/unread-count`

**Real-time yangilanish:**
- O'qilmagan xabarlar soni har 1 soniyada yangilanadi
- Tab bar'da badge ko'rsatiladi

---

## 🔧 Komponentlar

### ImageViewer (`components/ImageViewer.tsx`)

**Funksiyalar:**
- Rasmlarni to'liq ekranda ko'rsatish
- Zoom (pinch gesture)
- Swipe orqali rasm o'zgartirish
- Ko'rsatkichlar (indicators)
- Yopish tugmasi

**Props:**
- `visible: boolean` - Modal ko'rinishi
- `images: string[]` - Rasm URL'lari
- `initialIndex?: number` - Boshlang'ich rasm indeksi
- `onClose: () => void` - Yopish funksiyasi

### QuillEditor (`components/QuillEditor.tsx`)

**Funksiyalar:**
- Rich text editor (Quill.js)
- WebView orqali ishlaydi
- Formatlash imkoniyatlari:
  - Bold, Italic, Underline, Strike
  - Blockquote, Code block
  - Headers (H1, H2, H3)
  - Lists (ordered, bullet)
  - Subscript, Superscript
  - Indent
  - Rang tanlash
  - Link, Rasm qo'shish
  - Tozalash

**Ref metodlari:**
- `getContents()` - Kontentni olish (Delta format)
- `setContents(delta)` - Kontentni o'rnatish
- `clear()` - Kontentni tozalash

**Props:**
- `initialDelta?: DeltaFormat` - Boshlang'ich kontent
- `placeholder?: string` - Placeholder matn
- `onContentChange?: (delta: DeltaFormat) => void` - O'zgarish callback

---

## 🌐 API Integration

### API Service (`services/api.ts`)

**Asosiy xususiyatlar:**
- 1358 qator kod
- TypeScript interfeyslari
- Avtomatik token qo'shish
- Xatoliklarni boshqarish
- Network xatoliklarni qayta ishlash

**Asosiy metodlar:**

#### Autentifikatsiya
- `login()` - Tizimga kirish
- `passwordSetupStep1()` - Parol o'rnatish 1-bosqich
- `passwordSetupStep2()` - Parol o'rnatish 2-bosqich
- `passwordSetupStep3()` - Parol o'rnatish 3-bosqich

#### Qurilma Tasdiqlash
- `requestDeviceVerificationCode()` - SMS kod so'rash
- `verifyDevice()` - Qurilmani tasdiqlash
- `resendDeviceVerificationCode()` - Kodni qayta yuborish

#### Kontragent
- `getMe()` - Kontragent ma'lumotlari
- `updateProfile()` - Profil yangilash
- `updateLogo()` - Logo yangilash

#### Kategoriyalar
- `getCategories()` - Kategoriyalar ro'yxati
- `getCategoryById()` - Kategoriya ma'lumotlari
- `createCategory()` - Kategoriya yaratish
- `updateCategory()` - Kategoriya yangilash
- `deleteCategory()` - Kategoriya o'chirish
- `getSubcategories()` - Subkategoriyalar ro'yxati
- `createSubcategory()` - Subkategoriya yaratish

#### Maxsulotlar
- `getMyProducts()` - Mening maxsulotlarim
- `getAllProducts()` - Barcha maxsulotlar
- `getProductById()` - Maxsulot ma'lumotlari
- `createProduct()` - Maxsulot yaratish
- `updateProduct()` - Maxsulot yangilash
- `updateProductStatus()` - Status o'zgartirish
- `deleteProduct()` - Maxsulot o'chirish

#### Buyurtmalar
- `getTodayOrders()` - Bugungi buyurtmalar
- `getOrdersHistory()` - Buyurtmalar tarixi
- `getContragentOrderById()` - Buyurtma tafsilotlari
- `respondToOrder()` - Buyurtmaga javob berish
- `deliverOrderToPunkt()` - Punktga yetkazish

#### Hududlar
- `getRegions()` - Hududlar ro'yxati (viloyat, tuman, MFY)

#### Statistika
- `getStatistics()` - Umumiy statistika
- `getPaymentStatistics()` - To'lov statistikasi
- `getPaidPayments()` - To'langan to'lovlar
- `getUnpaidPayments()` - To'lanmagan to'lovlar
- `getPaymentById()` - To'lov tafsilotlari

#### Xabarlar
- `getNotifications()` - Xabarlar ro'yxati
- `getUnreadCount()` - O'qilmagan soni
- `markNotificationRead()` - O'qilgan deb belgilash
- `markAllNotificationsRead()` - Barchasini o'qilgan deb belgilash

### Token Boshqaruvi

**AsyncStorage kalitlari:**
- `@auth_token` - JWT token
- `@contragent_data` - Kontragent ma'lumotlari
- `@device_id` - Qurilma ID

**Avtomatik token qo'shish:**
- Har bir API so'rovida token avtomatik qo'shiladi
- Device verification endpointlari bundan mustasno

---

## 🛠️ Utility Funksiyalar

### Device ID (`utils/deviceId.ts`)

**Funksiyalar:**
- `getDeviceId()` - Qurilma ID olish/yaratish
- `getDeviceInfo()` - Qurilma ma'lumotlari
- `getUserAgent()` - User agent string

**Qurilma ma'lumotlari:**
- `deviceId` - UUID v4
- `deviceName` - Qurilma nomi
- `deviceType` - mobile/web/unknown
- `platform` - ios/android/web
- `os` - OS versiyasi
- `browser` - Browser (web uchun)

### Format Number (`utils/formatNumber.ts`)

**Funksiyalar:**
- `formatNumber()` - Raqamlarni formatlash (1 000 000)
- `formatNumberDisplay()` - Ko'rsatish uchun formatlash
- `formatNumberInput()` - Input uchun formatlash
- `unformatNumber()` - Formatni olib tashlash
- `formatPrice()` - Narx formatlash (1 000 000 so'm)

---

## 📱 Navigation

### File-based Routing (Expo Router)

**Asosiy qoidalar:**
- `app/` papkasidagi fayllar route'larga aylanadi
- `(tabs)` - Tab navigation guruhi
- `_layout.tsx` - Layout fayllari
- `index.tsx` - Default route

**Navigation struktura:**
```
/ → index.tsx (routing logic)
/login → login.tsx
/(tabs) → Tab navigation
  /(tabs)/ → index.tsx (Dashboard)
  /(tabs)/ombor → ombor.tsx
  /(tabs)/buyurtmalar → buyurtmalar.tsx
  /(tabs)/statistika → statistika.tsx
  /(tabs)/profile → profile.tsx
```

**Authentication Guard:**
- `app/_layout.tsx` da tekshiriladi
- Autentifikatsiya qilinmagan foydalanuvchi `/login` ga yuboriladi
- Autentifikatsiya qilingan foydalanuvchi `/(tabs)` ga yuboriladi

---

## 🎨 UI/UX

### Dizayn Prinsiplari

1. **Material Design**
   - Card-based dizayn
   - Shadow va elevation
   - Rang palitrasi

2. **Ranglar:**
   - Primary: `#007AFF` (Blue)
   - Success: `#34C759` (Green)
   - Warning: `#FF9500` (Orange)
   - Error: `#FF3B30` (Red)
   - Text: `#333` (Dark Gray)
   - Secondary: `#666` (Gray)
   - Background: `#f5f5f5` (Light Gray)

3. **Typography:**
   - Title: 24-32px, Bold
   - Subtitle: 16px, Regular
   - Body: 16px, Regular
   - Caption: 12-14px, Regular

4. **Spacing:**
   - Container padding: 16-20px
   - Card padding: 16-24px
   - Gap: 8-12px

5. **Icons:**
   - Ionicons kutubxonasi
   - Standart o'lchamlar: 20-24px

### Responsive Design

- Safe area insets qo'llab-quvvatlash
- Keyboard avoiding view
- ScrollView qo'llab-quvvatlash
- Platform-specific dizayn (iOS/Android)

---

## 🔄 State Management

### React Context API

**AuthContext:**
- Global authentication state
- Token boshqaruvi
- Kontragent ma'lumotlari
- Login/logout funksiyalari

**Local State:**
- Har bir ekranda `useState` hook
- Form ma'lumotlari
- Loading holatlari
- Error handling

**Data Fetching:**
- `useEffect` hook orqali
- `useFocusEffect` (Expo Router) - ekran fokuslanganda
- `useCallback` - funksiyalarni memoize qilish

---

## 📦 Build va Deployment

### Development

```bash
# Dependencies o'rnatish
npm install

# Development server ishga tushirish
npm start
# yoki
npx expo start

# Android uchun
npm run android

# iOS uchun (faqat macOS)
npm run ios

# Web uchun
npm run web
```

### EAS Build

**Konfiguratsiya:** `eas.json`

**Build profillari:**
- `development` - Development build
- `preview` - Preview build (APK)
- `production` - Production build (App Bundle)
- `production-apk` - Production APK

**Build buyruqlari:**
```bash
# Android APK
eas build --platform android --profile preview

# Android App Bundle
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### Android Konfiguratsiyasi

**Package name:** `com.kontragent.dasturi`

**Permissions:**
- `CAMERA` - Rasm olish uchun
- `READ_MEDIA_IMAGES` - Rasmlarni o'qish uchun

**app.json:**
```json
{
  "android": {
    "package": "com.kontragent.dasturi",
    "permissions": [
      "CAMERA",
      "READ_MEDIA_IMAGES"
    ]
  }
}
```

---

## 🐛 Xatoliklarni Hal Qilish

### Umumiy Muammolar

1. **Metro bundler xatolari**
   ```bash
   npx expo start --clear
   ```

2. **Dependencies muammolari**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Native modullar ishlamayapti**
   ```bash
   npx expo prebuild
   npx expo run:android
   # yoki
   npx expo run:ios
   ```

4. **Image picker xatolari**
   - Permissions tekshirish
   - Native rebuild qilish

5. **Token xatolari**
   - AsyncStorage tozalash
   - Qayta login qilish

### Debug

**React Native Debugger:**
- Chrome DevTools
- React DevTools
- Redux DevTools (agar ishlatilsa)

**Console loglar:**
- `console.log()` - Development uchun
- Production'da o'chirilishi kerak

---

## 📝 API Endpointlar

### Base URL
```
https://api.ttsa.uz
```

### Asosiy Endpointlar

#### Autentifikatsiya
- `POST /api/contragents/auth/login` - Kirish
- `POST /api/contragents/password-setup/step1` - Parol o'rnatish 1
- `POST /api/contragents/password-setup/step2` - Parol o'rnatish 2
- `POST /api/contragents/password-setup/step3` - Parol o'rnatish 3

#### Qurilma Tasdiqlash
- `POST /api/device-verification/contragent/request-code` - Kod so'rash
- `POST /api/device-verification/contragent/verify` - Tasdiqlash
- `POST /api/device-verification/contragent/resend-code` - Kod qayta yuborish

#### Kontragent
- `GET /api/contragents/me` - Ma'lumotlar
- `PUT /api/contragents/me` - Yangilash
- `PATCH /api/contragents/me/logo` - Logo yangilash

#### Kategoriyalar
- `GET /api/category/list` - Ro'yxat
- `GET /api/category/{id}` - Ma'lumotlar
- `POST /api/category/create` - Yaratish
- `PUT /api/category/{id}` - Yangilash
- `DELETE /api/category/{id}` - O'chirish
- `GET /api/category/subcategory/list` - Subkategoriyalar
- `POST /api/category/subcategory/create` - Subkategoriya yaratish

#### Maxsulotlar
- `GET /api/product/my` - Mening maxsulotlarim
- `GET /api/product/list` - Barcha maxsulotlar
- `GET /api/product/{id}` - Ma'lumotlar
- `POST /api/product/create` - Yaratish
- `PUT /api/product/{id}` - Yangilash
- `PUT /api/product/{id}/status` - Status o'zgartirish
- `DELETE /api/product/{id}` - O'chirish

#### Buyurtmalar
- `GET /api/contragent/today` - Bugungi buyurtmalar
- `GET /api/contragent/history` - Tarix
- `GET /api/contragent/orders` - Barcha buyurtmalar
- `GET /api/contragent/orders/{id}` - Tafsilotlar
- `POST /api/contragent/orders/{id}/respond` - Javob berish
- `POST /api/contragent/orders/{id}/deliver-to-punkt` - Punktga yetkazish

#### Hududlar
- `GET /api/regions` - Hududlar ro'yxati

#### Statistika
- `GET /api/contragent/statistics` - Umumiy statistika
- `GET /api/contragents/payments/paid` - To'langan to'lovlar
- `GET /api/contragents/payments/unpaid` - To'lanmagan to'lovlar
- `GET /api/contragents/payments/statistics` - To'lov statistikasi
- `GET /api/contragents/payments/{id}` - To'lov tafsilotlari

#### Xabarlar
- `GET /api/contragents/notifications/list` - Ro'yxat
- `GET /api/contragents/notifications/unread-count` - O'qilmagan soni
- `POST /api/contragents/notifications/{id}/read` - O'qilgan deb belgilash
- `POST /api/contragents/notifications/read-all` - Barchasini o'qilgan deb belgilash

---

## 🔒 Xavfsizlik

### Token Boshqaruvi
- Token AsyncStorage'da saqlanadi
- Har bir so'rovda `Authorization: Bearer {token}` header qo'shiladi
- Token yaroqsiz bo'lsa, avtomatik logout

### Device Verification
- Yangi qurilmalar SMS kod orqali tasdiqlanadi
- Device ID UUID v4 formatida
- Device ma'lumotlari API'ga yuboriladi

### Data Validation
- Form validation
- API response validation
- Error handling

---

## 📊 Performance

### Optimizatsiya

1. **Image Optimization:**
   - Base64 formatida saqlash
   - Quality: 0.6
   - Max width/height: 2000px

2. **List Optimization:**
   - FlatList komponenti
   - Pagination
   - Lazy loading

3. **State Optimization:**
   - useCallback hook
   - useMemo hook (kerak bo'lsa)
   - Local state management

4. **Network Optimization:**
   - Request caching (AsyncStorage)
   - Error retry logic
   - Timeout handling

---

## 🧪 Testing

### Manual Testing

**Test qilinadigan funksiyalar:**
1. Autentifikatsiya
2. Maxsulot CRUD operatsiyalari
3. Buyurtmalar boshqaruvi
4. Statistika ko'rsatish
5. Xabarlar
6. Profil yangilash

### Test Scenariylari

1. **Login:**
   - To'g'ri ma'lumotlar
   - Noto'g'ri ma'lumotlar
   - Yangi qurilma tasdiqlash

2. **Maxsulot:**
   - Yaratish
   - Tahrirlash
   - O'chirish
   - Status o'zgartirish

3. **Buyurtma:**
   - Qabul qilish
   - Rad etish
   - Punktga yetkazish

---

## 📄 Litsenziya

Bu loyiha private loyiha hisoblanadi.

---

## 👥 Muallif

**Botir123**

---

## 📞 Aloqa va Yordam

Savollar yoki takliflar uchun loyiha egasiga murojaat qiling.

---

## 🔄 Versiya Tarixi

**v1.0.0** (Joriy versiya)
- Asosiy funksiyalar
- Autentifikatsiya
- Maxsulot boshqaruvi
- Buyurtmalar boshqaruvi
- Statistika
- Xabarlar

---

## 📝 Eslatmalar

1. **Development:**
   - Ilova hali development jarayonida
   - Production uchun ishlatishdan oldin barcha xavfsizlik sozlamalarini tekshiring

2. **API:**
   - API URL `services/api.ts` faylida sozlangan
   - Production uchun HTTPS ishlatilishi kerak

3. **Build:**
   - Android APK va App Bundle yaratish mumkin
   - iOS uchun macOS va Xcode kerak

4. **Permissions:**
   - Camera va Image Library permissions kerak
   - Android va iOS uchun alohida sozlash kerak

---

**Oxirgi yangilanish:** 2026
