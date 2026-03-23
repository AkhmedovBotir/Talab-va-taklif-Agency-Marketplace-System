import { ReactNode } from 'react';
import Icon from './ui/Icon';

interface HeaderProps {
  title?: string;
  onNotificationPress?: () => void;
  rightButton?: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  unreadCount?: number;
}


export default function Header({
  title = 'Marketplace',
  onNotificationPress,
  rightButton,
  showBackButton = false,
  onBackPress,
  unreadCount = 0,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        {showBackButton ? (
          <button type="button" className="header-btn" onClick={onBackPress} aria-label="Orqaga">
            <Icon name="arrow-back" size={24} color="#333" />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
        <div className="header-title-wrap">
          <h1 className="header-title">{title}</h1>
        </div>
        {rightButton ?? (
          <button
            type="button"
            className="header-btn badge-wrap"
            onClick={onNotificationPress}
            aria-label="Bildirishnomalar"
          >
            <Icon name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
