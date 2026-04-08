import { useCallback, useEffect, useState } from 'react';
import { Add, Close, Delete, Edit, Visibility } from '@mui/icons-material';
import { qrAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const defaultForm = {
  name: '',
  link: '',
};

const fmtDate = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return String(x);
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
};

const getQrDownloadName = (row) => {
  const base = String(row?.name || row?.code || row?.id || 'qr')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return `${base || 'qr'}.png`;
};

const QRSystemPage = () => {
  const { showError, showSuccess } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [openForm, setOpenForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await qrAPI.getAll({ page: pagination.page, limit: pagination.limit });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setRows(items);
      setPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) || items.length,
        pages:
          Number(payload.total_pages) ||
          Math.max(1, Math.ceil((Number(payload.total) || items.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      showError(e.message || "QR ro'yxatini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, showError]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpenForm(true);
  };

  const openEdit = async (row) => {
    setFormLoading(true);
    try {
      const res = await qrAPI.getById(row.id);
      const item = res.data || row;
      setEditing(item);
      setForm({
        name: item.name || '',
        link: item.link || '',
      });
      setOpenForm(true);
    } catch (e) {
      showError(e.message || "QR yozuvini ochib bo'lmadi");
    } finally {
      setFormLoading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.link.trim()) {
      showError('Name va link kiritilishi shart');
      return;
    }
    setFormLoading(true);
    try {
      if (editing?.id) {
        await qrAPI.update(editing.id, form);
        showSuccess('QR yangilandi');
      } else {
        await qrAPI.create(form);
        showSuccess('QR yaratildi');
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      fetchList();
    } catch (e2) {
      showError(e2.message || "Saqlashda xatolik");
    } finally {
      setFormLoading(false);
    }
  };

  const openView = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await qrAPI.getById(row.id);
      setViewRow(res.data || row);
    } catch (e) {
      showError(e.message || "QR tafsilotini ochib bo'lmadi");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleteLoading(true);
    try {
      await qrAPI.remove(deleteRow.id);
      showSuccess("QR o'chirildi");
      setDeleteRow(null);
      fetchList();
    } catch (e) {
      showError(e.message || "O'chirishda xatolik");
    } finally {
      setDeleteLoading(false);
    }
  };

  const downloadQrImage = () => {
    const src = viewRow?.imageBase64 || viewRow?.image_base64 || '';
    if (!src) {
      showError('Yuklab olish uchun rasm topilmadi');
      return;
    }
    const a = document.createElement('a');
    a.href = src;
    a.download = getQrDownloadName(viewRow);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">QR tizimi</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
        >
          <Add />
          Yangi QR
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[160px]">Nomi</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[260px]">Link</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Kod</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Skan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Yangilangan</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">QR yozuvlari topilmadi</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                  <td className="px-4 py-3 text-gray-800 font-medium">{row.id}</td>
                  <td className="px-4 py-3 text-gray-900">{row.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[360px] truncate" title={row.link}>{row.link || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{row.code || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.scanCount ?? row.scan_count ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(row.updatedAt || row.updated_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openView(row)}
                      className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md mr-1"
                      title="Ko'rish"
                    >
                      <Visibility fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center justify-center p-2 text-amber-700 hover:bg-amber-50 rounded-md mr-1"
                      title="Tahrirlash"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteRow(row)}
                      className="inline-flex items-center justify-center p-2 text-red-700 hover:bg-red-50 rounded-md"
                      title="O'chirish"
                    >
                      <Delete fontSize="small" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Jami: <span className="font-semibold">{pagination.total}</span></p>
        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
          </select>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Oldingi
          </button>
          <span className="text-sm text-gray-600">{pagination.page} / {Math.max(1, pagination.pages)}</span>
          <button
            type="button"
            disabled={pagination.page >= Math.max(1, pagination.pages)}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Keyingi
          </button>
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => !formLoading && setOpenForm(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-xl rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? 'QR tahrirlash' : 'Yangi QR yaratish'}</h3>
              <button type="button" onClick={() => setOpenForm(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <form onSubmit={submitForm} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Masalan: Telegram kanal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
              <p className="text-xs text-gray-500">
                Eslatma: QR rasmi serverda `1000x1000` yaratiladi va qaytariladi.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setOpenForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewOpen && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">QR tafsiloti</h3>
              <button type="button" onClick={() => setViewOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <div className="p-5 text-sm space-y-3">
              {viewLoading ? (
                <p className="text-gray-500">Yuklanmoqda...</p>
              ) : (
                <>
                  <p><span className="text-gray-500">ID:</span> <span className="font-medium">{viewRow?.id || '—'}</span></p>
                  <p><span className="text-gray-500">Nomi:</span> <span className="font-medium">{viewRow?.name || '—'}</span></p>
                  <p><span className="text-gray-500">Kod:</span> <span className="font-medium font-mono">{viewRow?.code || '—'}</span></p>
                  <p><span className="text-gray-500">Link:</span> <span className="font-medium break-all">{viewRow?.link || '—'}</span></p>
                  <p><span className="text-gray-500">Skan soni:</span> <span className="font-medium">{viewRow?.scanCount ?? viewRow?.scan_count ?? 0}</span></p>
                  <p><span className="text-gray-500">Yaratilgan:</span> <span className="font-medium">{fmtDate(viewRow?.createdAt || viewRow?.created_at)}</span></p>
                  <p><span className="text-gray-500">Yangilangan:</span> <span className="font-medium">{fmtDate(viewRow?.updatedAt || viewRow?.updated_at)}</span></p>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500">QR rasmi</p>
                      {(viewRow?.imageBase64 || viewRow?.image_base64) && (
                        <button
                          type="button"
                          onClick={downloadQrImage}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Yuklab olish
                        </button>
                      )}
                    </div>
                    {viewRow?.imageBase64 || viewRow?.image_base64 ? (
                      <img
                        src={viewRow.imageBase64 || viewRow.image_base64}
                        alt="qr"
                        className="w-full max-w-[420px] border border-gray-200 rounded-md"
                      />
                    ) : (
                      <p className="text-gray-400">Rasm topilmadi</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteRow && (
        <div className="fixed inset-0 z-[103] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleteLoading && setDeleteRow(null)} />
          <div className="relative bg-white shadow-xl w-full max-w-md rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">QR ni o'chirish</h3>
              <p className="text-sm text-gray-600 mt-2">
                «{deleteRow.name || `QR #${deleteRow.id}`}» yozuvi butunlay o‘chiriladi. Davom etasizmi?
              </p>
            </div>
            <div className="p-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteRow(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md"
              >
                Bekor
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRSystemPage;
