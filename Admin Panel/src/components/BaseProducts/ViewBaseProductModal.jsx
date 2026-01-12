import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';
import ImageGalleryModal from '../Common/ImageGalleryModal';
import { formatDateTime } from '../../utils/dateFormatter';

const ViewBaseProductModal = ({ open, onClose, baseProduct }) => {
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!baseProduct) return null;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageGalleryOpen(true);
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Nofaol';
      default:
        return status;
    }
  };

  const getUnitLabel = (unit) => {
    switch (unit) {
      case 'dona':
        return 'dona';
      case 'litr':
        return 'litr';
      case 'kg':
        return 'kg';
      default:
        return unit || '-';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-gray-800"
          >
            Shablon ma'lumotlari
          </motion.div>
        </DialogTitle>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asosiy ma'lumotlar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{baseProduct.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-sm">
                    <span className={getStatusBadge(baseProduct.status)}>
                      {getStatusLabel(baseProduct.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {baseProduct.category?.name || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subkategoriya</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {baseProduct.subcategory?.name || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birlik</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {getUnitLabel(baseProduct.unit)}
                  </p>
                </div>
                {baseProduct.unitSize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birlik o'lchami</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{baseProduct.unitSize}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {baseProduct.description && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tavsif</h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                  {typeof baseProduct.description === 'string' 
                    ? baseProduct.description 
                    : JSON.stringify(baseProduct.description)}
                </p>
              </div>
            )}

            {/* Images */}
            {baseProduct.images && baseProduct.images.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Rasmlar</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {baseProduct.images.map((image, index) => (
                    <div
                      key={index}
                      className="cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={image}
                        alt={`${baseProduct.name} - ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-200 hover:border-indigo-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Qo'shimcha ma'lumotlar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {baseProduct.createdBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yaratgan admin</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {baseProduct.createdBy.name || baseProduct.createdBy.email || '-'}
                    </p>
                  </div>
                )}
                {baseProduct.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formatDateTime(baseProduct.createdAt)}
                    </p>
                  </div>
                )}
                {baseProduct.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formatDateTime(baseProduct.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      <ImageGalleryModal
        open={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        images={baseProduct.images || []}
        currentIndex={selectedImageIndex}
        title={baseProduct.name}
      />
    </>
  );
};

export default ViewBaseProductModal;
