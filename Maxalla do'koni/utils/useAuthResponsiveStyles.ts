import { Platform, useWindowDimensions, ViewStyle, TextStyle } from 'react-native';

export function useAuthResponsiveStyles() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isNarrowWeb = isWeb && width < 480;
  const isVeryNarrowWeb = isWeb && width < 380;

  const scrollContentExtra: ViewStyle | null = isNarrowWeb
    ? { paddingHorizontal: 16, paddingVertical: 28 }
    : null;

  const cardExtra: ViewStyle | null = isNarrowWeb ? { padding: 20 } : null;

  const inputWrapperExtra: ViewStyle | null = isWeb
    ? {
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }
    : null;

  const inputExtra: TextStyle | null = isWeb ? { width: 0 } : null;

  const eyeIconExtra: ViewStyle | null = isWeb
    ? { flexShrink: 0, marginLeft: 4 }
    : null;

  const inputIconExtra: ViewStyle | null = isWeb ? { flexShrink: 0 } : null;

  const phonePrefixExtra: ViewStyle | null = isWeb ? { flexShrink: 0 } : null;

  const phoneDividerExtra: ViewStyle | null = isWeb
    ? { flexShrink: 0, marginHorizontal: isVeryNarrowWeb ? 8 : 12 }
    : null;

  const codeInputsExtra: ViewStyle | null = {
    gap: isVeryNarrowWeb ? 6 : isNarrowWeb ? 8 : isWeb ? 10 : 12,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  };

  const codeInputExtra: ViewStyle | null = {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: isVeryNarrowWeb ? 44 : isNarrowWeb ? 52 : isWeb ? 60 : undefined,
  };

  const codeInputLargeExtra: ViewStyle | null = isVeryNarrowWeb
    ? { height: 52, fontSize: 22 }
    : isNarrowWeb
      ? { height: 56, fontSize: 24 }
      : null;

  const webShellPadding: ViewStyle | null = isWeb
    ? { paddingHorizontal: isVeryNarrowWeb ? 12 : isNarrowWeb ? 14 : 16 }
    : null;

  return {
    isNarrowWeb,
    scrollContentExtra,
    cardExtra,
    inputWrapperExtra,
    inputExtra,
    eyeIconExtra,
    inputIconExtra,
    phonePrefixExtra,
    phoneDividerExtra,
    codeInputsExtra,
    codeInputExtra,
    codeInputLargeExtra,
    webShellPadding,
  };
}
