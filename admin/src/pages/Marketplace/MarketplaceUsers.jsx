import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clear } from '@mui/icons-material';
import { regionAPI, districtAPI, mfyAPI, marketplaceUserAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoCascadeSearchableFields from '../../components/DistrictContragents/GeoCascadeSearchableFields';
import MarketplaceUserTable from '../../components/MarketplaceUsers/MarketplaceUserTable';
import EditMarketplaceUserModal from '../../components/MarketplaceUsers/EditMarketplaceUserModal';
import ViewMarketplaceUserModal from '../../components/MarketplaceUsers/ViewMarketplaceUserModal';
import DeleteMarketplaceUserModal from '../../components/MarketplaceUsers/DeleteMarketplaceUserModal';

const MarketplaceUsers = () => {
  const { showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mfys, setMfys] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [filters, setFilters] = useState({
    q: '',
    phone: '',
    status: '',
    region_id: '',
    district_id: '',
    mfy_id: '',
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchGeo = useCallback(async () => {
    setGeoLoading(true);
    try {
      const [r, d, m] = await Promise.all([regionAPI.getAllRegions(), districtAPI.getAllDistricts(), mfyAPI.getAllMFYs()]);
      if (r.success) setRegions(r.data || []);
      if (d.success) setDistricts(d.data || []);
      if (m.success) setMfys(m.data || []);
    } catch (e) {
      showError(e.message || 'Hudud ma\'lumotlari yuklanmadi');
    } finally {
      setGeoLoading(false);
    }
  }, [showError]);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const page = pagination.page;
      const limit = pagination.limit;
      const res = await marketplaceUserAPI.getAll({
        page,
        limit,
        status: filters.status || undefined,
        region_id: filters.region_id || undefined,
        district_id: filters.district_id || undefined,
        mfy_id: filters.mfy_id || undefined,
        phone: filters.phone.trim() || undefined,
        q: filters.q.trim() || undefined,
      });
      if (res.success) {
        const payload = res.data || {};
        const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
        setItems(list);
        setPagination((prev) => ({
          ...prev,
          page: Number(payload.page) || page,
          limit: Number(payload.limit) || limit,
          total: Number(payload.total) || list.length,
          pages: Number(payload.total_pages) || Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || limit || 1)),
        }));
      }
    } catch (e) {
      showError(e.message || 'Ro\'yxatni yuklashda xatolik');
    } finally {
      setListLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, showError]);

  useEffect(() => {
    fetchGeo();
  }, [fetchGeo]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (searchParams.get('action') === 'refresh') {
      fetchList();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchList]);

  const setGeoFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) return;
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ q: '', phone: '', status: '', region_id: '', district_id: '', mfy_id: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openEdit = (row) => {
    setSelectedId(row.id ?? row._id);
    setEditOpen(true);
  };

  const openView = (row) => {
    setSelectedId(row.id ?? row._id);
    setViewOpen(true);
  };

  const openDelete = (row) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button type="button" onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Clear className="w-4 h-4" />
            Tozalash
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ism/familiya (q)..."
                value={filters.q}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, q: e.target.value }));
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              type="text"
              placeholder="Telefon (+998...)"
              value={filters.phone}
              onChange={(e) => {
                setFilters((f) => ({ ...f, phone: e.target.value }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((f) => ({ ...f, status: e.target.value }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha statuslar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="10">10 ta</option>
              <option value="20">20 ta</option>
              <option value="50">50 ta</option>
              <option value="100">100 ta</option>
            </select>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Hudud bo'yicha (viloyat, tuman, MFY)</p>
            <GeoCascadeSearchableFields
              required={false}
              allowClear
              geoLoading={geoLoading}
              regions={regions}
              districts={districts}
              mfys={mfys}
              values={{ region_id: filters.region_id, district_id: filters.district_id, mfy_id: filters.mfy_id }}
              onChange={setGeoFilter}
              disabled={false}
            />
          </div>
        </div>
      </div>

      <MarketplaceUserTable
        rows={items}
        loading={listLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onView={openView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={fetchList}
        regions={regions}
        districts={districts}
        mfys={mfys}
      />

      <EditMarketplaceUserModal
        open={editOpen}
        userId={selectedId}
        onClose={() => {
          setEditOpen(false);
          setSelectedId(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setSelectedId(null);
          fetchList();
        }}
        regions={regions}
        districts={districts}
        mfys={mfys}
      />

      <ViewMarketplaceUserModal
        open={viewOpen}
        userId={selectedId}
        onClose={() => {
          setViewOpen(false);
          setSelectedId(null);
        }}
        regions={regions}
        districts={districts}
        mfys={mfys}
      />

      <DeleteMarketplaceUserModal
        open={deleteOpen}
        row={selectedRow}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
        }}
        onSuccess={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
          fetchList();
        }}
      />
    </div>
  );
};

export default MarketplaceUsers;
