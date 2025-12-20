# TTSA.uz - Talab va Taklif Sotuv Agency

O'zbekiston bo'yicha zamonaviy marketplace platformasi uchun bir sahifalik web sayt.

## 📋 Loyiha Haqida

TTSA (Talab va Taklif Sotuv Agency) - bu kontragentlar, punktlar, agentlar va mijozlarni birlashtirgan to'liq funksional e-commerce ekosistemasi. Bu web sayt platforma haqida ma'lumot beradi va hamkorlik so'rovlarini qabul qiladi.

## 🚀 O'rnatish va Ishga Tushirish

### Talablar

- Node.js (v18 yoki yuqori)
- npm yoki yarn

### O'rnatish

1. **Dependencies ni o'rnatish:**
```bash
npm install
```

2. **Environment variables sozlash:**

`.env` fayl yarating va quyidagilarni qo'shing:
```env
VITE_API_BASE_URL=https://api.ttsa.uz/api
```

3. **Development server ishga tushirish:**
```bash
npm run dev
```

Sayt `http://localhost:5173` da ochiladi.

### Production Build

```bash
npm run build
```

Build fayllar `dist/` papkasida yaratiladi.

## 🛠 Texnologiyalar

- **React 19.2.0** - UI kutubxonasi
- **Vite 7.2.4** - Build tool va dev server
- **Tailwind CSS** - Utility-first CSS framework (CDN orqali)
- **Axios** - HTTP client (API so'rovlar uchun)

## 📁 Loyiha Strukturasi

```
ttsa.uz/
├── src/
│   ├── components/
│   │   ├── RegionSelector.jsx    # Region tanlash komponenti
│   │   ├── RegionSelector.css
│   │   ├── PartnershipForm.jsx   # Hamkorlik formasi
│   │   └── PartnershipForm.css
│   ├── services/
│   │   └── api.js                 # API xizmatlari
│   ├── App.jsx                    # Asosiy komponent
│   ├── App.css                    # Asosiy styling
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global CSS
├── public/                        # Static fayllar
├── package.json
└── vite.config.js
```

## 🎯 Asosiy Funksiyalar

### 1. Hero Section
- Platforma haqida asosiy ma'lumot
- CTA tugmalar (Hamkor bo'lish, Batafsil ma'lumot)

### 2. Biz Haqimizda
- TTSA platformasi haqida batafsil ma'lumot
- Statistika ko'rsatkichlari

### 3. Dasturlar
- Marketplace - mijozlar uchun
- Contragent - yetkazib beruvchilar uchun
- Punkt - logistika punktlari uchun
- Agent - yetkazib beruvchi agentlar uchun
- Vakant - vakansiya ilovasi

### 4. Hamkor bo'lish
- Hamkorlik so'rovi formasi
- Region selector (Viloyat, Tuman, MFY)
- Pagination bilan region tanlash
- Form validation

## 🔌 API Integratsiyasi

### Endpointlar

1. **GET /api/regions** - Regionlar ro'yxati
   - Query params: `page`, `limit`, `type`, `parentId`, `search`
   - Response: paginated regions list

2. **POST /api/marketplace/partnership-requests** - Hamkorlik so'rovi yuborish
   - Body: `companyName`, `inn`, `mfo`, `accountNumber`, `viloyat`, `tuman`, `mfy`, `activity`, `managerFirstName`, `managerLastName`, `managerPhone`

## 🎨 Dizayn Xususiyatlari

- ✅ Minimalistik va zamonaviy dizayn
- ✅ Tailwind CSS asosida qurilgan
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Smooth scroll animatsiyalar
- ✅ Interactive komponentlar
- ✅ Gradient va shadow effektlar
- ✅ Custom logo komponenti
- ✅ Mobile menu

## 📱 Responsive Design

Sayt barcha qurilmalarda ishlaydi:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 Development

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## 📝 Eslatmalar

- API base URL `.env` faylida sozlanadi
- Region selector pagination bilan ishlaydi
- Form validation client-side da amalga oshiriladi
- Barcha matnlar o'zbek tilida

## 📄 License

Bu loyiha private loyiha hisoblanadi.

## 👥 Mualliflar

TTSA Development Team

---

**Versiya:** 1.0.0  
**Oxirgi yangilanish:** 2024
