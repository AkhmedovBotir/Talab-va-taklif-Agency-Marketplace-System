import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authScreenStyles } from '../utils/authLayout';
import { useAuthResponsiveStyles } from '../utils/useAuthResponsiveStyles';

interface AuthScreenLayoutProps {
  children: React.ReactNode;
}

export default function AuthScreenLayout({ children }: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const responsive = useAuthResponsiveStyles();

  return (
    <KeyboardAvoidingView
      style={[authScreenStyles.container, { paddingTop: insets.top }]}
      behavior={isWeb ? undefined : Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={isWeb ? styles.scroll : undefined}
        contentContainerStyle={[
          authScreenStyles.scrollContent,
          responsive.scrollContentExtra,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            authScreenStyles.content,
            responsive.isNarrowWeb && styles.contentNarrow,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  contentNarrow: {
    maxWidth: '100%',
  },
});
