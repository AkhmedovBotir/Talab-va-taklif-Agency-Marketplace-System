import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { partnershipRequestAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import PartnershipRequestTable from '../../components/PartnershipRequests/PartnershipRequestTable';
import ViewPartnershipRequestModal from '../../components/PartnershipRequests/ViewPartnershipRequestModal';
import UpdateContactStatusModal from '../../components/PartnershipRequests/UpdateContactStatusModal';
import UpdateRequestStatusModal from '../../components/PartnershipRequests/UpdateRequestStatusModal';
import { Search, Clear } from '@mui/icons-material';

const PartnershipRequests = () => {
  const { showError } = useSnackbar();
  const [requests, setRequests] = useState([]);
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
    contactStatus: '',
    search: '',
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [contactStatusModalOpen, setContactStatusModalOpen] = useState(false);
  const [requestStatusModalOpen, setRequestStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.contactStatus) params.contactStatus = filters.contactStatus;

      const response = await partnershipRequestAPI.getAllPartnershipRequests(params);

      if (response.success) {
        setRequests(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Hamkorlik so\'rovlarini yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, pagination.limit, filters.status, filters.contactStatus]);

  const handleView = (request) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleUpdateContactStatus = (request) => {
    setSelectedRequest(request);
    setContactStatusModalOpen(true);
  };

  const handleUpdateRequestStatus = (request) => {
    setSelectedRequest(request);
    setRequestStatusModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSuccess = () => {
    fetchRequests();
  };

  // Filter by search (client-side)
  const filteredRequests = requests.filter((request) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      request.marketplaceUser?.firstName?.toLowerCase().includes(search) ||
      request.marketplaceUser?.lastName?.toLowerCase().includes(search) ||
      request.marketplaceUser?.phone?.includes(search) ||
      request.companyName?.toLowerCase().includes(search) ||
      request.inn?.includes(search) ||
      request.managerFirstName?.toLowerCase().includes(search) ||
      request.managerLastName?.toLowerCase().includes(search) ||
      request.managerPhone?.includes(search)
    );
  });

  const handleClearFilters = () => {
    setFilters({
      status: '',
      contactStatus: '',
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hamkorlik So'rovlari</h1>
          <p className="text-gray-600">Barcha hamkorlik so'rovlarini ko'rish va boshqarish</p>
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
            <option value="approved">Tasdiqlangan</option>
            <option value="rejected">Rad etilgan</option>
          </select>

          {/* Contact Status Filter */}
          <select
            value={filters.contactStatus}
            onChange={(e) => {
              setFilters({ ...filters, contactStatus: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha aloqa holatlari</option>
            <option value="not_contacted">Aloqa qilinmagan</option>
            <option value="contacted">Aloqa qilingan</option>
            <option value="in_progress">Jarayonda</option>
            <option value="completed">Tugallangan</option>
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
      <PartnershipRequestTable
        requests={filteredRequests}
        loading={loading}
        onView={handleView}
        onUpdateContactStatus={handleUpdateContactStatus}
        onUpdateRequestStatus={handleUpdateRequestStatus}
        onSuccess={handleSuccess}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      {selectedRequest && (
        <>
          <ViewPartnershipRequestModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedRequest(null);
            }}
            request={selectedRequest}
          />

          <UpdateContactStatusModal
            open={contactStatusModalOpen}
            onClose={() => {
              setContactStatusModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={handleSuccess}
            request={selectedRequest}
          />

          <UpdateRequestStatusModal
            open={requestStatusModalOpen}
            onClose={() => {
              setRequestStatusModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={handleSuccess}
            request={selectedRequest}
          />
        </>
      )}
    </div>
  );
};

export default PartnershipRequests;




