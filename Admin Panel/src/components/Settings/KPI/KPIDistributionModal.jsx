import { AnimatePresence, motion } from 'framer-motion';
import { Close } from '@mui/icons-material';
import KPIDistributionForm from './KPIDistributionForm';

const KPIDistributionModal = ({
  open,
  onClose,
  defaults,
  defaultsLoading,
  submitting,
  editingDistribution,
  onSubmit,
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-[99] mt-0"
          onClick={onClose}
          style={{ marginTop: 0 }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 mt-0"
          style={{ marginTop: 0 }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingDistribution ? 'KPI taqsimlashni tahrirlash' : 'Yangi KPI taqsimlash'}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingDistribution
                    ? 'Mavjud taqsimlash qiymatlarini yangilang'
                    : 'Default qiymatlardan foydalanib tezda konfiguratsiya yarating'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close />
              </button>
            </div>

            <div className="p-6">
              <KPIDistributionForm
                defaults={defaults}
                defaultsLoading={defaultsLoading}
                submitting={submitting}
                editingDistribution={editingDistribution}
                onSubmit={onSubmit}
                onCancelEdit={onClose}
              />
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default KPIDistributionModal;


