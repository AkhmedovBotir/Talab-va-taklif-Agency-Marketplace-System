import { useState } from 'react';
import { motion } from 'framer-motion';
import { Archive as ArchiveIcon, LocationOn, AssignmentInd } from '@mui/icons-material';
import ArchivedPunkts from './ArchivedPunkts';
import ArchivedAgents from './ArchivedAgents';

const TABS = [
  {
    id: 'punkts',
    label: 'Arxivlangan Punktlar',
    icon: LocationOn,
    component: ArchivedPunkts,
  },
  {
    id: 'agents',
    label: 'Arxivlangan Agentlar',
    icon: AssignmentInd,
    component: ArchivedAgents,
  },
];

const ArchiveMain = () => {
  const [activeTab, setActiveTab] = useState('punkts');

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ArchiveIcon className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Arxiv</h1>
            <p className="text-sm text-gray-500">O'chirilgan punktlar va agentlar</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all
                  border-b-2 min-w-fit whitespace-nowrap
                  ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="text-lg" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </motion.div>
    </div>
  );
};

export default ArchiveMain;





