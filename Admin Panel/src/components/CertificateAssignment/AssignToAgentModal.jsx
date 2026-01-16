import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Person } from '@mui/icons-material';
import { certificateAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import RegionSelect from '../Regions/RegionSelect';

const AssignToAgentModal = ({ open, onClose, onSuccess, certificateData, certificateCode }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    phone: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedCertificateData, setLoadedCertificateData] = useState(null);

  // Load certificate data if certificateCode is provided but certificateData is not
  useEffect(() => {
    if (open && certificateCode && !certificateData) {
      const fetchCertificateData = async () => {
        try {
          // Try by certificate number first
          const response = await certificateAPI.getCandidateByCertificateNumber(certificateCode);
          if (response.success) {
            setLoadedCertificateData(response.data);
          }
        } catch (err) {
          // If certificate number fails, try as certificate ID
          try {
            const response = await certificateAPI.getCandidateByCertificateId(certificateCode);
            if (response.success) {
              setLoadedCertificateData(response.data);
            }
          } catch (err2) {
            // Silently fail - user can still fill the form manually
            console.error('Failed to load certificate data:', err2);
          }
        }
      };
      fetchCertificateData();
    } else {
      setLoadedCertificateData(null);
    }
  }, [open, certificateCode, certificateData]);

  useEffect(() => {
    if (open) {
      // Use certificateData if available, otherwise use loadedCertificateData
      const data = certificateData || loadedCertificateData;
      
      if (data) {
        // Pre-fill form with certificate data
        setFormData({
          name: data.candidate?.fullName || '',
          viloyat: '',
          tuman: '',
          mfy: '',
          phone: data.candidate?.phone || '',
          status: 'active',
        });
      } else {
        // Reset form if no data
        setFormData({
          name: '',
          viloyat: '',
          tuman: '',
          mfy: '',
          phone: '',
          status: 'active',
        });
      }
    }
  }, [open, certificateData, loadedCertificateData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If viloyat changes, reset tuman and mfy
    if (name === 'viloyat') {
      setFormData((prev) => ({ ...prev, viloyat: value, tuman: '', mfy: '' }));
    }
    // If tuman changes, reset mfy
    else if (name === 'tuman') {
      setFormData((prev) => ({ ...prev, tuman: value, mfy: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Determine position type based on selected regions
  const getPositionType = () => {
    if (formData.viloyat && formData.tuman && formData.mfy) {
      return 'mfy_agent';
    } else if (formData.viloyat && formData.tuman) {
      return 'tuman_agent';
    } else if (formData.viloyat) {
      return 'viloyat_agent';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const positionType = getPositionType();
    if (!positionType) {
      setError('Kamida viloyat tanlanishi shart');
      showError('Kamida viloyat tanlanishi shart');
      return;
    }

    setLoading(true);

    try {
      // Use certificateData if available, otherwise use loadedCertificateData
      const data = certificateData || loadedCertificateData;
      
      // Prepare assignment data for agent
      // Note: name and phone are optional - if not provided, certificate candidate data will be used
      const assignmentData = {
        certificateCode: certificateCode || data?.certificate?.certificateNumber || data?.certificate?.qrCode || '',
        positionType: positionType,
        viloyatId: formData.viloyat,
      };

      // Add name if provided (optional)
      if (formData.name.trim()) {
        assignmentData.name = formData.name.trim();
      }

      // Add phone if provided (optional)
      if (formData.phone.trim()) {
        assignmentData.phone = formData.phone.trim();
      }

      // Add tuman if provided
      if (formData.tuman) {
        assignmentData.tumanId = formData.tuman;
      }

      // Add mfy if provided
      if (formData.mfy) {
        assignmentData.mfyId = formData.mfy;
      }

      const response = await certificateAPI.assignCertificateToPosition(assignmentData);
      
      if (response.success) {
        showSuccess(response.message || 'Nomzod muvaffaqiyatli agentga tayinlandi');
        handleClose();
        onSuccess();
      }
    } catch (err) {
      let errorMsg = err.message || 'Agentga tayinlashda xatolik yuz berdi';
      
      // Check if error has existingUser info
      if (err.existingUser || (err.response && err.response.existingUser)) {
        const existingUser = err.existingUser || err.response.existingUser;
        errorMsg = `${errorMsg}\n\nMavjud foydalanuvchi:\nTuri: ${existingUser.type}\nIsm: ${existingUser.name}\nID: ${existingUser.id}`;
      }
      
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setFormData({
      name: '',
      viloyat: '',
      tuman: '',
      mfy: '',
      phone: '',
      status: 'active',
    });
    onClose();
  };

  const positionType = getPositionType();
  const positionTypeLabel = positionType ? 'Agent' : 'Agent turi avtomatik aniqlanadi';

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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Person className="w-6 h-6" />
                  Agentga Tayinlash
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ism (ixtiyoriy)
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        minLength={2}
                        maxLength={200}
                        placeholder={(certificateData || loadedCertificateData)?.candidate?.fullName || 'To\'liq ism (ixtiyoriy)'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Agar kiritilmasa, sertifikatdagi nomzod ismi ishlatiladi
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon raqami (ixtiyoriy)
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={(certificateData || loadedCertificateData)?.candidate?.phone || '+998901234567'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Agar kiritilmasa, sertifikatdagi nomzod telefon raqami ishlatiladi
                      </p>
                    </div>
                  </div>

                  {/* Manzil (Viloyat, Tuman, MFY) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manzil *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Viloyat */}
                      <div>
                        <RegionSelect
                          name="viloyat"
                          value={formData.viloyat}
                          onChange={handleChange}
                          label="Viloyat"
                          required
                          type="region"
                        />
                      </div>

                      {/* Tuman */}
                      <div>
                        <RegionSelect
                          name="tuman"
                          value={formData.tuman}
                          onChange={handleChange}
                          label="Tuman (ixtiyoriy)"
                          type="district"
                          parentId={formData.viloyat || null}
                          disabled={!formData.viloyat}
                        />
                      </div>

                      {/* MFY */}
                      <div>
                        <RegionSelect
                          name="mfy"
                          value={formData.mfy}
                          onChange={handleChange}
                          label="MFY (ixtiyoriy)"
                          type="mfy"
                          parentId={formData.tuman || null}
                          disabled={!formData.tuman}
                        />
                      </div>
                    </div>
                    <p className="bg-gray-100 p-2 rounded-md border border-l-4 border-blue-500 pl-6 text-xs text-gray-500 mt-2">
                      Agent turi avtomatik aniqlanadi
                    </p>
                    {positionType && (
                      <p className="text-sm text-indigo-600 font-medium mt-2">
                        Tanlangan: <strong>{positionTypeLabel}</strong>
                      </p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Eslatma:</strong> Sertifikat kodi: <strong>{certificateCode || (certificateData || loadedCertificateData)?.certificate?.certificateNumber || (certificateData || loadedCertificateData)?.certificate?.qrCode || 'Kiritilmagan'}</strong>
                      {(certificateData || loadedCertificateData) && (
                        <>
                          <br />
                          Agar ism yoki telefon raqami kiritilmasa, sertifikatdagi ma'lumotlar ishlatiladi.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !positionType}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Tayinlanmoqda...' : 'Tayinlash'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssignToAgentModal;

