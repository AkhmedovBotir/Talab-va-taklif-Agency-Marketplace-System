import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import RegionRequiredGate from '../components/RegionRequiredGate';
import { useCart } from '../contexts/CartContext';

export default function Layout() {
  const { totalItems } = useCart();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="app-layout">
      <RegionRequiredGate>
        <div className="app-content">
          <Outlet />
        </div>
      <nav className="tabs">
        <Link to="/" className={`tab-link ${path === '/' ? 'active' : ''}`}>
          <Icon name="home" size={24} color={path === '/' ? '#007AFF' : '#8e8e93'} />
          <span>Bosh sahifa</span>
        </Link>
        <Link to="/shops" className={`tab-link ${path === '/shops' ? 'active' : ''}`}>
          <Icon name="grid-outline" size={24} color={path === '/shops' ? '#007AFF' : '#8e8e93'} />
          <span>Kategoriyalar</span>
        </Link>
        <Link to="/search" className="tab-search-center" aria-label="Qidiruv">
          <Icon name="search" size={28} color="#fff" />
        </Link>
        <Link to="/cart" className={`tab-link tab-cart-wrap ${path === '/cart' ? 'active' : ''}`}>
          <Icon name="cart-outline" size={24} color={path === '/cart' ? '#007AFF' : '#8e8e93'} />
          {totalItems > 0 && <span className="tab-cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
          <span>Korzinka</span>
        </Link>
        <Link to="/profile" className={`tab-link ${path === '/profile' ? 'active' : ''}`}>
          <Icon name="person" size={24} color={path === '/profile' ? '#007AFF' : '#8e8e93'} />
          <span>Profil</span>
        </Link>
      </nav>
      </RegionRequiredGate>
    </div>
  );
}
