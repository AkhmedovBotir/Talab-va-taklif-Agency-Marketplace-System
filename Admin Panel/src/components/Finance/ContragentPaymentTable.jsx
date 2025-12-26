import { motion } from 'framer-motion';
import { CheckCircle, Warning, CalendarToday, Payment } from '@mui/icons-material';

const ContragentPaymentTable = ({
  payments,
  loading,
  pagination,
  onPageChange,
  activeView,
  selectedPayments,
  onSelectPayment,
  onSelectAll,
  onPaySingle,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(num);
  };

  const isAllSelected = payments.length > 0 && selectedPayments.length === payments.length;
  const isIndeterminate = selectedPayments.length > 0 && selectedPayments.length < payments.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto text-gray-400 text-5xl mb-4" />
        <p className="text-gray-500 text-lg">
          {activeView === 'unpaid' ? 'To\'lanmagan to\'lovlar topilmadi' : 'To\'langan to\'lovlar topilmadi'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {activeView === 'unpaid' && (
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contragent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Summa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Buyurtmalar soni
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To'lov muddati
            </th>
            {activeView === 'unpaid' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holati
              </th>
            )}
            {activeView === 'paid' && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To'landi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To'lovchi
                </th>
              </>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qo'shimcha
            </th>
            {activeView === 'unpaid' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment, index) => {
            const isSelected = selectedPayments.includes(payment._id);
            return (
              <motion.tr
                key={payment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
              >
                {activeView === 'unpaid' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectPayment(payment._id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.contragent?.name || '-'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.contragent?.inn && `INN: ${payment.contragent.inn}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.contragent?.phone || '-'}
                  </div>
                  {(payment.contragent?.viloyat || payment.contragent?.tuman || payment.contragent?.mfy) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {[
                        payment.contragent?.viloyat?.name,
                        payment.contragent?.tuman?.name,
                        payment.contragent?.mfy?.name,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(payment.amount)} so'm
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {payment.orders?.length || 0} ta
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <CalendarToday className="w-4 h-4" />
                    {formatDate(payment.dueDate)}
                  </div>
                </td>
                {activeView === 'unpaid' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        <Warning className="w-3 h-3" />
                        Muddat o'tgan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Warning className="w-3 h-3" />
                        To'lanmagan
                      </span>
                    )}
                  </td>
                )}
                {activeView === 'paid' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(payment.paidAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {payment.paidBy?.name || '-'}
                      </div>
                    </td>
                  </>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {payment.notes || '-'}
                  </div>
                </td>
                {activeView === 'unpaid' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {onPaySingle && (
                      <button
                        onClick={() => onPaySingle(payment._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <Payment className="w-3 h-3" />
                        To'lash
                      </button>
                    )}
                  </td>
                )}
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Jami <span className="font-medium">{pagination.total}</span> ta to'lovdan{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            ko'rsatilmoqda
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Oldingi
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContragentPaymentTable;







