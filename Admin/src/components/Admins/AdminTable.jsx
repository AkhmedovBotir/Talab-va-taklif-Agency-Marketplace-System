import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Delete, Visibility, FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const AdminTable = ({ admins, loading, onEdit, onDelete, onView, pagination, onPageChange, onStatusChange }) => {
  const [updatingStatus, setUpdatingStatus] = useState({});
  const { showSuccess, showError } = useSnackbar();

  const handleStatusToggle = async (admin, newStatus) => {
    const adminId = admin.id ?? admin._id;
    setUpdatingStatus({ ...updatingStatus, [adminId]: true });
    try {
      const response = await adminAPI.updateAdminStatus(adminId, newStatus);
      if (response.success) {
        showSuccess(response.message || 'Status muvaffaqiyatli yangilandi');
        onStatusChange?.();
      }
    } catch (error) {
      showError(error.message || 'Status yangilashda xatolik');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [adminId]: false });
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

  if (admins.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Adminlar topilmadi</p>
      </div>
    );
  }

  const getVisiblePages = () => {
    const totalPages = pagination.pages || 0;
    const current = pagination.page || 1;

    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

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
                To'liq ism
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {admins.map((admin, index) => {
              const isGeneralRole = admin.role === 'general';
              
              return (
                <motion.tr
                  key={admin.id ?? admin._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{admin.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.role === 'admin' ? 'Admin' : 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className={`relative inline-flex items-center ${isGeneralRole ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={admin.status === 'active'}
                        onChange={(e) => {
                          const newStatus = e.target.checked ? 'active' : 'inactive';
                          handleStatusToggle(admin, newStatus);
                        }}
                        disabled={updatingStatus[admin.id ?? admin._id] || isGeneralRole}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${isGeneralRole ? 'opacity-50 cursor-not-allowed' : ''} disabled:opacity-50`}></div>
                      <span className={`ml-3 text-sm ${isGeneralRole ? 'text-gray-400' : 'text-gray-700'}`}>
                        {admin.status === 'active' ? 'Faol' : 'Nofaol'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTableDate(admin.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {/* View button - always enabled */}
                      <button
                        onClick={() => onView(admin)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Batafsil ko'rish"
                      >
                        <Visibility className="w-4 h-4" />
                      </button>
                      {/* Edit button - disabled for general role */}
                      {isGeneralRole ? (
                        <button
                          disabled
                          className="text-gray-300 cursor-not-allowed p-1 rounded transition-colors"
                          title="General role uchun tahrirlash mumkin emas"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onEdit(admin)}
                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1 rounded transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button - disabled for general role */}
                      {isGeneralRole ? (
                        <button
                          disabled
                          className="text-gray-300 cursor-not-allowed p-1 rounded transition-colors"
                          title="General role uchun o'chirish mumkin emas"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onDelete(admin)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                          title="O'chirish"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> ta admindan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              ko'rsatilmoqda
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <FirstPage className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
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
                      onClick={() => onPageChange(pageNum)}
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
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <span>Keyingi</span>
                <NavigateNext className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
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

export default AdminTable;

