// Console utility functions

/**
 * Base64 image string'larini qisqartirish
 */
export const shortenBase64Image = (str: string, maxLength: number = 100): string => {
  if (typeof str !== 'string') return str;
  
  // Base64 image pattern (data:image/...;base64,...)
  const base64ImagePattern = /(data:image\/[^;]+;base64,)([A-Za-z0-9+/=]+)/g;
  
  return str.replace(base64ImagePattern, (match, prefix, base64Data) => {
    const dataLength = base64Data.length;
    if (dataLength <= maxLength) return match;
    
    const truncated = base64Data.substring(0, maxLength);
    return `${prefix}${truncated}... [${dataLength} characters truncated]`;
  });
};

/**
 * Object'ni JSON.stringify qilganda base64 image'larni qisqartirish
 */
export const stringifyWithShortImages = (obj: any, space?: number): string => {
  try {
    const jsonString = JSON.stringify(obj, null, space);
    return shortenBase64Image(jsonString);
  } catch (error) {
    // Agar JSON.stringify xatolik bersa, oddiy string qaytaradi
    return String(obj);
  }
};

/**
 * Console.log uchun object'ni formatlash (base64 image'larni qisqartirish bilan)
 */
export const logObject = (label: string, obj: any) => {
  if (typeof obj === 'string') {
    console.log(label, shortenBase64Image(obj));
  } else {
    const shortened = stringifyWithShortImages(obj, 2);
    try {
      console.log(label, JSON.parse(shortened));
    } catch {
      // Agar parse qilish mumkin bo'lmasa, string sifatida ko'rsatadi
      console.log(label, shortened);
    }
  }
};
