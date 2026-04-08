import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CampaignOutlined,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  Notifications,
  SystemUpdateAlt,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { adminNotificationsAPI, buildAdminNotificationsWebSocketUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
};

/** Backend `type` → UI (rang + o‘zbekcha matn + ikonka). */
const NOTIFICATION_TYPE_META = {
  info: {
    label: "Ma'lumot",
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    Icon: InfoOutlined,
  },
  warning: {
    label: 'Ogohlantirish',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    Icon: WarningAmberOutlined,
  },
  success: {
    label: 'Muvaffaqiyat',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircleOutline,
  },
  error: {
    label: 'Xato',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    Icon: ErrorOutline,
  },
  update: {
    label: 'Yangilanish',
    badgeClass: 'bg-violet-50 text-violet-900 border-violet-200',
    Icon: SystemUpdateAlt,
  },
  announcement: {
    label: "E'lon",
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200',
    Icon: CampaignOutlined,
  },
};

const getNotificationTypeMeta = (type) => {
  const key = String(type || 'info').toLowerCase().trim();
  if (NOTIFICATION_TYPE_META[key]) return { key, ...NOTIFICATION_TYPE_META[key] };
  return {
    key,
    label: key || "Ma'lumot",
    badgeClass: NOTIFICATION_TYPE_META.info.badgeClass,
    Icon: InfoOutlined,
  };
};

const targetTypeLabel = (t) => {
  if (!t) return '';
  const s = String(t).toLowerCase();
  if (s === 'all') return 'Hamma';
  if (s === 'admins') return 'Adminlar';
  return t;
};

const AdminNotificationBell = () => {
  const { token, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const rootRef = useRef(null);
  const pageRef = useRef(1);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await adminNotificationsAPI.getUnreadCount();
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch {
      /* badge best-effort */
    }
  }, [token]);

  const loadPage = useCallback(
    async (p) => {
      if (!token) return;
      setListLoading(true);
      try {
        const res = await adminNotificationsAPI.getAll({ page: p, limit });
        const data = res.data || {};
        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        setPage(Number(data.page) || p);
        setTotalPages(Math.max(1, Number(data.total_pages) || 1));
        setTotal(Number(data.total) || list.length);
        if (data.unreadCount !== undefined) setUnreadCount(Number(data.unreadCount) || 0);
        else await refreshUnread();
      } catch (e) {
        showError(e.message || "Bildirishnomalarni yuklab bo'lmadi");
      } finally {
        setListLoading(false);
      }
    },
    [token, limit, refreshUnread, showError]
  );

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    refreshUnread();
  }, [isAuthenticated, token, refreshUnread]);

  useEffect(() => {
    if (!open || !token) return;
    loadPage(1);
  }, [open, token, loadPage]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const mergeIncoming = useCallback((notification) => {
    if (!notification?.id) return;
    let alreadyHad = false;
    setItems((prev) => {
      if (prev.some((x) => x.id === notification.id)) {
        alreadyHad = true;
        return prev;
      }
      const n = {
        ...notification,
        isRead: Boolean(notification.isRead ?? notification.is_read),
        readAt: notification.readAt ?? notification.read_at ?? null,
        createdAt: notification.createdAt ?? notification.created_at,
        updatedAt: notification.updatedAt ?? notification.updated_at,
        targetType: notification.targetType ?? notification.target_type,
      };
      if (pageRef.current !== 1) return prev;
      return [n, ...prev].slice(0, limit);
    });
    if (alreadyHad) return;
    if (!(notification.isRead ?? notification.is_read)) {
      setUnreadCount((c) => c + 1);
    }
  }, [limit]);

  const connectWs = useCallback(() => {
    if (!token) return;
    const url = buildAdminNotificationsWebSocketUrl(token);
    if (!url) return;

    const scheduleReconnect = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
      reconnectTimerRef.current = window.setTimeout(() => {
        if (localStorage.getItem('adminToken')) connectWs();
      }, delay);
    };

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.event === 'integration_notification_created' && msg.notification) {
            mergeIncoming(msg.notification);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        wsRef.current = null;
        if (localStorage.getItem('adminToken')) scheduleReconnect();
      };
    } catch {
      scheduleReconnect();
    }
  }, [token, mergeIncoming]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }
    connectWs();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, connectWs]);

  const handleMarkOne = async (id) => {
    setActionId(id);
    try {
      await adminNotificationsAPI.markRead(id);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, isRead: true, readAt: new Date().toISOString() } : x))
      );
      await refreshUnread();
    } catch (e) {
      showError(e.message || 'Xatolik');
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkAllBusy(true);
    try {
      await adminNotificationsAPI.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
      showSuccess("Barchasi o'qildi");
    } catch (e) {
      showError(e.message || 'Xatolik');
    } finally {
      setMarkAllBusy(false);
    }
  };

  if (!isAuthenticated || !token) return null;

  const badge = unreadCount > 99 ? '99+' : String(unreadCount || '');

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Bildirishnomalar"
        aria-expanded={open}
      >
        <Notifications className={unreadCount > 0 ? 'text-indigo-600' : 'text-gray-500'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[min(100vw-2rem,380px)] rounded-xl border border-gray-200 bg-white shadow-xl z-50 flex flex-col max-h-[min(70vh,520px)]"
          style={{ margin: 0 }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Bildirishnomalar</p>
            <button
              type="button"
              disabled={markAllBusy || unreadCount === 0}
              onClick={handleMarkAll}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              {markAllBusy ? '...' : "Hammasini o'qildi"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {listLoading ? (
              <p className="p-4 text-sm text-gray-500 text-center">Yuklanmoqda...</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">Bildirishnoma yo'q</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((n) => {
                  const typeMeta = getNotificationTypeMeta(n.type);
                  const TypeIcon = typeMeta.Icon;
                  const rowClass = `w-full text-left px-3 py-2.5 transition-colors ${
                    !n.isRead ? 'bg-indigo-50/40 hover:bg-indigo-50/70 cursor-pointer' : 'hover:bg-gray-50'
                  }`;
                  const inner = (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={`shrink-0 mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border ${typeMeta.badgeClass}`}
                            title={typeMeta.label}
                          >
                            <TypeIcon sx={{ fontSize: 16 }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{n.title || '—'}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-3 whitespace-pre-wrap">{n.message || ''}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pl-9">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeMeta.badgeClass}`}
                            title={`Turi: ${typeMeta.key}`}
                          >
                            {typeMeta.label}
                          </span>
                          {n.targetType && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {targetTypeLabel(n.targetType)}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">{fmtTime(n.createdAt)}</span>
                          {!n.isRead && (
                            <span className="text-[10px] font-medium text-indigo-600">Yangi</span>
                          )}
                        </div>
                      </div>
                      {!n.isRead && (
                        <span className="shrink-0 text-[10px] text-indigo-600 font-medium">
                          {actionId === n.id ? '...' : "O'qish"}
                        </span>
                      )}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.isRead ? (
                        <div className={rowClass}>{inner}</div>
                      ) : (
                        <button
                          type="button"
                          disabled={actionId === n.id}
                          onClick={() => handleMarkOne(n.id)}
                          className={rowClass}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Jami: {total} · O'qilmagan: {unreadCount}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1 || listLoading}
                onClick={() => loadPage(page - 1)}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-1 py-1">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || listLoading}
                onClick={() => loadPage(page + 1)}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
