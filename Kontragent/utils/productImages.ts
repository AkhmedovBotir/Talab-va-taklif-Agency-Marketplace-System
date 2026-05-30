import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { getLegacyApiBaseUrl } from '../services/apiConfig';

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export interface ProductImageUpload {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  /** Web: asl File obyekti */
  file?: File;
}

export interface ProductImageDraft {
  key: string;
  previewUri: string;
  upload?: ProductImageUpload;
  remote?: { id: number; url: string };
}

let draftKeySeq = 0;
export function nextImageDraftKey(): string {
  draftKeySeq += 1;
  return `img-${Date.now()}-${draftKeySeq}`;
}

export function resolveProductImageUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  const origin = getLegacyApiBaseUrl().replace(/\/$/, '');
  return t.startsWith('/') ? `${origin}${t}` : `${origin}/${t}`;
}

export function validateImageUpload(upload: ProductImageUpload): string | null {
  const mime = upload.mimeType.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    return `"${upload.name}": faqat JPEG, PNG, WebP yoki GIF qabul qilinadi.`;
  }
  if (upload.size != null && upload.size > MAX_IMAGE_BYTES) {
    return `"${upload.name}": rasm hajmi 4 MB dan oshmasligi kerak.`;
  }
  return null;
}

export function appendImageToFormData(
  formData: FormData,
  fieldName: 'images' | 'image',
  upload: ProductImageUpload
): void {
  if (Platform.OS === 'web' && upload.file) {
    formData.append(fieldName, upload.file, upload.name);
    return;
  }
  formData.append(
    fieldName,
    {
      uri: upload.uri,
      name: upload.name,
      type: upload.mimeType,
    } as unknown as Blob
  );
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export function fileToProductImageUpload(file: File): ProductImageUpload {
  return {
    uri: URL.createObjectURL(file),
    name: file.name || `image-${Date.now()}.jpg`,
    mimeType: file.type || guessMimeFromName(file.name),
    size: file.size,
    file,
  };
}

export function assetToProductImageUpload(asset: ImagePicker.ImagePickerAsset): ProductImageUpload {
  const name = asset.fileName || `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || guessMimeFromName(name);
  return {
    uri: asset.uri,
    name,
    mimeType,
    size: asset.fileSize ?? undefined,
  };
}

export function uploadsToDrafts(uploads: ProductImageUpload[]): ProductImageDraft[] {
  return uploads.map((upload) => ({
    key: nextImageDraftKey(),
    previewUri: upload.uri,
    upload,
  }));
}

export function remoteImagesToDrafts(
  items: Array<{ id: number; url: string }>
): ProductImageDraft[] {
  return items.map((item) => ({
    key: `remote-${item.id}`,
    previewUri: resolveProductImageUrl(item.url),
    remote: { id: item.id, url: item.url },
  }));
}

export async function pickImagesFromLibrary(
  maxPick: number
): Promise<ProductImageUpload[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw { status: 0, message: 'Galereyadan rasm tanlash uchun ruxsat kerak.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: maxPick > 1,
    selectionLimit: maxPick,
    quality: 0.85,
    base64: false,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map(assetToProductImageUpload);
}

export function validateDraftsCount(
  drafts: ProductImageDraft[],
  opts: { min?: number; max?: number } = {}
): string | null {
  const min = opts.min ?? 1;
  const max = opts.max ?? MAX_PRODUCT_IMAGES;
  if (drafts.length < min) {
    return `Kamida ${min} ta rasm kerak (maksimal ${max} ta).`;
  }
  if (drafts.length > max) {
    return `Maksimal ${max} ta rasm qo‘shish mumkin.`;
  }
  for (const d of drafts) {
    if (d.upload) {
      const err = validateImageUpload(d.upload);
      if (err) return err;
    }
  }
  return null;
}
