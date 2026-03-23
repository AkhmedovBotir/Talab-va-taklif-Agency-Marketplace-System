import { motion } from 'framer-motion';
import { CheckCircle, RadioButtonUnchecked, Edit, Delete, PlayArrow, Add } from '@mui/icons-material';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const KPIDistributionList = ({
  distributions,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  onFilterChange,
  activeFilter,
  onEdit,
  onDelete,
  onActivate,
  onCreate,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">KPI taqsimlashlari</h2>
          <p className="text-sm text-gray-500">
            Faol konfiguratsiyani boshqaring va yangi variantlarni tahrirlang
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Add className="w-4 h-4" />
            Yangi taqsimlash
          </button>
          <select
            value={activeFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faqat faol</option>
            <option value="inactive">Faqat nofaol</option>
          </select>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} tadan
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : distributions.length === 0 ? (
        <div className="p-10 text-center text-gray-500">Taqsimlashlar topilmadi</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taqsimlash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {distributions.map((distribution, index) => (
                  <motion.tr
                    key={distribution._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{distribution.name}</div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {distribution.description || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="space-y-2">
                        {/* Asosiy taqsimlashlar */}
                        <div className="flex flex-wrap gap-2">
                          {['punkt', 'agent', 'manager', 'finance', 'deliveryService'].map(
                            (key) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-xs"
                              >
                                <span className="font-medium text-indigo-700">
                                  {key === 'punkt'
                                    ? 'Punkt'
                                    : key === 'agent'
                                    ? 'Agent'
                                    : key === 'manager'
                                    ? 'Menejer'
                                    : key === 'finance'
                                    ? 'Moliya'
                                    : 'Yetkazib Berish'}
                                  :
                                </span>
                                <span className="text-indigo-900 font-semibold">
                                  {distribution.distribution?.[key] ?? 0}%
                                </span>
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          distribution.isActive
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}
                      >
                        {distribution.isActive ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <RadioButtonUnchecked className="w-4 h-4" />
                        )}
                        {distribution.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(distribution.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!distribution.isActive && (
                          <button
                            onClick={() => onActivate(distribution)}
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md"
                          >
                            <PlayArrow className="w-4 h-4" />
                            Faollashtirish
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(distribution)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(distribution)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="O‘chirish"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Jami <span className="font-medium">{pagination.total}</span> ta taqsimlashdan{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                ko‘rsatilmoqda
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Oldingi
                </button>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KPIDistributionList;


