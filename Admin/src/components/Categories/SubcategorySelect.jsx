import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { categoryManagementAPI } from '../../services/api';

const SubcategorySelect = ({ value, onChange, disabled, label, required, name, categoryId, categories = [], status = 'active' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [displayedSubcategories, setDisplayedSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get subcategories from selected category if categories prop is provided
  const getSubcategoriesFromCategory = useCallback(() => {
    if (!categoryId || !categories || categories.length === 0) {
      return [];
    }
    
    const selectedCategory = categories.find((cat) => cat._id === categoryId);
    if (selectedCategory && selectedCategory.subcategories) {
      return selectedCategory.subcategories.filter((sub) => {
        if (status === 'active') {
          return sub.status === 'active';
        }
        return true;
      });
    }
    
    return [];
  }, [categoryId, categories, status]);

  // Fetch subcategories from API (fallback if categories prop not provided)
  const fetchAllSubcategories = useCallback(async () => {
    if (!categoryId) {
      setAllSubcategories([]);
      setFilteredSubcategories([]);
      return;
    }

    setLoading(true);
    try {
      let allSubcategoriesList = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const params = {
          status,
          page,
          limit: 100,
        };

        const response = await categoryManagementAPI.getAllSubcategories(categoryId, params);

        if (response.success) {
          const subcategories = response.data || [];
          allSubcategoriesList = [...allSubcategoriesList, ...subcategories];

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

      setAllSubcategories(allSubcategoriesList);
      setFilteredSubcategories(allSubcategoriesList);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setAllSubcategories([]);
      setFilteredSubcategories([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, status]);

  // Track previous categoryId to detect changes
  const prevCategoryIdRef = useRef(categoryId);

  // Load subcategories when categoryId changes or dropdown opens
  useEffect(() => {
    const categoryIdChanged = prevCategoryIdRef.current !== categoryId;
    
    if (categoryIdChanged) {
      // Reset subcategories when category changes
      setAllSubcategories([]);
      setFilteredSubcategories([]);
      setSearch('');
      setCurrentPage(1);
      
      // If categoryId exists, load subcategories
      if (categoryId) {
        if (categories && categories.length > 0) {
          // Use subcategories from categories prop
          const subcategories = getSubcategoriesFromCategory();
          setAllSubcategories(subcategories);
          setFilteredSubcategories(subcategories);
        } else {
          // Fallback to API call
          fetchAllSubcategories();
        }
      }
    } else if (isOpen && categoryId && allSubcategories.length === 0) {
      // If dropdown opens and no subcategories loaded, load them
      if (categories && categories.length > 0) {
        const subcategories = getSubcategoriesFromCategory();
        setAllSubcategories(subcategories);
        setFilteredSubcategories(subcategories);
      } else {
        fetchAllSubcategories();
      }
    }
    
    prevCategoryIdRef.current = categoryId;
  }, [categoryId, isOpen, allSubcategories.length, categories, getSubcategoriesFromCategory, fetchAllSubcategories]);

  // Fetch subcategories when value is set but not found in allSubcategories (for edit modals)
  useEffect(() => {
    if (value && !disabled && categoryId) {
      const found = allSubcategories.find((subcategory) => subcategory._id === value);
      if (!found && allSubcategories.length === 0) {
        if (categories && categories.length > 0) {
          const subcategories = getSubcategoriesFromCategory();
          setAllSubcategories(subcategories);
          setFilteredSubcategories(subcategories);
        } else {
          fetchAllSubcategories();
        }
      }
    }
  }, [value, disabled, categoryId, allSubcategories, categories, getSubcategoriesFromCategory, fetchAllSubcategories]);

  // Filter subcategories based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredSubcategories(allSubcategories);
    } else {
      const filtered = allSubcategories.filter(
        (subcategory) =>
          subcategory.name?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredSubcategories(filtered);
    }
    setCurrentPage(1);
  }, [search, allSubcategories]);

  // Paginate filtered results
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedSubcategories(filteredSubcategories.slice(start, end));
  }, [filteredSubcategories, currentPage]);

  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

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

  const handleSelect = (subcategoryId) => {
    onChange({ target: { name, value: subcategoryId } });
    setIsOpen(false);
    setSearch('');
    setCurrentPage(1);
  };

  const selectedSubcategory = allSubcategories.find((subcategory) => subcategory._id === value) || null;

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleInputFocus = () => {
    if (!disabled && !loading && categoryId) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const displayValue = selectedSubcategory
    ? selectedSubcategory.name
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
            disabled={disabled || loading || !categoryId}
            placeholder={categoryId ? "Tanlang yoki qidiring..." : "Avval kategoriya tanlang"}
            className={`w-full px-4 py-2 pr-20 border border-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              selectedSubcategory && !isOpen ? 'text-gray-900' : 'text-gray-700'
            }`}
            readOnly={!isOpen}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedSubcategory && !isOpen && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <button
              type="button"
              onClick={() => !disabled && !loading && categoryId && setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isOpen ? <KeyboardArrowUp className="w-5 h-5" /> : <KeyboardArrowDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && categoryId && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-600 mx-auto"></div>
              </div>
            ) : displayedSubcategories.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {search ? 'Qidiruv natijalari topilmadi' : 'Subkategoriyalar topilmadi'}
              </div>
            ) : (
              <>
                {displayedSubcategories.map((subcategory) => (
                  <button
                    key={subcategory._id}
                    type="button"
                    onClick={() => handleSelect(subcategory._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      value === subcategory._id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-700">
                        {subcategory.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${value === subcategory._id ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                        {subcategory.name}
                      </div>
                    </div>
                    {value === subcategory._id && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {filteredSubcategories.length} ta dan {Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          filteredSubcategories.length
                        )} - {Math.min(currentPage * itemsPerPage, filteredSubcategories.length)}{' '}
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

export default SubcategorySelect;

