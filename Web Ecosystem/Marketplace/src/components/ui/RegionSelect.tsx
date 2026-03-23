import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

export interface RegionOption {
  _id: string;
  name: string;
}

interface RegionSelectProps {
  label: string;
  valueId: string;
  options: RegionOption[];
  placeholder: string;
  icon: 'location-outline' | 'business-outline' | 'home' | 'grid-outline' | string;
  disabled?: boolean;
  error?: string;
  onChange: (option: RegionOption | null) => void;
}

export default function RegionSelect({
  label,
  valueId,
  options,
  placeholder,
  icon,
  disabled = false,
  error,
  onChange,
}: RegionSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o._id === valueId) || null,
    [options, valueId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(s));
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayText = selected?.name || placeholder;

  return (
    <div className="regionSelectContainer" ref={containerRef}>
      {label && <div className="regionSelectLabel">{label}</div>}
      <button
        type="button"
        className={[
          'regionSelectControl',
          disabled ? 'regionSelectControlDisabled' : '',
          error ? 'regionSelectControlError' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <div className="regionSelectControlLeft">
          <Icon
            name={icon}
            size={20}
            color={selected ? '#007AFF' : '#9CA3AF'}
          />
          <span
            className={
              selected ? 'regionSelectValue' : 'regionSelectPlaceholder'
            }
          >
            {displayText}
          </span>
        </div>
        <Icon name="chevron-down" size={18} color="#6B7280" />
      </button>
      {error && <div className="regionSelectError">{error}</div>}

      {open && (
        <div className="regionSelectDropdown">
          <div className="regionSelectSearch">
            <Icon name="search-outline" size={18} color="#9CA3AF" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="regionSelectSearchInput"
            />
            {search && (
              <button
                type="button"
                className="regionSelectSearchClear"
                onClick={() => setSearch('')}
              >
                <Icon name="close-circle" size={18} color="#9CA3AF" />
              </button>
            )}
          </div>
          <div className="regionSelectList">
            {filtered.length === 0 ? (
              <div className="regionSelectEmpty">
                <Icon name="search-outline" size={32} color="#D1D5DB" />
                <span>Hech narsa topilmadi</span>
              </div>
            ) : (
              filtered.map((opt) => {
                const active = opt._id === selected?._id;
                return (
                  <button
                    key={opt._id}
                    type="button"
                    className={
                      active
                        ? 'regionSelectOption regionSelectOptionActive'
                        : 'regionSelectOption'
                    }
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span className="regionSelectOptionText">{opt.name}</span>
                    {active && (
                      <Icon
                        name="checkmark-circle"
                        size={18}
                        color="#2563EB"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

