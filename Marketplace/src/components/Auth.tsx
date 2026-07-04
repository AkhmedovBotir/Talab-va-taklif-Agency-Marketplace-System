import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MotiView } from 'moti';
import { ArrowLeft, Calendar, ChevronRight, Phone, ShoppingBag, User as UserIcon } from 'lucide-react-native';
import { api, persistMarketplaceToken } from '../services/api';
import { District, MFY, Region, User } from '../types';
import { cn } from '../lib/utils';
import { PARTNER_FORM_PLACEHOLDER_COLOR } from '../lib/partnerRequestForm';

const AUTH_INPUT_CLASS =
  'rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3.5 text-base font-semibold text-gray-900';
const AUTH_PHONE_INPUT_CLASS =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 pl-14 pr-4 text-lg font-semibold text-gray-900';
const AUTH_SELECTOR_CLASS =
  'w-full flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-4';

function authFieldLabelClass(hasValue: boolean) {
  return cn('text-base', hasValue ? 'font-bold text-gray-900' : 'font-normal text-slate-400');
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OTP_SECONDS = 300;

type Step = 'phone' | 'confirm_profile' | 'otp' | 'register';
type SelectorType = 'region' | 'district' | 'mfy' | null;

export function AuthPage({
  onAuthSuccess,
  onDismiss,
}: {
  onAuthSuccess: () => void;
  /** Guest rejimda (masalan, savatga qo‘shish) — orqaga qaytish */
  onDismiss?: () => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const isTabletUp = windowWidth >= 768;
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+998');
  const [flow, setFlow] = useState<'login' | 'register' | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [code, setCode] = useState(['', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [selector, setSelector] = useState<SelectorType>(null);
  const [selectorQuery, setSelectorQuery] = useState('');

  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [regData, setRegData] = useState({
    first_name: '',
    last_name: '',
    gender: 'erkak' as 'erkak' | 'ayol',
    region_id: 0,
    district_id: 0,
    mfy_id: 0,
    birth_year: '',
    birth_month: '',
    birth_day: '',
  });

  const maxBirthDate = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d;
  }, []);
  const birthIsoBounds = useMemo(() => {
    const toYmd = (d: Date) => d.toISOString().slice(0, 10);
    return { minIso: toYmd(minBirthDate), maxIso: toYmd(maxBirthDate) };
  }, [minBirthDate, maxBirthDate]);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  useEffect(() => {
    setSelectorQuery('');
  }, [selector]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3, 12) : digits.slice(0, 9);
    let formatted = '+998';
    if (local.length > 0) formatted += ` ${local.slice(0, 2)}`;
    if (local.length > 2) formatted += ` ${local.slice(2, 5)}`;
    if (local.length > 5) formatted += ` ${local.slice(5, 7)}`;
    if (local.length > 7) formatted += ` ${local.slice(7, 9)}`;
    return formatted;
  };

  const rawPhone = phone.replace(/\s/g, '');
  const birthDateIsoValue =
    regData.birth_year && regData.birth_month && regData.birth_day
      ? `${regData.birth_year}-${regData.birth_month.padStart(2, '0')}-${regData.birth_day.padStart(2, '0')}`
      : '';

  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(
    2,
    '0'
  )}`;
  const regionsList = Array.isArray(regions) ? regions : [];
  const districtsList = Array.isArray(districts) ? districts : [];
  const mfysList = Array.isArray(mfys) ? mfys : [];

  const birthDateForPicker = (): Date => {
    if (!birthDateIsoValue) return new Date(maxBirthDate.getFullYear() - 25, 0, 1);
    const [y, m, d] = birthDateIsoValue.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const applyBirthDate = (d: Date) => {
    setRegData((prev) => ({
      ...prev,
      birth_year: String(d.getFullYear()),
      birth_month: String(d.getMonth() + 1),
      birth_day: String(d.getDate()),
    }));
  };

  const onPhoneChange = (val: string) => {
    setError(null);
    if (val.length < 4) return setPhone('+998');
    setPhone(formatPhone(val));
  };

  const onStartEntry = async () => {
    if (rawPhone.length !== 13) return setError('Telefon formati +998901234567 bo‘lishi kerak.');
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.entry(rawPhone);
      let nextProfile = res.profile ?? null;
      let nextFlow: 'login' | 'register' = res.flow;

      // Backend ba'zi holatlarda profile ni entry ichida qaytarmasligi mumkin.
      // Mavjud raqam uchun phone/check bilan aniqlab, "Ha/Yo'q" bosqichini majburiy ochamiz.
      if (nextFlow === 'login' && !nextProfile) {
        try {
          const checked = await api.auth.phoneCheck(rawPhone);
          if (checked.exists && checked.profile) {
            nextProfile = checked.profile;
            nextFlow = 'login';
          }
        } catch {
          // phone/check ishlamasa ham entry flow bo'yicha davom etadi
        }
      }

      setFlow(nextFlow);
      setProfile(nextProfile);
      setPendingToken(null);
      setSecondsLeft(OTP_SECONDS);
      setCode(['', '', '', '', '']);
      setStep('otp');
    } catch (e: any) {
      setError(e?.message || 'Telefon tekshirishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setError(null);
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 4) otpRefs.current[index + 1]?.focus();
  };

  const loadRegions = async () => {
    const list = await api.regions.getRegions();
    setRegions(list);
  };

  const onVerifyOtp = async () => {
    const otp = code.join('');
    if (otp.length !== 5) return setError('5 xonali SMS kod kiriting.');
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.entryVerify(rawPhone, otp);
      const verifyFlow = res.flow ?? (res.token ? 'login' : 'register');

      // SMS dan keyin mavjud profil bor-yo'qligini qat'iy tekshiramiz.
      // Mavjud bo'lsa "Bu men / Bu men emas" ni ko'rsatamiz.
      let checked: { exists: boolean; profile?: User } = { exists: false };
      try {
        checked = await api.auth.phoneCheck(rawPhone);
      } catch {
        // phone/check ishlamasa verify flow bo'yicha fallback qilamiz
      }

      if (checked.exists && checked.profile) {
        let token = res.token ?? null;
        if (!token) {
          try {
            const loginRes = await api.auth.login(rawPhone);
            token = loginRes?.token || loginRes?.access_token || null;
          } catch {
            token = null;
          }
        }
        if (!token) {
          setError("Kirish tokeni olinmadi, qayta urinib ko'ring.");
          return;
        }
        setProfile(checked.profile);
        setPendingToken(token);
        setStep('confirm_profile');
        return;
      }

      if (verifyFlow === 'login' && res.token) {
        await persistMarketplaceToken(res.token);
        onAuthSuccess();
        return;
      }

      await loadRegions();
      setPendingToken(null);
      setProfile(null);
      setStep('register');
    } catch (e: any) {
      setError(e?.message || 'Kod noto‘g‘ri yoki eskirgan.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!flow) return;
    setLoading(true);
    setError(null);
    try {
      await api.auth.resendCode(rawPhone, flow);
      setSecondsLeft(OTP_SECONDS);
      setCode(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (e: any) {
      setError(e?.message || 'Kod qayta yuborilmadi.');
    } finally {
      setLoading(false);
    }
  };

  const selectRegion = async (regionId: number) => {
    setSelector(null);
    setRegData((prev) => ({ ...prev, region_id: regionId, district_id: 0, mfy_id: 0 }));
    const list = await api.regions.getDistricts(regionId);
    setDistricts(list);
    setMfys([]);
  };

  const selectDistrict = async (districtId: number) => {
    setSelector(null);
    setRegData((prev) => ({ ...prev, district_id: districtId, mfy_id: 0 }));
    const list = await api.regions.getMFYs(districtId);
    setMfys(list);
  };

  const onFinishRegister = async () => {
    if (!regData.first_name || !regData.last_name) return setError('Ism va familiya majburiy.');
    if (!birthDateIsoValue) return setError('Tug‘ilgan sanani kiriting.');
    if (!regData.region_id || !regData.district_id || !regData.mfy_id) {
      return setError('Viloyat, tuman va MFY ni to‘liq tanlang.');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register({
        phone: rawPhone,
        first_name: regData.first_name.trim(),
        last_name: regData.last_name.trim(),
        gender: regData.gender,
        region_id: regData.region_id,
        district_id: regData.district_id,
        mfy_id: regData.mfy_id,
        birth_date: birthDateIsoValue,
      });
      await persistMarketplaceToken(res.token);
      onAuthSuccess();
    } catch (e: any) {
      setError(e?.message || "Ro'yxatdan o'tishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  const selectorData =
    selector === 'region' ? regionsList : selector === 'district' ? districtsList : selector === 'mfy' ? mfysList : [];
  const filteredSelectorData = selectorData.filter((item: any) =>
    String(item?.name || '')
      .toLowerCase()
      .includes(selectorQuery.trim().toLowerCase())
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 flex-row">
          {SCREEN_WIDTH > 768 ? (
            <View className="flex-1 items-start justify-center bg-gray-900 p-16">
              <View className="mb-12 flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-500">
                  <ShoppingBag color="white" size={24} />
                </View>
                <Text className="text-2xl font-black tracking-tight text-white">MARKETPLACE</Text>
              </View>
              <Text className="text-5xl font-black leading-tight text-white">SMS orqali tez va xavfsiz kirish</Text>
            </View>
          ) : null}

          <View className="flex-1 items-center justify-center bg-gray-50/50 px-4 py-6">
            <View className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-5 shadow-xl sm:rounded-[40px] sm:p-6 md:p-8">
              {onDismiss ? (
                <Pressable
                  onPress={onDismiss}
                  className="mb-4 flex-row items-center gap-2 self-start rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <ArrowLeft size={16} color="#64748b" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">Orqaga</Text>
                </Pressable>
              ) : null}
              <View className="mb-7">
                <Text className="mb-2 text-3xl font-black text-gray-900">
                  {step === 'phone'
                    ? 'Xush kelibsiz!'
                    : step === 'confirm_profile'
                      ? 'Profil tasdiqlash'
                      : step === 'otp'
                        ? 'SMS kod'
                        : "Ro'yxatdan o'tish"}
                </Text>
                <Text className="font-medium text-gray-500" style={{ flexShrink: 1 }}>
                  {step === 'phone'
                    ? 'Telefon raqamni kiriting'
                    : step === 'confirm_profile'
                      ? "Topilgan profil siznikimi?"
                      : step === 'otp'
                        ? `${rawPhone} raqamiga kod yuborildi`
                        : "Ma'lumotlarni to'ldiring"}
                </Text>
              </View>

              {error ? (
                <View className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  <Text className="text-sm font-semibold text-rose-700">{error}</Text>
                </View>
              ) : null}

              {step === 'phone' ? (
                <MotiView from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }} className="gap-6">
                  <View className="gap-2 my-3">
                    <Text className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Telefon</Text>
                    <View className="relative">
                      <View className="absolute left-5 top-1/2 z-10 -mt-2.5">
                        <Phone size={20} color="#9ca3af" />
                      </View>
                      <TextInput
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={onPhoneChange}
                        placeholder="+998 90 123 45 67"
                        placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR}
                        className={AUTH_PHONE_INPUT_CLASS}
                        style={Platform.OS === 'web' ? { marginVertical: 4 } : undefined}
                      />
                    </View>
                  </View>
                  <Pressable
                    onPress={onStartEntry}
                    disabled={loading}
                    className="w-full flex-row items-center justify-center gap-3 rounded-2xl bg-gray-900 py-5"
                  >
                    <Text className="text-lg font-black text-white">{loading ? 'Yuklanmoqda...' : 'Davom etish'}</Text>
                    {!loading ? <ChevronRight color="white" size={20} /> : null}
                  </Pressable>
                </MotiView>
              ) : null}

              {step === 'confirm_profile' && profile ? (
                <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} className="gap-6">
                  <View className="flex-row items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
                      <UserIcon color="white" size={28} />
                    </View>
                    <View>
                      <Text className="text-xl font-black text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </Text>
                      <Text className="font-bold text-gray-500">{profile.phone}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={async () => {
                      if (!pendingToken) {
                        setError('Token topilmadi, qayta urinib ko‘ring.');
                        return;
                      }
                      await persistMarketplaceToken(pendingToken);
                      onAuthSuccess();
                    }}
                    className="items-center rounded-2xl bg-gray-900 py-4"
                  >
                    <Text className="text-lg font-black text-white">Ha, bu men</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setStep('phone');
                      setProfile(null);
                      setFlow(null);
                      setPendingToken(null);
                      setCode(['', '', '', '', '']);
                    }}
                    className="items-center rounded-2xl border-2 border-gray-100 py-4"
                  >
                    <Text className="text-lg font-black text-gray-900">Yo'q, bu men emas</Text>
                  </Pressable>
                </MotiView>
              ) : null}

              {step === 'otp' ? (
                <MotiView
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  className="my-3 gap-6"
                >
                  <View className="my-1 w-full max-w-full flex-row items-center gap-1.5 sm:gap-2">
                    {code.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(v) => onOtpChange(i, v)}
                        className="min-h-[52px] min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 py-0 text-center text-xl font-black text-gray-900 sm:min-h-[60px] sm:rounded-2xl sm:text-2xl"
                        style={{
                          flexGrow: 1,
                          flexShrink: 1,
                          flexBasis: 0,
                          minWidth: 0,
                          textAlign: 'center',
                          ...(Platform.OS === 'web' ? { aspectRatio: 1, marginVertical: 4 } : {}),
                        }}
                      />
                    ))}
                  </View>
                  <View className="my-1 items-center">
                    {secondsLeft > 0 ? (
                      <Text className="text-sm font-bold text-gray-500">Qayta yuborish: {timerLabel}</Text>
                    ) : (
                      <Pressable onPress={onResend} disabled={loading}>
                        <Text className="text-sm font-black text-orange-600">Kodni qayta yuborish</Text>
                      </Pressable>
                    )}
                  </View>
                  <Pressable onPress={onVerifyOtp} disabled={loading} className="mt-2 items-center rounded-2xl bg-gray-900 py-5">
                    <Text className="text-lg font-black text-white">{loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setStep('phone')} className="flex-row items-center justify-center gap-2 py-1">
                    <ArrowLeft size={18} color="#9ca3af" />
                    <Text className="font-bold text-gray-400">Raqamni o'zgartirish</Text>
                  </Pressable>
                </MotiView>
              ) : null}

              {step === 'register' ? (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  className="my-3 gap-5"
                >
                  <View className="flex-row" style={{ columnGap: 12 }}>
                    <TextInput
                      value={regData.first_name}
                      onChangeText={(val) => setRegData((p) => ({ ...p, first_name: val }))}
                      placeholder="Ism"
                      placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR}
                      className={AUTH_INPUT_CLASS}
                      style={{ flex: 1, minWidth: 0, ...(Platform.OS === 'web' ? { marginVertical: 4 } : {}) }}
                    />
                    <TextInput
                      value={regData.last_name}
                      onChangeText={(val) => setRegData((p) => ({ ...p, last_name: val }))}
                      placeholder="Familiya"
                      placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR}
                      className={AUTH_INPUT_CLASS}
                      style={{ flex: 1, minWidth: 0, ...(Platform.OS === 'web' ? { marginVertical: 4 } : {}) }}
                    />
                  </View>

                  {Platform.OS === 'web' ? (
                    <View className="relative min-h-[52px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      {!birthDateIsoValue ? (
                        <View
                          pointerEvents="none"
                          className="absolute inset-0 z-0 flex-row items-center justify-between px-3.5"
                        >
                          <Text className="text-base font-normal text-slate-400">Tug&apos;ilgan sana</Text>
                          <Calendar size={22} color={PARTNER_FORM_PLACEHOLDER_COLOR} />
                        </View>
                      ) : null}
                      <input
                        id="marketplace-auth-birth-date"
                        type="date"
                        value={birthDateIsoValue}
                        min={birthIsoBounds.minIso}
                        max={birthIsoBounds.maxIso}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const [y, m, d] = e.target.value.split('-');
                          if (!y || !m || !d) return;
                          setRegData((prev) => ({
                            ...prev,
                            birth_year: y,
                            birth_month: String(Number(m)),
                            birth_day: String(Number(d)),
                          }));
                        }}
                        className="relative z-10 box-border min-h-[52px] w-full cursor-pointer border-0 bg-transparent px-3.5 py-3.5 text-base font-bold outline-none"
                        style={{
                          margin: '4px 0',
                          color: birthDateIsoValue ? '#111827' : 'transparent',
                          WebkitTextFillColor: birthDateIsoValue ? '#111827' : 'transparent',
                        }}
                      />
                    </View>
                  ) : (
                    <>
                      <Pressable
                        onPress={() => setShowBirthPicker(true)}
                        className="w-full flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3.5"
                      >
                        <Text className={authFieldLabelClass(!!birthDateIsoValue)}>
                          {birthDateIsoValue
                            ? `${regData.birth_day.padStart(2, '0')}.${regData.birth_month.padStart(2, '0')}.${regData.birth_year}`
                            : 'Tug‘ilgan sana'}
                        </Text>
                        <Calendar size={22} color="#9ca3af" />
                      </Pressable>
                      {Platform.OS === 'android' && showBirthPicker ? (
                        <DateTimePicker
                          value={birthDateForPicker()}
                          mode="date"
                          display="default"
                          minimumDate={minBirthDate}
                          maximumDate={maxBirthDate}
                          onChange={(event: DateTimePickerEvent, selected?: Date) => {
                            setShowBirthPicker(false);
                            if (event.type !== 'dismissed' && selected) applyBirthDate(selected);
                          }}
                        />
                      ) : null}
                      {Platform.OS === 'ios' ? (
                        <Modal visible={showBirthPicker} transparent animationType="fade">
                          <View className="flex-1 justify-end bg-black/50">
                            <Pressable className="absolute inset-0" onPress={() => setShowBirthPicker(false)} />
                            <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4">
                              <DateTimePicker
                                value={birthDateForPicker()}
                                mode="date"
                                display="spinner"
                                minimumDate={minBirthDate}
                                maximumDate={maxBirthDate}
                                onChange={(_: DateTimePickerEvent, selected?: Date) => {
                                  if (selected) applyBirthDate(selected);
                                }}
                              />
                              <Pressable onPress={() => setShowBirthPicker(false)} className="mt-3 items-center rounded-2xl bg-gray-900 py-4">
                                <Text className="text-base font-bold text-white">Tayyor</Text>
                              </Pressable>
                            </View>
                          </View>
                        </Modal>
                      ) : null}
                    </>
                  )}

                  <View className="flex-row gap-4">
                    <Pressable
                      onPress={() => setRegData((p) => ({ ...p, gender: 'erkak' }))}
                      className={cn(
                        'flex-1 items-center justify-center rounded-xl border-2 py-4',
                        regData.gender === 'erkak' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                      )}
                    >
                      <Text className={cn('font-bold', regData.gender === 'erkak' ? 'text-orange-600' : 'text-gray-400')}>Erkak</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setRegData((p) => ({ ...p, gender: 'ayol' }))}
                      className={cn(
                        'flex-1 items-center justify-center rounded-xl border-2 py-4',
                        regData.gender === 'ayol' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                      )}
                    >
                      <Text className={cn('font-bold', regData.gender === 'ayol' ? 'text-orange-600' : 'text-gray-400')}>Ayol</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => setSelector('region')} className={AUTH_SELECTOR_CLASS}>
                    <Text className={authFieldLabelClass(!!regData.region_id)}>
                      {regionsList.find((r) => r.id === regData.region_id)?.name || 'Viloyatni tanlang'}
                    </Text>
                    <ChevronRight size={18} color="#9ca3af" />
                  </Pressable>
                  <Pressable
                    onPress={() => setSelector('district')}
                    disabled={!regData.region_id}
                    className={cn(AUTH_SELECTOR_CLASS, 'disabled:opacity-50')}
                  >
                    <Text className={authFieldLabelClass(!!regData.district_id)}>
                      {districtsList.find((d) => d.id === regData.district_id)?.name || 'Tumanni tanlang'}
                    </Text>
                    <ChevronRight size={18} color="#9ca3af" />
                  </Pressable>
                  <Pressable
                    onPress={() => setSelector('mfy')}
                    disabled={!regData.district_id}
                    className={cn(AUTH_SELECTOR_CLASS, 'disabled:opacity-50')}
                  >
                    <Text className={authFieldLabelClass(!!regData.mfy_id)}>
                      {mfysList.find((m) => m.id === regData.mfy_id)?.name || 'MFY ni tanlang'}
                    </Text>
                    <ChevronRight size={18} color="#9ca3af" />
                  </Pressable>

                  <Pressable onPress={onFinishRegister} disabled={loading} className="mt-2 mb-1 items-center rounded-2xl bg-gray-900 py-5">
                    <Text className="text-lg font-black text-white">{loading ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}</Text>
                  </Pressable>
                </MotiView>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={selector !== null} animationType="slide" transparent onRequestClose={() => setSelector(null)}>
        <View className={cn('flex-1 bg-black/40', isTabletUp ? 'items-center justify-center px-6' : 'justify-end')}>
          <Pressable className="absolute inset-0" onPress={() => setSelector(null)} />
          <View
            className={cn('bg-white px-5 pb-8 pt-4', isTabletUp ? 'w-full max-w-md rounded-3xl' : 'max-h-[70%] rounded-t-3xl')}
            style={isTabletUp ? { maxHeight: Math.min(560, windowWidth * 0.8) } : undefined}
          >
            {!isTabletUp ? <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" /> : null}
            <Text className="mb-4 text-lg font-black text-slate-900">
              {selector === 'region' ? 'Viloyat tanlang' : selector === 'district' ? 'Tuman tanlang' : 'MFY tanlang'}
            </Text>
            <View className="mb-3">
              <TextInput
                value={selectorQuery}
                onChangeText={setSelectorQuery}
                placeholder="Qidirish..."
                placeholderTextColor={PARTNER_FORM_PLACEHOLDER_COLOR}
                className={AUTH_INPUT_CLASS}
              />
            </View>
            <ScrollView>
              {filteredSelectorData.map((item: any) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (selector === 'region') selectRegion(item.id);
                    else if (selector === 'district') selectDistrict(item.id);
                    else {
                      setRegData((prev) => ({ ...prev, mfy_id: item.id }));
                      setSelector(null);
                    }
                  }}
                  className="border-b border-slate-100 py-4"
                >
                  <Text className="text-base font-semibold text-slate-800">{item.name}</Text>
                </Pressable>
              ))}
              {filteredSelectorData.length === 0 ? (
                <View className="py-6">
                  <Text className="text-center font-semibold text-slate-400">Hech narsa topilmadi</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
