import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, ShoppingBag, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-2xl items-center justify-between border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] sm:bottom-6 sm:rounded-3xl sm:border sm:px-10 sm:shadow-2xl">
      <NavIconItem to="/" Icon={Home} label="Asosiy" />
      <NavIconItem to="/products" Icon={ShoppingBag} label="Katalog" />
      <NavIconItem to="/search" Icon={Search} label="Qidiruv" />
      <NavIconItem to="/profile" Icon={User} label="Profil" />
    </nav>
  );
}

function NavIconItem({
  to,
  Icon,
  label,
}: {
  to: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex min-h-[48px] min-w-[52px] flex-col items-center justify-center transition-colors',
          isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 2.35 : 2} className="shrink-0" />
          {!isActive ? (
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider">{label}</span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}
