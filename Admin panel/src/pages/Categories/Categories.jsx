import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Clear, Add } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { categoryAPI, subcategoryAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CategoryTable from '../../components/Categories/CategoryTable';
import CreateCategoryModal from '../../components/Categories/CreateCategoryModal';
import EditCategoryModal from '../../components/Categories/EditCategoryModal';
import DeleteCategoryModal from '../../components/Categories/DeleteCategoryModal';
import ViewCategoryModal from '../../components/Categories/ViewCategoryModal';

const Categories = ({ hideHeader = false }) => {
  const { showError, showSuccess } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [filters, setFilters] = useState({ status: '', censored: '', search: '' });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubcategoryAction, setIsSubcategoryAction] = useState(false);
  const [parentCategory, setParentCategory] = useState(null);

  const fetchAllSubcategories = useCallback(async () => {
    let page = 1;
    let all = [];
    let keep = true;
    while (keep) {
      const res = await subcategoryAPI.getAll({ page, limit: 100 });
      if (!res.success) break;
      const payload = res.data || {};
      const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      all = all.concat(list);
      const pages = Number(payload.total_pages) || Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || 100));
      if (!pages || page >= pages || list.length === 0) keep = false;
      else page += 1;
    }
    return all;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      const cRes = await categoryAPI.getAll(params);
      if (cRes.success) {
        const payload = cRes.data || {};
        const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
        const subs = await fetchAllSubcategories();
        setSubcategories(subs);
        setItems(list);
        setPagination((p) => ({
          ...p,
          page: Number(payload.page) || p.page,
          limit: Number(payload.limit) || p.limit,
          total: Number(payload.total) || list.length,
          pages: Number(payload.total_pages) || Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || p.limit || 1)),
        }));
      }
    } catch (e) {
      showError(e.message || 'Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, fetchAllSubcategories, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      onCreateCategory();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const grouped = useMemo(() => {
    const byParent = new Map();
    for (const sub of subcategories) {
      const pid = sub.parent_id ?? sub.parent?.id ?? sub.parent?._id;
      if (!pid) continue;
      const key = String(pid);
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(sub);
    }
    return items.map((c) => {
      const id = String(c.id ?? c._id);
      return { ...c, subcategories: byParent.get(id) || [] };
    });
  }, [items, subcategories]);

  const filtered = useMemo(() => {
    return grouped.filter((category) => {
      if (filters.status && category.status !== filters.status) return false;
      if (filters.censored !== '' && String(Boolean(category.censored)) !== filters.censored) return false;
      if (!filters.search) return true;
      const q = filters.search.toLowerCase();
      return (
        category.name?.toLowerCase().includes(q) ||
        category.slug?.toLowerCase().includes(q) ||
        (category.subcategories || []).some((s) => s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q))
      );
    });
  }, [grouped, filters]);

  const onCreateCategory = () => {
    setIsSubcategoryAction(false);
    setParentCategory(null);
    setCreateOpen(true);
  };

  const onCreateSub = (parent) => {
    setIsSubcategoryAction(true);
    setParentCategory(parent);
    setCreateOpen(true);
  };

  const onView = (row, isSubcategory) => {
    setSelected(row);
    setIsSubcategoryAction(Boolean(isSubcategory));
    setViewOpen(true);
  };

  const onEdit = (row, isSubcategory) => {
    setSelected(row);
    setIsSubcategoryAction(Boolean(isSubcategory));
    setEditOpen(true);
  };

  const onDelete = (row, isSubcategory) => {
    setSelected(row);
    setIsSubcategoryAction(Boolean(isSubcategory));
    setDeleteOpen(true);
  };

  const onToggleStatus = async (row, status, isSubcategory) => {
    try {
      const id = row.id ?? row._id;
      const res = isSubcategory ? await subcategoryAPI.updateStatus(id, status) : await categoryAPI.updateStatus(id, status);
      if (res.success) {
        showSuccess(res.message || 'Status yangilandi');
        await fetchData();
        return true;
      }
    } catch (e) {
      showError(e.message || 'Statusni yangilashda xatolik');
    }
    return false;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Kategoriyalar</h2>
            <p className="text-gray-600 text-sm">Category va subcategory boshqaruvi</p>
          </div>
          <button type="button" onClick={onCreateCategory} className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium shrink-0">
            <Add />
            Yangi kategoriya
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setFilters({ status: '', censored: '', search: '' })} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Clear className="w-4 h-4" />
              Tozalash
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Qidirish..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
          <select value={filters.censored} onChange={(e) => setFilters((p) => ({ ...p, censored: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
            <option value="">Barchasi (censored)</option>
            <option value="true">Censored</option>
            <option value="false">Not censored</option>
          </select>
          <select value={pagination.limit} onChange={(e) => setPagination((p) => ({ ...p, page: 1, limit: Number(e.target.value) }))} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
            <option value="100">100 ta</option>
          </select>
        </div>
      </div>

      <CategoryTable
        categories={filtered}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateSubcategory={onCreateSub}
        onToggleStatus={onToggleStatus}
      />

      <CreateCategoryModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setParentCategory(null);
        }}
        onSuccess={() => {
          setCreateOpen(false);
          setParentCategory(null);
          fetchData();
        }}
        isSubcategory={isSubcategoryAction}
        parentCategory={parentCategory}
        categories={items}
      />

      <EditCategoryModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setSelected(null);
          fetchData();
        }}
        item={selected}
        isSubcategory={isSubcategoryAction}
        categories={items}
      />

      <ViewCategoryModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        item={selected}
        isSubcategory={isSubcategoryAction}
        categories={items}
      />

      <DeleteCategoryModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelected(null);
        }}
        onSuccess={() => {
          setDeleteOpen(false);
          setSelected(null);
          fetchData();
        }}
        item={selected}
        isSubcategory={isSubcategoryAction}
      />
    </div>
  );
};

export default Categories;
