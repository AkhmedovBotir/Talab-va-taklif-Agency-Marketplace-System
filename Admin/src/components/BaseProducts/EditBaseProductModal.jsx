import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { baseProductAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CategorySelect from '../Categories/CategorySelect';
import SubcategorySelect from '../Categories/SubcategorySelect';

const EditBaseProductModal = ({ open, onClose, onSuccess, baseProduct }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: [],
    category: '',
    subcategory: '',
    unit: 'dona',
    unitSize: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (baseProduct && open) {
      setFormData({
        name: baseProduct.name || '',
        description: baseProduct.description || '',
        images: baseProduct.images || [],
        category: baseProduct.category?._id || baseProduct.category || '',
        subcategory: baseProduct.subcategory?._id || baseProduct.subcategory || '',
        unit: baseProduct.unit || 'dona',
        unitSize: baseProduct.unitSize || '',
        status: baseProduct.status || 'active',
      });
      setError('');
    }
  }, [baseProduct, open]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'images' && files) {
      const imageFiles = Array.from(files).slice(0, 5);
      const readers = imageFiles.map((file) => {
        return new Promise((resolve) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          } else {
            resolve(null);
          }
        });
      });

      Promise.all(readers).then((results) => {
        const validImages = results.filter((img) => img !== null);
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...validImages].slice(0, 5) }));
      });
    } else if (name === 'category') {
      setFormData((prev) => ({ ...prev, category: value, subcategory: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleCategoriesLoad = (loadedCategories) => {
    setCategories(loadedCategories);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || formData.name.trim().length < 2) {
      setError('Nomi kamida 2 ta belgi bo\'lishi kerak');
      return;
    }

    if (!formData.category) {
      setError('Kategoriya tanlanishi shart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        status: formData.status,
      };

      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.subcategory) {
        payload.subcategory = formData.subcategory;
      } else {
        payload.subcategory = null;
      }

      if (formData.unitSize) {
        payload.unitSize = Number(formData.unitSize);
      } else {
        payload.unitSize = null;
      }

      if (formData.images.length > 0) {
        payload.images = formData.images;
      }

      const response = await baseProductAPI.updateBaseProduct(baseProduct._id, payload);

      if (response.success) {
        showSuccess(response.message || 'Shablon muvaffaqiyatli yangilandi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Shablon yangilashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!baseProduct) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Shablonni Tahrirlash</h2>
                    <p className="text-xs text-indigo-100 mt-0.5">
                      Asosiy maxsulot shablonini yangilang
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all disabled:opacity-50"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      minLength={2}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tavsif (ixtiyoriy)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                  </div>

                  {/* Category and Subcategory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CategorySelect
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      label="Kategoriya"
                      required
                      status="active"
                      onCategoriesLoad={handleCategoriesLoad}
                    />
                    <SubcategorySelect
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      label="Subkategoriya (ixtiyoriy)"
                      categoryId={formData.category}
                      categories={categories}
                      status="active"
                      disabled={!formData.category}
                    />
                  </div>

                  {/* Unit and UnitSize */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Birlik <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="dona">dona</option>
                        <option value="litr">litr</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Birlik o'lchami (ixtiyoriy)
                      </label>
                      <input
                        type="number"
                        name="unitSize"
                        value={formData.unitSize}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="active">Faol</option>
                      <option value="inactive">Nofaol</option>
                    </select>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rasmlar (maksimal 5 ta, ixtiyoriy)
                    </label>
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG formatlari qabul qilinadi</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-md hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      {loading ? 'Yangilanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditBaseProductModal;
