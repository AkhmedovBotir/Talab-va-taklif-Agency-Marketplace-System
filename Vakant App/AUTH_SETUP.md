# Authentication Setup

Bu loyiha Vacancy Applicant autentifikatsiya tizimini o'z ichiga oladi.

## O'rnatish

Avval quyidagi paketlarni o'rnating:

```bash
npm install @react-native-async-storage/async-storage
```

Yoki:

```bash
npx expo install @react-native-async-storage/async-storage
```

## Sozlash

### 1. API Base URL

`constants/config.ts` faylida API URL ni sozlang:

```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

Yoki `.env` fayl yaratib:

```
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

## Struktura

### Ekranlar

- **Ro'yxatdan o'tish:**
  - `/auth/register` - Telefon raqamni tekshirish
  - `/auth/register/send-code` - Kod yuborish va tasdiqlash
  - `/auth/register/form` - Ma'lumotlarni to'ldirish

- **Kirish:**
  - `/auth/login` - Telefon va parol
  - `/auth/login/confirm` - Kod tasdiqlash

- **Parolni tiklash:**
  - `/auth/forgot-password` - Telefon raqam
  - `/auth/forgot-password/confirm` - Kod va yangi parol

### Komponentlar

- `Input` - Input field komponenti
- `Button` - Button komponenti
- `CodeInput` - 5 xonali kod kiritish
- `RegionPicker` - Viloyat/Tuman/MFY tanlash

### Context

- `AuthContext` - Autentifikatsiya holati va funksiyalar

### Services

- `apiService` - API so'rovlari uchun service

## Ishlatish

Autentifikatsiya holati `useAuth` hook orqali olinadi:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // ...
}
```

## Protected Routes

`(tabs)` ichidagi ekranlar avtomatik ravishda himoyalangan. Autentifikatsiya qilinmagan foydalanuvchilar `/auth/register` sahifasiga yo'naltiriladi.




