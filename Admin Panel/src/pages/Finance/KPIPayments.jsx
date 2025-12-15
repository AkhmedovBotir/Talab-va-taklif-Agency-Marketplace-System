import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  PendingActions, 
  CheckCircle, 
  Analytics,
  Sync
} from '@mui/icons-material';
import UnpaidPaymentsTab from '../../components/Finance/KPIPayments/UnpaidPaymentsTab';
import PaidPaymentsTab from '../../components/Finance/KPIPayments/PaidPaymentsTab';
import PaymentStatisticsTab from '../../components/Finance/KPIPayments/PaymentStatisticsTab';
import SyncPaymentsTab from '../../components/Finance/KPIPayments/SyncPaymentsTab';

const tabs = [
  { id: 'unpaid', label: 'To\'lanmagan to\'lovlar', icon: PendingActions },
  { id: 'paid', label: 'To\'langan to\'lovlar', icon: CheckCircle },
  { id: 'statistics', label: 'Statistika', icon: Analytics },
  { id: 'sync', label: 'Sinxronlashtirish', icon: Sync },
];

const KPIPayments = () => {
  const [activeTab, setActiveTab] = useState('unpaid');

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">KPI To'lovlar Tarqatish</h1>
        </div>
        <p className="text-gray-600">KPI bonuslarini tarqatish va boshqarish</p>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
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
      >
        {activeTab === 'unpaid' && <UnpaidPaymentsTab />}
        {activeTab === 'paid' && <PaidPaymentsTab />}
        {activeTab === 'statistics' && <PaymentStatisticsTab />}
        {activeTab === 'sync' && <SyncPaymentsTab />}
      </motion.div>
    </div>
  );
};

export default KPIPayments;


