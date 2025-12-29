require('dotenv').config();
const eskizService = require('../services/eskizService');

// Get phone number from command line argument or use default
const phone = process.argv[2] || process.env.TEST_PHONE || '998901234567';

console.log('='.repeat(60));
console.log('SMS Test Script');
console.log('='.repeat(60));
console.log(`Telefon raqam: ${phone}`);
console.log('='.repeat(60));
console.log('');

// Test all SMS types
const testSMS = async () => {
  const tests = [
    {
      name: 'Marketplace - Ro\'yxatdan o\'tish (Register)',
      func: () => eskizService.sendRegistrationCode(phone, '12345'),
    },
    {
      name: 'Marketplace - Kirish (Login)',
      func: () => eskizService.sendLoginCode(phone, '12345'),
    },
    {
      name: 'Marketplace - Parol tiklash (Forgot Password)',
      func: () => eskizService.sendForgotPasswordCode(phone, '12345'),
    },
    {
      name: 'Vakansiya - Ro\'yxatdan o\'tish (Register)',
      func: () => eskizService.sendVacancyRegistrationCode(phone, '12345'),
    },
    {
      name: 'Vakansiya - Kirish (Login)',
      func: () => eskizService.sendVacancyLoginCode(phone, '12345'),
    },
    {
      name: 'Vakansiya - Parol tiklash (Forgot Password)',
      func: () => eskizService.sendVacancyForgotPasswordCode(phone, '12345'),
    },
    {
      name: 'Kontragent - Parol o\'rnatish',
      func: () => eskizService.sendContragentPasswordSetupCode(phone, '12345'),
    },
    {
      name: 'Punkt - Parol o\'rnatish',
      func: () => eskizService.sendPunktPasswordSetupCode(phone, '12345'),
    },
    {
      name: 'Agent - Parol o\'rnatish',
      func: () => eskizService.sendAgentPasswordSetupCode(phone, '12345'),
    },
    {
      name: 'Qurilma tasdiqlash (Device Verification)',
      func: () => eskizService.sendDeviceVerificationCode(phone, '12345'),
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[${i + 1}/${tests.length}] ${test.name}`);
    console.log('-'.repeat(60));

    try {
      const result = await test.func();
      
      if (result.success) {
        console.log('✅ Muvaffaqiyatli yuborildi!');
        console.log(`   Status: ${result.status}`);
        console.log(`   Message ID: ${result.messageId || 'N/A'}`);
        successCount++;
      } else {
        console.log('❌ Yuborishda xatolik');
        console.log(`   Status: ${result.status || 'N/A'}`);
        failCount++;
      }
    } catch (error) {
      console.log('❌ Xatolik yuz berdi:');
      console.log(`   ${error.message}`);
      failCount++;
    }

    // Wait 2 seconds between SMS to avoid rate limiting
    if (i < tests.length - 1) {
      console.log('\n⏳ Keyingi SMS yuborilmoqda... (2 soniya)');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST NATIJALARI');
  console.log('='.repeat(60));
  console.log(`✅ Muvaffaqiyatli: ${successCount}`);
  console.log(`❌ Xatolik: ${failCount}`);
  console.log(`📊 Jami: ${tests.length}`);
  console.log('='.repeat(60));
};

// Run tests
testSMS()
  .then(() => {
    console.log('\n✅ Barcha testlar yakunlandi!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Xatolik:', error);
    process.exit(1);
  });

