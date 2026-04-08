/** Quill-delta JSON qatori — API `description` maydoni */
export const plainTextToDescription = (text) => {
  const t = String(text || '').replace(/\r\n/g, '\n');
  return JSON.stringify({ ops: [{ insert: t || ' ' }] });
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

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(fr.error || new Error('Fayl o‘qilmadi'));
    fr.readAsDataURL(file);
});

export const buildProductPayload = (form, imageDataUrls) => ({
  contragent_id: Number(form.contragent_id),
  name: String(form.name || '').trim(),
  description: plainTextToDescription(form.description_text),
  price: Number(form.price),
  original_price: Number(form.original_price),
  images: imageDataUrls,
  category_id: Number(form.category_id),
  subcategory_id: Number(form.subcategory_id),
  quantity: Number(form.quantity),
  unit: form.unit,
  unit_size: String(form.unit_size || '').trim(),
  status: form.status,
  kpi_bonus_percent: Number(form.kpi_bonus_percent),
});
