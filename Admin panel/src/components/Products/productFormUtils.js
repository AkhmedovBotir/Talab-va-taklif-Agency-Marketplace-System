/** Quill-delta JSON qatori — API `description` maydoni */
export const DEFAULT_DESCRIPTION_JSON = JSON.stringify({ ops: [{ insert: '\n' }] });

export const PRODUCT_UNITS = ['dona', 'litr', 'kg'];
export const PRODUCT_MODERATION_STATUSES = ['pending', 'approved', 'rejected'];
export const MAX_PRODUCT_IMAGES = 5;
export const MIN_PRODUCT_IMAGES = 1;
/** Multipart: bitta fayl ≤ 4 MB */
export const MAX_IMAGE_FILE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/** JSON base64 (eski integratsiya) */
export const MAX_IMAGE_BASE64_BYTES = 4 * 1024 * 1024;

export const getImageBase64PayloadSize = (dataUrl) => {
  const s = String(dataUrl || '');
  const marker = ';base64,';
  const idx = s.indexOf(marker);
  if (idx === -1) return 0;
  return s.length - idx - marker.length;
};

export const normalizeProductImage = (img) => {
  const s = String(img || '').trim();
  if (!s) return '';
  if (s.startsWith('data:image/') && s.includes(';base64,')) return s;
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && !s.startsWith('http')) {
    return `data:image/jpeg;base64,${s.replace(/\s/g, '')}`;
  }
  return s;
};

export const normalizeProductImages = (images) =>
  (Array.isArray(images) ? images : []).map(normalizeProductImage).filter(Boolean);

export const validateProductImages = (images) => {
  const list = normalizeProductImages(images);
  if (list.length < MIN_PRODUCT_IMAGES || list.length > MAX_PRODUCT_IMAGES) {
    return `Rasmlar: kamida ${MIN_PRODUCT_IMAGES}, ko‘pi bilan ${MAX_PRODUCT_IMAGES} ta`;
  }
  for (let i = 0; i < list.length; i += 1) {
    const img = list[i];
    if (img.startsWith('data:image/')) {
      if (!img.includes(';base64,')) {
        return `#${i + 1} rasm formati noto‘g‘ri (data:image/...;base64,...)`;
      }
      const size = getImageBase64PayloadSize(img);
      if (size > MAX_IMAGE_BASE64_BYTES) {
        return `#${i + 1} rasm base64 qismi 4 MB dan oshmasligi kerak`;
      }
    }
  }
  return '';
};

export const subcategoryBelongsToCategory = (subcategoryId, categoryId, subcategories = []) => {
  if (!subcategoryId || !categoryId) return false;
  return subcategories.some((s) => {
    const sid = String(s.id ?? s._id ?? '');
    if (sid !== String(subcategoryId)) return false;
    const pid = s.parent_id ?? s.parent?.id ?? s.parent?._id ?? s.category_id;
    return pid != null && String(pid) === String(categoryId);
  });
};

export const getActiveImageSlots = (slots) => (Array.isArray(slots) ? slots : []).filter((s) => !s.pendingDelete);

export const parseProductImageSlots = (productData) => {
  const d = productData || {};
  if (Array.isArray(d.image_items) && d.image_items.length) {
    return [...d.image_items]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => ({
        key: `existing-${item.id}`,
        id: item.id,
        url: item.url || '',
      }));
  }
  return (Array.isArray(d.images) ? d.images : [])
    .filter(Boolean)
    .map((url, i) => ({
      key: `url-${i}-${String(url).slice(-16)}`,
      url: String(url),
    }));
};

export const validateProductImageFile = (file, index = 0) => {
  if (!(file instanceof File)) return `#${index + 1} rasm fayli noto‘g‘ri`;
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    return `#${index + 1} rasm formati qo‘llab-quvvatlanmaydi (JPEG, PNG, WebP, GIF)`;
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return `#${index + 1} rasm 4 MB dan oshmasligi kerak`;
  }
  return '';
};

export const validateProductImageSlots = (slots, { requireAllFiles = false } = {}) => {
  const active = getActiveImageSlots(slots);
  if (active.length < MIN_PRODUCT_IMAGES || active.length > MAX_PRODUCT_IMAGES) {
    return `Rasmlar: kamida ${MIN_PRODUCT_IMAGES}, ko‘pi bilan ${MAX_PRODUCT_IMAGES} ta`;
  }
  for (let i = 0; i < active.length; i += 1) {
    const slot = active[i];
    if (slot.file) {
      const err = validateProductImageFile(slot.file, i);
      if (err) return err;
    } else if (requireAllFiles || !slot.url) {
      return `#${i + 1} rasm tanlanmagan`;
    }
  }
  return '';
};

export const validateProductFormMultipart = (form, imageSlots, { subcategories = [], requireAllFiles = false } = {}) => {
  if (!form.contragent_id || !form.category_id || !form.subcategory_id) {
    return 'Kontragent, kategoriya va subkategoriyani tanlang';
  }
  if (!subcategoryBelongsToCategory(form.subcategory_id, form.category_id, subcategories)) {
    return 'Subkategoriya tanlangan kategoriyaga tegishli emas';
  }
  if (!String(form.name || '').trim()) return 'Nom bo‘sh bo‘lmasin';
  if (!String(form.unit_size || '').trim()) return 'O‘lcham / tavsif majburiy';
  if (!PRODUCT_UNITS.includes(form.unit)) return 'O‘lchov birligi noto‘g‘ri (dona, litr, kg)';

  const imgErr = validateProductImageSlots(imageSlots, { requireAllFiles });
  if (imgErr) return imgErr;

  const price = Number(form.price);
  const orig = Number(form.original_price);
  const qty = Number(form.quantity);
  const kpi = Number(form.kpi_bonus_percent);
  if (Number.isNaN(price) || price < 0) return 'Narx noto‘g‘ri';
  if (Number.isNaN(orig) || orig < 0) return 'Asl narx noto‘g‘ri';
  if (Number.isNaN(qty) || qty < 0) return 'Miqdor noto‘g‘ri';
  if (Number.isNaN(kpi) || kpi < 0 || kpi > 100) return 'KPI bonus 0–100 oralig‘ida bo‘lishi kerak';

  try {
    JSON.parse(normalizeDescriptionJson(form.description));
  } catch {
    return 'Tavsif JSON yaroqsiz';
  }

  return '';
};

export const buildMultipartFormFields = (form) => ({
  contragent_id: Number(form.contragent_id),
  name: String(form.name || '').trim(),
  description: normalizeDescriptionJson(form.description),
  descriptionNormalized: normalizeDescriptionJson(form.description),
  price: Number(form.price),
  original_price: Number(form.original_price),
  category_id: Number(form.category_id),
  subcategory_id: Number(form.subcategory_id),
  quantity: Number(form.quantity),
  unit: PRODUCT_UNITS.includes(form.unit) ? form.unit : 'dona',
  unit_size: String(form.unit_size || '').trim(),
  status: form.status === 'inactive' ? 'inactive' : 'active',
  kpi_bonus_percent: Number(form.kpi_bonus_percent),
});

export const collectNewImageFiles = (slots) =>
  getActiveImageSlots(slots)
    .filter((s) => s.file instanceof File)
    .map((s) => s.file);

export const syncProductImageChanges = async (productId, initialSlots, currentSlots, api) => {
  const initial = Array.isArray(initialSlots) ? initialSlots : [];
  const active = getActiveImageSlots(currentSlots);
  const activeIds = new Set(active.filter((s) => s.id != null).map((s) => String(s.id)));

  const toAdd = active.filter((s) => !s.id && s.file instanceof File);
  const toReplace = active.filter((s) => s.id != null && s.file instanceof File);
  const toDelete = initial.filter((s) => s.id != null && !activeIds.has(String(s.id)));

  if (toAdd.length) {
    await api.addImages(productId, toAdd.map((s) => s.file));
  }
  for (const slot of toReplace) {
    await api.replaceImage(productId, slot.id, slot.file);
  }
  for (const slot of toDelete) {
    await api.deleteImage(productId, slot.id);
  }
};

export const validateProductForm = (form, images, { subcategories = [] } = {}) => {
  if (!form.contragent_id || !form.category_id || !form.subcategory_id) {
    return 'Kontragent, kategoriya va subkategoriyani tanlang';
  }
  if (!subcategoryBelongsToCategory(form.subcategory_id, form.category_id, subcategories)) {
    return 'Subkategoriya tanlangan kategoriyaga tegishli emas';
  }
  if (!String(form.name || '').trim()) {
    return 'Nom bo‘sh bo‘lmasin';
  }
  if (!String(form.unit_size || '').trim()) {
    return 'O‘lcham / tavsif majburiy';
  }
  if (!PRODUCT_UNITS.includes(form.unit)) {
    return 'O‘lchov birligi noto‘g‘ri (dona, litr, kg)';
  }

  const imgErr = validateProductImages(images);
  if (imgErr) return imgErr;

  const price = Number(form.price);
  const orig = Number(form.original_price);
  const qty = Number(form.quantity);
  const kpi = Number(form.kpi_bonus_percent);
  if (Number.isNaN(price) || price < 0) return 'Narx noto‘g‘ri';
  if (Number.isNaN(orig) || orig < 0) return 'Asl narx noto‘g‘ri';
  if (Number.isNaN(qty) || qty < 0) return 'Miqdor noto‘g‘ri';
  if (Number.isNaN(kpi) || kpi < 0 || kpi > 100) return 'KPI bonus 0–100 oralig‘ida bo‘lishi kerak';

  try {
    JSON.parse(normalizeDescriptionJson(form.description));
  } catch {
    return 'Tavsif JSON yaroqsiz';
  }

  return '';
};

export const plainTextToDescription = (text) => {
  const t = String(text || '').replace(/\r\n/g, '\n');
  return JSON.stringify({ ops: [{ insert: t || ' ' }] });
};

export const parseDescriptionDelta = (raw) => {
  const input = String(raw ?? '');
  try {
    const parsed = JSON.parse(input || '{}');
    if (parsed && Array.isArray(parsed.ops)) return parsed;
  } catch {
    /* ignore */
  }
  if (input.trim()) return { ops: [{ insert: input }, { insert: '\n' }] };
  return { ops: [{ insert: '\n' }] };
};

export const normalizeDescriptionJson = (desc) => {
  const s = String(desc ?? '').trim();
  if (!s) return DEFAULT_DESCRIPTION_JSON;
  try {
    const o = JSON.parse(s);
    if (o?.ops && Array.isArray(o.ops)) return JSON.stringify(o);
  } catch {
    /* ignore */
  }
  return plainTextToDescription(s);
};

export const descriptionToPlainText = (desc) => {
  if (desc == null || desc === '') return '';
  try {
    const o = typeof desc === 'string' ? JSON.parse(desc) : desc;
    if (o?.ops && Array.isArray(o.ops)) {
      return o.ops.map((op) => (typeof op.insert === 'string' ? op.insert : '')).join('');
    }
  } catch {
    /* ignore */
  }
  return typeof desc === 'string' ? desc : '';
};

const readFileAsDataUrlRaw = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(fr.error || new Error('Fayl o‘qilmadi'));
    fr.readAsDataURL(file);
  });

const COMPRESS_SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);
const COMPRESS_SKIP_MAX_BYTES = 180 * 1024;

const encodeCanvas = (canvas, quality) => {
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return canvas.toDataURL('image/png');
  }
};

const compressWithCanvas = (source, width, height, quality) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas ishga tushmadi');
  ctx.drawImage(source, 0, 0, width, height);
  return encodeCanvas(canvas, quality);
};

const compressImageOnce = (file, { maxWidth, maxHeight, quality }) =>
  new Promise((resolve, reject) => {
    const finish = (dataUrl) => resolve(dataUrl);
    const fallback = () => readFileAsDataUrlRaw(file).then(finish).catch(reject);

    const processBitmap = (bitmap) => {
      try {
        const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
        const width = Math.max(1, Math.round(bitmap.width * ratio));
        const height = Math.max(1, Math.round(bitmap.height * ratio));
        finish(compressWithCanvas(bitmap, width, height, quality));
      } catch {
        fallback();
      } finally {
        bitmap.close?.();
      }
    };

    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file, {
        resizeWidth: maxWidth,
        resizeHeight: maxHeight,
        resizeQuality: 'high',
      })
        .then(processBitmap)
        .catch(fallback);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
        const width = Math.max(1, Math.round(img.naturalWidth * ratio));
        const height = Math.max(1, Math.round(img.naturalHeight * ratio));
        finish(compressWithCanvas(img, width, height, quality));
      } catch {
        fallback();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallback();
    };
    img.src = objectUrl;
  });

/** Katta rasmlarni siqib, API uchun yengil base64 qaytaradi (≤ 4 MB) */
export const compressImageFile = async (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = {}) => {
  if (!file?.type?.startsWith('image/')) {
    return readFileAsDataUrlRaw(file);
  }
  if (COMPRESS_SKIP_TYPES.has(file.type)) {
    return readFileAsDataUrlRaw(file);
  }
  if (file.size <= COMPRESS_SKIP_MAX_BYTES) {
    const raw = await readFileAsDataUrlRaw(file);
    if (getImageBase64PayloadSize(raw) <= MAX_IMAGE_BASE64_BYTES) return raw;
  }

  let q = quality;
  let w = maxWidth;
  let h = maxHeight;
  let result = await compressImageOnce(file, { maxWidth: w, maxHeight: h, quality: q });

  while (getImageBase64PayloadSize(result) > MAX_IMAGE_BASE64_BYTES && q > 0.35) {
    q = Math.max(0.35, q - 0.12);
    w = Math.max(640, Math.round(w * 0.85));
    h = Math.max(640, Math.round(h * 0.85));
    result = await compressImageOnce(file, { maxWidth: w, maxHeight: h, quality: q });
  }

  return result;
};

export const readFileAsDataUrl = (file) => compressImageFile(file);

export const buildProductJsonPayload = (form) => ({
  contragent_id: Number(form.contragent_id),
  name: String(form.name || '').trim(),
  description: normalizeDescriptionJson(form.description),
  price: Number(form.price),
  original_price: Number(form.original_price),
  category_id: Number(form.category_id),
  subcategory_id: Number(form.subcategory_id),
  quantity: Number(form.quantity),
  unit: PRODUCT_UNITS.includes(form.unit) ? form.unit : 'dona',
  unit_size: String(form.unit_size || '').trim(),
  status: form.status === 'inactive' ? 'inactive' : 'active',
  kpi_bonus_percent: Number(form.kpi_bonus_percent),
});

/** @deprecated JSON base64 integratsiya — shablonlar uchun */
export const buildProductPayload = (form, imageDataUrls) => ({
  ...buildProductJsonPayload(form),
  images: normalizeProductImages(imageDataUrls),
});
