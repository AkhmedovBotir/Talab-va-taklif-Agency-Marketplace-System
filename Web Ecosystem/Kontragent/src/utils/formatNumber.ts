export function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num.replace(/\s/g, '')) : num;
  if (isNaN(number)) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatNumberDisplay(num: number | string): string {
  return formatNumber(num);
}

export function formatNumberInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '';
  const decimalPart = parts[1] || '';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function unformatNumber(value: string): string {
  return value.replace(/\s/g, '');
}

export function formatPrice(price: number | string): string {
  const formatted = formatNumber(price);
  return formatted ? `${formatted} so'm` : '';
}
