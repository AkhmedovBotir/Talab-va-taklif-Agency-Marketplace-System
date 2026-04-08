import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Add, Search, Clear } from '@mui/icons-material';
import { regionAPI, districtAPI, mfyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionTable from '../../components/Regions/RegionTable';
import CreateRegionModal from '../../components/Regions/CreateRegionModal';
import CreateDistrictModal from '../../components/Regions/CreateDistrictModal';
import CreateMFYModal from '../../components/Regions/CreateMFYModal';
import EditRegionModal from '../../components/Regions/EditRegionModal';
import DeleteRegionModal from '../../components/Regions/DeleteRegionModal';
import ViewRegionModal from '../../components/Regions/ViewRegionModal';

const Regions = () => {
  const { showError } = useSnackbar();
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mfys, setMfys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });

  const [createRegionModalOpen, setCreateRegionModalOpen] = useState(false);
  const [createDistrictModalOpen, setCreateDistrictModalOpen] = useState(false);
  const [createMFYModalOpen, setCreateMFYModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [regionsRes, districtsRes, mfysRes] = await Promise.all([
        regionAPI.getAllRegions(),
        districtAPI.getAllDistricts(),
        mfyAPI.getAllMFYs(),
      ]);

      if (regionsRes.success) setRegions(regionsRes.data || []);
      if (districtsRes.success) setDistricts(districtsRes.data || []);
      if (mfysRes.success) setMfys(mfysRes.data || []);
    } catch (err) {
      const msg = err.message || "Region ma'lumotlarini yuklashda xatolik yuz berdi";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredRegions = useMemo(() => {
    let list = [...regions];
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((r) => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q));
    }
    return list;
  }, [regions, filters]);

  const handleStatusChange = async (type, item, status) => {
    try {
      const id = item.id ?? item._id;
      if (type === 'region') await regionAPI.updateRegionStatus(id, status);
      if (type === 'district') await districtAPI.updateDistrictStatus(id, status);
      if (type === 'mfy') await mfyAPI.updateMFYStatus(id, status);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Status yangilashda xatolik');
    }
  };

  const handleCreateSuccess = () => {
    setCreateRegionModalOpen(false);
    setCreateDistrictModalOpen(false);
    setCreateMFYModalOpen(false);
    fetchAll();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedItem(null);
    fetchAll();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedItem(null);
    fetchAll();
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={() => setFilters({ status: '', search: '' })} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Clear className="w-4 h-4" />
              <span>Tozalash</span>
            </button>
            <button onClick={() => setCreateRegionModalOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium">
              <Add className="w-4 h-4" />
              <span>Viloyat</span>
            </button>
            <button onClick={() => setCreateDistrictModalOpen(true)} className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 font-medium">
              <Add className="w-4 h-4" />
              <span>Tuman</span>
            </button>
            <button onClick={() => setCreateMFYModalOpen(true)} className="inline-flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 font-medium">
              <Add className="w-4 h-4" />
              <span>MFY</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </motion.div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

      <RegionTable
        regions={filteredRegions}
        districts={districts}
        mfys={mfys}
        loading={loading}
        onView={(item) => {
          setSelectedItem(item);
          setViewModalOpen(true);
        }}
        onEdit={(item) => {
          setSelectedItem(item);
          setEditModalOpen(true);
        }}
        onDelete={(item) => {
          setSelectedItem(item);
          setDeleteModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      <CreateRegionModal open={createRegionModalOpen} onClose={() => setCreateRegionModalOpen(false)} onSuccess={handleCreateSuccess} />
      <CreateDistrictModal open={createDistrictModalOpen} onClose={() => setCreateDistrictModalOpen(false)} onSuccess={handleCreateSuccess} regions={regions} />
      <CreateMFYModal open={createMFYModalOpen} onClose={() => setCreateMFYModalOpen(false)} onSuccess={handleCreateSuccess} regions={regions} districts={districts} />

      <EditRegionModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleEditSuccess}
        item={selectedItem}
        regions={regions}
        districts={districts}
      />
      <DeleteRegionModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleDeleteSuccess}
        item={selectedItem}
      />
      <ViewRegionModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        regions={regions}
        districts={districts}
      />
    </div>
  );
};

export default Regions;
