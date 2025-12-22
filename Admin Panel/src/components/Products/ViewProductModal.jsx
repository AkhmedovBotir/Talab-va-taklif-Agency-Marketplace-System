import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';
import ImageGalleryModal from '../Common/ImageGalleryModal';

const ViewProductModal = ({ open, onClose, product }) => {
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageGalleryOpen(true);
  };

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
      case 'archived':
        return `${baseClasses} bg-red-100 text-red-800`;
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
      case 'archived':
        return 'Arxivlangan';
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800"
        >
          Mahsulot ma'lumotlari
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
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{product.name || '-'}</p>
              </div>
              {product.productCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot kodi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{product.productCode}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {product.category?.name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subkategoriya</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {product.subcategory?.name || '-'}
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

          {/* Price and Quantity */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Narx va miqdor</h4>
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
                    ? `${product.quantity} ${getUnitLabel(product.unit)}`
                    : '-'}
                </p>
              </div>
              {product.unitSize && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O'lcham</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{product.unitSize}</p>
                </div>
              )}
              {product.kpiBonusPercent !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KPI bonus foizi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {product.kpiBonusPercent}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Physical Dimensions */}
          {(product.length !== undefined || product.width !== undefined || product.weight !== undefined) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Fizik o'lchamlar</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {product.length !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uzunlik (cm)</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.length} cm
                    </p>
                  </div>
                )}
                {product.width !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kenglik (cm)</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.width} cm
                    </p>
                  </div>
                )}
                {product.weight !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Og'irlik (kg)</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.weight} kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contragent Information */}
          {product.contragent && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Kontragent ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {product.contragent.name || '-'}
                  </p>
                </div>
                {product.contragent.inn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">INN</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.contragent.inn}
                    </p>
                  </div>
                )}
                {product.contragent.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.contragent.phone}
                    </p>
                  </div>
                )}
                {product.contragent.viloyat && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.contragent.viloyat.name || '-'}
                    </p>
                  </div>
                )}
                {product.contragent.tuman && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tuman</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {product.contragent.tuman.name || '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Regions */}
          {product.deliveryRegions && product.deliveryRegions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Yetkazib berish regionlari ({product.deliveryRegions.length} ta)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {product.deliveryRegions.map((region, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {region.viloyat?.name || '-'}
                        </p>
                        {region.tuman && (
                          <p className="text-xs text-gray-500">{region.tuman.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Rasmlar ({product.images.length} ta)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
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

          {/* Dates */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Sana ma'lumotlari</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yaratilgan sana</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatDate(product.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yangilangan sana</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {formatDate(product.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Yopish
        </Button>
      </DialogActions>

      {/* Image Gallery Modal */}
      {product.images && product.images.length > 0 && (
        <ImageGalleryModal
          open={imageGalleryOpen}
          onClose={() => setImageGalleryOpen(false)}
          images={product.images}
          currentIndex={selectedImageIndex}
          title={product.name}
        />
      )}
    </Dialog>
  );
};

export default ViewProductModal;





