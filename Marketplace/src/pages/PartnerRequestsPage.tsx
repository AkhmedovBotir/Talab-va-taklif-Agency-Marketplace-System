import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, ChevronRight, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { ActivityType, PartnerRequest, PartnerRequestPayload, Region, User } from '../types';
import {
  digitsOnly,
  normalizePartnerRequestPayload,
  sanitizePhoneInput,
  validatePartnerRequestPayload,
  PARTNER_FORM_INPUT_CLASS_PY3,
} from '../lib/partnerRequestForm';
import { PARTNER_REQUEST_SUCCESS_MSG, showUserMessage } from '../lib/userMessage';

export function PartnerRequestsPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    void (async () => {
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
    })();
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
    if (validationError) {
      showUserMessage({ type: 'error', message: validationError });
      return;
    }
    setSubmitting(true);
    try {
      await api.partnerRequests.create(normalized);
      const requestList = await api.partnerRequests.list();
      setRequests(requestList);
      setCreateModalOpen(false);
      showUserMessage({ type: 'success', message: PARTNER_REQUEST_SUCCESS_MSG });
    } catch (e) {
      showUserMessage({
        type: 'error',
        message: e instanceof Error ? e.message : "So'rov yuborilmadi",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-black text-slate-900">Hamkorlik so&apos;rovlari</h1>
        </div>

        {requests.length === 0 ? (
          <div className="items-center rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center">
            <BriefcaseBusiness size={30} className="mx-auto text-slate-400" />
            <p className="mt-3 font-bold text-slate-600">Hozircha so&apos;rov yuborilmagan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {requests.map((item) => (
              <button key={item.id} onClick={() => setSelectedRequest(item)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow md:p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-base font-black text-slate-800">{item.company_name}</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">{item.status || 'pending'}</span>
                </div>
                <p className="text-xs font-semibold text-slate-500">{item.phone}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Batafsil ko&apos;rish</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => void openCreateModal()} className="fixed bottom-24 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
        <Plus size={24} />
      </button>

      {createModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-4" onClick={() => setCreateModalOpen(false)}>
          <div className="max-h-[90vh] w-full rounded-t-3xl bg-white p-4 md:max-w-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Yangi hamkorlik so&apos;rovi</h3>
              <button onClick={() => setCreateModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Kompaniya nomi" className={`${PARTNER_FORM_INPUT_CLASS_PY3} md:col-span-2`} />
              <input value={form.inn} onChange={(e) => setForm((p) => ({ ...p, inn: digitsOnly(e.target.value, 9) }))} inputMode="numeric" maxLength={9} placeholder="INN (9 raqam)" className={PARTNER_FORM_INPUT_CLASS_PY3} />
              <input value={form.mfo} onChange={(e) => setForm((p) => ({ ...p, mfo: digitsOnly(e.target.value, 5) }))} inputMode="numeric" maxLength={5} placeholder="MFO (5 raqam)" className={PARTNER_FORM_INPUT_CLASS_PY3} />
              <input value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: digitsOnly(e.target.value, 20) }))} inputMode="numeric" maxLength={20} placeholder="Hisob raqam (20 raqam)" className={`${PARTNER_FORM_INPUT_CLASS_PY3} md:col-span-2`} />
              <button onClick={() => setPicker('activity')} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold md:col-span-2">
                <span>{activityTypes.find((it) => it.id === form.activity_type_id)?.name || 'Faoliyat turi'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button onClick={() => setPicker('region')} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold">
                <span>{regions.find((it) => it.id === form.region_id)?.name || 'Viloyat'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button onClick={() => form.region_id && setPicker('district')} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold">
                <span>{districts.find((it) => it.id === form.district_id)?.name || 'Tuman'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button onClick={() => form.district_id && setPicker('mfy')} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold md:col-span-2">
                <span>{mfys.find((it) => it.id === form.mfy_id)?.name || 'MFY'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))} inputMode="tel" maxLength={13} placeholder="+998901234567" className={`${PARTNER_FORM_INPUT_CLASS_PY3} md:col-span-2`} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setCreateModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-600">Yopish</button>
              <button onClick={() => void submitRequest()} disabled={submitting} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-60">{submitting ? 'Yuborilmoqda...' : 'Yuborish'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {picker ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 md:items-center md:p-4" onClick={() => setPicker(null)}>
          <div className="max-h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 md:max-w-xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-2 text-base font-black text-slate-900">{picker === 'activity' ? 'Faoliyat turi' : picker === 'region' ? 'Viloyat' : picker === 'district' ? 'Tuman' : 'MFY'}</h4>
            <div>
              {pickerOptions.map((opt) => (
                <button
                  key={`${picker}-${opt.value}`}
                  onClick={async () => {
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
                  className="w-full border-b border-slate-100 py-3 text-left font-semibold text-slate-800"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-4" onClick={() => setSelectedRequest(null)}>
          <div className="w-full rounded-t-3xl bg-white p-4 md:max-w-xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">So&apos;rov tafsiloti</h4>
              <button onClick={() => setSelectedRequest(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50"><X size={16} /></button>
            </div>
            <DetailRow label="Kompaniya" value={selectedRequest.company_name} />
            <DetailRow label="Telefon" value={selectedRequest.phone} />
            <DetailRow label="INN" value={selectedRequest.inn} />
            <DetailRow label="MFO" value={selectedRequest.mfo} />
            <DetailRow label="Hisob raqam" value={selectedRequest.account_number} />
            <DetailRow label="Status" value={selectedRequest.status || 'pending'} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 py-2 last:border-b-0">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <span className="max-w-[70%] text-right text-sm font-bold text-slate-700">{value || '-'}</span>
    </div>
  );
}
