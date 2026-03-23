import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoPersonCircle,
  IoLockClosed,
  IoEyeOff,
  IoEye,
  IoClose,
  IoLockOpenOutline,
} from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService, getDeviceInfo } from '../services/api';
import styles from './Login.module.css';

function formatPhone(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7)
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

function fullPhone(phone: string): string {
  return '+998' + phone.replace(/\s/g, '');
}

type SetupStep = 'phone' | 'sms' | 'password';
type DeviceStep = 'request' | 'verify';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceVerificationRequired, setDeviceVerificationRequired] = useState(false);

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceStep, setDeviceStep] = useState<DeviceStep>('request');
  const [deviceCode, setDeviceCode] = useState(['', '', '', '', '']);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof getDeviceInfo> | null>(null);
  const deviceInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>('phone');
  const [setupPhone, setSetupPhone] = useState('');
  const [smsCode, setSmsCode] = useState(['', '', '', '', '']);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const smsInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  useEffect(() => {
    if (
      showDeviceModal &&
      deviceStep === 'request' &&
      deviceInfo &&
      phone.replace(/\s/g, '').length === 9
    ) {
      const t = setTimeout(() => requestDeviceCode(), 300);
      return () => clearTimeout(t);
    }
  }, [showDeviceModal, deviceStep, deviceInfo, phone]);

  const requestDeviceCode = async () => {
    if (!deviceInfo) return;
    setDeviceLoading(true);
    try {
      const res = await apiService.requestDeviceVerificationCode({
        phone: fullPhone(phone),
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent: deviceInfo.userAgent,
      });
      if (res.success) {
        setDeviceStep('verify');
        setTimeout(() => deviceInputRefs.current[0]?.focus(), 200);
      } else {
        setError(res.message || 'Kod yuborishda xatolik');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || 'Kod yuborishda xatolik';
      if (
        msg.toLowerCase().includes('qurilma topilmadi') ||
        msg.toLowerCase().includes('device not found')
      ) {
        setShowDeviceModal(false);
        resetDeviceVerification();
      }
      setError(msg);
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleDeviceCodeChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...deviceCode];
    next[index] = v;
    setDeviceCode(next);
    if (v && index < 4) deviceInputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && index === 4) verifyDeviceCode(next.join(''));
  };

  const verifyDeviceCode = async (code?: string) => {
    if (!deviceInfo) return;
    const c = code || deviceCode.join('');
    if (c.length !== 5) {
      setError("Kod 5 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    setDeviceLoading(true);
    setError('');
    try {
      const res = await apiService.verifyDevice({
        phone: fullPhone(phone),
        deviceId: deviceInfo.deviceId,
        code: c,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent: deviceInfo.userAgent,
      });
      if (res.success) {
        setShowDeviceModal(false);
        resetDeviceVerification();
        setDeviceVerificationRequired(false);
        setError('');
        setLoading(true);
        try {
          await login({ phone: fullPhone(phone), password }, deviceInfo);
          navigate('/', { replace: true });
        } catch {
          setError("Kirishda xatolik. Qaytadan urinib ko'ring.");
        } finally {
          setLoading(false);
        }
      } else {
        setError(res.message || "Kod noto'g'ri");
        setDeviceCode(['', '', '', '', '']);
        deviceInputRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Kod noto'g'ri");
      setDeviceCode(['', '', '', '', '']);
      deviceInputRefs.current[0]?.focus();
    } finally {
      setDeviceLoading(false);
    }
  };

  const resetDeviceVerification = () => {
    setDeviceStep('request');
    setDeviceCode(['', '', '', '', '']);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeviceVerificationRequired(false);
    const digits = phone.replace(/\s/g, '');
    if (digits.length !== 9) {
      setError("Telefon raqami 9 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    if (!password.trim()) {
      setError('Parol kiritilishi shart');
      return;
    }
    setLoading(true);
    try {
      await login(
        { phone: fullPhone(phone), password },
        deviceInfo || getDeviceInfo()
      );
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; requiresDeviceVerification?: boolean } };
        status?: number;
      };
      const msg = ax.response?.data?.message || (err instanceof Error ? err.message : '');
      const status = ax.response?.status ?? 0;
      const requiresDevice =
        ax.response?.data?.requiresDeviceVerification === true ||
        /qurilma|device|tasdiqlash|yangi qurilma/i.test(msg);

      if ((status === 403 || status === 400) && requiresDevice) {
        setDeviceVerificationRequired(true);
        setError('Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak');
        setShowDeviceModal(true);
        setDeviceStep('request');
      } else {
        if (status === 401) setError('Telefon raqami yoki parol noto\'g\'ri');
        else if (msg) setError(msg);
        else setError('Kirishda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeviceModal = () => {
    setError('');
    setShowDeviceModal(true);
    setDeviceStep('request');
  };

  const handlePasswordSetupStep1 = async () => {
    if (setupPhone.replace(/\s/g, '').length !== 9) {
      setError("Telefon raqami 9 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    setSetupLoading(true);
    setError('');
    try {
      const res = await apiService.passwordSetupStep1({ phone: fullPhone(setupPhone) });
      if (res.success) {
        setSetupStep('sms');
        setTimeout(() => smsInputRefs.current[0]?.focus(), 100);
      } else setError(res.message || 'Xatolik');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSmsCodeChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...smsCode];
    next[index] = v;
    setSmsCode(next);
    if (v && index < 4) smsInputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && index === 4) handlePasswordSetupStep2(next.join(''));
  };

  const handlePasswordSetupStep2 = async (code?: string) => {
    const c = code || smsCode.join('');
    if (c.length !== 5) {
      setError("Kod 5 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    setSetupLoading(true);
    setError('');
    try {
      const res = await apiService.passwordSetupStep2({
        phone: fullPhone(setupPhone),
        code: c,
      });
      if (res.success) {
        setSetupStep('password');
      } else setError(res.message || "Kod noto'g'ri");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Kod noto'g'ri");
      setSmsCode(['', '', '', '', '']);
      smsInputRefs.current[0]?.focus();
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePasswordSetupStep3 = async () => {
    if (setupPassword.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (setupPassword !== setupPasswordConfirm) {
      setError('Parollar mos kelmaydi');
      return;
    }
    setSetupLoading(true);
    setError('');
    try {
      const res = await apiService.passwordSetupStep3({
        phone: fullPhone(setupPhone),
        newPassword: setupPassword,
      });
      if (res.success) {
        const dev = deviceInfo || getDeviceInfo();
        await login(
          { phone: fullPhone(setupPhone), password: setupPassword },
          dev
        );
        setShowPasswordSetup(false);
        setSetupStep('phone');
        setSetupPhone('');
        setSmsCode(['', '', '', '', '']);
        setSetupPassword('');
        setSetupPasswordConfirm('');
        navigate('/', { replace: true });
      } else setError(res.message || 'Xatolik');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Parol o'rnatishda xatolik");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.iconWrap}>
            <IoPersonCircle size={64} color="#007AFF" />
          </div>
          <h1 className={styles.title}>Kontragent</h1>
          <p className={styles.subtitle}>Tizimga kirish</p>
        </header>

        <form className={styles.card} onSubmit={handleLogin}>
          <div className={styles.field}>
            <label className={styles.label}>Telefon raqami</label>
            <div className={styles.inputWrap}>
              <span className={styles.prefix}>+998</span>
              <span className={styles.divider} />
              <input
                className={styles.input}
                type="tel"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={12}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parol</label>
            <div className={styles.inputWrap}>
              <IoLockClosed size={20} color="#666" className={styles.inputIcon} />
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Yashirish' : "Ko'rsatish"}
              >
                {showPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
              </button>
            </div>
          </div>

          {deviceVerificationRequired && (
            <div className={styles.deviceWarning}>
              <p className={styles.deviceWarningText}>
                Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak
              </p>
              <button
                type="button"
                className={styles.deviceWarningBtn}
                onClick={openDeviceModal}
              >
                Qurilmani tasdiqlash
              </button>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Kiring...' : 'Kirish'}
          </button>

          <div className={styles.dividerWrap}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>yoki</span>
            <span className={styles.dividerLine} />
          </div>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setError('');
              setShowPasswordSetup(true);
              setSetupStep('phone');
              setSetupPhone('');
              setSmsCode(['', '', '', '', '']);
              setSetupPassword('');
              setSetupPasswordConfirm('');
            }}
          >
            <IoLockOpenOutline size={20} color="#007AFF" />
            Yangi foydalanuvchi uchun
          </button>
        </form>
      </div>

      {/* Device verification modal */}
      {showDeviceModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!deviceLoading) {
              setShowDeviceModal(false);
              resetDeviceVerification();
              setDeviceVerificationRequired(false);
            }
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Qurilmani tasdiqlash</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() =>
                  !deviceLoading &&
                  (setShowDeviceModal(false), resetDeviceVerification())
                }
                aria-label="Yopish"
              >
                <IoClose size={24} />
              </button>
            </div>
            {deviceStep === 'request' && (
              <div className={styles.modalBody}>
                <p className={styles.modalDesc}>
                  SMS orqali yuboriladigan tasdiqlash kodini so'raymiz.
                </p>
                {deviceLoading ? (
                  <p className={styles.modalLoading}>Kod yuborilmoqda...</p>
                ) : null}
              </div>
            )}
            {deviceStep === 'verify' && (
              <div className={styles.modalBody}>
                <p className={styles.modalDesc}>
                  {fullPhone(phone)} raqamiga yuborilgan 5 xonali kodni kiriting
                </p>
                <div className={styles.smsRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        deviceInputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={styles.smsInput}
                      value={deviceCode[i]}
                      onChange={(e) =>
                        handleDeviceCodeChange(i, e.target.value)
                      }
                      onKeyDown={(e) =>
                        e.key === 'Backspace' &&
                        !deviceCode[i] &&
                        deviceInputRefs.current[i - 1]?.focus()
                      }
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={requestDeviceCode}
                  disabled={deviceLoading}
                >
                  Kodni qayta yuborish
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  disabled={
                    deviceLoading || deviceCode.some((d) => !d)
                  }
                  onClick={() => verifyDeviceCode()}
                >
                  {deviceLoading ? 'Kutilmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password setup modal */}
      {showPasswordSetup && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            !setupLoading && (setShowPasswordSetup(false), setError(''))
          }
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {setupStep === 'phone' && "Parol o'rnatish"}
                {setupStep === 'sms' && 'SMS kod'}
                {setupStep === 'password' && 'Yangi parol'}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() =>
                  !setupLoading && setShowPasswordSetup(false)
                }
                aria-label="Yopish"
              >
                <IoClose size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {setupStep === 'phone' && (
                <>
                  <label className={styles.label}>Telefon raqami</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.prefix}>+998</span>
                    <span className={styles.divider} />
                    <input
                      className={styles.input}
                      type="tel"
                      placeholder="90 123 45 67"
                      value={setupPhone}
                      onChange={(e) =>
                        setSetupPhone(formatPhone(e.target.value))
                      }
                      maxLength={12}
                    />
                  </div>
                  {error && <p className={styles.error}>{error}</p>}
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={handlePasswordSetupStep1}
                    disabled={setupLoading}
                  >
                    {setupLoading ? 'Kutilmoqda...' : 'Kod olish'}
                  </button>
                </>
              )}
              {setupStep === 'sms' && (
                <>
                  <p className={styles.modalDesc}>
                    {fullPhone(setupPhone)} raqamiga yuborilgan 5 xonali kodni
                    kiriting
                  </p>
                  <div className={styles.smsRow}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          smsInputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={styles.smsInput}
                        value={smsCode[i]}
                        onChange={(e) =>
                          handleSmsCodeChange(i, e.target.value)
                        }
                        onKeyDown={(e) =>
                          e.key === 'Backspace' &&
                          !smsCode[i] &&
                          smsInputRefs.current[i - 1]?.focus()
                        }
                      />
                    ))}
                  </div>
                  {error && <p className={styles.error}>{error}</p>}
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => handlePasswordSetupStep2()}
                    disabled={setupLoading}
                  >
                    {setupLoading ? 'Kutilmoqda...' : 'Davom etish'}
                  </button>
                </>
              )}
              {setupStep === 'password' && (
                <>
                  <label className={styles.label}>Yangi parol</label>
                  <div className={styles.inputWrap}>
                    <IoLockClosed
                      size={20}
                      color="#666"
                      className={styles.inputIcon}
                    />
                    <input
                      className={styles.input}
                      type={setupShowPassword ? 'text' : 'password'}
                      placeholder="Kamida 6 ta belgi"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setSetupShowPassword((v) => !v)}
                    >
                      {setupShowPassword ? (
                        <IoEye size={20} />
                      ) : (
                        <IoEyeOff size={20} />
                      )}
                    </button>
                  </div>
                  <label className={styles.label}>Parolni takrorlang</label>
                  <div className={styles.inputWrap}>
                    <IoLockClosed
                      size={20}
                      color="#666"
                      className={styles.inputIcon}
                    />
                    <input
                      className={styles.input}
                      type="password"
                      placeholder="Takrorlang"
                      value={setupPasswordConfirm}
                      onChange={(e) =>
                        setSetupPasswordConfirm(e.target.value)
                      }
                    />
                  </div>
                  {error && <p className={styles.error}>{error}</p>}
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={handlePasswordSetupStep3}
                    disabled={setupLoading}
                  >
                    {setupLoading ? "Kutilmoqda..." : "Parol o'rnatish va kirish"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
