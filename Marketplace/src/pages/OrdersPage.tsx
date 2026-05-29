import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Package } from 'lucide-react';
import { api } from '../services/api';
import type { MarketplaceOrder } from '../types';
import { orderStatusLabelUz, formatOrderAddressSummary } from '../lib/orders';
import { cn } from '../lib/utils';

function formatOrderDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'bozor' | 'mahalla'>('bozor');
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res =
        tab === 'bozor'
          ? await api.orders.list({ page: p, limit: 15 })
          : await api.localShopOrders.list({ page: p, limit: 15 });
      setTotalPages(Math.max(1, res.total_pages));
      setTotal(res.total);
      setPage(res.page);
      setOrders((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch {
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab]);

  useEffect(() => {
    void load(1, false);
  }, [load]);

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
            <h1 className="text-xl font-black text-slate-900 lg:text-2xl">Buyurtmalarim</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {total > 0 ? `Jami ${total} ta` : 'Ro‘yxat'}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('bozor')}
              className={cn('rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider', tab === 'bozor' ? 'bg-white text-slate-900' : 'text-slate-500')}
            >
              Bozor
            </button>
            <button
              type="button"
              onClick={() => setTab('mahalla')}
              className={cn('rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider', tab === 'mahalla' ? 'bg-white text-slate-900' : 'text-slate-500')}
            >
              Maxalla
            </button>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm lg:mx-auto lg:max-w-xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <Package className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-lg font-black text-slate-800">Hozircha buyurtma yo‘q</p>
            <p className="mt-2 text-sm text-slate-500">Savatdan buyurtma bering</p>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-3 xl:gap-5">
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navigate(`/orders/${o.id}?market=${tab}`)}
                className="flex w-full min-w-0 items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-orange-200 md:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">#{o.id}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{formatOrderDate(o.created_at)}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">{formatOrderAddressSummary(o.address)}</p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                    {orderStatusLabelUz(o.status)}
                  </span>
                </div>
                <div className="ml-3 flex flex-col items-end">
                  <span className="text-base font-black text-orange-600">{o.total_amount.toLocaleString()} so&apos;m</span>
                  <ChevronRight className="mt-2 h-4 w-4 text-slate-300" />
                </div>
              </button>
            ))}
            {page < totalPages ? (
              <button
                type="button"
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className={cn(
                  'w-full rounded-2xl border border-slate-200 bg-white py-4 text-center font-bold text-slate-700 md:col-span-2 xl:col-span-3',
                  loadingMore && 'opacity-50'
                )}
              >
                {loadingMore ? 'Yuklanmoqda...' : 'Yana yuklash'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
