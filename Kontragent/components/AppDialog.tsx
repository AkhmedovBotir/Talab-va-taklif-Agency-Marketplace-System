import React, { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export type DialogButtonVariant = 'default' | 'cancel' | 'destructive';

export type DialogButtonConfig = {
  label: string;
  onPress: () => void;
  variant?: DialogButtonVariant;
};

type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButtonConfig[];
  onRequestClose: () => void;
};

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export function AppDialog({ visible, title, message, buttons, onRequestClose }: AppDialogProps) {
  const { width, height } = useWindowDimensions();
  const sheetW = Math.min(420, width - 24);
  const maxBodyH = Math.min(280, height * 0.45);

  const handleBackdrop = () => {
    const cancel = buttons.find((b) => b.variant === 'cancel');
    if (cancel) {
      cancel.onPress();
      return;
    }
    if (buttons.length === 1) {
      buttons[0].onPress();
      return;
    }
    onRequestClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdrop} accessibilityRole="button" />
        <View style={[styles.sheet, { width: sheetW, maxWidth: '100%' }]}>
          <Text style={styles.title}>{title}</Text>
          {message ? (
            <ScrollView
              style={{ maxHeight: maxBodyH }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          ) : null}
          <View
            style={[
              styles.btnRow,
              width < 380 && styles.btnRowStack,
            ]}
          >
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={`${btn.label}-${i}`}
                style={[
                  styles.btn,
                  width < 380 && styles.btnFull,
                  btn.variant === 'cancel' && styles.btnCancel,
                  btn.variant === 'destructive' && styles.btnDestructive,
                  (btn.variant === 'default' || !btn.variant) && styles.btnPrimary,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.variant === 'cancel' && styles.btnTextCancel,
                    btn.variant === 'destructive' && styles.btnTextDestructive,
                    (btn.variant === 'default' || !btn.variant) && styles.btnTextPrimary,
                  ]}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

type DialogPayload = {
  title: string;
  message?: string;
  buttons: DialogButtonConfig[];
};

export function useAppDialog() {
  const [payload, setPayload] = useState<DialogPayload | null>(null);

  const dismiss = useCallback(() => setPayload(null), []);

  const alertDialog = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      setPayload({
        title,
        message,
        buttons: [
          {
            label: 'OK',
            onPress: () => {
              setPayload(null);
              onOk?.();
            },
            variant: 'default',
          },
        ],
      });
    },
    []
  );

  const confirmDialog = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: {
        confirmLabel?: string;
        cancelLabel?: string;
        destructive?: boolean;
      }
    ) => {
      setPayload({
        title,
        message,
        buttons: [
          {
            label: options?.cancelLabel ?? 'Bekor qilish',
            variant: 'cancel',
            onPress: () => setPayload(null),
          },
          {
            label: options?.confirmLabel ?? 'Tasdiqlash',
            variant: options?.destructive ? 'destructive' : 'default',
            onPress: () => {
              setPayload(null);
              onConfirm();
            },
          },
        ],
      });
    },
    []
  );

  const dialogEl = (
    <AppDialog
      visible={payload != null}
      title={payload?.title ?? ''}
      message={payload?.message}
      buttons={payload?.buttons ?? []}
      onRequestClose={dismiss}
    />
  );

  return { dialog: dialogEl, alert: alertDialog, confirm: confirmDialog, dismiss };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        maxHeight: '90vh' as unknown as number,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  btnRowStack: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...webPointer,
  },
  btnFull: {
    width: '100%',
  },
  btnCancel: {
    backgroundColor: '#F2F2F7',
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnDestructive: {
    backgroundColor: '#FF3B30',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  btnTextCancel: {
    color: '#333',
  },
  btnTextPrimary: {
    color: '#fff',
  },
  btnTextDestructive: {
    color: '#fff',
  },
});
