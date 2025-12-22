import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Visibility, ExpandMore, ChevronRight, Edit, Delete } from '@mui/icons-material';

const CategoryTable = ({ categories, loading, onView, onEdit, onDelete, onCreateSubcategory, pagination, onPageChange }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    return status === 'active'
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-gray-100 text-gray-800`;
  };

  const getCensoredBadge = (censored) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    return censored
      ? `${baseClasses} bg-red-100 text-red-800`
      : `${baseClasses} bg-blue-100 text-blue-800`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
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
            const isExpanded = expandedCategories[category._id];
            const subcategories = category.subcategories || [];

            return (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Category Row */}
                <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleCategory(category._id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={subcategories.length === 0}
                      >
                        {subcategories.length > 0 ? (
                          isExpanded ? (
                            <ExpandMore className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                          <span className="text-xs text-gray-500">({category.slug})</span>
                          <span className={getStatusBadge(category.status)}>
                            {category.status === 'active' ? 'Faol' : 'Nofaol'}
                          </span>
                          <span className={getCensoredBadge(category.censored)}>
                            {category.censored ? 'Censored' : 'Not Censored'}
                          </span>
                          {subcategories.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({subcategories.length} ta subkategoriya)
                            </span>
                          )}
                          {onCreateSubcategory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateSubcategory(category);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
                              title="Subkategoriya qo'shish"
                            >
                              + Subkategoriya
                            </button>
                          )}
                        </div>
                        {category.createdBy && (
                          <div className="mt-1 text-xs text-gray-500">
                            Yaratuvchi: {category.createdBy.name || category.createdBy.inn || '-'}
                            {category.createdByModel && ` (${category.createdByModel})`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {formatDate(category.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onView(category)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Batafsil ko'rish"
                        >
                          <Visibility className="w-4 h-4" />
                        </button>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(category)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(category)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="O'chirish"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcategories (Expanded) */}
                <AnimatePresence>
                  {isExpanded && subcategories.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="pl-16 pr-6 divide-y divide-gray-200">
                        {subcategories.map((subcategory) => (
                          <div
                            key={subcategory._id}
                            className="px-4 py-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {subcategory.name}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      ({subcategory.slug})
                                    </span>
                                    <span className={getStatusBadge(subcategory.status)}>
                                      {subcategory.status === 'active' ? 'Faol' : 'Nofaol'}
                                    </span>
                                    <span className={getCensoredBadge(subcategory.censored)}>
                                      {subcategory.censored ? 'Censored' : 'Not Censored'}
                                    </span>
                                  </div>
                                  {subcategory.createdBy && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      Yaratuvchi: {subcategory.createdBy.name || subcategory.createdBy.inn || '-'}
                                      {subcategory.createdByModel && ` (${subcategory.createdByModel})`}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-500">
                                  {formatDate(subcategory.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onView(subcategory)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Batafsil ko'rish"
                                  >
                                    <Visibility className="w-4 h-4" />
                                  </button>
                                  {onEdit && (
                                    <button
                                      onClick={() => onEdit(subcategory, true)}
                                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                      title="Tahrirlash"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onDelete && (
                                    <button
                                      onClick={() => onDelete(subcategory, true)}
                                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="O'chirish"
                                    >
                                      <Delete className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Jami <span className="font-medium">{pagination.total}</span> ta kategoriyadan{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              ko'rsatilmoqda
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Oldingi
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        pageNum === pagination.page
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Keyingi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;







