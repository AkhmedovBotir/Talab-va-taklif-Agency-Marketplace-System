import type { MarketplaceOrderAddress, MarketplaceOrderRoadmap } from '../types';
import { cn } from './utils';

export function orderStatusLabelUz(status: string): string {
  switch (status) {
    case 'pending':
      return 'Kutilmoqda';
    case 'cancelled':
      return 'Bekor qilingan';
    case 'delivered':
      return 'Yetkazilgan';
    default:
      return status;
  }
}

function orderStatusBadgeTokens(status: string): { box: string; label: string } {
  const boxBase = 'rounded-full border px-3.5 py-1.5 shadow-sm';
  switch (status) {
    case 'pending':
      return {
        box: cn(boxBase, 'border-amber-200/90 bg-amber-50'),
        label: 'text-amber-950',
      };
    case 'cancelled':
      return {
        box: cn(boxBase, 'border-rose-200/90 bg-rose-50'),
        label: 'text-rose-900',
      };
    case 'delivered':
      return {
        box: cn(boxBase, 'border-emerald-200/90 bg-emerald-50'),
        label: 'text-emerald-900',
      };
    default:
      return {
        box: cn(boxBase, 'border-slate-200/90 bg-slate-100'),
        label: 'text-slate-800',
      };
  }
}

/** RN / NativeWind: tashqi konteyner (badge fon va chegarasi) */
export function orderStatusBadgeBoxClassName(status: string): string {
  return cn('self-start', orderStatusBadgeTokens(status).box);
}

/** Matn rangi (ichki `Text` / `span`) */
export function orderStatusBadgeLabelClassName(status: string): string {
  return cn('text-sm font-black tracking-tight', orderStatusBadgeTokens(status).label);
}

/** Vite / HTML: bitta elementda badge */
export function orderStatusBadgeCombinedClassName(status: string): string {
  const { box, label } = orderStatusBadgeTokens(status);
  return cn('inline-flex items-center', box, label, 'text-sm font-black tracking-tight');
}

export function formatOrderAddressSummary(a: MarketplaceOrderAddress): string {
  if (a.custom_text) return a.custom_text;
  const parts = [a.area_name].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Saqlangan manzil';
}

export function orderRoadmapStageLabel(stage: string): string {
  const map: Record<string, string> = {
    created: 'Buyurtma yaratildi',
    punkt_assigned: 'Punkt biriktirildi',
    punkt_accepted: 'Punkt qabul qildi',
    punkt_rejected: 'Punkt rad etdi',
    contragent_requests_created: 'Kontragent so‘rovlari yaratildi',
    punkt_collected: 'Punkt yig‘ib oldi',
    punkt_ready: 'Punkt tayyor qildi',
    agent_assigned: 'Agent biriktirildi',
    agent_declared_payment_to_punkt: 'Agent to‘lovni bildirdi',
    punkt_confirmed_agent_payment: 'Punkt to‘lovni tasdiqladi',
    punkt_post_payment_delivered: 'To‘lovdan keyin yetkazildi',
    punkt_remainder_handed_over: 'Qolgan pul topshirildi',
    delivered: 'Yetkazilgan',
    cancelled: 'Bekor qilingan',
  };
  return map[stage] ?? stage;
}

export function getOrderRoadmapStages(roadmap?: MarketplaceOrderRoadmap): Array<{ key: string; done: boolean; at?: string }> {
  if (!roadmap) return [];
  const pick = (key: string) => {
    const item = roadmap[key];
    if (!item || typeof item !== 'object' || !('done' in item)) return undefined;
    return {
      key,
      done: !!item.done,
      at: item.at ? String(item.at) : undefined,
    };
  };

  const out: Array<{ key: string; done: boolean; at?: string }> = [];
  const created = pick('created');
  if (created) out.push(created);

  // "qabul qildi yoki rad etdi" — done bo'lganini ko'rsatamiz, aks holda qabul qildi.
  const accepted = pick('punkt_accepted');
  const rejected = pick('punkt_rejected');
  const punktDecision = rejected?.done ? rejected : accepted ?? rejected;
  if (punktDecision) out.push(punktDecision);

  const collected = pick('punkt_collected');
  if (collected) out.push(collected);

  const agentAssigned = pick('agent_assigned');
  if (agentAssigned) out.push(agentAssigned);

  const delivered = pick('delivered');
  if (delivered) out.push(delivered);

  return out;
}
