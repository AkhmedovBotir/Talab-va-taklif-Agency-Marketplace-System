import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getContragents } from '../services/api';

export default function Contragents() {
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getContragents(filters);
        setRows(response.data || []);
      } catch (err) {
        setError(err.message || "Kontragentlarni yuklashda xatolik");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Kontragentlar</h1>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nomi, INN yoki telefon bo'yicha qidirish"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Qidirish
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">INN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Ma'lumot topilmadi</td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.inn || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.status || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
