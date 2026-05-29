import React, { useSyncExternalStore } from 'react';
import { Modal, View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { cn } from '../lib/utils';
import {
  dismissWebToast,
  getWebToasts,
  subscribeWebToasts,
  type UserMessageType,
} from '../lib/userMessage';

function toastStyles(type: UserMessageType) {
  switch (type) {
    case 'success':
      return {
        wrap: 'border-emerald-200 bg-emerald-50',
        title: 'text-emerald-950',
        message: 'text-emerald-900',
        iconColor: '#059669',
        Icon: CheckCircle2,
      };
    case 'error':
      return {
        wrap: 'border-red-200 bg-red-50',
        title: 'text-red-950',
        message: 'text-red-900',
        iconColor: '#dc2626',
        Icon: AlertCircle,
      };
    default:
      return {
        wrap: 'border-slate-200 bg-white',
        title: 'text-slate-950',
        message: 'text-slate-700',
        iconColor: '#f97316',
        Icon: Info,
      };
  }
}

function ToastStack({ topInset }: { topInset: number }) {
  const toasts = useSyncExternalStore(subscribeWebToasts, getWebToasts, getWebToasts);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="w-full items-center gap-2 px-4"
      style={{ paddingTop: Math.max(topInset, 12) }}
      accessibilityLiveRegion="polite"
    >
      {toasts.map((toast) => {
        const type = toast.type ?? 'info';
        const { wrap, title, message, iconColor, Icon } = toastStyles(type);
        return (
          <View
            key={toast.id}
            className={cn(
              'w-full max-w-md flex-row items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg',
              wrap
            )}
            style={
              Platform.OS === 'web'
                ? { boxShadow: '0 10px 40px rgba(15, 23, 42, 0.12)' }
                : undefined
            }
          >
            <Icon size={20} color={iconColor} style={{ marginTop: 2 }} />
            <View className="min-w-0 flex-1">
              {toast.title ? (
                <Text className={cn('text-sm font-black leading-snug', title)}>{toast.title}</Text>
              ) : null}
              <Text className={cn('text-sm font-semibold leading-snug', toast.title ? 'mt-0.5 opacity-90' : '', message)}>
                {toast.message}
              </Text>
            </View>
            <Pressable
              onPress={() => dismissWebToast(toast.id)}
              accessibilityLabel="Yopish"
              className="h-8 w-8 items-center justify-center rounded-full bg-black/5"
            >
              <X size={16} color="#64748b" />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/**
 * RN Modal — boshqa Modal (masalan, hamkorlik so‘rovi) ustida chiqadi.
 * Expo web / mobil va React Router (RN Web) uchun.
 */
export function UserMessageToastHost() {
  const toasts = useSyncExternalStore(subscribeWebToasts, getWebToasts, getWebToasts);
  const insets = useSafeAreaInsets();
  const visible = toasts.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        const last = toasts[toasts.length - 1];
        if (last) dismissWebToast(last.id);
      }}
    >
      <View pointerEvents="box-none" className="flex-1">
        <ToastStack topInset={insets.top} />
      </View>
    </Modal>
  );
}
