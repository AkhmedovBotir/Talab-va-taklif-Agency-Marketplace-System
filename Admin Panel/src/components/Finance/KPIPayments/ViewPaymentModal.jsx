import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { formatDate, formatDateTime } from '../../../utils/dateFormatter';

const ViewPaymentModal = ({ open, onClose, payment, viewMode }) => {
  if (!payment) return null;

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>To'lov Tafsilotlari</DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-4">
          {/* Recipient Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Qabul qiluvchi</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Ism:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">{payment.recipient?.name || '-'}</span>
              </div>
              {payment.recipient?.phone && (
                <div>
                  <span className="text-sm text-gray-600">Telefon:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.recipient.phone}</span>
                </div>
              )}
              {payment.recipient?.viloyat?.name && (
                <div>
                  <span className="text-sm text-gray-600">Viloyat:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.recipient.viloyat.name}</span>
                </div>
              )}
              {payment.recipient?.tuman?.name && (
                <div>
                  <span className="text-sm text-gray-600">Tuman:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.recipient.tuman.name}</span>
                </div>
              )}
              {payment.recipient?.mfy?.name && (
                <div>
                  <span className="text-sm text-gray-600">MFY:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.recipient.mfy.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">To'lov ma'lumotlari</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Turi:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {payment.recipientType === 'agent' ? 'Agent' : 'Punkt'}
                  {payment.agentType && ` (${payment.agentType})`}
                </span>
              </div>
              {viewMode === 'grouped' ? (
                <>
                  <div>
                    <span className="text-sm text-gray-600">Jami summa:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">{formatAmount(payment.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">To'lovlar soni:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">{payment.paymentsCount || 0}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-sm text-gray-600">Summa:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{formatAmount(payment.amount)}</span>
                </div>
              )}
              {payment.status && (
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : payment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status === 'paid' ? 'To\'langan' : payment.status === 'cancelled' ? 'Bekor qilingan' : 'Kutilmoqda'}
                  </span>
                </div>
              )}
              {payment.createdAt && (
                <div>
                  <span className="text-sm text-gray-600">Yaratilgan:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{formatDateTime(payment.createdAt)}</span>
                </div>
              )}
              {payment.paidAt && (
                <div>
                  <span className="text-sm text-gray-600">To'landi:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{formatDateTime(payment.paidAt)}</span>
                </div>
              )}
              {payment.paidBy?.name && (
                <div>
                  <span className="text-sm text-gray-600">To'lovchi:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.paidBy.name}</span>
                </div>
              )}
              {payment.notes && (
                <div>
                  <span className="text-sm text-gray-600">Izoh:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{payment.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Transactions */}
          {payment.kpiTransactions && payment.kpiTransactions.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">KPI Transaksiyalar</h3>
              <div className="space-y-2">
                {payment.kpiTransactions.map((transaction, index) => (
                  <div key={transaction._id || index} className="text-sm text-gray-700">
                    {transaction.order && (
                      <div>
                        <span className="text-gray-600">Buyurtma ID:</span>
                        <span className="ml-2 font-medium">{transaction.order}</span>
                      </div>
                    )}
                    {transaction.totalKpiAmount && (
                      <div>
                        <span className="text-gray-600">Jami KPI summa:</span>
                        <span className="ml-2 font-medium">{formatAmount(transaction.totalKpiAmount)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPaymentModal;


