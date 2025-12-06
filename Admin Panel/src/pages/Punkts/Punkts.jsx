import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { punktAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import PunktTable from '../../components/Punkts/PunktTable';
import CreatePunktModal from '../../components/Punkts/CreatePunktModal';
import EditPunktModal from '../../components/Punkts/EditPunktModal';
import DeletePunktModal from '../../components/Punkts/DeletePunktModal';
import ViewPunktModal from '../../components/Punkts/ViewPunktModal';
import { Add, Search, Clear } from '@mui/icons-material';
import RegionSelect from '../../components/Regions/RegionSelect';

const Punkts = () => {
  const { showError } = useSnackbar();
  const [punkts, setPunkts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    viloyat: '',
    tuman: '',
    search: '',
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPunkt, setSelectedPunkt] = useState(null);

  // Fetch punkts
  const fetchPunkts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await punktAPI.getAllPunkts({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        viloyat: filters.viloyat || undefined,
        tuman: filters.tuman || undefined,
      });

      if (response.success) {
        setPunkts(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Punktlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunkts();
  }, [pagination.page, pagination.limit, filters.status, filters.viloyat, filters.tuman]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchPunkts();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedPunkt(null);
    fetchPunkts();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedPunkt(null);
    fetchPunkts();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEdit = (punkt) => {
    setSelectedPunkt(punkt);
    setEditModalOpen(true);
  };

  const handleDelete = (punkt) => {
    setSelectedPunkt(punkt);
    setDeleteModalOpen(true);
  };

  const handleView = (punkt) => {
    setSelectedPunkt(punkt);
    setViewModalOpen(true);
  };

  // Filter by search (client-side)
  const filteredPunkts = punkts.filter((punkt) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      punkt.name?.toLowerCase().includes(search) ||
      punkt.phone?.includes(search) ||
      punkt.viloyat?.name?.toLowerCase().includes(search) ||
      punkt.tuman?.name?.toLowerCase().includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      viloyat: '',
      tuman: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Punktlar</h1>
            <p className="text-gray-600">Punktlarni boshqarish va ko'rish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi Punkt</span>
          </button>
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
        <div className="space-y-4">
          {/* First Row: Search, Status, Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha statuslar</option>
              <option value="active">Faol</option>
              <option value="inactive">Nofaol</option>
            </select>

            {/* Limit */}
            <select
              value={pagination.limit}
              onChange={(e) => {
                setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="10">10 ta</option>
              <option value="20">20 ta</option>
              <option value="50">50 ta</option>
              <option value="100">100 ta</option>
            </select>
          </div>

          {/* Second Row: Viloyat and Tuman Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RegionSelect
              name="viloyat"
              value={filters.viloyat}
              onChange={(e) => {
                setFilters({ ...filters, viloyat: e.target.value, tuman: '' }); // Clear tuman when viloyat changes
                setPagination({ ...pagination, page: 1 });
              }}
              label="Viloyat bo'yicha filter"
              type="region"
              isFilter={true}
            />
            <RegionSelect
              name="tuman"
              value={filters.tuman}
              onChange={(e) => {
                setFilters({ ...filters, tuman: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              label="Tuman bo'yicha filter"
              type="district"
              parentId={filters.viloyat || undefined}
              disabled={!filters.viloyat}
              isFilter={true}
            />
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <PunktTable
        punkts={filteredPunkts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusChange={fetchPunkts}
      />

      {/* Modals */}
      <CreatePunktModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedPunkt && (
        <>
          <ViewPunktModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedPunkt(null);
            }}
            punkt={selectedPunkt}
          />

          <EditPunktModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedPunkt(null);
            }}
            onSuccess={handleEditSuccess}
            punkt={selectedPunkt}
          />

          <DeletePunktModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedPunkt(null);
            }}
            onSuccess={handleDeleteSuccess}
            punkt={selectedPunkt}
          />
        </>
      )}
    </div>
  );
};

export default Punkts;

