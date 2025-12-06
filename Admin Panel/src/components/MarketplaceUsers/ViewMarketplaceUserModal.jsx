import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';

const ViewMarketplaceUserModal = ({ open, onClose, marketplaceUser }) => {
  if (!marketplaceUser) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Nofaol';
      default:
        return status;
    }
  };

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 'erkak':
        return 'Erkak';
      case 'ayol':
        return 'Ayol';
      default:
        return gender || '-';
    }
  };

  const getPhoneVerifiedBadge = (isVerified) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    if (isVerified) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800"
        >
          Marketplace Foydalanuvchi Ma'lumotlari
        </motion.div>
      </DialogTitle>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Avatar */}
          {marketplaceUser.avatar && (
            <div className="flex justify-center mb-4">
              <img
                src={marketplaceUser.avatar}
                alt={`${marketplaceUser.firstName} ${marketplaceUser.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {marketplaceUser.firstName || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {marketplaceUser.lastName || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-medium">
                {marketplaceUser.phone || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jins</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {getGenderLabel(marketplaceUser.gender)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(marketplaceUser.birthDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon tasdiqlangan</label>
              <p className="text-sm">
                <span className={getPhoneVerifiedBadge(marketplaceUser.isPhoneVerified)}>
                  {marketplaceUser.isPhoneVerified ? 'Ha' : 'Yo\'q'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm">
                <span className={getStatusBadge(marketplaceUser.status)}>
                  {getStatusLabel(marketplaceUser.status)}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {marketplaceUser.viloyat?.name || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuman</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {marketplaceUser.tuman?.name || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MFY</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {marketplaceUser.mfy?.name || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(marketplaceUser.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(marketplaceUser.updatedAt)}
              </p>
            </div>
          </div>

          {/* Region Details */}
          {(marketplaceUser.viloyat || marketplaceUser.tuman || marketplaceUser.mfy) && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
              <h4 className="text-sm font-medium text-indigo-900 mb-2">Joylashuv ma'lumotlari</h4>
              <div className="space-y-1 text-sm text-indigo-700">
                {marketplaceUser.viloyat && (
                  <p>
                    <span className="font-medium">Viloyat:</span> {marketplaceUser.viloyat.name}
                    {marketplaceUser.viloyat.code && ` (${marketplaceUser.viloyat.code})`}
                  </p>
                )}
                {marketplaceUser.tuman && (
                  <p>
                    <span className="font-medium">Tuman:</span> {marketplaceUser.tuman.name}
                    {marketplaceUser.tuman.code && ` (${marketplaceUser.tuman.code})`}
                  </p>
                )}
                {marketplaceUser.mfy && (
                  <p>
                    <span className="font-medium">MFY:</span> {marketplaceUser.mfy.name}
                    {marketplaceUser.mfy.code && ` (${marketplaceUser.mfy.code})`}
                  </p>
                )}
              </div>
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

export default ViewMarketplaceUserModal;





