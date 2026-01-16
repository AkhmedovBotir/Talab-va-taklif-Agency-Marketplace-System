import { useState } from 'react';
import Layout from '../components/Layout';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersTable from '../components/orders/OrdersTable';
import OrdersFilters from '../components/orders/OrdersFilters';

export default function Orders() {
  // Main tabs: 'tuman' or 'maxalla'
  const [mainTab, setMainTab] = useState('tuman');
  
  // Sub tabs for tuman
  const tumanSubTabs = [
    { id: '', name: 'Barchasi' },
    { id: 'marketplace', name: 'Marketplace' },
    { id: 'confirmed-by-punkt', name: 'Punkt Qabul Qilgan' },
    { id: 'requested-to-contragents', name: 'Kontragentlarga Yuborilgan' },
    { id: 'delivered-to-punkt', name: 'Punktga Yetkazilgan' },
    { id: 'assigned-to-agents', name: 'Agentga Yuborilgan' },
    { id: 'confirmed-by-agents', name: 'Agent Topshirgan' },
    { id: 'confirmed-by-customers', name: 'Mijoz Qabul Qilgan' },
    { id: 'cancelled', name: 'Qaytarilgan' },
  ];

  // Sub tabs for maxalla
  const maxallaSubTabs = [
    { id: '', name: 'Barchasi' },
    { id: 'marketplace', name: 'Marketplace' },
    { id: 'requested-to-contragents', name: 'Kontragentlarga Yuborilgan' },
    { id: 'confirmed-by-customers', name: 'Mijoz Qabul Qilgan' },
    { id: 'cancelled', name: 'Qaytarilgan' },
  ];

  const [subTab, setSubTab] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    orderNumber: '',
    user: '',
    tuman: '',
    startDate: '',
    endDate: '',
    minTotalPrice: '',
    maxTotalPrice: '',
    search: '',
    page: 1,
    limit: 50,
  });

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSubTab('');
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleSubTabChange = (tab) => {
    setSubTab(tab);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const currentSubTabs = mainTab === 'tuman' ? tumanSubTabs : maxallaSubTabs;

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyurtmalar</h1>
        
        <OrdersHeader
          mainTab={mainTab}
          subTab={subTab}
          subTabs={currentSubTabs}
          onMainTabChange={handleMainTabChange}
          onSubTabChange={handleSubTabChange}
        />

        <OrdersFilters filters={filters} onFilterChange={handleFilterChange} />

        <OrdersTable
          mainTab={mainTab}
          subTab={subTab}
          filters={filters}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </div>
    </Layout>
  );
}
