import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import {
  getManagerProductComments,
  getManagerProductCommentById,
  addManagerProductCommentNote,
  addManagerProductCommentCall,
  escalateManagerProductComment,
  resolveManagerProductComment,
} from '../services/api';
import {
  normalizeProductCommentCase,
  getProductCommentPreview,
  parseProductCommentsListResponse,
} from '../utils/productComment';

const statusLabels = {
  open: 'Ochiq',
  escalated_to_admin: 'Adminga yuborilgan',
  resolved: 'Hal qilingan',
};

export default function ProductComments() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'open',
    escalated: '',
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedStatusBadge = useMemo(() => {
    const value = selectedCase?.status;
    if (value === 'resolved') return 'bg-green-100 text-green-700';
    if (value === 'escalated_to_admin') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-700';
  }, [selectedCase]);

  useEffect(() => {
    fetchComments();
  }, [filters.page, filters.limit, filters.status, filters.escalated]);

  useEffect(() => {
    if (selectedId) {
      fetchCommentDetail(selectedId);
    }
  }, [selectedId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getManagerProductComments(filters);
      const parsed = parseProductCommentsListResponse(response);
      const list = parsed.data || [];
      setRows(list);
      setPagination({
        page: parsed.page || 1,
        limit: parsed.limit || 10,
        total: parsed.total || 0,
        totalPages: parsed.totalPages || 1,
      });
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].rating_id);
      }
    } catch (err) {
      setError(err.message || 'Kommentlarni yuklashda xatolik yuz berdi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentDetail = async (ratingId) => {
    try {
      setDetailLoading(true);
      setError('');
      const response = await getManagerProductCommentById(ratingId);
      setSelectedCase(normalizeProductCommentCase(response?.data ?? response));
    } catch (err) {
      setError(err.message || 'Komment tafsilotini olishda xatolik yuz berdi');
      setSelectedCase(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (action) => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      await action(selectedId, note.trim());
      setSuccess('Amal muvaffaqiyatli bajarildi');
      setNote('');
      await Promise.all([fetchComments(), fetchCommentDetail(selectedId)]);
    } catch (err) {
      setError(err.message || 'Amal bajarishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Kommentariyalar nazorati</h1>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Barchasi</option>
                <option value="open">Ochiq</option>
                <option value="escalated_to_admin">Adminga yuborilgan</option>
                <option value="resolved">Hal qilingan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Adminga yuborilgan</label>
              <select
                value={filters.escalated}
                onChange={(e) => setFilters((prev) => ({ ...prev, escalated: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Barchasi</option>
                <option value="true">Ha</option>
                <option value="false">Yo&apos;q</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sahifa limiti</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">Kommentlar ro&apos;yxati</div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Yuklanmoqda...</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Ma&apos;lumot topilmadi</div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
                {rows.map((item) => {
                  const id = item.rating_id;
                  const active = String(id) === String(selectedId);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={`w-full text-left p-4 transition ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {item.product_name || `Sharh #${id}`}
                        </p>
                        <span className="text-xs text-gray-500 shrink-0">
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.userName || item.contragent_name || 'Foydalanuvchi'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{getProductCommentPreview(item)}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  Oldingi
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
            {detailLoading ? (
              <div className="p-6 text-center text-gray-500">Tafsilot yuklanmoqda...</div>
            ) : !selectedCase ? (
              <div className="p-6 text-center text-gray-500">Chapdan komment tanlang</div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Case #{selectedCase.rating_id}</h2>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedStatusBadge}`}>
                    {statusLabels[selectedCase.status] || selectedCase.status}
                  </span>
                  {selectedCase.escalated_to_admin && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Admin escalation
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Mahsulot</p>
                    <p className="text-sm text-gray-900">{selectedCase.product_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Kontragent</p>
                    <p className="text-sm text-gray-900">{selectedCase.contragent_name || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Foydalanuvchi</p>
                    <p className="text-sm text-gray-900">
                      {selectedCase.userName || '-'}
                    </p>
                    {selectedCase.user_phone && (
                      <p className="text-xs text-gray-500 mt-1">{selectedCase.user_phone}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Baho</p>
                    <p className="text-sm text-gray-900">{selectedCase.score ?? '-'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Komment</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedCase.commentText}</p>
                </div>

                {selectedCase.activities?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Faoliyat tarixi</p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCase.activities.map((act) => (
                        <li key={act.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <span className="font-medium text-gray-800">{act.activity_type || act.type}</span>
                          {act.note && <p className="text-gray-600 mt-1">{act.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Izoh (note / call / escalate / resolve)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Mijoz bilan gaplashildi, qayta tekshirilyapti"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runAction(addManagerProductCommentNote)}
                    disabled={actionLoading || !selectedId || !note.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Note qo&apos;shish
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction(addManagerProductCommentCall)}
                    disabled={actionLoading || !selectedId || !note.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Qo&apos;ng&apos;iroq qaydi
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction(escalateManagerProductComment)}
                    disabled={actionLoading || !selectedId}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Adminga yuborish
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction(resolveManagerProductComment)}
                    disabled={actionLoading || !selectedId}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Hal qilish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
