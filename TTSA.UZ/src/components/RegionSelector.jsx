import { useState, useEffect, useRef } from 'react';
import { getRegions } from '../services/api';

const RegionSelector = ({ onSelect, selectedRegion, type = 'region', parentId = null, label, required = false }) => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchRegions = async (pageNum = 1, search = '', append = false) => {
    setLoading(true);
    setError('');
    try {
      // parentId ni localStorage'dan o'qish (agar prop bo'lmasa)
      let actualParentId = parentId;
      if (!actualParentId) {
        if (type === 'district') {
          actualParentId = localStorage.getItem('selectedViloyatId');
        } else if (type === 'mfy') {
          actualParentId = localStorage.getItem('selectedTumanId');
        }
      }
      
      const params = {
        page: pageNum,
        limit: 50, // Limitni oshirdik, ko'proq ma'lumot ko'rsatish uchun
        type: type,
        ...(actualParentId && { parentId: actualParentId }),
        ...(search && { search }),
      };
      
      const response = await getRegions(params);
      if (append) {
        // Yangi ma'lumotlarni mavjud ro'yxatga qo'shish
        setRegions(prev => [...prev, ...(response.data || [])]);
      } else {
        // Yangi ro'yxat
        setRegions(response.data || []);
      }
      // totalPages API dan kelayotgan qiymatni ishlatamiz
      setTotalPages(response.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      if (!append) {
        setRegions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // parentId yoki type o'zgarganda, page va regions ni reset qilish va dropdown yopish
    setPage(1);
    setRegions([]);
    setSearchTerm('');
    setShowDropdown(false);
    
    // localStorage'dan parentId ni o'qish
    let actualParentId = parentId;
    if (!actualParentId) {
      if (type === 'district') {
        actualParentId = localStorage.getItem('selectedViloyatId');
      } else if (type === 'mfy') {
        actualParentId = localStorage.getItem('selectedTumanId');
      }
    }
  }, [type, parentId]);

  useEffect(() => {
    // Dropdown ochilganda yoki searchTerm/parentId/type o'zgarganda ma'lumotlarni yuklash
    if (showDropdown) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        fetchRegions(1, searchTerm);
      }, searchTerm ? 300 : 0);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDropdown, searchTerm, parentId, type]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSelect = (region) => {
    onSelect(region);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchRegions(newPage, searchTerm);
  };

  const selectedName = selectedRegion ? selectedRegion.name : '';

  return (
    <div className="relative w-full mb-6" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer bg-white"
          value={selectedName}
          placeholder={`${label}ni tanlang`}
          readOnly
          onClick={() => setShowDropdown(!showDropdown)}
        />
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
          ▼
        </span>
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Yuklanmoqda...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : regions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Ma'lumot topilmadi</div>
            ) : (
              <>
                {regions.map((region) => (
                  <div
                    key={region._id}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                      selectedRegion?._id === region._id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => handleSelect(region)}
                  >
                    {region.name}
                  </div>
                ))}
                
                {/* Infinite scroll yoki "Ko'proq yuklash" tugmasi */}
                {page < totalPages && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        const nextPage = page + 1;
                        fetchRegions(nextPage, searchTerm, true);
                      }}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {loading ? 'Yuklanmoqda...' : `Ko'proq yuklash (${page} / ${totalPages})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Pagination - faqat ko'p sahifalar bo'lsa ko'rsatish */}
          {totalPages > 1 && totalPages <= 20 && (
            <div className="flex items-center justify-center gap-4 p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ◀
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
