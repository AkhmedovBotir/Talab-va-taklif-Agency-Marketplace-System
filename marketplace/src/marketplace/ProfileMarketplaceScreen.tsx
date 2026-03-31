import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator, Image, Modal, TextInput, RefreshControl } from 'react-native';
import {
  User,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  CreditCard,
  HelpCircle,
  Bell,
  Camera,
  Trash2,
  Phone,
  Calendar,
  MapPin,
  X,
  Package,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { User as AppUser, Region, District, MFY } from '../types';
import { useMarketplace } from './MarketplaceContext';

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
  const { onLogout } = useMarketplace();
  const [user, setUser] = useState<AppUser | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [avatar, setAvatar] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selector, setSelector] = useState<SelectorType>(null);
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
    try {
      const profile = await api.profile.get();
      setUser(profile);
      const [regionList, districtList, mfyList, avatarRes] = await Promise.all([
        api.regions.getRegions(),
        api.regions.getDistricts(profile.region_id),
        api.regions.getMFYs(profile.district_id),
        api.profile.getAvatar(),
      ]);
      setRegions(regionList);
      setDistricts(districtList);
      setMfys(mfyList);
      setAvatar(avatarRes?.has_avatar ? normalizeAvatar(avatarRes.avatar) : '');
    } catch {
      if (clearOnError) setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadProfileData(true);
  }, [loadProfileData]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await loadProfileData(false);
    } finally {
      setPullRefreshing(false);
    }
  }, [loadProfileData]);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const regionName = regions.find((r) => r.id === user.region_id)?.name || `Viloyat #${user.region_id}`;
  const districtName = districts.find((d) => d.id === user.district_id)?.name || `Tuman #${user.district_id}`;
  const mfyName = mfys.find((m) => m.id === user.mfy_id)?.name || `MFY #${user.mfy_id}`;
  const birthDate = formatBirthDate(user.birth_date);
  const genderLabel = user.gender === 'erkak' ? 'Erkak' : 'Ayol';

  const onPickAvatar = async () => {
    setAvatarBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (!asset.base64) return;
      const payloadAvatar = `data:image/jpeg;base64,${asset.base64}`;
      const res = await api.profile.updateAvatar({ avatar: payloadAvatar });
      setAvatar(normalizeAvatar(res.avatar || payloadAvatar));
    } finally {
      setAvatarBusy(false);
    }
  };

  const onDeleteAvatar = async () => {
    setAvatarBusy(true);
    try {
      await api.profile.deleteAvatar();
      setAvatar('');
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

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerStyle={{
        paddingBottom: 100,
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
            <View className="mb-4 items-center rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-3">
              <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] bg-orange-500 shadow-lg shadow-orange-200/50 md:mb-1 md:h-16 md:w-16 md:rounded-2xl">
                {avatar ? <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="cover" /> : <User size={30} color="white" />}
              </View>
              <View className="mt-3 flex-row items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <Pressable
                  onPress={onDeleteAvatar}
                  disabled={avatarBusy || !avatar}
                  className="h-8 w-8 items-center justify-center rounded-full bg-rose-500 disabled:bg-rose-200"
                >
                  <Trash2 size={14} color="white" />
                </Pressable>
                <Pressable
                  onPress={onPickAvatar}
                  disabled={avatarBusy}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-900"
                >
                  <Camera size={14} color="white" />
                </Pressable>
              </View>
            </View>
            <Text className="text-center text-2xl font-bold text-gray-900 md:text-xl">
              {user.first_name} {user.last_name}
            </Text>
            <Text className="mt-1 text-center text-base font-medium text-slate-500 md:text-sm">{user.phone}</Text>
          </View>
        </View>

        <View className="space-y-5 bg-slate-50/90 p-3 md:space-y-3">
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
            <ProfileMenuItem icon={<Bell size={20} color="#f97316" />} label="Bildirishnomalar" />
          </View>
          <View className="my-3 rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm">
            <ProfileMenuItem icon={<HelpCircle size={20} color="#9ca3af" />} label="Yordam markazi" />
            <ProfileMenuItem icon={<Settings size={20} color="#9ca3af" />} label="Sozlamalar" />
          </View>
          <Pressable
            onPress={onLogout}
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

function normalizeAvatar(avatar: string) {
  if (!avatar) return '';
  if (avatar.startsWith('data:image/')) return avatar;
  if (avatar.startsWith('file:') || avatar.startsWith('http')) return avatar;
  return `data:image/png;base64,${avatar}`;
}
