# Barcha statuslar (UZ)

Ushbu hujjatda loyihadagi amalda ishlatilayotgan status qiymatlari bir joyga jamlangan.

## 1) Umumiy faol/nofoal statuslar

Manba: `modules/admin/domain/admin.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `active` | Faol |
| `inactive` | Nofaol |

---

## 2) Marketplace buyurtma statuslari

Manba: `modules/marketplace/domain/order.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `pending` | Kutilmoqda (jarayonda) |
| `cancelled` | Bekor qilingan |
| `delivered` | Yetkazib berilgan |

---

## 3) Buyurtma manzil turi (`address.type`)

Manba: `modules/marketplace/domain/order.go`

| Qiymat | O'zbekcha ma'nosi |
|---|---|
| `default` | Asosiy saqlangan manzil |
| `delivery_area` | Foydalanuvchining tanlangan saqlangan manzili |
| `extra` | Matnli (qo'lda kiritilgan) manzil |

---

## 4) Buyurtmaning punkt bo'yicha holati (`punkt_acceptance_status`)

Manba: `modules/marketplace/domain/order.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `none` | Tuman aniqlanmagan, punkt oqimi yo'q |
| `no_punkt` | Shu tumanda faol punkt topilmagan |
| `inbox` | Punkt inboxida, qabul/rad kutilmoqda |
| `rejected` | Punkt rad etgan |
| `contragent_requests_created` | Kontragent qator so'rovlari yaratilgan |

---

## 5) Kontragent qator so'rovi statuslari

Manba: `modules/punkts/domain/punkt_contragent_line_request.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `pending` | So'rov yuborilgan, javob kutilmoqda |
| `accepted` | Kontragent qabul qilgan |
| `preparing` | Tayyorlanmoqda |
| `delivered` | Qator yetkazilgan |
| `rejected` | Kontragent rad etgan |

---

## 6) Punktlararo transfer statuslari

Manba: `modules/punkts/domain/punkt_order_transfer.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `sent` | Birinchi punktdan ikkinchi punktga yuborilgan |
| `accepted_by_target` | Ikkinchi punkt qabul qilgan |
| `returned_to_source` | Ikkinchi punkt birinchi punktga qaytargan |
| `received_by_source` | Birinchi punkt qaytgan transferni qabul qilgan (yakun) |

---

## 7) Mahsulot moderatsiya statuslari

Manba: `modules/contragents/domain/product.go`

| Status | O'zbekcha ma'nosi |
|---|---|
| `pending` | Moderatsiya kutilmoqda |
| `approved` | Tasdiqlangan |
| `rejected` | Rad etilgan |

---

## 8) Admin roli qiymatlari

Manba: `modules/admin/domain/admin.go`

| Qiymat | O'zbekcha ma'nosi |
|---|---|
| `general` | General admin (to'liq huquq) |
| `admin` | Oddiy admin |

---

## 9) SMS code purpose qiymatlari

Manba: `modules/marketplace/domain/verification_code.go`

| Qiymat | O'zbekcha ma'nosi |
|---|---|
| `login` | Login uchun kod |
| `register` | Ro'yxatdan o'tish uchun kod |
| `forgot_password` | Parolni tiklash uchun kod |

---

## 10) Admin order pipeline `current_stage` kodlari

Manba: `modules/admin/service/order_pipeline_service.go`

| Stage kodi | O'zbekcha ma'nosi |
|---|---|
| `marketplace_created` | Marketplace'da buyurtma yaratilgan |
| `punkt_inbox` | Punkt qabulini kutmoqda |
| `punkt_collected_pending` | Punkt yig'ish bosqichi kutilyapti |
| `punkt_ready_pending` | Punkt tayyorlash bosqichi kutilyapti |
| `agent_assign_pending` | Agentga topshirish kutilyapti |
| `agent_payment_pending` | Agentning punktga to'lov e'loni kutilyapti |
| `payment_confirm_pending` | Punkt to'lov tasdig'i kutilyapti |
| `post_payment_delivery_pending` | To'lovdan keyingi punkt yetkazishi kutilyapti |
| `remainder_handover_pending` | Kontragentlarga qolgan qism topshirilishi kutilyapti |
| `ready_for_agent_deliver` | Agent yakuniy yetkazishi uchun tayyor |
| `delivered` | Yetkazib berilgan |
| `cancelled` | Bekor qilingan |
