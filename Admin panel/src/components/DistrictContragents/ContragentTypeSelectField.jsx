import { useEffect, useState } from 'react';
import { contragentTypeAPI } from '../../services/api';

async function fetchAllActiveTypes() {
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

const ContragentTypeSelectField = ({ value, onChange, disabled, required, label = 'Faoliyat turi' }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchAllActiveTypes();
        if (!cancelled) setTypes(list);
      } catch {
        if (!cancelled) setTypes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        required={required}
        disabled={disabled || loading}
        value={value != null && value !== '' ? String(value) : ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
      >
        <option value="">{loading ? 'Yuklanmoqda...' : 'Tanlang'}</option>
        {types.map((t) => {
          const id = t.id ?? t._id;
          return (
            <option key={id} value={String(id)}>
              {t.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ContragentTypeSelectField;
