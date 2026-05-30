import { useEffect, useRef, useState } from 'react';
import { AddPhotoAlternate, Close, SwapHoriz } from '@mui/icons-material';
import {
  ALLOWED_IMAGE_MIMES,
  MAX_PRODUCT_IMAGES,
  validateProductImageFile,
} from './productFormUtils';

const makeKey = () => `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ProductImageUploader = ({
  label = 'Rasmlar',
  hint = '1–5 ta rasm (JPEG, PNG, WebP, GIF; har biri ≤ 4 MB)',
  slots = [],
  onChange,
  max = MAX_PRODUCT_IMAGES,
  disabled = false,
  required = false,
}) => {
  const inputRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const blobUrlsRef = useRef(new Set());
  const [uploadError, setUploadError] = useState('');

  const active = slots.filter((s) => !s.pendingDelete);
  const count = active.length;
  const canAdd = !disabled && count < max;

  useEffect(
    () => () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    },
    []
  );

  const trackBlob = (url) => {
    if (String(url).startsWith('blob:')) blobUrlsRef.current.add(url);
  };

  const addFiles = (files, replaceAt = null) => {
    const chosen = files.filter((f) => ALLOWED_IMAGE_MIMES.includes(f.type)).slice(0, replaceAt != null ? 1 : max - count);
    if (!chosen.length) {
      setUploadError('Faqat JPEG, PNG, WebP yoki GIF tanlang');
      return;
    }

    for (let i = 0; i < chosen.length; i += 1) {
      const err = validateProductImageFile(chosen[i], replaceAt != null ? replaceAt : count + i);
      if (err) {
        setUploadError(err);
        return;
      }
    }

    setUploadError('');

    if (replaceAt != null) {
      const next = [...slots];
      const prev = next[replaceAt];
      if (prev?.url?.startsWith('blob:')) URL.revokeObjectURL(prev.url);
      const file = chosen[0];
      const url = URL.createObjectURL(file);
      trackBlob(url);
      next[replaceAt] = {
        ...prev,
        file,
        url,
        pendingDelete: false,
      };
      onChange?.(next);
      return;
    }

    const added = chosen.map((file) => {
      const url = URL.createObjectURL(file);
      trackBlob(url);
      return { key: makeKey(), url, file };
    });
    onChange?.([...slots, ...added]);
  };

  const handlePick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !canAdd) return;
    addFiles(files);
  };

  const handleReplacePick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const idx = replaceIndexRef.current;
    if (!files.length || idx == null) return;
    addFiles(files, idx);
    replaceIndexRef.current = null;
  };

  const removeAt = (idx) => {
    const slot = slots[idx];
    if (slot?.url?.startsWith('blob:') && !slot?.id) URL.revokeObjectURL(slot.url);
    if (slot?.id) {
      const next = [...slots];
      next[idx] = { ...slot, pendingDelete: true };
      onChange?.(next);
      return;
    }
    onChange?.(slots.filter((_, i) => i !== idx));
  };

  const startReplace = (idx) => {
    replaceIndexRef.current = idx;
    replaceRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required ? ' *' : ''}
          </label>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            count < 1 && required ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {count} / {max}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {slots.map((slot, idx) => {
          if (slot.pendingDelete) return null;
          return (
            <div
              key={slot.key || `slot-${idx}`}
              className="group relative aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-sm"
            >
              <img src={slot.url} alt={`Rasm ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                <span className="text-[10px] font-medium text-white">#{idx + 1}</span>
                {slot.file && (
                  <span className="ml-1 text-[9px] text-amber-200">yangi</span>
                )}
              </div>
              {!disabled && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => startReplace(idx)}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white shadow-md opacity-90 hover:opacity-100"
                    title="Almashtirish"
                  >
                    <SwapHoriz sx={{ fontSize: 14 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white shadow-md opacity-90 hover:opacity-100"
                    title="Olib tashlash"
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 transition-colors text-gray-500 hover:text-indigo-600"
          >
            <AddPhotoAlternate sx={{ fontSize: 32 }} />
            <span className="text-xs font-medium px-2 text-center">Rasm qo&apos;shish</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIMES.join(',')}
        multiple
        className="hidden"
        disabled={disabled || !canAdd}
        onChange={handlePick}
      />
      <input
        ref={replaceRef}
        type="file"
        accept={ALLOWED_IMAGE_MIMES.join(',')}
        className="hidden"
        disabled={disabled}
        onChange={handleReplacePick}
      />

      {canAdd && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
        >
          <AddPhotoAlternate fontSize="small" />
          {count === 0 ? 'Rasm tanlash' : 'Yana rasm qo‘shish'}
        </button>
      )}

      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  );
};

export default ProductImageUploader;
