import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const CommentTemplateTable = ({ templates, loading, onEdit, onDelete, onView, onStatusChange }) => {
  const [updatingStatus, setUpdatingStatus] = useState({});
  const { showSuccess, showError } = useSnackbar();

  const handleStatusToggle = async (template, newStatus) => {
    setUpdatingStatus({ ...updatingStatus, [template._id]: true });
    try {
      const response = await reviewAPI.updateCommentTemplate(template._id, {
        ...template,
        isActive: newStatus,
      });
      if (response.success) {
        showSuccess('Status muvaffaqiyatli yangilandi');
        onStatusChange?.();
      }
    } catch (error) {
      showError(error.message || 'Status yangilashda xatolik');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [template._id]: false });
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

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Kommentariya shablonlari topilmadi</p>
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
                Matn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tartib
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
            {templates.map((template, index) => (
              <motion.tr
                key={template._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{template.text || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{template.order || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.isActive === true}
                      onChange={(e) => {
                        const newStatus = e.target.checked;
                        handleStatusToggle(template, newStatus);
                      }}
                      disabled={updatingStatus[template._id]}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                    <span className="ml-3 text-sm text-gray-700">
                      {template.isActive === true ? 'Faol' : 'Nofaol'}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTableDate(template.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(template)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Batafsil ko'rish"
                    >
                      <Visibility className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(template)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(template)}
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
    </div>
  );
};

export default CommentTemplateTable;





