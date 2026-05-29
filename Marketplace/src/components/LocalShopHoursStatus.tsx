import React from 'react';
import { Clock } from 'lucide-react';
import type { LocalShopWorkingHour } from '../types';
import { getLocalShopHoursStatus } from '../lib/localShopWorkingHours';
import { cn } from '../lib/utils';

type Props = {
  workingHours?: LocalShopWorkingHour[];
  compact?: boolean;
  className?: string;
};

const badgeStyles = {
  open: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  closed: 'border-amber-200 bg-amber-50 text-amber-800',
  day_off: 'border-slate-200 bg-slate-100 text-slate-600',
  unknown: 'border-slate-200 bg-slate-50 text-slate-500',
} as const;

export function LocalShopHoursStatus({ workingHours, compact = false, className }: Props) {
  const status = getLocalShopHoursStatus(workingHours);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
            badgeStyles[status.state]
          )}
        >
          <Clock size={11} strokeWidth={2.5} />
          {status.badgeLabel}
        </span>
        {!compact && status.hint ? (
          <span className="text-[11px] font-semibold text-slate-500">{status.hint}</span>
        ) : null}
      </div>
      <p className={cn('font-semibold text-slate-600', compact ? 'text-[10px]' : 'text-[11px]')}>{status.todayLabel}</p>
    </div>
  );
}
