import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  CreditCard,
  User as UserIcon,
  Camera,
  Trash2,
  Loader2,
  Phone,
  Calendar,
  MapPin,
  X,
  Package,
  BriefcaseBusiness,
} from 'lucide-react';
import { api } from '../services/api';
import { useWebNotifications } from '../hooks/useWebNotifications';
import { ActivityType, District, MFY, PartnerRequest, PartnerRequestPayload, Region, User } from '../types';
import {
  digitsOnly,
  normalizePartnerRequestPayload,
  sanitizePhoneInput,
  validatePartnerRequestPayload,
  PARTNER_FORM_INPUT_CLASS,
  PARTNER_FORM_SELECT_CLASS,
} from '../lib/partnerRequestForm';
import { PARTNER_REQUEST_SUCCESS_MSG, showUserMessage } from '../lib/userMessage';
import {
  prepareAvatarFromFile,
  normalizeAvatar,
  PROFILE_AVATAR_FRAME_CLASS,
  PROFILE_AVATAR_SIZE_CLASS,
} from '../lib/profileAvatarImage';
import { cn } from '../lib/utils';

type SelectorType = 'region' | 'district' | 'mfy' | null;

function ProfileBlurOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#FEF9F3] opacity-90 blur-[72px]"
      />
      <div
        className="absolute top-1/3 -left-28 h-56 w-56 -translate-y-1/2 rounded-full bg-orange-100/70 blur-[64px]"
      />
      <div
        className="absolute bottom-0 right-1/4 h-44 w-44 translate-y-1/4 rounded-full bg-amber-100/60 blur-[56px]"
      />
      <div
        className="absolute top-8 left-1/4 h-32 w-32 -translate-x-1/2 rounded-full bg-white/80 blur-[48px]"
      />
      <div
        className="absolute -bottom-8 right-0 h-40 w-40 rounded-full bg-orange-200/40 blur-[60px]"
      />
      <div
        className="pointer-events-none absolute right-[18%] top-8 hidden h-28 w-28 rounded-full bg-[#FEF9F3] opacity-80 blur-[52px] md:block"
      />
    </div>
  );
}

export function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const { setNotificationsInboxOpen, refreshNotificationsUnread } = useWebNotifications();
  const [user, setUser] = useState<User | null>(null);
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
  const [selectorQuery, setSelectorQuery] = useState('');
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
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

  useEffect(() => {
    (async () => {
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
        setUser(null);
        setProfileError("Profil ma'lumotlarini yuklab bo'lmadi");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  if (loadingProfile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">Yuklanmoqda...</div>;
  }
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
        <p className="text-sm font-bold text-slate-600">{profileError || "Profil ochilmadi"}</p>
        <button
          type="button"
          onClick={() => {
            setLoadingProfile(true);
            window.location.reload();
          }}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const regionName = regions.find((r) => r.id === user.region_id)?.name || `Viloyat #${user.region_id}`;
  const districtName = districts.find((d) => d.id === user.district_id)?.name || `Tuman #${user.district_id}`;
  const mfyName = mfys.find((m) => m.id === user.mfy_id)?.name || `MFY #${user.mfy_id}`;
  const birthDate = formatBirthDate(user.birth_date);
  const genderLabel = user.gender === 'erkak' ? 'Erkak' : 'Ayol';

  const onPickAvatar = async (file?: File | null) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const prepared = await prepareAvatarFromFile(file);
      const res = await api.profile.updateAvatar({ avatar: prepared });
      setAvatar(normalizeAvatar(res.avatar || prepared));
      showUserMessage({ type: 'success', message: 'Profil rasmi yangilandi' });
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

  const onRegionChange = async (regionId: number) => {
    setEditForm((p) => ({ ...p, region_id: regionId, district_id: 0, mfy_id: 0 }));
    const ds = await api.regions.getDistricts(regionId);
    setDistricts(ds);
    setMfys([]);
  };

  const onDistrictChange = async (districtId: number) => {
    setEditForm((p) => ({ ...p, district_id: districtId, mfy_id: 0 }));
    const ms = await api.regions.getMFYs(districtId);
    setMfys(ms);
  };

  const onSelectRegion = async (regionId: number) => {
    await onRegionChange(regionId);
    setSelector('district');
  };

  const onSelectDistrict = async (districtId: number) => {
    await onDistrictChange(districtId);
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

  const selectorData = selector === 'region' ? regions : selector === 'district' ? districts : selector === 'mfy' ? mfys : [];
  const filteredSelectorData = selectorData.filter((item) =>
    item.name.toLowerCase().includes(selectorQuery.trim().toLowerCase())
  );

  return (
    <div className="h-screen overflow-y-auto bg-slate-100 pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 sm:pt-6 md:max-w-3xl md:pt-5">
        <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/60 shadow-lg shadow-slate-300/40 backdrop-blur-xl sm:rounded-[32px] md:rounded-[32px]">
          {/* Banner — tablet+ da ixchamroq */}
          <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-slate-100/70 px-4 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-9 md:px-8 md:pt-8 md:pb-6">
            <ProfileBlurOrbs />
            <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-4 flex flex-col items-center rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
                <div className={cn(PROFILE_AVATAR_FRAME_CLASS, PROFILE_AVATAR_SIZE_CLASS)}>
                  {avatar ? (
                    <img src={avatar} alt="Profil rasmi" className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12" />
                    </div>
                  )}
                  {avatarBusy ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => void onDeleteAvatar()}
                    disabled={avatarBusy || !avatar}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm disabled:bg-rose-200 disabled:text-white/80 sm:h-10 sm:w-10"
                    aria-label="Profil rasmini o‘chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <label
                    className={cn(
                      'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-sm sm:h-10 sm:w-10',
                      avatarBusy && 'pointer-events-none opacity-60'
                    )}
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      className="hidden"
                      onChange={(e) => {
                        void onPickAvatar(e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                      disabled={avatarBusy}
                    />
                  </label>
                </div>
                <p className="mt-2 max-w-[220px] text-center text-[10px] font-semibold leading-snug text-slate-400">
                  KVadrat rasm tavsiya etiladi · avtomatik siqiladi
                </p>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-xl">
                {user.first_name} {user.last_name}
              </h2>
              <p className="mt-1 font-medium text-slate-500 md:text-sm">{user.phone}</p>
            </div>
          </div>

          {/* Menu — bir xil konteyner ichida */}
          <div className="space-y-5 bg-slate-50/80 p-3 sm:p-4 md:space-y-3">
            <div className="rounded-[24px] border border-slate-200/90 bg-white p-3 shadow-sm sm:rounded-[28px]">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <ProfileInfoItem icon={<Phone className="h-4 w-4 text-blue-500" />} label="Telefon" value={user.phone} />
                <ProfileInfoItem icon={<Calendar className="h-4 w-4 text-orange-500" />} label="Tug'ilgan sana" value={birthDate} />
                <ProfileInfoItem icon={<UserIcon className="h-4 w-4 text-violet-500" />} label="Jins" value={genderLabel} />
                <ProfileInfoItem
                  icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                  label="Joylashuv"
                  value={`${regionName}, ${districtName}, ${mfyName}`}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm sm:rounded-[28px]">
              <MenuItem icon={<UserIcon className="text-blue-500" />} label="Shaxsiy ma'lumotlar" onClick={openEdit} />
              <MenuItem
                icon={<Package className="text-emerald-600" />}
                label="Buyurtmalarim"
                onClick={() => navigate('/orders')}
              />
              <MenuItem
                icon={<BriefcaseBusiness className="text-emerald-700" />}
                label="Hamkorlik so'rovlari"
                onClick={() => navigate('/partner-requests')}
              />
              <MenuItem
                icon={<Bell className="text-orange-500" />}
                label="Bildirishnomalar"
                onClick={() => setNotificationsInboxOpen(true)}
              />
            </div>

            {/* <div className="rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm sm:rounded-[28px]">
              <MenuItem icon={<HelpCircle className="text-gray-400" />} label="Yordam markazi" />
              <MenuItem icon={<Settings className="text-gray-400" />} label="Sozlamalar" />
            </div> */}

            <button
              type="button"
              onClick={() => {
                onLogout();
                void refreshNotificationsUnread();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[24px] border border-rose-200/80 bg-rose-100/60 py-4 font-bold text-rose-600 transition-transform active:scale-[0.98] sm:rounded-[28px] sm:py-5"
            >
              <LogOut size={20} />
              Chiqish
            </button>
          </div>
        </div>
      </div>
      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Shaxsiy ma&apos;lumotlarni tahrirlash</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldLabel label="Ism">
                <input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="Ism"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-orange-300"
                />
              </FieldLabel>
              <FieldLabel label="Familiya">
                <input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Familiya"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-orange-300"
                />
              </FieldLabel>
              <FieldLabel label="Jins">
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value as 'erkak' | 'ayol' }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-orange-300"
                >
                  <option value="erkak">Erkak</option>
                  <option value="ayol">Ayol</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Tug'ilgan sana">
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm((p) => ({ ...p, birth_date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-orange-300"
                />
              </FieldLabel>
              <FieldLabel label="Viloyat">
                <button
                  type="button"
                  onClick={() => setSelector('region')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800"
                >
                  <span>{regions.find((r) => r.id === editForm.region_id)?.name || 'Viloyatni tanlang'}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </FieldLabel>
              <FieldLabel label="Tuman">
                <button
                  type="button"
                  onClick={() => editForm.region_id && setSelector('district')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800"
                >
                  <span>{districts.find((d) => d.id === editForm.district_id)?.name || 'Tumanni tanlang'}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </FieldLabel>
              <FieldLabel label="MFY" className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => editForm.district_id && setSelector('mfy')}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800"
                >
                  <span>{mfys.find((m) => m.id === editForm.mfy_id)?.name || 'MFY ni tanlang'}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </FieldLabel>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={isSavingProfile}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-400"
              >
                {isSavingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {selector ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">
                {selector === 'region' ? 'Viloyat tanlang' : selector === 'district' ? 'Tuman tanlang' : 'MFY tanlang'}
              </h4>
              <button
                type="button"
                onClick={() => setSelector(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <input
              value={selectorQuery}
              onChange={(e) => setSelectorQuery(e.target.value)}
              placeholder="Qidirish..."
              className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800 outline-none"
            />
            <div className="max-h-72 overflow-y-auto">
              {filteredSelectorData.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (selector === 'region') onSelectRegion(item.id);
                    else if (selector === 'district') onSelectDistrict(item.id);
                    else {
                      setEditForm((p) => ({ ...p, mfy_id: item.id }));
                      setSelector(null);
                    }
                    setSelectorQuery('');
                  }}
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold text-slate-700"
                >
                  {item.name}
                </button>
              ))}
              {filteredSelectorData.length === 0 ? (
                <p className="py-4 text-center text-sm font-semibold text-slate-400">Hech narsa topilmadi</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {partnerModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">Hamkorlik so&apos;rovlari</h4>
              <button type="button" onClick={() => setPartnerModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="mb-4 max-h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {partnerRequests.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">Hozircha so&apos;rov yuborilmagan.</p>
              ) : (
                partnerRequests.map((r) => (
                  <div key={r.id} className="mb-2 rounded-xl border border-slate-200 bg-white p-2">
                    <p className="text-sm font-black text-slate-800">{r.company_name}</p>
                    <p className="text-xs font-semibold text-slate-500">{r.phone} · {r.status || 'pending'}</p>
                  </div>
                ))
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={partnerForm.company_name} onChange={(e) => setPartnerForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Kompaniya nomi" className={PARTNER_FORM_INPUT_CLASS} />
              <input value={partnerForm.inn} onChange={(e) => setPartnerForm((p) => ({ ...p, inn: digitsOnly(e.target.value, 9) }))} inputMode="numeric" maxLength={9} placeholder="INN (9 raqam)" className={PARTNER_FORM_INPUT_CLASS} />
              <input value={partnerForm.mfo} onChange={(e) => setPartnerForm((p) => ({ ...p, mfo: digitsOnly(e.target.value, 5) }))} inputMode="numeric" maxLength={5} placeholder="MFO (5 raqam)" className={PARTNER_FORM_INPUT_CLASS} />
              <input value={partnerForm.account_number} onChange={(e) => setPartnerForm((p) => ({ ...p, account_number: digitsOnly(e.target.value, 20) }))} inputMode="numeric" maxLength={20} placeholder="Hisob raqam (20 raqam)" className={PARTNER_FORM_INPUT_CLASS} />
              <select value={partnerForm.activity_type_id} onChange={(e) => setPartnerForm((p) => ({ ...p, activity_type_id: Number(e.target.value) }))} className={cn(PARTNER_FORM_SELECT_CLASS, 'sm:col-span-2')}>
                {activityTypes.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <select value={partnerForm.region_id} onChange={(e) => {
                const id = Number(e.target.value);
                setPartnerForm((p) => ({ ...p, region_id: id }));
              }} className={PARTNER_FORM_SELECT_CLASS}>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={partnerForm.district_id} onChange={(e) => {
                const id = Number(e.target.value);
                setPartnerForm((p) => ({ ...p, district_id: id }));
              }} className={PARTNER_FORM_SELECT_CLASS}>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={partnerForm.mfy_id} onChange={(e) => setPartnerForm((p) => ({ ...p, mfy_id: Number(e.target.value) }))} className={cn(PARTNER_FORM_SELECT_CLASS, 'sm:col-span-2')}>
                {mfys.map((mfy) => <option key={mfy.id} value={mfy.id}>{mfy.name}</option>)}
              </select>
              <input value={partnerForm.phone} onChange={(e) => setPartnerForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))} inputMode="tel" maxLength={13} placeholder="+998901234567" className={cn(PARTNER_FORM_INPUT_CLASS, 'sm:col-span-2')} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPartnerModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">Yopish</button>
              <button type="button" onClick={() => void submitPartnerRequest()} disabled={partnerSubmitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {partnerSubmitting ? 'Yuborilmoqda...' : "Yangi so'rov yuborish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldLabel({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function ProfileInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function formatBirthDate(date: string) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-100/90"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-200/90">
          {icon}
        </div>
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <ChevronRight className="text-slate-300" size={20} />
    </button>
  );
}
