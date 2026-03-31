import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Delete, Visibility, FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { agentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const entityIdStr = (id) => {
  if (id == null || id === '') return null;
  return String(id);
};

const buildNameMap = (list) => {
  const m = new Map();
  for (const x of list || []) {
    const k = entityIdStr(x?.id ?? x?._id);
    if (k && x?.name != null && x.name !== '') m.set(k, x.name);
  }
  return m;
};

const lookupName = (map, id) => {
  const k = entityIdStr(id);
  if (!k) return null;
  return map.get(k) ?? null;
};

const AgentTable = ({
  rows,
  loading,
  onEdit,
  onDelete,
  onView,
  pagination,
  onPageChange,
  onRefresh,
  regions = [],
  districts = [],
  mfys = [],
}) => {
  const [updatingStatus, setUpdatingStatus] = useState({});
  const { showSuccess, showError } = useSnackbar();

  const regionMap = useMemo(() => buildNameMap(regions), [regions]);
  const districtMap = useMemo(() => buildNameMap(districts), [districts]);
  const mfyMap = useMemo(() => buildNameMap(mfys), [mfys]);

  const regionLabel = (row) =>
    row.region?.name ||
    row.region_name ||
    lookupName(regionMap, row.viloyat_id ?? row.region_id) ||
    '-';
  const districtLabel = (row) =>
    row.district?.name ||
    row.district_name ||
    lookupName(districtMap, row.tuman_id ?? row.district_id) ||
    '-';
  const mfyLabel = (row) =>
    row.mfy?.name || row.mfy_name || lookupName(mfyMap, row.mfy_id) || '-';

  const getVisiblePages = () => {
    const totalPages = pagination.pages || 0;
    const current = pagination.page || 1;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

  const handleStatusToggle = async (row, status) => {
    const id = row.id ?? row._id;
    setUpdatingStatus((p) => ({ ...p, [id]: true }));
    try {
      const res = await agentAPI.updateStatus(id, status);
      if (res.success) {
        showSuccess(res.message || 'Status yangilandi');
        onRefresh?.();
      }
    } catch (e) {
      showError(e.message || 'Status yangilashda xatolik');
    } finally {
      setUpdatingStatus((p) => ({ ...p, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Agentlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F.I.Sh.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFY</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yaratilgan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, index) => {
              const id = row.id ?? row._id;
              return (
                <motion.tr
                  key={id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{regionLabel(row)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{districtLabel(row)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{mfyLabel(row)}</td>
                  <td className="px-4 py-3 text-sm">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.status === 'active'}
                        onChange={(e) => handleStatusToggle(row, e.target.checked ? 'active' : 'inactive')}
                        disabled={updatingStatus[id]}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50" />
                    </label>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatTableDate(row.createdAt || row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(row)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        title="Ko‘rish"
                      >
                        <Visibility className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                        title="Tahrirlash"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                        title="O‘chirish"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> tadan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              ko‘rsatilmoqda
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                <FirstPage className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                <NavigateBefore className="w-4 h-4" />
                Oldingi
              </button>
              <div className="flex items-center gap-1">
                {getVisiblePages().map((p, idx) =>
                  p === '...' ? (
                    <span key={`e-${idx}`} className="px-1 text-gray-500">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPageChange(p)}
                      className={`min-w-[2.25rem] px-2 py-1.5 border rounded-md text-sm ${
                        p === pagination.page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Keyingi
                <NavigateNext className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                <LastPage className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTable;
