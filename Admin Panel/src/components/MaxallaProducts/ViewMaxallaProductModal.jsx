import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';
import ImageGalleryModal from '../Common/ImageGalleryModal';
import { formatDateTime } from '../../utils/dateFormatter';

const ViewMaxallaProductModal = ({ open, onClose, product }) => {
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageGalleryOpen(true);
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
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

  const baseProduct = product.baseProduct || {};
  const contragent = product.contragent || {};

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-gray-800"
          >
            Maxalla Maxsulot Ma'lumotlari
          </motion.div>
        </DialogTitle>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Base Product Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asosiy Maxsulot Ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{baseProduct.name || '-'}</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-sm">
                    <span className={getStatusBadge(baseProduct.status)}>
                      {getStatusLabel(baseProduct.status)}
                    </span>
                  </p>
                </div>
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Rasmlar ({baseProduct.images.length} ta)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {baseProduct.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${baseProduct.name} - ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(index)}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ERasm yuklanmadi%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Maxalla Maxsulot Ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Narx</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatPrice(product.price)}
                  </p>
                </div>
                {product.originalPrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asl narx</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formatPrice(product.originalPrice)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {product.quantity !== undefined
                      ? `${product.quantity} ${getUnitLabel(baseProduct.unit)}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-sm">
                    <span className={getStatusBadge(product.status)}>
                      {getStatusLabel(product.status)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contragent Information */}
            {contragent && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Kontragent Ma'lumotlari</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {contragent.name || '-'}
                    </p>
                  </div>
                  {contragent.inn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">INN</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {contragent.inn}
                      </p>
                    </div>
                  )}
                  {contragent.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {contragent.phone}
                      </p>
                    </div>
                  )}
                  {contragent.viloyat && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {contragent.viloyat.name || '-'}
                      </p>
                    </div>
                  )}
                  {contragent.tuman && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tuman</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {contragent.tuman.name || '-'}
                      </p>
                    </div>
                  )}
                  {contragent.mfy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MFY</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {contragent.mfy.name || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Qo'shimcha Ma'lumotlar</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formatDateTime(product.createdAt)}
                    </p>
                  </div>
                )}
                {product.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formatDateTime(product.updatedAt)}
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

export default ViewMaxallaProductModal;
