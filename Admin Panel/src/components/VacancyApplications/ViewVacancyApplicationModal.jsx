import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Close,
  CheckCircle,
  Cancel,
  Event,
  Add,
  Edit,
  Delete,
  Gavel,
  Info,
  Assessment,
  WorkHistory,
  Gavel as GavelIcon,
  Person,
  Business,
} from '@mui/icons-material';
import { vacancyApplicationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import DecideApplicationModal from './DecideApplicationModal';
import InterviewStageModal from './InterviewStageModal';
import InterviewStageResultModal from './InterviewStageResultModal';
import FinalDecisionModal from './FinalDecisionModal';
import ConvertToPunktModal from './ConvertToPunktModal';
import ConvertToAgentModal from './ConvertToAgentModal';

const ViewVacancyApplicationModal = ({ open, onClose, application, onSuccess }) => {
  const { showError, showSuccess } = useSnackbar();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [decideModalOpen, setDecideModalOpen] = useState(false);
  const [interviewStageModalOpen, setInterviewStageModalOpen] = useState(false);
  const [interviewStageResultModalOpen, setInterviewStageResultModalOpen] = useState(false);
  const [finalDecisionModalOpen, setFinalDecisionModalOpen] = useState(false);
  const [convertToPunktModalOpen, setConvertToPunktModalOpen] = useState(false);
  const [convertToAgentModalOpen, setConvertToAgentModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [resultStage, setResultStage] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (open && application) {
      fetchApplicationDetails();
    }
  }, [open, application]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vacancyApplicationAPI.getApplicationById(application._id);
      if (response.success) {
        setApplicationData(response.data);
      }
    } catch (err) {
      const errorMsg = err.message || 'So\'rovnomani yuklashda xatolik';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDecideSuccess = () => {
    fetchApplicationDetails();
    if (onSuccess) onSuccess();
  };

  const handleInterviewStageSuccess = () => {
    fetchApplicationDetails();
    if (onSuccess) onSuccess();
  };

  const handleFinalDecisionSuccess = () => {
    fetchApplicationDetails();
    if (onSuccess) onSuccess();
  };

  const handleConvertSuccess = () => {
    fetchApplicationDetails();
    if (onSuccess) onSuccess();
  };

  const handleEditStage = (stage) => {
    setEditingStage(stage);
    setInterviewStageModalOpen(true);
  };

  const handleSubmitResult = (stage) => {
    setResultStage(stage);
    setInterviewStageResultModalOpen(true);
  };

  const handleInterviewStageResultSuccess = () => {
    fetchApplicationDetails();
    if (onSuccess) onSuccess();
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Bu intervyu bosqichini o\'chirishni xohlaysizmi?')) return;

    try {
      const response = await vacancyApplicationAPI.deleteInterviewStage(
        applicationData._id,
        stageId
      );
      if (response.success) {
        showSuccess('Intervyu bosqichi o\'chirildi');
        fetchApplicationDetails();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError(err.message || 'Intervyu bosqichini o\'chirishda xatolik');
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

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'reviewed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Ko\'rib chiqilmoqda';
      case 'reviewed':
        return 'Ko\'rib chiqilgan';
      case 'accepted':
        return 'Qabul qilingan';
      case 'rejected':
        return 'Rad etilgan';
      default:
        return status;
    }
  };

  const getAdminDecisionBadge = (decision) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (decision) {
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAdminDecisionLabel = (decision) => {
    switch (decision) {
      case 'accepted':
        return 'Qabul qilingan';
      case 'rejected':
        return 'Rad etilgan';
      default:
        return 'Kutilmoqda';
    }
  };

  const getStageStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStageResultBadge = (result) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (result) {
      case 'passed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getFinalDecisionBadge = (result) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (result) {
      case 'hired':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const displayData = applicationData || application;
  if (!displayData) return null;

  const canAddInterviewStage =
    displayData.adminDecision === 'accepted' &&
    displayData.finalDecision?.result === 'pending';
  const canMakeFinalDecision =
    displayData.adminDecision === 'accepted' &&
    displayData.interviewStages?.length > 0 &&
    displayData.interviewStages.every((stage) => stage.status === 'completed') &&
    displayData.finalDecision?.result === 'pending';

  return (
    <>
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
                className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <h2 className="text-2xl font-bold text-gray-800">So'rovnoma batafsil ma'lumotlari</h2>
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
                    <div>
                      {/* Status and Actions */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className={getStatusBadge(displayData.status)}>
                            {getStatusLabel(displayData.status)}
                          </span>
                          {displayData.adminDecision && (
                            <span className={getAdminDecisionBadge(displayData.adminDecision)}>
                              {getAdminDecisionLabel(displayData.adminDecision)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {displayData.adminDecision === 'pending' && (
                            <button
                              onClick={() => setDecideModalOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Qaror qilish
                            </button>
                          )}
                          {canAddInterviewStage && (
                            <button
                              onClick={() => {
                                setEditingStage(null);
                                setInterviewStageModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Add className="w-4 h-4" />
                              Intervyu qo'shish
                            </button>
                          )}
                          {canMakeFinalDecision && (
                            <button
                              onClick={() => setFinalDecisionModalOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              <Gavel className="w-4 h-4" />
                              Yakuniy qaror
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8" aria-label="Tabs">
                          <button
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                              activeTab === 'info'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Info className="w-5 h-5" />
                            Asosiy ma'lumotlar
                          </button>
                          {(displayData.adminEvaluation?.length > 0 || displayData.adminNotes) && (
                            <button
                              onClick={() => setActiveTab('evaluation')}
                              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'evaluation'
                                  ? 'border-indigo-500 text-indigo-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <Assessment className="w-5 h-5" />
                              Admin baholash
                            </button>
                          )}
                          {displayData.interviewStages && displayData.interviewStages.length > 0 && (
                            <button
                              onClick={() => setActiveTab('interviews')}
                              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'interviews'
                                  ? 'border-indigo-500 text-indigo-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <WorkHistory className="w-5 h-5" />
                              Intervyu bosqichlari
                            </button>
                          )}
                          {displayData.finalDecision && displayData.finalDecision.result !== 'pending' && (
                            <button
                              onClick={() => setActiveTab('final')}
                              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'final'
                                  ? 'border-indigo-500 text-indigo-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <GavelIcon className="w-5 h-5" />
                              Yakuniy qaror
                            </button>
                          )}
                        </nav>
                      </div>

                      {/* Tab Content */}
                      <div className="space-y-6">
                        {/* Info Tab */}
                        {activeTab === 'info' && (
                          <>
                            {/* Vacancy Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vakansiya ma'lumotlari</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Nomi</label>
                                  <p className="text-gray-900">{displayData.vacancy?.name || '-'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Maqsad</label>
                                  <p className="text-gray-900">
                                    {displayData.vacancy?.target === 'agent' ? 'Agent' : 'Punkt'}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Ish turi</label>
                                  <p className="text-gray-900">
                                    {displayData.vacancy?.type === 'fulltime' ? 'To\'liq kunlik' : 'Yarim kunlik'}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Maosh</label>
                                  <p className="text-gray-900">{displayData.vacancy?.salary || '-'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Applicant Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nomzod ma'lumotlari</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Ism</label>
                                  <p className="text-gray-900">
                                    {displayData.applicant?.firstName || ''} {displayData.applicant?.lastName || ''}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Telefon</label>
                                  <p className="text-gray-900">{displayData.applicant?.phone || '-'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Jins</label>
                                  <p className="text-gray-900">
                                    {displayData.applicant?.gender === 'male' ? 'Erkak' : 'Ayol'}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">Tug'ilgan sana</label>
                                  <p className="text-gray-900">
                                    {displayData.applicant?.birthDate
                                      ? formatDate(displayData.applicant.birthDate)
                                      : '-'}
                                  </p>
                                </div>
                                {displayData.applicant?.viloyat && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Viloyat</label>
                                    <p className="text-gray-900">{displayData.applicant.viloyat.name}</p>
                                  </div>
                                )}
                                {displayData.applicant?.tuman && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Tuman</label>
                                    <p className="text-gray-900">{displayData.applicant.tuman.name}</p>
                                  </div>
                                )}
                                {displayData.applicant?.mfy && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">MFY</label>
                                    <p className="text-gray-900">{displayData.applicant.mfy.name}</p>
                                  </div>
                                )}
                              </div>
                              {displayData.applicant?.avatar && (
                                <div className="mt-4">
                                  <label className="block text-sm font-medium text-gray-500 mb-2">Rasm</label>
                                  <img
                                    src={displayData.applicant.avatar}
                                    alt="Avatar"
                                    className="w-32 h-32 object-cover rounded-md"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Answers */}
                            {displayData.answers && displayData.answers.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Javoblar</h3>
                                <div className="space-y-4">
                                  {displayData.answers.map((answer, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-md">
                                      <p className="font-medium text-gray-900 mb-2">{answer.question}</p>
                                      <div className="text-gray-700">
                                        {Array.isArray(answer.answer) ? (
                                          <ul className="list-disc list-inside space-y-1">
                                            {answer.answer.map((val, idx) => (
                                              <li key={idx}>{val}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p>{answer.answer || '-'}</p>
                                        )}
                                      </div>
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
                                    Yuborilgan sana
                                  </label>
                                  <p className="text-gray-900">
                                    {displayData.appliedAt
                                      ? formatDate(displayData.appliedAt)
                                      : formatDate(displayData.createdAt)}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Yangilangan sana
                                  </label>
                                  <p className="text-gray-900">{formatDate(displayData.updatedAt)}</p>
                                </div>
                                {displayData.adminDecidedAt && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                      Admin qaror qilgan sana
                                    </label>
                                    <p className="text-gray-900">{formatDate(displayData.adminDecidedAt)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Evaluation Tab */}
                        {activeTab === 'evaluation' && (
                          <>
                            {/* Admin Evaluation */}
                            {displayData.adminEvaluation && displayData.adminEvaluation.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin baholash</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {displayData.adminEvaluation.map((evalItem, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-md">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">{evalItem.name}</span>
                                        <span className="text-indigo-600 font-semibold">{evalItem.score}/10</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Notes */}
                            {displayData.adminNotes && (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin izohlari</h3>
                                <p className="text-gray-700 p-4 bg-gray-50 rounded-md">{displayData.adminNotes}</p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Interviews Tab */}
                        {activeTab === 'interviews' && (
                          <>
                            {displayData.interviewStages && displayData.interviewStages.length > 0 ? (
                              <div className="space-y-4">
                                {displayData.interviewStages
                                  .sort((a, b) => a.stageOrder - b.stageOrder)
                                  .map((stage) => (
                                    <div key={stage._id} className="p-4 bg-gray-50 rounded-md">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <span className="font-semibold text-gray-900">{stage.stageName}</span>
                                          <span className={getStageStatusBadge(stage.status)}>
                                            {stage.status === 'scheduled'
                                              ? 'Rejalashtirilgan'
                                              : stage.status === 'in_progress'
                                              ? 'Jarayonda'
                                              : stage.status === 'completed'
                                              ? 'Yakunlangan'
                                              : 'Bekor qilingan'}
                                          </span>
                                          {stage.result && (
                                            <span className={getStageResultBadge(stage.result)}>
                                              {stage.result === 'passed' ? 'O\'tdi' : 'O\'tmadi'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          {canAddInterviewStage && (
                                            <>
                                              <button
                                                onClick={() => handleEditStage(stage)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                title="Tahrirlash"
                                              >
                                                <Edit className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteStage(stage._id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                title="O'chirish"
                                              >
                                                <Delete className="w-4 h-4" />
                                              </button>
                                            </>
                                          )}
                                          {canAddInterviewStage &&
                                            stage.status !== 'completed' &&
                                            stage.result === 'pending' && (
                                              <button
                                                onClick={() => handleSubmitResult(stage)}
                                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                                title="Natija kiritish"
                                              >
                                                <CheckCircle className="w-4 h-4" />
                                                Natija kiritish
                                              </button>
                                            )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500">Sana:</span>{' '}
                                          <span className="text-gray-900">
                                            {stage.interviewDate
                                              ? formatDate(stage.interviewDate)
                                              : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Vaqt:</span>{' '}
                                          <span className="text-gray-900">{formatTime(stage.interviewTime)}</span>
                                        </div>
                                        {stage.location && (
                                          <div>
                                            <span className="text-gray-500">Joy:</span>{' '}
                                            <span className="text-gray-900">{stage.location}</span>
                                          </div>
                                        )}
                                        {stage.interviewer && (
                                          <div>
                                            <span className="text-gray-500">Intervyu oluvchi:</span>{' '}
                                            <span className="text-gray-900">{stage.interviewer}</span>
                                          </div>
                                        )}
                                        {stage.notes && (
                                          <div className="md:col-span-2">
                                            <span className="text-gray-500">Izohlar:</span>{' '}
                                            <span className="text-gray-900">{stage.notes}</span>
                                          </div>
                                        )}
                                      </div>
                                      {stage.evaluation && stage.evaluation.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <p className="text-sm font-medium text-gray-700 mb-2">Baholash:</p>
                                          <div className="grid grid-cols-2 gap-2">
                                            {stage.evaluation.map((evalItem, idx) => (
                                              <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">{evalItem.name}</span>
                                                <span className="text-indigo-600 font-semibold">
                                                  {evalItem.score}/10
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-center text-gray-500 py-8">Intervyu bosqichlari mavjud emas</p>
                            )}
                          </>
                        )}

                        {/* Final Decision Tab */}
                        {activeTab === 'final' && (
                          <>
                            {displayData.finalDecision && displayData.finalDecision.result !== 'pending' ? (
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-md">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className={getFinalDecisionBadge(displayData.finalDecision.result)}>
                                      {displayData.finalDecision.result === 'hired'
                                        ? 'Ishga qabul qilindi'
                                        : displayData.finalDecision.result === 'rejected'
                                        ? 'Rad etildi'
                                        : 'Kutilmoqda'}
                                    </span>
                                    {displayData.finalDecision.responseStatus === 'responded' && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Javob berildi
                                      </span>
                                    )}
                                  </div>
                                  {displayData.finalDecision.reason && (
                                    <p className="text-gray-700 mb-2">{displayData.finalDecision.reason}</p>
                                  )}
                                  {displayData.finalDecision.decidedBy && (
                                    <p className="text-sm text-gray-500">
                                      Qaror qilgan: {displayData.finalDecision.decidedBy}
                                    </p>
                                  )}
                                  {displayData.finalDecision.decidedAt && (
                                    <p className="text-sm text-gray-500">
                                      Sana: {formatDate(displayData.finalDecision.decidedAt)}
                                    </p>
                                  )}
                                </div>

                                {/* Convert Button (if hired but not converted yet) */}
                                {displayData.finalDecision.result === 'hired' && !displayData.createdUser && (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                      Punkt/Agent ga Aylantirish
                                    </h3>
                                    <p className="text-sm text-gray-700 mb-4">
                                      Topshirish qabul qilingan. Endi uni {displayData.vacancy?.target === 'punkt' ? 'Punkt' : 'Agent'} ga aylantirishingiz mumkin.
                                    </p>
                                    {displayData.vacancy?.target === 'punkt' ? (
                                      <button
                                        onClick={() => setConvertToPunktModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                                      >
                                        <Business className="w-4 h-4" />
                                        Punkt ga Aylantirish
                                      </button>
                                    ) : displayData.vacancy?.target === 'agent' ? (
                                      <button
                                        onClick={() => setConvertToAgentModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                                      >
                                        <Person className="w-4 h-4" />
                                        Agent ga Aylantirish
                                      </button>
                                    ) : null}
                                  </div>
                                )}

                                {/* Created User Info (if hired) */}
                                {displayData.finalDecision.result === 'hired' && displayData.createdUser && (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                      Yaratilgan {displayData.createdUser.type === 'agent' ? 'Agent' : 'Punkt'} ma'lumotlari
                                    </h3>
                                    {displayData.createdUser.data && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Nomi
                                          </label>
                                          <p className="text-gray-900">{displayData.createdUser.data.name || '-'}</p>
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Telefon
                                          </label>
                                          <p className="text-gray-900">{displayData.createdUser.data.phone || '-'}</p>
                                        </div>
                                        {displayData.createdUser.data.viloyat && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                              Viloyat
                                            </label>
                                            <p className="text-gray-900">
                                              {displayData.createdUser.data.viloyat.name || '-'}
                                            </p>
                                          </div>
                                        )}
                                        {displayData.createdUser.data.tuman && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                              Tuman
                                            </label>
                                            <p className="text-gray-900">
                                              {displayData.createdUser.data.tuman.name || '-'}
                                            </p>
                                          </div>
                                        )}
                                        {displayData.createdUser.data.mfy && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                              MFY
                                            </label>
                                            <p className="text-gray-900">
                                              {displayData.createdUser.data.mfy.name || '-'}
                                            </p>
                                          </div>
                                        )}
                                        {displayData.createdUser.type === 'agent' &&
                                          displayData.createdUser.data.agentType && (
                                            <div>
                                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                                Agent turi
                                              </label>
                                              <p className="text-gray-900">
                                                {displayData.createdUser.data.agentType === 'viloyat'
                                                  ? 'Viloyat agenti'
                                                  : displayData.createdUser.data.agentType === 'tuman'
                                                  ? 'Tuman agenti'
                                                  : 'MFY agenti'}
                                              </p>
                                            </div>
                                          )}
                                        <div>
                                          <label className="block text-sm font-medium text-gray-500 mb-1">
                                            Holati
                                          </label>
                                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                            {displayData.createdUser.data.status === 'active' ? 'Faol' : 'Nofaol'}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                      <p className="text-sm text-yellow-800">
                                        <strong>Eslatma:</strong> Parol sifatida telefon raqami ishlatilgan.
                                        Foydalanuvchi keyin o'zgartirishi mumkin.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-center text-gray-500 py-8">Yakuniy qaror qilinmagan</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Ma'lumotlar yuklanmoqda...</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 sticky bottom-0 bg-white">
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

      {/* Modals */}
      {displayData && (
        <>
          <DecideApplicationModal
            open={decideModalOpen}
            onClose={() => setDecideModalOpen(false)}
            onSuccess={handleDecideSuccess}
            application={displayData}
          />
          <InterviewStageModal
            open={interviewStageModalOpen}
            onClose={() => {
              setInterviewStageModalOpen(false);
              setEditingStage(null);
            }}
            onSuccess={handleInterviewStageSuccess}
            application={displayData}
            stage={editingStage}
          />
          <InterviewStageResultModal
            open={interviewStageResultModalOpen}
            onClose={() => {
              setInterviewStageResultModalOpen(false);
              setResultStage(null);
            }}
            onSuccess={handleInterviewStageResultSuccess}
            application={displayData}
            stage={resultStage}
          />
          <FinalDecisionModal
            open={finalDecisionModalOpen}
            onClose={() => setFinalDecisionModalOpen(false)}
            onSuccess={handleFinalDecisionSuccess}
            application={displayData}
          />

          {displayData.vacancy?.target === 'punkt' && (
            <ConvertToPunktModal
              open={convertToPunktModalOpen}
              onClose={() => setConvertToPunktModalOpen(false)}
              onSuccess={handleConvertSuccess}
              application={displayData}
            />
          )}

          {displayData.vacancy?.target === 'agent' && (
            <ConvertToAgentModal
              open={convertToAgentModalOpen}
              onClose={() => setConvertToAgentModalOpen(false)}
              onSuccess={handleConvertSuccess}
              application={displayData}
            />
          )}
        </>
      )}
    </>
  );
};

export default ViewVacancyApplicationModal;
