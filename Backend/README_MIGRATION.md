# Cart Index Migration

## Muammo

Eski Cart modelida `user` maydoni unique edi, bu esa bir foydalanuvchi uchun faqat bitta korzinka bo'lishini talab qilardi. Endi biz `user + cartType` kombinatsiyasini unique qilishimiz kerak (tuman va maxalla korzinkalari alohida).

## Yechim

Migration script yaratildi: `scripts/migrate-cart-indexes.js`

Bu script:
1. Eski `user_1` indexni o'chiradi
2. Yangi `user_1_cartType_1` indexni yaratadi
3. `cartType` maydoni bo'lmagan eski korzinkalarni `cartType: 'tuman'` ga migratsiya qiladi

## Migrationni Ishga Tushirish

```bash
node scripts/migrate-cart-indexes.js
```

Yoki MongoDB shell'da:

```javascript
// MongoDB'ga ulanish
use ttsa

// Eski indexni o'chirish
db.carts.dropIndex("user_1")

// Yangi indexni yaratish
db.carts.createIndex({ user: 1, cartType: 1 }, { unique: true })
```

## Tekshirish

Migrationdan keyin quyidagi indexlar bo'lishi kerak:
- `_id_` (default)
- `user_1_cartType_1` (unique)

Eski `user_1` index bo'lmasligi kerak.

## Eslatma

Migrationni faqat bir marta ishga tushirish kerak. Keyin server ishlaydi va yangi indexlar avtomatik yaratiladi.
