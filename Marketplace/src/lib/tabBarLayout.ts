import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab ichidagi icon + label balandligi (taxminan). */
export const TAB_BAR_CORE_HEIGHT = 58;

/** Tab bar atrofidagi vertikal padding (BottomTabBar `pb` + ichki). */
export const TAB_BAR_EDGE_PADDING = 16;

/**
 * Android 3-tugmali navigatsiyada `insets.bottom` ko‘pincha 0 bo‘ladi —
 * minimal fallback qo‘llanadi.
 */
export function resolveTabBarBottomInset(insetsBottom: number): number {
  if (Platform.OS === 'web') return 0;
  if (Platform.OS === 'android') return Math.max(insetsBottom, 48);
  return Math.max(insetsBottom, 0);
}

export function tabBarTotalClearance(insetsBottom: number): number {
  return TAB_BAR_CORE_HEIGHT + TAB_BAR_EDGE_PADDING + resolveTabBarBottomInset(insetsBottom);
}

/** Eski importlar uchun (Android fallback bilan). */
export const TAB_BAR_BOTTOM_CLEARANCE = tabBarTotalClearance(0);

export function useTabBarLayout() {
  const { bottom } = useSafeAreaInsets();
  const bottomInset = resolveTabBarBottomInset(bottom);
  return {
    bottomInset,
    clearance: tabBarTotalClearance(bottom),
  };
}
