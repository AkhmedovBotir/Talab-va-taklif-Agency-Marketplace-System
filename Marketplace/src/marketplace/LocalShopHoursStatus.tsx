import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import type { LocalShopWorkingHour } from '../types';
import { getLocalShopHoursStatus } from '../lib/localShopWorkingHours';
import { cn } from '../lib/utils';

type Props = {
  workingHours?: LocalShopWorkingHour[];
  compact?: boolean;
  className?: string;
};

const badgeText: Record<string, string> = {
  open: 'text-emerald-700',
  closed: 'text-amber-800',
  day_off: 'text-slate-600',
  unknown: 'text-slate-500',
};

const badgeBg: Record<string, string> = {
  open: 'border-emerald-200 bg-emerald-50',
  closed: 'border-amber-200 bg-amber-50',
  day_off: 'border-slate-200 bg-slate-100',
  unknown: 'border-slate-200 bg-slate-50',
};

export function LocalShopHoursStatus({ workingHours, compact = false, className }: Props) {
  const status = getLocalShopHoursStatus(workingHours);
  const state = status.state;

  return (
    <View className={cn('gap-1.5', className)}>
      <View className="flex-row flex-wrap items-center gap-2">
        <View className={cn('flex-row items-center gap-1 rounded-full border px-2 py-0.5', badgeBg[state])}>
          <Clock size={11} color={state === 'open' ? '#047857' : state === 'closed' ? '#b45309' : '#64748b'} />
          <Text className={cn('text-[10px] font-black uppercase tracking-wide', badgeText[state])}>
            {status.badgeLabel}
          </Text>
        </View>
        {!compact && status.hint ? (
          <Text className="text-[11px] font-semibold text-slate-500">{status.hint}</Text>
        ) : null}
      </View>
      <Text className={cn('font-semibold text-slate-600', compact ? 'text-[10px]' : 'text-[11px]')}>{status.todayLabel}</Text>
    </View>
  );
}
