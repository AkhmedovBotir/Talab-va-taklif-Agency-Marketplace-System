import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageCarouselProps {
  images: string[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onImagePress?: (index: number) => void;
  imageHeight?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH;
const DEFAULT_IMAGE_HEIGHT = 300;

export default function ImageCarousel({
  images,
  autoPlay = false,
  autoPlayInterval = 3000,
  onImagePress,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoPlay && images.length > 1) {
      startAutoPlay();
      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlay, images.length]);

  const startAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % images.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * IMAGE_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, autoPlayInterval);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.imagePlaceholder, { height: imageHeight }]}>
          <Ionicons name="image-outline" size={64} color="#ccc" />
        </View>
      </View>
    );
  }

  if (images.length === 1) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => onImagePress?.(0)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: images[0] }}
          style={[styles.singleImage, { height: imageHeight }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
          }
        }}
        onScrollEndDrag={() => {
          if (autoPlay) {
            startAutoPlay();
          }
        }}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => onImagePress?.(index)}
          >
            <Image
              source={{ uri: image }}
              style={[styles.image, { height: imageHeight }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicators */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: IMAGE_WIDTH,
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  singleImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
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
});

