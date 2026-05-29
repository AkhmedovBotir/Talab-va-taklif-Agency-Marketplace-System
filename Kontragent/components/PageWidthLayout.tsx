import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** default true */
  flex?: boolean;
};

/** Web: markazda cheklangan kenglik va gutter; mobil — to‘liq kenglik. */
export function PageWidthLayout({ children, style, flex = true }: Props) {
  const { isWeb, maxPageWidth, pageGutter } = useResponsive();
  return (
    <View
      style={[
        flex ? { flex: 1 } : undefined,
        {
          width: '100%',
          maxWidth: isWeb ? maxPageWidth : undefined,
          alignSelf: isWeb ? 'center' : undefined,
          paddingHorizontal: pageGutter,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
