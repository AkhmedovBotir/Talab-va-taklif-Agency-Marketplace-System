import { useState } from 'react';
import { motion } from 'framer-motion';
import { Visibility, CheckCircle, Cancel, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatDateTime } from '../../utils/dateFormatter';

const SubmissionTable = ({ submissions, loading, onView, onRefresh }) => {
  const { showSuccess, showError } = useSnackbar();
  const [processing, setProcessing] = useState({});
  const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
  
  // Faqat pending statusdagi topshiruvlarni tanlash mumkin
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const allSelected = pendingSubmissions.length > 0 && selectedSubmissions.size === pendingSubmissions.length;
  const someSelected = selectedSubmissions.size > 0 && selectedSubmissions.size < pendingSubmissions.length;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleConfirm = async (submissionId) => {
    setProcessing({ ...processing, [submissionId]: 'confirm' });
    try {
      const response = await financeAPI.confirmSubmission(submissionId);
      if (response.success) {
        showSuccess(response.message || 'Topshiruv muvaffaqiyatli tasdiqlandi');
        onRefresh?.();
      }
    } catch (error) {
      showError(error.message || 'Topshiruvni tasdiqlashda xatolik');
    } finally {
      setProcessing({ ...processing, [submissionId]: false });
    }
  };

  const handleReject = async (submissionId) => {
    const reason = prompt('Rad etish sababini kiriting:');
    if (!reason || !reason.trim()) {
      return;
    }

    setProcessing({ ...processing, [submissionId]: 'reject' });
    try {
      const response = await financeAPI.rejectSubmission(submissionId, reason);
      if (response.success) {
        showSuccess(response.message || 'Topshiruv rad etildi');
        setSelectedSubmissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(submissionId);
          return newSet;
        });
        onRefresh?.();
      }
    } catch (error) {
      showError(error.message || 'Topshiruvni rad etishda xatolik');
    } finally {
      setProcessing({ ...processing, [submissionId]: false });
    }
  };

  // Barchasini belgilash/bekor qilish
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedSubmissions(new Set());
    } else {
      const allIds = new Set(pendingSubmissions.map(s => s._id));
      setSelectedSubmissions(allIds);
    }
  };

  // Bitta topshiruvni belgilash/bekor qilish
  const handleSelectSubmission = (submissionId) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  // Tanlanganlarni tasdiqlash
  const handleConfirmSelected = async () => {
    if (selectedSubmissions.size === 0) {
      showError('Hech qanday topshiruv tanlanmagan');
      return;
    }

    const confirmMessage = `${selectedSubmissions.size} ta topshiruvni tasdiqlashni xohlaysizmi?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const selectedArray = Array.from(selectedSubmissions);
    let successCount = 0;
    let errorCount = 0;

    // Barcha tanlangan topshiruvlarni ketma-ket tasdiqlash
    for (const submissionId of selectedArray) {
      setProcessing({ ...processing, [submissionId]: 'confirm' });
      try {
        const response = await financeAPI.confirmSubmission(submissionId);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      } finally {
        setProcessing(prev => ({ ...prev, [submissionId]: false }));
      }
    }

    if (successCount > 0) {
      showSuccess(`${successCount} ta topshiruv muvaffaqiyatli tasdiqlandi`);
    }
    if (errorCount > 0) {
      showError(`${errorCount} ta topshiruvni tasdiqlashda xatolik yuz berdi`);
    }

    setSelectedSubmissions(new Set());
    onRefresh?.();
  };

  // Tanlanganlarni rad etish
  const handleRejectSelected = async () => {
    if (selectedSubmissions.size === 0) {
      showError('Hech qanday topshiruv tanlanmagan');
      return;
    }

    const reason = prompt('Rad etish sababini kiriting:');
    if (!reason || !reason.trim()) {
      return;
    }

    const confirmMessage = `${selectedSubmissions.size} ta topshiruvni rad etishni xohlaysizmi?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const selectedArray = Array.from(selectedSubmissions);
    let successCount = 0;
    let errorCount = 0;

    // Barcha tanlangan topshiruvlarni ketma-ket rad etish
    for (const submissionId of selectedArray) {
      setProcessing({ ...processing, [submissionId]: 'reject' });
      try {
        const response = await financeAPI.rejectSubmission(submissionId, reason);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      } finally {
        setProcessing(prev => ({ ...prev, [submissionId]: false }));
      }
    }

    if (successCount > 0) {
      showSuccess(`${successCount} ta topshiruv rad etildi`);
    }
    if (errorCount > 0) {
      showError(`${errorCount} ta topshiruvni rad etishda xatolik yuz berdi`);
    }

    setSelectedSubmissions(new Set());
    onRefresh?.();
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

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Topshiruvlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Action Bar */}
      {selectedSubmissions.size > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-indigo-900">
              {selectedSubmissions.size} ta topshiruv tanlangan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmSelected}
              disabled={Array.from(selectedSubmissions).some(id => processing[id])}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Tanlanganlarni tasdiqlash
            </button>
            <button
              onClick={handleRejectSelected}
              disabled={Array.from(selectedSubmissions).some(id => processing[id])}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <Cancel className="w-4 h-4" />
              Tanlanganlarni rad etish
            </button>
            <button
              onClick={() => setSelectedSubmissions(new Set())}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {pendingSubmissions.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center"
                    title={allSelected ? 'Barchasini bekor qilish' : 'Barchasini belgilash'}
                  >
                    {allSelected ? (
                      <CheckBox className="w-5 h-5 text-indigo-600" />
                    ) : someSelected ? (
                      <div className="w-5 h-5 border-2 border-indigo-600 rounded bg-indigo-100" />
                    ) : (
                      <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaksiyalar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sana
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission, index) => {
              const isSelected = selectedSubmissions.has(submission._id);
              const isPending = submission.status === 'pending';
              
              return (
                <motion.tr
                  key={submission._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isPending && (
                      <button
                        onClick={() => handleSelectSubmission(submission._id)}
                        className="flex items-center justify-center"
                        title={isSelected ? 'Bekor qilish' : 'Belgilash'}
                      >
                        {isSelected ? (
                          <CheckBox className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <CheckBoxOutlineBlank className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {submission.fromAgent?.name || '-'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {submission.fromAgent?.phone || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatAmount(submission.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {submission.transactionsCount || 0} ta
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(submission.submissionDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      submission.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {submission.status === 'confirmed'
                      ? 'Tasdiqlangan'
                      : submission.status === 'rejected'
                      ? 'Rad etilgan'
                      : 'Kutilmoqda'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(submission)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Batafsil ko'rish"
                    >
                      <Visibility className="w-4 h-4" />
                    </button>
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(submission._id)}
                          disabled={processing[submission._id]}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                          title="Tasdiqlash"
                        >
                          {processing[submission._id] === 'confirm' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-300 border-t-green-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(submission._id)}
                          disabled={processing[submission._id]}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Rad etish"
                        >
                          {processing[submission._id] === 'reject' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-red-600"></div>
                          ) : (
                            <Cancel className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionTable;

