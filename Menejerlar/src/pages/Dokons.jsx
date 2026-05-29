import Layout from '../components/Layout';
import DokonsTable from '../components/dokons/DokonsTable';
import DokonsFilters from '../components/dokons/DokonsFilters';
import { useState } from 'react';

export default function Dokons() {
  const [filters, setFilters] = useState({
    status: '',
    tuman: '',
    mfy: '',
    search: '',
    page: 1,
    limit: 50,
  });

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Maxalla do'konlari</h1>
        <DokonsFilters filters={filters} onFilterChange={handleFilterChange} />
        <DokonsTable filters={filters} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>
    </Layout>
  );
}
