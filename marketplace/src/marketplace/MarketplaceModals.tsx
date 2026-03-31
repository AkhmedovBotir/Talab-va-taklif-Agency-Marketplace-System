import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
  ShoppingCart,
  X,
  ChevronRight,
  Info,
  ChevronLeft,
  Package,
  Pencil,
  Trash2,
  Star,
  Plus,
  Minus,
} from 'lucide-react-native';
import { cn } from '../lib/utils';
import { useMarketplace } from './MarketplaceContext';
import { api } from '../services/api';
import type { Product } from '../types';

function ProductDetailCartActionsNative({
  product,
  inCartQty,
  onAdd,
  onDelta,
}: {
  product: Product;
  inCartQty: number;
  onAdd: () => void;
  onDelta: (delta: number) => void;
}) {
  const stock = Math.max(0, Math.floor(Number(product.quantity) || 0));
  const atMax = inCartQty >= stock;
  const out = stock <= 0;
  if (out) {
    return (
      <View className="w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 py-5">
        <Text className="text-xs font-black uppercase tracking-wider text-gray-400">Omborda yo&apos;q</Text>
      </View>
    );
  }
  if (inCartQty <= 0) {
    return (
      <Pressable
        onPress={onAdd}
        className="w-full flex-row items-center justify-center gap-3 rounded-2xl bg-gray-900 py-5"
      >
        <ShoppingCart size={22} color="white" />
        <Text className="text-lg font-bold text-white">Savatga qo&apos;shish</Text>
      </Pressable>
    );
  }
  return (
    <View className="w-full gap-2">
      <View className="flex-row w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 py-2 pl-2 pr-2">
        <Pressable
          onPress={() => onDelta(-1)}
          className="h-12 w-12 items-center justify-center rounded-xl bg-white active:bg-gray-100"
          hitSlop={6}
        >
          <Minus size={20} color="#475569" />
        </Pressable>
        <Text className="min-w-[40px] text-center text-lg font-black text-gray-900">{inCartQty}</Text>
        <Pressable
          onPress={() => !atMax && onDelta(1)}
          disabled={atMax}
          className={cn(
            'h-12 w-12 items-center justify-center rounded-xl bg-white active:bg-gray-100',
            atMax && 'opacity-40'
          )}
          hitSlop={6}
        >
          <Plus size={20} color="#475569" />
        </Pressable>
      </View>
      <Text className="text-center text-[10px] font-semibold text-gray-400">Omborda {stock} ta</Text>
    </View>
  );
}

export function MarketplaceModals() {
  const m = useMarketplace();
  const [areaName, setAreaName] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [formPicker, setFormPicker] = useState<'region' | 'district' | 'mfy' | null>(null);
  const [allDistricts, setAllDistricts] = useState<{ id: number; name: string }[]>([]);
  const [allMfys, setAllMfys] = useState<{ id: number; name: string }[]>([]);
  const isWeb = Platform.OS === 'web';
  /** Webda planshetdan kichik: mahsulot modali butun ekranni egallaydi. */
  const productModalFullScreenWeb = isWeb && !m.isTabletUpWeb;
  const useCenteredRegionModal = Platform.OS === 'web' || m.isTabletUpWeb;
  const webModalOuterPadding = m.windowWidth >= 1280 ? 40 : m.windowWidth >= 1024 ? 28 : 16;
  const regionModalRadius = isWeb ? (m.windowWidth >= 1024 ? 32 : 24) : 40;
  const addressFormModalRadius = isWeb ? (m.windowWidth >= 1024 ? 24 : 18) : 16;
  const addressFormModalPadding = isWeb ? (m.windowWidth >= 1024 ? 20 : 14) : 20;
  const pickerModalRadius = isWeb ? (m.windowWidth >= 1024 ? 24 : 18) : 16;
  const pickerModalPadding = isWeb ? (m.windowWidth >= 1024 ? 20 : 14) : 20;

  const selectedDetailCartQty = useMemo(() => {
    const p = m.selectedProduct;
    if (!p) return 0;
    const line = m.cart.find((c) => String(c.id) === String(p.id));
    return line?.quantity ?? 0;
  }, [m.cart, m.selectedProduct]);

  const selectedRegionName = m.selectedRegion?.name || 'Viloyat tanlanmagan';
  const selectedDistrictName = m.selectedDistrict?.name || 'Tuman tanlanmagan';
  const selectedMfyName = m.selectedMFY?.name || 'MFY tanlanmagan';
  const canSaveAddress = !!(areaName.trim() && m.selectedRegion && m.selectedDistrict && m.selectedMFY);

  useEffect(() => {
    if (!m.isRegionSelectorOpen) return;
    let active = true;
    (async () => {
      try {
        const [districts, mfys] = await Promise.all([api.regions.getDistricts(), api.regions.getMFYs()]);
        if (!active) return;
        setAllDistricts(districts.map((d) => ({ id: d.id, name: d.name })));
        setAllMfys(mfys.map((mf) => ({ id: mf.id, name: mf.name })));
      } catch {
        if (!active) return;
        setAllDistricts([]);
        setAllMfys([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [m.isRegionSelectorOpen]);

  const addressMeta = useMemo(
    () =>
      new Map(
        m.userAddresses.map((a) => [
          a.id,
          {
            regionName: m.regions.find((r) => r.id === a.region_id)?.name || `Viloyat #${a.region_id}`,
            districtName:
              m.districts.find((d) => d.id === a.district_id)?.name ||
              allDistricts.find((d) => d.id === a.district_id)?.name ||
              `Tuman #${a.district_id}`,
            mfyName:
              m.mfys.find((mf) => mf.id === a.mfy_id)?.name ||
              allMfys.find((mf) => mf.id === a.mfy_id)?.name ||
              `MFY #${a.mfy_id}`,
          },
        ])
      ),
    [m.userAddresses, m.regions, m.districts, m.mfys, allDistricts, allMfys]
  );

  return (
    <>
      {/* Region */}
      <AnimatePresence>
        {m.isRegionSelectorOpen && (
          <View className="absolute inset-0 z-[60]">
            <Pressable className="absolute inset-0 bg-black/60" onPress={() => m.setIsRegionSelectorOpen(false)} />
            <View
              className={cn('absolute inset-0', useCenteredRegionModal ? 'items-center justify-center px-4' : 'justify-end')}
              pointerEvents="box-none"
              style={useCenteredRegionModal && isWeb ? { paddingHorizontal: webModalOuterPadding } : undefined}
            >
              <MotiView
                from={useCenteredRegionModal ? { opacity: 0, scale: 0.95 } : { translateY: m.SCREEN_HEIGHT }}
                animate={useCenteredRegionModal ? { opacity: 1, scale: 1 } : { translateY: 0 }}
                exit={useCenteredRegionModal ? { opacity: 0, scale: 0.95 } : { translateY: m.SCREEN_HEIGHT }}
                transition={{ type: 'timing', duration: 140 }}
                className={cn(
                  'overflow-hidden bg-white shadow-2xl',
                  useCenteredRegionModal ? 'border border-slate-200' : 'h-[80%] w-full rounded-t-[40px]'
                )}
                style={
                  useCenteredRegionModal
                    ? {
                        width: Math.min(m.windowWidth - webModalOuterPadding * 2, 680),
                        height: Math.min(Math.round(m.windowHeight * 0.8), 680),
                        backgroundColor: '#ffffff',
                        borderRadius: regionModalRadius,
                      }
                    : undefined
                }
              >
                <View
                  className={cn(
                    'flex-row items-center justify-between border-b border-gray-100 bg-white p-6',
                    useCenteredRegionModal ? '' : 'rounded-t-[40px]'
                  )}
                  style={useCenteredRegionModal ? { borderTopLeftRadius: regionModalRadius, borderTopRightRadius: regionModalRadius } : undefined}
                >
                  <View className="flex-row items-center gap-3">
                    {m.regionSelectorStep !== 'region' && (
                      <Pressable
                        onPress={() =>
                          m.setRegionSelectorStep(m.regionSelectorStep === 'mfy' ? 'district' : 'region')
                        }
                        className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"
                      >
                        <ChevronLeft size={20} color="#4b5563" />
                      </Pressable>
                    )}
                    <View>
                      <Text className="text-lg font-black text-gray-900">
                        {m.regionSelectorStep === 'region'
                          ? 'Viloyat'
                          : m.regionSelectorStep === 'district'
                            ? 'Tuman'
                            : 'MFY'}
                      </Text>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Tanlash kutilmoqda
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => m.setIsRegionSelectorOpen(false)}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"
                  >
                    <X size={20} color="#9ca3af" />
                  </Pressable>
                </View>
                <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                  <View className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <Text className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Saqlangan hududlar</Text>
                    {m.userAddresses.length === 0 ? (
                      <Text className="text-xs font-semibold text-slate-400">Hozircha saqlangan hudud yo&apos;q.</Text>
                    ) : (
                      <View className="gap-2">
                        {m.userAddresses.map((a) => {
                          const meta = addressMeta.get(a.id);
                          return (
                            <View key={String(a.id)} className="rounded-xl border border-slate-200 bg-white p-3">
                              <View className="flex-row items-start justify-between gap-2">
                                <Pressable
                                  className="min-w-0 flex-1"
                                  onPress={async () => {
                                    await m.applyUserAddress(a);
                                  }}
                                >
                                  <View className="flex-row items-center gap-2">
                                    <Text className="text-sm font-black text-slate-900">{a.name}</Text>
                                    {a.is_default ? (
                                      <View className="rounded bg-orange-500 px-1.5 py-0.5">
                                        <Text className="text-[8px] font-black uppercase text-white">Asosiy</Text>
                                      </View>
                                    ) : null}
                                  </View>
                                  <Text className="mt-1 text-[11px] font-semibold text-slate-500">
                                    {meta?.regionName}, {meta?.districtName}, {meta?.mfyName}
                                  </Text>
                                </Pressable>
                                <View className="flex-row gap-2">
                                  <Pressable
                                    onPress={async () => {
                                      setEditingAddressId(a.id);
                                      setAreaName(a.name);
                                      await m.applyUserAddress(a);
                                      m.setRegionSelectorStep('region');
                                      setIsAddressFormOpen(true);
                                    }}
                                    className="h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
                                  >
                                    <Pencil size={14} color="#475569" />
                                  </Pressable>
                                  {!a.is_default ? (
                                    <Pressable
                                      onPress={async () => {
                                        await m.setDefaultUserAddress(a.id);
                                      }}
                                      className="h-8 w-8 items-center justify-center rounded-lg border border-orange-200 bg-orange-50"
                                    >
                                      <Star size={14} color="#ea580c" />
                                    </Pressable>
                                  ) : null}
                                  <Pressable
                                    onPress={async () => {
                                      await m.deleteUserAddress(a.id);
                                    }}
                                    className="h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50"
                                  >
                                    <Trash2 size={14} color="#e11d48" />
                                  </Pressable>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={() => {
                      setEditingAddressId(null);
                      setAreaName('');
                      m.setSelectedRegion(null);
                      m.setSelectedDistrict(null);
                      m.setSelectedMFY(null);
                      m.setRegionSelectorStep('region');
                      setIsAddressFormOpen(true);
                    }}
                    className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-3"
                  >
                    <Plus size={16} color="#475569" />
                    <Text className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      Yangi hudud qo&apos;shish
                    </Text>
                  </Pressable>

                </ScrollView>

                <AnimatePresence>
                  {isAddressFormOpen && (
                    <View className="absolute inset-0 z-20">
                      <Pressable className="absolute inset-0 bg-black/40" onPress={() => setIsAddressFormOpen(false)} />
                      <View className="absolute inset-0 items-center justify-center px-5">
                        <MotiView
                          from={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-md border border-slate-200 bg-white shadow-2xl"
                          style={{
                            backgroundColor: '#ffffff',
                            width: Math.min(m.windowWidth - 72, m.isTabletUpWeb ? 560 : 420),
                            borderRadius: addressFormModalRadius,
                            padding: addressFormModalPadding,
                          }}
                        >
                          <Text className="mb-2 text-base font-black text-slate-900">
                            {editingAddressId ? 'Hududni tahrirlash' : 'Yangi hudud qo&apos;shish'}
                          </Text>
                          <TextInput
                            value={areaName}
                            onChangeText={setAreaName}
                            placeholder="Hudud nomi (masalan: Uy atrofi)"
                            className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900"
                          />
                          <Text className="mb-3 text-[11px] font-semibold text-slate-500">
                            {selectedRegionName} • {selectedDistrictName} • {selectedMfyName}
                          </Text>
                          <View className="mb-3 gap-2">
                            <Pressable
                              onPress={() => setFormPicker('region')}
                              className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5"
                            >
                              <Text className="text-sm font-bold text-slate-800">{selectedRegionName}</Text>
                              <ChevronRight size={16} color="#94a3b8" />
                            </Pressable>
                            <Pressable
                              onPress={() => m.selectedRegion && setFormPicker('district')}
                              className={cn(
                                'flex-row items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5',
                                m.selectedRegion ? 'bg-slate-50' : 'bg-slate-100'
                              )}
                            >
                              <Text className="text-sm font-bold text-slate-800">{selectedDistrictName}</Text>
                              <ChevronRight size={16} color="#94a3b8" />
                            </Pressable>
                            <Pressable
                              onPress={() => m.selectedDistrict && setFormPicker('mfy')}
                              className={cn(
                                'flex-row items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5',
                                m.selectedDistrict ? 'bg-slate-50' : 'bg-slate-100'
                              )}
                            >
                              <Text className="text-sm font-bold text-slate-800">{selectedMfyName}</Text>
                              <ChevronRight size={16} color="#94a3b8" />
                            </Pressable>
                          </View>
                          <View className="flex-row gap-2">
                            <Pressable
                              disabled={!canSaveAddress || savingAddress}
                              onPress={async () => {
                                if (!m.selectedRegion || !m.selectedDistrict || !m.selectedMFY) return;
                                setSavingAddress(true);
                                try {
                                  const payload = {
                                    name: areaName.trim(),
                                    region_id: m.selectedRegion.id,
                                    district_id: m.selectedDistrict.id,
                                    mfy_id: m.selectedMFY.id,
                                  };
                                  if (editingAddressId) {
                                    await m.updateUserAddress(editingAddressId, payload);
                                  } else {
                                    await m.addUserAddress(payload);
                                  }
                                  setEditingAddressId(null);
                                  setAreaName('');
                                  setIsAddressFormOpen(false);
                                } finally {
                                  setSavingAddress(false);
                                }
                              }}
                              className={cn(
                                'rounded-xl px-4 py-2.5',
                                !canSaveAddress || savingAddress ? 'bg-slate-300' : 'bg-gray-900'
                              )}
                            >
                              <Text className="text-[11px] font-black uppercase tracking-wide text-white">
                                {savingAddress ? 'Saqlanmoqda...' : editingAddressId ? 'Yangilash' : 'Saqlash'}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setEditingAddressId(null);
                                setAreaName('');
                                setIsAddressFormOpen(false);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5"
                            >
                              <Text className="text-[11px] font-black uppercase tracking-wide text-slate-600">Bekor</Text>
                            </Pressable>
                          </View>
                        </MotiView>
                      </View>
                    </View>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isAddressFormOpen && formPicker !== null && (
                    <View className="absolute inset-0 z-30">
                      <Pressable className="absolute inset-0 bg-black/40" onPress={() => setFormPicker(null)} />
                      <View className="absolute inset-0 items-center justify-center px-5">
                        <MotiView
                          from={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-md border border-slate-200 bg-white shadow-2xl"
                          style={{
                            backgroundColor: '#ffffff',
                            width: Math.min(m.windowWidth - 92, m.isTabletUpWeb ? 460 : 360),
                            borderRadius: pickerModalRadius,
                            padding: pickerModalPadding,
                          }}
                        >
                          <Text className="mb-3 text-base font-black text-slate-900">
                            {formPicker === 'region' ? 'Viloyat tanlang' : formPicker === 'district' ? 'Tuman tanlang' : 'MFY tanlang'}
                          </Text>
                          <ScrollView className="max-h-80" contentContainerStyle={{ paddingBottom: 4 }}>
                            {(formPicker === 'region' ? m.regions : formPicker === 'district' ? m.districts : m.mfys).map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={async () => {
                                  if (formPicker === 'region') {
                                    await m.handleRegionSelect(item as any);
                                    setFormPicker('district');
                                  } else if (formPicker === 'district') {
                                    await m.handleDistrictSelect(item as any);
                                    setFormPicker('mfy');
                                  } else {
                                    m.handleMFYSelect(item as any);
                                    setFormPicker(null);
                                  }
                                }}
                                className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5"
                              >
                                <Text className="text-sm font-semibold text-slate-800">{item.name}</Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                          <Pressable
                            onPress={() => setFormPicker(null)}
                            className="mt-3 items-center rounded-xl border border-slate-200 bg-white py-2.5"
                          >
                            <Text className="text-[11px] font-black uppercase tracking-wide text-slate-600">Yopish</Text>
                          </Pressable>
                        </MotiView>
                      </View>
                    </View>
                  )}
                </AnimatePresence>
              </MotiView>
            </View>
          </View>
        )}
      </AnimatePresence>

      {/* Product */}
      <AnimatePresence>
        {m.selectedProduct && (
          <View className="absolute inset-0 z-[70]">
            {!productModalFullScreenWeb ? (
              <Pressable className="absolute inset-0 bg-black/60" onPress={() => m.setSelectedProduct(null)} />
            ) : null}
            <MotiView
              from={m.isTabletUpWeb ? { opacity: 0, scale: 0.95 } : { translateY: m.SCREEN_HEIGHT }}
              animate={m.isTabletUpWeb ? { opacity: 1, scale: 1 } : { translateY: 0 }}
              exit={m.isTabletUpWeb ? { opacity: 0, scale: 0.95 } : { translateY: m.SCREEN_HEIGHT }}
              transition={{ type: 'timing', duration: 140 }}
              className={cn(
                'absolute overflow-hidden bg-white',
                m.isTabletUpWeb && 'rounded-[40px] shadow-2xl',
                productModalFullScreenWeb && 'inset-0 rounded-none',
                !m.isTabletUpWeb && !productModalFullScreenWeb && 'bottom-0 left-0 right-0 h-[85%] rounded-t-[48px] shadow-2xl'
              )}
              style={
                m.isTabletUpWeb
                  ? {
                      width: m.productModalWidth,
                      maxHeight: Math.round(m.SCREEN_HEIGHT * 0.86),
                      height: Math.round(m.windowHeight * 0.86),
                      alignSelf: 'center',
                      top: Math.max(20, Math.round((m.windowHeight - Math.round(m.windowHeight * 0.86)) / 2)),
                    }
                  : productModalFullScreenWeb
                    ? {
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: m.windowHeight,
                        maxHeight: m.windowHeight,
                      }
                    : undefined
              }
            >
              {m.isTabletUpWeb ? (
                <View className="flex-1 flex-row">
                  <View className="relative w-[44%] bg-gray-50">
                    <Pressable className="h-full w-full" onPress={m.goNextImage}>
                      <Image
                        source={{ uri: m.selectedProduct.images[m.activeImageIndex] }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </Pressable>
                    {m.selectedProduct.images.length > 1 && (
                      <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-2">
                        {m.selectedProduct.images.map((_, i) => (
                          <View
                            key={i}
                            className={cn(
                              'h-1.5 rounded-full',
                              m.activeImageIndex === i ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'
                            )}
                          />
                        ))}
                      </View>
                    )}
                    {m.selectedProduct.images.length > 1 && (
                      <>
                        <Pressable
                          onPress={m.goPrevImage}
                          className="absolute left-3 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                        >
                          <ChevronLeft size={18} color="white" />
                        </Pressable>
                        <Pressable
                          onPress={m.goNextImage}
                          className="absolute right-3 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                        >
                          <ChevronRight size={18} color="white" />
                        </Pressable>
                      </>
                    )}
                  </View>
                  <View className="flex-1 bg-white">
                    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 170 }}>
                      <View className="mb-6 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Info size={14} color="#f97316" />
                          <Text className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                            Mahsulot haqida
                          </Text>
                        </View>
                        <View
                          className="flex-row items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1"
                          style={{ marginRight: 58 }}
                        >
                          <Package size={12} color="#16a34a" />
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                            {m.selectedProduct.quantity} ta mavjud
                          </Text>
                        </View>
                      </View>
                      <Text className="mb-4 text-3xl font-black leading-tight text-gray-900">
                        {m.selectedProduct.name}
                      </Text>
                      <Text className="mb-8 leading-relaxed text-gray-500">
                        {m.renderDescriptionDelta(m.selectedProduct.description)}
                      </Text>
                      <View className="mb-8 flex-row gap-4">
                        <View className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kod</Text>
                          <Text className="font-bold text-gray-900">#{m.selectedProduct.product_code}</Text>
                        </View>
                        <View className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Birlik
                          </Text>
                          <Text className="font-bold text-gray-900">
                            {m.selectedProduct.unit_size} {m.selectedProduct.unit}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                    <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-6">
                      <View className="mb-6 flex-row items-center justify-between">
                        <View>
                          <Text className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                            Narxi
                          </Text>
                          <View className="flex-row items-center gap-3">
                            <Text className="text-3xl font-black text-orange-500">
                              {m.selectedProduct.price.toLocaleString()}{' '}
                              <Text className="text-sm font-bold">so'm</Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                      <ProductDetailCartActionsNative
                        product={m.selectedProduct}
                        inCartQty={selectedDetailCartQty}
                        onAdd={() => m.addToCart(m.selectedProduct!)}
                        onDelta={(d) => m.updateQuantity(m.selectedProduct!.id, d)}
                      />
                    </View>
                  </View>
                  <Pressable
                    onPress={() => m.setSelectedProduct(null)}
                    className="absolute right-6 top-6 h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-xl"
                  >
                    <X size={24} color="#111827" />
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  className="flex-1 bg-white"
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: m.isSmallWeb ? 24 : 220 }}
                  showsVerticalScrollIndicator
                >
                  <View className={cn('relative bg-gray-50', m.isSmallWeb ? 'h-72' : 'aspect-square')}>
                    <Pressable className="h-full w-full" onPress={m.goNextImage}>
                      <Image
                        source={{ uri: m.selectedProduct.images[m.activeImageIndex] }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => m.setSelectedProduct(null)}
                      className="absolute right-6 top-6 h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-xl"
                    >
                      <X size={24} color="#111827" />
                    </Pressable>
                    {m.selectedProduct.images.length > 1 && (
                      <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-2">
                        {m.selectedProduct.images.map((_, i) => (
                          <View
                            key={i}
                            className={cn(
                              'h-1.5 rounded-full',
                              m.activeImageIndex === i ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'
                            )}
                          />
                        ))}
                      </View>
                    )}
                    {m.selectedProduct.images.length > 1 && (
                      <>
                        <Pressable
                          onPress={m.goPrevImage}
                          className="absolute left-3 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                        >
                          <ChevronLeft size={18} color="white" />
                        </Pressable>
                        <Pressable
                          onPress={m.goNextImage}
                          className="absolute right-3 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                        >
                          <ChevronRight size={18} color="white" />
                        </Pressable>
                      </>
                    )}
                  </View>
                  <View className="p-8 pb-10">
                    <View className="mb-6 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Info size={14} color="#f97316" />
                        <Text className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                          Mahsulot haqida
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1">
                        <Package size={12} color="#16a34a" />
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                          {m.selectedProduct.quantity} ta mavjud
                        </Text>
                      </View>
                    </View>
                    <Text className="mb-4 text-3xl font-black leading-tight text-gray-900">
                      {m.selectedProduct.name}
                    </Text>
                    <Text className="mb-8 leading-relaxed text-gray-500">
                      {m.renderDescriptionDelta(m.selectedProduct.description)}
                    </Text>
                    <View className="mb-8 flex-row gap-4">
                      <View className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Kod</Text>
                        <Text className="font-bold text-gray-900">#{m.selectedProduct.product_code}</Text>
                      </View>
                      <View className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          Birlik
                        </Text>
                        <Text className="font-bold text-gray-900">
                          {m.selectedProduct.unit_size} {m.selectedProduct.unit}
                        </Text>
                      </View>
                    </View>

                    {m.isSmallWeb && (
                      <View className="border-t border-gray-100 pt-2">
                        <View className="mb-6 flex-row items-center justify-between">
                          <View>
                            <Text className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                              Narxi
                            </Text>
                            <View className="flex-row items-center gap-3">
                              <Text className="text-3xl font-black text-orange-500">
                                {m.selectedProduct.price.toLocaleString()}{' '}
                                <Text className="text-sm font-bold">so'm</Text>
                              </Text>
                            </View>
                          </View>
                        </View>
                        <ProductDetailCartActionsNative
                          product={m.selectedProduct}
                          inCartQty={selectedDetailCartQty}
                          onAdd={() => m.addToCart(m.selectedProduct!)}
                          onDelta={(d) => m.updateQuantity(m.selectedProduct!.id, d)}
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}

              {!m.isTabletUpWeb && !m.isSmallWeb && (
                <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-6">
                  <View className="mb-6 flex-row items-center justify-between">
                    <View>
                      <Text className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Narxi</Text>
                      <View className="flex-row items-center gap-3">
                        <Text className="text-3xl font-black text-orange-500">
                          {m.selectedProduct.price.toLocaleString()}{' '}
                          <Text className="text-sm font-bold">so'm</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ProductDetailCartActionsNative
                    product={m.selectedProduct}
                    inCartQty={selectedDetailCartQty}
                    onAdd={() => m.addToCart(m.selectedProduct!)}
                    onDelta={(d) => m.updateQuantity(m.selectedProduct!.id, d)}
                  />
                </View>
              )}
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </>
  );
}
