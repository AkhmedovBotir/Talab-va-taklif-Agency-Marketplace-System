import { useState } from 'react';
import Layout from '../components/Layout';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersTable from '../components/orders/OrdersTable';
import OrdersFilters from '../components/orders/OrdersFilters';

export default function Orders() {
  const stages = [
    { id: 'all', name: 'Barchasi' },
    { id: 'marketplace-created', name: 'Marketplace yaratilgan' },
    { id: 'punkt-inbox', name: 'Punkt inbox' },
    { id: 'contragent-requests-created', name: "Kontragent so'rovi yaratilgan" },
    { id: 'punkt-collected-pending', name: 'Punkt yig‘ib olish kutilmoqda' },
    { id: 'punkt-ready-pending', name: 'Punkt tayyorlash kutilmoqda' },
    { id: 'agent-assign-pending', name: 'Agent biriktirish kutilmoqda' },
    { id: 'agent-payment-pending', name: "Agent to'lovi kutilmoqda" },
    { id: 'payment-confirm-pending', name: "To'lov tasdig'i kutilmoqda" },
    { id: 'post-payment-delivery-pending', name: "To'lovdan keyin yetkazish kutilmoqda" },
    { id: 'remainder-handover-pending', name: 'Qoldiq topshirish kutilmoqda' },
    { id: 'ready-for-agent-deliver', name: 'Agent yetkazishga tayyor' },
    { id: 'delivered', name: 'Yetkazilgan' },
  ];
  const [selectedStage, setSelectedStage] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
  });

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleStageChange = (stage) => {
    setSelectedStage(stage);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyurtmalar pipeline</h1>
        
        <OrdersHeader
          selectedStage={selectedStage}
          stages={stages}
          onStageChange={handleStageChange}
        />

        <OrdersFilters filters={filters} onFilterChange={handleFilterChange} />

        <OrdersTable
          selectedStage={selectedStage}
          filters={filters}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </div>
    </Layout>
  );
}
