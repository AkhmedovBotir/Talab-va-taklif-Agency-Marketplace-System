import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getContragents } from '../services/api';
import DetailViewModal from '../components/common/DetailViewModal';
import ViewDetailsButton from '../components/common/ViewDetailsButton';
import { buildContragentDetailFields, formatStatus } from '../utils/entityDetails';

export default function Contragents() {
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailExtra, setDetailExtra] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openDetail = async (item) => {
    setSelectedItem(item);
    setDetailExtra(null);
    setDetailLoading(true);
    try {
      const response = await getContragents({
        search: item.inn || item.name || '',
        page: 1,
        limit: 5,
        include: 'products,categories',
        nested_limit: 30,
      });
      const full = (response.data || []).find((c) => String(c.id) === String(item.id)) || item;
      setDetailExtra(full);
      setSelectedItem(full);
    } catch {
      setDetailExtra(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setDetailExtra(null);
  };

  const detailItem = detailExtra || selectedItem;
  const productCount = detailItem?.products?.length;
  const categoryCount = detailItem?.categories?.length;

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

        <DetailViewModal
          title={detailItem ? `Kontragent: ${detailItem.name}` : 'Kontragent'}
          isOpen={Boolean(selectedItem)}
          onClose={closeDetail}
          fields={detailItem ? buildContragentDetailFields(detailItem) : []}
        >
          {detailLoading && (
            <p className="text-sm text-gray-500 mt-4">Qo&apos;shimcha ma&apos;lumot yuklanmoqda...</p>
          )}
          {!detailLoading && detailItem && (productCount > 0 || categoryCount > 0) && (
            <div className="mt-6 space-y-4">
              {productCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Mahsulotlar ({productCount})
                  </h3>
                  <ul className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-600 border border-gray-100 rounded-lg p-3">
                    {detailItem.products.slice(0, 30).map((p) => (
                      <li key={p.id}>{p.name || p.title || `Mahsulot #${p.id}`}</li>
                    ))}
                  </ul>
                </div>
              )}
              {categoryCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Kategoriyalar ({categoryCount})
                  </h3>
                  <ul className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-600 border border-gray-100 rounded-lg p-3">
                    {detailItem.categories.slice(0, 30).map((c) => (
                      <li key={c.id}>{c.name || `Kategoriya #${c.id}`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DetailViewModal>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amallar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Ma'lumot topilmadi</td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.inn || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatStatus(item.status)}</td>
                        <td className="px-6 py-4 text-sm">
                          <ViewDetailsButton onClick={() => openDetail(item)} />
                        </td>
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
