import Layout from '../components/Layout';
import AgentsTable from '../components/agents/AgentsTable';
import AgentsFilters from '../components/agents/AgentsFilters';
import { useState } from 'react';

export default function Agents() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Agentlar</h1>
        <AgentsFilters filters={filters} onFilterChange={handleFilterChange} />
        <AgentsTable filters={filters} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>
    </Layout>
  );
}
