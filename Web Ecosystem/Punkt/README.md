# Punkt Dasturi – Web

Mobil ilova (Expo) bilan bir xil dizayn va API ga ega veb-ilova. Vite + React + TypeScript + React Router. CSS Modules (.module.css) ishlatiladi.

## Tuzilma

- `src/app/` – sahifalar (Login, Orders, OrdersHistory, PunktRequests, Finance, Notifications, Profile, OrderDetail, KPI)
- `src/components/` – Layout, Button, OrderCard, KpiBalanceCard, LoadingSpinner
- `src/contexts/` – AuthContext
- `src/services/` – api.ts (Punkt API)
- `src/config/` – api.ts (BASE_URL)
- `src/types/` – api.ts (TypeScript interfeyslar)

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

Backend: `src/config/api.ts` dagi `API_BASE_URL` (default: `http://192.168.1.5:5000/api`). O‘zgartirish uchun `.env` da `VITE_API_URL` o‘rnating.
