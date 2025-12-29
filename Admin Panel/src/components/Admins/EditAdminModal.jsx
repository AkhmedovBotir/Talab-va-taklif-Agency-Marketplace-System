import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Visibility, VisibilityOff, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { ALL_PERMISSIONS } from '../../utils/permissions';

const EditAdminModal = ({ open, onClose, onSuccess, admin }) => {
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    telefonRaqam: '',
    role: 'general',
    status: 'active',
    username: '',
    parol: '',
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAllPermissions, setSelectAllPermissions] = useState(false);

  useEffect(() => {
    if (admin && open) {
      const adminPermissions = admin.permissions || [];
      setFormData({
        name: admin.name || '',
        telefonRaqam: admin.telefonRaqam || '',
        role: admin.role || 'general',
        status: admin.status || 'active',
        username: admin.username || '',
        parol: '', // Password is optional in update
        permissions: adminPermissions,
      });
      setSelectAllPermissions(adminPermissions.length === ALL_PERMISSIONS.length);
      setShowPassword(false);
    }
  }, [admin, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert username to lowercase automatically
    const processedValue = name === 'username' ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => {
      const currentPermissions = prev.permissions || [];
      const isSelected = currentPermissions.includes(permission);
      const newPermissions = isSelected
        ? currentPermissions.filter((p) => p !== permission)
        : [...currentPermissions, permission];
      
      // Update select all state
      setSelectAllPermissions(newPermissions.length === ALL_PERMISSIONS.length);
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSelectAllPermissions = () => {
    if (selectAllPermissions) {
      // Deselect all
      setFormData((prev) => ({ ...prev, permissions: [] }));
      setSelectAllPermissions(false);
    } else {
      // Select all
      const allPermissionValues = ALL_PERMISSIONS.map((p) => p.value);
      setFormData((prev) => ({ ...prev, permissions: allPermissionValues }));
      setSelectAllPermissions(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data - only include password if it's provided
      const updateData = { ...formData };
      if (!updateData.parol || updateData.parol.trim() === '') {
        delete updateData.parol;
      }

      const response = await adminAPI.updateAdmin(admin._id, updateData);
      if (response.success) {
        showSuccess(response.message || 'Admin muvaffaqiyatli yangilandi');
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Admin yangilashda xatolik yuz berdi';
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

  if (!admin) return null;

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
                <h2 className="text-2xl font-bold text-gray-800">Adminni Tahrirlash</h2>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To'liq ism
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9]+"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Telefon Raqam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      name="telefonRaqam"
                      value={formData.telefonRaqam}
                      onChange={handleChange}
                      placeholder="+998901234567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="general">General</option>
                      <option value="admin">Admin</option>
                    </select>
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

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parol (ixtiyoriy)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="parol"
                        value={formData.parol}
                        onChange={handleChange}
                        minLength={6}
                        placeholder="Yangi parol (agar o'zgartirmoqchi bo'lsangiz)"
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
                    <p className="text-xs text-gray-500 mt-1">Agar parolni o'zgartirmasangiz, bo'sh qoldiring</p>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Ruhsatlar
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                    >
                      {selectAllPermissions ? (
                        <>
                          <CheckBox className="w-4 h-4" />
                          <span>Barchasini tanlash</span>
                        </>
                      ) : (
                        <>
                          <CheckBoxOutlineBlank className="w-4 h-4" />
                          <span>Barchasini bekor qilish</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Agar ruhsatlar bo'sh qoldirilsa, barcha default ruhsatlar tayinlanadi
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
                    {ALL_PERMISSIONS.map((permission) => {
                      const isSelected = formData.permissions?.includes(permission.value) || false;
                      return (
                        <label
                          key={permission.value}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionToggle(permission.value)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{permission.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.permissions && formData.permissions.length > 0 && (
                    <p className="text-xs text-indigo-600 mt-2">
                      {formData.permissions.length} ta ruhsat tanlangan
                    </p>
                  )}
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
                    {loading ? 'Yangilanmoqda...' : 'Yangilash'}
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

export default EditAdminModal;

