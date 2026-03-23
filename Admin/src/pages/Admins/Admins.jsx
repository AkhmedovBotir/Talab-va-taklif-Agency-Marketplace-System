import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import AdminTable from '../../components/Admins/AdminTable';
import CreateAdminModal from '../../components/Admins/CreateAdminModal';
import EditAdminModal from '../../components/Admins/EditAdminModal';
import DeleteAdminModal from '../../components/Admins/DeleteAdminModal';
import ViewAdminModal from '../../components/Admins/ViewAdminModal';
import { Add, Search, Clear } from '@mui/icons-material';

const Admins = () => {
  const { showError } = useSnackbar();
  const [admins, setAdmins] = useState([]);
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
    role: '',
    search: '',
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Fetch admins
  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllAdmins();

      if (response.success) {
        // API returns { success: true, count: X, data: [...] }
        let adminsList = response.data || [];
        
        // Apply client-side filtering
        if (filters.status) {
          adminsList = adminsList.filter(admin => admin.status === filters.status);
        }
        if (filters.role) {
          adminsList = adminsList.filter(admin => admin.role === filters.role);
        }
        
        // Apply client-side pagination
        const total = adminsList.length;
        const pages = Math.ceil(total / pagination.limit);
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedAdmins = adminsList.slice(startIndex, endIndex);
        
        setAdmins(paginatedAdmins);
        setPagination({
          ...pagination,
          total,
          pages,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Adminlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [pagination.page, pagination.limit, filters.status, filters.role]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchAdmins();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedAdmin(null);
    fetchAdmins();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedAdmin(null);
    fetchAdmins();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditModalOpen(true);
  };

  const handleDelete = (admin) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setViewModalOpen(true);
  };

  // Filter by search (client-side) - already filtered in fetchAdmins, but keep for display
  const filteredAdmins = admins.filter((admin) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(search) ||
      admin.username?.toLowerCase().includes(search) ||
      admin.telefonRaqam?.includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      role: '',
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Adminlar</h1>
            <p className="text-gray-600">Adminlarni boshqarish va ko'rish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi Admin</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => {
              setFilters({ ...filters, role: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha rollar</option>
            <option value="admin">Admin</option>
            <option value="general">General</option>
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
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <AdminTable
        admins={filteredAdmins}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusChange={fetchAdmins}
      />

      {/* Modals */}
      <CreateAdminModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedAdmin && (
        <>
          <ViewAdminModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedAdmin(null);
            }}
            admin={selectedAdmin}
          />

          <EditAdminModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedAdmin(null);
            }}
            onSuccess={handleEditSuccess}
            admin={selectedAdmin}
          />

          <DeleteAdminModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedAdmin(null);
            }}
            onSuccess={handleDeleteSuccess}
            admin={selectedAdmin}
          />
        </>
      )}
    </div>
  );
};

export default Admins;

