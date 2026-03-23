import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Analytics, Comment, Star, Devices } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllowedTabIdsForSection } from '../../utils/permissions';
import KPISettings from '../../components/Settings/KPISettings';
import CommentTemplatesContent from '../../components/Settings/CommentTemplatesContent';
import FeaturedContragentsSettings from '../../components/Settings/FeaturedContragentsSettings';
import DeviceManagement from '../../components/Settings/DeviceManagement';

const tabs = [
  { id: 'kpi', label: 'KPI sozlamalari', icon: Analytics },
  { id: 'comment-templates', label: 'Kommentariya Shablonlari', icon: Comment },
  { id: 'featured-contragents', label: 'Tanlangan Kontragentlar', icon: Star },
  { id: 'devices', label: 'Qurilma Boshqaruvi', icon: Devices },
];

const BASE_PATH = '/dashboard/settings';

const Settings = () => {
  const { admin } = useAuth();
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();

  const allowedTabIds = getAllowedTabIdsForSection(admin?.permissions || [], BASE_PATH);
  const allowedTabs = tabs.filter((t) => allowedTabIds.length === 0 || allowedTabIds.includes(t.id));
  const defaultTab = allowedTabs[0]?.id || 'kpi';
  const activeTab = (allowedTabIds.length === 0 ? tabs.map((t) => t.id).includes(tabParam) : allowedTabIds.includes(tabParam))
    ? tabParam
    : defaultTab;

  useEffect(() => {
    if (allowedTabIds.length > 0 && tabParam && !allowedTabIds.includes(tabParam)) {
      navigate(`${BASE_PATH}/${defaultTab}`, { replace: true });
    }
  }, [allowedTabIds, tabParam, defaultTab, navigate]);

  const setActiveTab = (tabId) => {
    if (allowedTabIds.length === 0 || allowedTabIds.includes(tabId)) {
      navigate(`/dashboard/settings/${tabId}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Sozlamalar</h1>
        </div>
        <p className="text-gray-600">Tizim sozlamalarini boshqarish</p>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200">
          {allowedTabs.map((tab) => {
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

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        {activeTab === 'kpi' && <div className="p-6"><KPISettings /></div>}
        {activeTab === 'comment-templates' && <div className="p-6"><CommentTemplatesContent /></div>}
        {activeTab === 'featured-contragents' && <div className="p-6"><FeaturedContragentsSettings /></div>}
        {activeTab === 'devices' && <div className="p-6"><DeviceManagement /></div>}
      </motion.div>
    </div>
  );
};

export default Settings;


