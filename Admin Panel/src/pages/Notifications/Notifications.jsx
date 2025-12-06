import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import NotificationTable from '../../components/Notifications/NotificationTable';
import CreateNotificationModal from '../../components/Notifications/CreateNotificationModal';
import ViewNotificationModal from '../../components/Notifications/ViewNotificationModal';
import DeleteNotificationModal from '../../components/Notifications/DeleteNotificationModal';
import { Add, Search, Clear, Notifications as NotificationsIcon } from '@mui/icons-material';

const targetTypeLabels = {
  all: 'Barchaga',
  punkts: 'Punktlar',
  viloyat_agents: 'Viloyat agentlari',
  tuman_agents: 'Tuman agentlari',
  mfy_agents: 'MFY agentlari',
  marketplace_users: 'Marketplace foydalanuvchilari',
  contragents: 'Kontragentlar',
};

const notificationTypeLabels = {
  info: "Ma'lumot",
  warning: 'Ogohlantirish',
  success: 'Muvaffaqiyat',
  error: 'Xatolik',
  announcement: "E'lon",
  promotion: 'Aksiya',
  update: 'Yangilanish',
};

const Notifications = () => {
  const { showError, showSuccess } = useSnackbar();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    targetType: '',
    type: '',
    isActive: '',
    search: '',
  });
  const [stats, setStats] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [pagination.page, filters.targetType, filters.type, filters.isActive]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationAPI.getAllNotifications({
        page: pagination.page,
        limit: pagination.limit,
        targetType: filters.targetType || undefined,
        type: filters.type || undefined,
        isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
      });

      if (response.success) {
        setNotifications(response.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 1,
        }));
      }
    } catch (err) {
      const errorMsg = err.message || 'Xabarlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchNotifications();
    fetchStats();
    showSuccess('Xabar muvaffaqiyatli yaratildi va yuborildi');
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedNotification(null);
    fetchNotifications();
    fetchStats();
    showSuccess("Xabar muvaffaqiyatli o'chirildi");
  };

  const handleView = (notification) => {
    setSelectedNotification(notification);
    setViewModalOpen(true);
  };

  const handleDelete = (notification) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Filter by search (client-side)
  const filteredNotifications = notifications.filter((notification) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      notification.title?.toLowerCase().includes(search) ||
      notification.message?.toLowerCase().includes(search)
    );
  });

  const handleClearFilters = () => {
    setFilters({
      targetType: '',
      type: '',
      isActive: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <NotificationsIcon className="text-indigo-600" />
              Xabarlar
            </h1>
            <p className="text-gray-600">Foydalanuvchilarga xabar yuborish va boshqarish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi xabar</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Jami xabarlar</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Faol xabarlar</p>
            <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
          </div>
          {stats.byTargetType?.slice(0, 2).map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{targetTypeLabels[item._id] || item._id}</p>
              <p className="text-2xl font-bold text-indigo-600">{item.count || 0}</p>
            </div>
          ))}
        </motion.div>
      )}

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

          {/* Notification Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha turlar</option>
            {Object.entries(notificationTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="true">Faol</option>
            <option value="false">Nofaol</option>
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
      <NotificationTable
        notifications={filteredNotifications}
        currentTargetType={filters.targetType}
        onTargetTypeChange={(value) =>
          setFilters((prev) => ({
            ...prev,
            targetType: value,
          }))
        }
        loading={loading}
        onView={handleView}
        onDelete={handleDelete}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Modals */}
      <CreateNotificationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedNotification && (
        <>
          <ViewNotificationModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedNotification(null);
            }}
            notification={selectedNotification}
          />

          <DeleteNotificationModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedNotification(null);
            }}
            onSuccess={handleDeleteSuccess}
            notification={selectedNotification}
          />
        </>
      )}
    </div>
  );
};

export default Notifications;

