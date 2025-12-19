import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle, Person } from '@mui/icons-material';
import { adminDataAPI } from '../../services/api';

const UserSelect = ({ value, onChange, disabled, label, required, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch marketplace users
  const fetchAllUsers = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      let allUsersList = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages
      while (hasMore) {
        const params = {
          status: 'active',
          page,
          limit: 100,
        };

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await adminDataAPI.getAllMarketplaceUsers(params);
        if (response.success) {
          const users = response.data || [];
          allUsersList = [...allUsersList, ...users];
          
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

      setAllUsers(allUsersList);
      setFilteredUsers(allUsersList);
    } catch (err) {
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && allUsers.length === 0) {
      fetchAllUsers('');
    }
  }, [isOpen, fetchAllUsers, allUsers.length]);

  // Re-fetch when search changes and dropdown is open (with debounce)
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        if (search.trim() || allUsers.length === 0) {
          fetchAllUsers(search);
        }
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [search, isOpen, fetchAllUsers, allUsers.length]);

  // Fetch user when value is set but not found in allUsers (for edit modals)
  useEffect(() => {
    if (value && !disabled) {
      const found = allUsers.find((user) => user._id === value);
      if (!found && allUsers.length === 0) {
        fetchAllUsers('');
      }
    }
  }, [value, disabled, allUsers, fetchAllUsers]);

  // Filter users based on search (client-side filtering for already loaded users)
  useEffect(() => {
    if (!search.trim() || allUsers.length < 100) {
      // If search is empty or we have few users, show all
      setFilteredUsers(allUsers);
    } else {
      // Client-side filter for already loaded users
      const searchLower = search.toLowerCase();
      const filtered = allUsers.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(search) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [search, allUsers]);

  // Paginate filtered results
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDisplayedUsers(filteredUsers.slice(start, end));
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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

  const handleSelect = (userId) => {
    onChange({ target: { name, value: userId } });
    setIsOpen(false);
    setSearch('');
    setCurrentPage(1);
  };

  const selectedUser = allUsers.find((user) => user._id === value) || null;

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

  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.phone || user._id;
  };

  const displayValue = selectedUser
    ? `${getUserDisplayName(selectedUser)} (${selectedUser.phone || ''})`
    : search || '';

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={disabled || loading}
            placeholder="Foydalanuvchini tanlang yoki qidiring..."
            className={`w-full px-4 py-2 pr-20 border border-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              selectedUser && !isOpen ? 'text-gray-900' : 'text-gray-700'
            }`}
            readOnly={!isOpen}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedUser && !isOpen && (
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
            ) : displayedUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {search ? 'Qidiruv natijalari topilmadi' : 'Foydalanuvchilar topilmadi'}
              </div>
            ) : (
              <>
                {displayedUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelect(user._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      value === user._id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      {user.firstName ? (
                        <span className="text-xs font-semibold text-indigo-700">
                          {user.firstName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <Person className="w-4 h-4 text-indigo-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${value === user._id ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.phone || 'Telefon raqami yo\'q'}
                        {user.viloyat && ` • ${user.viloyat.name}`}
                      </div>
                    </div>
                    {value === user._id && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {filteredUsers.length} ta dan {Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          filteredUsers.length
                        )} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)}{' '}
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

export default UserSelect;

