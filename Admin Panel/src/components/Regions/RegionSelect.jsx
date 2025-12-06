import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { regionAPI } from '../../services/api';

const RegionSelect = ({ value, onChange, disabled, label, required, name, type, parentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allRegions, setAllRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [displayedRegions, setDisplayedRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch regions based on type
  const fetchAllRegions = useCallback(async () => {
    setLoading(true);
    try {
      let allRegionsList = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages using getAllRegions with type filter
      while (hasMore) {
        const params = {
          status: 'active',
          type,
          page,
          limit: 100,
        };
        
        if (parentId !== undefined) {
          params.parent = parentId || null;
        }

        const response = await regionAPI.getAllRegions(params);
        if (response.success) {
          // API returns { success: true, count, total, page, limit, totalPages, data: [...] }
          const regions = response.data || [];
          allRegionsList = [...allRegionsList, ...regions];
          
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

      setAllRegions(allRegionsList);
      setFilteredRegions(allRegionsList);
    } catch (err) {
      setAllRegions([]);
      setFilteredRegions([]);
    } finally {
      setLoading(false);
    }
  }, [type, parentId]);

  useEffect(() => {
    if (isOpen && allRegions.length === 0) {
      fetchAllRegions();
    }
  }, [isOpen, fetchAllRegions, allRegions.length]);

  // Re-fetch when parentId changes
  useEffect(() => {
    if (isOpen && parentId !== undefined) {
      fetchAllRegions();
    }
  }, [parentId, isOpen, fetchAllRegions]);

  // Fetch regions when value is set but not found in allRegions (for edit modals)
  useEffect(() => {
    if (value && !disabled) {
      const found = allRegions.find((region) => region._id === value);
      if (!found && allRegions.length === 0) {
        // If value exists but regions haven't been loaded yet, load them
        fetchAllRegions();
      }
    }
  }, [value, disabled, allRegions, fetchAllRegions]);

  // Filter regions based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredRegions(allRegions);
    } else {
      const filtered = allRegions.filter(
        (region) =>
          region.name?.toLowerCase().includes(search.toLowerCase()) ||
          region.code?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRegions(filtered);
    }
    setCurrentPage(1);
  }, [search, allRegions]);

  // Paginate filtered results
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedRegions(filteredRegions.slice(start, end));
  }, [filteredRegions, currentPage]);

  const totalPages = Math.ceil(filteredRegions.length / itemsPerPage);

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

  const handleSelect = (regionId) => {
    onChange({ target: { name, value: regionId } });
    setIsOpen(false);
    setSearch('');
    setCurrentPage(1);
  };

  const selectedRegion = allRegions.find((region) => region._id === value) || null;

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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'region':
        return 'Viloyat';
      case 'district':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type;
    }
  };

  const displayValue = selectedRegion
    ? `${selectedRegion.name} (${selectedRegion.code})`
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
              selectedRegion && !isOpen ? 'text-gray-900' : 'text-gray-700'
            }`}
            readOnly={!isOpen}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedRegion && !isOpen && (
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
            ) : displayedRegions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {search ? 'Qidiruv natijalari topilmadi' : `${getTypeLabel(type)}lar topilmadi`}
              </div>
            ) : (
              <>
                {displayedRegions.map((region) => (
                  <button
                    key={region._id}
                    type="button"
                    onClick={() => handleSelect(region._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      value === region._id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-700">
                        {region.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${value === region._id ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                        {region.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{region.code}</div>
                    </div>
                    {value === region._id && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {filteredRegions.length} ta dan {Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          filteredRegions.length
                        )} - {Math.min(currentPage * itemsPerPage, filteredRegions.length)}{' '}
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

export default RegionSelect;

