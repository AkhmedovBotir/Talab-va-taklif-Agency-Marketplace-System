import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';

const ViewSMSVerificationModal = ({ open, onClose, smsVerification }) => {
  if (!smsVerification) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeBadge = (type) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (type) {
      case 'login':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'register':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'forgot_password':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'login':
        return 'Kirish';
      case 'register':
        return 'Ro\'yxatdan o\'tish';
      case 'forgot_password':
        return 'Parolni tiklash';
      default:
        return type;
    }
  };

  const getStatusBadge = (isUsed, expiresAt) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    const now = new Date();
    const expires = new Date(expiresAt);
    const isExpired = now > expires;

    if (isUsed) {
      return `${baseClasses} bg-gray-100 text-gray-800`;
    } else if (isExpired) {
      return `${baseClasses} bg-red-100 text-red-800`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
  };

  const getStatusLabel = (isUsed, expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const isExpired = now > expires;

    if (isUsed) {
      return 'Ishlatilgan';
    } else if (isExpired) {
      return 'Muddati tugagan';
    } else {
      return 'Faol';
    }
  };

  const now = new Date();
  const expires = new Date(smsVerification.expiresAt);
  const isExpired = now > expires;
  const timeRemaining = isExpired ? null : Math.max(0, Math.floor((expires - now) / 1000 / 60)); // minutes

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800"
        >
          SMS Verifikatsiya ma'lumotlari
        </motion.div>
      </DialogTitle>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {smsVerification.phone || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kod</label>
              <p className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 p-2 rounded">
                {smsVerification.code || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
              <p className="text-sm">
                <span className={getTypeBadge(smsVerification.type)}>
                  {getTypeLabel(smsVerification.type)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm">
                <span className={getStatusBadge(smsVerification.isUsed, smsVerification.expiresAt)}>
                  {getStatusLabel(smsVerification.isUsed, smsVerification.expiresAt)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ishlatilgan</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {smsVerification.isUsed ? 'Ha' : 'Yo\'q'}
              </p>
            </div>
            {timeRemaining !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qolgan vaqt</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {timeRemaining} daqiqa
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(smsVerification.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(smsVerification.updatedAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Muddati</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(smsVerification.expiresAt)}
              </p>
            </div>
          </div>

          {isExpired && !smsVerification.isUsed && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Bu kodning muddati tugagan va endi ishlatib bo'lmaydi.
              </p>
            </div>
          )}

          {smsVerification.isUsed && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                Bu kod allaqachon ishlatilgan.
              </p>
            </div>
          )}
        </motion.div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Yopish
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewSMSVerificationModal;







