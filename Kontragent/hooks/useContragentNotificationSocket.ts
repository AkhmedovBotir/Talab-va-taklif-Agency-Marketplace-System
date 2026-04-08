import { useEffect, useRef } from 'react';
import { getContragentNotificationsWebSocketUrl } from '../services/apiConfig';
import { notifyContragentNotificationInbox } from '../services/contragentNotificationEvents';

const RECONNECT_MS = 4000;

function parseSocketEvent(raw: string): { event?: string } {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    let event: string | undefined;
    if (typeof o.event === 'string' && o.event) event = o.event;
    else if (typeof o.type === 'string' && o.type) event = o.type;
    else if (typeof o.name === 'string' && o.name) event = o.name;
    return { event };
  } catch {
    return {};
  }
}

/**
 * Bitta ulanish: `integration_notification_created` yoki noma'lum JSON — inbox yangilanadi.
 */
export function useContragentNotificationSocket(
  token: string | null | undefined,
  onServerPush: () => void
) {
  const onPushRef = useRef(onServerPush);
  onPushRef.current = onServerPush;

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const handleMessage = (data: string) => {
      const { event } = parseSocketEvent(data);
      if (
        event === 'integration_notification_created' ||
        event === undefined ||
        event === ''
      ) {
        notifyContragentNotificationInbox();
        onPushRef.current();
      }
    };

    const connect = () => {
      if (cancelled) return;
      try {
        const url = getContragentNotificationsWebSocketUrl(token);
        ws = new WebSocket(url);

        ws.onmessage = (ev) => {
          const payload = typeof ev.data === 'string' ? ev.data : '';
          if (payload) handleMessage(payload);
          else {
            notifyContragentNotificationInbox();
            onPushRef.current();
          }
        };

        ws.onerror = () => {
          /* onclose reconnect */
        };

        ws.onopen = () => {
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = undefined;
          }
        };

        ws.onclose = () => {
          ws = null;
          if (!cancelled) {
            reconnectTimer = setTimeout(connect, RECONNECT_MS);
          }
        };
      } catch {
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, RECONNECT_MS);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
    };
  }, [token]);
}
