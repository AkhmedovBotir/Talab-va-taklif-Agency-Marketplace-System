import { useCallback, useEffect, useMemo, useState } from 'react';
import { Autorenew, Save, Search, Store } from '@mui/icons-material';
import NeighborhoodShopSearchableSelect from '../../components/NeighborhoodShops/NeighborhoodShopSearchableSelect';
import {
  neighborhoodShopAPI,
  neighborhoodShopMonthlyConfigAPI,
  neighborhoodShopSubscriptionAPI,
} from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const fmtMoney = (n) => {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('uz-UZ')} so'm`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
};

const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocal = (local) => {
  if (!local || !String(local).trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

const isSubscriptionNotFound = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('404') || msg.includes('topilmadi') || msg.includes('not found') || msg.includes("yo'q");
};

const shopId = (s) => String(s?.id ?? s?._id ?? '');

/** none = berilmagan, active = davr faol, expired = muddat tugagan */
const subscriptionStatusFromData = (data) => {
  if (!data) return 'unassigned';
  const isActive = Boolean(data.is_period_active ?? data.isPeriodActive);
  return isActive ? 'active' : 'expired';
};

const SUBSCRIPTION_FILTER_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Aktiv' },
  { value: 'unassigned', label: 'Berilmagan' },
  { value: 'expired', label: 'Muddat tugagan' },
];

const STATUS_BADGE = {
  active: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
  unassigned: { label: 'Berilmagan', className: 'bg-gray-100 text-gray-700' },
  expired: { label: 'Muddat tugagan', className: 'bg-red-100 text-red-800' },
};

async function fetchShopSubscriptionStatus(id) {
  try {
    const res = await neighborhoodShopSubscriptionAPI.get(id);
    return subscriptionStatusFromData(res.data);
  } catch (e) {
    if (isSubscriptionNotFound(e)) return 'unassigned';
    return null;
  }
}

async function fetchAllShopSubscriptionStatuses(shopIds) {
  const map = {};
  const concurrency = 6;
  let index = 0;
  const worker = async () => {
    while (index < shopIds.length) {
      const current = index;
      index += 1;
      const id = shopIds[current];
      const status = await fetchShopSubscriptionStatus(id);
      if (status) map[id] = status;
    }
  };
  const workers = Array.from({ length: Math.min(concurrency, shopIds.length) }, () => worker());
  await Promise.all(workers);
  return map;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

async function fetchAllNeighborhoodShops() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await neighborhoodShopAPI.getAll({ page, limit: 100 });
    const payload = res.data || {};
    const items = Array.isArray(payload.items) ? payload.items : Array.isArray(payload) ? payload : [];
    all.push(...items);
    totalPages = Number(payload.total_pages) || 1;
    page += 1;
  } while (page <= totalPages);
  return all;
}

const NeighborhoodShopSubscriptionsPage = () => {
  const { showSuccess, showError } = useSnackbar();

  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ monthly_price_uzs: '', currency: 'UZS' });

  const [shopsLoading, setShopsLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [shopSearch, setShopSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [subscriptionStatusByShop, setSubscriptionStatusByShop] = useState({});
  const [statusMapLoading, setStatusMapLoading] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState('');

  const [subLoading, setSubLoading] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subNotFound, setSubNotFound] = useState(false);
  const [subForm, setSubForm] = useState({
    billing_type: 'monthly',
    monthly_price_uzs: '',
    free_months: '3',
    period_start_at: '',
  });

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await neighborhoodShopMonthlyConfigAPI.get();
      const data = res.data || {};
      setConfig(data);
      setConfigForm({
        monthly_price_uzs: data.monthly_price_uzs != null ? String(data.monthly_price_uzs) : '',
        currency: data.currency || 'UZS',
      });
    } catch (e) {
      showError(e.message || 'Oylik konfig yuklanmadi');
    } finally {
      setConfigLoading(false);
    }
  }, [showError]);

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    setSubscriptionStatusByShop({});
    try {
      const list = await fetchAllNeighborhoodShops();
      setShops(list);
    } catch (e) {
      showError(e.message || "Do'konlar ro'yxati yuklanmadi");
    } finally {
      setShopsLoading(false);
    }
  }, [showError]);

  const refreshSubscriptionStatuses = useCallback(async (shopList) => {
    const ids = shopList.map((s) => shopId(s)).filter(Boolean);
    if (ids.length === 0) {
      setSubscriptionStatusByShop({});
      return;
    }
    setStatusMapLoading(true);
    try {
      const map = await fetchAllShopSubscriptionStatuses(ids);
      setSubscriptionStatusByShop(map);
    } catch {
      showError('Obuna holatlarini yuklab bo‘lmadi');
    } finally {
      setStatusMapLoading(false);
    }
  }, [showError]);

  const patchShopSubscriptionStatus = useCallback((id, dataOrNull) => {
    if (!id) return;
    setSubscriptionStatusByShop((prev) => ({
      ...prev,
      [String(id)]: dataOrNull === null ? 'unassigned' : subscriptionStatusFromData(dataOrNull),
    }));
  }, []);

  const loadSubscription = useCallback(
    async (id) => {
      if (!id) {
        setSubscription(null);
        setSubNotFound(false);
        return;
      }
      setSubLoading(true);
      setSubNotFound(false);
      try {
        const res = await neighborhoodShopSubscriptionAPI.get(id);
        const data = res.data || null;
        setSubscription(data);
        patchShopSubscriptionStatus(id, data);
        setSubForm({
          billing_type: data.billing_type || data.billingType || 'monthly',
          monthly_price_uzs: data.monthly_price_uzs != null ? String(data.monthly_price_uzs) : '',
          free_months: String(data.free_months ?? data.freeMonths ?? 3),
          period_start_at: toDatetimeLocal(data.period_start_at ?? data.periodStartAt),
        });
      } catch (e) {
        if (isSubscriptionNotFound(e)) {
          setSubscription(null);
          setSubNotFound(true);
          patchShopSubscriptionStatus(id, null);
          setSubForm({
            billing_type: 'monthly',
            monthly_price_uzs: '',
            free_months: '3',
            period_start_at: '',
          });
        } else {
          showError(e.message || 'Obuna yuklanmadi');
        }
      } finally {
        setSubLoading(false);
      }
    },
    [showError, patchShopSubscriptionStatus]
  );

  useEffect(() => {
    loadConfig();
    loadShops();
  }, [loadConfig, loadShops]);

  useEffect(() => {
    if (!shopsLoading && shops.length > 0) {
      refreshSubscriptionStatuses(shops);
    }
  }, [shops, shopsLoading, refreshSubscriptionStatuses]);

  useEffect(() => {
    loadSubscription(selectedShopId);
  }, [selectedShopId, loadSubscription]);

  const searchFilteredShops = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) => {
      const name = String(s.name || '').toLowerCase();
      const phone = String(s.phone || '').toLowerCase();
      const inn = String(s.inn || '').toLowerCase();
      const id = shopId(s).toLowerCase();
      return name.includes(q) || phone.includes(q) || inn.includes(q) || id.includes(q);
    });
  }, [shops, shopSearch]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, unassigned: 0, expired: 0 };
    shops.forEach((s) => {
      const st = subscriptionStatusByShop[shopId(s)];
      if (st && counts[st] != null) counts[st] += 1;
    });
    return counts;
  }, [shops, subscriptionStatusByShop]);

  const displayShops = useMemo(() => {
    if (!subscriptionFilter) return searchFilteredShops;
    return searchFilteredShops.filter((s) => subscriptionStatusByShop[shopId(s)] === subscriptionFilter);
  }, [searchFilteredShops, subscriptionFilter, subscriptionStatusByShop]);

  const selectedShop = useMemo(
    () => shops.find((s) => shopId(s) === String(selectedShopId)),
    [shops, selectedShopId]
  );

  const saveConfig = async (e) => {
    e.preventDefault();
    const price = Number(configForm.monthly_price_uzs);
    if (configForm.monthly_price_uzs === '' || Number.isNaN(price) || price < 0) {
      showError("Oylik narx 0 dan katta yoki teng bo'lishi kerak");
      return;
    }
    setConfigSaving(true);
    try {
      const res = await neighborhoodShopMonthlyConfigAPI.update({
        monthly_price_uzs: price,
        currency: configForm.currency?.trim() || 'UZS',
      });
      showSuccess(res.message || 'Oylik konfig saqlandi');
      await loadConfig();
    } catch (e) {
      showError(e.message || 'Saqlashda xatolik');
    } finally {
      setConfigSaving(false);
    }
  };

  const saveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedShopId) {
      showError("Avval do'konni tanlang");
      return;
    }
    const billingType = subForm.billing_type;
    const payload = { billing_type: billingType };
    const periodStart = fromDatetimeLocal(subForm.period_start_at);
    if (periodStart) payload.period_start_at = periodStart;

    if (billingType === 'monthly') {
      if (subForm.monthly_price_uzs !== '') {
        const custom = Number(subForm.monthly_price_uzs);
        if (Number.isNaN(custom) || custom < 0) {
          showError('Maxsus narx noto‘g‘ri');
          return;
        }
        payload.monthly_price_uzs = custom;
      }
    } else {
      const months = Number(subForm.free_months);
      if (!Number.isInteger(months) || months < 1) {
        showError('Bepul oylar soni kamida 1 bo‘lishi kerak');
        return;
      }
      payload.free_months = months;
    }

    setSubSaving(true);
    try {
      const res = await neighborhoodShopSubscriptionAPI.upsert(selectedShopId, payload);
      showSuccess(res.message || 'Obuna saqlandi');
      setSubscription(res.data || null);
      setSubNotFound(false);
      patchShopSubscriptionStatus(selectedShopId, res.data || null);
      if (res.data) {
        setSubForm({
          billing_type: res.data.billing_type || res.data.billingType || billingType,
          monthly_price_uzs:
            res.data.monthly_price_uzs != null ? String(res.data.monthly_price_uzs) : '',
          free_months: String(res.data.free_months ?? res.data.freeMonths ?? subForm.free_months),
          period_start_at: toDatetimeLocal(res.data.period_start_at ?? res.data.periodStartAt),
        });
      }
    } catch (e) {
      showError(e.message || 'Obunani saqlab bo‘lmadi');
    } finally {
      setSubSaving(false);
    }
  };

  const subscriptionPanel = !selectedShopId ? (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-6">
      <Store className="text-gray-300 mb-3" style={{ fontSize: 48 }} />
      <p className="text-sm text-gray-500">
        Chapdan do'konni tanlang — obuna ma'lumotlari va amallar shu yerda ko'rinadi.
      </p>
    </div>
  ) : subLoading ? (
    <div className="flex items-center justify-center min-h-[320px]">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600" />
    </div>
  ) : (
    <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-semibold text-gray-800">
          {selectedShop?.name || `Do'kon #${selectedShopId}`}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {[selectedShop?.phone, selectedShop?.inn ? `INN ${selectedShop.inn}` : ''].filter(Boolean).join(' · ')}
        </p>
      </div>

      {subNotFound && (
        <div className="px-4 py-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Obuna hali berilmagan. Quyidagi forma orqali yarating.
        </div>
      )}

      {subscription && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">Joriy davr</p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {fmtDate(subscription.period_start_at ?? subscription.periodStartAt)}
              {' — '}
              {fmtDate(subscription.period_end_at ?? subscription.periodEndAt)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">Samarali oylik narx</p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {fmtMoney(subscription.effective_monthly_price_uzs ?? subscription.effectiveMonthlyPriceUzs)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-500">Konfig narxi</p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {fmtMoney(subscription.config_monthly_price_uzs ?? subscription.configMonthlyPriceUzs)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-2 items-center">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.is_in_free_period ?? subscription.isInFreePeriod
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {subscription.is_in_free_period ?? subscription.isInFreePeriod ? 'Bepul muddatda' : 'To‘lov rejimi'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.is_period_active ?? subscription.isPeriodActive
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {subscription.is_period_active ?? subscription.isPeriodActive ? 'Davr faol' : 'Davr tugagan'}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={saveSubscription} className="space-y-4 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-800">Obuna amallari</p>

        <div>
          <label className={labelClass}>To'lov turi *</label>
          <div className="flex flex-wrap gap-4 mt-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="billing_type"
                value="monthly"
                checked={subForm.billing_type === 'monthly'}
                onChange={() => setSubForm((f) => ({ ...f, billing_type: 'monthly' }))}
              />
              Oylik to'lov
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="billing_type"
                value="free"
                checked={subForm.billing_type === 'free'}
                onChange={() => setSubForm((f) => ({ ...f, billing_type: 'free' }))}
              />
              Bepul muddat
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subForm.billing_type === 'monthly' ? (
            <div>
              <label className={labelClass}>Maxsus oylik narx (ixtiyoriy)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={subForm.monthly_price_uzs}
                onChange={(e) => setSubForm((f) => ({ ...f, monthly_price_uzs: e.target.value }))}
                className={inputClass}
                placeholder="Bo'sh — faqat konfig narxi"
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Bepul oylar soni *</label>
              <input
                type="number"
                min={1}
                step={1}
                value={subForm.free_months}
                onChange={(e) => setSubForm((f) => ({ ...f, free_months: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Davr boshlanishi (ixtiyoriy)</label>
            <input
              type="datetime-local"
              value={subForm.period_start_at}
              onChange={(e) => setSubForm((f) => ({ ...f, period_start_at: e.target.value }))}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">Bo'sh — hozir (UTC)</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={subSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
        >
          <Save fontSize="small" />
          {subSaving ? 'Saqlanmoqda...' : subscription ? 'Obunani yangilash' : 'Obuna berish'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <Autorenew />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Standart oylik konfig</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Tizim bo‘yicha bitta yozuv. Do‘konda maxsus narx bo‘lmasa, shu qiymat qo‘llanadi.
            </p>
          </div>
        </div>

        {configLoading ? (
          <p className="text-sm text-gray-500 py-6 text-center">Yuklanmoqda...</p>
        ) : (
          <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelClass}>Oylik narx (so'm) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={configForm.monthly_price_uzs}
                onChange={(e) => setConfigForm((f) => ({ ...f, monthly_price_uzs: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Valyuta</label>
              <input
                type="text"
                value={configForm.currency}
                onChange={(e) => setConfigForm((f) => ({ ...f, currency: e.target.value }))}
                className={inputClass}
                placeholder="UZS"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={configSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                <Save fontSize="small" />
                {configSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              {config && (
                <p className="text-xs text-gray-500">
                  Yangilangan: {fmtDate(config.updatedAt ?? config.updated_at)}
                </p>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
            <Store />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Do'kon obunasi</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Chapda do'konlar ro'yxati, o'ngda obuna amallari.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
            <div className="p-4 space-y-3 border-b border-gray-100 shrink-0">
              <NeighborhoodShopSearchableSelect
                label="Tez tanlash"
                value={selectedShopId}
                onChange={setSelectedShopId}
                shops={shops}
                loading={shopsLoading}
                search={shopSearch}
                onSearchChange={setShopSearch}
              />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="search"
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="Ro'yxatda qidirish..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  disabled={shopsLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Obuna holati</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBSCRIPTION_FILTER_OPTIONS.map((opt) => {
                    const count =
                      opt.value === ''
                        ? shops.length
                        : statusCounts[opt.value] ?? 0;
                    const active = subscriptionFilter === opt.value;
                    return (
                      <button
                        key={opt.value || 'all'}
                        type="button"
                        disabled={shopsLoading || statusMapLoading}
                        onClick={() => setSubscriptionFilter(opt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {opt.label}
                        {!statusMapLoading && (
                          <span className={active ? 'text-indigo-100' : 'text-gray-500'}> ({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {statusMapLoading && (
                  <p className="text-xs text-gray-400 mt-1.5">Obuna holatlari yuklanmoqda...</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Ko'rinmoqda: <span className="font-medium text-gray-700">{displayShops.length}</span>
                {searchFilteredShops.length !== shops.length || subscriptionFilter
                  ? ` / ${searchFilteredShops.length}`
                  : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[280px] max-h-[calc(100vh-340px)]">
              {shopsLoading ? (
                <p className="text-sm text-gray-500 py-10 text-center">Yuklanmoqda...</p>
              ) : displayShops.length === 0 ? (
                <p className="text-sm text-gray-500 py-10 text-center">
                  {statusMapLoading ? 'Holatlar yuklanmoqda...' : "Do'kon topilmadi"}
                </p>
              ) : (
                <ul>
                  {displayShops.map((s) => {
                    const id = shopId(s);
                    const rowActive = id === String(selectedShopId);
                    const subStatus = subscriptionStatusByShop[id];
                    const badge = subStatus ? STATUS_BADGE[subStatus] : null;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => setSelectedShopId(id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            rowActive ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium truncate flex-1 ${
                                rowActive ? 'text-indigo-900' : 'text-gray-900'
                              }`}
                            >
                              {s.name || `Do'kon #${id}`}
                            </p>
                            {badge ? (
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            ) : statusMapLoading ? (
                              <span className="shrink-0 text-[10px] text-gray-400">...</span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {[s.phone, s.inn ? `INN ${s.inn}` : ''].filter(Boolean).join(' · ') || `ID ${id}`}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 bg-gray-50/50 min-h-[320px]">{subscriptionPanel}</div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodShopSubscriptionsPage;
