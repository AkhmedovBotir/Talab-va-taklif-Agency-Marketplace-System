import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, KeyboardArrowDown, KeyboardArrowUp, Search } from '@mui/icons-material';
import { useFixedDropdownPanel } from '../DistrictContragents/useFixedDropdownPanel';

const shopId = (s) => String(s?.id ?? s?._id ?? '');

const shopLabel = (s) => {
  if (!s) return '';
  const name = s.name || `Do'kon #${shopId(s)}`;
  const extra = [s.phone, s.inn].filter(Boolean).join(' · ');
  return extra ? `${name} (${extra})` : name;
};

/**
 * Maxalla do'koni — dropdown ichida birinchi qator qidiruv.
 */
const NeighborhoodShopSearchableSelect = ({
  label = "Do'kon",
  required = false,
  value,
  onChange,
  shops = [],
  loading = false,
  disabled = false,
  search = '',
  onSearchChange,
}) => {
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const searchVal = onSearchChange ? search : internalSearch;
  const setSearchVal = onSearchChange || setInternalSearch;

  const panelOpen = open && !disabled && !loading;
  const box = useFixedDropdownPanel(triggerRef, panelOpen);

  const selected = useMemo(
    () => shops.find((s) => shopId(s) === String(value ?? '')),
    [shops, value]
  );

  const filtered = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => {
      const name = String(s.name || '').toLowerCase();
      const phone = String(s.phone || '').toLowerCase();
      const inn = String(s.inn || '').toLowerCase();
      const id = shopId(s).toLowerCase();
      return name.includes(q) || phone.includes(q) || inn.includes(q) || id.includes(q);
    });
  }, [shops, searchVal]);

  useEffect(() => {
    if (disabled || loading) setOpen(false);
  }, [disabled, loading]);

  useEffect(() => {
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
      if (!onSearchChange) setInternalSearch('');
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onSearchChange]);

  useEffect(() => {
    if (panelOpen && searchInputRef.current) {
      const id = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [panelOpen]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
    if (!onSearchChange) setInternalSearch('');
  };

  const dropdownContent =
    panelOpen && box ? (
      <div
        ref={dropdownRef}
        className="bg-white border border-gray-300 rounded-md shadow-2xl overflow-hidden flex flex-col"
        style={{
          position: 'fixed',
          top: box.top,
          left: box.left,
          width: box.width,
          maxHeight: box.maxHeight,
          zIndex: 10050,
        }}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Nomi, telefon, INN..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchVal.trim() ? 'Qidiruv natijalari topilmadi' : "Do'konlar topilmadi"}
            </div>
          ) : (
            filtered.map((s) => {
              const id = shopId(s);
              const active = id === String(value ?? '');
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pick(id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0 ${
                    active ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-700">
                      {String(s.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${active ? 'font-semibold text-indigo-900' : 'text-gray-900'}`}>
                      {s.name || `Do'kon #${id}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[s.phone, s.inn ? `INN ${s.inn}` : ''].filter(Boolean).join(' · ') || `ID ${id}`}
                    </p>
                  </div>
                  {active && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative" ref={rootRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative" ref={triggerRef}>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && setOpen((o) => !o)}
          className={`w-full px-3 py-2 pr-10 text-left text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            disabled || loading
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
              : 'border-gray-300 bg-white text-gray-900 hover:border-indigo-400'
          }`}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
            {loading ? 'Yuklanmoqda...' : selected ? shopLabel(selected) : 'Tanlang...'}
          </span>
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {selected && !open && <CheckCircle className="w-5 h-5 text-green-500" />}
          {open ? (
            <KeyboardArrowUp className="w-5 h-5 text-gray-400" />
          ) : (
            <KeyboardArrowDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {typeof document !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
};

export default NeighborhoodShopSearchableSelect;
