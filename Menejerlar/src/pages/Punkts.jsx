import Layout from '../components/Layout';
import PunktsTable from '../components/punkts/PunktsTable';
import PunktsFilters from '../components/punkts/PunktsFilters';
import { useState } from 'react';

export default function Punkts() {
  const [filters, setFilters] = useState({
    status: '',
    tuman: '',
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Punktlar</h1>
        <PunktsFilters filters={filters} onFilterChange={handleFilterChange} />
        <PunktsTable filters={filters} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>
    </Layout>
  );
}
