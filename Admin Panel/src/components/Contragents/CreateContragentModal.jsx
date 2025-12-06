import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { contragentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';

const CreateContragentModal = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    phone: '',
    password: '',
    logo: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    // If viloyat changes, reset tuman and mfy
    if (name === 'viloyat') {
      setFormData((prev) => ({ ...prev, viloyat: value, tuman: '', mfy: '' }));
    }
    // If tuman changes, reset mfy
    else if (name === 'tuman') {
      setFormData((prev) => ({ ...prev, tuman: value, mfy: '' }));
    } else if (name === 'logo' && files && files[0]) {
      // Handle logo file upload - convert to base64
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, logo: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        showError('Faqat rasm fayllari qabul qilinadi');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data - only include logo if provided
      const submitData = { ...formData };
      if (!submitData.logo || submitData.logo.trim() === '') {
        delete submitData.logo;
      }
      
      const response = await contragentAPI.createContragent(submitData);
      if (response.success) {
        showSuccess(response.message || 'Kontragent muvaffaqiyatli yaratildi');
        setFormData({
          name: '',
          inn: '',
          viloyat: '',
          tuman: '',
          mfy: '',
          phone: '',
          password: '',
          logo: '',
          status: 'active',
        });
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragent yaratishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      name: '',
      inn: '',
      viloyat: '',
      tuman: '',
      mfy: '',
      phone: '',
      password: '',
      logo: '',
      status: 'active',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Yangi Kontragent Yaratish</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomi *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={200}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* INN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        INN *
                      </label>
                      <input
                        type="text"
                        name="inn"
                        value={formData.inn}
                        onChange={handleChange}
                        required
                        pattern="^\d{9}$|^\d{12}$"
                        placeholder="9 yoki 12 ta raqam"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">9 yoki 12 ta raqam</p>
                    </div>
                  </div>

                  {/* Manzil (Viloyat, Tuman, MFY) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manzil *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Viloyat */}
                      <div>
                        <RegionSelect
                          name="viloyat"
                          value={formData.viloyat}
                          onChange={handleChange}
                          label="Viloyat"
                          required
                          type="region"
                        />
                      </div>

                      {/* Tuman */}
                      <div>
                        <RegionSelect
                          name="tuman"
                          value={formData.tuman}
                          onChange={handleChange}
                          label="Tuman"
                          required
                          type="district"
                          parentId={formData.viloyat || null}
                          disabled={!formData.viloyat}
                        />
                      </div>

                      {/* MFY */}
                      <div>
                        <RegionSelect
                          name="mfy"
                          value={formData.mfy}
                          onChange={handleChange}
                          label="MFY"
                          required
                          type="mfy"
                          parentId={formData.tuman || null}
                          disabled={!formData.tuman}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon raqami *
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+998901234567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parol *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          style={{ transform: 'translateY(-50%)' }}
                        >
                          {showPassword ? <VisibilityOff className="w-5 h-5" /> : <Visibility className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo (ixtiyoriy)
                    </label>
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.logo && (
                      <div className="mt-2">
                        <img
                          src={formData.logo}
                          alt="Logo preview"
                          className="max-w-32 max-h-32 object-contain border border-gray-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                          className="mt-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Logo'ni olib tashlash
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG formatlari qabul qilinadi</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateContragentModal;

