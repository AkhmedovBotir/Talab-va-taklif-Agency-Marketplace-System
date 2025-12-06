import { BarChart, Refresh } from '@mui/icons-material';

const statItems = [
  {
    label: 'Jami tranzaksiyalar',
    key: 'totalTransactions',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  { label: 'Jami KPI summasi', key: 'totalKpiAmount', accent: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'To‘langan', key: 'paidTransactions', accent: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'To‘lanmagan', key: 'unpaidTransactions', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
];

const distributionFields = [
  { label: 'Punkt', key: 'totalPunkt', color: 'text-indigo-600' },
  { label: 'Viloyat', key: 'totalViloyatAgent', color: 'text-blue-600' },
  { label: 'Tuman', key: 'totalTumanAgent', color: 'text-green-600' },
  { label: 'MFY', key: 'totalMfyAgent', color: 'text-purple-600' },
  { label: 'Transfer', key: 'totalPunktTransfer', color: 'text-rose-600' },
];

const KPIStatisticsOverview = ({
  stats,
  loading,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart className="text-indigo-600" />
            KPI statistikasi
          </h2>
          <p className="text-sm text-gray-500">Tranzaksiyalar va taqsimlash nazorati</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Davrni tanlang</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Boshlanish sanasi
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Tugash sanasi
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onApplyFilters}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Refresh className="w-4 h-4" />
            Qo‘llash
          </button>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            Tozalash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: statItems.length }).map((_, index) => (
              <div key={index} className="h-24 bg-gray-50 border border-gray-100 rounded-lg animate-pulse" />
            ))
          : statItems.map((item) => (
              <div
                key={item.key}
                className={`rounded-lg border px-4 py-3 ${item.accent}`}
              >
                <p className="text-xs font-semibold uppercase text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold mt-2">
                  {item.key.includes('Amount')
                    ? formatCurrency(stats?.[item.key])
                    : stats?.[item.key] ?? 0}
                </p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {distributionFields.map((field) => (
          <div key={field.key} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <p className="text-xs uppercase text-gray-500 font-semibold">{field.label}</p>
            <p className={`text-lg font-bold ${field.color}`}>{formatCurrency(stats?.[field.key])}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPIStatisticsOverview;


