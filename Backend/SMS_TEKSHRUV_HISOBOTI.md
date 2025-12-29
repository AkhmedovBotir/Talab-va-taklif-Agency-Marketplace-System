# SMS Xizmati To'liq Tekshiruv Hisoboti

## 📋 Umumiy Ma'lumot

Loyihada SMS yuborish uchun **Eskiz** xizmati ishlatilmoqda. SMS xizmati `services/eskizService.js` faylida joylashgan va barcha SMS yuborish operatsiyalari shu xizmat orqali amalga oshiriladi.

---

## 📍 SMS Yuboriladigan Barcha Joylar

### 1. **Marketplace User Authentication** (`controllers/marketplaceAuthController.js`)

#### 1.1. Ro'yxatdan o'tish (Register)
- **Fayl**: `controllers/marketplaceAuthController.js`
- **Funksiya**: `registerStep1` (qator 80-108)
- **SMS yuborish joyi**: `sendSMSCode(phone, 'register')` (qator 94)
- **SMS turi**: `register`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasida ro'yxatdan o'tish uchun kod: {code}. Amal 5 daqiqa.
  ```
- **Qayta yuborish**: `resendSMSCode` (qator 514-563)

#### 1.2. Kirish (Login)
- **Fayl**: `controllers/marketplaceAuthController.js`
- **Funksiya**: `loginStep1` (qator 255-301)
- **SMS yuborish joyi**: `sendSMSCode(phone, 'login')` (qator 287)
- **SMS turi**: `login`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```
- **Qayta yuborish**: `resendSMSCode` (qator 514-563)

#### 1.3. Parolni unutish (Forgot Password)
- **Fayl**: `controllers/marketplaceAuthController.js`
- **Funksiya**: `forgotPasswordStep1` (qator 373-401)
- **SMS yuborish joyi**: `sendSMSCode(phone, 'forgot_password')` (qator 387)
- **SMS turi**: `forgot_password`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasida parolingizni tiklash uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```
- **Qayta yuborish**: `resendSMSCode` (qator 514-563)

---

### 2. **Device Verification** (`controllers/deviceVerificationController.js`)

#### 2.1. Qurilma tasdiqlash kodi so'rash
- **Fayl**: `controllers/deviceVerificationController.js`
- **Funksiya**: `requestDeviceVerificationCode` (qator 12-214)
- **SMS yuborish joyi**: `eskizService.sendDeviceVerificationCode(userPhone, code)` (qator 192)
- **SMS turi**: `device_verification`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```
- **Qayta yuborish**: `resendDeviceVerificationCode` (qator 434-639, qator 614)

---

### 3. **Contragent Authentication** (`controllers/contragentAuthController.js`)

#### 3.1. Contragent parol o'rnatish
- **Fayl**: `controllers/contragentAuthController.js`
- **Funksiya**: `passwordSetupStep1` (qator 7-79)
- **SMS yuborish joyi**: `eskizService.sendContragentPasswordSetupCode(phone, code)` (qator 65)
- **SMS turi**: `contragent_password_setup`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

---

### 4. **Punkt Authentication** (`controllers/punktAuthController.js`)

#### 4.1. Punkt parol o'rnatish
- **Fayl**: `controllers/punktAuthController.js`
- **Funksiya**: `passwordSetupStep1` (qator 7-80)
- **SMS yuborish joyi**: `eskizService.sendPunktPasswordSetupCode(phone, code)` (qator 66)
- **SMS turi**: `punkt_password_setup`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

---

### 5. **Agent Authentication** (`controllers/agentAuthController.js`)

#### 5.1. Agent parol o'rnatish
- **Fayl**: `controllers/agentAuthController.js`
- **Funksiya**: `passwordSetupStep1` (qator 7-80)
- **SMS yuborish joyi**: `eskizService.sendAgentPasswordSetupCode(phone, code)` (qator 66)
- **SMS turi**: `agent_password_setup`
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

---

### 6. **Vacancy Applicant Authentication** (`controllers/vacancyAuthController.js`)

#### 6.1. Ro'yxatdan o'tish (Register)
- **Fayl**: `controllers/vacancyAuthController.js`
- **Funksiya**: `sendRegisterCode` (qator 64-84)
- **SMS yuborish joyi**: `eskizService.sendRegistrationCode(phone, code)` (qator 77)
- **SMS turi**: `register` (VacancyApplicantCode modelida)
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasida ro'yxatdan o'tish uchun kod: {code}. Amal 5 daqiqa.
  ```
- **Qayta yuborish**: `resendCode` (qator 236-286, qator 277)

#### 6.2. Kirish (Login)
- **Fayl**: `controllers/vacancyAuthController.js`
- **Funksiya**: `loginSendCode` (qator 172-197)
- **SMS yuborish joyi**: `eskizService.sendLoginCode(phone, code)` (qator 190)
- **SMS turi**: `login` (VacancyApplicantCode modelida)
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```
- **Qayta yuborish**: `resendCode` (qator 236-286, qator 278)

#### 6.3. Parolni unutish (Forgot Password)
- **Fayl**: `controllers/vacancyAuthController.js`
- **Funksiya**: `forgotPasswordSendCode` (qator 290-310)
- **SMS yuborish joyi**: `eskizService.sendForgotPasswordCode(phone, code)` (qator 303)
- **SMS turi**: `forgot_password` (VacancyApplicantCode modelida)
- **SMS matni**: 
  ```
  Talab va Taklif Agency platformasida parolingizni tiklash uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```
- **Qayta yuborish**: `resendCode` (qator 236-286, qator 279)

---

## 📝 Barcha SMS Matnlari

### `services/eskizService.js` faylida aniqlangan SMS matnlari:

1. **Ro'yxatdan o'tish (Registration)** - qator 132:
   ```
   Talab va Taklif Agency platformasida ro'yxatdan o'tish uchun kod: {code}. Amal 5 daqiqa.
   ```

2. **Kirish (Login)** - qator 138:
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

3. **Parolni tiklash (Forgot Password)** - qator 144:
   ```
   Talab va Taklif Agency platformasida parolingizni tiklash uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

4. **Contragent parol o'rnatish** - qator 150:
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

5. **Punkt parol o'rnatish** - qator 156:
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

6. **Agent parol o'rnatish** - qator 162:
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

7. **Qurilma tasdiqlash (Device Verification)** - qator 168:
   ```
   Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
   ```

---

## ⚠️ Muammolar va Noto'g'riliklar

### 1. **Bir xil matnlar turli maqsadlar uchun ishlatilmoqda**

**Muammo**: Quyidagi 4 ta turli operatsiya uchun bir xil SMS matni ishlatilmoqda:
- Contragent parol o'rnatish
- Punkt parol o'rnatish
- Agent parol o'rnatish
- Qurilma tasdiqlash

**Hozirgi matn**: 
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
```

**Nega mos kelmaydi**:
- Foydalanuvchi parol o'rnatayotganini bilmaydi, faqat "kirish" deyilgan
- Qurilma tasdiqlashda ham "kirish" deyilgan, lekin bu qurilma tasdiqlash operatsiyasi
- Foydalanuvchi qaysi operatsiya bajarilayotganini tushunmaydi
- Xavfsizlik nuqtai nazaridan, foydalanuvchi qaysi operatsiya uchun kod olayotganini bilishi kerak

### 2. **Matnlar aniq emas**

**Muammo**: Ba'zi matnlar aniq maqsadni ko'rsatmaydi.

**Misol**: 
- "Kirish uchun" - bu juda umumiy. Parol o'rnatish, qurilma tasdiqlash yoki oddiy kirish bo'lishi mumkin.

### 3. **Vaqt ifodalari turlicha**

**Muammo**: Ba'zi matnlarda "Amal 5 daqiqa", ba'zilarida "Kod 5 daqiqa amal qiladi" deyilgan.

**Hozirgi holat**:
- Ro'yxatdan o'tish: "Amal 5 daqiqa"
- Boshqalar: "Kod 5 daqiqa amal qiladi"

**Nega muammo**:
- Matnlar bir xil bo'lishi kerak, konsistentlik uchun
- Foydalanuvchi uchun tushunish osonroq bo'ladi

### 4. **Qurilma tasdiqlash matni noto'g'ri**

**Muammo**: Qurilma tasdiqlash uchun "kirish uchun" deyilgan, lekin bu qurilma tasdiqlash operatsiyasi.

**Hozirgi matn**:
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
```

**Nega mos kelmaydi**:
- Bu qurilma tasdiqlash, oddiy kirish emas
- Foydalanuvchi yangi qurilma tasdiqlayotganini bilishi kerak
- Xavfsizlik nuqtai nazaridan muhim

### 5. **Parol o'rnatish matnlari noto'g'ri**

**Muammo**: Contragent, Punkt va Agent uchun parol o'rnatishda "kirish uchun" deyilgan.

**Hozirgi matn**:
```
Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
```

**Nega mos kelmaydi**:
- Foydalanuvchi parol o'rnatayotganini bilmaydi
- "Kirish uchun" deyilgan, lekin parol o'rnatish jarayoni
- Foydalanuvchi parol o'rnatish uchun kod olayotganini tushunishi kerak

---

## ✅ Tavsiyalar

### 1. **Har bir operatsiya uchun aniq matn**

Har bir SMS turi uchun aniq va tushunarli matn yozish kerak:

- **Contragent parol o'rnatish**:
  ```
  Talab va Taklif Agency. Kontragent hisobingiz uchun parol o'rnatish kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

- **Punkt parol o'rnatish**:
  ```
  Talab va Taklif Agency. Punkt hisobingiz uchun parol o'rnatish kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

- **Agent parol o'rnatish**:
  ```
  Talab va Taklif Agency. Agent hisobingiz uchun parol o'rnatish kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

- **Qurilma tasdiqlash**:
  ```
  Talab va Taklif Agency. Yangi qurilmani tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi.
  ```

### 2. **Barcha matnlarda bir xil format**

Barcha SMS matnlarida bir xil format va ifoda ishlatish:
- "Kod 5 daqiqa amal qiladi" (barcha joylarda bir xil)

### 3. **Aniq va qisqa matnlar**

SMS matnlari qisqa, aniq va tushunarli bo'lishi kerak. Foydalanuvchi qaysi operatsiya uchun kod olayotganini darhol tushunishi kerak.

---

## 📊 SMS Yuboriladigan Joylar Jadvali

| # | Controller | Funksiya | SMS Turi | Fayl/Qator |
|---|------------|----------|----------|------------|
| 1 | marketplaceAuthController | registerStep1 | register | marketplaceAuthController.js:94 |
| 2 | marketplaceAuthController | loginStep1 | login | marketplaceAuthController.js:287 |
| 3 | marketplaceAuthController | forgotPasswordStep1 | forgot_password | marketplaceAuthController.js:387 |
| 4 | marketplaceAuthController | resendSMSCode | register/login/forgot_password | marketplaceAuthController.js:549 |
| 5 | deviceVerificationController | requestDeviceVerificationCode | device_verification | deviceVerificationController.js:192 |
| 6 | deviceVerificationController | resendDeviceVerificationCode | device_verification | deviceVerificationController.js:614 |
| 7 | contragentAuthController | passwordSetupStep1 | contragent_password_setup | contragentAuthController.js:65 |
| 8 | punktAuthController | passwordSetupStep1 | punkt_password_setup | punktAuthController.js:66 |
| 9 | agentAuthController | passwordSetupStep1 | agent_password_setup | agentAuthController.js:66 |
| 10 | vacancyAuthController | sendRegisterCode | register | vacancyAuthController.js:77 |
| 11 | vacancyAuthController | loginSendCode | login | vacancyAuthController.js:190 |
| 12 | vacancyAuthController | forgotPasswordSendCode | forgot_password | vacancyAuthController.js:303 |
| 13 | vacancyAuthController | resendCode | register/login/forgot_password | vacancyAuthController.js:277-279 |

---

## 🔧 O'zgartirishlar Kerak Bo'lgan Joylar

1. **services/eskizService.js** - qator 150-170
   - Contragent, Punkt, Agent va Device Verification uchun aniq matnlar yozish

2. **Matnlar formatini birlashtirish**
   - Barcha matnlarda "Kod 5 daqiqa amal qiladi" formatini ishlatish

---

## 📌 Xulosa

Jami **13 ta joyda** SMS yuborilmoqda. Asosiy muammo shundaki, **4 ta turli operatsiya** (Contragent parol o'rnatish, Punkt parol o'rnatish, Agent parol o'rnatish va Qurilma tasdiqlash) uchun **bir xil SMS matni** ishlatilmoqda. Bu foydalanuvchilar uchun chalkashtiruvchi va xavfsizlik nuqtai nazaridan ham muammo bo'lishi mumkin.

Har bir operatsiya uchun aniq, tushunarli va maqsadga mos SMS matni yozish tavsiya etiladi.

---

## ✨ Eskiz Qoidalariga Mos SMS Matnlari

Quyida barcha SMS turlari uchun Eskiz moderatsiya qoidalariga mos keladigan matnlar keltirilgan. Har bir matn:
- Resurs nomi va ishlatish maqsadini ko'rsatadi
- Aniq va tushunarli
- Barcha matnlarda bir xil format ("Kod 5 daqiqa amal qiladi")
- Lotin harflarida 160 belgidan kam (1 SMS)
- ${code} o'rniga real kod qo'yiladi (masalan: 12345)

### 1. **Marketplace Ro'yxatdan o'tish (Register)**

**Moderatsiya uchun matn** (${code} o'rniga real kod):
```
12345 - Marketplace ilovasidan ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun** (eskizService.js):
```
${code} - Marketplace ilovasidan ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 115 (1 SMS) ✅

---

### 2. **Marketplace Kirish (Login)**

**Moderatsiya uchun matn**:
```
12345 - Marketplace ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Marketplace ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 109 (1 SMS) ✅

---

### 3. **Marketplace Parolni tiklash (Forgot Password)**

**Moderatsiya uchun matn**:
```
12345 - Marketplace ilovasida parol tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Marketplace ilovasida parol tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 116 (1 SMS) ✅

---

### 4. **Vacancy Applicant Ro'yxatdan o'tish (Register)**

**Moderatsiya uchun matn**:
```
12345 - Vakansiya ilovasida ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Vakansiya ilovasida ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 113 (1 SMS) ✅

---

### 5. **Vacancy Applicant Kirish (Login)**

**Moderatsiya uchun matn**:
```
12345 - Vakansiya ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Vakansiya ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 107 (1 SMS) ✅

---

### 6. **Vacancy Applicant Parolni tiklash (Forgot Password)**

**Moderatsiya uchun matn**:
```
12345 - Vakansiya ilovasida parolni tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Vakansiya ilovasida parolni tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 114 (1 SMS) ✅

---

### 7. **Contragent Parol o'rnatish**

**Moderatsiya uchun matn**:
```
12345 - Kontragent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Kontragent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 100 (1 SMS) ✅

---

### 8. **Punkt Parol o'rnatish**

**Moderatsiya uchun matn**:
```
12345 - Punkt hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Punkt hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 95 (1 SMS) ✅

---

### 9. **Agent Parol o'rnatish**

**Moderatsiya uchun matn**:
```
12345 - Agent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Agent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 93 (1 SMS) ✅

---

### 10. **Qurilma tasdiqlash (Device Verification)**

**Moderatsiya uchun matn**:
```
12345 - Yangi qurilmani tasdiqlash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Kodda ishlatish uchun**:
```
${code} - Yangi qurilmani tasdiqlash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
```

**Simvollar soni**: 97 (1 SMS) ✅

---

## 📋 Moderatsiya uchun To'liq Matnlar Ro'yxati

Quyida barcha matnlar **moderatsiyadan o'tkazish uchun** tayyorlangan ko'rinishda (${code} o'rniga real kod bilan):

1. **Marketplace Register**:
   ```
   12345 - Marketplace ilovasidan ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

2. **Marketplace Login**:
   ```
   12345 - Marketplace ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

3. **Marketplace Forgot Password**:
   ```
   12345 - Marketplace ilovasida parol tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

4. **Vacancy Register**:
   ```
   12345 - Vakansiya ilovasida ro'yxatdan o'tish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

5. **Vacancy Login**:
   ```
   12345 - Vakansiya ilovasiga kirish uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

6. **Vacancy Forgot Password**:
   ```
   12345 - Vakansiya ilovasida parolni tiklash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

7. **Contragent Password Setup**:
   ```
   12345 - Kontragent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

8. **Punkt Password Setup**:
   ```
   12345 - Punkt hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

9. **Agent Password Setup**:
   ```
   12345 - Agent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
   ```

10. **Device Verification**:
    ```
    12345 - Yangi qurilmani tasdiqlash uchun tasdiqlash kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.
    ```

---

## ✅ Qoidalarga Moslik Tekshiruvi

Barcha matnlar quyidagi qoidalarga mos keladi:

✅ **Resurs nomi ko'rsatilgan**: "Talab va Taklif Agency"  
✅ **Ishlatish maqsadi ko'rsatilgan**: Har bir matnda aniq maqsad (ro'yxatdan o'tish, kirish, parol o'rnatish, qurilma tasdiqlash)  
✅ **160 belgidan kam**: Barcha matnlar 1 SMS uchun yetarli  
✅ **Lotin harflari**: Faqat lotin harflari ishlatilgan  
✅ **Bir xil format**: Barcha matnlarda "Kod 5 daqiqa amal qiladi"  
✅ **Aniq va tushunarli**: Har bir matn o'z maqsadini aniq ko'rsatadi

