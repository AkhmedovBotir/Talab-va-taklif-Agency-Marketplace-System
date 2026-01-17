import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { punktAPI } from '../../services/api';

const PunktSelect = ({ value, onChange, disabled, label, required, name, isFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allPunkts, setAllPunkts] = useState([]);
  const [filteredPunkts, setFilteredPunkts] = useState([]);
  const [displayedPunkts, setDisplayedPunkts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch all punkts
  const fetchAllPunkts = useCallback(async () => {
    setLoading(true);
    try {
      let allPunktsList = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = {
          status: 'active',
          page,
          limit: 100,
        };

        const response = await punktAPI.getAllPunkts(params);

        if (response.success) {
          const punkts = response.data || [];
          allPunktsList = [...allPunktsList, ...punkts];

          if (response.totalPages && page < response.totalPages) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      setAllPunkts(allPunktsList);
      setFilteredPunkts(allPunktsList);
    } catch (err) {
      console.error('Error fetching punkts:', err);
      setAllPunkts([]);
      setFilteredPunkts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPunkts();
  }, [fetchAllPunkts]);

  // Filter punkts based on search
  useEffect(() => {
    if (!search) {
      setFilteredPunkts(allPunkts);
      setCurrentPage(1);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = allPunkts.filter(
      (punkt) =>
        punkt.name?.toLowerCase().includes(searchLower) ||
        punkt.phone?.includes(searchLower) ||
        punkt.viloyat?.name?.toLowerCase().includes(searchLower) ||
        punkt.tuman?.name?.toLowerCase().includes(searchLower)
    );
    setFilteredPunkts(filtered);
    setCurrentPage(1);
  }, [search, allPunkts]);

  // Paginate displayed punkts
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedPunkts(filteredPunkts.slice(start, end));
  }, [filteredPunkts, currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedPunkt = allPunkts.find((punkt) => punkt._id === value);

  const handleSelect = (punktId) => {
    const syntheticEvent = {
      target: {
        name: name || 'punktId',
        value: punktId,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearch('');
  };

  const totalPages = Math.ceil(filteredPunkts.length / itemsPerPage);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label || 'Punkt'}
        {required && !isFilter && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`
            w-full px-4 py-2 text-left bg-white border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
            ${isOpen ? 'border-indigo-500' : 'border-gray-300'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className={selectedPunkt ? 'text-gray-900' : 'text-gray-500'}>
              {loading
                ? 'Yuklanmoqda...'
                : selectedPunkt
                ? `${selectedPunkt.name} - ${selectedPunkt.phone}`
                : 'Punktni tanlang'}
            </span>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-indigo-600"></div>
            ) : isOpen ? (
              <KeyboardArrowUp className="w-5 h-5 text-gray-400" />
            ) : (
              <KeyboardArrowDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                ref={inputRef}
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-60">
              {displayedPunkts.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  {loading ? 'Yuklanmoqda...' : search ? 'Punkt topilmadi' : 'Punktlar topilmadi'}
                </div>
              ) : (
                displayedPunkts.map((punkt) => (
                  <button
                    key={punkt._id}
                    type="button"
                    onClick={() => handleSelect(punkt._id)}
                    className={`
                      w-full px-4 py-2 text-left hover:bg-indigo-50 transition-colors
                      flex items-center justify-between
                      ${value === punkt._id ? 'bg-indigo-50' : ''}
                    `}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{punkt.name}</div>
                      <div className="text-xs text-gray-500">
                        {punkt.phone}
                        {punkt.viloyat?.name && ` • ${punkt.viloyat.name}`}
                        {punkt.tuman?.name && ` • ${punkt.tuman.name}`}
                      </div>
                    </div>
                    {value === punkt._id && (
                      <CheckCircle className="w-5 h-5 text-indigo-600 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-2 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Oldingi
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keyingi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PunktSelect;
