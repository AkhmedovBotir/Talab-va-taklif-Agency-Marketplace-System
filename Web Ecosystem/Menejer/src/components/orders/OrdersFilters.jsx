import { useState } from 'react';
import TumanSelect from './TumanSelect';

export default function OrdersFilters({ filters, onFilterChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearch = () => {
    onFilterChange({ search: localSearch });
  };

  const handleReset = () => {
    setLocalSearch('');
    onFilterChange({
      status: '',
      paymentStatus: '',
      paymentMethod: '',
      orderNumber: '',
      user: '',
      tuman: '',
      startDate: '',
      endDate: '',
      minTotalPrice: '',
      maxTotalPrice: '',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Qidirish</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buyurtma raqami yoki mijoz bo'yicha qidirish"
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Barchasi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="confirmed">Tasdiqlangan</option>
            <option value="processing">Jarayonda</option>
            <option value="delivered">Yetkazilgan</option>
            <option value="completed">Yakunlangan</option>
            <option value="cancelled">Bekor qilingan</option>
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To'lov holati</label>
          <select
            value={filters.paymentStatus || ''}
            onChange={(e) => onFilterChange({ paymentStatus: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Barchasi</option>
            <option value="pending">To'lanmagan</option>
            <option value="paid">To'langan</option>
            <option value="refunded">Qaytarilgan</option>
          </select>
        </div>

        {/* Order Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Buyurtma raqami</label>
          <input
            type="text"
            value={filters.orderNumber || ''}
            onChange={(e) => onFilterChange({ orderNumber: e.target.value })}
            placeholder="Buyurtma raqami"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Min narx</label>
          <input
            type="number"
            value={filters.minTotalPrice || ''}
            onChange={(e) => onFilterChange({ minTotalPrice: e.target.value })}
            placeholder="Min narx"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max narx</label>
          <input
            type="number"
            value={filters.maxTotalPrice || ''}
            onChange={(e) => onFilterChange({ maxTotalPrice: e.target.value })}
            placeholder="Max narx"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Tuman Select */}
        <div>
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
