import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Close,
  Phone,
  Verified,
  Refresh,
  Security,
} from '@mui/icons-material';
import { deviceVerificationAPI } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';

const DeviceVerificationModal = ({ open, onClose, onSuccess, phone, username, deviceId, deviceInfo, isInactiveDevice = false }) => {
  const { showSuccess, showError } = useSnackbar();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  
  // Determine identifier type and value
  const identifier = username || phone;
  const identifierType = username ? 'username' : 'phone';

  useEffect(() => {
    if (open) {
      // Request verification code when modal opens
      requestCode();
      // Focus first input
      if (inputRefs.current[0]) {
        setTimeout(() => inputRefs.current[0].focus(), 100);
      }
    } else {
      // Reset code when modal closes
      setCode(['', '', '', '', '']);
      setResendCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    // Countdown timer for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const requestCode = async () => {
    try {
      setLoading(true);
      const response = await deviceVerificationAPI.requestAdminCode(
        identifier,
        {
          deviceId,
          ...deviceInfo,
        },
        identifierType
      );
      
      if (response.success) {
        showSuccess('Tasdiqlash kodi yuborildi');
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      showError(error.message || 'Kod yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    try {
      setResendLoading(true);
      const response = await deviceVerificationAPI.resendAdminCode(
        identifier,
        deviceId,
        identifierType
      );
      
      if (response.success) {
        showSuccess('Tasdiqlash kodi qayta yuborildi');
        setResendCooldown(60); // 60 second cooldown
        setCode(['', '', '', '', '']); // Reset code inputs
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (error) {
      showError(error.message || 'Kod yuborishda xatolik');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 4 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
    
    // Auto-submit when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 5).split('');
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 5) {
            newCode[i] = digit;
          }
        });
        setCode(newCode);
        if (digits.length === 5) {
          handleVerify(newCode.join(''));
        } else if (inputRefs.current[digits.length]) {
          inputRefs.current[digits.length].focus();
        }
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 5).split('');
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 5) {
        newCode[i] = digit;
      }
    });
    setCode(newCode);
    if (digits.length === 5) {
      handleVerify(newCode.join(''));
    } else if (inputRefs.current[digits.length]) {
      inputRefs.current[digits.length].focus();
    }
  };

  const handleVerify = async (verificationCode = null) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 5) {
      showError('Iltimos, 5 raqamli kodni kiriting');
      return;
    }
    
    try {
      setLoading(true);
      const response = await deviceVerificationAPI.verifyAdminDevice(
        identifier,
        deviceId,
        codeToVerify,
        deviceInfo,
        identifierType
      );
      
      if (response.success) {
        showSuccess('Qurilma muvaffaqiyatli tasdiqlandi');
        onSuccess();
      }
    } catch (error) {
      showError(error.message || 'Tasdiqlashda xatolik');
      // Clear code on error
      setCode(['', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <Close />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Security style={{ fontSize: 28 }} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Qurilma Tasdiqlash</h2>
                <p className="text-sm text-white/80">SMS kodni kiriting</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Info Message */}
            <div className={`mb-6 p-4 border rounded-xl ${isInactiveDevice ? 'bg-orange-50 border-orange-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-start gap-3">
                <Phone className={`mt-0.5 ${isInactiveDevice ? 'text-orange-600' : 'text-indigo-600'}`} style={{ fontSize: 20 }} />
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${isInactiveDevice ? 'text-orange-900' : 'text-indigo-900'}`}>
                    {isInactiveDevice ? 'Qurilma nofaol' : 'SMS kod yuborildi'}
                  </p>
                  <p className={`text-xs ${isInactiveDevice ? 'text-orange-700' : 'text-indigo-700'}`}>
                    {isInactiveDevice 
                      ? `Bu qurilma nofaol. SMS kod orqali qurilmani qayta aktivlashtirish uchun ${phone ? phone + ' raqamiga' : username + ' foydalanuvchisiga'} yuborilgan 5 raqamli kodni kiriting`
                      : `${phone ? phone + ' raqamiga' : username + ' foydalanuvchisiga'} yuborilgan 5 raqamli kodni kiriting`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Tasdiqlash kodi
              </label>
              <div className="flex justify-center gap-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={loading}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                ))}
              </div>
            </div>

            {/* Resend Code */}
            <div className="mb-6 text-center">
              <button
                onClick={handleResendCode}
                disabled={resendLoading || resendCooldown > 0}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <Refresh
                  className={resendLoading ? 'animate-spin' : ''}
                  style={{ fontSize: 18 }}
                />
                {resendCooldown > 0
                  ? `Qayta yuborish (${resendCooldown}s)`
                  : 'Kodni qayta yuborish'}
              </button>
            </div>

            {/* Verify Button */}
            <motion.button
              onClick={() => handleVerify()}
              disabled={loading || code.some(digit => !digit)}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <Verified style={{ fontSize: 20 }} />
                  <span>Tasdiqlash</span>
                </>
              )}
            </motion.button>

            {/* Warning */}
            <p className="mt-4 text-xs text-center text-gray-500">
              Kod 5 daqiqa amal qiladi
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeviceVerificationModal;

