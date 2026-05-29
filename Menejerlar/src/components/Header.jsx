import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getManagerNotifications,
  getManagerNotificationsUnreadCount,
  markManagerNotificationRead,
  markAllManagerNotificationsRead,
  getManagerNotificationsWsUrl,
} from '../services/api';

const typeStyles = {
  info: 'border-l-blue-500 bg-blue-50/40',
  warning: 'border-l-amber-500 bg-amber-50/40',
  success: 'border-l-green-500 bg-green-50/40',
  error: 'border-l-red-500 bg-red-50/40',
  update: 'border-l-violet-500 bg-violet-50/40',
  announcement: 'border-l-indigo-500 bg-indigo-50/40',
};

export default function Header({ sidebarCollapsed, onMenuToggle, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const wsRef = useRef(null);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 80 : 256);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getManagerNotificationsUnreadCount();
      const n = res?.data?.unread_count ?? res?.unread_count ?? 0;
      setUnreadCount(Number(n) || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setNotifLoading(true);
      setNotifError('');
      const res = await getManagerNotifications({ page, limit: 10 });
      const d = res?.data ?? res;
      const items = d?.items ?? [];
      setNotifications(items);
      setNotifPage(d?.page ?? page);
      setNotifTotalPages(d?.total_pages ?? 1);
      if (typeof d?.unread_count === 'number') {
        setUnreadCount(d.unread_count);
      }
    } catch (err) {
      setNotifError(err.message || 'Bildirishnomalarni yuklashda xatolik');
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, user]);

  useEffect(() => {
    if (!showNotifications) return;
    fetchNotifications(notifPage);
  }, [showNotifications, notifPage, fetchNotifications]);

  useEffect(() => {
    const url = getManagerNotificationsWsUrl();
    if (!url) return;

    let ws;
    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'integration_notification_created' && payload.notification) {
            const n = payload.notification;
            setNotifications((prev) => {
              const exists = prev.some((x) => x.id === n.id);
              if (exists) return prev;
              return [n, ...prev].slice(0, 50);
            });
            fetchUnreadCount();
          }
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {};
    } catch {
      /* ignore */
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    logout();
    navigate('/login');
  };

  const toggleNotifications = () => {
    setShowNotifications((v) => !v);
    setShowProfileMenu(false);
    if (!showNotifications) {
      setNotifPage(1);
    }
  };

  const handleMarkRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markManagerNotificationRead(id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x))
      );
      await fetchUnreadCount();
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllManagerNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <header
      className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300"
      style={{ marginLeft: `${sidebarWidth}px`, left: 0 }}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {isMobile && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            {new Date().toLocaleDateString('uz-UZ', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            aria-expanded={showNotifications}
            aria-label="Bildirishnomalar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/20 sm:bg-transparent"
                onClick={() => setShowNotifications(false)}
                aria-hidden
              />
              <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-[4.5rem] sm:top-full sm:mt-2 z-40 w-auto sm:w-96 max-w-[calc(100vw-1rem)] max-h-[min(70vh,28rem)] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">Bildirishnomalar</h3>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Hammasini o‘qilgan
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0">
                  {notifLoading && (
                    <div className="p-8 text-center text-gray-500 text-sm">Yuklanmoqda...</div>
                  )}
                  {!notifLoading && notifError && (
                    <div className="p-4 text-sm text-red-600">{notifError}</div>
                  )}
                  {!notifLoading && !notifError && notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">Xabar yo‘q</div>
                  )}
                  {!notifLoading &&
                    notifications.map((n) => {
                      const typeClass = typeStyles[n.type] || 'border-l-gray-300 bg-gray-50/30';
                      return (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => !n.is_read && handleMarkRead(n.id)}
                          onKeyDown={(e) => e.key === 'Enter' && !n.is_read && handleMarkRead(n.id)}
                          className={`border-l-4 px-4 py-3 border-b border-gray-100 text-left transition ${typeClass} ${
                            !n.is_read ? 'cursor-pointer hover:bg-white/80' : 'opacity-90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {n.title || 'Xabar'}
                            </p>
                            {!n.is_read && (
                              <span className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" title="O‘qilmagan" />
                            )}
                          </div>
                          {n.message && (
                            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap line-clamp-4">{n.message}</p>
                          )}
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-[10px] text-gray-400 uppercase">{n.type || 'info'}</span>
                            <span className="text-[10px] text-gray-400">
                              {n.created_at
                                ? new Date(n.created_at).toLocaleString('uz-UZ', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {notifTotalPages > 1 && (
                  <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                    <button
                      type="button"
                      disabled={notifPage <= 1 || notifLoading}
                      onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                      className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
                    >
                      Oldingi
                    </button>
                    <span className="text-xs text-gray-500">
                      {notifPage} / {notifTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={notifPage >= notifTotalPages || notifLoading}
                      onClick={() => setNotifPage((p) => p + 1)}
                      className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40"
                    >
                      Keyingi
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[8rem] lg:max-w-[12rem]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[8rem] lg:max-w-[12rem]">
                {user?.viloyat?.name || 'Viloyat'}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-gray-600 hidden md:block shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/dashboard/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Sozlamalar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Chiqish</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
