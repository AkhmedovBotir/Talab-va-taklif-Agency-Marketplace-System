import { useMemo } from 'react';
import {
  getGroupedPermissionPicker,
  getRecommendedPermissionNames,
  PERMISSION_LABELS,
} from '../../utils/permissions';

const AdminPermissionsPicker = ({ value = [], onChange, disabled = false }) => {
  const recommended = useMemo(() => getRecommendedPermissionNames(), []);
  const grouped = useMemo(() => getGroupedPermissionPicker(recommended), [recommended]);
  const selected = useMemo(() => new Set(value || []), [value]);

  const isSelected = (key) => [...selected].some((p) => p.toLowerCase() === key.toLowerCase());

  const toggle = (key) => {
    if (disabled) return;
    const next = new Set(selected);
    const existing = [...next].find((p) => p.toLowerCase() === key.toLowerCase());
    if (existing) next.delete(existing);
    else next.add(key);
    onChange(Array.from(next));
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...recommended]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const selectGroup = (keys) => {
    if (disabled) return;
    const next = new Set(selected);
    keys.forEach((k) => next.add(k));
    onChange(Array.from(next));
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Ruxsatlar</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Tanlangan: <span className="font-semibold text-gray-700">{selected.size}</span> / {recommended.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Menyu va sahifalar faqat shu ro‘yxat bo‘yicha ko‘rinadi.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={selectAll}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Barchasi
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={clearAll}
            className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Tozalash
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar max-h-[min(52vh,520px)]">
        {grouped.map((group) => (
          <div key={group.title} className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-800">{group.title}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => selectGroup(group.keys)}
                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                Guruhni tanlash
              </button>
            </div>
            <ul className="p-2 grid grid-cols-1 gap-1">
              {group.keys.map((key) => {
                const checked = isSelected(key);
                return (
                  <li key={key}>
                    <label
                      className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(key)}
                      />
                      <span className="text-sm text-gray-800 leading-snug">{PERMISSION_LABELS[key] || key}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPermissionsPicker;
