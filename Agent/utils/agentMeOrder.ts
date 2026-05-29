import type { AgentMeOrderListItem } from '../types/api';

/** API bo‘sh string yoki ISO vaqt qaytarishi mumkin */
export function isAgentOrderTimestampSet(v?: string | null): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

export function formatAgentOrderDateTime(iso?: string | null): string {
  if (!isAgentOrderTimestampSet(iso)) return '—';
  try {
    return new Date(iso!).toLocaleString('uz-UZ');
  } catch {
    return iso!.trim();
  }
}

/** Faol buyurtmada 11-qadam tugaganmi (mijozga yetkazishga ruxsat) */
export function canAgentDeliverOrder(o: Pick<AgentMeOrderListItem, 'marketplace_status' | 'punkt_post_payment_delivered_at'>): boolean {
  return o.marketplace_status === 'pending' && isAgentOrderTimestampSet(o.punkt_post_payment_delivered_at);
}

export function canAgentDeclarePaymentToPunkt(o: Pick<AgentMeOrderListItem, 'marketplace_status' | 'agent_declared_payment_to_punkt_at'>): boolean {
  return o.marketplace_status === 'pending' && !isAgentOrderTimestampSet(o.agent_declared_payment_to_punkt_at);
}
