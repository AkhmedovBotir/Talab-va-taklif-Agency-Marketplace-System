/** 9 raqam (operator + raqam) -> "90 123 45 67" */
export function formatUzPhoneLocal(digits) {
  const d = String(digits).replace(/\D/g, '').slice(0, 9);
  const parts = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(' ');
}

/** Inputdan faqat mahalliy 9 raqam */
export function parsePhoneInput(value) {
  let d = String(value).replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  return d.slice(0, 9);
}

/** API uchun: +998901234567 */
export function toE164Uzbek(localValue) {
  const nine = parsePhoneInput(localValue);
  if (!nine) return '';
  return `+998${nine}`;
}

export function isValidUzLocalPhone(localValue) {
  return parsePhoneInput(localValue).length === 9;
}
