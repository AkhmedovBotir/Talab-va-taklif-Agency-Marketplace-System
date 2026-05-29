import { Platform } from 'react-native';

/** Server va UI uchun maksimal tomondagi o'lcham (px). */
export const AVATAR_MAX_EDGE_PX = 512;
export const AVATAR_JPEG_QUALITY = 0.82;
export const AVATAR_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Tailwind: kvadrat ramka, breakpoint bo'yicha o'lcham. */
export const PROFILE_AVATAR_FRAME_CLASS =
  'relative aspect-square shrink-0 overflow-hidden rounded-[28px] bg-orange-500 text-white shadow-lg shadow-orange-200/50 sm:rounded-[32px]';
export const PROFILE_AVATAR_SIZE_CLASS = 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28';

const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function hasCanvas(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasm ochilmadi"));
    img.src = src;
  });
}

async function resizeHtmlImage(img: HTMLImageElement): Promise<string> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error('Rasm o‘lchami aniqlanmadi');

  const scale = Math.min(1, AVATAR_MAX_EDGE_PX / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Rasm qayta ishlanmadi');

  ctx.drawImage(img, 0, 0, tw, th);
  const dataUrl = canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY);
  if (!dataUrl.startsWith('data:image/')) throw new Error('Rasm qayta ishlanmadi');
  return dataUrl;
}

export function validateAvatarFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  if (type && !ACCEPTED_MIME.has(type) && !type.startsWith('image/')) {
    return 'Faqat rasm faylini tanlang (JPEG, PNG, WebP).';
  }
  if (file.size > AVATAR_MAX_FILE_BYTES) {
    const mb = Math.round(AVATAR_MAX_FILE_BYTES / (1024 * 1024));
    return `Rasm hajmi ${mb} MB dan oshmasin.`;
  }
  return null;
}

export async function prepareAvatarFromFile(file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  if (!hasCanvas()) {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(objectUrl);
    return await resizeHtmlImage(img);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareAvatarFromDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl) throw new Error('Rasm tanlanmadi');
  if (!hasCanvas()) return dataUrl;
  const img = await loadHtmlImage(dataUrl);
  return resizeHtmlImage(img);
}

async function resizeUriWithFetchAndCanvas(uri: string): Promise<string> {
  if (!hasCanvas()) throw new Error('Rasm qayta ishlanmadi');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Rasm yuklanmadi');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadHtmlImage(objectUrl);
    return resizeHtmlImage(img);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareAvatarWithManipulator(uri: string): Promise<string> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: AVATAR_MAX_EDGE_PX } }],
      {
        compress: AVATAR_JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    if (!result.base64) throw new Error('Rasm qayta ishlanmadi');
    return `data:image/jpeg;base64,${result.base64}`;
  } catch {
    return resizeUriWithFetchAndCanvas(uri);
  }
}

export async function prepareAvatarFromPickerBase64(base64: string, mime = 'image/jpeg'): Promise<string> {
  if (!base64) throw new Error('Rasm tanlanmadi');
  const dataUrl = `data:${mime};base64,${base64}`;
  if (hasCanvas()) return prepareAvatarFromDataUrl(dataUrl);
  return dataUrl;
}

export async function prepareAvatarFromUri(uri: string): Promise<string> {
  if (!uri) throw new Error('Rasm tanlanmadi');

  if (uri.startsWith('data:image/')) {
    return prepareAvatarFromDataUrl(uri);
  }

  if (Platform.OS === 'web') {
    return resizeUriWithFetchAndCanvas(uri);
  }

  return prepareAvatarWithManipulator(uri);
}

export function normalizeAvatar(avatar: string): string {
  if (!avatar) return '';
  if (avatar.startsWith('data:image/')) return avatar;
  if (avatar.startsWith('file:') || avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  return `data:image/png;base64,${avatar}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === 'string' ? result : '');
    };
    reader.onerror = () => reject(new Error('Rasm o‘qilmadi'));
    reader.readAsDataURL(file);
  });
}

/** Brauzer / Expo web: yashirin file input orqali tanlash. */
export function pickAvatarFileOnWeb(onFile: (file: File) => void): void {
  if (typeof document === 'undefined') return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onFile(file);
  };
  input.click();
}
