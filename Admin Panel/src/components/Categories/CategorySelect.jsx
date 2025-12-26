import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { categoryManagementAPI } from '../../services/api';

const CategorySelect = ({ value, onChange, disabled, label, required, name, status = 'active', onCategoriesLoad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [displayedCategories, setDisplayedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch categories
  const fetchAllCategories = useCallback(async () => {
    setLoading(true);
    try {
      let allCategoriesList = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const params = {
          status,
          page,
          limit: 100,
        };

        const response = await categoryManagementAPI.getAllCategories(params);

        if (response.success) {
          const categories = response.data || [];
          allCategoriesList = [...allCategoriesList, ...categories];

          // Check pagination
          if (response.totalPages && page < response.totalPages) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      setAllCategories(allCategoriesList);
      setFilteredCategories(allCategoriesList);
      
      // Notify parent component about loaded categories
      if (onCategoriesLoad) {
        onCategoriesLoad(allCategoriesList);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setAllCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  }, [status, onCategoriesLoad]);

  // Fetch categories when dropdown opens
  useEffect(() => {
    if (isOpen && allCategories.length === 0) {
      fetchAllCategories();
    }
  }, [isOpen, allCategories.length, fetchAllCategories]);

  // Fetch categories when value is set but not found in allCategories (for edit modals)
  useEffect(() => {
    if (value && !disabled) {
      const found = allCategories.find((category) => category._id === value);
      if (!found && allCategories.length === 0) {
        fetchAllCategories();
      }
    }
  }, [value, disabled, allCategories, fetchAllCategories]);

  // Filter categories based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCategories(allCategories);
    } else {
      const filtered = allCategories.filter(
        (category) =>
          category.name?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
    setCurrentPage(1);
  }, [search, allCategories]);

  // Paginate filtered results
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedCategories(filteredCategories.slice(start, end));
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (categoryId) => {
    onChange({ target: { name, value: categoryId } });
    setIsOpen(false);
    setSearch('');
    setCurrentPage(1);
  };

  const selectedCategory = allCategories.find((category) => category._id === value) || null;

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleInputFocus = () => {
    if (!disabled && !loading) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const displayValue = selectedCategory
    ? selectedCategory.name
    : search || '';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={disabled || loading}
            placeholder="Tanlang yoki qidiring..."
            className={`w-full px-4 py-2 pr-20 border border-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              selectedCategory && !isOpen ? 'text-gray-900' : 'text-gray-700'
            }`}
            readOnly={!isOpen}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedCategory && !isOpen && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isOpen ? <KeyboardArrowUp className="w-5 h-5" /> : <KeyboardArrowDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-600 mx-auto"></div>
              </div>
            ) : displayedCategories.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {search ? 'Qidiruv natijalari topilmadi' : 'Kategoriyalar topilmadi'}
              </div>
            ) : (
              <>
                {displayedCategories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => handleSelect(category._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      value === category._id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-xs font-semibold text-indigo-700 ${category.image ? 'hidden' : 'flex items-center justify-center'}`}
                      >
                        {category.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${value === category._id ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                        {category.name}
                      </div>
                      {category.censored && (
                        <div className="text-xs text-red-500">Censored</div>
                      )}
                    </div>
                    {value === category._id && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {filteredCategories.length} ta dan {Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          filteredCategories.length
                        )} - {Math.min(currentPage * itemsPerPage, filteredCategories.length)}{' '}
                        ko'rsatilmoqda
                      </div>
                      <div className="flex gap-1 items-center">
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                        >
                          Oldingi
                        </button>
                        <span className="text-xs text-gray-600 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                        >
                          Keyingi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;

