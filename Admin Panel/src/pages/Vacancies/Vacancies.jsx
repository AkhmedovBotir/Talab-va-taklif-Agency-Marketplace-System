import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import VacancyTable from '../../components/Vacancies/VacancyTable';
import CreateVacancyModal from '../../components/Vacancies/CreateVacancyModal';
import ViewVacancyModal from '../../components/Vacancies/ViewVacancyModal';
import DeleteVacancyModal from '../../components/Vacancies/DeleteVacancyModal';
import EditVacancyModal from '../../components/Vacancies/EditVacancyModal';
import { Add, Search, Clear } from '@mui/icons-material';

const Vacancies = () => {
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    target: '',
    type: '',
    search: '',
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Fetch vacancies
  const fetchVacancies = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.target) params.target = filters.target;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      const response = await vacancyAPI.getAllVacancies(params);

      if (response.success) {
        setVacancies(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Vakansiyalarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, [pagination.page, pagination.limit, filters.target, filters.type]);

  const handleView = (vacancy) => {
    setSelectedVacancy(vacancy);
    setViewModalOpen(true);
  };

  const handleDelete = (vacancy) => {
    setSelectedVacancy(vacancy);
    setDeleteModalOpen(true);
  };

  const handleEdit = (vacancy) => {
    setSelectedVacancy(vacancy);
    setEditModalOpen(true);
  };

  const handleViewApplications = (vacancy) => {
    navigate(`/dashboard/vacancies/${vacancy._id}/applications`);
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSuccess = () => {
    fetchVacancies();
  };

  // Filter by search (client-side)
  const filteredVacancies = vacancies.filter((vacancy) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return vacancy.name?.toLowerCase().includes(search);
  });

  const handleClearFilters = () => {
    setFilters({
      target: '',
      type: '',
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Vakansiyalar</h1>
            <p className="text-gray-600">Vakansiyalarni boshqarish va ko'rish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi Vakansiya</span>
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

          {/* Target Filter */}
          <select
            value={filters.target}
            onChange={(e) => {
              setFilters({ ...filters, target: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha maqsadlar</option>
            <option value="agent">Agent</option>
            <option value="punkt">Punkt</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha turlar</option>
            <option value="fulltime">To'liq kunlik</option>
            <option value="parttime">Yarim kunlik</option>
          </select>

          {/* Limit */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
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
      <VacancyTable
        vacancies={filteredVacancies}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewApplications={handleViewApplications}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CreateVacancyModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {selectedVacancy && (
        <>
          <ViewVacancyModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedVacancy(null);
            }}
            vacancy={selectedVacancy}
          />

          <DeleteVacancyModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedVacancy(null);
            }}
            onSuccess={handleSuccess}
            vacancy={selectedVacancy}
          />

          <EditVacancyModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedVacancy(null);
            }}
            onSuccess={handleSuccess}
            vacancy={selectedVacancy}
          />
        </>
      )}
    </div>
  );
};

export default Vacancies;

