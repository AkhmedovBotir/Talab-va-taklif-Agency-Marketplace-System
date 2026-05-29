import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import AdminPermissionsPicker from '../Permissions/AdminPermissionsPicker';
import { parseAdminPermissions } from '../../utils/permissions';

const EditAdminModal = ({ open, onClose, onSuccess, admin }) => {
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'admin',
    status: 'active',
    username: '',
    password: '',
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!admin || !open) return;
    const load = async () => {
      try {
        const adminId = admin.id ?? admin._id;
        const res = await adminAPI.getAdminById(adminId);
        const d = res.data || admin;
        setFormData({
          name: d.name || d.fullname || '',
          phone: d.phone || d.telefonRaqam || '',
          role: d.role || 'admin',
          status: d.status || 'active',
          username: d.username || '',
          password: '',
          permissions: parseAdminPermissions(d),
        });
      } catch {
        setFormData({
          name: admin.name || admin.fullname || '',
          phone: admin.phone || admin.telefonRaqam || '',
          role: admin.role || 'admin',
          status: admin.status || 'active',
          username: admin.username || '',
          password: '',
          permissions: parseAdminPermissions(admin),
        });
      }
      setShowPassword(false);
    };
    load();
  }, [admin, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'username' ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData = { ...formData };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }

      const adminId = admin.id ?? admin._id;
      const response = await adminAPI.updateAdmin(adminId, updateData);
      if (response.success) {
        showSuccess(response.message || 'Admin yangilandi');
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Admin yangilashda xatolik';
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
              className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">Adminni tahrirlash</h2>
                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <Close />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Ma&apos;lumotlar
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To&apos;liq ism</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          minLength={2}
                          maxLength={100}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          minLength={3}
                          maxLength={30}
                          pattern="[a-zA-Z0-9]+"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+998901234567"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="active">Faol</option>
                            <option value="inactive">Nofaol</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parol (ixtiyoriy)</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength={6}
                            placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                      <AdminPermissionsPicker
                        value={formData.permissions}
                        onChange={(permissions) => setFormData((p) => ({ ...p, permissions }))}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200 shrink-0 bg-gray-50/80">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
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
