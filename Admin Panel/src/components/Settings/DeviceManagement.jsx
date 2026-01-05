import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Devices,
  Search,
  Clear,
  Visibility,
  Delete,
  PowerSettingsNew,
  CheckCircle,
  Cancel,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { adminDeviceAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ViewDeviceModal from './ViewDeviceModal';
import DeleteDeviceModal from './DeleteDeviceModal';

const DeviceManagement = () => {
  const { showSuccess, showError } = useSnackbar();
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  const [filters, setFilters] = useState({
    userModel: '',
    userId: '',
    search: '',
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
  }, [pagination.page, filters]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (filters.userModel) params.userModel = filters.userModel;
      if (filters.userId) params.userId = filters.userId;
      
      const response = await adminDeviceAPI.getAllDevices(params);
      
      if (response.success) {
        let filteredDevices = response.data || [];
        
        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredDevices = filteredDevices.filter(device => {
            const userName = device.user?.name || '';
            const userPhone = device.user?.phone || '';
            const deviceName = device.deviceName || '';
            const deviceId = device.deviceId || '';
            
            return (
              userName.toLowerCase().includes(searchLower) ||
              userPhone.toLowerCase().includes(searchLower) ||
              deviceName.toLowerCase().includes(searchLower) ||
              deviceId.toLowerCase().includes(searchLower)
            );
          });
        }
        
        setDevices(filteredDevices);
        setPagination(prev => ({
          ...prev,
          total: response.total || filteredDevices.length,
          pages: response.totalPages || Math.ceil((response.total || filteredDevices.length) / prev.limit),
        }));
      }
    } catch (error) {
      showError(error.message || 'Qurilmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await adminDeviceAPI.getDeviceStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Statistics fetch error:', error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      userModel: '',
      userId: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleView = (device) => {
    setSelectedDevice(device);
    setViewModalOpen(true);
  };

  const handleDelete = (device) => {
    setSelectedDevice(device);
    setDeleteModalOpen(true);
  };

  const handleActivate = async (device) => {
    setActionLoading(prev => ({ ...prev, [device._id]: true }));
    try {
      const response = await adminDeviceAPI.activateDevice(device._id);
      if (response.success) {
        showSuccess('Qurilma muvaffaqiyatli aktivatsiya qilindi');
        fetchDevices();
        fetchStatistics();
      }
    } catch (error) {
      showError(error.message || 'Qurilmani aktivatsiya qilishda xatolik');
    } finally {
      setActionLoading(prev => ({ ...prev, [device._id]: false }));
    }
  };

  const handleDeactivate = async (device) => {
    setActionLoading(prev => ({ ...prev, [device._id]: true }));
    try {
      const response = await adminDeviceAPI.deactivateDevice(device._id);
      if (response.success) {
        showSuccess('Qurilma muvaffaqiyatli deaktivatsiya qilindi');
        fetchDevices();
        fetchStatistics();
      }
    } catch (error) {
      showError(error.message || 'Qurilmani deaktivatsiya qilishda xatolik');
    } finally {
      setActionLoading(prev => ({ ...prev, [device._id]: false }));
    }
  };

  const handleDeleteSuccess = () => {
    fetchDevices();
    fetchStatistics();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserModelLabel = (model) => {
    const labels = {
      'Admin': 'Admin',
      'Contragent': 'Kontragent',
      'Punkt': 'Punkt',
      'Agent': 'Agent',
    };
    return labels[model] || model;
  };

  return (
    <div>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qurilmalar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total || 0}
                </p>
              </div>
              <Devices className="text-indigo-600" style={{ fontSize: 32 }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faol qurilmalar</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {statistics.active || 0}
                </p>
              </div>
              <CheckCircle className="text-green-600" style={{ fontSize: 32 }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nofaol qurilmalar</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {statistics.inactive || 0}
                </p>
              </div>
              <Cancel className="text-red-600" style={{ fontSize: 32 }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Foydalanuvchi turlari</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {statistics.byUserModel?.length || 0}
                </p>
              </div>
              <FilterList className="text-indigo-600" style={{ fontSize: 32 }} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: 20 }} />
              <input
                type="text"
                placeholder="Qidirish (ism, telefon, qurilma nomi)..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* User Model Filter */}
          <div>
            <select
              value={filters.userModel}
              onChange={(e) => handleFilterChange('userModel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Barcha foydalanuvchilar</option>
              <option value="Admin">Admin</option>
              <option value="Contragent">Kontragent</option>
              <option value="Punkt">Punkt</option>
              <option value="Agent">Agent</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Clear style={{ fontSize: 18 }} />
              <span>Tozalash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Qurilmalar topilmadi
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qurilma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oxirgi kirish
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.map((device, index) => (
                    <motion.tr
                      key={device._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {device.user?.name || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getUserModelLabel(device.userModel)} • {device.user?.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {device.deviceName || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {device.deviceId?.substring(0, 20)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {device.deviceType || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {device.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle style={{ fontSize: 14 }} />
                            Faol
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <Cancel style={{ fontSize: 14 }} />
                            Nofaol
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(device.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(device)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Ko'rish"
                          >
                            <Visibility style={{ fontSize: 20 }} />
                          </button>
                          {device.isActive ? (
                            <button
                              onClick={() => handleDeactivate(device)}
                              disabled={actionLoading[device._id]}
                              className="text-orange-600 hover:text-orange-900 transition-colors disabled:opacity-50"
                              title="Deaktivatsiya qilish"
                            >
                              <PowerSettingsNew style={{ fontSize: 20 }} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(device)}
                              disabled={actionLoading[device._id]}
                              className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                              title="Aktivatsiya qilish"
                            >
                              <CheckCircle style={{ fontSize: 20 }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(device)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="O'chirish"
                          >
                            <Delete style={{ fontSize: 20 }} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {pagination.total} ta qurilma, {pagination.pages} sahifa
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Oldingi
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedDevice && (
        <>
          <ViewDeviceModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedDevice(null);
            }}
            device={selectedDevice}
          />
          <DeleteDeviceModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedDevice(null);
            }}
            onSuccess={handleDeleteSuccess}
            device={selectedDevice}
          />
        </>
      )}
    </div>
  );
};

export default DeviceManagement;





