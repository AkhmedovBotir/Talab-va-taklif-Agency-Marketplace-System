import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';
import SubmissionTable from '../../components/Finance/SubmissionTable';
import ViewSubmissionModal from '../../components/Finance/ViewSubmissionModal';
import { PendingActions } from '@mui/icons-material';

const Submissions = ({ hideHeader = false }) => {
  const { showError } = useSnackbar();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await financeAPI.getPendingSubmissions();
      if (response.success) {
        setSubmissions(response.submissions || []);
      }
    } catch (err) {
      showError(err.message || 'Topshiruvlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleView = (submission) => {
    setSelectedSubmission(submission);
    setViewModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <PendingActions className="text-indigo-600" />
              Kutilayotgan Topshiruvlar
          </h1>
          <p className="text-gray-600">Moliya bo'limiga kutilayotgan topshiruvlar</p>
        </div>
      </motion.div>
      )}

      {/* Table */}
      <SubmissionTable
        submissions={submissions}
        loading={loading}
        onView={handleView}
        onRefresh={fetchSubmissions}
      />

      {/* View Modal */}
      {selectedSubmission && (
        <ViewSubmissionModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />
      )}
    </div>
  );
};

export default Submissions;

