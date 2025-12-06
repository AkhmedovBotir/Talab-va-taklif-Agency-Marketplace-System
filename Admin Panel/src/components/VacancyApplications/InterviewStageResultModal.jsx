import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Add, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import { vacancyApplicationAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const InterviewStageResultModal = ({ open, onClose, onSuccess, application, stage }) => {
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('passed');
  const [evaluation, setEvaluation] = useState([{ name: '', score: 0 }]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (stage && open) {
      // If stage already has result, prefill
      if (stage.result && stage.result !== 'pending') {
        setResult(stage.result);
      }
      if (stage.evaluation && stage.evaluation.length > 0) {
        setEvaluation(stage.evaluation);
      } else {
        setEvaluation([{ name: '', score: 0 }]);
      }
      if (stage.notes) {
        setNotes(stage.notes);
      } else {
        setNotes('');
      }
    } else if (open) {
      // Reset form
      setResult('passed');
      setEvaluation([{ name: '', score: 0 }]);
      setNotes('');
    }
  }, [stage, open]);

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
      const resultData = {
        result,
        notes: notes.trim() || undefined,
      };

      if (validEvaluation.length > 0) {
        resultData.evaluation = validEvaluation;
      }

      const response = await vacancyApplicationAPI.submitInterviewStageResult(
        application._id,
        stage._id,
        resultData
      );

      if (response.success) {
        showSuccess(
          result === 'passed'
            ? 'Intervyu natijasi: Muvaffaqiyatli o\'tdi'
            : 'Intervyu natijasi: O\'tmadi'
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      showError(err.message || 'Intervyu natijasini kiritishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!stage) return null;

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
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Intervyu natijasini kiritish</h2>
                  <p className="text-sm text-gray-600 mt-1">{stage.stageName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Natija <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="passed"
                        checked={result === 'passed'}
                        onChange={(e) => setResult(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">O'tdi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="failed"
                        checked={result === 'failed'}
                        onChange={(e) => setResult(e.target.value)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Cancel className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">O'tmadi</span>
                    </label>
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

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qo'shimcha izohlar (ixtiyoriy)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Izohlar kiriting..."
                  />
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Eslatma:</strong> Natija kiritilganda, intervyu bosqichi avtomatik ravishda
                    "Yakunlangan" (completed) statusiga o'tadi.
                  </p>
                </div>

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

export default InterviewStageResultModal;

