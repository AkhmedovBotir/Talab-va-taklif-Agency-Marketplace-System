import {
  getPunktNotificationsWebSocketUrl,
  PunktMeNotificationItem,
  PunktMeNotificationSocketPayload,
} from './api';

type UnreadListener = () => void;
type NewNotificationListener = (n: PunktMeNotificationItem) => void;

const unreadListeners = new Set<UnreadListener>();
const newListeners = new Set<NewNotificationListener>();

let socket: WebSocket | null = null;
let activeToken: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const RECONNECT_MS = 5000;

function hasSubscribers(): boolean {
  return unreadListeners.size > 0 || newListeners.size > 0;
}

function notifyUnread() {
  unreadListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

function notifyNew(n: PunktMeNotificationItem) {
  newListeners.forEach((cb) => {
    try {
      cb(n);
    } catch {
      /* ignore */
    }
  });
}

function normalizeSocketNotification(p: PunktMeNotificationSocketPayload): PunktMeNotificationItem {
  return {
    id: p.id,
    title: p.title,
    message: p.message,
    type: p.type,
    target_type: p.target_type,
    is_read: false,
    read_at: null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function disconnectSocket() {
  clearReconnectTimer();
  if (socket) {
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {
      /* ignore */
    }
    socket = null;
  }
  activeToken = null;
}

function scheduleReconnect(token: string) {
  clearReconnectTimer();
  if (!hasSubscribers()) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSocket(token);
  }, RECONNECT_MS);
}

function connectSocket(token: string) {
  if (typeof WebSocket === 'undefined') {
    return;
  }
  if (socket && activeToken === token && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  disconnectSocket();
  activeToken = token;
  try {
    const url = getPunktNotificationsWebSocketUrl(token);
    const ws = new WebSocket(url);
    socket = ws;
    ws.onmessage = (ev) => {
      try {
        const raw = typeof ev.data === 'string' ? ev.data : '';
        const msg = JSON.parse(raw) as {
          event?: string;
          notification?: PunktMeNotificationSocketPayload;
        };
        if (msg.event === 'integration_notification_created' && msg.notification) {
          notifyUnread();
          notifyNew(normalizeSocketNotification(msg.notification));
        }
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      if (activeToken === token && hasSubscribers()) {
        scheduleReconnect(token);
      }
    };
    ws.onerror = () => {
      /* onclose reconnect */
    };
  } catch {
    scheduleReconnect(token);
  }
}

/**
 * Bir nechta komponentdan chaqirilishi mumkin; bitta WebSocket ulanishi va
 * `integration_notification_created` da barcha tinglovchilarga xabar beradi.
 */
export function subscribePunktNotificationRealtime(
  token: string | null,
  enabled: boolean,
  opts: { onUnread?: UnreadListener; onNew?: NewNotificationListener }
): () => void {
  if (opts.onUnread) unreadListeners.add(opts.onUnread);
  if (opts.onNew) newListeners.add(opts.onNew);

  if (enabled && token && hasSubscribers()) {
    connectSocket(token);
  }

  return () => {
    if (opts.onUnread) unreadListeners.delete(opts.onUnread);
    if (opts.onNew) newListeners.delete(opts.onNew);
    if (!hasSubscribers()) {
      disconnectSocket();
    }
  };
}
