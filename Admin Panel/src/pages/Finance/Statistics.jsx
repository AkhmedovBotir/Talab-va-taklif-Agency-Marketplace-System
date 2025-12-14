import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import FinanceReportCard from '../../components/Finance/FinanceReportCard';
import { TrendingUp, Receipt, Assessment, LocationOn, Business, Person } from '@mui/icons-material';

const Statistics = () => {
  const { showError } = useSnackbar();
  const [generalStats, setGeneralStats] = useState(null);
  const [regionStats, setRegionStats] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [mfyStats, setMfyStats] = useState([]);
  const [agentStats, setAgentStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const fetchGeneralStats = async () => {
    try {
      const response = await financeAPI.getStatistics();
      if (response.success) {
        setGeneralStats(response.statistics);
      }
    } catch (err) {
      showError(err.message || 'Statistikani yuklashda xatolik yuz berdi');
    }
  };

  const fetchRegionStats = async () => {
    try {
      const response = await financeAPI.getRegionStatistics();
      if (response.success) {
        setRegionStats(response.statistics || []);
      }
    } catch (err) {
      showError(err.message || 'Viloyat statistikasini yuklashda xatolik yuz berdi');
    }
  };

  const fetchDistrictStats = async () => {
    try {
      const response = await financeAPI.getDistrictStatistics();
      if (response.success) {
        setDistrictStats(response.statistics || []);
      }
    } catch (err) {
      showError(err.message || 'Tuman statistikasini yuklashda xatolik yuz berdi');
    }
  };

  const fetchMfyStats = async () => {
    try {
      const response = await financeAPI.getMfyStatistics();
      if (response.success) {
        setMfyStats(response.statistics || []);
      }
    } catch (err) {
      showError(err.message || 'MFY statistikasini yuklashda xatolik yuz berdi');
    }
  };

  const fetchAgentStats = async () => {
    try {
      const response = await financeAPI.getAgentPerformanceStatistics();
      if (response.success) {
        setAgentStats(response.performance || []);
      }
    } catch (err) {
      showError(err.message || 'Agent statistikasini yuklashda xatolik yuz berdi');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchGeneralStats(),
      fetchRegionStats(),
      fetchDistrictStats(),
      fetchMfyStats(),
      fetchAgentStats(),
    ]).finally(() => setLoading(false));
  }, []);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const tabs = [
    { id: 'general', label: 'Umumiy', icon: Assessment },
    { id: 'region', label: 'Viloyatlar', icon: LocationOn },
    { id: 'district', label: 'Tumanlar', icon: Business },
    { id: 'mfy', label: 'MFY', icon: Person },
    { id: 'agent', label: 'Agentlar', icon: Person },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <TrendingUp className="text-indigo-600" />
            Moliya Statistika
          </h1>
          <p className="text-gray-600">Moliya bo'limi statistikasi</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* General Statistics */}
          {activeTab === 'general' && generalStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FinanceReportCard
                  title="Jami Transaksiyalar"
                  value={generalStats.totalTransactions || 0}
                  icon={Receipt}
                  color="bg-blue-500"
                />
                <FinanceReportCard
                  title="Jami Summa"
                  value={formatAmount(generalStats.totalAmount || 0)}
                  icon={TrendingUp}
                  color="bg-green-500"
                />
              </div>

              {/* By Status */}
              {generalStats.byStatus && generalStats.byStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Status Bo'yicha</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Soni</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {generalStats.byStatus.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item._id}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">{item.count}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatAmount(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* By Payment Method */}
              {generalStats.byPaymentMethod && generalStats.byPaymentMethod.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">To'lov Usuli Bo'yicha</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            To'lov usuli
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Soni</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {generalStats.byPaymentMethod.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item._id === 'cash' ? 'Naqd' : 'Karta'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">{item.count}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatAmount(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Region Statistics */}
          {activeTab === 'region' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Viloyatlar Bo'yicha</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {regionStats.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.region?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* District Statistics */}
          {activeTab === 'district' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tumanlar Bo'yicha</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuman</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viloyat</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {districtStats.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.district?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.region?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* MFY Statistics */}
          {activeTab === 'mfy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">MFY Bo'yicha</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFY</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mfyStats.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.mfy?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Agent Statistics */}
          {activeTab === 'agent' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Agentlar Faolligi</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buyurtmalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {agentStats.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.agent?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.agent?.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatAmount(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{item.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Statistics;

