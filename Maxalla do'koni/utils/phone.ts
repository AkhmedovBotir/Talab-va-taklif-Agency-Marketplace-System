/** Faqat raqamlar */
export function digitsOnly(text: string): string {
  return text.replace(/\D/g, '');
}

/** +998... yoki boshqa formatdan 9 xonali mahalliy qism */
export function parsePhoneToLocalDigits(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith('998')) {
    d = d.slice(3);
  }
  return d.slice(0, 9);
}

/** Mahalliy raqam: `90 123 45 67` */
export function formatUzPhoneLocal(digits: string): string {
  const limited = digitsOnly(digits).slice(0, 9);
  let formatted = '';
  if (limited.length > 0) {
    formatted = limited.slice(0, 2);
  }
  if (limited.length > 2) {
    formatted += ' ' + limited.slice(2, 5);
  }
  if (limited.length > 5) {
    formatted += ' ' + limited.slice(5, 7);
  }
  if (limited.length > 7) {
    formatted += ' ' + limited.slice(7, 9);
  }
  return formatted;
}

export function formatUzPhoneInput(text: string): string {
  return formatUzPhoneLocal(parsePhoneToLocalDigits(text));
}

/** API uchun: `+998901234567` */
export function toFullUzPhone(localFormatted: string): string {
  return '+998' + digitsOnly(localFormatted);
}

export function isValidUzPhoneLocal(localFormatted: string): boolean {
  return digitsOnly(localFormatted).length === 9;
}

/** Ro'yxatda ko'rsatish: `+998 90 123 45 67` */
export function formatUzPhoneDisplay(fullPhone: string): string {
  const local = parsePhoneToLocalDigits(fullPhone);
  if (!local) {
    return fullPhone;
  }
  return `+998 ${formatUzPhoneLocal(local)}`;
}
