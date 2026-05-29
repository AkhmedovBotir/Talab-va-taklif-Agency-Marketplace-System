import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Clear, Add } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { managerAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import useGeoCatalog from '../../hooks/useGeoCatalog';
import ContentStatusPanel from '../../components/common/ContentStatusPanel';
import { resolvePageError } from '../../utils/apiError';
import ManagerTable from '../../components/Managers/ManagerTable';
import CreateManagerModal from '../../components/Managers/CreateManagerModal';
import EditManagerModal from '../../components/Managers/EditManagerModal';
import ViewManagerModal from '../../components/Managers/ViewManagerModal';
import DeleteManagerModal from '../../components/Managers/DeleteManagerModal';

const Managers = () => {
  const { showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const { regions, geoEnabled } = useGeoCatalog();
  const [items, setItems] = useState([]);
  const [pageError, setPageError] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    region_id: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchList = useCallback(async () => {
    const page = pagination.page;
    const limit = pagination.limit;
    setListLoading(true);
    setPageError(null);
    try {
      const res = await managerAPI.getAll({ page, limit });
      if (res.success) {
        const payload = res.data || {};
        const list = Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];
        setItems(list);
        setPagination((prev) => ({
          ...prev,
          page: Number(payload.page) || page,
          limit: Number(payload.limit) || limit,
          total: Number(payload.total) || list.length,
          pages:
            Number(payload.total_pages) ||
            Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || limit || 1)),
        }));
      }
    } catch (e) {
      const pe = resolvePageError(e);
      if (pe) setPageError(pe);
      else showError(e.message || "Ro'yxatni yuklashda xatolik");
    } finally {
      setListLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (filters.status) list = list.filter((i) => i.status === filters.status);
    if (filters.region_id) {
      const rid = String(filters.region_id);
      list = list.filter((i) => {
        const id = i.viloyat_id ?? i.region_id ?? i.region?.id ?? i.region?._id;
        return id != null && String(id) === rid;
      });
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter((i) => i.name?.toLowerCase().includes(q) || String(i.phone || '').includes(q));
    }
    return list;
  }, [items, filters]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) return;
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ status: '', search: '', region_id: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openEdit = (row) => {
    setSelectedId(row.id ?? row._id);
    setEditOpen(true);
  };

  const openView = (row) => {
    setSelectedId(row.id ?? row._id);
    setViewOpen(true);
  };

  const openDelete = (row) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  if (pageError) {
    return <ContentStatusPanel status={pageError.status} message={pageError.message} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <div className="flex items-center gap-3">
            <button type="button" onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Clear className="w-4 h-4" />
              Tozalash
            </button>
            <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium shrink-0">
              <Add className="w-4 h-4" />
              Yangi menejer
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish (joriy sahifa)..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          {geoEnabled && (
            <select value={filters.region_id} onChange={(e) => setFilters((f) => ({ ...f, region_id: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
              <option value="">Barcha viloyatlar</option>
              {regions.map((r) => (
                <option key={r.id ?? r._id} value={String(r.id ?? r._id)}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <select value={pagination.limit} onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
        </div>
      </div>

      <ManagerTable
        rows={filteredItems}
        loading={listLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onView={openView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={() => fetchList()}
        regions={regions}
      />

      <CreateManagerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          fetchList();
        }}
        regions={regions}
      />

      <EditManagerModal
        open={editOpen}
        managerId={selectedId}
        onClose={() => {
          setEditOpen(false);
          setSelectedId(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setSelectedId(null);
          fetchList();
        }}
        regions={regions}
      />

      <ViewManagerModal
        open={viewOpen}
        managerId={selectedId}
        regions={regions}
        onClose={() => {
          setViewOpen(false);
          setSelectedId(null);
        }}
      />

      <DeleteManagerModal
        open={deleteOpen}
        row={selectedRow}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
        }}
        onSuccess={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
          fetchList();
        }}
      />
    </div>
  );
};

export default Managers;
