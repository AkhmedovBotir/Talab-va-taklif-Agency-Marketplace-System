import { Refresh, Timeline } from '@mui/icons-material';

const formatCurrency = (value) => {
  if (!value) return '0';
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const KPITransactionsPreview = ({ transactions, loading, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Timeline className="text-indigo-600" />
            So‘nggi KPI tranzaksiyalar
          </h2>
          <p className="text-sm text-gray-500">Eng so‘nggi 5 ta tranzaksiya</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <Refresh className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Tranzaksiyalar topilmadi
        </div>
      ) : (
        <div className="overflow-y-auto custom-scrollbar max-h-[360px]">
          <ul className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <li key={tx._id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Buyurtma № {tx.order?.orderNumber || '—'}
                    </p>
                    <p className="text-xs text-gray-500">{tx.orderStatus || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tx.totalKpiAmount)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        tx.isPaid ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {tx.isPaid ? 'To‘langan' : 'Kutilmoqda'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default KPITransactionsPreview;


