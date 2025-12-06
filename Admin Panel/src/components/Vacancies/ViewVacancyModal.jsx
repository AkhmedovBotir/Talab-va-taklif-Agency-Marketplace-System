import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { vacancyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const ViewVacancyModal = ({ open, onClose, vacancy }) => {
  const { showError } = useSnackbar();
  const [vacancyData, setVacancyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (open && vacancy) {
      fetchVacancyDetails();
    }
  }, [open, vacancy]);

  const fetchVacancyDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vacancyAPI.getVacancyById(vacancy._id);
      if (response.success) {
        setVacancyData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'Vakansiyani yuklashda xatolik';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

  const getTargetLabel = (target) => {
    switch (target) {
      case 'agent':
        return 'Agent';
      case 'punkt':
        return 'Punkt';
      default:
        return target;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'fulltime':
        return 'To\'liq kunlik';
      case 'parttime':
        return 'Yarim kunlik';
      default:
        return type;
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      text: 'Text',
      textarea: 'Textarea',
      number: 'Number',
      email: 'Email',
      phone: 'Telefon',
      select: 'Select',
      radio: 'Radio',
      checkbox: 'Checkbox',
      date: 'Sana',
      file: 'Fayl',
    };
    return labels[type] || type;
  };

  const displayData = vacancyData || vacancy;
  if (!displayData) return null;

  // Convert delta to HTML for display using a temporary Quill instance
  const deltaToHtml = (delta) => {
    if (!delta?.ops) return '';
    // Create a hidden container
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    try {
      const q = new Quill(container, {
        theme: 'snow',
        readOnly: true,
        modules: { toolbar: false },
      });
      q.setContents(delta);
      const html = q.root.innerHTML;
      return html;
    } catch (err) {
      console.error('Delta render error', err);
      return '';
    } finally {
      document.body.removeChild(container);
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
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Vakansiya batafsil ma'lumotlari</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                ) : displayData ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Asosiy ma'lumotlar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Nomi</label>
                          <p className="text-gray-900">{displayData.name || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Maqsad</label>
                          <p className="text-gray-900">{getTargetLabel(displayData.target)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Ish turi</label>
                          <p className="text-gray-900">{getTypeLabel(displayData.type)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Tajriba</label>
                          <p className="text-gray-900">{displayData.experience || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Maosh</label>
                          <p className="text-gray-900">{displayData.salary || '-'}</p>
                        </div>
                        {displayData.minAge && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Yosh oralig'i</label>
                            <p className="text-gray-900">
                              {displayData.minAge} - {displayData.maxAge || '∞'} yosh
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {displayData.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ish tavsifi</h3>
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="ql-snow">
                            <div
                              className="ql-editor"
                              dangerouslySetInnerHTML={{ __html: deltaToHtml(displayData.description) }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {displayData.responsibilities && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Majburiyatlar</h3>
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="ql-snow">
                            <div
                              className="ql-editor"
                              dangerouslySetInnerHTML={{ __html: deltaToHtml(displayData.responsibilities) }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preferences */}
                    {displayData.preferences && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Afzalliklar</h3>
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="ql-snow">
                            <div
                              className="ql-editor"
                              dangerouslySetInnerHTML={{ __html: deltaToHtml(displayData.preferences) }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {displayData.skills && displayData.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ko'nikmalar</h3>
                        <div className="flex flex-wrap gap-2">
                          {displayData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions */}
                    {displayData.questions && displayData.questions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Savollar ({displayData.questions.length})
                        </h3>
                        <div className="space-y-3">
                          {displayData.questions.map((q, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-md">
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-gray-900">
                                  {index + 1}. {q.question}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {getQuestionTypeLabel(q.type)} {q.required && '(Majburiy)'}
                                </span>
                              </div>
                              {q.placeholder && (
                                <p className="text-sm text-gray-500">Placeholder: {q.placeholder}</p>
                              )}
                              {q.options && q.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Variantlar:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {q.options.map((option, optIdx) => (
                                      <li key={optIdx} className="text-sm text-gray-700">
                                        {option}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vaqt belgilari</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yaratilgan sana
                          </label>
                          <p className="text-gray-900">{formatDate(displayData.createdAt)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Yangilangan sana
                          </label>
                          <p className="text-gray-900">{formatDate(displayData.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Ma'lumotlar yuklanmoqda...</p>
                )}
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

export default ViewVacancyModal;

