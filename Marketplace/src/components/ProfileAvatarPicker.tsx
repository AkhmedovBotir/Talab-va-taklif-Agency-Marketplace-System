import React from 'react';
import { View, Image, Pressable, Platform, ActivityIndicator, Text } from 'react-native';
import { Camera, Trash2, User } from 'lucide-react-native';
import { cn } from '../lib/utils';
import { PROFILE_AVATAR_FRAME_CLASS, PROFILE_AVATAR_SIZE_CLASS } from '../lib/profileAvatarImage';

type ProfileAvatarPickerProps = {
  avatar: string;
  busy: boolean;
  onPick: () => void;
  onDelete: () => void;
  placeholderIconSize?: number;
};

export function ProfileAvatarPicker({
  avatar,
  busy,
  onPick,
  onDelete,
  placeholderIconSize = 30,
}: ProfileAvatarPickerProps) {
  return (
    <View className="items-center rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-3">
      <View className={cn(PROFILE_AVATAR_FRAME_CLASS, PROFILE_AVATAR_SIZE_CLASS)}>
        {avatar ? (
          <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <User size={placeholderIconSize} color="white" />
          </View>
        )}
        {busy ? (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : null}
      </View>
      <View className="mt-3 flex-row items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
        <Pressable
          onPress={onDelete}
          disabled={busy || !avatar}
          accessibilityLabel="Profil rasmini o‘chirish"
          className={cn(
            'h-9 w-9 items-center justify-center rounded-full bg-rose-500 sm:h-10 sm:w-10',
            (busy || !avatar) && 'opacity-40'
          )}
        >
          <Trash2 size={14} color="white" />
        </Pressable>
        <Pressable
          onPress={onPick}
          disabled={busy}
          accessibilityLabel="Profil rasmini tanlash"
          className={cn(
            'h-9 w-9 items-center justify-center rounded-full bg-slate-900 sm:h-10 sm:w-10',
            busy && 'opacity-60'
          )}
        >
          <Camera size={14} color="white" />
        </Pressable>
      </View>
      {Platform.OS === 'web' ? (
        <Text className="mt-2 max-w-[220px] text-center text-[10px] font-semibold leading-snug text-slate-400">
          KVadrat rasm tavsiya etiladi · avtomatik siqiladi
        </Text>
      ) : null}
    </View>
  );
}
