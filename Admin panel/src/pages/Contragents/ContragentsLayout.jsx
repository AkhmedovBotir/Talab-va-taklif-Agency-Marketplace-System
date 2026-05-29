import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import { useEffect, useMemo } from 'react';
import usePermissions from '../../hooks/usePermissions';
import { getFirstContragentPath } from '../../utils/permissions';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const ContragentsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, permissions, admin } = usePermissions();

  const tabs = useMemo(
    () =>
      [
        { to: '/dashboard/contragents/types', label: 'Kontragent turlari', permission: "kontragent turlari" },
        { to: '/dashboard/contragents/tuman', label: 'Kontragentlar', permission: 'kontragentlar' },
        { to: '/dashboard/contragents/maxalla-dokonlar', label: "Maxalla do'konlari", permission: "maxalla do'konlari" },
        { to: '/dashboard/contragents/hamkorlik-sorovlari', label: "Hamkorlik so'rovlari", permission: "hamkorlik so'rovi" },
      ].filter((t) => can(t.permission)),
    [can]
  );

  const isTypesPage = location.pathname.includes('/contragents/types');
  const isDistrictPage = location.pathname.includes('/contragents/tuman');
  const isShopsPage = location.pathname.includes('/contragents/maxalla-dokonlar');
  const defaultPath = getFirstContragentPath(permissions) || tabs[0]?.to;

  const actionLabel = isTypesPage ? 'Yangi tur' : isDistrictPage ? 'Yangi kontragent' : isShopsPage ? "Yangi do'kon" : '';
  const actionPath = isTypesPage
    ? '/dashboard/contragents/types?action=create'
    : isDistrictPage
      ? '/dashboard/contragents/tuman?action=create'
      : isShopsPage
        ? '/dashboard/contragents/maxalla-dokonlar?action=create'
        : '';

  useEffect(() => {
    if (!defaultPath) return;
    const onRoot =
      location.pathname === '/dashboard/contragents' || location.pathname === '/dashboard/contragents/';
    if (onRoot) {
      navigate(defaultPath, { replace: true });
      return;
    }
    const allowed = tabs.some((t) => location.pathname.startsWith(t.to));
    if (!allowed && tabs.length > 0) {
      navigate(defaultPath, { replace: true });
    }
  }, [location.pathname, defaultPath, navigate, tabs]);

  if (tabs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        Kontragentlar bo‘limiga ruxsat berilmagan.
      </div>
    );
  }

  if (location.pathname === '/dashboard/contragents' || location.pathname === '/dashboard/contragents/') {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>

          {(isTypesPage || isDistrictPage || isShopsPage) && actionPath && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(actionPath)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                <Add />
                <span>{actionLabel}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default ContragentsLayout;
