import { motion } from 'framer-motion';
import { Visibility, Delete, ChevronLeft, ChevronRight } from '@mui/icons-material';

const targetTypeLabels = {
  all: 'Barchaga',
  punkts: 'Punktlar',
  viloyat_agents: 'Viloyat agentlari',
  tuman_agents: 'Tuman agentlari',
  mfy_agents: 'MFY agentlari',
  marketplace_users: 'Marketplace foydalanuvchilari',
  contragents: 'Kontragentlar',
  vacancy_applicants: 'Vakansiya nomzodlari',
};

const notificationTypeConfig = {
  info: { label: "Ma'lumot", color: 'bg-blue-100 text-blue-800' },
  warning: { label: 'Ogohlantirish', color: 'bg-yellow-100 text-yellow-800' },
  success: { label: 'Muvaffaqiyat', color: 'bg-green-100 text-green-800' },
  error: { label: 'Xatolik', color: 'bg-red-100 text-red-800' },
  announcement: { label: "E'lon", color: 'bg-purple-100 text-purple-800' },
  promotion: { label: 'Aksiya', color: 'bg-orange-100 text-orange-800' },
  update: { label: 'Yangilanish', color: 'bg-cyan-100 text-cyan-800' },
};

const NotificationTable = ({
  notifications,
  loading,
  onView,
  onDelete,
  pagination,
  onPageChange,
  currentTargetType,
  onTargetTypeChange,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Target type tabs */}
      {onTargetTypeChange && (
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4 px-4 overflow-x-auto pb-1 pt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {[
              { value: '', label: 'Barchasi' },
              ...Object.entries(targetTypeLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ].map((item) => {
              const isActive = currentTargetType === item.value || (!currentTargetType && item.value === '');
              return (
                <button
                  key={item.value || 'all'}
                  type="button"
                  onClick={() => onTargetTypeChange(item.value)}
                  className={`relative pb-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full transition-opacity ${
                      isActive ? 'bg-indigo-600 opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Yuklanmoqda...</span>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Xabarlar topilmadi</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sarlavha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qabul qiluvchi
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
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.map((notification, index) => {
                const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.info;
                return (
                  <motion.tr
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                        <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {targetTypeLabels[notification.targetType] || notification.targetType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notification.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(notification.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(notification)}
                          className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Ko'rish"
                        >
                          <Visibility className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(notification)}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="O'chirish"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Jami: {pagination.total} ta xabar
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationTable;

