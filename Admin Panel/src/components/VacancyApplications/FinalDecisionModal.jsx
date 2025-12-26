import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, CheckCircle, Cancel } from '@mui/icons-material';
import { vacancyApplicationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const FinalDecisionModal = ({ open, onClose, onSuccess, application }) => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('hired');
  const [reason, setReason] = useState('');
  const [decidedBy, setDecidedBy] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const decisionData = {
        result,
        reason: reason.trim() || undefined,
        decidedBy: decidedBy.trim() || undefined,
      };

      const response = await vacancyApplicationAPI.makeFinalDecision(application._id, decisionData);

      if (response.success) {
        const message = result === 'hired'
          ? 'Yakuniy qaror: Ishga qabul qilindi'
          : 'Yakuniy qaror: Rad etildi';
        
        showSuccess(message);
          onSuccess();
          onClose();
          // Reset form
          setResult('hired');
          setReason('');
          setDecidedBy('');
      }
    } catch (err) {
      showError(err.message || 'Yakuniy qaror qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult('hired');
    setReason('');
    setDecidedBy('');
    onClose();
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Yakuniy qaror qilish</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Eslatma:</strong> Yakuniy qaror qilishdan oldin barcha intervyu bosqichlari
                      yakunlanishi kerak. Agar biror intervyu bosqichi muvaffaqiyatsiz bo'lsa, ishga qabul
                      qilish mumkin emas.
                      {application?.vacancy?.target && (
                        <>
                          <br />
                          <br />
                          <strong>Maqsad:</strong> {application.vacancy.target === 'agent' ? 'Agent' : 'Punkt'}
                          <br />
                          Agar "Ishga qabul qilish" tanlansa, keyin topshirishni{' '}
                          {application.vacancy.target === 'agent' ? 'Agent' : 'Punkt'} ga aylantirishingiz mumkin.
                        </>
                      )}
                    </p>
                  </div>

                {/* Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yakuniy qaror <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="hired"
                        checked={result === 'hired'}
                        onChange={(e) => setResult(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Ishga qabul qilish</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="rejected"
                        checked={result === 'rejected'}
                        onChange={(e) => setResult(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Cancel className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">Rad etish</span>
                    </label>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qaror sababi (ixtiyoriy)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Qaror sababini kiriting..."
                  />
                </div>

                {/* Decided By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qaror qilgan shaxs (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={decidedBy}
                    onChange={(e) => setDecidedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masalan: Ahmadjon Ahmadov"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FinalDecisionModal;



