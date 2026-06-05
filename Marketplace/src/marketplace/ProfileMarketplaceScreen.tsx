import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import {
  User,
  ChevronRight,
  LogOut,
  Shield,
  CreditCard,
  Bell,
  Phone,
  Calendar,
  MapPin,
  X,
  Package,
  BriefcaseBusiness,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api, hasMarketplaceSession } from '../services/api';
import { User as AppUser, Region, District, MFY, ActivityType, PartnerRequest, PartnerRequestPayload } from '../types';
import { useMarketplace } from './MarketplaceContext';
import {
  digitsOnly,
  normalizePartnerRequestPayload,
  sanitizePhoneInput,
  validatePartnerRequestPayload,
  PARTNER_FORM_PLACEHOLDER_COLOR,
  PARTNER_FORM_TEXT_INPUT_CLASS,
} from '../lib/partnerRequestForm';
import { PARTNER_REQUEST_SUCCESS_MSG, showUserMessage } from '../lib/userMessage';
import { ProfileAvatarPicker } from '../components/ProfileAvatarPicker';
import { useTabBarLayout } from '../lib/tabBarLayout';
import {
  pickAvatarFileOnWeb,
  prepareAvatarFromFile,
  prepareAvatarFromUri,
  prepareAvatarFromPickerBase64,
  normalizeAvatar,
} from '../lib/profileAvatarImage';

const MOBILE_REFRESH_TINT = '#f97316';

type SelectorType = 'region' | 'district' | 'mfy' | null;

function ProfileMenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="w-full flex-row items-center justify-between rounded-2xl bg-transparent p-4">
      <View className="flex-row items-center gap-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{icon}</View>
        <Text className="font-bold text-slate-700">{label}</Text>
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </Pressable>
  );
}

export function ProfileMarketplaceScreen() {
  const { onLogout, setNotificationsInboxOpen, refreshNotificationsUnread } = useMarketplace();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [avatar, setAvatar] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selector, setSelector] = useState<SelectorType>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerPicker, setPartnerPicker] = useState<'activity' | 'region' | 'district' | 'mfy' | null>(null);
  const [partnerDistricts, setPartnerDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [partnerMfys, setPartnerMfys] = useState<Array<{ id: number; name: string }>>([]);
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
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'erkak' as 'erkak' | 'ayol',
    birth_date: '',
    region_id: 0,
    district_id: 0,
    mfy_id: 0,
  });
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const loadProfileData = useCallback(async (clearOnError: boolean) => {
    setProfileError(null);
    try {
      const profile = await api.profile.get();
      setUser(profile);
      const [regionList, districtList, mfyList] = await Promise.all([
        api.regions.getRegions(),
        api.regions.getDistricts(profile.region_id),
        api.regions.getMFYs(profile.district_id),
      ]);
      setRegions(regionList);
      setDistricts(districtList);
      setMfys(mfyList);
      void api.profile.getAvatar().then((avatarRes) => {
        setAvatar(avatarRes?.has_avatar ? normalizeAvatar(avatarRes.avatar) : '');
      }).catch(() => {});
      void api.partnerRequests.list().then((requests) => {
        setPartnerRequests(requests);
      }).catch(() => {});
      void api.activityTypes.list().then((types) => {
        setActivityTypes(types);
        if (types[0]) {
          setPartnerForm((prev) => ({ ...prev, activity_type_id: prev.activity_type_id || types[0].id }));
        }
      }).catch(() => {});
    } catch {
      if (clearOnError) setUser(null);
      setProfileError("Profil ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      if (!(await hasMarketplaceSession())) {
        setLoadingProfile(false);
        return;
      }
      await loadProfileData(true);
    })();
  }, [loadProfileData]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await loadProfileData(false);
    } finally {
      setPullRefreshing(false);
    }
  }, [loadProfileData]);

  if (loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-center text-sm font-bold text-gray-600">{profileError || "Profil ochilmadi"}</Text>
        <Pressable
          onPress={() => {
            setLoadingProfile(true);
            void loadProfileData(true);
          }}
          className="mt-4 rounded-xl bg-gray-900 px-5 py-3"
        >
          <Text className="font-black text-white">Qayta urinish</Text>
        </Pressable>
      </View>
    );
  }

  const regionName = regions.find((r) => r.id === user.region_id)?.name || `Viloyat #${user.region_id}`;
  const districtName = districts.find((d) => d.id === user.district_id)?.name || `Tuman #${user.district_id}`;
  const mfyName = mfys.find((m) => m.id === user.mfy_id)?.name || `MFY #${user.mfy_id}`;
  const birthDate = formatBirthDate(user.birth_date);
  const genderLabel = user.gender === 'erkak' ? 'Erkak' : 'Ayol';

  const uploadPreparedAvatar = async (payloadAvatar: string) => {
    const res = await api.profile.updateAvatar({ avatar: payloadAvatar });
    setAvatar(normalizeAvatar(res.avatar || payloadAvatar));
    showUserMessage({ type: 'success', message: 'Profil rasmi yangilandi' });
  };

  const onPickAvatar = async () => {
    if (Platform.OS === 'web') {
      pickAvatarFileOnWeb((file) => {
        void (async () => {
          setAvatarBusy(true);
          try {
            const prepared = await prepareAvatarFromFile(file);
            await uploadPreparedAvatar(prepared);
          } catch (e) {
            showUserMessage({
              type: 'error',
              message: e instanceof Error ? e.message : 'Rasm yuklanmadi',
            });
          } finally {
            setAvatarBusy(false);
          }
        })();
      });
      return;
    }

    setAvatarBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showUserMessage({ type: 'error', message: 'Galereyaga ruxsat berilmadi' });
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const prepared = asset.uri
        ? await prepareAvatarFromUri(asset.uri)
        : asset.base64
          ? await prepareAvatarFromPickerBase64(asset.base64, asset.mimeType || 'image/jpeg')
          : null;
      if (!prepared) throw new Error('Rasm tanlanmadi');
      await uploadPreparedAvatar(prepared);
    } catch (e) {
      showUserMessage({
        type: 'error',
        message: e instanceof Error ? e.message : 'Rasm yuklanmadi',
      });
    } finally {
      setAvatarBusy(false);
    }
  };

  const onDeleteAvatar = async () => {
    setAvatarBusy(true);
    try {
      await api.profile.deleteAvatar();
      setAvatar('');
      showUserMessage({ type: 'success', message: 'Profil rasmi o‘chirildi' });
    } catch (e) {
      showUserMessage({
        type: 'error',
        message: e instanceof Error ? e.message : 'Rasm o‘chirilmadi',
      });
    } finally {
      setAvatarBusy(false);
    }
  };

  const openEdit = async () => {
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      gender: user.gender || 'erkak',
      birth_date: user.birth_date || '',
      region_id: user.region_id || 0,
      district_id: user.district_id || 0,
      mfy_id: user.mfy_id || 0,
    });
    if (!regions.length) {
      const regionList = await api.regions.getRegions();
      setRegions(regionList);
    }
    const [districtList, mfyList] = await Promise.all([
      api.regions.getDistricts(user.region_id),
      api.regions.getMFYs(user.district_id),
    ]);
    setDistricts(districtList);
    setMfys(mfyList);
    setIsEditOpen(true);
  };

  const onSelectRegion = async (regionId: number) => {
    setEditForm((p) => ({ ...p, region_id: regionId, district_id: 0, mfy_id: 0 }));
    const ds = await api.regions.getDistricts(regionId);
    setDistricts(ds);
    setMfys([]);
    setSelector('district');
  };

  const onSelectDistrict = async (districtId: number) => {
    setEditForm((p) => ({ ...p, district_id: districtId, mfy_id: 0 }));
    const ms = await api.regions.getMFYs(districtId);
    setMfys(ms);
    setSelector('mfy');
  };

  const onSaveProfile = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) return;
    if (!editForm.birth_date || !editForm.region_id || !editForm.district_id || !editForm.mfy_id) return;
    setIsSavingProfile(true);
    try {
      const updated = await api.profile.update({
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        gender: editForm.gender,
        birth_date: editForm.birth_date,
        region_id: editForm.region_id,
        district_id: editForm.district_id,
        mfy_id: editForm.mfy_id,
      });
      setUser(updated);
      const [districtList, mfyList] = await Promise.all([
        api.regions.getDistricts(updated.region_id),
        api.regions.getMFYs(updated.district_id),
      ]);
      setDistricts(districtList);
      setMfys(mfyList);
      setIsEditOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPartnerModal = async () => {
    const regionId = user.region_id || regions[0]?.id || 0;
    const districtId = user.district_id || 0;
    const mfyId = user.mfy_id || 0;
    const ds = regionId ? await api.regions.getDistricts(regionId) : [];
    const ms = districtId ? await api.regions.getMFYs(districtId) : [];
    setPartnerDistricts(ds);
    setPartnerMfys(ms);
    setPartnerForm((prev) => ({
      ...prev,
      region_id: regionId,
      district_id: districtId,
      mfy_id: mfyId,
      phone: prev.phone || user.phone || '+998',
      activity_type_id: prev.activity_type_id || activityTypes[0]?.id || 0,
    }));
    setPartnerModalOpen(true);
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
      const requests = await api.partnerRequests.list();
      setPartnerRequests(requests);
      setPartnerModalOpen(false);
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
        ? regions.map((it) => ({ value: it.id, label: it.name }))
        : partnerPicker === 'district'
          ? partnerDistricts.map((it) => ({ value: it.id, label: it.name }))
          : partnerPicker === 'mfy'
            ? partnerMfys.map((it) => ({ value: it.id, label: it.name }))
            : [];

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerStyle={{
        paddingBottom: tabBarClearance + 20,
        paddingHorizontal: 16,
        paddingTop: 30,
        alignItems: 'center',
      }}
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={onPullRefresh}
          tintColor={MOBILE_REFRESH_TINT}
          colors={[MOBILE_REFRESH_TINT]}
        />
      }
    >
      <View className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/90 shadow-lg shadow-slate-300/30 md:rounded-[32px]">
        <View className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50 px-6 pt-12 pb-9 md:px-8 md:pt-8 md:pb-6">
          <View className="pointer-events-none absolute inset-0 overflow-hidden" pointerEvents="none">
            <View
              className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-100 opacity-35 md:h-44 md:w-44"
              style={{ transform: [{ scale: 1.2 }] }}
            />
            <View className="absolute -left-20 top-1/4 h-44 w-44 rounded-full bg-[#FEF9F3] opacity-50 md:-left-16 md:h-40 md:w-40" />
            <View
              className="absolute bottom-0 right-1/4 h-36 w-36 rounded-full bg-amber-100 opacity-40 md:right-1/3"
              style={{ transform: [{ translateY: 16 }] }}
            />
            <View className="absolute left-1/4 top-6 h-28 w-28 -translate-x-1/2 rounded-full bg-white opacity-60 md:top-4 md:h-24 md:w-24" />
            <View className="absolute -bottom-6 right-0 h-32 w-32 rounded-full bg-orange-200 opacity-30 md:h-28 md:w-28" />
            <View className="absolute right-1/3 top-12 h-24 w-24 rounded-full bg-[#FEF9F3] opacity-0 md:opacity-[0.38]" />
          </View>
          <View className="relative z-10 items-center">
            <ProfileAvatarPicker
              avatar={avatar}
              busy={avatarBusy}
              onPick={() => void onPickAvatar()}
              onDelete={() => void onDeleteAvatar()}
            />
            <Text className="text-center text-2xl font-bold text-gray-900 md:text-xl">
              {user.first_name} {user.last_name}
            </Text>
            <Text className="mt-1 text-center text-base font-medium text-slate-500 md:text-sm">{user.phone}</Text>
          </View>
        </View>

        <View className="flex flex-col gap-5 bg-slate-50/90 p-3 md:gap-3">
          <View className="rounded-[24px] border border-slate-200/90 bg-white p-3 shadow-sm my-3">
            <ProfileInfoItem icon={<Phone size={16} color="#3b82f6" />} label="Telefon" value={user.phone} />
            <ProfileInfoItem icon={<Calendar size={16} color="#f97316" />} label="Tug'ilgan sana" value={birthDate} />
            <ProfileInfoItem icon={<User size={16} color="#8b5cf6" />} label="Jins" value={genderLabel} />
            <ProfileInfoItem
              icon={<MapPin size={16} color="#22c55e" />}
              label="Joylashuv"
              value={`${regionName}, ${districtName}, ${mfyName}`}
              isLast
            />
          </View>
          <View className="rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm">
            <ProfileMenuItem icon={<User size={20} color="#3b82f6" />} label="Shaxsiy ma'lumotlar" onPress={openEdit} />
            <ProfileMenuItem
              icon={<Package size={20} color="#059669" />}
              label="Buyurtmalarim"
              onPress={() => router.push('/orders')}
            />
            <ProfileMenuItem
              icon={<BriefcaseBusiness size={20} color="#047857" />}
              label="Hamkorlik so'rovlari"
              onPress={() => router.push('/partner-requests')}
            />
            <ProfileMenuItem
              icon={<Bell size={20} color="#f97316" />}
              label="Bildirishnomalar"
              onPress={() => setNotificationsInboxOpen(true)}
            />
          </View>
          {/* <View className="my-3 rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm">
            <ProfileMenuItem icon={<HelpCircle size={20} color="#9ca3af" />} label="Yordam markazi" />
            <ProfileMenuItem icon={<Settings size={20} color="#9ca3af" />} label="Sozlamalar" />
          </View> */}
          <Pressable
            onPress={() => {
              void Promise.resolve(onLogout()).then(() => refreshNotificationsUnread());
            }}
            className="w-full flex-row items-center justify-center gap-2 rounded-[24px] border border-rose-200 bg-rose-100/60 py-4"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="font-bold text-red-500">Chiqish</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={isEditOpen} transparent animationType="fade" onRequestClose={() => setIsEditOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/45 px-4">
          <View className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-black text-slate-900">Shaxsiy ma&apos;lumotlarni tahrirlash</Text>
              <Pressable onPress={() => setIsEditOpen(false)} className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X size={16} color="#64748b" />
              </Pressable>
            </View>
            <View className="gap-2">
              <FieldLabel label="Ism">
                <TextInput
                  value={editForm.first_name}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, first_name: v }))}
                  placeholder="Ism"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800"
                />
              </FieldLabel>
              <FieldLabel label="Familiya">
                <TextInput
                  value={editForm.last_name}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, last_name: v }))}
                  placeholder="Familiya"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800"
                />
              </FieldLabel>
              <FieldLabel label="Tug'ilgan sana">
                <TextInput
                  value={editForm.birth_date}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, birth_date: v }))}
                  placeholder="YYYY-MM-DD"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800"
                />
              </FieldLabel>
              <FieldLabel label="Jins">
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setEditForm((p) => ({ ...p, gender: 'erkak' }))}
                  className={editForm.gender === 'erkak' ? 'flex-1 items-center rounded-xl border border-orange-300 bg-orange-50 py-3' : 'flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 py-3'}
                >
                  <Text className={editForm.gender === 'erkak' ? 'font-bold text-orange-600' : 'font-bold text-slate-500'}>Erkak</Text>
                </Pressable>
                <Pressable
                  onPress={() => setEditForm((p) => ({ ...p, gender: 'ayol' }))}
                  className={editForm.gender === 'ayol' ? 'flex-1 items-center rounded-xl border border-orange-300 bg-orange-50 py-3' : 'flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 py-3'}
                >
                  <Text className={editForm.gender === 'ayol' ? 'font-bold text-orange-600' : 'font-bold text-slate-500'}>Ayol</Text>
                </Pressable>
              </View>
              </FieldLabel>
              <FieldLabel label="Viloyat">
                <Pressable onPress={() => setSelector('region')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{regions.find((r) => r.id === editForm.region_id)?.name || 'Viloyatni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
              </FieldLabel>
              <FieldLabel label="Tuman">
                <Pressable
                  onPress={() => editForm.region_id && setSelector('district')}
                  className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <Text className="font-semibold text-slate-700">{districts.find((d) => d.id === editForm.district_id)?.name || 'Tumanni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
              </FieldLabel>
              <FieldLabel label="MFY">
                <Pressable
                  onPress={() => editForm.district_id && setSelector('mfy')}
                  className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <Text className="font-semibold text-slate-700">{mfys.find((m) => m.id === editForm.mfy_id)?.name || 'MFY ni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
              </FieldLabel>
            </View>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable onPress={() => setIsEditOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <Text className="font-bold text-slate-600">Bekor</Text>
              </Pressable>
              <Pressable onPress={onSaveProfile} disabled={isSavingProfile} className="rounded-xl bg-slate-900 px-4 py-2.5 disabled:bg-slate-400">
                <Text className="font-bold text-white">{isSavingProfile ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={selector !== null} transparent animationType="slide" onRequestClose={() => setSelector(null)}>
        <View className="flex-1 justify-end bg-black/35">
          <Pressable className="absolute inset-0" onPress={() => setSelector(null)} />
          <View className="max-h-[65%] rounded-t-3xl bg-white px-4 pb-6 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-2 text-base font-black text-slate-900">
              {selector === 'region' ? 'Viloyat tanlang' : selector === 'district' ? 'Tuman tanlang' : 'MFY tanlang'}
            </Text>
            <ScrollView>
              {(selector === 'region' ? regions : selector === 'district' ? districts : mfys).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (selector === 'region') onSelectRegion(item.id);
                    else if (selector === 'district') onSelectDistrict(item.id);
                    else {
                      setEditForm((p) => ({ ...p, mfy_id: item.id }));
                      setSelector(null);
                    }
                  }}
                  className="border-b border-slate-100 py-3.5"
                >
                  <Text className="font-semibold text-slate-800">{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={partnerModalOpen} transparent animationType="slide" onRequestClose={() => setPartnerModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <Pressable className="absolute inset-0" onPress={() => setPartnerModalOpen(false)} />
          <View className="max-h-[90%] rounded-t-3xl bg-white px-4 pb-6 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-3 text-lg font-black text-gray-900">Hamkorlik so&apos;rovlari</Text>
            <View className="mb-3 max-h-28 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <ScrollView>
                {partnerRequests.length === 0 ? (
                  <Text className="text-sm font-semibold text-slate-500">Hozircha so&apos;rov yuborilmagan.</Text>
                ) : (
                  partnerRequests.map((r) => (
                    <View key={r.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-2">
                      <Text className="font-black text-slate-800">{r.company_name}</Text>
                      <Text className="text-xs font-semibold text-slate-500">{r.phone} · {r.status || 'pending'}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
            <ScrollView>
              <View className="gap-2">
                <TextInput value={partnerForm.company_name} onChangeText={(v) => setPartnerForm((p) => ({ ...p, company_name: v }))} placeholder="Kompaniya nomi" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.inn} onChangeText={(v) => setPartnerForm((p) => ({ ...p, inn: digitsOnly(v, 9) }))} keyboardType="number-pad" maxLength={9} placeholder="INN (9 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.mfo} onChangeText={(v) => setPartnerForm((p) => ({ ...p, mfo: digitsOnly(v, 5) }))} keyboardType="number-pad" maxLength={5} placeholder="MFO (5 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <TextInput value={partnerForm.account_number} onChangeText={(v) => setPartnerForm((p) => ({ ...p, account_number: digitsOnly(v, 20) }))} keyboardType="number-pad" maxLength={20} placeholder="Hisob raqam (20 raqam)" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
                <Text className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">Faoliyat turi</Text>
                <Pressable onPress={() => setPartnerPicker('activity')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{activityTypes.find((it) => it.id === partnerForm.activity_type_id)?.name || 'Tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Text className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">Viloyat / tuman / MFY</Text>
                <Pressable onPress={() => setPartnerPicker('region')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{regions.find((it) => it.id === partnerForm.region_id)?.name || 'Viloyatni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => partnerForm.region_id && setPartnerPicker('district')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{partnerDistricts.find((it) => it.id === partnerForm.district_id)?.name || 'Tumanni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => partnerForm.district_id && setPartnerPicker('mfy')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{partnerMfys.find((it) => it.id === partnerForm.mfy_id)?.name || 'MFY ni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <TextInput value={partnerForm.phone} onChangeText={(v) => setPartnerForm((p) => ({ ...p, phone: sanitizePhoneInput(v) }))} keyboardType="phone-pad" maxLength={13} placeholder="+998901234567" placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR} className={PARTNER_FORM_TEXT_INPUT_CLASS} />
              </View>
            </ScrollView>
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={() => setPartnerModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-center font-bold text-slate-600">Yopish</Text>
              </Pressable>
              <Pressable onPress={() => void submitPartnerRequest()} disabled={partnerSubmitting} className="flex-1 rounded-xl bg-emerald-600 py-3 disabled:opacity-60">
                <Text className="text-center font-bold text-white">{partnerSubmitting ? 'Yuborilmoqda...' : "Yangi so'rov yuborish"}</Text>
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
                      setPartnerForm((p) => ({ ...p, region_id: opt.value, district_id: ds[0]?.id ?? 0, mfy_id: 0 }));
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
    </ScrollView>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</Text>
      {children}
    </View>
  );
}

function ProfileInfoItem({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className={isLast ? 'rounded-2xl bg-slate-50 p-3' : 'rounded-2xl border-b border-slate-200 bg-slate-50 p-3'}>
      <View className="flex-row items-start gap-2">
        <View className="mt-0.5">{icon}</View>
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</Text>
          <Text className="text-sm font-bold text-slate-700">{value}</Text>
        </View>
      </View>
    </View>
  );
}

function formatBirthDate(date: string) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
