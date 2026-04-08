import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';

const tabBase = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

const WarehouseLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCategories = location.pathname.includes('/warehouse/categories');
  const isProducts = location.pathname.includes('/warehouse/products');
  const isNeighborhoodProducts = location.pathname.includes('/warehouse/neighborhood-products');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <NavLink
              to="/dashboard/warehouse/categories"
              className={({ isActive }) =>
                `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              Kategoriyalar
            </NavLink>
            <NavLink
              to="/dashboard/warehouse/products"
              className={({ isActive }) =>
                `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              Mahsulotlar
            </NavLink>
            <NavLink
              to="/dashboard/warehouse/neighborhood-products"
              className={({ isActive }) =>
                `${tabBase} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              Maxalla mahsulotlari
            </NavLink>
          </div>

          {isCategories && (
            <div className="flex justify-end">
              <button
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
