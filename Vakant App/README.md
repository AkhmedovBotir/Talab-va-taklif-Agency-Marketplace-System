# Vakant - Vakansiya Ilovasi

Vakant - bu O'zbekistondagi vakansiyalarni ko'rish, ariza yuborish va boshqarish uchun mo'ljallangan mobil ilova. Ilova React Native va Expo texnologiyalari asosida qurilgan.

## 📱 Asosiy Xususiyatlar

- **Vakansiyalar**: Barcha mavjud vakansiyalarni ko'rish, qidirish va filtrlash
- **Ariza Yuborish**: Vakansiyaga ariza yuborish va ariza holatini kuzatish
- **Profil Boshqaruvi**: Shaxsiy ma'lumotlarni yangilash, avatar o'rnatish, manzilni sozlash
- **Bildirishnomalar**: Real-time bildirishnomalar va avtomatik yangilanish (har 1 sekunda)
- **Bookmarklar**: Qiziqarli vakansiyalarni saqlash
- **Autentifikatsiya**: Telefon raqami orqali ro'yxatdan o'tish va kirish
- **Ariza Holati**: Arizalaringizning holatini kuzatish (pending, reviewed, accepted, rejected)

## 🛠 Texnologiyalar

- **React Native** 0.81.5
- **Expo** ~54.0.26
- **TypeScript** 5.9.2
- **Expo Router** ~6.0.16 (file-based routing)
- **React Navigation** 7.x
- **AsyncStorage** - ma'lumotlarni saqlash uchun
- **React Native Image Picker** - rasm tanlash uchun

## 📋 Talablar

- Node.js (v18 yoki yuqori)
- npm yoki yarn
- Expo CLI
- Android Studio (Android uchun)
- Xcode (iOS uchun, faqat macOS)

## 🚀 O'rnatish va Ishga Tushirish

### 1. Dependencies o'rnatish

```bash
npm install
```

### 2. Ilovani ishga tushirish

```bash
# Development server
npm start

# Android uchun
npm run android

# iOS uchun
npm run ios

# Web uchun
npm run web
```

### 3. API konfiguratsiyasi

`constants/config.ts` faylida API URL ni o'zgartiring:

```typescript
export const API_BASE_URL = 'http://your-api-url:5000';
```

## 📁 Proyekt Strukturasi

```
vakant/
├── app/                    # Expo Router fayllari
│   ├── (tabs)/            # Tab navigation ekranlari
│   │   ├── vacancies/     # Vakansiyalar
│   │   ├── applications/  # Arizalar
│   │   ├── bookmarks/     # Bookmarklar
│   │   ├── notifications/ # Bildirishnomalar
│   │   └── index.tsx      # Profil ekrani
│   ├── auth/              # Autentifikatsiya ekranlari
│   │   ├── login/         # Kirish
│   │   ├── register/      # Ro'yxatdan o'tish
│   │   └── forgot-password/ # Parolni tiklash
│   └── _layout.tsx        # Root layout
├── components/            # Qayta ishlatiladigan komponentlar
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── DatePicker.tsx
│   ├── RegionPicker.tsx
│   └── ...
├── contexts/              # React Context API
│   ├── AuthContext.tsx    # Autentifikatsiya konteksti
│   └── NotificationContext.tsx # Bildirishnomalar konteksti
├── services/              # API xizmatlari
│   ├── api.ts             # Asosiy API funksiyalari
│   ├── vacancyApi.ts      # Vakansiya API
│   ├── profileApi.ts      # Profil API
│   └── notificationApi.ts # Bildirishnomalar API
├── constants/             # Konstanta qiymatlar
│   └── config.ts          # API URL va boshqa sozlamalar
├── utils/                 # Yordamchi funksiyalar
│   └── authUtils.ts       # Autentifikatsiya yordamchi funksiyalari
└── assets/                # Rasmlar va boshqa resurslar
```

## 🔑 Asosiy Funksiyalar

### Autentifikatsiya
- Telefon raqami orqali ro'yxatdan o'tish
- SMS kod orqali tasdiqlash
- JWT token asosida autentifikatsiya
- Avtomatik token yangilanish

### Vakansiyalar
- Vakansiyalarni ko'rish va qidirish
- Vakansiya tafsilotlarini ko'rish
- Arizalar yuborish (savollar bilan)
- Bookmark qo'shish/olib tashlash

### Profil
- Shaxsiy ma'lumotlarni yangilash
- Avatar yuklash (react-native-image-picker)
- Manzilni sozlash (Viloyat, Tuman, MFY)
- Parolni o'zgartirish

### Bildirishnomalar
- Real-time bildirishnomalar
- Avtomatik yangilanish (har 1 sekunda)
- O'qilmagan xabarlar soni
- Barcha xabarlarni o'qilgan deb belgilash

## 📱 Platformalar

- ✅ Android
- ✅ iOS
- ✅ Web

## 🔧 Sozlamalar

### Android Permissions
Ilova quyidagi ruxsatlarni talab qiladi:
- `READ_MEDIA_IMAGES` - Rasm tanlash uchun
- `CAMERA` - Kamera orqali rasm olish uchun

### iOS Permissions
- `NSPhotoLibraryUsageDescription` - Rasm tanlash uchun
- `NSCameraUsageDescription` - Kamera orqali rasm olish uchun

## 🧪 Development

### Linting
```bash
npm run lint
```

### TypeScript tekshirish
```bash
npx tsc --noEmit
```

## 📦 Build

### Android APK
```bash
npm run android
```

### iOS Build
```bash
npm run ios
```

## 🔐 Xavfsizlik

- JWT token asosida autentifikatsiya
- Token AsyncStorage da xavfsiz saqlanadi
- Avtomatik token yangilanish
- Unauthorized holatlar avtomatik boshqariladi

## 📝 API Endpoints

Ilova quyidagi API endpointlar bilan ishlaydi:

- `/api/vacancy-auth` - Autentifikatsiya
- `/api/vacancy` - Vakansiyalar va arizalar
- `/api/vacancy-profile` - Profil ma'lumotlari
- `/api/vacancy/notifications` - Bildirishnomalar

## 🤝 Yordam

Muammo yoki savol bo'lsa, iltimos issue oching yoki rivojlantiruvchilar bilan bog'laning.

## 📄 Litsenziya

Bu proyekt private litsenziya ostida.

## 👨‍💻 Rivojlantiruvchi

Proyekt O'zbekiston vakansiya tizimi uchun ishlab chiqilgan.

---

**Eslatma**: Ilovani ishga tushirishdan oldin, `constants/config.ts` faylida API URL ni to'g'ri sozlang.
