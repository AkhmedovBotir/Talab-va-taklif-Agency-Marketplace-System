import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import apiService, { ContragentType } from '../../services/api';

interface ActivityTypeSelectProps {
  label: string;
  valueId: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (activityType: ContragentType | null) => void;
}

export default function ActivityTypeSelect({
  label,
  valueId,
  placeholder = "Faoliyat turini tanlang",
  disabled = false,
  error,
  onChange,
}: ActivityTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<ContragentType[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiService
      .getContragentTypes({ status: 'active' })
      .then((res) => {
        const list = [...(res.data || [])].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'uz')
        );
        setOptions(list);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = useMemo(
    () => options.find((o) => o._id === valueId) || null,
    [options, valueId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter((o) => (o.name || '').toLowerCase().includes(s));
  }, [options, search]);

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
            name="grid-outline"
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
            {loading ? (
              <div className="regionSelectEmpty">
                <div className="loading-spinner" style={{ margin: '8px auto' }} />
                <span>Yuklanmoqda...</span>
              </div>
            ) : filtered.length === 0 ? (
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
                    <span className="regionSelectOptionText">{opt.name || ''}</span>
                    {active && (
                      <Icon name="checkmark-circle" size={18} color="#2563EB" />
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
