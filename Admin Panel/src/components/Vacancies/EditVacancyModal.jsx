import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Add, Delete } from '@mui/icons-material';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { vacancyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const EditVacancyModal = ({ open, onClose, onSuccess, vacancy }) => {
  const { showSuccess, showError } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    target: 'agent',
    experience: '',
    type: 'fulltime',
    salary: '',
    description: null,
    responsibilities: null,
    preferences: null,
    skills: [],
    minAge: null,
    maxAge: null,
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    newOptionTemp: '',
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Refs for Quill editors
  const descriptionQuillRef = useRef(null);
  const responsibilitiesQuillRef = useRef(null);
  const preferencesQuillRef = useRef(null);
  const descriptionQuillInstance = useRef(null);
  const responsibilitiesQuillInstance = useRef(null);
  const preferencesQuillInstance = useRef(null);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );

  // Sync form data when vacancy changes
  useEffect(() => {
    if (vacancy && open) {
      setFormData({
        name: vacancy.name || '',
        target: vacancy.target || 'agent',
        experience: vacancy.experience || '',
        type: vacancy.type || 'fulltime',
        salary: vacancy.salary || '',
        description: vacancy.description || null,
        responsibilities: vacancy.responsibilities || null,
        preferences: vacancy.preferences || null,
        skills: vacancy.skills || [],
        minAge: vacancy.minAge ?? null,
        maxAge: vacancy.maxAge ?? null,
        questions: vacancy.questions || [],
      });

      // Set contents if editors already exist
      if (descriptionQuillInstance.current && vacancy.description?.ops) {
        descriptionQuillInstance.current.setContents(vacancy.description);
      }
      if (responsibilitiesQuillInstance.current && vacancy.responsibilities?.ops) {
        responsibilitiesQuillInstance.current.setContents(vacancy.responsibilities);
      }
      if (preferencesQuillInstance.current && vacancy.preferences?.ops) {
        preferencesQuillInstance.current.setContents(vacancy.preferences);
      }
    }
  }, [vacancy, open]);

  // Initialize Quill editors
  useEffect(() => {
    if (open) {
      if (descriptionQuillRef.current && !descriptionQuillInstance.current) {
        descriptionQuillInstance.current = new Quill(descriptionQuillRef.current, {
          theme: 'snow',
          modules: quillModules,
          placeholder: 'Ish tavsifini kiriting...',
        });
        if (formData.description?.ops) {
          descriptionQuillInstance.current.setContents(formData.description);
        }
        descriptionQuillInstance.current.on('text-change', () => {
          const delta = descriptionQuillInstance.current.getContents();
          if (
            delta.ops &&
            delta.ops.length === 1 &&
            delta.ops[0].insert === '\n' &&
            !delta.ops[0].attributes
          ) {
            setFormData((prev) => ({ ...prev, description: null }));
          } else if (delta.ops && delta.ops.length > 0) {
            setFormData((prev) => ({ ...prev, description: delta }));
          }
        });
      }

      if (responsibilitiesQuillRef.current && !responsibilitiesQuillInstance.current) {
        responsibilitiesQuillInstance.current = new Quill(responsibilitiesQuillRef.current, {
          theme: 'snow',
          modules: quillModules,
          placeholder: 'Majburiyatlarni kiriting...',
        });
        if (formData.responsibilities?.ops) {
          responsibilitiesQuillInstance.current.setContents(formData.responsibilities);
        }
        responsibilitiesQuillInstance.current.on('text-change', () => {
          const delta = responsibilitiesQuillInstance.current.getContents();
          if (
            delta.ops &&
            delta.ops.length === 1 &&
            delta.ops[0].insert === '\n' &&
            !delta.ops[0].attributes
          ) {
            setFormData((prev) => ({ ...prev, responsibilities: null }));
          } else if (delta.ops && delta.ops.length > 0) {
            setFormData((prev) => ({ ...prev, responsibilities: delta }));
          }
        });
      }

      if (preferencesQuillRef.current && !preferencesQuillInstance.current) {
        preferencesQuillInstance.current = new Quill(preferencesQuillRef.current, {
          theme: 'snow',
          modules: quillModules,
          placeholder: 'Afzalliklarni kiriting...',
        });
        if (formData.preferences?.ops) {
          preferencesQuillInstance.current.setContents(formData.preferences);
        }
        preferencesQuillInstance.current.on('text-change', () => {
          const delta = preferencesQuillInstance.current.getContents();
          if (
            delta.ops &&
            delta.ops.length === 1 &&
            delta.ops[0].insert === '\n' &&
            !delta.ops[0].attributes
          ) {
            setFormData((prev) => ({ ...prev, preferences: null }));
          } else if (delta.ops && delta.ops.length > 0) {
            setFormData((prev) => ({ ...prev, preferences: delta }));
          }
        });
      }
    }

    return () => {
      if (!open) {
        descriptionQuillInstance.current = null;
        responsibilitiesQuillInstance.current = null;
        preferencesQuillInstance.current = null;
      }
    };
  }, [open, quillModules, formData.description, formData.responsibilities, formData.preferences]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleAddQuestion = () => {
    if (newQuestion.question.trim()) {
      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...newQuestion, newOptionTemp: undefined }],
      }));
      setNewQuestion({
        question: '',
        type: 'text',
        required: false,
        options: [],
        placeholder: '',
        newOptionTemp: '',
      });
      setShowQuestionForm(false);
    }
  };

  const handleRemoveQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (field, value) => {
    setNewQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOption = () => {
    if (newQuestion.newOptionTemp && newQuestion.newOptionTemp.trim()) {
      setNewQuestion((prev) => ({
        ...prev,
        options: [...prev.options, prev.newOptionTemp.trim()],
        newOptionTemp: '',
      }));
    }
  };

  const handleRemoveOption = (index) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vacancy?._id) return;
    setError('');
    setLoading(true);

    try {
      const updateData = { ...formData };
      const response = await vacancyAPI.updateVacancy(vacancy._id, updateData);
      if (response.success) {
        showSuccess(response.message || "Vakansiya muvaffaqiyatli yangilandi");
        handleClose();
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err.message || 'Vakansiyani yangilashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setNewSkill('');
    setNewQuestion({
      question: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      newOptionTemp: '',
    });
    setShowQuestionForm(false);
    if (descriptionQuillInstance.current) {
      descriptionQuillInstance.current.setContents([]);
    }
    if (responsibilitiesQuillInstance.current) {
      responsibilitiesQuillInstance.current.setContents([]);
    }
    if (preferencesQuillInstance.current) {
      preferencesQuillInstance.current.setContents([]);
    }
    onClose();
  };

  if (!vacancy) return null;

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
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-800">Vakansiyani tahrirlash</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vakansiya nomi *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maqsad *
                    </label>
                    <select
                      name="target"
                      value={formData.target}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="agent">Agent</option>
                      <option value="punkt">Punkt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ish turi *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="fulltime">To'liq kunlik</option>
                      <option value="parttime">Yarim kunlik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tajriba
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="Masalan: 1-2 yil"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maosh
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="Masalan: 5 000 000 - 7 000 000 so'm"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimal yosh
                    </label>
                    <input
                      type="number"
                      name="minAge"
                      value={formData.minAge ?? ''}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimal yosh
                    </label>
                    <input
                      type="number"
                      name="maxAge"
                      value={formData.maxAge ?? ''}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ish tavsifi
                  </label>
                  <div className="border border-gray-300 rounded-md">
                    <div ref={descriptionQuillRef} style={{ minHeight: '150px' }}></div>
                  </div>
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Majburiyatlar
                  </label>
                  <div className="border border-gray-300 rounded-md">
                    <div ref={responsibilitiesQuillRef} style={{ minHeight: '150px' }}></div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Afzalliklar
                  </label>
                  <div className="border border-gray-300 rounded-md">
                    <div ref={preferencesQuillRef} style={{ minHeight: '150px' }}></div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ko'nikmalar
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Ko'nikma qo'shish"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <Add />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Delete style={{ fontSize: 16 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Savollar ({formData.questions.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuestionForm(!showQuestionForm)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                    >
                      {showQuestionForm ? "Yopish" : "Savol qo'shish"}
                    </button>
                  </div>

                  {showQuestionForm && (
                    <div className="border border-gray-300 rounded-md p-4 mb-4 space-y-3">
                      <input
                        type="text"
                        value={newQuestion.question}
                        onChange={(e) => handleQuestionChange('question', e.target.value)}
                        placeholder="Savol matni *"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={newQuestion.type}
                          onChange={(e) => handleQuestionChange('type', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="select">Select</option>
                          <option value="radio">Radio</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="date">Date</option>
                          <option value="file">File</option>
                        </select>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newQuestion.required}
                            onChange={(e) => handleQuestionChange('required', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">Majburiy</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newQuestion.placeholder}
                        onChange={(e) => handleQuestionChange('placeholder', e.target.value)}
                        placeholder="Placeholder"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {(newQuestion.type === 'select' || newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newQuestion.newOptionTemp || ''}
                              onChange={(e) => handleQuestionChange('newOptionTemp', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOption();
                                }
                              }}
                              placeholder="Variant kiriting"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddOption}
                              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                            >
                              Qo'shish
                            </button>
                          </div>
                          <div className="space-y-1">
                            {newQuestion.options.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="flex-1 px-3 py-1 bg-gray-100 rounded">{option}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Delete style={{ fontSize: 16 }} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Qo'shish
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {formData.questions.map((q, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium">{q.question}</p>
                          <p className="text-xs text-gray-500">
                            {q.type} {q.required && '(Majburiy)'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Delete style={{ fontSize: 18 }} />
                        </button>
                      </div>
                    ))}
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
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Yangilanmoqda..." : "Yangilash"}
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

export default EditVacancyModal;





