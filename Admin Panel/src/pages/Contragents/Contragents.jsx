import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { contragentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ContragentTable from '../../components/Contragents/ContragentTable';
import CreateContragentModal from '../../components/Contragents/CreateContragentModal';
import EditContragentModal from '../../components/Contragents/EditContragentModal';
import DeleteContragentModal from '../../components/Contragents/DeleteContragentModal';
import ViewContragentModal from '../../components/Contragents/ViewContragentModal';
import { Add, Search, Clear } from '@mui/icons-material';
import RegionSelect from '../../components/Regions/RegionSelect';

const Contragents = () => {
  const { showError } = useSnackbar();
  const [contragents, setContragents] = useState([]);
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
    mfy: '',
    search: '',
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContragent, setSelectedContragent] = useState(null);

  // Fetch contragents
  const fetchContragents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await contragentAPI.getAllContragents({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        viloyat: filters.viloyat || undefined,
        tuman: filters.tuman || undefined,
        mfy: filters.mfy || undefined,
      });

      if (response.success) {
        // API returns { success: true, count, total, page, limit, totalPages, data: [...] }
        setContragents(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragentlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContragents();
  }, [pagination.page, pagination.limit, filters.status, filters.viloyat, filters.tuman, filters.mfy]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchContragents();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedContragent(null);
    fetchContragents();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedContragent(null);
    fetchContragents();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEdit = (contragent) => {
    setSelectedContragent(contragent);
    setEditModalOpen(true);
  };

  const handleDelete = (contragent) => {
    setSelectedContragent(contragent);
    setDeleteModalOpen(true);
  };

  const handleView = (contragent) => {
    setSelectedContragent(contragent);
    setViewModalOpen(true);
  };

  // Filter by search (client-side)
  const filteredContragents = contragents.filter((contragent) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      contragent.name?.toLowerCase().includes(search) ||
      contragent.inn?.includes(search) ||
      contragent.phone?.includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      viloyat: '',
      tuman: '',
      mfy: '',
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Kontragentlar</h1>
            <p className="text-gray-600">Kontragentlarni boshqarish va ko'rish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi Kontragent</span>
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
          {/* Search and Status Row */}
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

          {/* Region Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Viloyat Filter */}
            <div>
              <RegionSelect
                name="viloyat"
                value={filters.viloyat}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ ...filters, viloyat: value, tuman: '', mfy: '' });
                  setPagination({ ...pagination, page: 1 });
                }}
                label="Viloyat bo'yicha filter"
                type="region"
              />
            </div>

            {/* Tuman Filter */}
            <div>
              <RegionSelect
                name="tuman"
                value={filters.tuman}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({ ...filters, tuman: value, mfy: '' });
                  setPagination({ ...pagination, page: 1 });
                }}
                label="Tuman bo'yicha filter"
                type="district"
                parentId={filters.viloyat || null}
                disabled={!filters.viloyat}
              />
            </div>

            {/* MFY Filter */}
            <div>
              <RegionSelect
                name="mfy"
                value={filters.mfy}
                onChange={(e) => {
                  setFilters({ ...filters, mfy: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                label="MFY bo'yicha filter"
                type="mfy"
                parentId={filters.tuman || null}
                disabled={!filters.tuman}
              />
            </div>
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
      <ContragentTable
        contragents={filteredContragents}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusChange={fetchContragents}
      />

      {/* Modals */}
      <CreateContragentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedContragent && (
        <>
          <ViewContragentModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedContragent(null);
            }}
            contragent={selectedContragent}
          />

          <EditContragentModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedContragent(null);
            }}
            onSuccess={handleEditSuccess}
            contragent={selectedContragent}
          />

          <DeleteContragentModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedContragent(null);
            }}
            onSuccess={handleDeleteSuccess}
            contragent={selectedContragent}
          />
        </>
      )}
    </div>
  );
};

export default Contragents;

