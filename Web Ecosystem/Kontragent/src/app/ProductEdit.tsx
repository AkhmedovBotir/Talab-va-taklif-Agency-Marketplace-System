import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoAdd, IoClose, IoChevronDown, IoSearch } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberInput, unformatNumber } from '../utils/formatNumber';
import { QuillEditor, type QuillEditorRef } from '../components/QuillEditor';
import styles from './ProductCreate.module.css';

interface Category {
  _id: string;
  name: string;
}

function isValidBase64(img: string) {
  return /^data:image\/(jpeg|png|jpg);base64,/.test(img);
}

export function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<QuillEditorRef>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [initialDelta, setInitialDelta] = useState<{ ops?: Array<{ insert: string; attributes?: Record<string, unknown> }> } | null>(null);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'dona' | 'litr' | 'kg'>('dona');
  const [unitSize, setUnitSize] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [weight, setWeight] = useState('');
  const [kpiBonusPercent, setKpiBonusPercent] = useState('0');

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiService.getProductById(id);
      const p = (res as { data?: Record<string, unknown> }).data;
      if (p) {
        setName(String(p.name || ''));
        const desc = p.description as { ops?: Array<{ insert: string; attributes?: Record<string, unknown> }> } | null | undefined;
        setInitialDelta(desc && desc.ops?.length ? desc : null);
        setPrice(p.price != null ? String(p.price) : '');
        setOriginalPrice(p.originalPrice != null ? String(p.originalPrice) : '');
        setImages(Array.isArray(p.images) ? (p.images as string[]) : []);
        const cat = p.category;
        const catId =
          typeof cat === 'object' && cat && typeof (cat as { _id?: string })._id === 'string'
            ? (cat as { _id: string })._id
            : typeof cat === 'string'
              ? cat
              : '';
        setCategoryId(catId);
        const sub = p.subcategory;
        const subId =
          sub && typeof sub === 'object' && typeof (sub as { _id?: string })._id === 'string'
            ? (sub as { _id: string })._id
            : null;
        setSubcategoryId(subId);
        setQuantity(p.quantity != null ? String(p.quantity) : '');
        setUnit((p.unit as 'dona' | 'litr' | 'kg') || 'dona');
        setUnitSize(p.unitSize != null ? String(p.unitSize) : '');
        setLength(p.length != null ? String(p.length) : '');
        setWidth(p.width != null ? String(p.width) : '');
        setWeight(p.weight != null ? String(p.weight) : '');
        setKpiBonusPercent(p.kpiBonusPercent != null ? String(p.kpiBonusPercent) : '0');
      }
    } catch {
      setError('Yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiService.getCategories({ limit: 1000, status: 'active' });
      const list = (res as { data?: Category[] }).data || [];
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadSubcategories = useCallback(async (catId: string) => {
    if (!catId) {
      setSubcategories([]);
      return;
    }
    setLoadingSubs(true);
    try {
      const res = await apiService.getSubcategories({ parent: catId, limit: 1000, status: 'active' });
      const list = (res as { data?: Category[] }).data || [];
      setSubcategories(list);
    } catch {
      setSubcategories([]);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [loadProduct, loadCategories]);

  useEffect(() => {
    if (categoryId) loadSubcategories(categoryId);
    else setSubcategories([]);
  }, [categoryId, loadSubcategories]);

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const selectedSub = subcategories.find((s) => s._id === subcategoryId);

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredSubs = [
    { _id: 'none', name: "Yo'q" } as Category,
    ...subcategories.filter((s) =>
      s.name.toLowerCase().includes(subSearch.toLowerCase())
    ),
  ];

  const handlePickImage = () => {
    if (images.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (isValidBase64(data)) setImages((prev) => [...prev, data]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    if (!name.trim()) {
      setError('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    const p = parseFloat(unformatNumber(price)) || 0;
    const op = parseFloat(unformatNumber(originalPrice)) || 0;
    if (p <= 0) {
      setError('Narx kiritilishi shart');
      return;
    }
    const q = parseFloat(quantity);
    if (isNaN(q) || q < 0) {
      setError('Miqdor to\'g\'ri kiritilishi kerak');
      return;
    }

    setSubmitting(true);
    try {
      const delta = quillRef.current?.getContents();
      const hasDesc = delta?.ops?.some((op) => typeof op.insert === 'string' && op.insert.trim());
      await apiService.updateProduct(id, {
        name: name.trim(),
        description: hasDesc ? delta : undefined,
        price: p,
        originalPrice: op > 0 ? op : p,
        category: categoryId || undefined,
        subcategory: subcategoryId && subcategoryId !== 'none' ? subcategoryId : null,
        quantity: q,
        unit,
        unitSize: unitSize ? parseFloat(unitSize) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        weight: weight ? parseFloat(weight) : null,
        kpiBonusPercent: parseFloat(kpiBonusPercent) || 0,
        images: images.length > 0 ? images : undefined,
      });
      navigate('/ombor');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || 'Tahrirlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} color="#333" />
        </button>
        <h1 className={styles.headerTitle}>Maxsulotni tahrirlash</h1>
        <span className={styles.placeholder} />
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Asosiy ma'lumotlar</h3>
          <label className={styles.label}>Nomi *</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Maxsulot nomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className={styles.label}>Tavsif (ixtiyoriy)</label>
          <QuillEditor
            ref={quillRef}
            initialDelta={initialDelta ?? undefined}
            placeholder="Maxsulot tavsifini kiriting..."
            className={styles.quillWrap}
          />
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Kategoriya</h3>
          <label className={styles.label}>Kategoriya *</label>
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => setShowCatModal(true)}
          >
            <span className={selectedCategory ? '' : styles.placeholderText}>
              {selectedCategory ? selectedCategory.name : 'Kategoriyani tanlang'}
            </span>
            <IoChevronDown size={20} color="#666" />
          </button>
          {categoryId && (
            <>
              <label className={styles.label}>Sub kategoriya (ixtiyoriy)</label>
              <button
                type="button"
                className={styles.selectButton}
                onClick={() => setShowSubModal(true)}
                disabled={loadingSubs}
              >
                {loadingSubs ? (
                  <span className={styles.loadingText}>Yuklanmoqda...</span>
                ) : (
                  <>
                    <span className={selectedSub || subcategoryId === null ? '' : styles.placeholderText}>
                      {selectedSub ? selectedSub.name : subcategoryId === null ? "Yo'q" : 'Tanlang'}
                    </span>
                    <IoChevronDown size={20} color="#666" />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Narx ma'lumotlari</h3>
          <div className={styles.labelBlock}>
            <span className={styles.label}>Narx (so'm) *</span>
            <span className={styles.labelSubtitle}>(Sotmoqchi bo'lgan narxi)</span>
          </div>
          <input
            type="text"
            className={styles.input}
            value={formatNumberInput(price)}
            onChange={(e) => setPrice(unformatNumber(e.target.value))}
          />
          <div className={styles.labelBlock}>
            <span className={styles.label}>Asl narx (so'm) *</span>
            <span className={styles.labelSubtitle}>(Sotib olingan narxi)</span>
          </div>
          <input
            type="text"
            className={styles.input}
            value={formatNumberInput(originalPrice)}
            onChange={(e) => setOriginalPrice(unformatNumber(e.target.value))}
          />
          <label className={styles.label}>KPI Bonus foizi</label>
          <input
            type="text"
            className={styles.input}
            value={kpiBonusPercent}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 100)) setKpiBonusPercent(v);
            }}
          />
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Miqdor ma'lumotlari</h3>
          <label className={styles.label}>Miqdor *</label>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ''))}
          />
          <label className={styles.label}>Birlik *</label>
          <div className={styles.unitContainer}>
            {(['dona', 'litr', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                className={[styles.unitChip, unit === u && styles.unitChipActive].filter(Boolean).join(' ')}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
          <label className={styles.label}>Birlik o'lchami</label>
          <input
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={unitSize}
            onChange={(e) => setUnitSize(e.target.value)}
          />
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Fizik o'lchamlar</h3>
          <label className={styles.label}>Bo'yi</label>
          <input type="text" inputMode="decimal" className={styles.input} value={length} onChange={(e) => setLength(e.target.value)} />
          <label className={styles.label}>Eni</label>
          <input type="text" inputMode="decimal" className={styles.input} value={width} onChange={(e) => setWidth(e.target.value)} />
          <label className={styles.label}>Og'irligi</label>
          <input type="text" inputMode="decimal" className={styles.input} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Rasmlar</h3>
          <label className={styles.label}>Rasmlar (maksimal 5 ta)</label>
          <div className={styles.imagesContainer}>
            {images.map((img, i) => (
              <div key={i} className={styles.imageWrapper}>
                <img src={img} alt="" />
                <button type="button" className={styles.removeImgBtn} onClick={() => removeImage(i)}>
                  <IoClose size={24} color="#FF3B30" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button type="button" className={styles.addImageBtn} onClick={handlePickImage}>
                <IoAdd size={32} color="#007AFF" />
                <span>Rasm qo'shish</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>

      {showCatModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCatModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Kategoriyani tanlang</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowCatModal(false)}>
                <IoClose size={24} color="#333" />
              </button>
            </div>
            <div className={styles.modalSearch}>
              <IoSearch size={20} color="#999" />
              <input type="text" placeholder="Qidirish..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
            </div>
            <div className={styles.modalList}>
              {filteredCats.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className={[styles.modalItem, categoryId === c._id && styles.modalItemActive].filter(Boolean).join(' ')}
                  onClick={() => {
                    setCategoryId(c._id);
                    setShowCatModal(false);
                    setCatSearch('');
                  }}
                >
                  {c.name}
                  {categoryId === c._id && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSubModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Sub kategoriyani tanlang</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowSubModal(false)}>
                <IoClose size={24} color="#333" />
              </button>
            </div>
            <div className={styles.modalSearch}>
              <IoSearch size={20} color="#999" />
              <input type="text" placeholder="Qidirish..." value={subSearch} onChange={(e) => setSubSearch(e.target.value)} />
            </div>
            <div className={styles.modalList}>
              {filteredSubs.map((s) => {
                const isNone = s._id === 'none';
                const isSelected = isNone ? subcategoryId === null : subcategoryId === s._id;
                return (
                  <button
                    key={s._id}
                    type="button"
                    className={[styles.modalItem, isSelected && styles.modalItemActive].filter(Boolean).join(' ')}
                    onClick={() => {
                      setSubcategoryId(isNone ? null : s._id);
                      setShowSubModal(false);
                      setSubSearch('');
                    }}
                  >
                    {s.name}
                    {isSelected && <span className={styles.check}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
