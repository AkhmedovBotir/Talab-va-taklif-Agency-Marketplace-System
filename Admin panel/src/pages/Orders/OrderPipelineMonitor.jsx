import { useCallback, useEffect, useMemo, useState } from 'react';
import { Refresh, FilterList, Visibility, Close } from '@mui/icons-material';
import { orderPipelineAPI, marketplaceUserAPI, punktAPI, agentAPI, contragentAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const ORDER_STATUS_LABELS = {
  pending: 'Kutilmoqda',
  cancelled: 'Bekor qilingan',
  delivered: 'Yetkazib berilgan',
};

const PUNKT_ACCEPTANCE_STATUS_LABELS = {
  none: 'Tuman aniqlanmagan',
  no_punkt: 'Faol punkt topilmagan',
  inbox: 'Punkt inboxida',
  rejected: 'Punkt rad etgan',
  contragent_requests_created: "Kontragent so'rovlari yaratilgan",
};

const STAGE_CONFIG = [
  { key: 'marketplace_created', label: "Marketplace'da yaratilgan" },
  { key: 'punkt_inbox', label: 'Punkt qabulini kutmoqda' },
  { key: 'contragent_requests_created', label: "Kontragent so'rovlari yaratilgan" },
  { key: 'punkt_collected_pending', label: "Punkt yig'ish kutilmoqda" },
  { key: 'punkt_ready_pending', label: 'Punkt tayyorlash kutilmoqda' },
  { key: 'agent_assign_pending', label: 'Agentga topshirish kutilmoqda' },
  { key: 'agent_payment_pending', label: "Agent to'lov e'loni kutilmoqda" },
  { key: 'payment_confirm_pending', label: "Punkt to'lov tasdig'i kutilmoqda" },
  { key: 'post_payment_delivery_pending', label: "To'lovdan keyingi topshirish kutilmoqda" },
  { key: 'remainder_handover_pending', label: 'Qoldiq topshirilishi kutilmoqda' },
  { key: 'ready_for_agent_deliver', label: 'Agentga yakuniy topshirishga tayyor' },
  { key: 'delivered', label: 'Yetkazib berilgan' },
];

const formatNumber = (value) => new Intl.NumberFormat('uz-UZ').format(Number(value) || 0);

const formatAmount = (value) => `${formatNumber(value)} so'm`;

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const toKey = (value) => String(value ?? '');

const unwrapEntity = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (data.marketplace_user) return data.marketplace_user;
  if (data.user) return data.user;
  if (data.punkt) return data.punkt;
  if (data.agent) return data.agent;
  if (data.contragent) return data.contragent;
  return data;
};

const getEntityLabel = (obj, fallback = '-') => {
  if (!obj || typeof obj !== 'object') return fallback;
  return (
    obj.fullname ||
    obj.full_name ||
    obj.name ||
    obj.title ||
    obj.username ||
    obj.phone ||
    obj.phone_number ||
    fallback
  );
};

const getEntityMetaLines = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  const rows = [
    ['ID', obj.id ?? obj._id],
    ['Telefon', obj.phone ?? obj.phone_number],
    ['Username', obj.username],
    ['Status', obj.status],
    ['Rol', obj.role],
    ['Manzil', obj.address],
  ];
  return rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
};

const getStageLabel = (stageCode) => {
  if (!stageCode) return '-';
  const found = STAGE_CONFIG.find((stage) => stage.key === stageCode);
  return found?.label || stageCode;
};

const getOrderStatusLabel = (status) => ORDER_STATUS_LABELS[status] || toDisplayValue(status);

const getPunktAcceptanceStatusLabel = (status) =>
  PUNKT_ACCEPTANCE_STATUS_LABELS[status] || toDisplayValue(status);

const getOrderRowBgClass = (status) => {
  if (status === 'delivered') return 'bg-emerald-100/60 hover:bg-emerald-100/80';
  if (status === 'cancelled') return 'bg-rose-100/55 hover:bg-rose-100/75';
  if (status === 'pending') return 'bg-amber-100/55 hover:bg-amber-100/75';
  return 'hover:bg-gray-50';
};

const OrderPipelineMonitor = () => {
  const { showError } = useSnackbar();
  const [overview, setOverview] = useState({});
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeStage, setActiveStage] = useState(STAGE_CONFIG[0].key);
  const [items, setItems] = useState([]);
  const [allFilters, setAllFilters] = useState({ search: '', status: '', current_stage: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [relatedData, setRelatedData] = useState({ users: {}, punkts: {}, agents: {}, contragents: {} });
  // 404 bo'lgan IDlar qayta-qayta so'ralmasin.
  const [missingRelatedIds, setMissingRelatedIds] = useState({
    users: {},
    punkts: {},
    agents: {},
    contragents: {},
  });

  const activeStageLabel = useMemo(
    () => STAGE_CONFIG.find((stage) => stage.key === activeStage)?.label || activeStage,
    [activeStage]
  );

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await orderPipelineAPI.getOverview();
      if (response?.success) {
        setOverview(response.data || {});
      }
    } catch (error) {
      showError(error.message || 'Pipeline overviewni olishda xatolik');
    } finally {
      setOverviewLoading(false);
    }
  }, [showError]);

  const fetchStageItems = useCallback(
    async (stage, nextPage = pagination.page, nextLimit = pagination.limit) => {
      setTableLoading(true);
      try {
        const response = await orderPipelineAPI.getStageOrders(stage, { page: nextPage, limit: nextLimit });
        if (response?.success) {
          const payload = response.data || {};
          const list = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
          setItems(list);
          setPagination({
            page: Number(payload.page) || nextPage,
            limit: Number(payload.limit) || nextLimit,
            total: Number(payload.total) || list.length,
            pages:
              Number(payload.total_pages) ||
              Math.ceil((Number(payload.total) || list.length) / (Number(payload.limit) || nextLimit || 1)),
          });
        }
      } catch (error) {
        showError(error.message || 'Stage bo\'yicha buyurtmalarni olishda xatolik');
      } finally {
        setTableLoading(false);
      }
    },
    [pagination.page, pagination.limit, showError]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchStageItems('all', pagination.page, pagination.limit);
      return;
    }
    fetchStageItems(activeStage, pagination.page, pagination.limit);
  }, [activeTab, activeStage, pagination.page, pagination.limit, fetchStageItems]);

  const onStageChange = (nextStage) => {
    setActiveStage(nextStage);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const onLimitChange = (nextLimit) => {
    setPagination((prev) => ({ ...prev, page: 1, limit: Number(nextLimit) }));
  };

  const onTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const currentTableTitle = activeTab === 'all' ? 'Barcha buyurtmalar' : activeStageLabel;
  const filteredItems = useMemo(() => {
    if (activeTab !== 'all') return items;
    const q = allFilters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (allFilters.status && String(item.status || '') !== allFilters.status) return false;
      if (allFilters.current_stage && String(item.current_stage || '') !== allFilters.current_stage) return false;
      if (!q) return true;
      return (
        String(item.id ?? item._id ?? '').toLowerCase().includes(q) ||
        String(item.user_id ?? '').toLowerCase().includes(q) ||
        String(item.assigned_punkt_id ?? '').toLowerCase().includes(q) ||
        String(item.assigned_agent_id ?? '').toLowerCase().includes(q)
      );
    });
  }, [activeTab, items, allFilters]);
  const allStatuses = useMemo(
    () => Array.from(new Set(items.map((item) => String(item.status || '')).filter(Boolean))),
    [items]
  );
  const allCurrentStages = useMemo(
    () => Array.from(new Set(items.map((item) => String(item.current_stage || '')).filter(Boolean))),
    [items]
  );
  const selectedUser = selectedOrder?.user_id ? relatedData.users[toKey(selectedOrder.user_id)] : null;
  const selectedPunkt = selectedOrder?.assigned_punkt_id ? relatedData.punkts[toKey(selectedOrder.assigned_punkt_id)] : null;
  const selectedAgent = selectedOrder?.assigned_agent_id ? relatedData.agents[toKey(selectedOrder.assigned_agent_id)] : null;
  const selectedOrderLines = useMemo(() => {
    if (!selectedOrder) return [];
    if (Array.isArray(selectedOrder.items)) return selectedOrder.items;
    const fallbackOrder = items.find((row) => String(row.id ?? row._id) === String(selectedOrder.id ?? selectedOrder._id));
    return Array.isArray(fallbackOrder?.items) ? fallbackOrder.items : [];
  }, [selectedOrder, items]);

  const formatUser = useCallback(
    (id) => {
      if (!id) return '-';
      const user = relatedData.users[toKey(id)];
      if (!user) return id;
      return getEntityLabel(user, id);
    },
    [relatedData.users]
  );

  const formatPunkt = useCallback(
    (id) => {
      if (!id) return '-';
      const punkt = relatedData.punkts[toKey(id)];
      if (!punkt) return id;
      return getEntityLabel(punkt, id);
    },
    [relatedData.punkts]
  );

  const formatAgent = useCallback(
    (id) => {
      if (!id) return '-';
      const agent = relatedData.agents[toKey(id)];
      if (!agent) return id;
      return getEntityLabel(agent, id);
    },
    [relatedData.agents]
  );

  const formatContragent = useCallback(
    (id) => {
      if (!id) return '-';
      const contragent = relatedData.contragents[toKey(id)];
      if (!contragent) return id;
      return getEntityLabel(contragent, id);
    },
    [relatedData.contragents]
  );

  const loadRelatedDetails = useCallback(
    async (orders) => {
      if (!orders?.length) return;
      const uniqueUserIds = Array.from(new Set(orders.map((item) => item.user_id).filter(Boolean)));
      const uniquePunktIds = Array.from(new Set(orders.map((item) => item.assigned_punkt_id).filter(Boolean)));
      const uniqueAgentIds = Array.from(new Set(orders.map((item) => item.assigned_agent_id).filter(Boolean)));
      const uniqueContragentIds = Array.from(
        new Set(
          orders
            .flatMap((order) => (Array.isArray(order.items) ? order.items : []))
            .map((line) => line?.contragent_id)
            .filter(Boolean)
        )
      );

      const missingUserIds = uniqueUserIds.filter(
        (id) => !relatedData.users[toKey(id)] && !missingRelatedIds.users[toKey(id)]
      );
      const missingPunktIds = uniquePunktIds.filter(
        (id) => !relatedData.punkts[toKey(id)] && !missingRelatedIds.punkts[toKey(id)]
      );
      const missingAgentIds = uniqueAgentIds.filter(
        (id) => !relatedData.agents[toKey(id)] && !missingRelatedIds.agents[toKey(id)]
      );
      const missingContragentIds = uniqueContragentIds.filter(
        (id) => !relatedData.contragents[toKey(id)] && !missingRelatedIds.contragents[toKey(id)]
      );

      if (!missingUserIds.length && !missingPunktIds.length && !missingAgentIds.length && !missingContragentIds.length) return;

      setDetailsLoading(true);
      try {
        const [users, punkts, agents, contragents] = await Promise.all([
          Promise.all(
            missingUserIds.map(async (id) => {
              try {
                const res = await marketplaceUserAPI.getById(id);
                return [toKey(id), unwrapEntity(res?.data) || null];
              } catch {
                return [toKey(id), null];
              }
            })
          ),
          Promise.all(
            missingPunktIds.map(async (id) => {
              try {
                const res = await punktAPI.getById(id);
                return [toKey(id), unwrapEntity(res?.data) || null];
              } catch {
                return [toKey(id), null];
              }
            })
          ),
          Promise.all(
            missingAgentIds.map(async (id) => {
              try {
                const res = await agentAPI.getById(id);
                return [toKey(id), unwrapEntity(res?.data) || null];
              } catch {
                return [toKey(id), null];
              }
            })
          ),
          Promise.all(
            missingContragentIds.map(async (id) => {
              try {
                const res = await contragentAPI.getById(id);
                return [toKey(id), unwrapEntity(res?.data) || null];
              } catch {
                return [toKey(id), null];
              }
            })
          ),
        ]);

        setRelatedData((prev) => ({
          users: { ...prev.users, ...Object.fromEntries(users.filter((entry) => entry[1])) },
          punkts: { ...prev.punkts, ...Object.fromEntries(punkts.filter((entry) => entry[1])) },
          agents: { ...prev.agents, ...Object.fromEntries(agents.filter((entry) => entry[1])) },
          contragents: { ...prev.contragents, ...Object.fromEntries(contragents.filter((entry) => entry[1])) },
        }));
        setMissingRelatedIds((prev) => ({
          users: {
            ...prev.users,
            ...Object.fromEntries(users.filter((entry) => !entry[1]).map((entry) => [entry[0], true])),
          },
          punkts: {
            ...prev.punkts,
            ...Object.fromEntries(punkts.filter((entry) => !entry[1]).map((entry) => [entry[0], true])),
          },
          agents: {
            ...prev.agents,
            ...Object.fromEntries(agents.filter((entry) => !entry[1]).map((entry) => [entry[0], true])),
          },
          contragents: {
            ...prev.contragents,
            ...Object.fromEntries(contragents.filter((entry) => !entry[1]).map((entry) => [entry[0], true])),
          },
        }));
      } finally {
        setDetailsLoading(false);
      }
    },
    [
      relatedData.users,
      relatedData.punkts,
      relatedData.agents,
      relatedData.contragents,
      missingRelatedIds.users,
      missingRelatedIds.punkts,
      missingRelatedIds.agents,
      missingRelatedIds.contragents,
    ]
  );

  useEffect(() => {
    loadRelatedDetails(filteredItems);
  }, [filteredItems, loadRelatedDetails]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Buyurtmalar monitoringi</h2>
          <p className="text-sm text-gray-600">Marketplace - punkt - kontragent - agent zanjiri bo'yicha nazorat</p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchOverview();
            fetchStageItems(activeTab === 'all' ? 'all' : activeStage, pagination.page, pagination.limit);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Refresh fontSize="small" />
          Yangilash
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Barcha buyurtmalar
            </button>
            <button
              type="button"
              onClick={() => onTabChange('monitoring')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                activeTab === 'monitoring' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monitoring
            </button>
          </div>
        </div>

        {activeTab === 'monitoring' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              {overviewLoading && <span className="text-xs text-gray-500">Yuklanmoqda...</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {STAGE_CONFIG.map((stage) => (
                <button
                  type="button"
                  key={stage.key}
                  onClick={() => onStageChange(stage.key)}
                  className={`text-left border rounded-lg p-3 transition-colors ${
                    activeStage === stage.key
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}
                >
                  <p className="text-xs text-gray-600 mb-1">{stage.label}</p>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(overview?.[stage.key])}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Filterlar</h3>
              <button
                type="button"
                onClick={() => setAllFilters({ search: '', status: '', current_stage: '' })}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Tozalash
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={allFilters.search}
                onChange={(e) => setAllFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="ID / user / punkt / agent"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={allFilters.status}
                onChange={(e) => setAllFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Barcha status</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
              <select
                value={allFilters.current_stage}
                onChange={(e) => setAllFilters((prev) => ({ ...prev, current_stage: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Barcha stage</option>
                {allCurrentStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {getStageLabel(stage)}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{currentTableTitle}</h3>
            <p className="text-xs text-gray-600">
              Jami: {formatNumber(pagination.total)} ta buyurtma
              {activeTab === 'all' ? `, Filter natijasi: ${formatNumber(filteredItems.length)} ta` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterList className="text-gray-500" fontSize="small" />
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="10">10 ta</option>
              <option value="20">20 ta</option>
              <option value="50">50 ta</option>
              <option value="100">100 ta</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">ID</th>
                <th className="px-3 py-2 text-left font-semibold">Foydalanuvchi</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Hozirgi status</th>
                <th className="px-3 py-2 text-left font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id ?? item._id}
                    className={`border-t border-gray-300 ${getOrderRowBgClass(item.status)}`}
                  >
                    <td className="px-3 py-2">{toDisplayValue(item.id ?? item._id)}</td>
                    <td className="px-3 py-2">{formatUser(item.user_id)}</td>
                    <td className="px-3 py-2">{getOrderStatusLabel(item.status)}</td>
                    <td className="px-3 py-2">{getStageLabel(item.current_stage)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(item)}
                        className="inline-flex items-center justify-center p-1.5 rounded text-indigo-600 hover:bg-indigo-50"
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

        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p className="text-sm text-gray-600">
              Sahifa {pagination.page} / {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Oldingi
              </button>
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" style={{ margin: '0' }}>
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Buyurtma tafsilotlari</h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
              >
                <Close />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
              {detailsLoading && <p className="text-sm text-gray-500 mb-4">Bog'liq ma'lumotlar yuklanmoqda...</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">ID:</span> <span className="font-medium">{toDisplayValue(selectedOrder.id ?? selectedOrder._id)}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className="font-medium">{getOrderStatusLabel(selectedOrder.status)}</span></div>
                <div><span className="text-gray-500">Hozirgi status:</span> <span className="font-medium">{getStageLabel(selectedOrder.current_stage)}</span></div>
                <div><span className="text-gray-500">Jami summa:</span> <span className="font-medium">{formatAmount(selectedOrder.total_amount)}</span></div>

                <div><span className="text-gray-500">Foydalanuvchi:</span> <span className="font-medium">{formatUser(selectedOrder.user_id)}</span></div>
                <div><span className="text-gray-500">Punkt:</span> <span className="font-medium">{formatPunkt(selectedOrder.assigned_punkt_id)}</span></div>
                <div><span className="text-gray-500">Agent:</span> <span className="font-medium">{formatAgent(selectedOrder.assigned_agent_id)}</span></div>

                <div><span className="text-gray-500">Punkt qabul statusi:</span> <span className="font-medium">{getPunktAcceptanceStatusLabel(selectedOrder.punkt_acceptance_status)}</span></div>
                <div><span className="text-gray-500">Punkt yig'gan vaqt:</span> <span className="font-medium">{formatTableDate(selectedOrder.punkt_collected_at)}</span></div>
                <div><span className="text-gray-500">Punkt tayyorlagan vaqt:</span> <span className="font-medium">{formatTableDate(selectedOrder.punkt_ready_at)}</span></div>
                <div><span className="text-gray-500">Agent to'lov e'lon qilgan vaqt:</span> <span className="font-medium">{formatTableDate(selectedOrder.agent_declared_payment_to_punkt_at)}</span></div>
                <div><span className="text-gray-500">Punkt to'lovni tasdiqlagan vaqt:</span> <span className="font-medium">{formatTableDate(selectedOrder.punkt_confirmed_agent_payment_at)}</span></div>
                <div><span className="text-gray-500">To'lovdan keyingi topshirish vaqti:</span> <span className="font-medium">{formatTableDate(selectedOrder.punkt_post_payment_delivered_at)}</span></div>
                <div><span className="text-gray-500">Qoldiq topshirilgan vaqt:</span> <span className="font-medium">{formatTableDate(selectedOrder.punkt_contragent_remainder_handed_over_at)}</span></div>
                <div><span className="text-gray-500">Yaratilgan:</span> <span className="font-medium">{formatTableDate(selectedOrder.created_at ?? selectedOrder.createdAt)}</span></div>
                <div><span className="text-gray-500">Yangilangan:</span> <span className="font-medium">{formatTableDate(selectedOrder.updated_at ?? selectedOrder.updatedAt)}</span></div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Buyurtma tarkibi</h4>
                {selectedOrderLines.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Mahsulot</th>
                          <th className="px-3 py-2 text-left font-semibold">Miqdor</th>
                          <th className="px-3 py-2 text-left font-semibold">Birlik</th>
                          <th className="px-3 py-2 text-left font-semibold">Birlik narxi</th>
                          <th className="px-3 py-2 text-left font-semibold">Jami</th>
                          <th className="px-3 py-2 text-left font-semibold">Kontragent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderLines.map((line, idx) => (
                          <tr key={`${line.product_id || 'p'}-${idx}`} className="border-t border-gray-100">
                            <td className="px-3 py-2">{toDisplayValue(line.product_name || line.product_id)}</td>
                            <td className="px-3 py-2">{toDisplayValue(line.quantity)}</td>
                            <td className="px-3 py-2">{toDisplayValue(line.unit)}</td>
                            <td className="px-3 py-2">{formatAmount(line.unit_price)}</td>
                            <td className="px-3 py-2">{formatAmount(line.line_total)}</td>
                            <td className="px-3 py-2">{formatContragent(line.contragent_id)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Buyurtma tarkibi topilmadi.</p>
                )}
              </div>

              {(selectedUser || selectedPunkt || selectedAgent) && (
                <div className="mt-6 border-t border-gray-200 pt-4 space-y-3 text-sm">
                  <h4 className="font-semibold text-gray-800">Bog'liq ma'lumotlar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedUser && (
                      <div className="border border-gray-200 rounded-md p-3">
                        <p className="text-gray-500 mb-1">Foydalanuvchi</p>
                        <p className="font-semibold mb-2">{getEntityLabel(selectedUser, '-')}</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {getEntityMetaLines(selectedUser).map(([label, value]) => (
                            <p key={`user-${label}`}>
                              <span className="text-gray-500">{label}:</span> {toDisplayValue(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPunkt && (
                      <div className="border border-gray-200 rounded-md p-3">
                        <p className="text-gray-500 mb-1">Punkt</p>
                        <p className="font-semibold mb-2">{getEntityLabel(selectedPunkt, '-')}</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {getEntityMetaLines(selectedPunkt).map(([label, value]) => (
                            <p key={`punkt-${label}`}>
                              <span className="text-gray-500">{label}:</span> {toDisplayValue(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedAgent && (
                      <div className="border border-gray-200 rounded-md p-3">
                        <p className="text-gray-500 mb-1">Agent</p>
                        <p className="font-semibold mb-2">{getEntityLabel(selectedAgent, '-')}</p>
                        <div className="space-y-1 text-xs text-gray-600">
                          {getEntityMetaLines(selectedAgent).map(([label, value]) => (
                            <p key={`agent-${label}`}>
                              <span className="text-gray-500">{label}:</span> {toDisplayValue(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderPipelineMonitor;
