import { useState } from 'react';
import { motion } from 'framer-motion';
import { kpiPaymentAPI } from '../../../services/api';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { Sync, Refresh, CheckCircle, Add } from '@mui/icons-material';

const SyncPaymentsTab = () => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const response = await kpiPaymentAPI.syncPayments();
      if (response.success) {
        setSyncResult(response);
        showSuccess(response.message || 'KPI to\'lovlari muvaffaqiyatli sinxronlashtirildi');
      }
    } catch (err) {
      showError(err.message || 'Sinxronlashtirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Sync className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">KPI To'lovlarini Sinxronlashtirish</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bu funksiya KPI transaksiyalardan to'lovlarni avtomatik yaratadi yoki yangilaydi.
            Barcha to'lanmagan KPI transaksiyalar ko'rib chiqiladi va tegishli to'lovlar yaratiladi.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Qanday ishlaydi?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Barcha <code className="bg-blue-100 px-1 rounded">isPaid: false</code> bo'lgan KPI transaksiyalar ko'rib chiqiladi</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Har bir transaksiya uchun quyidagilar yaratiladi/yangilanadi:</span>
            </li>
            <li className="ml-7 space-y-1">
              <div>• Punkt uchun to'lov (agar <code className="bg-blue-100 px-1 rounded">amounts.punkt &gt; 0</code>)</div>
              <div>• Viloyat agent uchun to'lov (agar <code className="bg-blue-100 px-1 rounded">amounts.viloyatAgent &gt; 0</code>)</div>
              <div>• Tuman agent uchun to'lov (agar <code className="bg-blue-100 px-1 rounded">amounts.tumanAgent &gt; 0</code>)</div>
              <div>• MFY agent uchun to'lov (agar <code className="bg-blue-100 px-1 rounded">amounts.mfyAgent &gt; 0</code>)</div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Agar to'lov allaqachon mavjud bo'lsa, faqat summa yangilanadi</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSync}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Sinxronlashtirilmoqda...
              </>
            ) : (
              <>
                <Sync className="w-5 h-5" />
                Sinxronlashtirish
              </>
            )}
          </button>
        </div>

        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Sinxronlashtirish natijasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Add className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Yaratilgan</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{syncResult.created || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Refresh className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Yangilangan</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{syncResult.updated || 0}</p>
              </div>
            </div>
            {syncResult.message && (
              <p className="mt-4 text-sm text-green-800">{syncResult.message}</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SyncPaymentsTab;


