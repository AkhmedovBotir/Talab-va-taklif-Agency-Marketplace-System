import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Search, Clear, Edit } from '@mui/icons-material';
import UpdateContactStatusModal from '../../components/Contacts/UpdateContactStatusModal';
import { formatDate } from '../../utils/dateFormatter';

const Contacts = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [contacts, setContacts] = useState([]);
  const [statistics, setStatistics] = useState(null);
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
    isPositive: '',
    search: '',
  });

  // Modal state
  const [selectedContact, setSelectedContact] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.isPositive !== '') {
        params.isPositive = filters.isPositive === 'true' ? true : false;
      }

      const response = await reviewAPI.getAllContacts(params);

      if (response.success) {
        setContacts(response.data || []);
        setPagination({
          page: response.pagination?.page || pagination.page,
          limit: response.pagination?.limit || pagination.limit,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Aloqalarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await reviewAPI.getContactStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Statistics fetch error:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStatistics();
  }, [pagination.page, pagination.limit, filters.status, filters.isPositive]);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      isPositive: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle update status
  const handleUpdateStatus = (contact) => {
    setSelectedContact(contact);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchContacts();
    fetchStatistics();
  };

  // Filter by search (client-side)
  const filteredContacts = contacts.filter((contact) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      contact.review?.user?.firstName?.toLowerCase().includes(search) ||
      contact.review?.user?.lastName?.toLowerCase().includes(search) ||
      contact.review?.user?.phone?.includes(search) ||
      contact.message?.toLowerCase().includes(search) ||
      contact.review?.order?.orderNumber?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Aloqalar</h1>
            <p className="text-gray-600">Barcha aloqalarni ko'rish va boshqarish</p>
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Jami</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.total || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-green-600 mb-1">Ijobiy</p>
            <p className="text-2xl font-bold text-green-900">{statistics.positive || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-sm text-red-600 mb-1">Salbiy</p>
            <p className="text-2xl font-bold text-red-900">{statistics.negative || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600 mb-1">Kutilmoqda</p>
            <p className="text-2xl font-bold text-yellow-900">{statistics.pending || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <p className="text-sm text-blue-600 mb-1">Jarayonda</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.inProgress || 0}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 p-4">
            <p className="text-sm text-indigo-600 mb-1">Hal qilindi</p>
            <p className="text-2xl font-bold text-indigo-900">{statistics.resolved || 0}</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
            <option value="pending">Kutilmoqda</option>
            <option value="in_progress">Jarayonda</option>
            <option value="resolved">Hal qilindi</option>
          </select>

          {/* IsPositive Filter */}
          <select
            value={filters.isPositive}
            onChange={(e) => {
              setFilters({ ...filters, isPositive: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha</option>
            <option value="true">Ijobiy</option>
            <option value="false">Salbiy</option>
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

      {/* Contacts List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-center text-gray-500">Aloqalar topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <div key={contact._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.isPositive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {contact.isPositive ? 'Ijobiy' : 'Salbiy'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.status === 'resolved'
                            ? 'bg-blue-100 text-blue-800'
                            : contact.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contact.status === 'resolved'
                          ? 'Hal qilindi'
                          : contact.status === 'in_progress'
                          ? 'Jarayonda'
                          : 'Kutilmoqda'}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{contact.message}</p>
                    {contact.review?.user && (
                      <p className="text-sm text-gray-600">
                        {contact.review.user.firstName} {contact.review.user.lastName} -{' '}
                        {contact.review.user.phone}
                      </p>
                    )}
                    {contact.review?.order?.orderNumber && (
                      <p className="text-xs text-gray-500">Buyurtma: {contact.review.order.orderNumber}</p>
                    )}
                    {contact.adminNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>Admin izohi:</strong> {contact.adminNotes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateStatus(contact)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      title="Holatni yangilash"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Holatni yangilash</span>
                    </button>
                    <div className="text-xs text-gray-500">
                      {formatDate(contact.createdAt, { format: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Jami <span className="font-medium">{pagination.total}</span> ta aloqadan{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  ko'rsatilmoqda
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Oldingi
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            pageNum === pagination.page
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Update Contact Status Modal */}
      <UpdateContactStatusModal
        open={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedContact(null);
        }}
        onSuccess={handleUpdateSuccess}
        contact={selectedContact}
      />
    </div>
  );
};

export default Contacts;


