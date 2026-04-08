import { useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Add, Close, ContentCopy, Edit, Delete, Security, Visibility } from '@mui/icons-material';
import { integrationApiKeysAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const rowApiKey = (row) => String(row?.apiKey ?? row?.api_key ?? '').trim();

const rowKeyHint = (row) => String(row?.keyHint ?? row?.key_hint ?? '').trim();

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const IntegrationApiKeys = () => {
  const { showSuccess, showError } = useSnackbar();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await integrationApiKeysAPI.list();
      const list = Array.isArray(res.data) ? res.data : [];
      setKeys(list);
    } catch (err) {
      showErrorRef.current(err.message || 'Kalitlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      showError('Nom kiriting');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await integrationApiKeysAPI.create(name);
      setCreateOpen(false);
      setCreateName('');
      showSuccess(res.message || 'Kalit yaratildi');
      await fetchKeys();
    } catch (err) {
      showError(err.message || 'Yaratishda xatolik');
    } finally {
      setCreateLoading(false);
    }
  };

  const copyKey = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Buferga nusxalandi');
    } catch {
      showError('Nusxalab bo‘lmadi');
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditName(row.name || '');
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const name = editName.trim();
    if (!name) {
      showError('Nom bo‘sh bo‘lmasligi kerak');
      return;
    }
    const id = editRow?.id;
    if (!id) return;
    setEditLoading(true);
    try {
      const res = await integrationApiKeysAPI.update(id, name);
      showSuccess(res.message || 'Yangilandi');
      setEditOpen(false);
      setEditRow(null);
      fetchKeys();
    } catch (err) {
      showError(err.message || 'Yangilashda xatolik');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteRow?.id;
    if (!id) return;
    setDeleteLoading(true);
    try {
      const res = await integrationApiKeysAPI.deleteKey(id);
      showSuccess(res.message || "O'chirildi");
      setDeleteRow(null);
      fetchKeys();
    } catch (err) {
      showError(err.message || 'O‘chirishda xatolik');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <h2 className="text-lg font-semibold text-gray-800">Integratsiya API kalitlari</h2>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Add className="w-5 h-5" />
          Yangi kalit
        </button>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[10rem]">Qisqa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[14rem]">To‘liq kalit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Yaratilgan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700 w-40">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Hali kalit yo‘q. «Yangi kalit» orqali yarating.
                  </td>
                </tr>
              ) : (
                keys.map((row) => {
                  const full = rowApiKey(row);
                  const hint = rowKeyHint(row);
                  return (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/80 align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{hint || '—'}</td>
                      <td className="px-4 py-3">
                        {full ? (
                          <div className="flex items-start gap-2">
                            <div className="font-mono text-xs leading-relaxed break-all text-gray-900 select-all flex-1 min-w-0">
                              {full}
                            </div>
                            <button
                              type="button"
                              onClick={() => copyKey(full)}
                              className="flex-shrink-0 inline-flex items-center justify-center p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"
                              title="Nusxalash"
                            >
                              <ContentCopy fontSize="small" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-2">
                            <Visibility fontSize="small" className="flex-shrink-0 mt-0.5 text-amber-700" />
                            <span>
                              Bo‘sh — shifrdan ochilmadi (masalan, <code className="bg-amber-100 px-0.5 rounded">JWT_SECRET</code>{' '}
                              o‘zgargan). Yangi kalit yarating va eskisini o‘chiring.
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(row.createdAt || row.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-md mr-1"
                          title="Nomni tahrirlash"
                        >
                          <Edit fontSize="small" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRow(row)}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="O‘chirish"
                        >
                          <Delete fontSize="small" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Motion.div>

      {/* Create */}
      <AnimatePresence>
        {createOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !createLoading && setCreateOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Yangi kalit</h3>
                  <button
                    type="button"
                    disabled={createLoading}
                    onClick={() => setCreateOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Close />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <div>
                    <label htmlFor="int-key-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      id="int-key-name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Masalan: ERP ulanishi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={createLoading}
                      onClick={() => setCreateOpen(false)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {createLoading ? 'Yaratilmoqda…' : 'Yaratish'}
                    </button>
                  </div>
                </form>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit name */}
      <AnimatePresence>
        {editOpen && editRow && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !editLoading && setEditOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Nomni yangilash</h3>
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={() => setEditOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Close />
                  </button>
                </div>
                <form onSubmit={handleEdit} className="p-5 space-y-4">
                  <div className="text-xs space-y-1">
                    <p className="text-gray-500 font-mono break-all">{rowKeyHint(editRow) || '—'}</p>
                    {rowApiKey(editRow) ? (
                      <p className="font-mono text-gray-700 break-all select-all">{rowApiKey(editRow)}</p>
                    ) : (
                      <p className="text-amber-800">To‘liq kalit mavjud emas (shifrdan ochilmadi).</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="int-key-edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Yangi nom
                    </label>
                    <input
                      id="int-key-edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={editLoading}
                      onClick={() => setEditOpen(false)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Bekor
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {editLoading ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteRow && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleteLoading && setDeleteRow(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Kalitni o‘chirish</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    «{deleteRow.name}» yozuvi butunlay olib tashlanadi. Davom etasizmi?
                  </p>
                </div>
                <div className="p-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setDeleteRow(null)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Bekor
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? 'O‘chirilmoqda…' : 'O‘chirish'}
                  </button>
                </div>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationApiKeys;
