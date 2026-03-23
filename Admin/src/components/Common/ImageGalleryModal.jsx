import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';

const ImageGalleryModal = ({ open, onClose, images, currentIndex = 0, title = 'Rasm' }) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setActiveIndex(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1400]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[1500] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative max-w-7xl w-full max-h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-4">
                <div className="text-white">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  {images.length > 1 && (
                    <p className="text-sm text-white/80">
                      {activeIndex + 1} / {images.length}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <Close className="w-6 h-6" />
                </button>
              </div>

              {/* Image Container */}
              <div className="relative flex-1 flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
                {/* Previous Button */}
                {images.length > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                )}

                {/* Main Image */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    src={images[activeIndex]}
                    alt={`${title} - ${activeIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ERasm yuklanmadi%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </AnimatePresence>

                {/* Next Button */}
                {images.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-4 px-4 pb-4">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === activeIndex
                            ? 'border-white scale-110'
                            : 'border-white/30 hover:border-white/60'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3C/svg%3E';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyboard Navigation */}
              {images.length > 1 && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
                    onClick={handlePrevious}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
                    onClick={handleNext}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ImageGalleryModal;

