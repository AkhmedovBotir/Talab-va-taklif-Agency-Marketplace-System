import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { X, Bell, CheckCheck } from 'lucide-react';
import {
  api,
  hasMarketplaceSession,
  getMarketplaceToken,
  buildMarketplaceNotificationsWsUrl,
} from '../services/api';
import type { MarketplaceNotification } from '../types';
import { cn } from '../lib/utils';

function notificationTypeDotClass(type: string): string {
  switch (type) {
    case 'error':
      return 'bg-red-600';
    case 'warning':
      return 'bg-amber-600';
    case 'success':
      return 'bg-green-600';
    case 'update':
      return 'bg-blue-600';
    case 'announcement':
      return 'bg-violet-600';
    default:
      return 'bg-orange-500';
  }
}

type WebNotificationsContextValue = {
  notificationsCount: number;
  refreshNotificationsUnread: () => Promise<void>;
  notificationsInboxOpen: boolean;
  setNotificationsInboxOpen: (open: boolean) => void;
  openNotificationsInbox: () => void;
};

const WebNotificationsContext = createContext<WebNotificationsContextValue | null>(null);

export function WebNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsInboxOpen, setNotificationsInboxOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<MarketplaceNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifMarkAllBusy, setNotifMarkAllBusy] = useState(false);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);

  const refreshNotificationsUnread = useCallback(async () => {
    if (!(await hasMarketplaceSession())) {
      setNotificationsCount(0);
      return;
    }
    try {
      const n = await api.notifications.unreadCount();
      setNotificationsCount(Number.isFinite(n) && n >= 0 ? n : 0);
    } catch {
      setNotificationsCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshNotificationsUnread();
  }, [refreshNotificationsUnread]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => void refreshNotificationsUnread();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshNotificationsUnread]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attachHandlers = (socket: WebSocket) => {
      socket.onmessage = (ev) => {
        const raw = typeof ev.data === 'string' ? ev.data : '';
        try {
          const msg = JSON.parse(raw) as Record<string, unknown>;
          const event = String(msg?.event ?? msg?.type ?? '');
          if (event !== 'integration_notification_created') return;
          const row = (msg?.data ?? msg?.payload ?? msg?.notification) as Record<string, unknown> | undefined;
          if (!row || typeof row !== 'object') return;
          const targetType = String((row as { target_type?: string }).target_type ?? '').toLowerCase();
          if (targetType !== 'all' && targetType !== 'marketplace') return;
          const isRead = !!(row as { is_read?: boolean }).is_read;
          setNotificationsCount((c) => (isRead ? c : c + 1));
        } catch {
          /* ignore */
        }
      };
      socket.onclose = () => {
        ws = null;
        if (cancelled) return;
        retryTimer = setTimeout(() => void tryConnect(), 5000);
      };
      socket.onerror = () => {
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      };
    };

    const tryConnect = async () => {
      if (cancelled) return;
      if (ws && ws.readyState === WebSocket.OPEN) return;
      if (ws) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        ws = null;
      }
      if (!(await hasMarketplaceSession())) return;
      const token = await getMarketplaceToken();
      if (!token || cancelled) return;
      try {
        const url = buildMarketplaceNotificationsWsUrl(token);
        const socket = new WebSocket(url);
        ws = socket;
        attachHandlers(socket);
      } catch {
        ws = null;
      }
    };

    void tryConnect();
    const poll = setInterval(() => {
      if (cancelled) return;
      if (ws && ws.readyState === WebSocket.OPEN) return;
      void tryConnect();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (retryTimer) clearTimeout(retryTimer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    if (!notificationsInboxOpen) return;
    let alive = true;
    setNotifLoading(true);
    void api.notifications
      .list({ page: 1, limit: 20 })
      .then((res) => {
        if (!alive) return;
        setNotifItems(res.items);
        setNotifPage(1);
        setNotifTotalPages(Math.max(1, res.total_pages));
        void refreshNotificationsUnread();
      })
      .catch(() => {
        if (!alive) return;
        setNotifItems([]);
        setNotifTotalPages(1);
      })
      .finally(() => {
        if (alive) setNotifLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [notificationsInboxOpen, refreshNotificationsUnread]);

  const openNotificationsInbox = useCallback(() => {
    setNotificationsInboxOpen(true);
  }, []);

  const value: WebNotificationsContextValue = {
    notificationsCount,
    refreshNotificationsUnread,
    notificationsInboxOpen,
    setNotificationsInboxOpen,
    openNotificationsInbox,
  };

  return (
    <WebNotificationsContext.Provider value={value}>
      {children}
      {notificationsInboxOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Yopish"
            onClick={() => setNotificationsInboxOpen(false)}
          />
          <div
            className={cn(
              'relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl'
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="web-notif-title"
          >
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <h2 id="web-notif-title" className="text-lg font-black text-slate-900">
                  Bildirishnomalar
                </h2>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={notifMarkAllBusy}
                  onClick={() => {
                    if (notifMarkAllBusy) return;
                    setNotifMarkAllBusy(true);
                    void api.notifications
                      .markAllRead()
                      .then(() => {
                        setNotifItems((rows) =>
                          rows.map((r) => ({ ...r, is_read: true, read_at: r.read_at || new Date().toISOString() }))
                        );
                        void refreshNotificationsUnread();
                      })
                      .finally(() => setNotifMarkAllBusy(false));
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-100 disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  Hammasini o&apos;qilgan
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationsInboxOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {notifLoading ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {notifItems.length === 0 ? (
                  <p className="py-10 text-center text-sm font-semibold text-slate-400">Xabarlar yo&apos;q</p>
                ) : (
                  <ul className="space-y-2 pb-4">
                    {notifItems.map((item) => (
                      <li key={String(item.id)}>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.is_read) return;
                            void api.notifications.markRead(item.id).then(() => {
                              setNotifItems((rows) =>
                                rows.map((r) =>
                                  String(r.id) === String(item.id)
                                    ? { ...r, is_read: true, read_at: new Date().toISOString() }
                                    : r
                                )
                              );
                              void refreshNotificationsUnread();
                            });
                          }}
                          className={cn(
                            'w-full rounded-2xl border px-3 py-3 text-left transition hover:opacity-95',
                            item.is_read ? 'border-slate-100 bg-slate-50' : 'border-orange-100 bg-orange-50/50'
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={cn('h-2 w-2 shrink-0 rounded-full', notificationTypeDotClass(String(item.type)))}
                            />
                            <span className="flex-1 text-sm font-black text-slate-900">{item.title || 'Xabar'}</span>
                            {!item.is_read ? <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" /> : null}
                          </div>
                          <p className="text-xs font-medium leading-relaxed text-slate-600">{item.message}</p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {item.created_at ? String(item.created_at).slice(0, 16).replace('T', ' ') : ''}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {notifPage < notifTotalPages ? (
                  <button
                    type="button"
                    disabled={notifLoadingMore}
                    onClick={() => {
                      if (notifLoadingMore) return;
                      const next = notifPage + 1;
                      setNotifLoadingMore(true);
                      void api.notifications
                        .list({ page: next, limit: 20 })
                        .then((res) => {
                          setNotifItems((prev) => {
                            const seen = new Set(prev.map((x) => String(x.id)));
                            const merged = [...prev];
                            for (const row of res.items) {
                              if (!seen.has(String(row.id))) {
                                seen.add(String(row.id));
                                merged.push(row);
                              }
                            }
                            return merged;
                          });
                          setNotifPage(next);
                          setNotifTotalPages(Math.max(1, res.total_pages));
                        })
                        .finally(() => setNotifLoadingMore(false));
                    }}
                    className="mb-4 mt-1 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {notifLoadingMore ? 'Yuklanmoqda…' : 'Yana yuklash'}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </WebNotificationsContext.Provider>
  );
}

export function useWebNotifications() {
  const ctx = useContext(WebNotificationsContext);
  if (!ctx) throw new Error('useWebNotifications must be used inside WebNotificationsProvider');
  return ctx;
}
