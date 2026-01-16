import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { agentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import AgentTable from '../../components/Agents/AgentTable';
import CreateAgentModal from '../../components/Agents/CreateAgentModal';
import EditAgentModal from '../../components/Agents/EditAgentModal';
import DeleteAgentModal from '../../components/Agents/DeleteAgentModal';
import ViewAgentModal from '../../components/Agents/ViewAgentModal';
import RegionSelect from '../../components/Regions/RegionSelect';
import { Add, Search, Clear } from '@mui/icons-material';

const Agents = () => {
  const { showError } = useSnackbar();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    viloyat: '',
    tuman: '',
    mfy: '',
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch agents
  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.viloyat) params.viloyat = filters.viloyat;
      if (filters.tuman) params.tuman = filters.tuman;
      if (filters.mfy) params.mfy = filters.mfy;

      const response = await agentAPI.getAllAgents(params);

      if (response.success) {
        // API returns { success: true, count, total, page, limit, totalPages, data: [...] }
        setAgents(response.data || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Agentlarni yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.status, filters.viloyat, filters.tuman, filters.mfy]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchAgents();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedAgent(null);
    fetchAgents();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedAgent(null);
    fetchAgents();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setEditModalOpen(true);
  };

  const handleDelete = (agent) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  const handleView = (agent) => {
    setSelectedAgent(agent);
    setViewModalOpen(true);
  };

  // Filter by search (client-side)
  const filteredAgents = agents.filter((agent) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(search) ||
      agent.phone?.includes(search) ||
      agent.viloyat?.name?.toLowerCase().includes(search) ||
      agent.tuman?.name?.toLowerCase().includes(search) ||
      agent.mfy?.name?.toLowerCase().includes(search)
    );
  });

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      viloyat: '',
      tuman: '',
      mfy: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle region changes
  const handleViloyatChange = (e) => {
    const viloyatId = e.target.value;
    setFilters(prev => ({
      ...prev,
      viloyat: viloyatId,
      tuman: '', // Reset tuman when viloyat changes
      mfy: '', // Reset mfy when viloyat changes
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTumanChange = (e) => {
    const tumanId = e.target.value;
    setFilters(prev => ({
      ...prev,
      tuman: tumanId,
      mfy: '', // Reset mfy when tuman changes
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleMfyChange = (e) => {
    const mfyId = e.target.value;
    setFilters(prev => ({
      ...prev,
      mfy: mfyId,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Agentlar</h1>
            <p className="text-gray-600">Agentlarni boshqarish va ko'rish</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            <Add />
            <span>Yangi Agent</span>
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>

          {/* Limit */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination({ ...pagination, limit: Number(e.target.value), page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
        </div>
      </motion.div>

      {/* Region Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Hudud Filterlari</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <RegionSelect
              name="viloyat"
              value={filters.viloyat}
              onChange={handleViloyatChange}
              label="Viloyat"
              type="region"
            />
          </div>
          <div>
            <RegionSelect
              name="tuman"
              value={filters.tuman}
              onChange={handleTumanChange}
              label="Tuman"
              type="district"
              parentId={filters.viloyat || undefined}
              disabled={!filters.viloyat}
            />
          </div>
          <div>
            <RegionSelect
              name="mfy"
              value={filters.mfy}
              onChange={handleMfyChange}
              label="MFY"
              type="mfy"
              parentId={filters.tuman || undefined}
              disabled={!filters.tuman}
            />
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <AgentTable
        agents={filteredAgents}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusChange={fetchAgents}
      />

      {/* Modals */}
      <CreateAgentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedAgent && (
        <>
          <ViewAgentModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedAgent(null);
            }}
            agent={selectedAgent}
          />

          <EditAgentModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedAgent(null);
            }}
            onSuccess={handleEditSuccess}
            agent={selectedAgent}
          />

          <DeleteAgentModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedAgent(null);
            }}
            onSuccess={handleDeleteSuccess}
            agent={selectedAgent}
          />
        </>
      )}
    </div>
  );
};

export default Agents;

