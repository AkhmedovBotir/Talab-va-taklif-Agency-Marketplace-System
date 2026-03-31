import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { formatDate } from '../../utils/dateFormatter';

const ViewRegionModal = ({ open, onClose, item, regions, districts }) => {
  const parentText = useMemo(() => {
    if (!item) return '-';
    if (item.type === 'district') {
      const region = regions.find((r) => String(r.id ?? r._id) === String(item.region_id));
      return region ? `${region.name} (${region.code})` : '-';
    }
    if (item.type === 'mfy') {
      const district = districts.find((d) => String(d.id ?? d._id) === String(item.district_id));
      return district ? `${district.name} (${district.code})` : '-';
    }
    return '-';
  }, [item, regions, districts]);

  if (!item) return null;
  const label = item.type === 'region' ? 'Viloyat' : item.type === 'district' ? 'Tuman' : 'MFY';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">{label} batafsil ma'lumotlari</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Close /></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nomi</label>
                    <p className="text-gray-900">{item.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Kodi</label>
                    <p className="text-gray-900">{item.code || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tipi</label>
                    <p className="text-gray-900">{label}</p>
                  </div>
                  {item.type !== 'region' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Parent</label>
                      <p className="text-gray-900">{parentText}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.status === 'active' ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Yaratilgan</label>
                    <p className="text-gray-900">{formatDate(item.createdAt || item.created_at, { includeTime: true })}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Yangilangan</label>
                    <p className="text-gray-900">{formatDate(item.updatedAt || item.updated_at, { includeTime: true })}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Yopish</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewRegionModal;
