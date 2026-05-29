/**
 * Formats a number with 3-digit grouping using space separator
 * Example: 1000000 -> "1 000 000"
 */
export function formatNumber(num: number | string): string {
  // Convert to number if string
  const number = typeof num === 'string' ? parseFloat(num.replace(/\s/g, '')) : num;
  
  if (isNaN(number)) {
    return '';
  }

  // Format with space as thousands separator
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formats a number for display in text (with space separator)
 * Example: 1000000 -> "1 000 000"
 */
export function formatNumberDisplay(num: number | string): string {
  return formatNumber(num);
}

/**
 * Formats a number for input field (with space separator)
 * Removes all non-digit characters, then formats with spaces
 */
export function formatNumberInput(value: string): string {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Split by decimal point if exists
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '';
  const decimalPart = parts[1] || '';

  // Format integer part with spaces
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Combine with decimal part if exists
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Removes formatting from a formatted number string
 * Example: "1 000 000" -> "1000000"
 */
export function unformatNumber(value: string): string {
  return value.replace(/\s/g, '');
}

/**
 * Formats price with "so'm" suffix
 */
export function formatPrice(price: number | string): string {
  const formatted = formatNumber(price);
  return formatted ? `${formatted} so'm` : '';
}

