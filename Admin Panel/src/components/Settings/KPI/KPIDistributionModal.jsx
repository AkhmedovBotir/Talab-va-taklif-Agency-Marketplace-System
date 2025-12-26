import { AnimatePresence, motion } from 'framer-motion';
import { Close, Settings } from '@mui/icons-material';
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
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] mt-0"
          onClick={onClose}
          style={{ marginTop: 0 }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 mt-0"
          style={{ marginTop: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                    <Settings className="w-4 h-4" />
                  </div>
              <div>
                    <h2 className="text-lg font-bold">
                      {editingDistribution ? 'KPI Taqsimlashni Tahrirlash' : 'Yangi KPI Taqsimlash'}
                </h2>
                    <p className="text-xs text-indigo-100 mt-0.5">
                  {editingDistribution
                    ? 'Mavjud taqsimlash qiymatlarini yangilang'
                    : 'Default qiymatlardan foydalanib tezda konfiguratsiya yarating'}
                </p>
                  </div>
              </div>
              <button
                onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
              >
                  <Close className="w-4 h-4" />
              </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <KPIDistributionForm
                defaults={defaults}
                defaultsLoading={defaultsLoading}
                submitting={submitting}
                editingDistribution={editingDistribution}
                onSubmit={onSubmit}
                onCancelEdit={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default KPIDistributionModal;


