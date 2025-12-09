import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { vacancyApplicationAPI, vacancyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import VacancyApplicationTable from '../../components/VacancyApplications/VacancyApplicationTable';
import ViewVacancyApplicationModal from '../../components/VacancyApplications/ViewVacancyApplicationModal';
import { ArrowBack, Search, Clear } from '@mui/icons-material';

const VacancyApplications = () => {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const [applications, setApplications] = useState([]);
  const [vacancy, setVacancy] = useState(null);
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
    status: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Fetch vacancy details
  useEffect(() => {
    if (vacancyId) {
      fetchVacancyDetails();
    }
  }, [vacancyId]);

  // Fetch applications
  useEffect(() => {
    if (vacancyId) {
      fetchApplications();
    }
  }, [vacancyId, pagination.page, pagination.limit, filters.status]);

  const fetchVacancyDetails = async () => {
    try {
      const response = await vacancyAPI.getVacancyById(vacancyId);
      if (response.success) {
        setVacancy(response.data);
      }
    } catch (err) {
      showError(err.message || 'Vakansiyani yuklashda xatolik');
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;

      const response = await vacancyApplicationAPI.getApplicationsByVacancy(vacancyId, params);

      if (response.success) {
        setApplications(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'So\'rovnomalarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (application) => {
    setSelectedApplication(application);
    setViewModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSuccess = () => {
    fetchApplications();
  };

  // Filter by search (client-side)
  const filteredApplications = applications.filter((application) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      application.applicant?.firstName?.toLowerCase().includes(search) ||
      application.applicant?.lastName?.toLowerCase().includes(search) ||
      application.applicant?.phone?.includes(search)
    );
  });

  const handleClearFilters = () => {
    setFilters({
      status: '',
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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/dashboard/vacancies')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Orqaga"
          >
            <ArrowBack />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {vacancy?.name || 'Vakansiya'} - So'rovnomalar
            </h1>
            <p className="text-gray-600">
              {vacancy && (
                <>
                  {vacancy.target === 'agent' ? 'Agent' : 'Punkt'} •{' '}
                  {vacancy.type === 'fulltime' ? 'To\'liq kunlik' : 'Yarim kunlik'}
                </>
              )}
            </p>
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
            <option value="pending">Ko'rib chiqilmoqda</option>
            <option value="reviewed">Ko'rib chiqilgan</option>
            <option value="accepted">Qabul qilingan</option>
            <option value="rejected">Rad etilgan</option>
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
      <VacancyApplicationTable
        applications={filteredApplications}
        loading={loading}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedApplication && (
        <ViewVacancyApplicationModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedApplication(null);
          }}
          onSuccess={handleSuccess}
          application={selectedApplication}
        />
      )}
    </div>
  );
};

export default VacancyApplications;



