import { useState } from 'react';
import TumanSelect from '../orders/TumanSelect';

export default function PunktsFilters({ filters, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearch = () => {
    onFilterChange({ search: localSearch });
  };

  const handleReset = () => {
    setLocalSearch('');
    onFilterChange({
      status: '',
      tuman: '',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Qidirish</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ism yoki telefon raqami bo'yicha qidirish"
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

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Barchasi</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>

        {/* Tuman Filter */}
        <div className="md:col-start-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tuman</label>
          <TumanSelect
            value={filters.tuman || ''}
            onChange={(value) => onFilterChange({ tuman: value })}
          />
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
