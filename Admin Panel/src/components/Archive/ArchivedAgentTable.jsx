import { motion } from 'framer-motion';
import { Visibility, AssignmentInd } from '@mui/icons-material';

const ArchivedAgentTable = ({ agents, loading, pagination, onPageChange, onViewWorkHistory }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAgentTypeBadge = (agentType) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (agentType) {
      case 'viloyat':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'tuman':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'mfy':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAgentTypeLabel = (agentType) => {
    switch (agentType) {
      case 'viloyat':
        return 'Viloyat agenti';
      case 'tuman':
        return 'Tuman agenti';
      case 'mfy':
        return 'MFY agenti';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <AssignmentInd className="mx-auto text-gray-400 text-5xl mb-4" />
        <p className="text-gray-500 text-lg">Arxivlangan agentlar topilmadi</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nomi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Telefon
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agent turi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Viloyat
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tuman
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              MFY
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Holati
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              O'chirilgan sana
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amallar
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {agents.map((agent, index) => (
            <motion.tr
              key={agent._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{agent.phone || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={getAgentTypeBadge(agent.agentType)}>
                  {getAgentTypeLabel(agent.agentType)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {agent.viloyat?.name || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {agent.tuman?.name || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {agent.mfy?.name || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={getStatusBadge(agent.status)}>
                  {agent.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {formatDate(agent.deletedAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onViewWorkHistory(agent._id)}
                  className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                >
                  <Visibility className="text-lg" />
                  <span>Ish tarixi</span>
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Jami <span className="font-medium">{pagination.total}</span> ta agentdan{' '}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            ko'rsatilmoqda
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Oldingi
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedAgentTable;







