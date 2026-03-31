import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Visibility,
  ExpandMore,
  ChevronRight,
  Edit,
  Delete,
  Add,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { formatTableDate } from '../../utils/dateFormatter';

const badge = (ok, okText, noText) =>
  ok
    ? `px-2 py-1 rounded text-xs font-medium ${okText}`
    : `px-2 py-1 rounded text-xs font-medium ${noText}`;

const CategoryTable = ({ categories, loading, pagination, onPageChange, onView, onEdit, onDelete, onCreateSubcategory, onToggleStatus }) => {
  const [expanded, setExpanded] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const statusKey = (row, isSub) => `${isSub ? 'sub' : 'cat'}-${row.id ?? row._id}`;

  const handleToggleStatus = async (row, isSub) => {
    const key = statusKey(row, isSub);
    if (statusUpdating[key]) return;
    const nextStatus = row.status === 'active' ? 'inactive' : 'active';
    setStatusUpdating((prev) => ({ ...prev, [key]: true }));
    try {
      await onToggleStatus?.(row, nextStatus, isSub);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getVisiblePages = () => {
    const totalPages = pagination?.pages || 0;
    const current = pagination?.page || 1;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (current >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', current - 1, current, current + 1, '...', totalPages];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Kategoriyalar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="divide-y divide-gray-200">
          {categories.map((category, index) => {
            const subs = category.subcategories || [];
            const isOpen = !!expanded[category.id ?? category._id];
            const id = category.id ?? category._id;
            const categoryStatusKey = statusKey(category, false);
            return (
              <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <div className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggle(id)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={subs.length === 0}
                      >
                        {subs.length > 0 ? isOpen ? <ExpandMore className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" /> : <div className="w-5 h-5" />}
                      </button>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-10 h-10 rounded-md object-cover border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                          {(category.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{category.name}</h3>
                          <span className="text-xs text-gray-500">({category.slug})</span>
                          <span className={badge(category.status === 'active', 'bg-green-100 text-green-800', 'bg-gray-100 text-gray-700')}>
                            {category.status === 'active' ? 'Faol' : 'Nofaol'}
                          </span>
                          <span className={badge(category.censored, 'bg-red-100 text-red-800', 'bg-blue-100 text-blue-800')}>
                            {category.censored ? 'Censored' : 'Not censored'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCreateSubcategory?.(category)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-50"
                          >
                            <Add className="w-3 h-3" />
                            Subkategoriya
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.status === 'active'}
                          onChange={() => handleToggleStatus(category, false)}
                          disabled={statusUpdating[categoryStatusKey]}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:left-[2px] after:top-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all" />
                      </label>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{formatTableDate(category.createdAt || category.created_at)}</div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => onView?.(category, false)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Visibility className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onEdit?.(category, false)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onDelete?.(category, false)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Delete className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isOpen && subs.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="pl-16 pr-6 divide-y divide-gray-200">
                        {subs.map((sub) => {
                          const sid = sub.id ?? sub._id;
                          const subStatusKey = statusKey(sub, true);
                          return (
                            <div key={sid} className="py-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-gray-900 truncate">{sub.name}</p>
                                  <span className="text-xs text-gray-500">({sub.slug})</span>
                                  <span className={badge(sub.status === 'active', 'bg-green-100 text-green-800', 'bg-gray-100 text-gray-700')}>
                                    {sub.status === 'active' ? 'Faol' : 'Nofaol'}
                                  </span>
                                  <span className={badge(sub.censored, 'bg-red-100 text-red-800', 'bg-blue-100 text-blue-800')}>
                                    {sub.censored ? 'Censored' : 'Not censored'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={sub.status === 'active'}
                                    onChange={() => handleToggleStatus(sub, true)}
                                    disabled={statusUpdating[subStatusKey]}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:left-[2px] after:top-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all" />
                                </label>
                                <div className="text-xs text-gray-500 whitespace-nowrap">{formatTableDate(sub.createdAt || sub.created_at)}</div>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => onView?.(sub, true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Visibility className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => onEdit?.(sub, true)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => onDelete?.(sub, true)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Delete className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {pagination?.pages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> tadan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              ko'rsatilmoqda
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <FirstPage className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <NavigateBefore className="w-4 h-4" />
                <span>Oldingi</span>
              </button>

              <div className="flex items-center gap-1">
                {getVisiblePages().map((pageNum, idx) =>
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1.5 border rounded-md text-sm min-w-9 transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <span>Keyingi</span>
                <NavigateNext className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(pagination.pages)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <LastPage className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;
