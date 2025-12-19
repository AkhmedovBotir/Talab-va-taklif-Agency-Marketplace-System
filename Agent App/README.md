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

- **React Native** - 0.81.5
- **Expo** - ~54.0.25
- **TypeScript** - 5.9.2
- **Expo Router** - ~6.0.15 (file-based routing)
- **Axios** - HTTP client
- **AsyncStorage** - ma'lumotlarni saqlash
- **React Navigation** - navigatsiya

## 📦 Asosiy kutubxonalar

- `@expo/vector-icons` - ikonlar
- `@react-native-async-storage/async-storage` - lokal ma'lumotlar saqlash
- `@react-native-community/datetimepicker` - sana va vaqt tanlash
- `react-native-gesture-handler` - gesturalar
- `react-native-reanimated` - animatsiyalar
- `react-native-safe-area-context` - xavfsiz hudud konteksti

## 🚀 O'rnatish va ishga tushirish

### Talablar

- Node.js (v18 yoki yuqori)
- npm yoki yarn
- Expo CLI
- Android Studio (Android uchun) yoki Xcode (iOS uchun)

### O'rnatish

1. **Loyihani klonlash va dependencies o'rnatish:**

```bash
npm install
```

2. **API konfiguratsiyasini sozlash:**

`config/api.ts` faylida API base URL ni o'zgartiring:

```typescript
export const API_BASE_URL = 'http://your-api-url:5000/api';
```

3. **Ilovani ishga tushirish:**

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

## 📁 Loyiha strukturası

```
agent/
├── app/                    # Expo Router sahifalar
│   ├── (tabs)/            # Tab navigatsiya sahifalari
│   │   ├── orders.tsx     # Buyurtmalar ro'yxati
│   │   ├── orders-history.tsx  # Buyurtmalar tarixi
│   │   ├── finance.tsx    # Moliya boshqaruvi
│   │   ├── notifications.tsx    # Xabarnomalar
│   │   └── profile.tsx   # Profil
│   ├── order/             # Buyurtma detallari
│   │   └── [id].tsx
│   ├── login.tsx          # Kirish sahifasi
│   ├── kpi.tsx            # KPI sahifasi
│   ├── index.tsx          # Asosiy sahifa (routing)
│   └── _layout.tsx        # Root layout
├── assets/                # Rasmlar va resurslar
├── config/                # Konfiguratsiya fayllari
│   └── api.ts             # API endpoints
├── contexts/              # React Context'lar
│   └── AuthContext.tsx    # Autentifikatsiya konteksti
├── services/              # Xizmatlar
│   └── api.ts             # API xizmati
├── types/                 # TypeScript tiplari
│   └── api.ts             # API tiplari
├── app.json               # Expo konfiguratsiyasi
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript konfiguratsiyasi
```

## 🔐 Autentifikatsiya

Ilova telefon raqami va parol orqali autentifikatsiya qiladi:

- Telefon raqami: `+998XXXXXXXXX` formatida
- Token AsyncStorage'da saqlanadi
- Avtomatik token tekshiruvi va yangilanish

## 👥 Agent rollari

Ilova uch xil agent rolini qo'llab-quvvatlaydi:

1. **MFY Agent** - Mahalla fuqarolar yig'ini agenti
2. **Tuman Agent** - Tuman agenti
3. **Viloyat Agent** - Viloyat agenti

Har bir rol uchun alohida funksiyalar va huquqlar mavjud.

## 📋 Asosiy funksiyalar

### Buyurtmalar

- Barcha buyurtmalarni ko'rish
- Bugungi buyurtmalar
- Buyurtma detallarini ko'rish
- Buyurtmani tasdiqlash
- Buyurtmani yetkazib berilgan deb belgilash
- Qidiruv va filtrlash

### Moliya

- **MFY Agent:**
  - Kunlik hisobot
  - Kutilayotgan to'lovlar
  - To'lovlarni yig'ish
  - Tumanga yuborish
  - Statistika

- **Tuman Agent:**
  - Hisobot ko'rish
  - MFY yuborishlarini tasdiqlash
  - Viloyatga yuborish
  - Statistika

- **Viloyat Agent:**
  - Hisobot ko'rish
  - Tuman yuborishlarini tasdiqlash
  - Moliya bo'limiga yuborish
  - Statistika

### KPI

- KPI summary
- Tranzaksiyalar
- Kunlik balans
- Kunlik hisobotlar

### Xabarnomalar

- Xabarnomalar ro'yxati
- O'qilmagan xabarnomalar soni
- Xabarnomani o'qilgan deb belgilash
- Barcha xabarnomalarni o'qilgan deb belgilash

## 🔌 API Integratsiyasi

API xizmati `services/api.ts` faylida joylashgan va quyidagi funksiyalarni ta'minlaydi:

- Autentifikatsiya (login, logout)
- Buyurtmalar CRUD operatsiyalari
- KPI ma'lumotlari
- Moliya operatsiyalari
- Xabarnomalar

Barcha API so'rovlari avtomatik ravishda token bilan autentifikatsiya qilinadi.

## 🎨 UI/UX

- Modern va intuitiv interfeys
- Uzbek tilida interfeys
- Responsive dizayn
- Dark/Light mode qo'llab-quvvatlash
- Real-time yangilanishlar

## 📱 Platformalar

- ✅ Android
- ✅ iOS
- ✅ Web (limited support)

## 🧪 Development

### Linting

```bash
npm run lint
```

### TypeScript tekshiruvi

```bash
npx tsc --noEmit
```

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
export const API_BASE_URL = 'http://your-api-url:5000/api';
```

### Expo konfiguratsiyasi

`app.json` faylida ilova nomi, versiya va boshqa sozlamalarni o'zgartirishingiz mumkin.

## 📄 Litsenziya

Bu loyiha private loyiha hisoblanadi.

## 👨‍💻 Yaratuvchi

Botir123

## 📞 Aloqa

Savollar va takliflar uchun loyiha egasiga murojaat qiling.

---

**Eslatma:** Production'da ishlatishdan oldin API URL va boshqa konfiguratsiyalarni to'g'ri sozlang.
