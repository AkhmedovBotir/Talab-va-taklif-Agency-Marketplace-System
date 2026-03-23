# TTSA Marketplace – Web

Mobil ilova (React Native / Expo) bilan bir xil dizayn va API ga ega veb-ilova. Vite + React + TypeScript + React Router.

## Tuzilma

- `src/app/` – sahifalar (Home, Search, Shops, Cart, Profile, Login, Register, Product, Checkout, Order, Notifications)
- `src/components/` – UI komponentlar (Header, Snackbar)
- `src/contexts/` – Auth, Cart, Location, Notification, Snackbar contextlari
- `src/services/` – API xizmati (api.ts), storage va events adapterlari

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

Backend: `https://api.ttsa.uz` (xuddi mobil ilovadagi kabi).
