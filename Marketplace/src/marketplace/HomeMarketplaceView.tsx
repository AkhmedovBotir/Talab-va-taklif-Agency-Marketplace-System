import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, RefreshControl, Image, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Search, Filter, ShoppingCart, MapPin, ChevronRight, Bell } from 'lucide-react-native';
import { cn } from '../lib/utils';
import { useMarketplace } from './MarketplaceContext';
import { api, hasMarketplaceSession, requestAuthLogin } from '../services/api';
import type { ContragentBanner, ContragentBrowseItem, ActivityType, PartnerRequestPayload } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  digitsOnly,
  normalizePartnerRequestPayload,
  sanitizePhoneInput,
  validatePartnerRequestPayload,
  PARTNER_FORM_PLACEHOLDER_COLOR,
  PARTNER_FORM_TEXT_INPUT_CLASS,
} from '../lib/partnerRequestForm';
import { contragentDeliversTo, deliverySelectionFromMarketplace } from '../lib/deliveryFilter';
import { PARTNER_REQUEST_SUCCESS_MSG, showUserMessage } from '../lib/userMessage';

const MOBILE_REFRESH_TINT = '#f97316';
const PARTNER_REQUEST_FLAG_KEY = 'marketplace_partner_request_sent_v1';

export function HomeMarketplaceView() {
  const m = useMarketplace();
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState<Array<ContragentBanner & { activityType?: string }>>([]);
  const bannerScrollRef = useRef<ScrollView | null>(null);
  const [hasPartnerRequest, setHasPartnerRequest] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [partnerDistricts, setPartnerDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [partnerMfys, setPartnerMfys] = useState<Array<{ id: number; name: string }>>([]);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerPicker, setPartnerPicker] = useState<'activity' | 'region' | 'district' | 'mfy' | null>(null);
  const [partnerForm, setPartnerForm] = useState<PartnerRequestPayload>({
    company_name: '',
    inn: '',
    mfo: '',
    account_number: '',
    activity_type_id: 0,
    region_id: 0,
    district_id: 0,
    mfy_id: 0,
    phone: '+998',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await m.refreshHomeScreen();
    } finally {
      setRefreshing(false);
    }
  }, [m.refreshHomeScreen]);

  const deliverySel = useMemo(() => deliverySelectionFromMarketplace(m), [m]);

  useEffect(() => {
    const loadBanners = async () => {
      const [bannerRows, contragentsRes] = await Promise.all([
        api.contragents.banners(),
        api.contragents.list({ limit: 100, include: 'categories' }),
      ]);
      const details = new Map<number, ContragentBrowseItem>(
        contragentsRes.items.map((row) => [Number(row.id), row])
      );
      const filtered = bannerRows
        .map((row) => {
          const c = details.get(Number(row.contragent_id));
          const categoryName = c?.category_branches?.[0]?.category?.name;
          const activityType = c?.activity_type_name || categoryName;
          return { ...row, activityType, detail: c };
        })
        .filter((row) => row.detail && contragentDeliversTo(row.detail, deliverySel))
        .map(({ detail, ...rest }) => rest);
      setBanners(filtered);
      setActiveBanner(0);
    };
    void loadBanners();
  }, [deliverySel]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({ x: next * (m.windowWidth - 32), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [banners.length, m.windowWidth]);

  useEffect(() => {
    void (async () => {
      const [types, requests] = await Promise.all([api.activityTypes.list(), api.partnerRequests.list()]);
      setActivityTypes(types);
      if (types[0]) {
        setPartnerForm((prev) => ({ ...prev, activity_type_id: prev.activity_type_id || types[0].id }));
      }
      const localFlag = await AsyncStorage.getItem(PARTNER_REQUEST_FLAG_KEY);
      setHasPartnerRequest(localFlag === '1' || requests.length > 0);
    })();
  }, []);

  const openPartnerModal = async () => {
    const regionId = m.selectedRegion?.id ?? m.regions[0]?.id ?? 0;
    const districtId = m.selectedDistrict?.id ?? 0;
    const mfyId = m.selectedMFY?.id ?? 0;
    const ds = regionId ? await api.regions.getDistricts(regionId) : [];
    const ms = districtId ? await api.regions.getMFYs(districtId) : [];
    setPartnerDistricts(ds);
    setPartnerMfys(ms);
    setPartnerForm((prev) => ({
      ...prev,
      region_id: regionId,
      district_id: districtId,
      mfy_id: mfyId,
      activity_type_id: prev.activity_type_id || activityTypes[0]?.id || 0,
    }));
    setIsPartnerModalOpen(true);
  };

  const submitPartnerRequest = async () => {
    const normalized = normalizePartnerRequestPayload(partnerForm);
    const validationError = validatePartnerRequestPayload(normalized);
    if (validationError) {
      showUserMessage({ type: 'error', message: validationError });
      return;
    }
    setPartnerSubmitting(true);
    try {
      await api.partnerRequests.create(normalized);
      await AsyncStorage.setItem(PARTNER_REQUEST_FLAG_KEY, '1');
      setHasPartnerRequest(true);
      setIsPartnerModalOpen(false);
      showUserMessage({ type: 'success', message: PARTNER_REQUEST_SUCCESS_MSG });
    } catch (e) {
      showUserMessage({
        type: 'error',
        message: e instanceof Error ? e.message : "So'rov yuborilmadi",
      });
    } finally {
      setPartnerSubmitting(false);
    }
  };

  const partnerPickerOptions =
    partnerPicker === 'activity'
      ? activityTypes.map((it) => ({ value: it.id, label: it.name }))
      : partnerPicker === 'region'
        ? m.regions.map((it) => ({ value: it.id, label: it.name }))
        : partnerPicker === 'district'
          ? partnerDistricts.map((it) => ({ value: it.id, label: it.name }))
          : partnerPicker === 'mfy'
            ? partnerMfys.map((it) => ({ value: it.id, label: it.name }))
            : [];

  const compactWebHeader = m.isSmallWeb;

  return (
    <View className={cn('flex-1', Platform.OS === 'web' ? 'bg-white' : 'bg-gray-50')}>
      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MOBILE_REFRESH_TINT}
              colors={[MOBILE_REFRESH_TINT]}
            />
          ) : undefined
        }
      >
        <View
          className={cn(
            'border-b border-gray-100 bg-white shadow-sm',
            compactWebHeader ? 'px-3 pb-3 pt-3' : 'px-4 pb-6 pt-12'
          )}
        >
          <View
            className={cn(
              'w-full',
              compactWebHeader ? 'gap-2' : 'gap-4',
              m.isTabletUpWeb ? 'flex-row items-center' : 'flex-col'
            )}
            style={{
              maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
              width: '100%',
              alignSelf: m.isTabletUpWeb ? 'center' : undefined,
            }}
          >
            <View
              className={cn(
                'flex-row items-center',
                compactWebHeader ? 'gap-2' : 'gap-3',
                m.isTabletUpWeb ? 'max-w-[280px] flex-none shrink-0' : 'w-full'
              )}
            >
              <Pressable
                onPress={() => {
                  m.setIsRegionSelectorOpen(true);
                  m.setRegionSelectorStep('region');
                }}
                className={cn(
                  'flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50',
                  m.isTabletUpWeb
                    ? 'h-auto min-h-[64px] w-full rounded-xl px-3 py-2.5'
                    : compactWebHeader
                      ? 'min-h-[52px] flex-1 px-3 py-2'
                      : 'min-h-[72px] flex-1 px-4 py-3 sm:px-5'
                )}
              >
                <View
                  className={cn(
                    'min-w-0 flex-1 flex-row items-start',
                    m.isTabletUpWeb ? 'gap-2' : compactWebHeader ? 'gap-2' : 'gap-3'
                  )}
                >
                  <View
                    className={cn(
                      'flex-shrink-0 items-center justify-center rounded-xl bg-orange-100',
                      m.isTabletUpWeb
                        ? 'mt-0 h-9 w-9 rounded-lg'
                        : compactWebHeader
                          ? 'mt-0 h-8 w-8 rounded-lg'
                          : 'mt-0.5 h-10 w-10'
                    )}
                  >
                    <MapPin size={m.isTabletUpWeb ? 18 : compactWebHeader ? 16 : 20} color="#f97316" />
                  </View>
                  <View className="min-w-0 flex-1">
                    {m.hasCompleteDeliveryLocation ? (
                      <View className="min-w-0 flex-col gap-0.5">
                        <View className="min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <Text
                            className="text-[10px] font-black uppercase tracking-widest text-orange-500"
                            numberOfLines={2}
                          >
                            {m.selectedRegion.name}
                          </Text>
                          {m.userAddresses.some((a) => a.is_default && a.mfy_id === m.selectedMFY?.id) ? (
                            <View className="flex-shrink-0 rounded bg-orange-500 px-1">
                              <Text className="text-[7px] font-black uppercase text-white">Asosiy</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          className={cn(
                            'font-black leading-snug text-gray-900',
                            m.isTabletUpWeb ? 'text-[13px]' : compactWebHeader ? 'text-xs' : 'text-sm'
                          )}
                          numberOfLines={compactWebHeader ? 1 : 2}
                        >
                          {m.selectedDistrict?.name || 'Tuman tanlanmagan'}
                        </Text>
                        <Text
                          className={cn(
                            'font-bold leading-snug text-gray-500',
                            m.isTabletUpWeb ? 'text-[11px]' : compactWebHeader ? 'text-[10px]' : 'text-xs'
                          )}
                          numberOfLines={compactWebHeader ? 1 : 2}
                        >
                          {m.selectedMFY?.name || 'MFY tanlanmagan'}
                        </Text>
                      </View>
                    ) : (
                      <Text className={cn('font-black text-gray-400', compactWebHeader && 'text-sm')}>
                        Hududni tanlang
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight
                  size={compactWebHeader ? 18 : 20}
                  color="#9ca3af"
                  style={{ marginLeft: compactWebHeader ? 4 : 8, flexShrink: 0 }}
                />
              </Pressable>

              {!m.isTabletUpWeb ? (
                <Pressable
                  onPress={async () => {
                    if (!(await hasMarketplaceSession())) {
                      requestAuthLogin();
                      return;
                    }
                    m.setNotificationsInboxOpen(true);
                  }}
                  className={cn(
                    'relative flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50',
                    compactWebHeader ? 'h-10 w-10' : 'h-12 w-12'
                  )}
                >
                  <Bell size={compactWebHeader ? 18 : 20} color="#f97316" />
                  {m.notificationsCount > 0 && (
                    <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                      <Text className="text-[10px] font-bold text-white">{m.notificationsCount}</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>

            <View
              className={cn(
                'flex-row items-center',
                compactWebHeader ? 'gap-2' : 'gap-3',
                m.isTabletUpWeb ? 'min-w-0 flex-1 flex-nowrap' : 'w-full flex-wrap'
              )}
            >
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { focus: '1' } })}
                className={cn(
                  'relative min-w-0 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 py-0 pr-3',
                  compactWebHeader ? 'h-11 flex-1 pl-10' : 'h-[52px] flex-1 pl-11',
                  m.isTabletUpWeb && 'min-w-[12rem]'
                )}
              >
                <View
                  className={cn(
                    'pointer-events-none absolute top-1/2 z-10 -mt-2.5',
                    compactWebHeader ? 'left-3' : 'left-4'
                  )}
                >
                  <Search size={compactWebHeader ? 16 : 18} color="#9ca3af" />
                </View>
                <Text
                  className={cn('font-bold text-gray-400', compactWebHeader ? 'text-xs' : 'text-sm')}
                  numberOfLines={1}
                >
                  Mahsulot qidirish...
                </Text>
              </Pressable>
              {m.isTabletUpWeb ? (
                <Pressable
                  onPress={async () => {
                    if (!(await hasMarketplaceSession())) {
                      requestAuthLogin();
                      return;
                    }
                    m.setNotificationsInboxOpen(true);
                  }}
                  className="relative h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50"
                >
                  <Bell size={20} color="#f97316" />
                  {m.notificationsCount > 0 && (
                    <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                      <Text className="text-[10px] font-bold text-white">{m.notificationsCount}</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { openFilter: '1' } })}
                className={cn(
                  'flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm',
                  compactWebHeader ? 'h-11 w-11' : 'h-[52px] w-[52px]'
                )}
              >
                <Filter size={compactWebHeader ? 18 : 20} color="#4b5563" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/cart')}
                className={cn(
                  'relative flex-shrink-0 items-center justify-center self-center rounded-2xl bg-gray-900',
                  compactWebHeader ? 'h-11 w-11' : 'h-[52px] w-[52px]'
                )}
              >
                <ShoppingCart size={compactWebHeader ? 18 : 20} color="white" />
                {m.cartCount > 0 && (
                  <View
                    className={cn(
                      'absolute -right-1 -top-1 items-center justify-center rounded-full border-2 border-white bg-orange-500',
                      compactWebHeader ? 'h-5 w-5' : 'h-6 w-6'
                    )}
                  >
                    <Text className={cn('font-bold text-white', compactWebHeader ? 'text-[9px]' : 'text-[11px]')}>
                      {m.cartCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        <View
          className="flex-row flex-wrap p-4"
          style={{
            columnGap: m.isSmallWeb ? 0 : m.cardGap,
            rowGap: 16,
            maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
            justifyContent: 'space-around',
          }}
        >
          {banners.length > 0 ? (
            <View className="mb-1 w-full">
              <ScrollView
                ref={(el) => {
                  bannerScrollRef.current = el;
                }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (m.windowWidth - 32));
                  if (idx >= 0 && idx < banners.length) setActiveBanner(idx);
                }}
              >
                {banners.map((b) => (
                  <View
                    key={b.id}
                    className="mr-3 flex-row items-center rounded-3xl border border-orange-100 bg-orange-50 px-4 py-4"
                    style={{ width: m.windowWidth - 32 }}
                  >
                    <View className="h-16 w-16 overflow-hidden rounded-2xl border border-orange-100 bg-white">
                      {b.contragent_logo ? (
                        <Image source={{ uri: b.contragent_logo }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <Text className="text-xl font-black text-orange-500">{b.contragent_name.slice(0, 1)}</Text>
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-black text-gray-900" numberOfLines={2}>{b.contragent_name}</Text>
                      <Text className="mt-1 text-xs font-bold uppercase tracking-wider text-orange-600" numberOfLines={1}>
                        {b.activityType || 'Faol kontragent'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/search',
                          params: { contragentId: String(b.contragent_id) },
                        })
                      }
                      className="ml-2 rounded-xl bg-orange-500 px-3 py-2"
                    >
                      <Text className="text-[10px] font-black uppercase tracking-wider text-white">O&apos;tish</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              {banners.length > 1 ? (
                <View className="mt-3 flex-row items-center justify-center">
                  {banners.map((b, idx) => (
                    <View
                      key={`dot-${b.id}`}
                      className={cn('mx-1 h-2 rounded-full', idx === activeBanner ? 'w-5 bg-orange-500' : 'w-2 bg-orange-200')}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View className="w-full gap-4">
            <View className="rounded-3xl border border-gray-200 bg-white p-5">
              <Text className="text-[11px] font-black uppercase tracking-widest text-orange-500">Bozorda</Text>
              <Text className="mt-2 text-xl font-black text-gray-900">Yirik kontragent mahsulotlari</Text>
              <Text className="mt-2 text-sm font-semibold text-gray-500">
                Bozor bo&apos;limidagi mahsulotlarni ko&apos;ring va filtrlab xarid qiling.
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { marketTab: 'bozor' } })}
                className="mt-5 self-start rounded-2xl bg-gray-900 px-5 py-3"
              >
                <Text className="text-xs font-black uppercase tracking-wider text-white">O&apos;tish</Text>
              </Pressable>
            </View>
            <View className="relative rounded-3xl border border-orange-200 bg-orange-50/60 p-5">
              <View className="absolute right-4 top-4 rounded-md bg-orange-500 px-2 py-1">
                <Text className="text-[9px] font-black uppercase tracking-wider text-white">Tezkor</Text>
              </View>
              <Text className="text-[11px] font-black uppercase tracking-widest text-orange-600">Maxallada</Text>
              <Text className="mt-2 text-xl font-black text-gray-900">Yaqin do&apos;kon mahsulotlari</Text>
              <Text className="mt-2 text-sm font-semibold text-gray-600">
                Hududingizga mos do&apos;konlardan tezkor mahsulotlarni toping.
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { marketTab: 'mahalla' } })}
                className="mt-5 self-start rounded-2xl bg-orange-500 px-5 py-3"
              >
                <Text className="text-xs font-black uppercase tracking-wider text-white">O&apos;tish</Text>
              </Pressable>
            </View>
            {!hasPartnerRequest ? (
              <View className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                <Text className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Hamkorlik</Text>
                <Text className="mt-2 text-xl font-black text-gray-900">Hamkor bo&apos;lish uchun so&apos;rov</Text>
                <Text className="mt-2 text-sm font-semibold text-gray-600">
                  Kompaniya ma&apos;lumotlarini yuboring va hamkorlik jarayonini boshlang.
                </Text>
                <Pressable onPress={() => void openPartnerModal()} className="mt-5 self-start rounded-2xl bg-emerald-600 px-5 py-3">
                  <Text className="text-xs font-black uppercase tracking-wider text-white">So&apos;rov yuborish</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <Modal visible={isPartnerModalOpen} transparent animationType="slide" onRequestClose={() => setIsPartnerModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <Pressable className="absolute inset-0" onPress={() => setIsPartnerModalOpen(false)} />
          <View className="max-h-[90%] rounded-t-3xl bg-white px-4 pb-6 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-3 text-lg font-black text-gray-900">Hamkorlik so&apos;rovi</Text>
            <ScrollView>
              <View className="gap-2">
                <TextInput value={partnerForm.company_name} onChangeText={(v) => setPartnerForm((p) => ({ ...p, company_name: v }))} placeholder="Kompaniya nomi" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.inn} onChangeText={(v) => setPartnerForm((p) => ({ ...p, inn: digitsOnly(v, 9) }))} keyboardType="number-pad" maxLength={9} placeholder="INN (9 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.mfo} onChangeText={(v) => setPartnerForm((p) => ({ ...p, mfo: digitsOnly(v, 5) }))} keyboardType="number-pad" maxLength={5} placeholder="MFO (5 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.account_number} onChangeText={(v) => setPartnerForm((p) => ({ ...p, account_number: digitsOnly(v, 20) }))} keyboardType="number-pad" maxLength={20} placeholder="Hisob raqam (20 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <Text className="mt-2 text-xs font-black uppercase tracking-widest text-gray-500">Faoliyat turi</Text>
                <Pressable onPress={() => setPartnerPicker('activity')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">
                    {activityTypes.find((it) => it.id === partnerForm.activity_type_id)?.name || 'Tanlang'}
                  </Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Text className="mt-2 text-xs font-black uppercase tracking-widest text-gray-500">Viloyat / tuman / MFY</Text>
                <Pressable onPress={() => setPartnerPicker('region')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">
                    {m.regions.find((it) => it.id === partnerForm.region_id)?.name || 'Viloyatni tanlang'}
                  </Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => partnerForm.region_id && setPartnerPicker('district')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">
                    {partnerDistricts.find((it) => it.id === partnerForm.district_id)?.name || 'Tumanni tanlang'}
                  </Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => partnerForm.district_id && setPartnerPicker('mfy')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">
                    {partnerMfys.find((it) => it.id === partnerForm.mfy_id)?.name || 'MFY ni tanlang'}
                  </Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <TextInput value={partnerForm.phone} onChangeText={(v) => setPartnerForm((p) => ({ ...p, phone: sanitizePhoneInput(v) }))} keyboardType="phone-pad" maxLength={13} placeholder="+998901234567" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
              </View>
            </ScrollView>
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={() => setIsPartnerModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-center font-bold text-slate-600">Bekor</Text>
              </Pressable>
              <Pressable onPress={() => void submitPartnerRequest()} disabled={partnerSubmitting} className="flex-1 rounded-xl bg-emerald-600 py-3 disabled:opacity-60">
                <Text className="text-center font-bold text-white">{partnerSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={partnerPicker !== null} transparent animationType="slide" onRequestClose={() => setPartnerPicker(null)}>
        <View className="flex-1 justify-end bg-black/35">
          <Pressable className="absolute inset-0" onPress={() => setPartnerPicker(null)} />
          <View className="max-h-[65%] rounded-t-3xl bg-white px-4 pb-6 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-2 text-base font-black text-slate-900">
              {partnerPicker === 'activity' ? 'Faoliyat turi' : partnerPicker === 'region' ? 'Viloyat' : partnerPicker === 'district' ? 'Tuman' : 'MFY'}
            </Text>
            <ScrollView>
              {partnerPickerOptions.map((opt) => (
                <Pressable
                  key={`${partnerPicker}-${opt.value}`}
                  onPress={async () => {
                    if (partnerPicker === 'activity') {
                      setPartnerForm((p) => ({ ...p, activity_type_id: opt.value }));
                    } else if (partnerPicker === 'region') {
                      const ds = await api.regions.getDistricts(opt.value);
                      setPartnerDistricts(ds);
                      setPartnerForm((p) => ({
                        ...p,
                        region_id: opt.value,
                        district_id: ds[0]?.id ?? 0,
                        mfy_id: 0,
                      }));
                    } else if (partnerPicker === 'district') {
                      const ms = await api.regions.getMFYs(opt.value);
                      setPartnerMfys(ms);
                      setPartnerForm((p) => ({ ...p, district_id: opt.value, mfy_id: ms[0]?.id ?? 0 }));
                    } else {
                      setPartnerForm((p) => ({ ...p, mfy_id: opt.value }));
                    }
                    setPartnerPicker(null);
                  }}
                  className="border-b border-slate-100 py-3.5"
                >
                  <Text className="font-semibold text-slate-800">{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
