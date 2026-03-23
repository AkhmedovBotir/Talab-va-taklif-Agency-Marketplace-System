import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reviewAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import CommentTemplateTable from '../../components/CommentTemplates/CommentTemplateTable';
import CreateCommentTemplateModal from '../../components/CommentTemplates/CreateCommentTemplateModal';
import EditCommentTemplateModal from '../../components/CommentTemplates/EditCommentTemplateModal';
import DeleteCommentTemplateModal from '../../components/CommentTemplates/DeleteCommentTemplateModal';
import ViewCommentTemplateModal from '../../components/CommentTemplates/ViewCommentTemplateModal';
import { Add, Clear } from '@mui/icons-material';

const CommentTemplates = () => {
  const { showError, showSuccess } = useSnackbar();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    isActive: undefined,
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await reviewAPI.getAllCommentTemplates({
        isActive: filters.isActive,
      });

      if (response.success) {
        const templatesList = response.data || [];
        // Sort by order
        templatesList.sort((a, b) => (a.order || 0) - (b.order || 0));
        setTemplates(templatesList);
      }
    } catch (err) {
      const errorMsg = err.message || 'Kommentariya shablonlarini yuklashda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filters.isActive]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchTemplates();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
  };

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setDeleteModalOpen(true);
  };

  const handleView = (template) => {
    setSelectedTemplate(template);
    setViewModalOpen(true);
  };

  const handleCreateInitialTemplates = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.createInitialTemplates();
      if (response.success) {
        showSuccess(response.message || 'Boshlang\'ich shablonlar muvaffaqiyatli yaratildi');
        fetchTemplates();
      }
    } catch (err) {
      showError(err.message || 'Boshlang\'ich shablonlarni yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      isActive: undefined,
    });
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Kommentariya Shablonlari</h1>
            <p className="text-gray-600">Kommentariya shablonlarini boshqarish va ko'rish</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateInitialTemplates}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              <span>Boshlang'ich shablonlar yaratish</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              <Add />
              <span>Yangi Shablon</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filterlar</h3>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Clear className="w-4 h-4" />
            <span>Tozalash</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              setFilters({
                ...filters,
                isActive: e.target.value === '' ? undefined : e.target.value === 'true',
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="true">Faol</option>
            <option value="false">Nofaol</option>
          </select>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <CommentTemplateTable
        templates={templates}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onStatusChange={fetchTemplates}
      />

      {/* Modals */}
      <CreateCommentTemplateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedTemplate && (
        <>
          <ViewCommentTemplateModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedTemplate(null);
            }}
            template={selectedTemplate}
          />

          <EditCommentTemplateModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedTemplate(null);
            }}
            onSuccess={handleEditSuccess}
            template={selectedTemplate}
          />

          <DeleteCommentTemplateModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedTemplate(null);
            }}
            onSuccess={handleDeleteSuccess}
            template={selectedTemplate}
          />
        </>
      )}
    </div>
  );
};

export default CommentTemplates;





