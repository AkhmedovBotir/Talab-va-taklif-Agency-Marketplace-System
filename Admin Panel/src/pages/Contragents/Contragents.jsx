import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Category, Business } from '@mui/icons-material';
import { contragentAPI, contragentTypeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ContragentTable from '../../components/Contragents/ContragentTable';
import CreateContragentModal from '../../components/Contragents/CreateContragentModal';
import EditContragentModal from '../../components/Contragents/EditContragentModal';
import DeleteContragentModal from '../../components/Contragents/DeleteContragentModal';
import ViewContragentModal from '../../components/Contragents/ViewContragentModal';
import ContragentTypeTable from '../../components/ContragentTypes/ContragentTypeTable';
import CreateContragentTypeModal from '../../components/ContragentTypes/CreateContragentTypeModal';
import EditContragentTypeModal from '../../components/ContragentTypes/EditContragentTypeModal';
import DeleteContragentTypeModal from '../../components/ContragentTypes/DeleteContragentTypeModal';
import ViewContragentTypeModal from '../../components/ContragentTypes/ViewContragentTypeModal';
import { Add, Search, Clear } from '@mui/icons-material';
import RegionSelect from '../../components/Regions/RegionSelect';

const TABS = [
  {
    id: 'types',
    label: 'Kontragent Turlari',
    icon: Category,
  },
  {
    id: 'contragents',
    label: 'Kontragentlar',
    icon: Business,
  },
];

const Contragents = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState('types');

  // Contragent Types State
  const [contragentTypes, setContragentTypes] = useState([]);
  const [contragentTypesLoading, setContragentTypesLoading] = useState(false);
  const [contragentTypesError, setContragentTypesError] = useState('');
  const [contragentTypesFilters, setContragentTypesFilters] = useState({
    status: '',
    search: '',
  });

  // Contragent Types Modals
  const [createTypeModalOpen, setCreateTypeModalOpen] = useState(false);
  const [editTypeModalOpen, setEditTypeModalOpen] = useState(false);
  const [deleteTypeModalOpen, setDeleteTypeModalOpen] = useState(false);
  const [viewTypeModalOpen, setViewTypeModalOpen] = useState(false);
  const [selectedContragentType, setSelectedContragentType] = useState(null);

  // Contragents State
  const [contragents, setContragents] = useState([]);
  const [contragentsLoading, setContragentsLoading] = useState(false);
  const [contragentsError, setContragentsError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Contragents Filters
  const [contragentsFilters, setContragentsFilters] = useState({
    status: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    search: '',
  });

  // Contragents Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContragent, setSelectedContragent] = useState(null);

  // Fetch Contragent Types
  const fetchContragentTypes = async () => {
    setContragentTypesLoading(true);
    setContragentTypesError('');
    try {
      const response = await contragentTypeAPI.getAllContragentTypes({
        status: contragentTypesFilters.status || undefined,
      });

      if (response.success) {
        let types = response.data || [];
        
        // Client-side search
        if (contragentTypesFilters.search) {
          const search = contragentTypesFilters.search.toLowerCase();
          types = types.filter((type) =>
            type.name?.toLowerCase().includes(search) ||
            type.icon?.toLowerCase().includes(search)
          );
        }
        
        setContragentTypes(types);
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragent turlarini yuklashda xatolik yuz berdi';
      setContragentTypesError(errorMsg);
      showError(errorMsg);
    } finally {
      setContragentTypesLoading(false);
    }
  };

  // Fetch Contragents
  const fetchContragents = async () => {
    setContragentsLoading(true);
    setContragentsError('');
    try {
      const response = await contragentAPI.getAllContragents({
        page: pagination.page,
        limit: pagination.limit,
        status: contragentsFilters.status || undefined,
        viloyat: contragentsFilters.viloyat || undefined,
        tuman: contragentsFilters.tuman || undefined,
        mfy: contragentsFilters.mfy || undefined,
      });

      if (response.success) {
        let data = response.data || [];
        
        // Client-side search
        if (contragentsFilters.search) {
          const search = contragentsFilters.search.toLowerCase();
          data = data.filter((contragent) =>
            contragent.name?.toLowerCase().includes(search) ||
            contragent.inn?.includes(search) ||
            contragent.phone?.includes(search)
          );
        }
        
        setContragents(data);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragentlarni yuklashda xatolik yuz berdi';
      setContragentsError(errorMsg);
      showError(errorMsg);
    } finally {
      setContragentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'types') {
      fetchContragentTypes();
    } else {
      fetchContragents();
    }
  }, [activeTab, contragentTypesFilters.status, contragentTypesFilters.search, pagination.page, pagination.limit, contragentsFilters.status, contragentsFilters.viloyat, contragentsFilters.tuman, contragentsFilters.mfy, contragentsFilters.search]);

  // Contragent Types Handlers
  const handleCreateTypeSuccess = () => {
    setCreateTypeModalOpen(false);
    fetchContragentTypes();
  };

  const handleEditTypeSuccess = () => {
    setEditTypeModalOpen(false);
    setSelectedContragentType(null);
    fetchContragentTypes();
  };

  const handleDeleteTypeSuccess = () => {
    setDeleteTypeModalOpen(false);
    setSelectedContragentType(null);
    fetchContragentTypes();
  };

  const handleEditType = (type) => {
    setSelectedContragentType(type);
    setEditTypeModalOpen(true);
  };

  const handleDeleteType = (type) => {
    setSelectedContragentType(type);
    setDeleteTypeModalOpen(true);
  };

  const handleViewType = (type) => {
    setSelectedContragentType(type);
    setViewTypeModalOpen(true);
  };

  // Contragents Handlers
  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchContragents();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedContragent(null);
    fetchContragents();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedContragent(null);
    fetchContragents();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleEdit = (contragent) => {
    setSelectedContragent(contragent);
    setEditModalOpen(true);
  };

  const handleDelete = (contragent) => {
    setSelectedContragent(contragent);
    setDeleteModalOpen(true);
  };

  const handleView = (contragent) => {
    setSelectedContragent(contragent);
    setViewModalOpen(true);
  };

  // Clear filters
  const handleClearTypeFilters = () => {
    setContragentTypesFilters({
      status: '',
      search: '',
    });
  };

  const handleClearContragentsFilters = () => {
    setContragentsFilters({
      status: '',
      viloyat: '',
      tuman: '',
      mfy: '',
      search: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Kontragentlar</h1>
              <p className="text-gray-600">Kontragent turlari va kontragentlarni boshqarish</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
      >
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
            <div className="flex min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex items-center gap-2
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="min-h-[400px]"
      >
        {activeTab === 'types' ? (
          <>
            {/* Contragent Types Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Kontragent Turlari</h2>
                <p className="text-gray-600 text-sm">Kontragent faoliyat turlarini boshqarish</p>
              </div>
              <button
                onClick={() => setCreateTypeModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                <Add />
                <span>Yangi Tur</span>
              </button>
            </div>

            {/* Contragent Types Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
                <button
                  onClick={handleClearTypeFilters}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Clear className="w-4 h-4" />
                  <span>Tozalash</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={contragentTypesFilters.search}
                    onChange={(e) => setContragentTypesFilters({ ...contragentTypesFilters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={contragentTypesFilters.status}
                  onChange={(e) => setContragentTypesFilters({ ...contragentTypesFilters, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Barcha statuslar</option>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
            </motion.div>

            {/* Error Message */}
            {contragentTypesError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{contragentTypesError}</p>
              </div>
            )}

            {/* Contragent Types Table */}
            <ContragentTypeTable
              contragentTypes={contragentTypes}
              loading={contragentTypesLoading}
              onEdit={handleEditType}
              onDelete={handleDeleteType}
              onView={handleViewType}
              onStatusChange={fetchContragentTypes}
            />
          </>
        ) : (
          <>
            {/* Contragents Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Kontragentlar</h2>
                <p className="text-gray-600 text-sm">Kontragentlarni boshqarish va ko'rish</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                <Add />
                <span>Yangi Kontragent</span>
              </button>
            </div>

            {/* Contragents Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
                <button
                  onClick={handleClearContragentsFilters}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Clear className="w-4 h-4" />
                  <span>Tozalash</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Qidirish..."
                      value={contragentsFilters.search}
                      onChange={(e) => setContragentsFilters({ ...contragentsFilters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={contragentsFilters.status}
                    onChange={(e) => {
                      setContragentsFilters({ ...contragentsFilters, status: e.target.value });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Barcha statuslar</option>
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RegionSelect
                    name="viloyat"
                    value={contragentsFilters.viloyat}
                    onChange={(e) => {
                      const value = e.target.value;
                      setContragentsFilters({ ...contragentsFilters, viloyat: value, tuman: '', mfy: '' });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    label="Viloyat bo'yicha filter"
                    type="region"
                  />
                  <RegionSelect
                    name="tuman"
                    value={contragentsFilters.tuman}
                    onChange={(e) => {
                      const value = e.target.value;
                      setContragentsFilters({ ...contragentsFilters, tuman: value, mfy: '' });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    label="Tuman bo'yicha filter"
                    type="district"
                    parentId={contragentsFilters.viloyat || null}
                    disabled={!contragentsFilters.viloyat}
                  />
                  <RegionSelect
                    name="mfy"
                    value={contragentsFilters.mfy}
                    onChange={(e) => {
                      setContragentsFilters({ ...contragentsFilters, mfy: e.target.value });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    label="MFY bo'yicha filter"
                    type="mfy"
                    parentId={contragentsFilters.tuman || null}
                    disabled={!contragentsFilters.tuman}
                  />
                </div>
              </div>
            </motion.div>

            {/* Error Message */}
            {contragentsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{contragentsError}</p>
              </div>
            )}

            {/* Contragents Table */}
            <ContragentTable
              contragents={contragents}
              loading={contragentsLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              pagination={pagination}
              onPageChange={handlePageChange}
              onStatusChange={fetchContragents}
            />
          </>
        )}
      </motion.div>

      {/* Contragent Types Modals */}
      <CreateContragentTypeModal
        open={createTypeModalOpen}
        onClose={() => setCreateTypeModalOpen(false)}
        onSuccess={handleCreateTypeSuccess}
      />

      {selectedContragentType && (
        <>
          <ViewContragentTypeModal
            open={viewTypeModalOpen}
            onClose={() => {
              setViewTypeModalOpen(false);
              setSelectedContragentType(null);
            }}
            contragentType={selectedContragentType}
          />

          <EditContragentTypeModal
            open={editTypeModalOpen}
            onClose={() => {
              setEditTypeModalOpen(false);
              setSelectedContragentType(null);
            }}
            onSuccess={handleEditTypeSuccess}
            contragentType={selectedContragentType}
          />

          <DeleteContragentTypeModal
            open={deleteTypeModalOpen}
            onClose={() => {
              setDeleteTypeModalOpen(false);
              setSelectedContragentType(null);
            }}
            onSuccess={handleDeleteTypeSuccess}
            contragentType={selectedContragentType}
          />
        </>
      )}

      {/* Contragents Modals */}
      <CreateContragentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedContragent && (
        <>
          <ViewContragentModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedContragent(null);
            }}
            contragent={selectedContragent}
          />

          <EditContragentModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedContragent(null);
            }}
            onSuccess={handleEditSuccess}
            contragent={selectedContragent}
          />

          <DeleteContragentModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedContragent(null);
            }}
            onSuccess={handleDeleteSuccess}
            contragent={selectedContragent}
          />
        </>
      )}
    </div>
  );
};

export default Contragents;
