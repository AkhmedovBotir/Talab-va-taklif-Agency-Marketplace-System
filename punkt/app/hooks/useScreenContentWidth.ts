import { Platform, useWindowDimensions } from 'react-native';

/** Katta ekranlarda ro‘yxat ustuni (desktop web) */
export const WEB_LIST_MAX_WIDTH = 1280;

/** Ro‘yxat / detallar uchun markazdagi ustun (asosan web) */
export function useScreenContentWidth(maxInnerWidth = 640) {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const horizontalPad = Math.max(
    16,
    Math.min(isWeb ? 32 : 24, windowWidth * (isWeb ? 0.05 : 0.04))
  );
  const contentMaxWidth = Math.min(
    maxInnerWidth,
    Math.max(windowWidth - horizontalPad * 2, 280)
  );
  return { windowWidth, isWeb, horizontalPad, contentMaxWidth };
}
