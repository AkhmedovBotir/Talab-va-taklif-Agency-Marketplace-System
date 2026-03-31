import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Package, Ban } from 'lucide-react';
import { api } from '../services/api';
import { useWebCart } from '../hooks/useWebCart';
import { cn } from '../lib/utils';
import type { MarketplaceOrder } from '../types';
import {
  orderStatusLabelUz,
  formatOrderAddressSummary,
  orderStatusBadgeCombinedClassName,
  getOrderRoadmapStages,
  orderRoadmapStageLabel,
} from '../lib/orders';
import {
  fetchProductImageById,
  resolveOrderLineImageUri,
  formatOrderLineQtyLabel,
  formatOrderLineUnitPriceLabel,
} from '../lib/orderLineMedia';

function formatOrderDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshCart } = useWebCart();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const o = await api.orders.get(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklanmadi');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchOne();
  }, [fetchOne]);

  const listImgMap = useMemo(() => new Map<string, string>(), []);
  const [fetchedImages, setFetchedImages] = useState<Record<number, string>>({});

  useEffect(() => {
    setFetchedImages({});
  }, [order?.id]);

  const orderItemPids = order?.items?.map((l) => l.product_id).join(',') ?? '';

  useEffect(() => {
    if (!order?.items?.length) return;
    let cancelled = false;
    const pids = [...new Set(order.items.map((l) => l.product_id).filter((pid) => pid > 0))];

    (async () => {
      const additions: Record<number, string> = {};
      for (const pid of pids) {
        const sample = order.items.find((l) => l.product_id === pid);
        if (sample?.image_url?.trim()) continue;
        if (listImgMap.has(String(pid))) continue;
        const url = await fetchProductImageById(pid);
        if (url && !cancelled) additions[pid] = url;
      }
      if (!cancelled && Object.keys(additions).length > 0) {
        setFetchedImages((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(additions)) {
            const n = Number(k);
            if (!next[n]) next[n] = v;
          }
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order?.id, orderItemPids, listImgMap]);

  const onConfirmCancelOrder = useCallback(async () => {
    if (order == null || !order.can_cancel) return;
    setCancelSubmitting(true);
    try {
      const updated = await api.orders.cancel(order.id);
      setOrder(updated);
      setCancelModalVisible(false);
      await refreshCart();
    } catch (e) {
      if (typeof window !== 'undefined') {
        window.alert(e instanceof Error ? e.message : 'Bekor qilinmadi');
      }
    } finally {
      setCancelSubmitting(false);
    }
  }, [order, refreshCart]);

  const roadmapStages = getOrderRoadmapStages(order?.roadmap);

  return (
    <div className="min-h-screen bg-slate-100 pb-10 pt-4 sm:pt-5 md:pb-12 md:pt-6 lg:pb-14 lg:pt-8">
      <div className="mx-auto w-full max-w-lg px-4 sm:px-5 md:max-w-3xl lg:max-w-6xl lg:px-8">
        <div className="mb-4 flex items-center gap-3 md:mb-5 lg:mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 lg:text-2xl">Buyurtma</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{id ? `#${id}` : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <p className="text-center text-sm font-medium text-rose-600">{error}</p>
        ) : order ? (
          <div className="space-y-4 md:grid md:grid-cols-12 md:items-start md:gap-6 md:space-y-0 lg:gap-8">
            <div className="space-y-4 md:col-span-5 md:sticky md:top-6 md:self-start lg:top-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Holat</p>
                <p className="mt-3">
                  <span className={orderStatusBadgeCombinedClassName(order.status)}>
                    {orderStatusLabelUz(order.status)}
                  </span>
                </p>
                <p className="mt-3 text-xs text-slate-500">{formatOrderDate(order.created_at)}</p>
                {order.can_cancel ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                      <p className="text-[11px] font-semibold leading-5 text-amber-950/90">
                        Buyurtma kutilmoqda. Bekor qilsangiz, mahsulotlar ombor zaxirasiga qaytariladi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCancelModalVisible(true)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white py-3.5 text-sm font-black text-rose-700 transition hover:bg-rose-50/80"
                    >
                      <Ban className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      Buyurtmani bekor qilish
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manzil</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-800 lg:text-base">
                  {formatOrderAddressSummary(order.address)}
                </p>
                {order.address_note ? <p className="mt-2 text-xs text-slate-600 lg:text-sm">Izoh: {order.address_note}</p> : null}
                {order.extra_phone ? (
                  <p className="mt-1 text-xs text-slate-600 lg:text-sm">Qo‘shimcha tel: {order.extra_phone}</p>
                ) : null}
              </div>

              {roadmapStages.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buyurtma jarayoni</p>
                  <div className="mt-3 space-y-2.5">
                    {roadmapStages.map((step) => (
                      <div key={step.key} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-[5px] inline-block h-2.5 w-2.5 rounded-full',
                            step.done ? 'bg-emerald-500' : 'bg-slate-300'
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-semibold', step.done ? 'text-slate-900' : 'text-slate-500')}>
                            {orderRoadmapStageLabel(step.key)}
                          </p>
                          {step.at ? (
                            <p className="mt-0.5 text-[11px] text-slate-500">{formatOrderDate(step.at)}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.roadmap?.current_stage ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Joriy bosqich</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        {orderRoadmapStageLabel(order.roadmap.current_stage)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 md:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Mahsulotlar</p>
                <ul className="space-y-0 divide-y divide-slate-100">
                  {order.items.map((line, idx) => {
                    const imgUri = resolveOrderLineImageUri(
                      line.product_id,
                      line.image_url,
                      listImgMap,
                      fetchedImages
                    );
                    return (
                      <li
                        key={`${line.product_id}_${idx}`}
                        className="flex flex-row items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        {imgUri ? (
                          <img
                            src={imgUri}
                            alt={line.product_name || `Mahsulot ${line.product_id}`}
                            className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            <Package className="h-7 w-7 text-slate-400" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 lg:text-base">
                            {line.product_name || `Mahsulot #${line.product_id}`}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            {line.product_code != null
                              ? `Kod: ${line.product_code} · ID: ${line.product_id}`
                              : `ID: ${line.product_id}`}
                          </p>
                          <div className="mt-2 space-y-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                            <div className="flex flex-row items-center justify-between gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Soni</span>
                              <span className="max-w-[68%] text-right text-sm font-semibold text-slate-800">
                                {formatOrderLineQtyLabel(line)}
                              </span>
                            </div>
                            <div className="flex flex-row items-center justify-between gap-2">
                              <span className="max-w-[55%] text-[11px] font-black uppercase leading-tight tracking-wide text-slate-400">
                                {formatOrderLineUnitPriceLabel(line)}
                              </span>
                              <span className="shrink-0 text-sm font-semibold text-slate-800 tabular-nums">
                                {line.unit_price.toLocaleString()} so&apos;m
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex min-w-[5.5rem] shrink-0 flex-col items-end self-start pt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Umumiy</span>
                          <span className="mt-0.5 text-base font-black text-orange-600 tabular-nums lg:text-lg">
                            {line.line_total.toLocaleString()} so&apos;m
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-4 lg:px-5 lg:py-5">
                <span className="text-sm font-black uppercase tracking-wide text-slate-600">Jami</span>
                <span className="text-xl font-black text-slate-900 lg:text-2xl">{order.total_amount.toLocaleString()} so&apos;m</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {cancelModalVisible ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Yopish"
            disabled={cancelSubmitting}
            onClick={() => !cancelSubmitting && setCancelModalVisible(false)}
          />
          <div className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
              <Ban className="h-6 w-6 text-rose-600" aria-hidden />
            </div>
            <p className="text-center text-lg font-black text-slate-900">Buyurtmani bekor qilish?</p>
            <p className="mt-2 text-center text-sm font-medium leading-5 text-slate-500">
              Bekor qilingach holat «Bekor qilingan» bo‘ladi va mahsulotlar zaxiraga qaytadi. Keyin tiklab
              bo‘lmaydi.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={() => setCancelModalVisible(false)}
                className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Yo‘q
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={() => void onConfirmCancelOrder()}
                className={cn(
                  'flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-rose-600 text-sm font-black text-white transition hover:bg-rose-700',
                  cancelSubmitting && 'pointer-events-none opacity-60'
                )}
              >
                {cancelSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : 'Ha, bekor qilish'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
