import React, { useState, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRefs = useRef<(ScrollView | null)[]>([]);

  const handleClose = () => {
    setCurrentIndex(initialIndex);
    // Reset zoom
    scrollViewRefs.current.forEach((ref) => {
      if (ref) {
        ref.scrollTo({ x: 0, y: 0, animated: false });
      }
    });
    onClose();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      // Reset zoom before changing image
      const currentRef = scrollViewRefs.current[currentIndex];
      if (currentRef) {
        currentRef.scrollTo({ x: 0, y: 0, animated: false });
      }
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      // Reset zoom before changing image
      const currentRef = scrollViewRefs.current[currentIndex];
      if (currentRef) {
        currentRef.scrollTo({ x: 0, y: 0, animated: false });
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!visible || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar hidden />
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={handlePrev}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}

        <ScrollView
          ref={(ref) => {
            scrollViewRefs.current[currentIndex] = ref;
          }}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom={true}
          centerContent={true}
          scrollEventThrottle={16}
        >
          <Image
            source={{ uri: currentImage }}
            style={styles.image}
            resizeMode="contain"
          />
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.indicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Zoom hint */}
        <View style={styles.zoomHint}>
          <Ionicons name="expand" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.zoomHintText}>
            {Platform.OS === 'ios' 
              ? 'Yaqinlashtirish uchun barmoqlarni cho\'zing' 
              : 'Yaqinlashtirish uchun ikki barmoq bilan zoom qiling'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    transform: [{ translateY: -25 }],
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  indicators: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  zoomHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
});
