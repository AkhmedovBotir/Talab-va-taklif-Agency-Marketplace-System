import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  User as UserIcon,
  Camera,
  Trash2,
  Phone,
  Calendar,
  MapPin,
  X,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { District, MFY, Region, User } from '../types';

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
  const [user, setUser] = useState<User | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [avatar, setAvatar] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selector, setSelector] = useState<SelectorType>(null);
  const [selectorQuery, setSelectorQuery] = useState('');
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
        setUser(null);
      }
    })();
  }, []);

  if (!user) return null;

  const regionName = regions.find((r) => r.id === user.region_id)?.name || `Viloyat #${user.region_id}`;
  const districtName = districts.find((d) => d.id === user.district_id)?.name || `Tuman #${user.district_id}`;
  const mfyName = mfys.find((m) => m.id === user.mfy_id)?.name || `MFY #${user.mfy_id}`;
  const birthDate = formatBirthDate(user.birth_date);
  const genderLabel = user.gender === 'erkak' ? 'Erkak' : 'Ayol';

  const onPickAvatar = async (file?: File | null) => {
    if (!file) return;
    const base64 = await fileToDataUrl(file);
    if (!base64) return;
    setAvatarBusy(true);
    try {
      const res = await api.profile.updateAvatar({ avatar: base64 });
      setAvatar(normalizeAvatar(res.avatar || base64));
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
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] bg-orange-500 text-white shadow-lg shadow-orange-200/50 sm:h-24 sm:w-24 sm:rounded-[32px] md:mb-1 md:h-16 md:w-16 md:rounded-2xl">
                  {avatar ? <img src={avatar} alt="Avatar" className="h-full w-full object-cover" /> : <UserIcon className="h-9 w-9 sm:h-10 sm:w-10 md:h-8 md:w-8" />}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <button
                    type="button"
                    onClick={onDeleteAvatar}
                    disabled={avatarBusy || !avatar}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm disabled:bg-rose-200 disabled:text-white/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        onPickAvatar(e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                      disabled={avatarBusy}
                    />
                  </label>
                </div>
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
              <MenuItem icon={<Bell className="text-orange-500" />} label="Bildirishnomalar" />
            </div>

            <div className="rounded-[24px] border border-slate-200/90 bg-slate-50 p-2 shadow-sm sm:rounded-[28px]">
              <MenuItem icon={<HelpCircle className="text-gray-400" />} label="Yordam markazi" />
              <MenuItem icon={<Settings className="text-gray-400" />} label="Sozlamalar" />
            </div>

            <button
              type="button"
              onClick={onLogout}
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

function normalizeAvatar(avatar: string) {
  if (!avatar) return '';
  return avatar.startsWith('data:image/') ? avatar : `data:image/png;base64,${avatar}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
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
