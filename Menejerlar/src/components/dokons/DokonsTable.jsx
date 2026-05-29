import { useState, useEffect } from 'react';
import { getDokons } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGeoLookup } from '../../hooks/useGeoLookup';
import DetailViewModal from '../common/DetailViewModal';
import ViewDetailsButton from '../common/ViewDetailsButton';
import { buildDokonDetailFields, formatStatus } from '../../utils/entityDetails';

export default function DokonsTable({ filters, onPageChange }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const geo = useGeoLookup(data);

  useEffect(() => {
    fetchDokons();
  }, [filters]);

  const fetchDokons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDokons(filters);

      if (response.success) {
        const managerRegionId = user?.viloyat_id || user?.region_id || user?.region?.id;
        const list = (response.data || []).filter((shop) => {
          const sameRegion = managerRegionId
            ? String(shop?.region_id || shop?.viloyat_id) === String(managerRegionId)
            : true;
          return sameRegion;
        });
        const sorted = [...list].sort((a, b) => (b.status === 'active' ? 1 : 0) - (a.status === 'active' ? 1 : 0));
        setData(sorted);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 50,
          total: sorted.length,
          totalPages: 1,
        });
      }
    } catch (err) {
      setError(err.message || 'Do\'konlarni yuklashda xatolik yuz berdi');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <DetailViewModal
        title={selectedItem ? `Do'kon: ${selectedItem.name}` : "Do'kon"}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        fields={selectedItem ? buildDokonDetailFields(selectedItem, geo) : []}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MFY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                data.map((dokon) => (
                  <tr key={dokon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dokon.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dokon.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {geo.districtName(dokon.district_id || dokon.tuman_id, dokon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {geo.mfyName(dokon.mfy_id, dokon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          dokon.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {formatStatus(dokon.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <ViewDetailsButton onClick={() => setSelectedItem(dokon)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> ta yozuvdan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              tasi ko'rsatilmoqda
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Oldingi
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
