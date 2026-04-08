import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, BriefcaseBusiness, ChevronRight, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { api } from '../services/api';
import { ActivityType, PartnerRequest, PartnerRequestPayload, Region, User } from '../types';
import { digitsOnly, normalizePartnerRequestPayload, sanitizePhoneInput, validatePartnerRequestPayload } from '../lib/partnerRequestForm';

export function PartnerRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [picker, setPicker] = useState<'activity' | 'region' | 'district' | 'mfy' | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [mfys, setMfys] = useState<Array<{ id: number; name: string }>>([]);
  const [form, setForm] = useState<PartnerRequestPayload>({
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, regionList, types, requestList] = await Promise.all([
        api.profile.get(),
        api.regions.getRegions(),
        api.activityTypes.list(),
        api.partnerRequests.list(),
      ]);
      setUser(profile);
      setRegions(regionList);
      setActivityTypes(types);
      setRequests(requestList);
      setForm((prev) => ({
        ...prev,
        phone: prev.phone || profile.phone || '+998',
        activity_type_id: prev.activity_type_id || types[0]?.id || 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const pickerOptions = useMemo(() => {
    if (picker === 'activity') return activityTypes.map((it) => ({ value: it.id, label: it.name }));
    if (picker === 'region') return regions.map((it) => ({ value: it.id, label: it.name }));
    if (picker === 'district') return districts.map((it) => ({ value: it.id, label: it.name }));
    if (picker === 'mfy') return mfys.map((it) => ({ value: it.id, label: it.name }));
    return [];
  }, [picker, activityTypes, regions, districts, mfys]);

  const openCreateModal = async () => {
    const regionId = user?.region_id || regions[0]?.id || 0;
    const districtId = user?.district_id || 0;
    const mfyId = user?.mfy_id || 0;
    const [ds, ms] = await Promise.all([
      regionId ? api.regions.getDistricts(regionId) : Promise.resolve([]),
      districtId ? api.regions.getMFYs(districtId) : Promise.resolve([]),
    ]);
    setDistricts(ds);
    setMfys(ms);
    setForm((prev) => ({
      ...prev,
      region_id: regionId,
      district_id: districtId,
      mfy_id: mfyId,
      phone: prev.phone || user?.phone || '+998',
      activity_type_id: prev.activity_type_id || activityTypes[0]?.id || 0,
    }));
    setCreateModalOpen(true);
  };

  const submitRequest = async () => {
    const normalized = normalizePartnerRequestPayload(form);
    const validationError = validatePartnerRequestPayload(normalized);
    if (validationError) return Alert.alert('Xatolik', validationError);
    setSubmitting(true);
    try {
      await api.partnerRequests.create(normalized);
      const requestList = await api.partnerRequests.list();
      setRequests(requestList);
      setCreateModalOpen(false);
    } catch (e) {
      Alert.alert('Xatolik', e instanceof Error ? e.message : "So'rov yuborilmadi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      <View className="flex-row items-center gap-2 border-b border-slate-200 bg-white px-4 pb-3 pt-12">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <ArrowLeft size={18} color="#0f172a" />
        </Pressable>
        <Text className="text-lg font-black text-slate-900">Hamkorlik so&apos;rovlari</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {requests.length === 0 ? (
          <View className="items-center rounded-2xl border border-slate-200 bg-white px-4 py-8">
            <BriefcaseBusiness size={28} color="#94a3b8" />
            <Text className="mt-3 text-center font-bold text-slate-600">Hozircha so&apos;rov yuborilmagan</Text>
          </View>
        ) : (
          requests.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedRequest(item)}
              className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-95 md:p-5"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-base font-black text-slate-800">{item.company_name}</Text>
                <View className="rounded-full bg-emerald-100 px-2.5 py-1">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    {item.status || 'pending'}
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-semibold text-slate-500">{item.phone}</Text>
              <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Batafsil ko&apos;rish
                </Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => void openCreateModal()}
        className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-300/70"
      >
        <Plus size={24} color="white" />
      </Pressable>

      <Modal visible={createModalOpen} transparent animationType="slide" onRequestClose={() => setCreateModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/45 px-0 md:justify-center md:px-4">
          <Pressable className="absolute inset-0" onPress={() => setCreateModalOpen(false)} />
          <View className="max-h-[90%] w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 md:max-h-[86%] md:max-w-2xl md:self-center md:rounded-3xl">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-black text-slate-900">Yangi hamkorlik so&apos;rovi</Text>
              <Pressable onPress={() => setCreateModalOpen(false)} className="h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X size={16} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView>
              <View className="gap-2">
                <TextInput value={form.company_name} onChangeText={(v) => setForm((p) => ({ ...p, company_name: v }))} placeholder="Kompaniya nomi" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800" />
                <TextInput value={form.inn} onChangeText={(v) => setForm((p) => ({ ...p, inn: digitsOnly(v, 9) }))} keyboardType="number-pad" maxLength={9} placeholder="INN (9 raqam)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800" />
                <TextInput value={form.mfo} onChangeText={(v) => setForm((p) => ({ ...p, mfo: digitsOnly(v, 5) }))} keyboardType="number-pad" maxLength={5} placeholder="MFO (5 raqam)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800" />
                <TextInput value={form.account_number} onChangeText={(v) => setForm((p) => ({ ...p, account_number: digitsOnly(v, 20) }))} keyboardType="number-pad" maxLength={20} placeholder="Hisob raqam (20 raqam)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800" />

                <Text className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">Faoliyat turi</Text>
                <Pressable onPress={() => setPicker('activity')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{activityTypes.find((it) => it.id === form.activity_type_id)?.name || 'Tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>

                <Text className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">Viloyat / tuman / MFY</Text>
                <Pressable onPress={() => setPicker('region')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{regions.find((it) => it.id === form.region_id)?.name || 'Viloyatni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => form.region_id && setPicker('district')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{districts.find((it) => it.id === form.district_id)?.name || 'Tumanni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>
                <Pressable onPress={() => form.district_id && setPicker('mfy')} className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-semibold text-slate-700">{mfys.find((it) => it.id === form.mfy_id)?.name || 'MFY ni tanlang'}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </Pressable>

                <TextInput value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: sanitizePhoneInput(v) }))} keyboardType="phone-pad" maxLength={13} placeholder="+998901234567" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-800" />
              </View>
            </ScrollView>
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={() => setCreateModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-center font-bold text-slate-600">Yopish</Text>
              </Pressable>
              <Pressable onPress={() => void submitRequest()} disabled={submitting} className="flex-1 rounded-xl bg-emerald-600 py-3 disabled:opacity-60">
                <Text className="text-center font-bold text-white">{submitting ? 'Yuborilmoqda...' : "Yuborish"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View className="flex-1 justify-end bg-black/35 px-0 md:justify-center md:px-4">
          <Pressable className="absolute inset-0" onPress={() => setPicker(null)} />
          <View className="max-h-[65%] w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 md:max-h-[70%] md:max-w-xl md:self-center md:rounded-3xl">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-2 text-base font-black text-slate-900">
              {picker === 'activity' ? 'Faoliyat turi' : picker === 'region' ? 'Viloyat' : picker === 'district' ? 'Tuman' : 'MFY'}
            </Text>
            <ScrollView>
              {pickerOptions.map((opt) => (
                <Pressable
                  key={`${picker}-${opt.value}`}
                  onPress={async () => {
                    if (picker === 'activity') {
                      setForm((p) => ({ ...p, activity_type_id: opt.value }));
                    } else if (picker === 'region') {
                      const ds = await api.regions.getDistricts(opt.value);
                      setDistricts(ds);
                      setMfys([]);
                      setForm((p) => ({ ...p, region_id: opt.value, district_id: ds[0]?.id ?? 0, mfy_id: 0 }));
                    } else if (picker === 'district') {
                      const ms = await api.regions.getMFYs(opt.value);
                      setMfys(ms);
                      setForm((p) => ({ ...p, district_id: opt.value, mfy_id: ms[0]?.id ?? 0 }));
                    } else {
                      setForm((p) => ({ ...p, mfy_id: opt.value }));
                    }
                    setPicker(null);
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

      <Modal visible={selectedRequest !== null} transparent animationType="slide" onRequestClose={() => setSelectedRequest(null)}>
        <View className="flex-1 justify-end bg-black/45 px-0 md:justify-center md:px-4">
          <Pressable className="absolute inset-0" onPress={() => setSelectedRequest(null)} />
          <View className="w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 md:max-w-xl md:self-center md:rounded-3xl">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-black text-slate-900">So&apos;rov tafsiloti</Text>
              <Pressable onPress={() => setSelectedRequest(null)} className="h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X size={16} color="#64748b" />
              </Pressable>
            </View>
            {selectedRequest ? (
              <View className="gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <DetailRow label="Kompaniya" value={selectedRequest.company_name} />
                <DetailRow label="Telefon" value={selectedRequest.phone} />
                <DetailRow label="INN" value={selectedRequest.inn} />
                <DetailRow label="MFO" value={selectedRequest.mfo} />
                <DetailRow label="Hisob raqam" value={selectedRequest.account_number} />
                <DetailRow label="Status" value={selectedRequest.status || 'pending'} />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-b border-slate-200 py-2 last:border-b-0">
      <Text className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="max-w-[70%] text-right text-sm font-bold text-slate-700">{value || '-'}</Text>
    </View>
  );
}
