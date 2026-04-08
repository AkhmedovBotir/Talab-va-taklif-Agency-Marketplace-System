import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyboardArrowDown, KeyboardArrowUp, CheckCircle } from '@mui/icons-material';
import { useFixedDropdownPanel } from './useFixedDropdownPanel';

/**
 * Qidiruv; ro‘yxat body orqali portal — modal overflow dan chiqadi.
 */
const GeoSearchableSelect = ({
  label,
  required,
  value,
  onChange,
  options = [],
  disabled,
  emptyMessage = 'Maʼlumot topilmadi',
  lockedHint = 'Avval yuqori darajani tanlang',
  optionalPlaceholder = 'Barchasi',
  allowClear = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const locked = Boolean(disabled);

  const panelOpen = open && !locked;
  const box = useFixedDropdownPanel(triggerRef, panelOpen);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        String(o.title || '').toLowerCase().includes(q) || String(o.subtitle || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  const selected = useMemo(
    () => options.find((o) => String(o.id) === String(value ?? '')),
    [options, value]
  );

  useEffect(() => {
    if (locked) setOpen(false);
  }, [locked]);

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

  const displayText = selected ? `${selected.title}${selected.subtitle ? ` (${selected.subtitle})` : ''}` : '';

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
        {allowClear && value != null && String(value) !== '' && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
              setSearch('');
            }}
            className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 border-b border-gray-100 shrink-0"
          >
            {optionalPlaceholder}
          </button>
        )}
        <div className="overflow-y-auto flex-1 min-h-0">
          {options.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{lockedHint}</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {search.trim() ? 'Qidiruv natijalari topilmadi' : emptyMessage}
            </div>
          ) : (
            filtered.map((o) => {
              const active = String(o.id) === String(value ?? '');
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(String(o.id));
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                    active ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-700">
                      {String(o.title || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${active ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>
                      {o.title}
                    </div>
                    {o.subtitle ? <div className="text-xs text-gray-500 truncate">{o.subtitle}</div> : null}
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
        <input
          type="text"
          value={open ? search : displayText}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!locked) setOpen(true);
          }}
          disabled={locked}
          placeholder={
            locked
              ? lockedHint
              : !required && !displayText
                ? optionalPlaceholder
                : 'Tanlang yoki qidiring...'
          }
          readOnly={!open}
          className={`w-full px-4 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            locked ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-indigo-400'
          } ${selected && !open ? 'text-gray-900' : 'text-gray-700'}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && !open && <CheckCircle className="w-5 h-5 text-green-500" />}
          <button
            type="button"
            onClick={() => !locked && setOpen((o) => !o)}
            className="text-gray-400 hover:text-gray-600"
          >
            {open ? <KeyboardArrowUp className="w-5 h-5" /> : <KeyboardArrowDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {typeof document !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
};

export default GeoSearchableSelect;
