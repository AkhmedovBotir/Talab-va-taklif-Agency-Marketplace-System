import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { featuredContragentAPI, contragentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Clear, Save } from '@mui/icons-material';

const FeaturedContragentsSettings = () => {
  const { showError, showSuccess } = useSnackbar();

  const [contragents, setContragents] = useState([]);
  const [featuredIds, setFeaturedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load featured list
      const featuredRes = await featuredContragentAPI.getFeaturedContragents();
      const featuredSet = new Set();
      if (featuredRes.success && Array.isArray(featuredRes.data)) {
        featuredRes.data.forEach((c) => {
          if (c._id) featuredSet.add(c._id);
        });
      }
      setFeaturedIds(featuredSet);

      // Load contragents (first page, bigger limit, only active)
      const contragentsRes = await contragentAPI.getAllContragents({
        page: 1,
        limit: 200,
        status: 'active',
      });

      if (contragentsRes.success) {
        setContragents(contragentsRes.data || []);
      }
    } catch (err) {
      const msg = err.message || 'Tanlangan kontragentlarni yuklashda xatolik yuz berdi';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFeatured = (id) => {
    setFeaturedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const ids = Array.from(featuredIds);
      const res = await featuredContragentAPI.updateFeaturedContragents(ids);
      if (res.success) {
        showSuccess(res.message || 'Tanlangan kontragentlar muvaffaqiyatli yangilandi');
        // Ensure featuredIds matches what backend returned
        const newSet = new Set();
        if (Array.isArray(res.data)) {
          res.data.forEach((c) => c._id && newSet.add(c._id));
        }
        setFeaturedIds(newSet);
      }
    } catch (err) {
      const msg = err.message || 'Tanlangan kontragentlarni yangilashda xatolik yuz berdi';
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClearSelection = () => {
    setFeaturedIds(new Set());
  };

  const filteredContragents = useMemo(() => {
    let list = contragents;
    if (showOnlyFeatured) {
      list = list.filter((c) => featuredIds.has(c._id));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(s) ||
          c.inn?.includes(s) ||
          c.phone?.includes(s)
      );
    }
    return list;
  }, [contragents, featuredIds, showOnlyFeatured, search]);

  return (
    <div>
      {/* Header & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Tanlangan Kontragentlar
            </h2>
            <p className="text-sm text-gray-600">
              Marketplace uchun ko&apos;rsatiladigan kontragentlarni tanlang
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={featuredIds.size === 0 || saving}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clear className="w-4 h-4" />
              <span>Tanlovni tozalash</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Kontragent, INN yoki telefon bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showOnlyFeatured}
              onChange={(e) => setShowOnlyFeatured(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span>Faqat tanlangan kontragentlarni ko&apos;rsatish</span>
          </label>
          <div className="text-sm text-gray-500 flex items-center">
            Jami kontragentlar: <span className="font-medium ml-1">{contragents.length}</span>,{' '}
            tanlanganlar: <span className="font-medium ml-1">{featuredIds.size}</span>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600" />
          </div>
        </div>
      ) : filteredContragents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">
            Kontragentlar topilmadi
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanlash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    INN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContragents.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFeatured(c._id)}
                  >
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={featuredIds.has(c._id)}
                        onChange={() => toggleFeatured(c._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {c.inn || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {c.phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedContragentsSettings;



