import { useRef, useState } from 'react';
import { AddPhotoAlternate, Close } from '@mui/icons-material';
import { readFileAsDataUrl, getImageBase64PayloadSize, MAX_IMAGE_BASE64_BYTES } from './productFormUtils';

const ImageUploaderGrid = ({
  label = 'Rasmlar',
  hint = 'Kamida 1 ta, ko‘pi bilan 5 ta rasm (har biri base64 ≤ 4 MB)',
  images = [],
  onChange,
  max = 5,
  disabled = false,
  required = false,
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const count = images.length;
  const canAdd = !disabled && count < max;

  const handlePick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !canAdd) return;

    const remain = max - count;
    const chosen = files.filter((f) => f.type.startsWith('image/')).slice(0, remain);
    if (!chosen.length) {
      setUploadError('Faqat rasm fayllarini tanlang');
      return;
    }

    setUploadError('');
    setUploading(true);

    const baseImages = images;
    const previewUrls = chosen.map((file) => URL.createObjectURL(file));
    onChange?.([...baseImages, ...previewUrls]);

    try {
      const converted = [];
      for (let i = 0; i < chosen.length; i += 1) {
        const dataUrl = await readFileAsDataUrl(chosen[i]);
        if (getImageBase64PayloadSize(dataUrl) > MAX_IMAGE_BASE64_BYTES) {
          throw new Error(`Rasm #${baseImages.length + i + 1} 4 MB dan katta — boshqa rasm tanlang`);
        }
        converted.push(dataUrl);
      }
      onChange?.([...baseImages, ...converted]);
    } catch (err) {
      onChange?.(baseImages);
      setUploadError(err?.message || 'Rasmni o‘qib bo‘lmadi');
    } finally {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setUploading(false);
    }
  };

  const removeAt = (idx) => {
    onChange?.(images.filter((_, i) => i !== idx));
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
        {images.map((src, idx) => (
          <div
            key={`img-${idx}-${String(src).slice(0, 24)}`}
            className="group relative aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-sm"
          >
            <img src={src} alt={`Rasm ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
              <span className="text-[10px] font-medium text-white">#{idx + 1}</span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1.5 right-1.5 flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white shadow-md opacity-90 hover:opacity-100 transition-opacity"
                title="Olib tashlash"
              >
                <Close sx={{ fontSize: 16 }} />
              </button>
            )}
          </div>
        ))}

        {uploading &&
          Array.from({ length: Math.min(2, max - count) }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="aspect-square rounded-lg border border-dashed border-indigo-300 bg-indigo-50 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-xs text-indigo-600 font-medium">Yuklanmoqda...</span>
            </div>
          ))}

        {canAdd && !uploading && (
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
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || !canAdd || uploading}
        onChange={handlePick}
      />

      {canAdd && (
        <button
          type="button"
          disabled={uploading}
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

export default ImageUploaderGrid;
