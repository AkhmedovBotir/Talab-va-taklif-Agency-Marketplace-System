import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { api, parsePositiveProductId } from '../services/api';
import type { Address, Region, District, MFY } from '../types';
import { useWebCart } from '../hooks/useWebCart';
import { WebCustomSelect } from '../components/WebCustomSelect';
import { formatAddressGeoSummary } from '../lib/addressLabels';
import { cn } from '../lib/utils';

type AddrMode = 'default' | 'delivery_area';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, clearCart, refreshCart } = useWebCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [addrMode, setAddrMode] = useState<AddrMode>('default');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [extraPhone, setExtraPhone] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasDefault = useMemo(() => addresses.some((a) => a.is_default), [addresses]);

  const addressSelectOptions = useMemo(
    () =>
      addresses.map((a) => {
        const geo = formatAddressGeoSummary(a, regions, districts, mfys);
        const userDesc = a.description?.trim();
        const description = [geo || null, userDesc || null].filter(Boolean).join(' · ') || undefined;
        return {
          value: Number(a.id),
          label: a.is_default ? `${a.name} (ASOSIY)` : a.name,
          description,
        };
      }),
    [addresses, regions, districts, mfys]
  );

  const loadAddr = useCallback(async () => {
    setLoadingAddr(true);
    try {
      const [list, reg, dist, mfyList] = await Promise.all([
        api.addresses.list(),
        api.regions.getRegions(),
        api.regions.getDistricts(),
        api.regions.getMFYs(),
      ]);
      setAddresses(list);
      setRegions(reg);
      setDistricts(dist);
      setMfys(mfyList);
      const def = list.find((a) => a.is_default);
      if (def != null) setSelectedAreaId(Number(def.id));
      else {
        const first = list[0];
        if (first != null) setSelectedAreaId(Number(first.id));
      }
    } finally {
      setLoadingAddr(false);
    }
  }, []);

  useEffect(() => {
    void loadAddr();
  }, [loadAddr]);

  useEffect(() => {
    if (cart.length === 0) navigate('/', { replace: true });
  }, [cart.length, navigate]);

  const notify = (msg: string) => {
    if (typeof window !== 'undefined') window.alert(msg);
  };

  const onSubmit = async () => {
    if (cart.length === 0) return;

    const items: { product_id: number; quantity: number }[] = [];
    for (const line of cart) {
      const pid = parsePositiveProductId(line.id);
      if (pid == null) {
        notify('Baʼzi mahsulotlarning ID si noto‘g‘ri.');
        return;
      }
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        notify('Miqdor noto‘g‘ri.');
        return;
      }
      items.push({ product_id: pid, quantity: qty });
    }

    let address: { type: 'default' } | { type: 'delivery_area'; delivery_area_id: number };

    if (addrMode === 'default') {
      if (!hasDefault) {
        notify(
          'Buyurtma uchun profilda asosiy yetkazib berish manzili bo‘lishi kerak. Profildan manzil qo‘shing va asosiy qilib belgilang.'
        );
        return;
      }
      address = { type: 'default' };
    } else {
      if (selectedAreaId == null || Number.isNaN(selectedAreaId)) {
        notify('Saqlangan manzilni tanlang.');
        return;
      }
      address = { type: 'delivery_area', delivery_area_id: selectedAreaId };
    }

    setSubmitting(true);
    try {
      const order = await api.orders.create({
        items,
        address,
        extra_phone: extraPhone.trim() || undefined,
        address_note: addressNote.trim() || undefined,
      });
      await clearCart();
      await refreshCart();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Buyurtma yuborilmadi');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const ctaButton = (
    <button
      type="button"
      onClick={() => void onSubmit()}
      disabled={submitting || loadingAddr}
      className={cn(
        'flex w-full items-center justify-center rounded-2xl bg-gray-900 py-4 text-base font-bold text-white transition-opacity hover:bg-orange-600 md:py-3.5 md:text-lg',
        (submitting || loadingAddr) && 'pointer-events-none opacity-50'
      )}
    >
      {submitting ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : 'Buyurtmani tasdiqlash'}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-28 pt-4 md:pb-32 md:pt-6 lg:pb-10 lg:pt-8">
      <div className="mx-auto w-full max-w-lg px-4 sm:px-5 md:max-w-3xl lg:max-w-6xl lg:px-8">
        <div className="mb-6 flex items-center gap-3 lg:mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 lg:text-2xl">Buyurtmani rasmiylashtirish</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manzil va tasdiqlash</p>
          </div>
        </div>

        <div className="md:grid md:grid-cols-12 md:items-start md:gap-6 lg:gap-10">
          <div className="mb-4 min-w-0 md:col-span-5 md:mb-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:sticky md:top-4 lg:top-6">
              <div className="border-b border-slate-100 px-4 py-3 lg:px-5 lg:py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Buyurtmadagi mahsulotlar
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{cartCount} ta pozitsiya</p>
              </div>
              {cart.map((item, idx) => {
                const uri = item.images?.[0];
                const lineTotal = item.price * item.quantity;
                const lineKey = item.cartLineId != null ? String(item.cartLineId) : `${item.id}-${idx}`;
                return (
                  <div
                    key={lineKey}
                    className={cn('flex gap-3 px-4 py-3 lg:px-5 lg:py-3.5', idx > 0 && 'border-t border-slate-100')}
                  >
                    {uri ? (
                      <img
                        src={uri}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover lg:h-16 lg:w-16"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-200 lg:h-16 lg:w-16" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-slate-900 lg:text-base">{item.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.quantity} × {item.price.toLocaleString()} so&apos;m
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-orange-600 lg:text-base">{lineTotal.toLocaleString()}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3.5 lg:px-5 lg:py-4">
                <span className="text-xs font-black uppercase tracking-wide text-slate-500">Jami</span>
                <span className="text-lg font-black text-slate-900 lg:text-xl">{cartTotal.toLocaleString()} so&apos;m</span>
              </div>
              <div className="hidden border-t border-slate-200 bg-white p-4 md:block md:px-5 md:pb-5 md:pt-4">
                {ctaButton}
              </div>
            </div>
          </div>

          <div className="min-w-0 md:col-span-7 md:space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-black text-slate-800 lg:text-base">Yetkazib berish manzili</h2>

              {loadingAddr ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setAddrMode('default')}
                    className={cn(
                      'w-full rounded-2xl border-2 p-4 text-left transition-colors lg:p-5',
                      addrMode === 'default' ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 bg-white'
                    )}
                  >
                    <span className="font-black text-slate-900">Asosiy manzil</span>
                    <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
                      {hasDefault
                        ? 'Profilda belgilangan asosiy yetkazib berish manzili ishlatiladi.'
                        : 'Asosiy manzil yo‘q — avval profildan qo‘shing.'}
                    </p>
                  </button>

                  {addresses.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAddrMode('delivery_area')}
                      className={cn(
                        'w-full rounded-2xl border-2 p-4 text-left transition-colors lg:p-5',
                        addrMode === 'delivery_area' ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 bg-white'
                      )}
                    >
                      <span className="font-black text-slate-900">Boshqa saqlangan manzil</span>
                      {addrMode === 'delivery_area' ? (
                        <div className="mt-3">
                          <WebCustomSelect<number>
                            label="Tanlangan manzil"
                            value={selectedAreaId}
                            options={addressSelectOptions}
                            onChange={(id) => setSelectedAreaId(id)}
                            showNullOption={false}
                            placeholder="Manzilni tanlang"
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500 lg:text-sm">Ro‘yxatdan tanlang</p>
                      )}
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:mt-0 lg:p-5">
              <h2 className="mb-3 text-sm font-black text-slate-800 lg:text-base">Qo‘shimcha (ixtiyoriy)</h2>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Aloqa telefoni
              </label>
              <input
                type="tel"
                value={extraPhone}
                onChange={(e) => setExtraPhone(e.target.value)}
                placeholder="+998901234567"
                className="mb-4 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
              />
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Yetkazish bo‘yicha izoh
              </label>
              <textarea
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="Masalan: 3-podezd, 4-qavat, domofon kodi"
                rows={4}
                className="min-h-[88px] w-full rounded-2xl border-2 border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-5 md:hidden">
          <div className="mx-auto w-full max-w-lg">{ctaButton}</div>
        </div>
      </div>
    </div>
  );
}
