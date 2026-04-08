import { useCallback, useEffect, useMemo, useState } from 'react';
import { Close, Visibility } from '@mui/icons-material';
import { adminAPI, archiveAPI, districtAPI, mfyAPI, regionAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const tabs = [
  { key: 'agent', label: 'Agent' },
  { key: 'punkt', label: 'Punkt' },
  { key: 'contragent', label: 'Kontragent' },
  { key: 'local-shop', label: "Maxalla do'konlari" },
  { key: 'marketplace-user', label: 'Marketplace foydalanuvchilari' },
];

const fmtDate = (x) => {
  if (!x) return '—';
  const d = new Date(x);
  if (Number.isNaN(d.getTime())) return String(x);
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
};

const parsePayload = (payload) => {
  if (payload == null) return {};
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return { raw: payload };
    }
    return { raw: payload };
  }
  if (typeof payload === 'object') return payload;
  return { raw: String(payload) };
};

const toUzValue = (value, key = '') => {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Ha' : "Yo'q";
  if (typeof value === 'number') return String(value);
  const s = String(value);
  if (key.endsWith('_at') || key.includes('date') || key.includes('time')) return fmtDate(s);
  return s;
};

const getPayloadInfo = (item) => {
  const parsed = parsePayload(item?.payload);
  if (parsed && typeof parsed === 'object' && parsed.snapshot && typeof parsed.snapshot === 'object') {
    return {
      action: parsed.action || 'delete',
      deletedAt: parsed.deleted_at || item?.archivedAt || item?.archived_at,
      deletedByAdminId:
        parsed.deleted_by_admin_id ?? item?.deletedById ?? item?.deleted_by_id,
      payloadEntityType: parsed.entity_type || item?.entityType || item?.entity_type,
      snapshot: parsed.snapshot,
      related: parsed.related && typeof parsed.related === 'object' ? parsed.related : {},
      raw: parsed,
    };
  }
  return {
    action: 'delete',
    deletedAt: item?.archivedAt || item?.archived_at,
    deletedByAdminId: item?.deletedById ?? item?.deleted_by_id,
    payloadEntityType: item?.entityType || item?.entity_type,
    snapshot: parsed,
    related: {},
    raw: parsed,
  };
};

const firstNonEmpty = (...values) => {
  for (const v of values) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const getDisplayName = (item, type) => {
  const p = getPayloadInfo(item).snapshot || {};
  if (type === 'agent') {
    return firstNonEmpty(p.full_name, p.name, p.fullname, p.username) || `Agent #${item?.entityId || '-'}`;
  }
  if (type === 'punkt') {
    return firstNonEmpty(p.name, p.title, p.punkt_name) || `Punkt #${item?.entityId || '-'}`;
  }
  if (type === 'contragent') {
    return firstNonEmpty(p.company_name, p.name, p.title) || `Kontragent #${item?.entityId || '-'}`;
  }
  if (type === 'local-shop') {
    return firstNonEmpty(p.name, p.shop_name, p.title) || `Do'kon #${item?.entityId || '-'}`;
  }
  return firstNonEmpty(p.full_name, p.name, p.username, p.phone) || `Foydalanuvchi #${item?.entityId || '-'}`;
};

const getDisplayPhone = (item) => {
  const p = getPayloadInfo(item).snapshot || {};
  return firstNonEmpty(p.phone, p.telefon, p.telefon_raqam, p.phone_number) || '—';
};

const humanLabel = (key) => {
  const labels = {
    id: 'ID',
    name: 'Nomi',
    full_name: 'F.I.Sh',
    fullname: 'F.I.Sh',
    username: 'Username',
    phone: 'Telefon',
    company_name: 'Kompaniya',
    status: 'Status',
    created_at: 'Yaratilgan vaqt',
    updated_at: 'Yangilangan vaqt',
    region_id: 'Viloyat',
    viloyat_id: 'Viloyat',
    district_id: 'Tuman',
    tuman_id: 'Tuman',
    mfy_id: 'MFY',
    address: 'Manzil',
    inn: 'INN',
    action: 'Amal',
    deleted_at: "O'chirish vaqti",
    deleted_by_admin_id: "O'chirgan admin ID",
    marketplace_orders: 'Marketplace buyurtmalar',
    marketplace_order_items: 'Buyurtma itemlari',
    agent_kpi_payouts: 'Agent KPI to‘lovlari',
    punkt_kpi_payouts: 'Punkt KPI to‘lovlari',
    punkt_order_transfers: 'Punkt transferlar',
    punkt_order_transfer_items: 'Punkt transfer itemlari',
    products: 'Mahsulotlar',
    product_images: 'Mahsulot rasmlari',
    punkt_contragent_line_requests: 'Punkt-kontragent line so‘rovlari',
    local_shop_products: "Do'kon mahsulotlari",
    marketplace_local_shop_orders: "Do'kon buyurtmalari",
    marketplace_local_shop_order_items: "Do'kon buyurtma itemlari",
    local_shop_working_hours: "Do'kon ish vaqtlari",
    local_shop_service_areas: "Do'kon xizmat hududlari",
    local_shop_couriers: "Do'kon kuryerlari",
    marketplace_delivery_areas: 'Delivery hududlar',
    marketplace_cart_items: 'Savat itemlari',
    marketplace_local_shop_cart_items: "Do'kon savat itemlari",
    marketplace_product_ratings: 'Mahsulot reytinglari',
  };
  return labels[key] || key.replaceAll('_', ' ');
};

const prettifyAny = (value, key = '', refs = { regions: {}, districts: {}, mfys: {} }) => {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return "Yo'q";
    return `${value.length} ta`;
  }
  if (typeof value === 'object') return "Murakkab ma'lumot";
  if ((key === 'region_id' || key === 'viloyat_id') && refs.regions[String(value)]) {
    return `${refs.regions[String(value)]} (#${value})`;
  }
  if ((key === 'district_id' || key === 'tuman_id') && refs.districts[String(value)]) {
    return `${refs.districts[String(value)]} (#${value})`;
  }
  if (key === 'mfy_id' && refs.mfys[String(value)]) {
    return `${refs.mfys[String(value)]} (#${value})`;
  }
  return toUzValue(value, key);
};

const getAllReadableFields = (snapshot, refs) => {
  const p = snapshot || {};
  const entries = Object.entries(p);
  const preferredOrder = [
    'name',
    'full_name',
    'fullname',
    'username',
    'company_name',
    'phone',
    'status',
    'inn',
    'address',
    'viloyat_id',
    'region_id',
    'tuman_id',
    'district_id',
    'mfy_id',
    'created_at',
    'updated_at',
  ];

  const used = new Set();
  const rows = [];

  preferredOrder.forEach((k) => {
    if (!(k in p)) return;
    const pretty = prettifyAny(p[k], k, refs);
    if (pretty === '—') return;
    rows.push({ key: k, label: humanLabel(k), value: pretty });
    used.add(k);
  });

  entries.forEach(([k, v]) => {
    if (used.has(k)) return;
    const pretty = prettifyAny(v, k, refs);
    rows.push({ key: k, label: humanLabel(k), value: pretty });
  });

  return rows;
};

const getRelatedRows = (related) => {
  const rel = related && typeof related === 'object' ? related : {};
  return Object.entries(rel).map(([key, value]) => {
    const count = Array.isArray(value) ? value.length : value && typeof value === 'object' ? 1 : 0;
    return {
      key,
      label: humanLabel(key),
      count,
      hasItems: count > 0,
    };
  });
};

const getListByType = async (type, opts) => {
  if (type === 'agent') return archiveAPI.getAgentList(opts);
  if (type === 'punkt') return archiveAPI.getPunktList(opts);
  if (type === 'contragent') return archiveAPI.getContragentList(opts);
  if (type === 'local-shop') return archiveAPI.getLocalShopList(opts);
  return archiveAPI.getMarketplaceUserList(opts);
};

const getByIdByType = async (type, id) => {
  if (type === 'agent') return archiveAPI.getAgentById(id);
  if (type === 'punkt') return archiveAPI.getPunktById(id);
  if (type === 'contragent') return archiveAPI.getContragentById(id);
  if (type === 'local-shop') return archiveAPI.getLocalShopById(id);
  return archiveAPI.getMarketplaceUserById(id);
};

const ArchivePage = () => {
  const { showError } = useSnackbar();
  const [activeTab, setActiveTab] = useState('agent');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [adminNames, setAdminNames] = useState({});
  const [regionsMap, setRegionsMap] = useState({});
  const [districtsMap, setDistrictsMap] = useState({});
  const [mfysMap, setMfysMap] = useState({});

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getListByType(activeTab, { page: pagination.page, limit: pagination.limit });
      const payload = res.data || {};
      const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setRows(items);
      setPagination((prev) => ({
        ...prev,
        page: Number(payload.page) || prev.page,
        limit: Number(payload.limit) || prev.limit,
        total: Number(payload.total) || items.length,
        pages:
          Number(payload.total_pages) ||
          Math.max(1, Math.ceil((Number(payload.total) || items.length) / (Number(payload.limit) || prev.limit || 1))),
      }));
    } catch (e) {
      showError(e.message || "Arxiv ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, showError]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [activeTab]);

  useEffect(() => {
    const loadGeoRefs = async () => {
      try {
        const [r, d, m] = await Promise.all([
          regionAPI.getAllRegions(),
          districtAPI.getAllDistricts(),
          mfyAPI.getAllMFYs(),
        ]);
        const toMap = (arr) =>
          (arr || []).reduce((acc, x) => {
            const id = x.id ?? x._id;
            if (id != null) acc[String(id)] = x.name || `#${id}`;
            return acc;
          }, {});
        setRegionsMap(toMap(r?.data || []));
        setDistrictsMap(toMap(d?.data || []));
        setMfysMap(toMap(m?.data || []));
      } catch {
        // reference maps optional
      }
    };
    loadGeoRefs();
  }, []);

  useEffect(() => {
    const ids = [...new Set(
      rows
        .map((x) => String(getPayloadInfo(x).deletedByAdminId || ''))
        .filter((x) => x !== '' && !adminNames[x])
    )];
    if (!ids.length) return;
    const run = async () => {
      try {
        const updates = {};
        for (const id of ids) {
          try {
            const res = await adminAPI.getAdminById(id);
            const admin = res?.data || {};
            updates[id] = admin.name || admin.username || `Admin #${id}`;
          } catch {
            updates[id] = `Admin #${id}`;
          }
        }
        setAdminNames((prev) => ({ ...prev, ...updates }));
      } catch {
        // ignore
      }
    };
    run();
  }, [rows, adminNames]);

  const openDetail = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const res = await getByIdByType(activeTab, row.id);
      setViewRow(res.data || row);
    } catch (e) {
      showError(e.message || "Arxiv yozuvini ko'rib bo'lmadi");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const rowsView = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`${tabBase} ${activeTab === t.key ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Arxiv ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Entity ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 min-w-[220px]">Nomi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Telefon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">O'chirgan admin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Arxiv vaqti</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Amal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
            ) : rowsView.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Arxiv bo'sh</td></tr>
            ) : (
              rowsView.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                  <td className="px-4 py-3 text-gray-800 font-medium">{row.id}</td>
                  <td className="px-4 py-3 text-gray-700">{row.entityId || row.entity_id || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{getDisplayName(row, activeTab)}</td>
                      <td className="px-4 py-3 text-gray-700">{getDisplayPhone(row)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {(() => {
                      const adminId = String(getPayloadInfo(row).deletedByAdminId || '');
                      if (!adminId) return '—';
                      return adminNames[adminId] || `Admin #${adminId}`;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(row.archivedAt || row.archived_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(row)}
                      className="inline-flex items-center justify-center p-2 text-sky-600 hover:bg-sky-50 rounded-md"
                      title="Ko'rish"
                    >
                      <Visibility fontSize="small" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Jami: <span className="font-semibold">{pagination.total}</span></p>
        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="10">10 ta</option>
            <option value="20">20 ta</option>
            <option value="50">50 ta</option>
          </select>
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Oldingi
          </button>
          <span className="text-sm text-gray-600">{pagination.page} / {Math.max(1, pagination.pages)}</span>
          <button
            type="button"
            disabled={pagination.page >= Math.max(1, pagination.pages)}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Keyingi
          </button>
        </div>
      </div>

      {viewOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" style={{ margin: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOpen(false)} />
          <div className="relative bg-white shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Arxiv yozuvi</h3>
              <button type="button" onClick={() => setViewOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Close />
              </button>
            </div>
            <div className="p-5 text-sm space-y-3">
              {viewLoading ? (
                <p className="text-gray-500">Yuklanmoqda...</p>
              ) : (
                <>
                  {(() => {
                    const info = getPayloadInfo(viewRow);
                    const adminId = String(info.deletedByAdminId || '');
                    const adminName = adminId ? adminNames[adminId] || `Admin #${adminId}` : '—';
                    return (
                      <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p><span className="text-gray-500">Arxiv ID:</span> <span className="font-medium">{viewRow?.id || '—'}</span></p>
                    <p><span className="text-gray-500">Entity turi:</span> <span className="font-medium">{info.payloadEntityType || viewRow?.entityType || viewRow?.entity_type || activeTab}</span></p>
                    <p><span className="text-gray-500">Entity ID:</span> <span className="font-medium">{viewRow?.entityId || viewRow?.entity_id || '—'}</span></p>
                    <p><span className="text-gray-500">Asosiy nom:</span> <span className="font-medium">{getDisplayName(viewRow, activeTab)}</span></p>
                    <p><span className="text-gray-500">Telefon:</span> <span className="font-medium">{getDisplayPhone(viewRow)}</span></p>
                    <p><span className="text-gray-500">O'chirgan admin:</span> <span className="font-medium">{adminName}</span></p>
                    <p><span className="text-gray-500">Amal:</span> <span className="font-medium">{info.action || 'delete'}</span></p>
                    <p><span className="text-gray-500">O'chirish vaqti:</span> <span className="font-medium">{fmtDate(info.deletedAt)}</span></p>
                    <p className="md:col-span-2"><span className="text-gray-500">Arxivga yozilgan vaqt:</span> <span className="font-medium">{fmtDate(viewRow?.archivedAt || viewRow?.archived_at)}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Barcha ma'lumotlar</p>
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-100 bg-white">
                      {getAllReadableFields(info.snapshot, { regions: regionsMap, districts: districtsMap, mfys: mfysMap }).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">Ko'rsatish uchun qisqa maydonlar yo'q</div>
                      ) : (
                        getAllReadableFields(info.snapshot, { regions: regionsMap, districts: districtsMap, mfys: mfysMap }).map((f) => (
                          <div key={f.key} className="px-3 py-2 grid grid-cols-[160px_1fr] gap-2 text-xs">
                            <span className="text-gray-500">{f.label}</span>
                            <span className="text-gray-800 break-all">{f.value}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Bog'liq ma'lumotlar (related)</p>
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-100 bg-white">
                      {getRelatedRows(info.related).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500">Bog'liq yozuvlar yo'q</div>
                      ) : (
                        getRelatedRows(info.related).map((r) => (
                          <div key={r.key} className="px-3 py-2 grid grid-cols-[1fr_auto] gap-2 text-xs">
                            <span className="text-gray-700">{r.label}</span>
                            <span className={`font-medium ${r.hasItems ? 'text-indigo-700' : 'text-gray-500'}`}>
                              {r.count} ta
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
