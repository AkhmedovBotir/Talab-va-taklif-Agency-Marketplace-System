import { motion, AnimatePresence } from 'framer-motion';
import { Close, Store, Person } from '@mui/icons-material';

const SelectAssignmentTypeModal = ({ open, onClose, onSelectPunkt, onSelectAgent }) => {
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Lavozim Turini Tanlang</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Options */}
              <div className="p-6 space-y-4">
                <button
                  onClick={() => {
                    onSelectPunkt();
                    onClose();
                  }}
                  className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                    <Store className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700">
                      Punktga Tayinlash
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sertifikat egasini punkt lavozimiga tayinlash
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectAgent();
                    onClose();
                  }}
                  className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                    <Person className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">
                      Agentga Tayinlash
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sertifikat egasini agent lavozimiga tayinlash (Viloyat/Tuman/MFY Agent)
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SelectAssignmentTypeModal;

