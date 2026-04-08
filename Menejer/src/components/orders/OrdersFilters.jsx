import { useState } from 'react';

export default function OrdersFilters({ filters, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearch = () => {
    onFilterChange({ search: localSearch });
  };

  const handleReset = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      limit: 10,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Qidirish</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buyurtma ID, user ID, punkt yoki agent bo'yicha"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Qidirish
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sahifadagi soni</label>
          <select
            value={filters.limit || 10}
            onChange={(e) => onFilterChange({ limit: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        >
          Tozalash
        </button>
      </div>
    </div>
  );
}
