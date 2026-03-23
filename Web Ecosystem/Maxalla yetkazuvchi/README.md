# Maxalla Yetkazuvchi – Web

Mobil ilova (Expo) bilan bir xil dizayn va API ga ega veb-ilova. Vite + React + TypeScript + React Router. Sahifalar va komponentlar `src/components/` da, CSS Modules (.module.css) ishlatiladi.

## Tuzilma

- `src/App.tsx` – routing, ProtectedRoute, UnauthorizedHandler
- `src/components/` – Layout, Login, Orders, OrderDetail, Profile, Settings (har biri .tsx + .module.css)
- `src/contexts/` – DeliveryProviderAuthContext
- `src/services/` – api.ts (delivery provider API va types)
- `src/utils/` – phoneFormatter.ts

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

## API

Backend URL: `src/services/api.ts` da (default: `http://192.168.1.5:5000`). O‘zgartirish uchun loyiha rootida `.env` yarating va `VITE_API_URL=http://...` o‘rnating.
