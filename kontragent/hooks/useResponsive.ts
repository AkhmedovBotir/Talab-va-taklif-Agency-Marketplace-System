import { Platform, useWindowDimensions } from 'react-native';

/** planshet / katta brauzer oynasi */
export const BREAKPOINT_TABLET = 768;
/** ikki ustunli web layout */
export const BREAKPOINT_DESKTOP = 960;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && width >= BREAKPOINT_DESKTOP;
  const isTabletWeb = isWeb && width >= BREAKPOINT_TABLET && width < BREAKPOINT_DESKTOP;
  /** Profil/kabinet: planshetdan boshlab ikki ustun */
  const isWideWeb = isWeb && width >= BREAKPOINT_TABLET;

  const maxPageWidth = isDesktopWeb ? 1080 : isTabletWeb ? 800 : width;
  const pageGutter = isDesktopWeb ? 28 : isTabletWeb ? 20 : 16;

  return {
    width,
    height,
    isWeb,
    isDesktopWeb,
    isTabletWeb,
    isWideWeb,
    maxPageWidth: Math.min(maxPageWidth, width),
    pageGutter,
  };
}
