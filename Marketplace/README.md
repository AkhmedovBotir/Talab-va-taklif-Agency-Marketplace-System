# TTSA Marketplace - O'zbekiston Marketplace Mobil Ilovasi

O'zbekiston uchun yaratilgan zamonaviy marketplace mobil ilovasi. React Native va Expo Router asosida qurilgan, to'liq funksionallik bilan jihozlangan e-commerce yechimi.

## 📱 Loyiha Haqida

Bu loyiha O'zbekiston bozorida faoliyat yuritadigan kontragentlar va mijozlar o'rtasida onlayn savdo platformasi yaratish uchun ishlab chiqilgan. Ilova mahsulotlarni ko'rsatish, buyurtma berish, to'lov qilish va buyurtmalarni kuzatish kabi barcha asosiy e-commerce funksiyalarini qo'llab-quvvatlaydi.

## 🎯 Asosiy Funksiyalar

### 🔐 Autentifikatsiya va Foydalanuvchi Boshqaruvi

#### Ro'yxatdan o'tish jarayoni (2 bosqichli):
1. **1-bosqich**: Telefon raqamini kiritish va SMS kod olish
   - Telefon raqami tekshiriladi (API `/api/marketplace/check-phone`)
   - SMS kod yuboriladi (`/api/marketplace/register/step1`)
   - Kod 6 xonali raqam

2. **2-bosqich**: SMS kodni tasdiqlash va hisob yaratish
   - SMS kod tekshiriladi
   - Foydalanuvchi ma'lumotlari kiritiladi:
     - Ism va Familiya
     - Jins (Erkak/Ayol)
     - Tug'ilgan sana (Kun, Oy, Yil)
     - Parol (minimum 6 belgi)
     - Manzil (Viloyat, Tuman, MFY)
   - Hisob yaratiladi (`/api/marketplace/register/step2`)
   - Avtomatik kirish amalga oshiriladi

#### Kirish jarayoni (2 bosqichli):
1. **1-bosqich**: Telefon raqami va parol tekshiruvi
   - Telefon raqami va parol yuboriladi (`/api/marketplace/login/step1`)
   - Agar ma'lumotlar to'g'ri bo'lsa, SMS kod yuboriladi

2. **2-bosqich**: SMS kodni tasdiqlash
   - SMS kod tekshiriladi (`/api/marketplace/login/step2`)
   - Token va foydalanuvchi ma'lumotlari qaytariladi
   - Token AsyncStorage ga saqlanadi

#### Parolni tiklash (2 bosqichli):
1. **1-bosqich**: Telefon raqamini kiritish va SMS kod olish
   - Telefon raqami tekshiriladi (`/api/marketplace/forgot-password/step1`)
   - SMS kod yuboriladi

2. **2-bosqich**: SMS kodni tasdiqlash va yangi parol o'rnatish
   - SMS kod tekshiriladi
   - Yangi parol o'rnatiladi (`/api/marketplace/forgot-password/step2`)

#### Xavfsizlik:
- Token-based autentifikatsiya (JWT)
- Token AsyncStorage da saqlanadi (`@marketplace:token`)
- 401 xatolikda avtomatik chiqish va ma'lumotlarni tozalash
- DeviceEventEmitter orqali 401 xatoliklarni kuzatish
- Har 500ms da AsyncStorage tekshiriladi

### 🛍️ Mahsulotlar va Qidiruv

#### Mahsulotlarni ko'rish:
- **Bosh sahifa** (`app/(tabs)/index.tsx`):
  - Pagination bilan mahsulotlar ro'yxati (20 ta/sahifa)
  - Infinite scroll funksiyasi
  - Pull-to-refresh
  - Tanlangan tumanga asoslangan filtrlash
  - 18 yoshdan kichik foydalanuvchilar uchun censored mahsulotlarni yashirish
  - Featured kontragentlar karuseli (4 soniyada avtomatik o'zgaradi)

- **Qidiruv sahifasi** (`app/(tabs)/search.tsx`):
  - Real-time qidiruv (500ms debounce)
  - Kategoriya va subkategoriya bo'yicha filtrlash
  - Kontragent bo'yicha filtrlash
  - Narx oralig'i bo'yicha filtrlash
  - Faol filtrlarni ko'rsatish va olib tashlash

#### Mahsulot tafsilotlari:
- **Mahsulot sahifasi** (`app/product/[id].tsx`):
  - Rasm karuseli (swipe qilish)
  - Quill Delta formatidagi tavsif (QuillDeltaRenderer komponenti)
  - Narx va chegirma ko'rsatkichlari
  - Mavjud miqdor
  - Kontragent ma'lumotlari
  - Yetkazib berish hududlari
  - Sharhlar va reytinglar
  - Savatga qo'shish funksiyasi

#### Filtrlash mexanizmi:
- **Manzilga asoslangan filtrlash**:
  - Foydalanuvchi tanlagan tuman bo'yicha mahsulotlar filtrlash
  - `deliveryRegions` maydoniga asoslangan
  - Agar tuman tanlanmagan bo'lsa, barcha mahsulotlar ko'rsatiladi

- **Yoshga asoslangan filtrlash**:
  - 18 yoshdan kichik foydalanuvchilar uchun `censored: true` mahsulotlar yashiriladi
  - Tug'ilgan sanadan yosh hisoblanadi

### 🛒 Savat (Cart) Funksiyalari

#### Savat boshqaruvi:
- **Savat konteksti** (`contexts/CartContext.tsx`):
  - Real-time savat yangilanishlari
  - Avtomatik yangilanish (token o'zgarganda)
  - Savat ma'lumotlarini saqlash va yangilash

#### Savat operatsiyalari:
- **Mahsulot qo'shish**:
  - `addToCart(productId, quantity, token)` - API chaqiruvi
  - Mavjud miqdor tekshiruvi
  - Xatolik holatlarini boshqarish

- **Mahsulot miqdorini o'zgartirish**:
  - `updateCartItem(productId, quantity, token)`
  - Minimum 1 ta, maksimum mavjud miqdor

- **Mahsulotni olib tashlash**:
  - `removeFromCart(productId, token)`
  - Tasdiqlash dialogi

- **Savatni tozalash**:
  - `clearCart(token)`
  - Barcha mahsulotlarni olib tashlash

#### Savat sahifasi (`app/(tabs)/cart.tsx`):
- Savat elementlarini ko'rsatish
- Miqdor o'zgartirish (+, - tugmalari)
- Mahsulotni olib tashlash
- Jami summa hisoblash
- Chegirma ko'rsatkichlari
- Checkout ga o'tish

### 📦 Buyurtma Jarayoni

#### Buyurtma yaratish (`app/checkout.tsx`):
1. **Buyurtma ma'lumotlarini ko'rsatish**:
   - Savatdagi barcha mahsulotlar
   - Har bir mahsulotning miqdori va narxi
   - Jami summa

2. **To'lov usulini tanlash**:
   - Naqd pul (hozircha yagona variant)
   - Keyinchalik karta to'lovi qo'shilishi mumkin

3. **Yetkazib berish manzilini kiritish**:
   - Viloyat tanlash (majburiy)
   - Tuman tanlash (ixtiyoriy)
   - MFY tanlash (ixtiyoriy)
   - Qo'shimcha eslatma (ixtiyoriy, maksimum 1000 belgi)
   - Telefon raqami (ixtiyoriy, agar kiritilmasa profil telefon raqami ishlatiladi)

4. **Buyurtma yaratish**:
   - Forma validatsiyasi
   - API ga so'rov yuborish (`/api/marketplace/orders`)
   - Muvaffaqiyatli yaratilgandan keyin buyurtma sahifasiga o'tish
   - Savatni avtomatik tozalash (`clearCart: true`)

#### Buyurtmalar ro'yxati (`app/order/index.tsx`):
- Barcha buyurtmalarni ko'rsatish
- Pagination (20 ta/sahifa)
- Infinite scroll
- Buyurtma holatini ko'rsatish:
  - `pending` - Kutilmoqda
  - `confirmed_by_punkt` - Punkt tomonidan tasdiqlandi
  - `requested_to_contragent` - Kontragentga so'rov yuborildi
  - `accepted_by_contragent` - Kontragent tomonidan qabul qilindi
  - `delivered_to_punkt` - Punktga yetkazildi
  - `assigned_to_agent` - Agentga tayinlandi
  - `confirmed_by_agent` - Agent tomonidan tasdiqlandi
  - `confirmed_by_customer` - Mijoz tomonidan tasdiqlandi
  - `cancelled` - Bekor qilingan

- To'lov holatini ko'rsatish:
  - `pending` - Kutilmoqda
  - `paid` - To'langan
  - `failed` - Xatolik
  - `refunded` - Qaytarilgan

#### Buyurtma tafsilotlari (`app/order/[id].tsx`):
- Buyurtmaning barcha ma'lumotlari
- Mahsulotlar ro'yxati
- Yetkazib berish manzili
- To'lov ma'lumotlari
- Buyurtma holati va tarixi
- To'lov qilish tugmasi (agar kerak bo'lsa)
- Buyurtmani bekor qilish (faqat `pending` holatida)
- Yetkazib berishni tasdiqlash (agar kerak bo'lsa)

### 💳 To'lov Tizimi

#### To'lov jarayoni:
1. **To'lov qilish**:
   - Buyurtma `confirmed_by_customer` holatida bo'lishi kerak
   - To'lov usuli: naqd yoki karta
   - API chaqiruvi: `/api/payment/orders/{orderId}/pay`
   - To'lov transaksiyasi yaratiladi

2. **To'lov holatini kuzatish**:
   - API chaqiruvi: `/api/payment/orders/{orderId}/payment-status`
   - To'lov transaksiyasi holati:
     - `pending` - Kutilmoqda
     - `collected` - Qabul qilindi
     - `submitted` - Topshirildi
     - `received` - Qabul qilindi
     - `confirmed` - Tasdiqlandi
     - `rejected` - Rad etildi

3. **To'lov transaksiyasi tarixi**:
   - `transactionPath` - To'lov yo'li
   - Har bir bosqichda kim to'lovni qabul qilgani
   - Vaqt belgilari

### 📍 Manzil Boshqaruvi

#### Manzil konteksti (`contexts/LocationContext.tsx`):
- **Viloyat va Tuman tanlash**:
  - API dan yuklash (`/api/marketplace/me/viloyat-tuman`)
  - Faqat autentifikatsiya qilingan foydalanuvchilar uchun
  - AsyncStorage da saqlanmaydi, faqat API dan yuklanadi

- **Manzil o'zgartirish**:
  - Profil sahifasidan manzilni yangilash
   - API ga so'rov: `/api/marketplace/me/location`
   - Viloyat, Tuman, MFY yangilanishi

#### Manzil tanlash komponenti (`components/LocationSelector.tsx`):
- Viloyat va Tuman tanlash modal oynasi
- Tanlangan manzilni ko'rsatish
- Manzilni o'zgartirish imkoniyati
- Avtomatik ochilish (parametr orqali)

#### Region Picker komponenti (`components/ui/RegionPicker.tsx`):
- Viloyat, Tuman, MFY tanlash
- Parent-child munosabatlari
- Qidiruv funksiyasi
- Loading holatlari

### 🔔 Bildirishnomalar Tizimi

#### Bildirishnomalar konteksti (`contexts/NotificationContext.tsx`):
- **Real-time yangilanish**:
  - Har 1 soniyada unread count yangilanadi
  - API chaqiruvi: `/api/marketplace/notifications/unread-count`
  - Avtomatik yangilanish

- **Bildirishnoma turlari**:
  - `info` - Ma'lumot
  - `warning` - Ogohlantirish
  - `success` - Muvaffaqiyat
  - `error` - Xatolik
  - `announcement` - E'lon
  - `promotion` - Aksiya
  - `update` - Yangilanish

#### Bildirishnomalar sahifasi (`app/notifications.tsx`):
- Barcha bildirishnomalarni ko'rsatish
- Pagination (20 ta/sahifa)
- Infinite scroll
- Pull-to-refresh
- Bildirishnomani o'qilgan deb belgilash
- Barchasini o'qilgan deb belgilash
- Bildirishnoma tafsilotlarini ko'rsatish (modal oyna)
- Vaqt formatlash (hozirgina, N daqiqa oldin, N soat oldin, N kun oldin)

### 👤 Profil Boshqaruvi

#### Profil sahifasi (`app/(tabs)/profile.tsx`):
- **Avatar boshqaruvi**:
  - Avatar yuklash (react-native-image-picker)
  - Base64 formatida yuborish
  - API: `/api/marketplace/me/avatar`

- **Shaxsiy ma'lumotlarni tahrirlash**:
  - Ism va Familiya
  - Jins (Erkak/Ayol)
  - Tug'ilgan sana (Kun, Oy, Yil pickerlar)
  - Validatsiya:
    - Ism/Familiya: 2-50 belgi
    - Tug'ilgan sana: to'g'ri sana, kelajakda bo'lishi mumkin emas
  - API: `/api/marketplace/me`

- **Parolni o'zgartirish**:
  - Joriy parol
  - Yangi parol (minimum 6 belgi)
  - Parolni tasdiqlash
  - API: `/api/marketplace/me/password`

- **Manzilni yangilash**:
  - Viloyat, Tuman, MFY tanlash
  - API: `/api/marketplace/me/location`

- **Buyurtmalar tarixi**:
  - Barcha buyurtmalarni ko'rish
  - Buyurtma holatini kuzatish

- **Hamkorlik so'rovlari**:
  - Agar hamkorlik so'rovi bo'lsa, ko'rsatiladi
  - So'rov holatini kuzatish

- **Chiqish**:
  - Tizimdan chiqish
  - Barcha ma'lumotlarni tozalash

### ⭐ Sharhlar va Reytinglar

#### Sharh qoldirish (`components/ReviewModal.tsx`):
- **Shablon sharhlar**:
  - API dan shablonlar yuklanadi (`/api/reviews/templates`)
  - Shablon tanlash

- **Maxsus sharh**:
  - Foydalanuvchi o'zi sharh yozishi mumkin
  - Maksimum uzunlik cheklovlari

- **Reyting**:
  - 1-5 yulduz reyting
  - Har bir mahsulot uchun alohida reyting

- **Sharh yuborish**:
  - API: `/api/reviews`
  - Buyurtma ID va Mahsulot ID kerak
  - Shablon yoki maxsus sharh

#### Mahsulot sharhlarini ko'rish:
- API: `/api/reviews/product/{productId}`
- Pagination
- O'rtacha reyting
- Sharhlar ro'yxati
- Foydalanuvchi ma'lumotlari

### 🤝 Hamkorlik So'rovlari

#### Hamkorlik so'rovini yuborish (`components/PartnershipRequestModal.tsx`):
- **Kompaniya ma'lumotlari**:
  - Kompaniya nomi
  - INN
  - MFO
  - Hisob raqami

- **Manzil**:
  - Viloyat, Tuman, MFY

- **Faoliyat turi**:
  - Kontragent turlari ro'yxatidan tanlash
  - API: `/api/contragent-types`

- **Menejer ma'lumotlari**:
  - Ism, Familiya
  - Telefon raqami

- **So'rov holati**:
  - `pending` - Kutilmoqda
  - `reviewing` - Ko'rib chiqilmoqda
  - `contacted` - Bog'lanishgan
  - `approved` - Tasdiqlangan
  - `rejected` - Rad etilgan

#### Hamkorlik so'rovlarini ko'rish (`app/partnership-requests.tsx`):
- Barcha so'rovlarni ko'rsatish
- So'rov holatini kuzatish
- So'rov tafsilotlarini ko'rish

### 🏪 Do'konlar (Kontragentlar)

#### Do'konlar sahifasi (`app/(tabs)/shops.tsx`):
- Barcha kontragentlarni ko'rsatish
- Faoliyat turi bo'yicha filtrlash
- Qidiruv funksiyasi
- Pagination
- Infinite scroll

#### Do'kon tafsilotlari:
- Do'kon ma'lumotlari
- Logo va nom
- Manzil
- Faoliyat turi
- Mahsulotlar ro'yxati
- Kategoriyalar

## 🛠️ Texnologiyalar va Asosiy Kutubxonalar

### Asosiy Texnologiyalar:
- **React Native** 0.81.5 - Mobil ilova framework
- **Expo** ~54.0.25 - Development va build platformasi
- **Expo Router** ~6.0.15 - File-based routing
- **TypeScript** 5.9.2 - Type safety
- **React** 19.1.0 - UI library

### Navigation va UI:
- **@react-navigation/native** ^7.1.8 - Navigation library
- **@expo/vector-icons** ^15.0.3 - Iconlar (Ionicons)
- **react-native-safe-area-context** ~5.6.0 - Safe area boshqaruvi
- **react-native-gesture-handler** ~2.28.0 - Gesture boshqaruvi
- **react-native-reanimated** ~4.1.1 - Animatsiyalar
- **react-native-screens** ~4.16.0 - Native screens

### State Management:
- **React Context API** - Global state boshqaruvi
  - `AuthContext` - Autentifikatsiya va foydalanuvchi ma'lumotlari
  - `CartContext` - Savat boshqaruvi
  - `NotificationContext` - Bildirishnomalar
  - `LocationContext` - Manzil boshqaruvi
  - `SnackbarContext` - Xabar ko'rsatish

### Storage:
- **@react-native-async-storage/async-storage** 2.2.0 - Local storage
  - Token saqlash: `@marketplace:token`
  - Foydalanuvchi ma'lumotlari: `@marketplace:user`

### Media:
- **react-native-image-picker** ^7.1.2 - Rasm tanlash va yuklash
  - Avatar yuklash
  - Base64 formatida yuborish

### Boshqa:
- **react-native-webview** 13.15.0 - WebView integratsiyasi
- **@react-native-community/datetimepicker** ^8.5.0 - Sana tanlash
- **expo-blur** ~15.0.7 - Blur effektlari
- **expo-haptics** ~15.0.7 - Haptic feedback

## 📁 Loyiha Strukturasi

```
marketplace/
├── app/                          # Expo Router sahifalar (File-based routing)
│   ├── _layout.tsx              # Root layout (Context providers)
│   ├── index.tsx                # Initial routing logic
│   │
│   ├── (auth)/                  # Autentifikatsiya sahifalari (Route group)
│   │   ├── _layout.tsx          # Auth layout
│   │   ├── login.tsx            # Kirish (2 bosqichli)
│   │   ├── register.tsx         # Ro'yxatdan o'tish (boshlang'ich)
│   │   ├── register-form.tsx    # Ro'yxatdan o'tish formasi
│   │   ├── sms-verify.tsx       # SMS kod tasdiqlash
│   │   ├── forgot-password.tsx # Parolni tiklash (boshlang'ich)
│   │   └── reset-password.tsx  # Parolni tiklash formasi
│   │
│   ├── (tabs)/                  # Asosiy tab sahifalar (Route group)
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Bosh sahifa (Mahsulotlar)
│   │   ├── search.tsx           # Qidiruv va filtrlash
│   │   ├── cart.tsx             # Savat
│   │   ├── shops.tsx            # Do'konlar (Kontragentlar)
│   │   └── profile.tsx          # Profil
│   │
│   ├── product/                 # Mahsulot sahifalari
│   │   └── [id].tsx             # Mahsulot tafsilotlari (Dynamic route)
│   │
│   ├── order/                   # Buyurtma sahifalari
│   │   ├── index.tsx            # Buyurtmalar ro'yxati
│   │   └── [id].tsx             # Buyurtma tafsilotlari
│   │
│   ├── checkout.tsx             # Buyurtma berish
│   ├── notifications.tsx        # Bildirishnomalar
│   └── partnership-requests.tsx # Hamkorlik so'rovlari
│
├── components/                   # Qayta ishlatiladigan komponentlar
│   ├── Header.tsx               # Umumiy header komponenti
│   ├── KeyboardAwareScrollView.tsx # Klaviatura bilan ishlash
│   ├── LocationSelector.tsx     # Manzil tanlash komponenti
│   ├── PartnershipBlock.tsx      # Hamkorlik bloki
│   ├── PartnershipRequestModal.tsx # Hamkorlik so'rovi modali
│   ├── ReviewModal.tsx           # Sharh modali
│   ├── SmsCodeInput.tsx         # SMS kod kiritish
│   │
│   └── ui/                      # UI komponentlari
│       ├── ActivityTypePicker.tsx # Faoliyat turi tanlash
│       ├── Button.tsx            # Tugma komponenti
│       ├── Card.tsx               # Karta komponenti
│       ├── FilterModal.tsx       # Filtr modali
│       ├── ImageCarousel.tsx     # Rasm karuseli
│       ├── ImageViewer.tsx       # Rasm ko'ruvchi
│       ├── Input.tsx             # Input komponenti
│       ├── PasswordInput.tsx     # Parol input
│       ├── PhoneInput.tsx        # Telefon input
│       ├── ProductCard.tsx      # Mahsulot kartasi
│       ├── QuillDeltaRenderer.tsx # Quill Delta renderer
│       ├── RegionPicker.tsx      # Hudud tanlash
│       └── Snackbar.tsx          # Xabar komponenti
│
├── contexts/                    # Context providers
│   ├── AuthContext.tsx          # Autentifikatsiya konteksti
│   ├── CartContext.tsx          # Savat konteksti
│   ├── LocationContext.tsx      # Manzil konteksti
│   ├── NotificationContext.tsx  # Bildirishnoma konteksti
│   └── SnackbarContext.tsx      # Xabar konteksti
│
├── services/                    # API xizmatlari
│   └── api.ts                   # Asosiy API service
│
├── assets/                      # Rasmlar va resurslar
│   ├── images/                  # Rasm fayllari
│   ├── icon.png                 # Ilova ikonkasi
│   └── bg.png                   # Fon rasmi
│
├── app.json                     # Expo konfiguratsiyasi
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript konfiguratsiyasi
├── eas.json                     # EAS Build konfiguratsiyasi
└── README.md                    # Bu fayl
```

## 🚀 O'rnatish va Ishga Tushirish

### Talablar:
- **Node.js** v18 yoki yuqori
- **npm** yoki **yarn**
- **Expo CLI** (global o'rnatilgan)
- **Android Studio** (Android development uchun)
- **Xcode** (iOS development uchun, faqat macOS)

### O'rnatish:

1. **Repository ni klonlash**:
   ```bash
   git clone <repository-url>
   cd marketplace
   ```

2. **Dependencies ni o'rnatish**:
   ```bash
   npm install
   ```

3. **API URL larni sozlash**:
   
   `services/api.ts` faylida quyidagi URL larni o'zgartiring:
   ```typescript
   const BASE_URL = 'https://api.ttsa.uz/api/marketplace';
   const REGIONS_BASE_URL = 'https://api.ttsa.uz/api';
   const REVIEWS_BASE_URL = 'https://api.ttsa.uz/api/reviews';
   const PAYMENT_BASE_URL = 'https://api.ttsa.uz/api/payment';
   ```

### Ishga Tushirish:

#### Development Mode:
```bash
npm start
```

Keyin quyidagi variantlardan birini tanlang:
- `a` - Android emulator
- `i` - iOS simulator
- `w` - Web brauzer
- QR kod orqali Expo Go ilovasida ochish

#### Platformaga Xos Build:

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## ⚙️ Konfiguratsiya

### Android Permissions:

`app.json` da quyidagi ruxsatlar mavjud:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE"
]
```

### iOS Permissions:

`app.json` da quyidagi ruxsatlar sozlanadi:
```json
"infoPlist": {
  "NSPhotoLibraryUsageDescription": "Rasmlarni tanlash uchun ruxsat kerak",
  "NSCameraUsageDescription": "Kameradan rasm olish uchun ruxsat kerak"
}
```

### App Configuration:

- **App Name**: TTSA Marketplace
- **Package Name**: com.botir123.marketplace
- **Version**: 1.0.0
- **Orientation**: Portrait
- **New Architecture**: Enabled
- **Edge to Edge**: Enabled (Android)

## 📝 API Integratsiyasi

### Asosiy Endpointlar:

#### Autentifikatsiya:
- `POST /api/marketplace/register/step1` - SMS kod olish (ro'yxatdan o'tish)
- `POST /api/marketplace/register/step2` - Hisob yaratish
- `POST /api/marketplace/login/step1` - SMS kod olish (kirish)
- `POST /api/marketplace/login/step2` - Kirish
- `POST /api/marketplace/forgot-password/step1` - SMS kod olish (parolni tiklash)
- `POST /api/marketplace/forgot-password/step2` - Parolni tiklash
- `POST /api/marketplace/resend-code` - SMS kodni qayta yuborish
- `GET /api/marketplace/check-phone` - Telefon raqamini tekshirish

#### Profil:
- `GET /api/marketplace/me` - Profil ma'lumotlarini olish
- `PUT /api/marketplace/me` - Profilni yangilash
- `PATCH /api/marketplace/me/password` - Parolni o'zgartirish
- `PATCH /api/marketplace/me/avatar` - Avatar yuklash
- `PATCH /api/marketplace/me/location` - Manzilni yangilash
- `GET /api/marketplace/me/viloyat-tuman` - Viloyat va Tuman ma'lumotlari

#### Mahsulotlar:
- `GET /api/marketplace/products` - Barcha mahsulotlar
- `GET /api/marketplace/products/:id` - Mahsulot tafsilotlari
- `GET /api/marketplace/categories` - Kategoriyalar
- `GET /api/marketplace/categories/:id` - Kategoriya tafsilotlari
- `GET /api/marketplace/search` - Qidiruv
- `GET /api/marketplace/filter` - Filtrlash

#### Kontragentlar:
- `GET /api/marketplace/contragents` - Barcha kontragentlar
- `GET /api/marketplace/contragents/:id` - Kontragent tafsilotlari
- `GET /api/marketplace/featured-contragents` - Tanlangan kontragentlar
- `GET /api/contragent-types` - Kontragent turlari

#### Savat:
- `GET /api/marketplace/cart` - Savatni olish
- `POST /api/marketplace/cart` - Mahsulot qo'shish
- `PUT /api/marketplace/cart/:productId` - Mahsulot miqdorini o'zgartirish
- `DELETE /api/marketplace/cart/:productId` - Mahsulotni olib tashlash
- `DELETE /api/marketplace/cart` - Savatni tozalash

#### Buyurtmalar:
- `POST /api/marketplace/orders` - Buyurtma yaratish
- `GET /api/marketplace/orders` - Buyurtmalar ro'yxati
- `GET /api/marketplace/orders/:id` - Buyurtma tafsilotlari
- `DELETE /api/marketplace/orders/:id` - Buyurtmani bekor qilish
- `POST /api/marketplace/orders/:id/confirm-delivery` - Yetkazib berishni tasdiqlash

#### To'lov:
- `POST /api/payment/orders/:id/pay` - To'lov qilish
- `GET /api/payment/orders/:id/payment-status` - To'lov holatini olish

#### Bildirishnomalar:
- `GET /api/marketplace/notifications/list` - Bildirishnomalar ro'yxati
- `GET /api/marketplace/notifications/unread-count` - O'qilmagan soni
- `POST /api/marketplace/notifications/:id/read` - O'qilgan deb belgilash
- `POST /api/marketplace/notifications/read-all` - Barchasini o'qilgan deb belgilash

#### Sharhlar:
- `GET /api/reviews/templates` - Shablon sharhlar
- `POST /api/reviews` - Sharh yuborish
- `GET /api/reviews/product/:id` - Mahsulot sharhlari

#### Hamkorlik:
- `POST /api/marketplace/marketplace-partnership-requests` - So'rov yuborish
- `GET /api/marketplace/marketplace-partnership-requests` - So'rovlar ro'yxati
- `GET /api/marketplace/marketplace-partnership-requests/:id` - So'rov tafsilotlari

#### Hududlar:
- `GET /api/regions` - Hududlar ro'yxati (Viloyat, Tuman, MFY)

### API Xatoliklarni Boshqarish:

- **401 Unauthorized**: 
  - Avtomatik chiqish
  - Barcha ma'lumotlarni tozalash
  - Login sahifasiga yo'naltirish

- **Validation Errors**:
  - Detallangan xatolik xabarlari
  - Forma maydonlariga xatoliklar ko'rsatish

- **Network Errors**:
  - Xatolik xabarlarini ko'rsatish
  - Retry mexanizmi (keyinchalik qo'shilishi mumkin)

## 🔄 Real-time Funksiyalar

### Bildirishnomalar:
- **Unread count**: Har 1 soniyada avtomatik yangilanadi
- **Real-time yangilanish**: `NotificationContext` orqali

### Savat:
- **Real-time yangilanishlar**: `CartContext` orqali
- **Avtomatik yangilanish**: Token o'zgarganda yoki sahifa fokuslanganda

### Buyurtmalar:
- **Holat kuzatish**: Buyurtma holati o'zgarganda yangilanadi
- **To'lov holati**: Real-time to'lov holatini kuzatish

## 🎨 UI/UX Xususiyatlari

### Dizayn:
- **Zamonaviy va intuitiv interfeys**: Material Design prinsiplari asosida
- **Dark/Light mode**: Automatic qo'llab-quvvatlash (tizim sozlamalariga moslashadi)
- **Responsive dizayn**: Turli ekran o'lchamlari uchun moslashgan
- **Safe Area**: Barcha sahifalarda safe area hisobga olinadi

### Animatsiyalar:
- **Smooth transitions**: Sahifalar o'rtasida yumshoq o'tishlar
- **Loading states**: Barcha yuklanish holatlari ko'rsatiladi
- **Pull-to-refresh**: Barcha ro'yxatlarda pull-to-refresh funksiyasi
- **Infinite scroll**: Pagination bilan cheksiz scroll

### Xabar ko'rsatish:
- **Snackbar**: Muvaffaqiyat va xatolik xabarlari
- **Alert dialogs**: Muhim tasdiqlashlar uchun
- **Toast messages**: Qisqa xabarlar

### Error Handling:
- **Xatolik xabarlari**: Barcha xatoliklar foydalanuvchiga ko'rsatiladi
- **Retry mexanizmi**: Ba'zi operatsiyalar uchun qayta urinish imkoniyati
- **Offline detection**: Tarmoq yo'qligini aniqlash (keyinchalik qo'shilishi mumkin)

## 🔐 Xavfsizlik

### Autentifikatsiya:
- **JWT Token**: Bearer token autentifikatsiyasi
- **Token saqlash**: AsyncStorage da xavfsiz saqlash
- **Auto-logout**: 401 xatolikda avtomatik chiqish
- **Token validation**: Har bir API chaqiruvida token tekshiriladi

### Ma'lumotlar himoyasi:
- **Sensitive data**: Token va foydalanuvchi ma'lumotlari xavfsiz saqlanadi
- **Storage cleanup**: Chiqishda barcha ma'lumotlar tozalanadi
- **Error handling**: Xatolik holatlarida ma'lumotlar o'chirilmaydi

### API Xavfsizligi:
- **HTTPS**: Barcha API chaqiruvlari HTTPS orqali
- **Authorization headers**: Har bir so'rovda Authorization header
- **Error responses**: Xatolik javoblarini to'g'ri boshqarish

## 📊 State Management

### Context API:
- **AuthContext**: 
  - Foydalanuvchi autentifikatsiyasi
  - Token boshqaruvi
  - Auto-logout mexanizmi
  - User ma'lumotlarini yangilash

- **CartContext**:
  - Savat ma'lumotlari
  - Savat operatsiyalari (qo'shish, o'zgartirish, olib tashlash)
  - Real-time yangilanishlar

- **NotificationContext**:
  - Unread count
  - Real-time yangilanish (har 1 soniyada)
  - Count decrement/increment

- **LocationContext**:
  - Tanlangan viloyat va tuman
  - API dan yuklash
  - Manzil o'zgartirish

- **SnackbarContext**:
  - Xabar ko'rsatish
  - Muvaffaqiyat/xatolik xabarlari
  - Action buttonlar

### Local State:
- **Component state**: React useState hook
- **Form state**: Har bir formada alohida state
- **Loading states**: Har bir operatsiya uchun loading holati

## 🧪 Testing

### Linting:
```bash
npm run lint
```

### Type Checking:
TypeScript kompilyatsiyasi avtomatik tekshiriladi.

### Manual Testing:
- Barcha funksiyalar qo'lda test qilinadi
- Turli xil holatlar tekshiriladi
- Xatolik senariylari sinab ko'riladi

## 📦 Build va Deploy

### EAS Build (Expo Application Services):

#### EAS CLI ni o'rnatish:
```bash
npm install -g eas-cli
```

#### EAS ga kirish:
```bash
eas login
```

#### Build yaratish:

**Development build:**
```bash
eas build --profile development --platform android
```

**Preview build (APK):**
```bash
eas build --profile preview --platform android
```

**Production build (App Bundle):**
```bash
eas build --profile production --platform android
```

**Production build (APK):**
```bash
eas build --profile production-apk --platform android
```

### Build Profillari (`eas.json`):

- **development**: Development client bilan
- **preview**: APK formatida (test uchun)
- **production**: App Bundle formatida (Google Play uchun)
- **production-apk**: APK formatida (production)

### Local Build:

**Android APK:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

### App Signing:

Android uchun signing key `android/app/debug.keystore` da saqlanadi.

Production uchun yangi key yaratish kerak:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

## 🔄 Development Workflow

### Code Structure:
- **File-based routing**: Expo Router
- **Component-based**: Har bir komponent alohida fayl
- **Context-based state**: Global state uchun Context API
- **Service layer**: API chaqiruvlari `services/api.ts` da

### Best Practices:
- **TypeScript**: Barcha fayllar TypeScript da
- **Error handling**: Try-catch bloklarida xatoliklarni boshqarish
- **Loading states**: Barcha async operatsiyalar uchun loading holati
- **Validation**: Forma validatsiyasi client-side da
- **Code organization**: Modullar bo'yicha tashkil etilgan

### Git Workflow:
1. Feature branch yaratish
2. O'zgarishlarni commit qilish
3. Branch ga push qilish
4. Pull Request yaratish
5. Code review
6. Merge qilish

## 🐛 Ma'lum Xatoliklar va Cheklovlar

### Hozirgi Cheklovlar:
- **Offline mode**: Hozircha qo'llab-quvvatlanmaydi
- **Push notifications**: Hozircha qo'llab-quvvatlanmaydi
- **Image caching**: Rasm caching to'liq optimallashtirilmagan
- **Error retry**: Ba'zi xatoliklarda retry mexanizmi yo'q

### Ma'lum Xatoliklar:
- Ba'zi sahifalarda pull-to-refresh sekin ishlashi mumkin
- Katta rasmlar yuklanishda sekin bo'lishi mumkin

## 🔮 Keyingi Rejalar

### Qisqa muddatli:
- [ ] Push notifications qo'shish
- [ ] Offline mode qo'llab-quvvatlash
- [ ] Image caching optimallashtirish
- [ ] Error retry mexanizmi
- [ ] Performance optimallashtirish

### Uzoq muddatli:
- [ ] Favorites/Wishlist funksiyasi
- [ ] Chat funksiyasi (mijoz-kontragent)
- [ ] Multi-language support (O'zbek, Rus, Ingliz)
- [ ] Advanced analytics
- [ ] Social media integratsiyasi
- [ ] Payment gateway integratsiyasi (Payme, Click, Uzcard)
- [ ] Dark mode manual toggle
- [ ] Biometric authentication

## 📞 Aloqa va Yordam

### Savollar yoki Takliflar:
- GitHub Issues orqali
- Development team bilan aloqa

### Documentation:
- API dokumentatsiyasi backend da
- Component dokumentatsiyasi inline comments da

## 📄 License

Bu loyiha private loyiha hisoblanadi va mualliflik huquqi bilan himoyalangan.

## 👥 Mualliflar

- **Marketplace Development Team**
- **TTSA** - O'zbekiston

## 📝 O'zgarishlar Tarixi

### Version 1.0.0 (Hozirgi):
- ✅ Asosiy autentifikatsiya funksiyalari
- ✅ Mahsulotlar ko'rsatish va qidiruv
- ✅ Savat funksiyalari
- ✅ Buyurtma berish
- ✅ To'lov tizimi
- ✅ Profil boshqaruvi
- ✅ Bildirishnomalar
- ✅ Sharhlar va reytinglar
- ✅ Hamkorlik so'rovlari

---

**Eslatma**: Bu loyiha faol ishlab chiqilmoqda. Ba'zi funksiyalar hali to'liq optimallashtirilmagan yoki keyinchalik yaxshilanishi mumkin.

**Oxirgi yangilanish**: 2026-yil