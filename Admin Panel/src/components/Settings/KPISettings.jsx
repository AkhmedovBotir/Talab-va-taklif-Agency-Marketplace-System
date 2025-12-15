import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { kpiAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import KPIDistributionList from './KPI/KPIDistributionList';
import KPIDistributionModal from './KPI/KPIDistributionModal';

const KPISettings = () => {
  const { showError, showSuccess } = useSnackbar();

  const [defaults, setDefaults] = useState(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);

  const [distributions, setDistributions] = useState([]);
  const [distributionFilters, setDistributionFilters] = useState('');
  const [distributionPagination, setDistributionPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [distributionsLoading, setDistributionsLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDefaults = async () => {
    setDefaultsLoading(true);
    try {
      const response = await kpiAPI.getInitialDistributionDefaults();
      if (response.success) {
        setDefaults(response.data);
      }
    } catch (error) {
      showError(error.message || 'Dastlabki KPI konfiguratsiyasini yuklashda xatolik');
    } finally {
      setDefaultsLoading(false);
    }
  };

  const fetchDistributions = async ({ page, limit } = {}) => {
    setDistributionsLoading(true);
    try {
      const appliedPage = page ?? distributionPagination.page;
      const appliedLimit = limit ?? distributionPagination.limit;

      const response = await kpiAPI.getAllDistributions({
        page: appliedPage,
        limit: appliedLimit,
        ...(distributionFilters !== ''
          ? { isActive: distributionFilters === 'active' }
          : {}),
      });

      if (response.success) {
        setDistributions(response.data || []);
        setDistributionPagination({
          page: response.page || appliedPage,
          limit: response.limit || appliedLimit,
          total: response.total || response.count || 0,
          pages: response.totalPages || 0,
        });
      }
    } catch (error) {
      showError(error.message || 'KPI taqsimlashlarini yuklashda xatolik');
    } finally {
      setDistributionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaults();
    fetchDistributions({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDistributions({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributionFilters]);

  const buildDistributionPayload = (payload) => {
    const result = {
      name: payload.name?.trim(),
      distribution: {
        punkt: Number(payload.distribution.punkt) || 0,
        viloyatAgent: Number(payload.distribution.viloyatAgent) || 0,
        tumanAgent: Number(payload.distribution.tumanAgent) || 0,
        mfyAgent: Number(payload.distribution.mfyAgent) || 0,
        finance: Number(payload.distribution.finance) || 0,
        punktTransfer: Number(payload.distribution.punktTransfer) || 0,
      },
      isActive: payload.isActive,
    };

    if (payload.description?.trim()) {
      result.description = payload.description.trim();
    }

    return result;
  };

  const handleSubmitDistribution = async (formPayload) => {
    setSubmitting(true);
    try {
      const payload = buildDistributionPayload(formPayload);
      let response;
      if (editingDistribution) {
        response = await kpiAPI.updateDistribution(editingDistribution._id, payload);
      } else {
        response = await kpiAPI.createDistribution(payload);
      }

      if (response.success) {
        showSuccess(response.message || 'KPI taqsimlash muvaffaqiyatli saqlandi');
        setEditingDistribution(null);
        setModalOpen(false);
        fetchDistributions();
      }
    } catch (error) {
      showError(error.message || 'Ma’lumotlarni saqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateDistribution = async (distribution) => {
    if (distribution.isActive) return;
    try {
      const response = await kpiAPI.updateDistribution(distribution._id, { isActive: true });
      if (response.success) {
        showSuccess(response.message || 'Faol taqsimlash yangilandi');
        fetchDistributions();
      }
    } catch (error) {
      showError(error.message || 'Taqsimlashni faollashtirishda xatolik');
    }
  };

  const handleDeleteDistribution = async (distribution) => {
    const confirmDelete = window.confirm(
      `${distribution.name} taqsimlashini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`,
    );
    if (!confirmDelete) return;

    try {
      const response = await kpiAPI.deleteDistribution(distribution._id);
      if (response.success) {
        showSuccess(response.message || 'Taqsimlash o‘chirildi');
        if (editingDistribution?._id === distribution._id) {
          setEditingDistribution(null);
        }
        fetchDistributions();
      }
    } catch (error) {
      showError(error.message || 'Taqsimlashni o‘chirishda xatolik');
    }
  };

  const handleEditDistribution = (distribution) => {
    setEditingDistribution(distribution);
    setModalOpen(true);
  };

  const handleDistributionPageChange = (page) => {
    if (page < 1 || (distributionPagination.pages && page > distributionPagination.pages)) {
      return;
    }
    fetchDistributions({ page });
  };

  const handleDistributionLimitChange = (limit) => {
    fetchDistributions({ page: 1, limit });
  };

  const handleOpenCreateModal = () => {
    setEditingDistribution(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingDistribution(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <KPIDistributionList
          distributions={distributions}
          loading={distributionsLoading}
          pagination={distributionPagination}
          onPageChange={handleDistributionPageChange}
          onLimitChange={handleDistributionLimitChange}
          onFilterChange={setDistributionFilters}
          activeFilter={distributionFilters}
          onEdit={handleEditDistribution}
          onDelete={handleDeleteDistribution}
          onActivate={handleActivateDistribution}
          onCreate={handleOpenCreateModal}
        />
      </motion.div>

      <KPIDistributionModal
        open={modalOpen}
        onClose={handleCloseModal}
        defaults={defaults}
        defaultsLoading={defaultsLoading}
        submitting={submitting}
        editingDistribution={editingDistribution}
        onSubmit={handleSubmitDistribution}
      />
    </div>
  );
};

export default KPISettings;


