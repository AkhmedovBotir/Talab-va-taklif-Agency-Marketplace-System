import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Save, Image as ImageIcon } from '@mui/icons-material';
import { categoryManagementAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const EditCategoryModal = ({ open, onClose, onSuccess, category, isSubcategory = false, allCategories = [] }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    censored: false,
    status: 'active',
    parent: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || '',
        image: category.image || '',
        censored: category.censored || false,
        status: category.status || 'active',
        parent: isSubcategory && category.parent ? (typeof category.parent === 'object' ? category.parent._id : category.parent) : null,
      });
      setError('');
    }
  }, [category, open, isSubcategory]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        showError('Faqat rasm fayllari qabul qilinadi');
      }
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Nomi kamida 2 ta belgi bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      let payload;
      let response;
      
      if (isSubcategory) {
        // Subcategory uchun image va censored qabul qilinmaydi
        payload = {
          name: formData.name.trim(),
          status: formData.status,
        };
        
        if (formData.parent) {
          payload.parent = formData.parent;
        }
        
        response = await categoryManagementAPI.updateSubcategory(category._id, payload);
      } else {
        // Category uchun barcha fieldlar
        payload = {
          name: formData.name.trim(),
          status: formData.status,
          censored: formData.censored,
        };
        
        if (formData.image) {
          payload.image = formData.image;
        }
        
        response = await categoryManagementAPI.updateCategory(category._id, payload);
      }

      if (response.success) {
        showSuccess(response.message || `${isSubcategory ? 'Subkategoriya' : 'Kategoriya'} muvaffaqiyatli yangilandi`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || `${isSubcategory ? 'Subkategoriya' : 'Kategoriya'} yangilashda xatolik yuz berdi`;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!category) return null;

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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      {isSubcategory ? 'Subkategoriyani Tahrirlash' : 'Kategoriyani Tahrirlash'}
                    </h2>
                    <p className="text-xs text-indigo-100 mt-0.5">
                      {isSubcategory ? 'Subkategoriya ma\'lumotlarini yangilang' : 'Kategoriya ma\'lumotlarini yangilang'}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      minLength={2}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Masalan: Elektronika"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    />
                  </div>

                  {/* Image - faqat category uchun */}
                  {!isSubcategory && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Rasm (ixtiyoriy)
                      </label>
                      {formData.image && (
                        <div className="mb-2 flex justify-center">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="max-w-48 max-h-48 object-contain border border-gray-300 rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="relative">
                        <input
                          type="file"
                          name="image"
                          accept="image/*"
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                        />
                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                            className="mt-1 text-xs text-red-600 hover:text-red-800"
                          >
                            Rasmini olib tashlash
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG formatlari qabul qilinadi</p>
                    </div>
                  )}

                  {/* Parent Category (for subcategory) */}
                  {isSubcategory && allCategories.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Asosiy Kategoriya <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="parent"
                        value={formData.parent || ''}
                        onChange={handleChange}
                        required={isSubcategory}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="">Tanlang...</option>
                        {allCategories
                          .filter((cat) => cat.status === 'active')
                          .map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Status and Censored */}
                  <div className={`grid ${isSubcategory ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      >
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                      </select>
                    </div>
                    {/* Censored - faqat category uchun */}
                    {!isSubcategory && (
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors w-full">
                          <input
                            type="checkbox"
                            name="censored"
                            checked={formData.censored}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-gray-700">Censored</span>
                        </label>
                      </div>
                    )}
                    {/* Subcategory uchun censored haqida ma'lumot */}
                    {isSubcategory && category.parent && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Eslatma:</span> Censored statusi asosiy kategoriyadan avtomatik meros qilib olinadi ({typeof category.parent === 'object' ? (category.parent.censored ? 'Censored' : 'Not Censored') : 'Not Censored'})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saqlanmoqda...' : 'Saqlash'}
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

export default EditCategoryModal;

