import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from '../../src/marketplace/BottomTabBar';
import type { TabStackRoute } from '../../src/marketplace/tabRoutes';

type TabRouteShellProps = {
  children: React.ReactNode;
  stackRoute: TabStackRoute;
};

/** Pastki nav faqat prop orqali — hech qanday usePathname / useFocusEffect / navigation hook yo‘q. */
export function TabRouteShell({ children, stackRoute }: TabRouteShellProps) {
  return (
    <View className="flex-1">
      {children}
      <BottomTabBar stackRoute={stackRoute} />
    </View>
  );
}

export default TabRouteShell;
