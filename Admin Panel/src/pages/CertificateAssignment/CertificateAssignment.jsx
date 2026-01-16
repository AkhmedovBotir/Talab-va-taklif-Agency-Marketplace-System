import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Assignment, Visibility } from '@mui/icons-material';
import ViewCertificateModal from '../../components/CertificateAssignment/ViewCertificateModal';
import SelectAssignmentTypeModal from '../../components/CertificateAssignment/SelectAssignmentTypeModal';
import AssignToPunktModal from '../../components/CertificateAssignment/AssignToPunktModal';
import AssignToAgentModal from '../../components/CertificateAssignment/AssignToAgentModal';
import { useSnackbar } from '../../contexts/SnackbarContext';

const CertificateAssignment = () => {
  const { showError } = useSnackbar();
  const [searchCode, setSearchCode] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectTypeModalOpen, setSelectTypeModalOpen] = useState(false);
  const [assignPunktModalOpen, setAssignPunktModalOpen] = useState(false);
  const [assignAgentModalOpen, setAssignAgentModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const handleSearch = () => {
    if (!searchCode.trim()) {
      showError('Sertifikat kodi yoki raqamini kiriting');
      return;
    }
    setViewModalOpen(true);
  };

  const handleViewClose = () => {
    setViewModalOpen(false);
    setCertificateData(null);
  };

  const handleAssign = (data) => {
    setCertificateData(data);
    setSelectTypeModalOpen(true);
  };

  const handleAssignSuccess = () => {
    setAssignPunktModalOpen(false);
    setAssignAgentModalOpen(false);
    setCertificateData(null);
    setSearchCode('');
  };

  const handleDirectAssign = () => {
    if (!searchCode.trim()) {
      showError('Sertifikat kodi yoki raqamini kiriting');
      return;
    }
    setSelectTypeModalOpen(true);
  };

  const handleSelectPunkt = () => {
    setAssignPunktModalOpen(true);
  };

  const handleSelectAgent = () => {
    setAssignAgentModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Assignment className="w-8 h-8" />
              Sertifikat Integratsiyasi
            </h1>
            <p className="text-gray-600">Sertifikat ma'lumotlarini ko'rish va lavozimga tayinlash</p>
          </div>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sertifikat Qidirish</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Sertifikat raqami yoki QR kod kiriting (masalan: CERT-20240120-1)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <Visibility className="w-5 h-5" />
            Ko'rish
          </button>
          <button
            onClick={handleDirectAssign}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <Assignment className="w-5 h-5" />
            Tayinlash
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Sertifikat raqami (CERT-YYYYMMDD-N formatida) yoki QR kod token kiriting
        </p>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Visibility className="w-5 h-5" />
            Sertifikat Ma'lumotlarini Ko'rish
          </h3>
          <p className="text-sm text-blue-800">
            Sertifikat raqami yoki QR kod orqali nomzodning barcha ma'lumotlarini ko'ring:
            sertifikat, nomzod, vakansiya, suhbat, test natijalari va boshqalar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Assignment className="w-5 h-5" />
            Lavozimga Tayinlash
          </h3>
          <p className="text-sm text-green-800">
            Sertifikat egasini punkt yoki agent lavozimiga tayinlang.
            Yangi foydalanuvchi yaratiladi yoki mavjud foydalanuvchi ma'lumotlari yangilanadi.
          </p>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Qo'llanma</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium mb-1">Sertifikat qidirish</p>
              <p className="text-gray-600">
                Sertifikat raqami (CERT-YYYYMMDD-N) yoki QR kod token kiriting va "Ko'rish" tugmasini bosing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium mb-1">Ma'lumotlarni ko'rish</p>
              <p className="text-gray-600">
                Sertifikat, nomzod, vakansiya, suhbat va test natijalari ma'lumotlarini ko'ring.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium mb-1">Lavozimga tayinlash</p>
              <p className="text-gray-600">
                "Lavozimga Tayinlash" tugmasini bosing, lavozim turini va hududni tanlang, keyin tayinlang.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <ViewCertificateModal
        open={viewModalOpen}
        onClose={handleViewClose}
        certificateCode={searchCode}
        onAssign={handleAssign}
      />

      <SelectAssignmentTypeModal
        open={selectTypeModalOpen}
        onClose={() => setSelectTypeModalOpen(false)}
        onSelectPunkt={handleSelectPunkt}
        onSelectAgent={handleSelectAgent}
      />

      <AssignToPunktModal
        open={assignPunktModalOpen}
        onClose={() => {
          setAssignPunktModalOpen(false);
          setCertificateData(null);
        }}
        onSuccess={handleAssignSuccess}
        certificateData={certificateData}
        certificateCode={searchCode}
      />

      <AssignToAgentModal
        open={assignAgentModalOpen}
        onClose={() => {
          setAssignAgentModalOpen(false);
          setCertificateData(null);
        }}
        onSuccess={handleAssignSuccess}
        certificateData={certificateData}
        certificateCode={searchCode}
      />
    </div>
  );
};

export default CertificateAssignment;

