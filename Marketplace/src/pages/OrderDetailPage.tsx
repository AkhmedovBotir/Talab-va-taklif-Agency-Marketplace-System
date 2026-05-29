import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Package, Ban, Star, X } from 'lucide-react';
import { api } from '../services/api';
import { useWebCart } from '../hooks/useWebCart';
import { cn } from '../lib/utils';
import type { MarketplaceOrder, CommentTemplate, OrderRatingItemPayload } from '../types';
import {
  orderStatusLabelUz,
  formatOrderAddressSummary,
  orderStatusBadgeCombinedClassName,
  getOrderRoadmapStages,
  orderRoadmapStageLabel,
} from '../lib/orders';
import {
  fetchProductImageById,
  fetchLocalShopProductImageById,
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
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshCart } = useWebCart();
  const market = new URLSearchParams(location.search).get('market') === 'mahalla' ? 'mahalla' : 'bozor';
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentTemplates, setCommentTemplates] = useState<CommentTemplate[]>([]);
  const [ratingDraft, setRatingDraft] = useState<Record<number, { score: number; comment_template_id?: number; note: string }>>({});

  const fetchOne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const o = market === 'mahalla' ? await api.localShopOrders.get(id) : await api.orders.get(id);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklanmadi');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, market]);

  useEffect(() => {
    void fetchOne();
  }, [fetchOne]);

  useEffect(() => {
    void api.commentTemplates.list().then(setCommentTemplates).catch(() => {});
  }, []);

  const listImgMap = useMemo(() => new Map<string, string>(), []);
  const [fetchedImages, setFetchedImages] = useState<Record<number, string>>({});

  useEffect(() => {
    setFetchedImages({});
  }, [order?.id]);

  const orderItemPids = order?.items?.map((l) => `${l.product_id}:${l.local_shop_product_id ?? 0}`).join(',') ?? '';

  useEffect(() => {
    if (!order?.items?.length) return;
    let cancelled = false;
    const ids =
      order.market === 'mahalla'
        ? [...new Set(order.items.map((l) => l.local_shop_product_id ?? 0).filter((id) => id > 0))]
        : [...new Set(order.items.map((l) => l.product_id).filter((pid) => pid > 0))];

    (async () => {
      const additions: Record<number, string> = {};
      for (const pid of ids) {
        const sample =
          order.market === 'mahalla'
            ? order.items.find((l) => (l.local_shop_product_id ?? 0) === pid)
            : order.items.find((l) => l.product_id === pid);
        if (sample?.image_url?.trim()) continue;
        if (order.market !== 'mahalla' && listImgMap.has(String(pid))) continue;
        const url =
          order.market === 'mahalla'
            ? await fetchLocalShopProductImageById(pid, order.local_shop_id)
            : await fetchProductImageById(pid);
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
      const updated = market === 'mahalla' ? await api.localShopOrders.cancel(order.id) : await api.orders.cancel(order.id);
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
  }, [order, refreshCart, market]);

  const openRatingModal = useCallback(() => {
    if (!order) return;
    const draft: Record<number, { score: number; comment_template_id?: number; note: string }> = {};
    for (const line of order.items) {
      const itemId = Number(line.order_item_id ?? 0);
      if (itemId > 0) draft[itemId] = { score: 5, note: '' };
    }
    setRatingDraft(draft);
    setRatingModalOpen(true);
    void (async () => {
      const updates: Record<number, { score: number; comment_template_id?: number; note: string }> = {};
      await Promise.all(
        order.items.map(async (line) => {
          const itemId = Number(line.order_item_id ?? 0);
          const pid = Number(line.product_id ?? 0);
          if (!itemId || !pid) return;
          try {
            const res = await api.productRatings.get(pid, { page: 1, limit: 100 });
            const own = res.items.find((it) => Number(it.order_id) === Number(order.id) && Number(it.order_item_id) === itemId);
            if (!own) return;
            updates[itemId] = {
              score: Math.min(5, Math.max(1, Number(own.score) || 5)),
              comment_template_id: own.comment_template_id,
              note: own.note || own.comment_template || '',
            };
          } catch {
            // ignore per-line errors
          }
        })
      );
      if (Object.keys(updates).length) setRatingDraft((prev) => ({ ...prev, ...updates }));
    })();
  }, [order]);

  const submitRatings = useCallback(async () => {
    if (!order) return;
    const items: OrderRatingItemPayload[] = order.items
      .map((line) => {
        const itemId = Number(line.order_item_id ?? 0);
        const draft = ratingDraft[itemId];
        if (!itemId || !draft) return null;
        if (draft.score < 1 || draft.score > 5) return null;
        return {
          order_item_id: itemId,
          score: draft.score,
          comment_template_id: draft.comment_template_id || undefined,
          note: draft.note?.trim() || undefined,
        };
      })
      .filter(Boolean) as OrderRatingItemPayload[];
    if (!items.length) return window.alert("Baholash uchun mahsulot topilmadi");
    setRatingSubmitting(true);
    try {
      await api.orders.rate(order.id, items);
      setRatingModalOpen(false);
      window.alert('Rahmat! Baholaringiz saqlandi.');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Baholash yuborilmadi");
    } finally {
      setRatingSubmitting(false);
    }
  }, [order, ratingDraft]);

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
                      fetchedImages,
                      line.local_shop_product_id ?? line.product_id
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
              {order.status === 'delivered' && market === 'bozor' ? (
                <button onClick={() => openRatingModal()} className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-black uppercase tracking-wide text-white">
                  Mahsulotlarni baholash
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {ratingModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 p-0 md:items-center md:p-4" onClick={() => !ratingSubmitting && setRatingModalOpen(false)}>
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 md:max-w-3xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Mahsulotlarni baholash</h3>
              <button onClick={() => !ratingSubmitting && setRatingModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {order?.items.map((line, idx) => {
                const itemId = Number(line.order_item_id ?? 0);
                if (!itemId) return null;
                const draft = ratingDraft[itemId] || { score: 5, note: '' };
                return (
                  <div key={`${itemId}_${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-bold text-slate-800">{line.product_name}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">Sizning bahongiz: {draft.score} / 5</p>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button key={score} onClick={() => setRatingDraft((p) => ({ ...p, [itemId]: { ...draft, score } }))} className="rounded p-1">
                          <Star size={22} className={score <= draft.score ? 'fill-amber-500 text-amber-500' : 'text-slate-300'} />
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {commentTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() =>
                            setRatingDraft((p) => ({
                              ...p,
                              [itemId]: { ...draft, comment_template_id: tpl.id, note: draft.note || tpl.comment },
                            }))
                          }
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold',
                            draft.comment_template_id === tpl.id ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'
                          )}
                        >
                          {tpl.comment}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={draft.note}
                      onChange={(e) => setRatingDraft((p) => ({ ...p, [itemId]: { ...draft, note: e.target.value } }))}
                      placeholder="Izoh (ixtiyoriy)"
                      rows={2}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => !ratingSubmitting && setRatingModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-600">Yopish</button>
              <button onClick={() => void submitRatings()} disabled={ratingSubmitting} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-60">{ratingSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}</button>
            </div>
          </div>
        </div>
      ) : null}

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
