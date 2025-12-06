import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';

const ViewCategoryModal = ({ open, onClose, category }) => {
  if (!category) return null;

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

  const isSubcategory = category.parent !== null && category.parent !== undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800"
        >
          {isSubcategory ? 'Subkategoriya ma\'lumotlari' : 'Kategoriya ma\'lumotlari'}
        </motion.div>
      </DialogTitle>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{category.name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{category.slug || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    category.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {category.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </p>
            </div>
            {isSubcategory && category.parent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asosiy kategoriya</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {typeof category.parent === 'object' ? category.parent.name : '-'}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(category.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {formatDate(category.updatedAt)}
              </p>
            </div>
          </div>

          {category.createdBy && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Yaratuvchi ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {category.createdBy.name || '-'}
                  </p>
                </div>
                {category.createdBy.inn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">INN</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {category.createdBy.inn}
                    </p>
                  </div>
                )}
                {category.createdBy.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {category.createdBy.phone}
                    </p>
                  </div>
                )}
                {category.createdByModel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {category.createdByModel}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isSubcategory && category.subcategories && category.subcategories.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Subkategoriyalar ({category.subcategories.length} ta)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {category.subcategories.map((sub) => (
                  <div
                    key={sub._id}
                    className="bg-gray-50 p-3 rounded border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                        <p className="text-xs text-gray-500">{sub.slug}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sub.status === 'active' ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Yopish
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewCategoryModal;







