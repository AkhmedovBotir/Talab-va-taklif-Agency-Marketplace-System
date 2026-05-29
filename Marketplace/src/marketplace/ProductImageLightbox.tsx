import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  Pressable,
  Text,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { cn } from '../lib/utils';

type Props = {
  visible: boolean;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function ProductImageLightbox({ visible, images, index, onIndexChange, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const slideHeight = Math.round(height * 0.72);

  useEffect(() => {
    if (!visible || !images.length) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [visible, index, width, images.length]);

  if (!images.length) return null;

  const goPrev = () => {
    const next = (index - 1 + images.length) % images.length;
    onIndexChange(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const goNext = () => {
    const next = (index + 1) % images.length;
    onIndexChange(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i >= 0 && i < images.length && i !== index) onIndexChange(i);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black">
        <Pressable
          onPress={onClose}
          className="absolute right-4 top-12 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/15"
          hitSlop={12}
        >
          <X size={26} color="#ffffff" />
        </Pressable>

        {images.length > 1 ? (
          <Text className="absolute left-0 right-0 top-14 z-10 text-center text-sm font-bold text-white/80">
            {index + 1} / {images.length}
          </Text>
        ) : null}

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={{ width, height: slideHeight }} className="items-center justify-center">
              <Image source={{ uri }} style={{ width: width - 24, height: slideHeight }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 ? (
          <>
            <Pressable
              onPress={goPrev}
              className="absolute left-3 top-1/2 z-10 h-11 w-11 -mt-5 items-center justify-center rounded-full bg-white/20"
              hitSlop={8}
            >
              <ChevronLeft size={22} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={goNext}
              className="absolute right-3 top-1/2 z-10 h-11 w-11 -mt-5 items-center justify-center rounded-full bg-white/20"
              hitSlop={8}
            >
              <ChevronRight size={22} color="#ffffff" />
            </Pressable>
            <View className="absolute bottom-10 left-0 right-0 flex-row items-center justify-center gap-2 px-4">
              {images.map((_, i) => (
                <Pressable key={i} onPress={() => {
                  onIndexChange(i);
                  scrollRef.current?.scrollTo({ x: i * width, animated: true });
                }}>
                  <View
                    className={cn('h-2 rounded-full', index === i ? 'w-7 bg-orange-500' : 'w-2 bg-white/40')}
                  />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}
