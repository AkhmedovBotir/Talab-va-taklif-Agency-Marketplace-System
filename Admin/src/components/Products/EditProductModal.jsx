import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Save } from '@mui/icons-material';
import { productModerationAPI, regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';
import CategorySelect from '../Categories/CategorySelect';
import SubcategorySelect from '../Categories/SubcategorySelect';

const EditProductModal = ({ open, onClose, onSuccess, product }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    quantity: '',
    unit: 'dona',
    unitSize: '',
    length: '',
    width: '',
    weight: '',
    status: 'active',
    moderationStatus: 'approved',
    category: '',
    subcategory: '',
    kpiBonusPercent: '',
    deliveryRegions: [],
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDeliveryRegion, setNewDeliveryRegion] = useState({ viloyat: '', tuman: '' });
  const [categoriesList, setCategoriesList] = useState([]);

  // Load product data
  useEffect(() => {
    const loadProductData = async () => {
      if (product && open) {
        // Normalize deliveryRegions - convert objects to IDs if needed and fetch names
        const normalizedDeliveryRegions = await Promise.all(
          (product.deliveryRegions || []).map(async (region) => {
            const viloyatId = typeof region.viloyat === 'object' ? region.viloyat._id || region.viloyat : region.viloyat;
            const tumanId = region.tuman 
              ? (typeof region.tuman === 'object' ? region.tuman._id || region.tuman : region.tuman)
              : null;
            
            // Try to get region names
            let viloyatName = viloyatId;
            let tumanName = tumanId;
            
            try {
              const viloyatResponse = await regionAPI.getRegionById(viloyatId);
              if (viloyatResponse.success && viloyatResponse.data) {
                viloyatName = viloyatResponse.data.name || viloyatId;
              }
              
              if (tumanId) {
                const tumanResponse = await regionAPI.getRegionById(tumanId);
                if (tumanResponse.success && tumanResponse.data) {
                  tumanName = tumanResponse.data.name || tumanId;
                }
              }
            } catch (err) {
              console.error('Error fetching region names:', err);
              // Use IDs as fallback
            }
            
            return {
              viloyat: viloyatId,
              viloyatName: viloyatName,
              tuman: tumanId,
              tumanName: tumanName,
            };
          })
        );

        setFormData({
          name: product.name || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          quantity: product.quantity || '',
          unit: product.unit || 'dona',
          unitSize: product.unitSize || '',
          length: product.length || '',
          width: product.width || '',
          weight: product.weight || '',
          status: product.status || 'active',
          moderationStatus: product.moderationStatus || 'approved',
          category: product.category?._id || product.category || '',
          subcategory: product.subcategory?._id || product.subcategory || '',
          kpiBonusPercent: product.kpiBonusPercent || '',
          deliveryRegions: normalizedDeliveryRegions,
          images: product.images || [],
        });
        setError('');
      }
    };
    
    loadProductData();
  }, [product, open]);


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
      // Category o'zgarganda subcategory reset qilish
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

  const handleAddDeliveryRegion = async () => {
    if (!newDeliveryRegion.viloyat) {
      showError('Viloyat tanlanishi shart');
      return;
    }
    
    try {
      // Fetch region names for display
      const viloyatResponse = await regionAPI.getRegionById(newDeliveryRegion.viloyat);
      let viloyatName = newDeliveryRegion.viloyat;
      if (viloyatResponse.success && viloyatResponse.data) {
        viloyatName = viloyatResponse.data.name || newDeliveryRegion.viloyat;
      }
      
      let tumanName = null;
      if (newDeliveryRegion.tuman) {
        const tumanResponse = await regionAPI.getRegionById(newDeliveryRegion.tuman);
        if (tumanResponse.success && tumanResponse.data) {
          tumanName = tumanResponse.data.name || newDeliveryRegion.tuman;
        } else {
          tumanName = newDeliveryRegion.tuman;
        }
      }
      
      const region = {
        viloyat: newDeliveryRegion.viloyat, // ID for API
        viloyatName: viloyatName, // Name for display
        tuman: newDeliveryRegion.tuman || null, // ID for API
        tumanName: tumanName, // Name for display
      };
      
      setFormData((prev) => ({
        ...prev,
        deliveryRegions: [...prev.deliveryRegions, region],
      }));
      
      setNewDeliveryRegion({ viloyat: '', tuman: '' });
    } catch (err) {
      console.error('Error fetching region names:', err);
      // Fallback: save with IDs only
      const region = {
        viloyat: newDeliveryRegion.viloyat,
        viloyatName: newDeliveryRegion.viloyat,
        tuman: newDeliveryRegion.tuman || null,
        tumanName: newDeliveryRegion.tuman || null,
      };
      
      setFormData((prev) => ({
        ...prev,
        deliveryRegions: [...prev.deliveryRegions, region],
      }));
      
      setNewDeliveryRegion({ viloyat: '', tuman: '' });
    }
  };

  const handleRemoveDeliveryRegion = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliveryRegions: prev.deliveryRegions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Nomi kamida 2 ta belgi bo\'lishi kerak');
      return;
    }
    
    if (!formData.price || Number(formData.price) < 0) {
      setError('Narx 0 dan katta bo\'lishi kerak');
      return;
    }
    
    if (!formData.originalPrice || Number(formData.originalPrice) < 0) {
      setError('Asl narx 0 dan katta bo\'lishi kerak');
      return;
    }
    
    if (!formData.category) {
      setError('Kategoriya tanlanishi shart');
      return;
    }
    
    if (formData.deliveryRegions.length === 0) {
      setError('Kamida 1 ta yetkazib berish regioni tanlanishi shart');
      return;
    }

    setLoading(true);
    try {
      // Normalize deliveryRegions - ensure viloyat and tuman are strings (IDs)
      const normalizedDeliveryRegions = formData.deliveryRegions.map((region) => ({
        viloyat: typeof region.viloyat === 'object' 
          ? (region.viloyat._id || region.viloyat) 
          : String(region.viloyat || ''),
        tuman: region.tuman 
          ? (typeof region.tuman === 'object' 
              ? (region.tuman._id || region.tuman) 
              : String(region.tuman))
          : null,
      }));

      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        quantity: Number(formData.quantity) || 0,
        unit: formData.unit,
        status: formData.status,
        moderationStatus: formData.moderationStatus,
        category: formData.category,
        kpiBonusPercent: Number(formData.kpiBonusPercent) || 0,
        deliveryRegions: normalizedDeliveryRegions,
      };
      
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
      
      if (formData.length) {
        payload.length = Number(formData.length);
      } else {
        payload.length = null;
      }
      
      if (formData.width) {
        payload.width = Number(formData.width);
      } else {
        payload.width = null;
      }
      
      if (formData.weight) {
        payload.weight = Number(formData.weight);
      } else {
        payload.weight = null;
      }
      
      if (formData.images.length > 0) {
        payload.images = formData.images;
      }
      
      const response = await productModerationAPI.updateProduct(product._id, payload);
      
      if (response.success) {
        showSuccess(response.message || 'Mahsulot muvaffaqiyatli yangilandi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Mahsulotni yangilashda xatolik yuz berdi';
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

  if (!product) return null;

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
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Mahsulotni Tahrirlash</h2>
                    <p className="text-xs text-indigo-100 mt-0.5">
                      Mahsulot ma'lumotlarini yangilang
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

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="archived">Arxivlangan</option>
                      </select>
                    </div>
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
                      onCategoriesLoad={setCategoriesList}
                    />

                    <SubcategorySelect
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      label="Subkategoriya"
                      categoryId={formData.category}
                      categories={categoriesList}
                      status="active"
                    />
                  </div>

                  {/* Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Narx <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Asl narx <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Miqdor
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Birlik
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="dona">dona</option>
                        <option value="litr">litr</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Birlik o'lchami
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

                  {/* Physical Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Uzunlik (cm)
                      </label>
                      <input
                        type="number"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Kenglik (cm)
                      </label>
                      <input
                        type="number"
                        name="width"
                        value={formData.width}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Og'irlik (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* KPI Bonus */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      KPI bonus foizi (%)
                    </label>
                    <input
                      type="number"
                      name="kpiBonusPercent"
                      value={formData.kpiBonusPercent}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Moderation Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Moderatsiya holati
                    </label>
                    <select
                      name="moderationStatus"
                      value={formData.moderationStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="pending">Kutilmoqda</option>
                      <option value="approved">Tasdiqlangan</option>
                      <option value="rejected">Rad etilgan</option>
                    </select>
                  </div>

                  {/* Delivery Regions */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Yetkazib berish regionlari <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 mb-2">
                      {formData.deliveryRegions.map((region, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">
                              {region.viloyatName || region.viloyat}
                            </span>
                            {region.tuman && (
                              <span className="text-xs text-gray-500 ml-2">
                                - {region.tumanName || region.tuman}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliveryRegion(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            O'chirish
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <RegionSelect
                        name="viloyat"
                        value={newDeliveryRegion.viloyat}
                        onChange={(e) => setNewDeliveryRegion({ ...newDeliveryRegion, viloyat: e.target.value, tuman: '' })}
                        label="Viloyat"
                        type="region"
                      />
                      <RegionSelect
                        name="tuman"
                        value={newDeliveryRegion.tuman}
                        onChange={(e) => setNewDeliveryRegion({ ...newDeliveryRegion, tuman: e.target.value })}
                        label="Tuman (ixtiyoriy)"
                        type="district"
                        parentId={newDeliveryRegion.viloyat || null}
                        disabled={!newDeliveryRegion.viloyat}
                      />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddDeliveryRegion}
                          className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          Qo'shish
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rasmlar (maksimal 5 ta)
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
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Yangilanmoqda...' : 'Yangilash'}
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

export default EditProductModal;

