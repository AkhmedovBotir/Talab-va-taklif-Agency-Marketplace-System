import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Clear, Add } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { productAPI, contragentAPI, categoryAPI, subcategoryAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import GeoSearchableSelect from '../../components/DistrictContragents/GeoSearchableSelect';
import ProductTable from '../../components/Products/ProductTable';
import CreateProductModal from '../../components/Products/CreateProductModal';
import EditProductModal from '../../components/Products/EditProductModal';
import ViewProductModal from '../../components/Products/ViewProductModal';
import DeleteProductModal from '../../components/Products/DeleteProductModal';
import RejectProductModal from '../../components/Products/RejectProductModal';

const fetchAllPages = async (fetchPage) => {
  let page = 1;
  let all = [];
  let keep = true;
  while (keep) {
    const res = await fetchPage(page);
    if (!res.success) break;
    const payload = res.data || {};
    const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
    const lim = Number(payload.limit) || 100;
    all = all.concat(list);
    const pages = Number(payload.total_pages) || Math.ceil((Number(payload.total) || list.length) / lim);
    if (!pages || page >= pages || list.length === 0) keep = false;
    else page += 1;
  }
  return all;
};

const WarehouseProducts = () => {
  const { showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contragents, setContragents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [refsLoading, setRefsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    contragent_id: '',
    moderation_status: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rejectRow, setRejectRow] = useState(null);

  const loadReferences = useCallback(async () => {
    setRefsLoading(true);
    try {
      const [cAgents, cats, subs] = await Promise.all([
        fetchAllPages((page) => contragentAPI.getAll({ page, limit: 100 })),
        fetchAllPages((page) => categoryAPI.getAll({ page, limit: 100 })),
        fetchAllPages((page) => subcategoryAPI.getAll({ page, limit: 100 })),
      ]);
      setContragents(cAgents);
      setCategories(cats);
      setSubcategories(subs);
    } catch (e) {
      showError(e.message || 'Maʼlumotlarni yuklashda xatolik');
    } finally {
      setRefsLoading(false);
    }
  }, [showError]);

  const fetchList = useCallback(async () => {
    const page = pagination.page;
    const limit = pagination.limit;
    setListLoading(true);
    try {
      const res = await productAPI.getAll({
        page,
        limit,
        contragent_id: filters.contragent_id || undefined,
        moderation_status: filters.moderation_status || undefined,
      });
      if (res.success) {
        const payload = res.data || {};
        const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
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
      showError(e.message || 'Mahsulotlarni yuklashda xatolik');
    } finally {
      setListLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.contragent_id, filters.moderation_status, showError]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

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
    if (!filters.search.trim()) return items;
    const q = filters.search.toLowerCase();
    return items.filter(
      (i) =>
        i.name?.toLowerCase().includes(q) ||
        String(i.product_code || '')
          .toLowerCase()
          .includes(q)
    );
  }, [items, filters.search]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) return;
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ search: '', contragent_id: '', moderation_status: '' });
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

  const openReject = (row) => {
    setRejectRow(row);
    setRejectOpen(true);
  };

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
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={refsLoading}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-medium shrink-0 disabled:opacity-50"
            >
              <Add className="w-4 h-4" />
              Yangi mahsulot
            </button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="w-full lg:w-[300px] shrink-0">
            <GeoSearchableSelect
              label="Kontragent"
              required
              value={filters.contragent_id}
              onChange={(val) => {
                setFilters((f) => ({ ...f, contragent_id: val }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              options={contragents.map((c) => ({
                id: String(c.id ?? c._id),
                title: c.name || c.company_name || `#${c.id ?? c._id}`,
                subtitle: c.phone || c.username || '',
              }))}
              emptyMessage="Kontragentlar topilmadi"
              lockedHint={refsLoading ? 'Yuklanmoqda...' : 'Kontragent tanlang'}
              optionalPlaceholder="Kontragent tanlang"
            />
          </div>
          <div className="relative w-full lg:flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish (joriy sahifa)..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.moderation_status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, moderation_status: e.target.value }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full lg:w-[220px] shrink-0 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha moderatsiya</option>
            <option value="pending">Kutilmoqda</option>
            <option value="approved">Tasdiqlangan</option>
            <option value="rejected">Rad etilgan</option>
          </select>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            className="w-full lg:w-[110px] shrink-0 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
        </div>
      </div>

      <ProductTable
        rows={filteredItems}
        loading={listLoading}
        onEdit={openEdit}
        onDelete={openDelete}
        onView={openView}
        onReject={openReject}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={() => fetchList()}
        contragents={contragents}
      />

      <CreateProductModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          fetchList();
        }}
        contragents={contragents}
        categories={categories}
        subcategories={subcategories}
      />

      <EditProductModal
        open={editOpen}
        productId={selectedId}
        onClose={() => {
          setEditOpen(false);
          setSelectedId(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setSelectedId(null);
          fetchList();
        }}
        contragents={contragents}
        categories={categories}
        subcategories={subcategories}
      />

      <ViewProductModal
        open={viewOpen}
        productId={selectedId}
        onClose={() => {
          setViewOpen(false);
          setSelectedId(null);
        }}
        contragents={contragents}
        categories={categories}
        subcategories={subcategories}
      />

      <DeleteProductModal
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

      <RejectProductModal
        open={rejectOpen}
        productId={rejectRow?.id ?? rejectRow?._id}
        productName={rejectRow?.name}
        onClose={() => {
          setRejectOpen(false);
          setRejectRow(null);
        }}
        onSuccess={() => {
          setRejectOpen(false);
          setRejectRow(null);
          fetchList();
        }}
      />
    </div>
  );
};

export default WarehouseProducts;
