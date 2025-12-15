import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { kpiPaymentAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';

const MarkAsPaidModal = ({ open, onClose, paymentIds, viewMode, onSuccess }) => {
  const { showError, showSuccess } = useSnackbar();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (paymentIds.length === 0) {
      showError('Iltimos, kamida bitta to\'lovni tanlang');
      return;
    }

    setLoading(true);
    try {
      // If grouped view, we need to fetch individual payment IDs for selected recipients
      let actualPaymentIds = paymentIds;
      
      if (viewMode === 'grouped') {
        // For grouped view, we need to get all unpaid payments for selected recipients
        // This is a simplified approach - in production, you might want to fetch these
        const response = await kpiPaymentAPI.getUnpaidPayments({ limit: 1000 });
        if (response.success) {
          const allPayments = response.data || [];
          actualPaymentIds = allPayments
            .filter(p => paymentIds.includes(p.recipient?._id?.toString()))
            .map(p => p._id);
        }
      }

      const response = await kpiPaymentAPI.markAsPaid(actualPaymentIds, notes);
      if (response.success) {
        showSuccess(response.message || `${response.count || actualPaymentIds.length} ta to'lov muvaffaqiyatli to'landi deb belgilandi`);
        setNotes('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      showError(err.message || 'To\'lovlarni belgilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>To'lovlarni "To'landi" Deb Belgilash</DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gray-600">
            {paymentIds.length} ta to'lov "to'landi" deb belgilanadi. Iltimos, qo'shimcha ma'lumotlarni kiriting.
          </p>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Izoh (ixtiyoriy)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Masalan: Plastik karta orqali to'landi"
            variant="outlined"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Bekor qilish
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || paymentIds.length === 0}
        >
          {loading ? 'Jarayonda...' : 'Tasdiqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkAsPaidModal;


