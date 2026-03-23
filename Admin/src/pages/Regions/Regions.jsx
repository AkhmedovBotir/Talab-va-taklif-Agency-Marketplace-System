import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionTable from '../../components/Regions/RegionTable';
import CreateRegionModal from '../../components/Regions/CreateRegionModal';
import CreateDistrictModal from '../../components/Regions/CreateDistrictModal';
import CreateMFYModal from '../../components/Regions/CreateMFYModal';
import EditRegionModal from '../../components/Regions/EditRegionModal';
import DeleteRegionModal from '../../components/Regions/DeleteRegionModal';
import ViewRegionModal from '../../components/Regions/ViewRegionModal';
import { Add, Search, Clear } from '@mui/icons-material';

const Regions = () => {
  const { showError } = useSnackbar();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Modals
  const [createRegionModalOpen, setCreateRegionModalOpen] = useState(false);
  const [createDistrictModalOpen, setCreateDistrictModalOpen] = useState(false);
  const [createMFYModalOpen, setCreateMFYModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Fetch regions (only regions, not districts or MFYs)
  useEffect(() => {
    fetchRegions();
  }, [filters.status]);

  const fetchRegions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await regionAPI.getAllRegions({
        type: 'region',
        status: filters.status || undefined,
        parent: null,
        limit: 1000,
      });

      if (response.success) {
        // API returns { success: true, count, total, page, limit, totalPages, data: [...] }
        setRegions(response.data || []);
        console.log(response);
      }
    } catch (err) {
      const errorMsg = err.message || 'Regionlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setCreateRegionModalOpen(false);
    setCreateDistrictModalOpen(false);
    setCreateMFYModalOpen(false);
    fetchRegions();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedRegion(null);
    fetchRegions();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedRegion(null);
    fetchRegions();
  };

  const handleEdit = (region) => {
    setSelectedRegion(region);
    setEditModalOpen(true);
  };

  const handleDelete = (region) => {
    setSelectedRegion(region);
    setDeleteModalOpen(true);
  };

  const handleView = (region) => {
    setSelectedRegion(region);
    setViewModalOpen(true);
  };

  // Filter by search (client-side)
  const filteredRegions = regions.filter((region) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      region.name?.toLowerCase().includes(search) || region.code?.toLowerCase().includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      search: '',
    });
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Regionlar</h1>
            <p className="text-gray-600">Regionlarni boshqarish va ko'rish</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCreateRegionModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <Add />
              <span>Viloyat</span>
            </button>
            <button
              onClick={() => setCreateDistrictModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <Add />
              <span>Tuman</span>
            </button>
            <button
              onClick={() => setCreateMFYModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              <Add />
              <span>MFY</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <RegionTable
        key={regions.length} // Force re-render when regions change
        regions={filteredRegions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onStatusChange={fetchRegions}
      />

      {/* Modals */}
      <CreateRegionModal
        open={createRegionModalOpen}
        onClose={() => setCreateRegionModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <CreateDistrictModal
        open={createDistrictModalOpen}
        onClose={() => setCreateDistrictModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <CreateMFYModal
        open={createMFYModalOpen}
        onClose={() => setCreateMFYModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedRegion && (
        <>
          <ViewRegionModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedRegion(null);
            }}
            region={selectedRegion}
          />

          <EditRegionModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedRegion(null);
            }}
            onSuccess={handleEditSuccess}
            region={selectedRegion}
          />

          <DeleteRegionModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedRegion(null);
            }}
            onSuccess={handleDeleteSuccess}
            region={selectedRegion}
          />
        </>
      )}
    </div>
  );
};

export default Regions;

