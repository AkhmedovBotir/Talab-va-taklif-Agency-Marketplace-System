import { useState, useEffect, useRef } from 'react';
import { getTumans } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function TumanSelect({ value, onChange }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tumans, setTumans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [selectedTuman, setSelectedTuman] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchTumans();
    }
  }, [isOpen, search, pagination.page]);

  useEffect(() => {
    // Fetch selected tuman if value exists
    if (value && !selectedTuman) {
      fetchTumanById(value);
    }
  }, [value]);

  const fetchTumans = async () => {
    try {
      setLoading(true);
      const response = await getTumans({
        region_id: user?.viloyat_id || user?.region_id || user?.region?.id,
        search,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (response.success) {
        if (pagination.page === 1) {
          setTumans(response.data || []);
        } else {
          setTumans((prev) => [...prev, ...(response.data || [])]);
        }
        setPagination({
          page: response.page || 1,
          limit: response.limit || 20,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
      }
    } catch (err) {
      console.error('Tumanlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTumanById = async (id) => {
    try {
      const response = await getTumans({
        region_id: user?.viloyat_id || user?.region_id || user?.region?.id,
      });
      if (response.success && response.data && response.data.length > 0) {
        const tuman = response.data.find((t) => String(t.id) === String(id));
        if (tuman) {
          setSelectedTuman(tuman);
        }
      }
    } catch (err) {
      console.error('Tuman ma\'lumotlarini yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tuman) => {
    setSelectedTuman(tuman);
    onChange(tuman.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    setSelectedTuman(null);
    onChange('');
    setSearch('');
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10 && pagination.page < pagination.totalPages && !loading) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTumans([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between"
      >
        <span className={selectedTuman ? 'text-gray-900' : 'text-gray-500'}>
          {selectedTuman ? selectedTuman.name : 'Tumanni tanlang'}
        </span>
        <div className="flex items-center space-x-2">
          {selectedTuman && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Qidirish..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {loading && tumans.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Yuklanmoqda...
              </div>
            ) : tumans.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Tuman topilmadi
              </div>
            ) : (
              <>
                {tumans.map((tuman) => (
                  <div
                    key={tuman.id}
                    onClick={() => handleSelect(tuman)}
                    className={`px-4 py-2 hover:bg-blue-50 cursor-pointer ${
                      String(selectedTuman?.id) === String(tuman.id) ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="text-sm text-gray-900">{tuman.name}</div>
                    {tuman.code && (
                      <div className="text-xs text-gray-500">{tuman.code}</div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="p-2 text-center text-gray-500 text-sm">
                    Yuklanmoqda...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
