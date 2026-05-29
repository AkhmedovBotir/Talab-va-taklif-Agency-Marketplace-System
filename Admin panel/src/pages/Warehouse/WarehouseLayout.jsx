import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import { useEffect, useMemo } from 'react';
import usePermissions from '../../hooks/usePermissions';
import { getFirstWarehousePath } from '../../utils/permissions';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const WarehouseLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, permissions, admin } = usePermissions();

  const tabs = useMemo(
    () =>
      [
        { to: '/dashboard/warehouse/categories', label: 'Kategoriyalar', permission: 'kategoriyalar' },
        { to: '/dashboard/warehouse/products', label: 'Mahsulotlar', permission: 'mahsulotlar' },
        {
          to: '/dashboard/warehouse/neighborhood-products',
          label: 'Maxalla mahsulotlari',
          permission: ['maxalla maxsulotlari shablonlari', 'maxalla maxsulotlari'],
          anyOf: true,
        },
      ].filter((t) => (t.anyOf ? t.permission.some((p) => can(p)) : can(t.permission))),
    [can]
  );

  const isCategories = location.pathname.includes('/warehouse/categories');
  const defaultPath = getFirstWarehousePath(permissions) || tabs[0]?.to;

  useEffect(() => {
    if (!defaultPath) return;
    const onWarehouseRoot =
      location.pathname === '/dashboard/warehouse' || location.pathname === '/dashboard/warehouse/';
    if (onWarehouseRoot) {
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
        Ombor bo‘limiga ruxsat berilmagan.
      </div>
    );
  }

  if (location.pathname === '/dashboard/warehouse' || location.pathname === '/dashboard/warehouse/') {
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

          {isCategories && can('kategoriyalar') && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard/warehouse/categories?action=create')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                <Add />
                <span>Yangi kategoriya</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default WarehouseLayout;
