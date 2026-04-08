import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { changeManagerPassword, getNoAuthRegions } from '../services/api';

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regionLabel, setRegionLabel] = useState('');

  const userName = user?.name || user?.full_name || user?.fullname || user?.username || '';
  const userPhone = user?.phone || user?.phone_number || '';
  const userRegion = user?.viloyat?.name || user?.region?.name || user?.region_name || '';
  const userRegionId =
    user?.viloyat_id || user?.viloyatId || user?.region_id || user?.regionId || user?.region?.id;

  useEffect(() => {
    let cancelled = false;

    const loadRegionLabel = async () => {
      if (userRegion) {
        setRegionLabel(userRegion);
        return;
      }

      if (!userRegionId) {
        setRegionLabel('');
        return;
      }

      try {
        const response = await getNoAuthRegions();
        const regions = response?.data || response?.regions || response || [];
        const matched = Array.isArray(regions)
          ? regions.find((item) => String(item?.id) === String(userRegionId))
          : null;

        if (!cancelled) {
          setRegionLabel(matched?.name || '');
        }
      } catch {
        if (!cancelled) {
          setRegionLabel('');
        }
      }
    };

    loadRegionLabel();

    return () => {
      cancelled = true;
    };
  }, [userRegion, userRegionId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.old_password.trim() || !formData.new_password.trim()) {
      setError('Joriy va yangi parol kiritilishi shart');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Yangi parol va tasdiqlash mos emas');
      return;
    }

    setLoading(true);
    try {
      await changeManagerPassword(formData.old_password.trim(), formData.new_password.trim());
      await refreshProfile();
      setSuccess('Parol muvaffaqiyatli yangilandi');
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err.message || 'Parolni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Shaxsiy ma'lumotlar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
              <input
                type="text"
                value={userName}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqami</label>
              <input
                type="tel"
                value={userPhone}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Viloyat</label>
              <input
                type="text"
                value={regionLabel}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Parolni o'zgartirish</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joriy parol</label>
              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Joriy parolni kiriting"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yangi parol</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Yangi parolni kiriting"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yangi parolni tasdiqlash</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Yangi parolni qayta kiriting"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Yangilanmoqda...' : 'Parolni yangilash'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
