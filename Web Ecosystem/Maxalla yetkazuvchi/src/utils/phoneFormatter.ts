/**
 * Telefon raqamdan +998 ni olib tashlaydi va faqat raqamlarni qaytaradi
 */
export function removeCountryCode(phone: string): string {
  return phone.replace(/^\+998/, '').replace(/\D/g, '');
}

/**
 * Telefon raqamni 90 123 45 67 formatiga formatlaydi (kirish uchun)
 */
export function formatPhoneNumber(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  const withoutCountry = numbers.replace(/^998/, '');
  if (withoutCountry.length === 0) return '';
  if (withoutCountry.length <= 2) return withoutCountry;
  if (withoutCountry.length <= 5) {
    return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2)}`;
  }
  if (withoutCountry.length <= 7) {
    return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5)}`;
  }
  return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5, 7)} ${withoutCountry.slice(7, 9)}`;
}

/**
 * Formatlangan telefon raqamni to'liq +998901234567 formatiga qaytaradi
 */
export function formatPhoneForApi(phone: string): string {
  const numbers = phone.replace(/\D/g, '').replace(/^998/, '');
  return `+998${numbers}`;
}

/**
 * Telefon raqamni ko'rsatish uchun formatlaydi (+998 90 123 45 67)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '').replace(/^998/, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `+998 ${numbers}`;
  if (numbers.length <= 5) {
    return `+998 ${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  }
  if (numbers.length <= 7) {
    return `+998 ${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5)}`;
  }
  return `+998 ${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7, 9)}`;
}
