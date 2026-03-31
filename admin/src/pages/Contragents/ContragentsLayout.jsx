import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';

const tabBase =
  'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const ContragentsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTypesPage = location.pathname.includes('/contragents/types');
  const isDistrictPage = location.pathname.includes('/contragents/tuman');
  const isShopsPage = location.pathname.includes('/contragents/maxalla-dokonlar');
  const actionLabel = isTypesPage ? 'Yangi tur' : isDistrictPage ? 'Yangi kontragent' : isShopsPage ? "Yangi do'kon" : '';
  const actionPath = isTypesPage
    ? '/dashboard/contragents/types?action=create'
    : isDistrictPage
      ? '/dashboard/contragents/tuman?action=create'
      : isShopsPage
        ? '/dashboard/contragents/maxalla-dokonlar?action=create'
        : '';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
          <NavLink
            to="/dashboard/contragents/types"
            className={({ isActive }) =>
              `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Kontragent turlari
          </NavLink>
          <NavLink
            to="/dashboard/contragents/tuman"
            className={({ isActive }) =>
              `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Kontragentlar
          </NavLink>
          <NavLink
            to="/dashboard/contragents/maxalla-dokonlar"
            className={({ isActive }) =>
              `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Maxalla do‘konlari
          </NavLink>
          </div>

          {(isTypesPage || isDistrictPage || isShopsPage) && (
            <div className="flex justify-end">
              <button
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
