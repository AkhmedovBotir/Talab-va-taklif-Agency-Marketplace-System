import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';

const ViewCommentTemplateModal = ({ open, onClose, template }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!template) return null;

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
                <h2 className="text-2xl font-bold text-gray-800">Kommentariya Shablonini batafsil ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Asosiy ma'lumotlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Matn
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{template.text || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Tartib raqami
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded">{template.order || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Status
                        </label>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            template.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {template.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaqt ma'lumotlari</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Yaratilgan
                        </label>
                        <p className="text-gray-900">{formatDate(template.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Yangilangan
                        </label>
                        <p className="text-gray-900">{formatDate(template.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
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

export default ViewCommentTemplateModal;





