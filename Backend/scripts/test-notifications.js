/**
 * Notification Test Script
 * 
 * Bu script barcha notification turlarini va target typelarni test qiladi.
 * 
 * Ishlatish:
 * 1. Server ishlab turgan bo'lishi kerak
 * 2. Admin token olish kerak
 * 3. node scripts/test-notifications.js
 */

const BASE_URL = 'http://localhost:5000';

// Admin token - bu yerga haqiqiy tokenni qo'ying
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDI1OWFhZGYyMDdlOTkxZWVmYTFmMCIsInVzZXJuYW1lIjoiZ2VuZXJhbCIsInJvbGUiOiJnZW5lcmFsIiwiaWF0IjoxNzY1OTU2MDUwLCJleHAiOjE3NjY1NjA4NTB9.5tZwllqFOc0CG6E8im4lCpW2QhoVy76gFazeV_OuA4s';

// Notification types
const notificationTypes = ['info', 'warning', 'success', 'error', 'announcement', 'promotion', 'update'];

// Target types
const targetTypes = ['all', 'punkts', 'viloyat_agents', 'tuman_agents', 'mfy_agents', 'marketplace_users', 'contragents', 'vacancy_applicants'];

// Test messages
const testMessages = {
  info: {
    title: 'Ma\'lumot',
    message: 'Bu oddiy ma\'lumot xabari. Tizim haqida umumiy ma\'lumot.',
  },
  warning: {
    title: 'Ogohlantirish!',
    message: 'Diqqat! Tizimda texnik ishlar olib boriladi. Iltimos, ma\'lumotlaringizni saqlang.',
  },
  success: {
    title: 'Muvaffaqiyat!',
    message: 'Amaliyot muvaffaqiyatli yakunlandi. Barcha o\'zgarishlar saqlandi.',
  },
  error: {
    title: 'Xatolik!',
    message: 'Tizimda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.',
  },
  announcement: {
    title: 'Muhim e\'lon!',
    message: 'Hurmatli foydalanuvchilar! Yangi qoidalar joriy etildi. Iltimos, tanishib chiqing.',
  },
  promotion: {
    title: 'Maxsus aksiya!',
    message: 'Faqat bugun! Barcha mahsulotlarga 30% chegirma. Imkoniyatni boy bermang!',
  },
  update: {
    title: 'Yangilanish',
    message: 'Tizim yangilandi. Yangi funksiyalar qo\'shildi va xatolar tuzatildi.',
  },
};

// Target descriptions
const targetDescriptions = {
  all: 'Barcha foydalanuvchilar',
  punkts: 'Punktlar',
  viloyat_agents: 'Viloyat agentlari',
  tuman_agents: 'Tuman agentlari',
  mfy_agents: 'MFY agentlari',
  marketplace_users: 'Marketplace foydalanuvchilari',
  contragents: 'Kontragentlar',
  vacancy_applicants: 'Vakansiya nomzodlari',
};

async function sendNotification(type, targetType) {
  const message = testMessages[type];
  
  const body = {
    title: `[${type.toUpperCase()}] ${message.title}`,
    message: `${message.message} (Target: ${targetDescriptions[targetType]})`,
    type: type,
    targetType: targetType,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [${type}] -> [${targetType}] - Yuborildi`);
      return true;
    } else {
      console.log(`❌ [${type}] -> [${targetType}] - Xatolik: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ [${type}] -> [${targetType}] - Error: ${error.message}`);
    return false;
  }
}

async function testAllCombinations() {
  console.log('='.repeat(60));
  console.log('NOTIFICATION TEST SCRIPT');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Notification types: ${notificationTypes.length}`);
  console.log(`Target types: ${targetTypes.length}`);
  console.log(`Total combinations: ${notificationTypes.length * targetTypes.length}`);
  console.log('='.repeat(60));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const targetType of targetTypes) {
    console.log(`\n📤 Target: ${targetDescriptions[targetType]}`);
    console.log('-'.repeat(40));
    
    for (const type of notificationTypes) {
      const success = await sendNotification(type, targetType);
      if (success) successCount++;
      else failCount++;
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('NATIJALAR');
  console.log('='.repeat(60));
  console.log(`✅ Muvaffaqiyatli: ${successCount}`);
  console.log(`❌ Xatolik: ${failCount}`);
  console.log(`📊 Jami: ${successCount + failCount}`);
  console.log('='.repeat(60));
}

async function testSingleNotification() {
  console.log('Single notification test...\n');
  
  const body = {
    title: 'Test xabar',
    message: 'Bu test xabari. Socket.io orqali real-time yuborilishi kerak.',
    type: 'info',
    targetType: 'all',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
const args = process.argv.slice(2);

if (args.includes('--single')) {
  testSingleNotification();
} else if (args.includes('--all')) {
  testAllCombinations();
} else {
  console.log('Usage:');
  console.log('  node scripts/test-notifications.js --single  # Single test notification');
  console.log('  node scripts/test-notifications.js --all     # Test all combinations');
  console.log('');
  console.log('Eslatma: ADMIN_TOKEN ni script ichida o\'zgartiring!');
}

