import { useCallback, useEffect, useMemo, useState } from 'react';
import { Add, ArrowDownward, ArrowUpward, CheckCircle, Close, Delete, Edit, Phone, Visibility } from '@mui/icons-material';
import { commentTemplateAPI, productCommentsAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import usePermissions from '../../hooks/usePermissions';
import ContentStatusPanel from '../../components/common/ContentStatusPanel';
import { resolvePageError } from '../../utils/apiError';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const defaultForm = {
  comment: '',
  status: 'active',
};

const fmtDate = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return String(x);
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
};

const asDisplayText = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const caseRatingId = (c) => {
  const raw = c?.ratingId ?? c?.rating_id ?? c?.id;
  const id = raw != null && typeof raw === 'object' ? (raw.rating_id ?? raw.ratingId ?? raw.id ?? raw._id) : raw;
  if (id == null || id === '') return null;
  return id;
};

const caseUserLabel = (c) => {
  const user = c?.user || c?.marketplace_user;
  if (user && typeof user === 'object') {
    const fromUser =
      user.full_name ||
      user.name ||
      user.username ||
      [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (fromUser) return fromUser;
  }
  const flat = [c?.user_first_name, c?.user_last_name].filter(Boolean).join(' ');
  return flat || '—';
};

const caseUserPhone = (c) => {
  const user = c?.user || c?.marketplace_user;
  if (user && typeof user === 'object' && user.phone) return user.phone;
  return c?.user_phone || '—';
};

const caseStatusLabel = (c) => c?.status ?? c?.case_status ?? 'open';

const caseScoreLabel = (c) => {
  const score = c?.score ?? c?.rating_score;
  if (score == null || score === '' || typeof score === 'object') return '—';
  return String(score);
};

const caseNoteLabel = (c) =>
  asDisplayText(c?.note) || asDisplayText(c?.comment) || asDisplayText(c?.template_comment) || '—';

const CommentaryPage = () => {
  const { showError, showSuccess } = useSnackbar();
  const { can } = usePermissions();
  const showSettings = can('kommentariya shablonlari');
  const showComments = can('kommentariyalar');
  const [activeTab, setActiveTab] = useState(() => (showSettings ? 'settings' : 'comments'));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [openForm, setOpenForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [commentCases, setCommentCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [caseFilters, setCaseFilters] = useState({ status: '', escalated: '' });
  const [casesPagination, setCasesPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [activeCase, setActiveCase] = useState(null);
  const [caseDetailOpen, setCaseDetailOpen] = useState(false);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await commentTemplateAPI.getAll({ page: pagination.page, limit: pagination.limit });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      const sorted = [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      setRows(sorted);
      setPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) || sorted.length,
        pages:
          Number(payload.total_pages) ||
          Math.max(1, Math.ceil((Number(payload.total) || sorted.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      const pe = resolvePageError(e);
      if (pe) setPageError(pe);
      else showError(e.message || "Kommentariya shablonlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (activeTab === 'settings' && showSettings) fetchList();
  }, [activeTab, showSettings, fetchList]);

  const fetchCommentCases = useCallback(async () => {
    if (!showComments) return;
    setCasesLoading(true);
    setPageError(null);
    try {
      const res = await productCommentsAPI.getAll({
        page: casesPagination.page,
        limit: casesPagination.limit,
        status: caseFilters.status || undefined,
        escalated: caseFilters.escalated === '' ? undefined : caseFilters.escalated,
      });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setCommentCases(items);
      setCasesPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) || items.length,
        pages:
          Number(payload.total_pages) ||
          Math.max(1, Math.ceil((Number(payload.total) || items.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      const pe = resolvePageError(e);
      if (pe) setPageError(pe);
      else showError(e.message || "Kommentariyalar ro'yxatini yuklab bo'lmadi");
    } finally {
      setCasesLoading(false);
    }
  }, [showComments, casesPagination.page, casesPagination.limit, caseFilters.status, caseFilters.escalated]);

  useEffect(() => {
    if (activeTab === 'comments' && showComments) fetchCommentCases();
  }, [activeTab, showComments, fetchCommentCases]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpenForm(true);
  };

  const openEdit = async (row) => {
    setFormLoading(true);
    try {
      const res = await commentTemplateAPI.getById(row.id);
      const item = res.data || row;
      setEditing(item);
      setForm({
        comment: item.comment || item.body || '',
        status: item.status || 'active',
      });
      setOpenForm(true);
    } catch (e) {
      showError(e.message || "Shablonni ochib bo'lmadi");
    } finally {
      setFormLoading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) {
      showError("Kommentariya matni to'ldirilishi shart");
      return;
    }
    if (!['active', 'inactive'].includes(form.status)) {
      showError("Status noto'g'ri");
      return;
    }
    setFormLoading(true);
    try {
      if (editing?.id) {
        await commentTemplateAPI.update(editing.id, form);
        showSuccess('Shablon yangilandi');
      } else {
        await commentTemplateAPI.create(form);
        showSuccess('Shablon yaratildi');
      }
      setOpenForm(false);
      setEditing(null);
      setForm(defaultForm);
      fetchList();
    } catch (e) {
      showError(e.message || "Saqlashda xatolik");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleteLoading(true);
    try {
      await commentTemplateAPI.remove(deleteRow.id);
      showSuccess("Shablon o'chirildi");
      setDeleteRow(null);
      fetchList();
    } catch (e) {
      showError(e.message || "O'chirishda xatolik");
    } finally {
      setDeleteLoading(false);
    }
  };

  const moveRow = async (index, direction) => {
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    if (otherIndex < 0 || otherIndex >= rows.length) return;
    const from = rows[index];
    const to = rows[otherIndex];
    if (!from?.id || !to?.id) return;
    setBusyId(from.id);
    try {
      await commentTemplateAPI.reorder(from.id, to.id);
      showSuccess("Tartib yangilandi");
      fetchList();
    } catch (e) {
      showError(e.message || "Reorderda xatolik");
    } finally {
      setBusyId(null);
    }
  };

  const renderedRows = useMemo(() => rows, [rows]);

  const openCaseDetail = async (row) => {
    setCaseDetailOpen(true);
    setCaseDetailLoading(true);
    setActionNote('');
    try {
      const res = await productCommentsAPI.getById(caseRatingId(row));
      setActiveCase(res.data || row);
    } catch (e) {
      showError(e.message || "Kommentariya case ochilmadi");
      setCaseDetailOpen(false);
    } finally {
      setCaseDetailLoading(false);
    }
  };

  const runCaseAction = async (actionType) => {
    if (!activeCase) return;
    const ratingId = caseRatingId(activeCase);
    if (!ratingId) return;
    setActionLoading(true);
    try {
      if (!actionNote.trim()) {
        showError("Action uchun izoh yozing");
        setActionLoading(false);
        return;
      }
      if (actionType === 'note') await productCommentsAPI.addNote(ratingId, actionNote.trim());
      if (actionType === 'call') await productCommentsAPI.addCall(ratingId, actionNote.trim());
      if (actionType === 'resolve') await productCommentsAPI.resolve(ratingId, actionNote.trim());
      const refreshed = await productCommentsAPI.getById(ratingId);
      setActiveCase(refreshed.data || activeCase);
      setActionNote('');
      showSuccess('Harakat saqlandi');
      fetchCommentCases();
    } catch (e) {
      showError(e.message || 'Harakatni saqlab bo‘lmadi');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!showSettings && showComments) setActiveTab('comments');
    else if (showSettings && !showComments) setActiveTab('settings');
  }, [showSettings, showComments]);

  useEffect(() => {
    setPageError(null);
  }, [activeTab]);

  if (pageError) {
    return <ContentStatusPanel status={pageError.status} message={pageError.message} />;
  }

  return (
    <div className="space-y-6">
      {showSettings && showComments && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {showSettings && (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`${tabBase} ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Kommentariya shablonlari
              </button>
            )}
            {showComments && (
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`${tabBase} ${activeTab === 'comments' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Kommentariyalar
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && showComments && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={caseFilters.status}
              onChange={(e) => {
                const v = e.target.value;
                setCaseFilters((f) => ({ ...f, status: v }));
                setCasesPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Barcha statuslar</option>
              <option value="open">open</option>
              <option value="escalated_to_admin">escalated_to_admin</option>
              <option value="resolved">resolved</option>
            </select>
            <select
              value={caseFilters.escalated}
              onChange={(e) => {
                const v = e.target.value;
                setCaseFilters((f) => ({ ...f, escalated: v }));
                setCasesPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Escalated: barchasi</option>
              <option value="true">Escalated = true</option>
              <option value="false">Escalated = false</option>
            </select>
            <select
              value={casesPagination.limit}
              onChange={(e) => setCasesPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
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
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Case ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Foydalanuvchi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Mahsulot / Kontragent</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Reyting</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Yangilangan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Amal</th>
                </tr>
              </thead>
              <tbody>
                {casesLoading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
                ) : commentCases.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Case topilmadi</td></tr>
                ) : (
                  commentCases.map((c) => {
                    const product = c.product || {};
                    const contragent = c.contragent || {};
                    const status = caseStatusLabel(c);
                    const note = caseNoteLabel(c);
                    const rowId = caseRatingId(c);
                    return (
                      <tr key={rowId ?? `${c.product_id}-${c.user_id}-${c.created_at}`} className="border-b border-gray-100 hover:bg-gray-50/70 align-top">
                        <td className="px-4 py-3 text-gray-800 font-medium">{rowId ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 font-medium">{caseUserLabel(c)}</p>
                          <p className="text-xs text-gray-500">{caseUserPhone(c)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 font-medium">{product.name || c.product_name || '—'}</p>
                          <p className="text-xs text-gray-500">{contragent.name || contragent.company_name || c.contragent_name || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <p className="font-semibold">{caseScoreLabel(c)}</p>
                          <p className="text-xs text-gray-500 max-w-[280px] truncate" title={note === '—' ? '' : note}>{note}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : status === 'escalated_to_admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(c.updatedAt || c.updated_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openCaseDetail(c)}
                            className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md"
                            title="Batafsil"
                          >
                            <Visibility fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Jami: <span className="font-semibold">{casesPagination.total}</span></p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={casesPagination.page <= 1}
                onClick={() => setCasesPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-600">{casesPagination.page} / {Math.max(1, casesPagination.pages)}</span>
              <button
                type="button"
                disabled={casesPagination.page >= Math.max(1, casesPagination.pages)}
                onClick={() => setCasesPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Keyingi
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'settings' && showSettings && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Kommentariya shablonlari</h3>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <Add />
              Yangi shablon
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 w-20">Tartib</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[360px]">Kommentariya</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
                ) : renderedRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Shablonlar topilmadi</td></tr>
                ) : (
                  renderedRows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-gray-700">{row.sortOrder ?? row.sort_order ?? idx + 1}</td>
                      <td className="px-4 py-3 text-gray-900">{row.comment || row.body || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {row.status === 'active' ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={busyId === row.id || idx === 0}
                          onClick={() => moveRow(idx, 'up')}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-md mr-1 disabled:opacity-40"
                          title="Yuqoriga"
                        >
                          <ArrowUpward fontSize="small" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id || idx === renderedRows.length - 1}
                          onClick={() => moveRow(idx, 'down')}
                          className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-md mr-1 disabled:opacity-40"
                          title="Pastga"
                        >
                          <ArrowDownward fontSize="small" />
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
        </>
      )}

      {caseDetailOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setCaseDetailOpen(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Kommentariya case</h3>
              <button type="button" onClick={() => setCaseDetailOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {caseDetailLoading ? (
                <p className="text-gray-500">Yuklanmoqda...</p>
              ) : activeCase ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p><span className="text-gray-500">Case ID:</span> <span className="font-medium">{caseRatingId(activeCase) ?? '—'}</span></p>
                    <p><span className="text-gray-500">Status:</span> <span className="font-medium">{caseStatusLabel(activeCase)}</span></p>
                    <p><span className="text-gray-500">Foydalanuvchi:</span> <span className="font-medium">{caseUserLabel(activeCase)}</span></p>
                    <p><span className="text-gray-500">Telefon:</span> <span className="font-medium">{caseUserPhone(activeCase)}</span></p>
                    <p><span className="text-gray-500">Region:</span> <span className="font-medium">{activeCase.user?.region?.name || activeCase.region_name || activeCase.user?.region_id || activeCase.user_region_id || '—'}</span></p>
                    <p><span className="text-gray-500">Reyting:</span> <span className="font-medium">{caseScoreLabel(activeCase)}</span></p>
                    <p><span className="text-gray-500">Mahsulot:</span> <span className="font-medium">{activeCase.product?.name || activeCase.product_name || '—'}</span></p>
                    <p><span className="text-gray-500">Kontragent:</span> <span className="font-medium">{activeCase.contragent?.name || activeCase.contragent?.company_name || activeCase.contragent_name || '—'}</span></p>
                  </div>
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Mijoz izohi</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{caseNoteLabel(activeCase)}</p>
                  </div>

                  <div className="border border-gray-200 rounded-md p-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">Yangi action</p>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      rows={3}
                      placeholder="Izoh yozing..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => runCaseAction('note')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Edit fontSize="inherit" />
                        Note qo'shish
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => runCaseAction('call')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Phone fontSize="inherit" />
                        Call qo'shish
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => runCaseAction('resolve')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle fontSize="inherit" />
                        Resolve
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-2">Activity log</p>
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-100 bg-white">
                      {(Array.isArray(activeCase.activityLog) ? activeCase.activityLog : []).length === 0 ? (
                        <div className="px-3 py-3 text-xs text-gray-500">Activity log mavjud emas</div>
                      ) : (
                        (activeCase.activityLog || []).map((entry, idx) => (
                          <div key={entry.id || idx} className="px-3 py-2 text-xs">
                            <p className="text-gray-800">
                              <span className="font-medium">{entry.action || entry.type || 'action'}</span>
                              {' · '}
                              <span className="text-gray-500">{fmtDate(entry.created_at || entry.createdAt)}</span>
                            </p>
                            <p className="text-gray-600 whitespace-pre-wrap">{asDisplayText(entry.note) || asDisplayText(entry.message) || '—'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {openForm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => !formLoading && setOpenForm(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-2xl rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? 'Shablonni tahrirlash' : 'Yangi shablon'}</h3>
              <button type="button" onClick={() => setOpenForm(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <form onSubmit={submitForm} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kommentariya</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
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

      {deleteRow && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleteLoading && setDeleteRow(null)} />
          <div className="relative bg-white shadow-xl w-full max-w-md rounded-lg">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Shablonni o'chirish</h3>
              <p className="text-sm text-gray-600 mt-2">
                «{deleteRow.comment || deleteRow.body || 'Ushbu shablon'}» butunlay o‘chiriladi. Davom etasizmi?
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

export default CommentaryPage;
