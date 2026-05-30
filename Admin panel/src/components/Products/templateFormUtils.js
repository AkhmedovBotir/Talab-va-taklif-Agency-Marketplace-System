import {
  collectNewImageFiles,
  getActiveImageSlots,
  MAX_PRODUCT_IMAGES,
  MIN_PRODUCT_IMAGES,
  parseProductImageSlots,
  PRODUCT_UNITS,
  subcategoryBelongsToCategory,
  syncProductImageChanges,
  validateProductImageSlots,
} from './productFormUtils';

export { collectNewImageFiles, getActiveImageSlots, parseProductImageSlots as parseTemplateImageSlots };

export const buildTemplateJsonPayload = (form) => ({
  name: String(form.name || '').trim(),
  description: String(form.description ?? ''),
  category_id: Number(form.category_id),
  subcategory_id: Number(form.subcategory_id),
  unit: PRODUCT_UNITS.includes(form.unit) ? form.unit : 'dona',
  unit_size: String(form.unit_size || '').trim(),
  status: form.status === 'inactive' ? 'inactive' : 'active',
});

export const buildTemplateMultipartFields = (form) => buildTemplateJsonPayload(form);

export const validateTemplateForm = (form, imageSlots, { subcategories = [], requireAllFiles = false } = {}) => {
  if (!String(form.name || '').trim()) return "Nom bo'sh bo'lmasin";
  if (!form.category_id || !form.subcategory_id) return 'Kategoriya va subkategoriya tanlang';
  if (!subcategoryBelongsToCategory(form.subcategory_id, form.category_id, subcategories)) {
    return 'Subkategoriya tanlangan kategoriyaga tegishli emas';
  }
  if (!String(form.unit_size || '').trim()) return 'O‘lcham / tavsif majburiy';
  if (!PRODUCT_UNITS.includes(form.unit)) return 'Birlik noto‘g‘ri (dona, litr, kg)';
  if (!['active', 'inactive'].includes(form.status)) return 'Status noto‘g‘ri';

  const imgErr = validateProductImageSlots(imageSlots, { requireAllFiles });
  if (imgErr) return imgErr;

  try {
    JSON.parse(form.description || '{}');
  } catch {
    return 'Tavsif JSON yaroqsiz';
  }

  return '';
};

export const templateImagesChanged = (initialSlots, currentSlots) => {
  const initial = Array.isArray(initialSlots) ? initialSlots : [];
  const active = getActiveImageSlots(currentSlots);
  const initialActive = getActiveImageSlots(initial);

  if (active.length !== initialActive.length) return true;
  if (active.some((s) => s.file instanceof File)) return true;

  const initialIds = initialActive.filter((s) => s.id != null).map((s) => String(s.id)).sort();
  const activeIds = active.filter((s) => s.id != null).map((s) => String(s.id)).sort();
  if (initialIds.length !== activeIds.length) return true;
  return initialIds.some((id, i) => id !== activeIds[i]);
};

export const syncTemplateImageChanges = (templateId, initialSlots, currentSlots, api) =>
  syncProductImageChanges(templateId, initialSlots, currentSlots, api);

export const TEMPLATE_IMAGE_LIMITS = { min: MIN_PRODUCT_IMAGES, max: MAX_PRODUCT_IMAGES };
