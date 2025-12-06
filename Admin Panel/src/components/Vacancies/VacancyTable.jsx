import { motion } from 'framer-motion';
import { Visibility, Delete, Edit, Description } from '@mui/icons-material';

const VacancyTable = ({ vacancies, loading, onView, onEdit, onDelete, onViewApplications, pagination, onPageChange }) => {
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

  const getTargetBadge = (target) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (target) {
      case 'agent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'punkt':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (type) {
      case 'fulltime':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'parttime':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTargetLabel = (target) => {
    switch (target) {
      case 'agent':
        return 'Agent';
      case 'punkt':
        return 'Punkt';
      default:
        return target;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'fulltime':
        return 'To\'liq kunlik';
      case 'parttime':
        return 'Yarim kunlik';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Vakansiyalar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nomi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maqsad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maosh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Savollar soni
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yaratilgan
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vacancies.map((vacancy, index) => (
              <motion.tr
                key={vacancy._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(pagination.page - 1) * pagination.limit + index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{vacancy.name || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getTargetBadge(vacancy.target)}>
                    {getTargetLabel(vacancy.target)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getTypeBadge(vacancy.type)}>
                    {getTypeLabel(vacancy.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{vacancy.salary || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {vacancy.questions?.length || 0} ta
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(vacancy.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(vacancy)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Batafsil ko'rish"
                    >
                      <Visibility className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onViewApplications(vacancy)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                      title="So'rovnomalar"
                    >
                      <Description className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(vacancy)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(vacancy)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="O'chirish"
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> ta vakansiyadan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              ko'rsatilmoqda
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Oldingi
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        pageNum === pagination.page
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Keyingi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacancyTable;

