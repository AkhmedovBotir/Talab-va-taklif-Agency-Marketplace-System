import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Person, Phone, CalendarToday, Assignment, School, Star, CheckCircle, Cancel } from '@mui/icons-material';
import { certificateAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { formatTableDate } from '../../utils/dateFormatter';

const ViewCertificateModal = ({ open, onClose, certificateCode, onAssign }) => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && certificateCode) {
      fetchCertificateData();
    } else {
      setCertificateData(null);
      setError('');
    }
  }, [open, certificateCode]);

  const fetchCertificateData = async () => {
    setLoading(true);
    setError('');
    try {
      // Try by certificate number first
      const response = await certificateAPI.getCandidateByCertificateNumber(certificateCode);
      if (response.success) {
        setCertificateData(response.data);
      }
    } catch (err) {
      // If certificate number fails, try as certificate ID
      try {
        const response = await certificateAPI.getCandidateByCertificateId(certificateCode);
        if (response.success) {
          setCertificateData(response.data);
        }
      } catch (err2) {
        const errorMsg = err.message || err2.message || 'Sertifikat ma\'lumotlarini olishda xatolik';
        setError(errorMsg);
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCertificateData(null);
    setError('');
    onClose();
  };

  const handleAssignClick = () => {
    if (certificateData) {
      onAssign(certificateData);
      handleClose();
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
            onClick={handleClose}
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
                <h2 className="text-2xl font-bold text-gray-800">Sertifikat Ma'lumotlari</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : certificateData ? (
                  <div className="space-y-6">
                    {/* Certificate Info */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <Assignment className="w-5 h-5" />
                        Sertifikat Ma'lumotlari
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Sertifikat raqami</p>
                          <p className="text-base font-medium text-gray-900">{certificateData.certificate?.certificateNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Berilgan sana</p>
                          <p className="text-base font-medium text-gray-900">
                            {certificateData.certificate?.issuedDate 
                              ? formatTableDate(certificateData.certificate.issuedDate)
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            certificateData.certificate?.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {certificateData.certificate?.status === 'active' ? 'Faol' : 'Bekor qilingan'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">QR Kod</p>
                          <p className="text-base font-medium text-gray-900 font-mono text-xs break-all">
                            {certificateData.certificate?.qrCode || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Person className="w-5 h-5" />
                        Nomzod Ma'lumotlari
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">To'liq ism</p>
                          <p className="text-base font-medium text-gray-900">{certificateData.candidate?.fullName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telefon raqami</p>
                          <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {certificateData.candidate?.phone || '-'}
                          </p>
                        </div>
                        {certificateData.candidate?.telegramId && (
                          <div>
                            <p className="text-sm text-gray-600">Telegram ID</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.candidate.telegramId}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Ro'yxatdan o'tish turi</p>
                          <p className="text-base font-medium text-gray-900">
                            {certificateData.candidate?.registrationType === 'web' ? 'Web' : 'Bot'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vacancy Info */}
                    {certificateData.vacancy && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <School className="w-5 h-5" />
                          Vakansiya Ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Vakansiya nomi</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.vacancy.title || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Bo'lim</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.vacancy.department || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Lavozim</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.vacancy.position || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interview Info */}
                    {certificateData.interview && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          Suhbat Ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Suhbat kuni</p>
                            <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <CalendarToday className="w-4 h-4 text-gray-400" />
                              {certificateData.interview.date 
                                ? formatTableDate(certificateData.interview.date)
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">O'rtacha baxo</p>
                            <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {certificateData.interview.averageRating || '-'} / 10
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Application Info */}
                    {certificateData.application && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Arizaning Holati
                        </h3>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                            certificateData.application.status === 'passed'
                              ? 'bg-green-100 text-green-800'
                              : certificateData.application.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {certificateData.application.status === 'passed' 
                              ? 'O\'tdi' 
                              : certificateData.application.status === 'failed'
                              ? 'O\'tmadi'
                              : 'Kutilmoqda'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Test Results */}
                    {certificateData.testResults && certificateData.testResults.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Natijalari</h3>
                        <div className="space-y-2">
                          {certificateData.testResults.map((test, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">Test {index + 1}</span>
                              <span className="text-sm font-medium text-gray-900">{test.score || '-'}%</span>
                            </div>
                          ))}
                        </div>
                        {certificateData.averageTestScore && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">O'rtacha test baxosi</p>
                            <p className="text-lg font-semibold text-indigo-600">{certificateData.averageTestScore}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Issued By */}
                    {certificateData.issuedBy && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bergan Admin</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Username</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.issuedBy.username || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="text-base font-medium text-gray-900">{certificateData.issuedBy.email || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Yopish
                      </button>
                      <button
                        type="button"
                        onClick={handleAssignClick}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Lavozimga Tayinlash
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Ma'lumotlar topilmadi</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewCertificateModal;

