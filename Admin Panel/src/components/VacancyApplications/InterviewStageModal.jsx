import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Add, Delete } from '@mui/icons-material';
import { vacancyApplicationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const InterviewStageModal = ({ open, onClose, onSuccess, application, stage }) => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stageName: '',
    stageOrder: 1,
    interviewDate: '',
    interviewTime: '',
    location: '',
    interviewer: '',
    notes: '',
    status: 'scheduled',
    result: 'pending',
    evaluation: [],
  });

  const [evaluation, setEvaluation] = useState([{ name: '', score: 0 }]);

  useEffect(() => {
    if (stage) {
      // Edit mode
      setFormData({
        stageName: stage.stageName || '',
        stageOrder: stage.stageOrder || 1,
        interviewDate: stage.interviewDate
          ? new Date(stage.interviewDate).toISOString().split('T')[0]
          : '',
        interviewTime: stage.interviewTime || '',
        location: stage.location || '',
        interviewer: stage.interviewer || '',
        notes: stage.notes || '',
        status: stage.status || 'scheduled',
        result: stage.result || 'pending',
        evaluation: stage.evaluation || [],
      });
      if (stage.evaluation && stage.evaluation.length > 0) {
        setEvaluation(stage.evaluation);
      } else {
        setEvaluation([{ name: '', score: 0 }]);
      }
    } else {
      // Create mode - set next order
      const maxOrder =
        application?.interviewStages?.length > 0
          ? Math.max(...application.interviewStages.map((s) => s.stageOrder || 0))
          : 0;
      setFormData({
        stageName: '',
        stageOrder: maxOrder + 1,
        interviewDate: '',
        interviewTime: '',
        location: '',
        interviewer: '',
        notes: '',
        status: 'scheduled',
        result: 'pending',
        evaluation: [],
      });
      setEvaluation([{ name: '', score: 0 }]);
    }
  }, [stage, application, open]);

  const handleAddEvaluation = () => {
    setEvaluation([...evaluation, { name: '', score: 0 }]);
  };

  const handleRemoveEvaluation = (index) => {
    setEvaluation(evaluation.filter((_, i) => i !== index));
  };

  const handleEvaluationChange = (index, field, value) => {
    const newEvaluation = [...evaluation];
    newEvaluation[index][field] = field === 'score' ? Number(value) : value;
    setEvaluation(newEvaluation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate
    if (!formData.stageName.trim()) {
      showError('Bosqich nomi kiritilishi shart');
      setLoading(false);
      return;
    }

    if (!formData.interviewDate) {
      showError('Intervyu sanasi kiritilishi shart');
      setLoading(false);
      return;
    }

    if (!formData.interviewTime) {
      showError('Intervyu vaqti kiritilishi shart');
      setLoading(false);
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.interviewTime)) {
      showError('Vaqt formati noto\'g\'ri. Format: HH:MM (masalan: 14:30)');
      setLoading(false);
      return;
    }

    // Validate evaluation
    const validEvaluation = evaluation.filter((evalItem) => evalItem.name.trim() !== '');
    for (const evalItem of validEvaluation) {
      if (evalItem.score < 0 || evalItem.score > 10) {
        showError('Baho 0 dan 10 gacha bo\'lishi kerak');
        setLoading(false);
        return;
      }
    }

    try {
      const submitData = {
        stageName: formData.stageName.trim(),
        stageOrder: formData.stageOrder,
        interviewDate: formData.interviewDate,
        interviewTime: formData.interviewTime,
        location: formData.location.trim() || undefined,
        interviewer: formData.interviewer.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      // For edit mode, include status, result, and evaluation
      if (stage) {
        submitData.status = formData.status;
        submitData.result = formData.result;
        if (validEvaluation.length > 0) {
          submitData.evaluation = validEvaluation;
        }
      }

      let response;
      if (stage) {
        response = await vacancyApplicationAPI.updateInterviewStage(
          application._id,
          stage._id,
          submitData
        );
      } else {
        response = await vacancyApplicationAPI.addInterviewStage(application._id, submitData);
      }

      if (response.success) {
        showSuccess(
          stage ? 'Intervyu bosqichi yangilandi' : 'Intervyu bosqichi qo\'shildi'
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      showError(err.message || 'Intervyu bosqichini saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {stage ? 'Intervyu bosqichini tahrirlash' : 'Intervyu bosqichini qo\'shish'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Stage Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bosqich nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.stageName}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masalan: Texnik intervyu"
                  />
                </div>

                {/* Stage Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bosqich tartibi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.stageOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, stageOrder: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Interview Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervyu sanasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Interview Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervyu vaqti (HH:MM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.interviewTime}
                    onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervyu joyi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masalan: Ofis, 3-qavat"
                  />
                </div>

                {/* Interviewer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervyu oluvchi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formData.interviewer}
                    onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masalan: Ahmadjon Ahmadov"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qo'shimcha izohlar (ixtiyoriy)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Izohlar kiriting..."
                  />
                </div>

                {/* Status and Result (only for edit mode) */}
                {stage && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="scheduled">Rejalashtirilgan</option>
                          <option value="in_progress">Jarayonda</option>
                          <option value="completed">Yakunlangan</option>
                          <option value="cancelled">Bekor qilingan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Natija</label>
                        <select
                          value={formData.result}
                          onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="pending">Kutilmoqda</option>
                          <option value="passed">O'tdi</option>
                          <option value="failed">O'tmadi</option>
                        </select>
                      </div>
                    </div>

                    {/* Evaluation */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Baholash (ixtiyoriy)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddEvaluation}
                          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <Add className="w-4 h-4" />
                          Qo'shish
                        </button>
                      </div>
                      <div className="space-y-3">
                        {evaluation.map((evalItem, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Baholash nomi"
                              value={evalItem.name}
                              onChange={(e) =>
                                handleEvaluationChange(index, 'name', e.target.value)
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              placeholder="Baho (0-10)"
                              min="0"
                              max="10"
                              value={evalItem.score}
                              onChange={(e) =>
                                handleEvaluationChange(index, 'score', e.target.value)
                              }
                              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {evaluation.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEvaluation(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Delete className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Saqlash'}
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

export default InterviewStageModal;



