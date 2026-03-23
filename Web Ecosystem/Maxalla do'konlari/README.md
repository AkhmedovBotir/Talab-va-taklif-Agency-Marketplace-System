# Maxalla Do'konlari – Web

Mobil ilova (Expo / React Native) bilan bir xil dizayn va API ga ega veb-ilova. Vite + React + TypeScript + React Router. CSS Modules (.module.css) ishlatiladi.

## Tuzilma

- `src/app/` – sahifalar (Login, Home, Delivery, Products, Orders, Profile) va har biri uchun `*.module.css`
- `src/components/` – Layout, RegionPicker va ularning `*.module.css`
- `src/contexts/` – AuthContext
- `src/services/` – api.ts (Maxalla kontragent API)
- `src/utils/` – deviceId.ts (brauzer qurilma ma’lumoti)

## Ishga tushirish

```bash
cd web
npm install
npm run dev
```

Brauzerda: http://localhost:3000

## Build

```bash
npm run build
```

Natija: `dist/` papkada statik fayllar.

## Konfiguratsiya (config)

Barcha sozlamalar `src/config.ts` da; `.env` orqali o'zgartirish mumkin:

| O'zgaruvchi | Tavsif | Default |
|-------------|--------|---------|
| `VITE_APP_NAME` | Brauzer tab sarlavhasi | Maxalla Do'konlari |
| `VITE_APP_SHORT_NAME` | Login sahifasidagi nom | Maxalla dokoni |
| `VITE_API_URL` | Backend API manzili | http://192.168.1.5:5000 |

`web/.env` yarating va keraklilarini yozing (`.env.example` dan nusxa olish mumkin).
