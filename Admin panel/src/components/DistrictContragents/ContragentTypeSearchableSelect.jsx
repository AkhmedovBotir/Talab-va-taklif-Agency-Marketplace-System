import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import * as Icons from '@mui/icons-material';
import { contragentTypeAPI } from '../../services/api';
import { useFixedDropdownPanel } from './useFixedDropdownPanel';

/** API dan barcha sahifalarni yig‘ib oladi (server limiti — UI emas). */
async function fetchAllTypesActive() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await contragentTypeAPI.getAllTypes({ page, limit: 100 });
    if (!res.success) break;
    const payload = res.data || {};
    const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
    all.push(...items);
    totalPages = Number(payload.total_pages) || 1;
    page += 1;
  } while (page <= totalPages);
  return all.filter((t) => !t.status || t.status === 'active');
}

const ContragentTypeSearchableSelect = ({
  value,
  onChange,
  disabled,
  label = 'Faoliyat turi',
  required,
  name = 'activity_type_id',
}) => {
  const [open, setOpen] = useState(false);
  const [allTypes, setAllTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const panelOpen = open && !disabled;
  const box = useFixedDropdownPanel(triggerRef, panelOpen);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllTypesActive();
      setAllTypes(list);
    } catch {
      setAllTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && allTypes.length === 0) fetchAll();
  }, [open, allTypes.length, fetchAll]);

  useEffect(() => {
    if (value && !disabled && allTypes.length === 0) fetchAll();
  }, [value, disabled, allTypes.length, fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTypes;
    return allTypes.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        String(t.icon || '')
          .toLowerCase()
          .includes(q)
    );
  }, [allTypes, search]);

  const selected = useMemo(
    () => allTypes.find((t) => String(t.id ?? t._id) === String(value ?? '')),
    [allTypes, value]
  );

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const SelectedIcon = selected?.icon && Icons[selected.icon] ? Icons[selected.icon] : null;

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
        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {search.trim() ? 'Qidiruv natijalari topilmadi' : 'Kontragent turlari topilmadi'}
            </div>
          ) : (
            filtered.map((t) => {
              const id = t.id ?? t._id;
              const active = String(id) === String(value ?? '');
              const TypeIcon = t.icon && Icons[t.icon] ? Icons[t.icon] : null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange({ target: { name, value: String(id) } });
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                    active ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    {TypeIcon ? (
                      <TypeIcon sx={{ fontSize: 20 }} className="text-indigo-600" />
                    ) : (
                      <span className="text-xs font-semibold text-indigo-700">
                        {t.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${active ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                      {t.name}
                    </div>
                    {t.icon && <div className="text-xs text-gray-500 font-mono truncate">{t.icon}</div>}
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" ref={triggerRef}>
        <input
          type="text"
          value={open ? search : selected?.name || ''}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && !loading && setOpen(true)}
          disabled={disabled || loading}
          placeholder={loading ? 'Yuklanmoqda...' : 'Tanlang yoki qidiring...'}
          readOnly={!open}
          className={`w-full px-4 py-2 pr-20 border border-indigo-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
            selected && !open ? 'text-gray-900' : 'text-gray-700'
          }`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && !open && <CheckCircle className="w-5 h-5 text-green-500" />}
          <button
            type="button"
            onClick={() => !disabled && !loading && setOpen((o) => !o)}
            className="text-gray-400 hover:text-gray-600"
          >
            {open ? <KeyboardArrowUp className="w-5 h-5" /> : <KeyboardArrowDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {typeof document !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}

      {SelectedIcon && !open && (
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <SelectedIcon sx={{ fontSize: 18 }} className="text-indigo-600" />
          <span className="font-mono">{selected?.icon}</span>
        </div>
      )}
    </div>
  );
};

export default ContragentTypeSearchableSelect;
