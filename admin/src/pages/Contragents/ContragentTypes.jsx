import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clear, Edit, Delete, Close, FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import * as Icons from '@mui/icons-material';
import { contragentTypeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';
import IconSelector from '../../components/Common/IconSelector';

const ContragentTypes = () => {
  const { showSuccess, showError } = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formData, setFormData] = useState({ name: '', icon: '', status: 'active' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchTypes = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const response = await contragentTypeAPI.getAllTypes({ page, limit });
      if (response.success) {
        const payload = response.data || {};
        const list = Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];

        setItems(list);
        setPagination((prev) => ({
          ...prev,
          page: Number(payload.page) || page,
          limit: Number(payload.limit) || limit,
          total: Number(payload.total) || list.length,
          pages:
            Number(payload.total_pages) ||
            Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || limit || 1)),
        }));
      }
    } catch (err) {
      showError(err.message || 'Kontragent turlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filters.status) list = list.filter((i) => i.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (i) => i.name?.toLowerCase().includes(q) || i.icon?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filters]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getVisiblePages = () => {
    const totalPages = pagination.pages || 0;
    const current = pagination.page || 1;

    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

  const handleStatusToggle = async (item, status) => {
    const id = item.id ?? item._id;
    setUpdatingStatus((p) => ({ ...p, [id]: true }));
    try {
      const response = await contragentTypeAPI.updateTypeStatus(id, status);
      if (response.success) {
        showSuccess(response.message || 'Status yangilandi');
        fetchTypes();
      }
    } catch (err) {
      showError(err.message || 'Status yangilashda xatolik');
    } finally {
      setUpdatingStatus((p) => ({ ...p, [id]: false }));
    }
  };

  const openCreate = () => {
    setModalError('');
    setFormData({ name: '', icon: '', status: 'active' });
    setCreateOpen(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setModalError('');
    setFormData({ name: item.name || '', icon: item.icon || '', status: item.status || 'active' });
    setEditOpen(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.icon?.trim()) {
      setModalError('Icon tanlang');
      return;
    }
    setModalLoading(true);
    try {
      const response = await contragentTypeAPI.createType(formData);
      if (response.success) {
        showSuccess(response.message || 'Kontragent turi yaratildi');
        setCreateOpen(false);
        fetchTypes();
      }
    } catch (err) {
      setModalError(err.message || 'Yaratishda xatolik');
    } finally {
      setModalLoading(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setModalError('');
    if (!formData.icon?.trim()) {
      setModalError('Icon tanlang');
      return;
    }
    setModalLoading(true);
    try {
      const response = await contragentTypeAPI.updateType(selected.id ?? selected._id, formData);
      if (response.success) {
        showSuccess(response.message || 'Kontragent turi yangilandi');
        setEditOpen(false);
        setSelected(null);
        fetchTypes();
      }
    } catch (err) {
      setModalError(err.message || 'Yangilashda xatolik');
    } finally {
      setModalLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!selected) return;
    setModalLoading(true);
    setModalError('');
    try {
      const response = await contragentTypeAPI.deleteType(selected.id ?? selected._id);
      if (response.success) {
        showSuccess(response.message || "Kontragent turi o'chirildi");
        setDeleteOpen(false);
        setSelected(null);
        fetchTypes();
      }
    } catch (err) {
      setModalError(err.message || "O'chirishda xatolik");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button
            onClick={() => {
              setFilters({ status: '', search: '' });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, page: 1, limit: Number(e.target.value) }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Kontragent turlari topilmadi</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yaratilgan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => {
                  const id = item.id ?? item._id;
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.icon && Icons[item.icon] ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComp = Icons[item.icon];
                              return <IconComp className="w-5 h-5 text-indigo-600" titleAccess={item.icon} />;
                            })()}
                            <span>{item.icon}</span>
                          </div>
                        ) : (
                          item.icon || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.status === 'active'}
                            onChange={(e) => handleStatusToggle(item, e.target.checked ? 'active' : 'inactive')}
                            disabled={updatingStatus[id]}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50" />
                        </label>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTableDate(item.createdAt || item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(item);
                              setModalError('');
                              setDeleteOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-gray-700">
                    Jami <span className="font-medium">{pagination.total}</span> ta kontragent turidan{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    ko'rsatilmoqda
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <FirstPage className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <NavigateBefore className="w-4 h-4" />
                      <span>Oldingi</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {getVisiblePages().map((pageNum, idx) =>
                        pageNum === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 select-none">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 border rounded-md text-sm min-w-9 transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <span>Keyingi</span>
                      <NavigateNext className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.pages)}
                      disabled={pagination.page === pagination.pages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <LastPage className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <ModalFrame title="Yangi kontragent turi" onClose={() => setCreateOpen(false)}>
            <TypeForm
              formData={formData}
              setFormData={setFormData}
              error={modalError}
              loading={modalLoading}
              onCancel={() => setCreateOpen(false)}
              onSubmit={submitCreate}
              submitText="Yaratish"
            />
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editOpen && (
          <ModalFrame title="Kontragent turini tahrirlash" onClose={() => setEditOpen(false)}>
            <TypeForm
              formData={formData}
              setFormData={setFormData}
              error={modalError}
              loading={modalLoading}
              onCancel={() => setEditOpen(false)}
              onSubmit={submitEdit}
              submitText="Yangilash"
            />
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && (
          <ModalFrame title="Kontragent turini o'chirish" onClose={() => setDeleteOpen(false)}>
            <div className="space-y-4">
              {modalError && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{modalError}</div>}
              <p className="text-gray-700">
                <span className="font-semibold">{selected?.name}</span> turini o'chirishni xohlaysizmi?
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Bekor qilish</button>
                <button onClick={submitDelete} disabled={modalLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400">
                  {modalLoading ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModalFrame = ({ title, onClose, children }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Close />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </motion.div>
  </>
);

const TypeForm = ({ formData, setFormData, error, loading, onCancel, onSubmit, submitText }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
      <input
        type="text"
        required
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <IconSelector
        label="Icon"
        required
        value={formData.icon}
        onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        value={formData.status}
        onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="active">Faol</option>
        <option value="inactive">Nofaol</option>
      </select>
    </div>

    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Bekor qilish</button>
      <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
        {loading ? 'Saqlanmoqda...' : submitText}
      </button>
    </div>
  </form>
);

export default ContragentTypes;
