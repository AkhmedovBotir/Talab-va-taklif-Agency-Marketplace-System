import { useCallback, useEffect, useMemo, useState } from 'react';
import { Close, Visibility, Phone, Handshake, SwapHoriz } from '@mui/icons-material';
import { adminPartnerRequestsAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const statusLabel = {
  new: 'Yangi',
  contacted: 'Aloqaga chiqilgan',
  deal_signed: 'Bitim imzolangan',
  deal_not_signed: 'Bitim imzolanmagan',
  converted: 'Kontragentga aylantirilgan',
};

const statusClass = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  deal_signed: 'bg-green-100 text-green-800',
  deal_not_signed: 'bg-red-100 text-red-700',
  converted: 'bg-indigo-100 text-indigo-800',
};

const fmtDate = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return String(x);
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
};

const PartnerRequests = () => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [convertOpen, setConvertOpen] = useState(false);
  const [convertRow, setConvertRow] = useState(null);
  const [overridePhone, setOverridePhone] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPartnerRequestsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
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
      showError(e.message || "Hamkorlik so'rovlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, showError]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.phone || '').toLowerCase().includes(q) ||
        String(r.company_name || r.company || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const openView = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await adminPartnerRequestsAPI.getById(row.id);
      setViewRow(res.data || row);
    } catch (e) {
      showError(e.message || "So'rov tafsilotini olib bo'lmadi");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const doContacted = async (row) => {
    setBusyId(row.id);
    try {
      await adminPartnerRequestsAPI.markContacted(row.id);
      showSuccess('Aloqaga chiqilgan deb belgilandi');
      fetchList();
      if (viewOpen && viewRow?.id === row.id) openView(row);
    } catch (e) {
      showError(e.message || 'Statusni yangilab bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  };

  const doDeal = async (row, signed) => {
    setBusyId(row.id);
    try {
      await adminPartnerRequestsAPI.updateDeal(row.id, signed);
      showSuccess(signed ? 'Bitim imzolangan holatiga o‘tdi' : 'Bitim imzolanmadi holatiga o‘tdi');
      fetchList();
      if (viewOpen && viewRow?.id === row.id) openView(row);
    } catch (e) {
      showError(e.message || 'Bitim holatini yangilab bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  };

  const openConvert = (row) => {
    setConvertRow(row);
    setOverridePhone('');
    setConvertOpen(true);
  };

  const doConvert = async () => {
    if (!convertRow) return;
    setBusyId(convertRow.id);
    try {
      await adminPartnerRequestsAPI.convertToContragent(convertRow.id, overridePhone.trim() || undefined);
      showSuccess('Kontragentga aylantirildi');
      setConvertOpen(false);
      setConvertRow(null);
      setOverridePhone('');
      fetchList();
      if (viewOpen && viewRow?.id === convertRow.id) openView(convertRow);
    } catch (e) {
      showError(e.message || 'Kontragentga aylantirib bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish: ism, telefon, kompaniya..."
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Barcha statuslar</option>
          <option value="new">new</option>
          <option value="contacted">contacted</option>
          <option value="deal_signed">deal_signed</option>
          <option value="deal_not_signed">deal_not_signed</option>
          <option value="converted">converted</option>
        </select>
        <select
          value={pagination.limit}
          onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="10">10 ta</option>
          <option value="20">20 ta</option>
          <option value="50">50 ta</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Ism/Kompaniya</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Telefon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Yaratilgan</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">So‘rovlar topilmadi</td></tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name || row.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{row.company_name || row.company || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass[row.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabel[row.status] || row.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(row.createdAt || row.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openView(row)}
                      className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md mr-1"
                      title="Ko'rish"
                    >
                      <Visibility fontSize="small" />
                    </button>
                    {row.status === 'new' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => doContacted(row)}
                        className="inline-flex items-center justify-center p-2 text-amber-700 hover:bg-amber-50 rounded-md mr-1"
                        title="Aloqaga chiqildi"
                      >
                        <Phone fontSize="small" />
                      </button>
                    )}
                    {row.status !== 'converted' && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => doDeal(row, true)}
                          className="inline-flex items-center justify-center p-2 text-green-700 hover:bg-green-50 rounded-md mr-1"
                          title="Bitim imzolandi"
                        >
                          <Handshake fontSize="small" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => doDeal(row, false)}
                          className="inline-flex items-center justify-center p-2 text-red-700 hover:bg-red-50 rounded-md mr-1"
                          title="Bitim imzolanmadi"
                        >
                          <Close fontSize="small" />
                        </button>
                      </>
                    )}
                    {row.status === 'deal_signed' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => openConvert(row)}
                        className="inline-flex items-center justify-center p-2 text-indigo-700 hover:bg-indigo-50 rounded-md"
                        title="Kontragentga aylantirish"
                      >
                        <SwapHoriz fontSize="small" />
                      </button>
                    )}
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

      {viewOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Hamkorlik so'rovi</h3>
              <button type="button" onClick={() => setViewOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <div className="p-5 text-sm space-y-3">
              {viewLoading ? (
                <p className="text-gray-500">Yuklanmoqda...</p>
              ) : (
                <>
                  <p><span className="text-gray-500">Ism:</span> <span className="font-medium">{viewRow?.name || viewRow?.full_name || '—'}</span></p>
                  <p><span className="text-gray-500">Kompaniya:</span> <span className="font-medium">{viewRow?.company_name || viewRow?.company || '—'}</span></p>
                  <p><span className="text-gray-500">Telefon:</span> <span className="font-medium">{viewRow?.phone || '—'}</span></p>
                  <p><span className="text-gray-500">Status:</span> <span className="font-medium">{statusLabel[viewRow?.status] || viewRow?.status || '—'}</span></p>
                  <p><span className="text-gray-500">Yaratilgan:</span> <span className="font-medium">{fmtDate(viewRow?.createdAt || viewRow?.created_at)}</span></p>
                  <p className="whitespace-pre-wrap"><span className="text-gray-500">Izoh:</span> <span className="font-medium">{viewRow?.message || viewRow?.description || '—'}</span></p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {convertOpen && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setConvertOpen(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-md rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Kontragentga aylantirish</h3>
              <button type="button" onClick={() => setConvertOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">
                Telefon band bo‘lsa, shu yerda yangi raqam yuboring. Bo‘sh qoldirilsa, so‘rovdagi telefon ishlatiladi.
              </p>
              <input
                value={overridePhone}
                onChange={(e) => setOverridePhone(e.target.value)}
                placeholder="+998901234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConvertOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                >
                  Bekor
                </button>
                <button
                  type="button"
                  disabled={busyId === convertRow?.id}
                  onClick={doConvert}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Aylantirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerRequests;
