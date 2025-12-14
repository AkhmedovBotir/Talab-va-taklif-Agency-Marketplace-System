import { motion, AnimatePresence } from 'framer-motion';
import { Close, Person, Phone, AttachMoney, Receipt, CalendarToday, CheckCircle, Cancel, Pending } from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateFormatter';

const ViewSubmissionModal = ({ open, onClose, submission }) => {
  if (!submission) return null;

  const formatAmountValue = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Tasdiqlangan';
      case 'rejected':
        return 'Rad etilgan';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <Cancel className="w-5 h-5" />;
      case 'pending':
        return <Pending className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getAgentTypeLabel = (type) => {
    switch (type) {
      case 'mfy':
        return 'MFY Agent';
      case 'tuman':
        return 'Tuman Agent';
      case 'viloyat':
        return 'Viloyat Agent';
      default:
        return type;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Topshiruv Batafsil Ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 ${getStatusBadge(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span>{getStatusLabel(submission.status)}</span>
                  </div>
                </div>

                {/* Agent Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Person className="text-indigo-600" />
                    Agent Ma'lumotlari
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-32">Ism:</span>
                      <span className="text-sm text-gray-900 flex-1">
                        {submission.fromAgent?.name || '-'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-32">Telefon:</span>
                      <span className="text-sm text-gray-900 flex-1 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {submission.fromAgent?.phone || '-'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-32">Agent turi:</span>
                      <span className="text-sm text-gray-900 flex-1">
                        {getAgentTypeLabel(submission.fromAgentType)}
                      </span>
                    </div>
                    {submission.fromAgent?.viloyat && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-32">Viloyat:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {submission.fromAgent.viloyat?.name || '-'}
                        </span>
                      </div>
                    )}
                    {submission.fromAgent?.tuman && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-32">Tuman:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {submission.fromAgent.tuman?.name || '-'}
                        </span>
                      </div>
                    )}
                    {submission.fromAgent?.mfy && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-32">MFY:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {submission.fromAgent.mfy?.name || '-'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AttachMoney className="text-indigo-600" />
                    Moliyaviy Ma'lumotlar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AttachMoney className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Jami Summa</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatAmountValue(submission.amount)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Transaksiyalar Soni</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {submission.transactionsCount || 0} ta
                      </p>
                    </div>
                    {submission.cashAmount !== undefined && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AttachMoney className="text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Naqd Summa</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">
                          {formatAmountValue(submission.cashAmount)}
                        </p>
                      </div>
                    )}
                    {submission.cardAmount !== undefined && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AttachMoney className="text-indigo-600" />
                          <span className="text-sm font-medium text-gray-600">Karta Summasi</span>
                        </div>
                        <p className="text-xl font-bold text-indigo-900">
                          {formatAmountValue(submission.cardAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CalendarToday className="text-indigo-600" />
                    Sana Ma'lumotlari
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-40">Topshiruv sanasi:</span>
                      <span className="text-sm text-gray-900 flex-1">
                        {formatDateTime(submission.submissionDate)}
                      </span>
                    </div>
                    {submission.createdAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Yaratilgan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(submission.createdAt)}
                        </span>
                      </div>
                    )}
                    {submission.confirmedAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Tasdiqlangan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(submission.confirmedAt)}
                        </span>
                      </div>
                    )}
                    {submission.rejectedAt && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-40">Rad etilgan:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {formatDateTime(submission.rejectedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {submission.toAgent && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Qabul Qiluvchi Agent</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-32">Ism:</span>
                        <span className="text-sm text-gray-900 flex-1">
                          {submission.toAgent?.name || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  Yopish
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewSubmissionModal;

