import { motion } from 'framer-motion';
import { formatTableDate } from '../../../utils/dateFormatter';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const getCategoryLabel = (category) => {
  const labels = {
    admin_to_punkt: 'Punktga yuborilgan',
  };
  return labels[category] || category || '-';
};

const AdminTransactionsTable = ({ transactions, loading, pagination, onPageChange }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
        Transaksiyalar topilmadi
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategoriya</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kimdan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kimga</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tavsif</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => (
              <motion.tr
                key={transaction._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {transaction.type === 'income' ? 'Kirim' : 'Chiqim'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {getCategoryLabel(transaction.category)}
                </td>
                <td className="px-4 py-3">
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatNumber(transaction.amount)} so'm
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {transaction.fromUser?.userType ? (
                    <div>
                      <div className="font-medium">
                        {transaction.fromUser?.userId?.name || transaction.fromUser?.userType || '-'}
                      </div>
                      {transaction.fromUser?.userId?.phone && (
                        <div className="text-xs text-gray-500">{transaction.fromUser.userId.phone}</div>
                      )}
                      {!transaction.fromUser?.userId?.phone && transaction.fromUser?.userType && (
                        <div className="text-xs text-gray-500">{transaction.fromUser.userType}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {transaction.toUser?.userType ? (
                    <div>
                      <div className="font-medium">
                        {transaction.toUser?.userId?.name || transaction.toUser?.userType || '-'}
                      </div>
                      {transaction.toUser?.userId?.phone && (
                        <div className="text-xs text-gray-500">{transaction.toUser.userId.phone}</div>
                      )}
                      {!transaction.toUser?.userId?.phone && transaction.toUser?.userType && (
                        <div className="text-xs text-gray-500">{transaction.toUser.userType}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={transaction.description || ''}>
                  {transaction.description || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : transaction.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {transaction.status === 'completed' ? 'Bajarildi' : 
                     transaction.status === 'pending' ? 'Kutilmoqda' : 
                     transaction.status || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatTableDate(transaction.createdAt)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Jami <span className="font-medium">{pagination.total}</span> ta transaksiyadan{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            ko'rsatilmoqda
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
  );
};

export default AdminTransactionsTable;
