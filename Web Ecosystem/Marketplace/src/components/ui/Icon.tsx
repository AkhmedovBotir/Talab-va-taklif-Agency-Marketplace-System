import React from 'react';
import {
  IoArrowBack,
  IoArrowForward,
  IoCart,
  IoCartOutline,
  IoCheckmark,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
  IoClose,
  IoCloseCircle,
  IoCubeOutline,
  IoFolderOpenOutline,
  IoGridOutline,
  IoHome,
  IoImageOutline,
  IoInformationCircleOutline,
  IoLocationOutline,
  IoLockClosedOutline,
  IoLogOutOutline,
  IoNotificationsOutline,
  IoPerson,
  IoPersonOutline,
  IoReceiptOutline,
  IoSearch,
  IoSearchOutline,
  IoStorefront,
  IoTrashOutline,
  IoBusinessOutline,
  IoCamera,
  IoEllipsisHorizontalOutline,
  IoMegaphoneOutline,
  IoPricetagOutline,
  IoRefreshCircleOutline,
  IoCardOutline,
  IoCalendarOutline,
} from 'react-icons/io5';

type IconPropsInner = { size?: number; color?: string; className?: string; style?: React.CSSProperties };
const iconMap: Record<string, React.ComponentType<IconPropsInner>> = {
  'arrow-back': IoArrowBack,
  'arrow-forward': IoArrowForward,
  'notifications-outline': IoNotificationsOutline,
  home: IoHome,
  grid: IoGridOutline,
  'grid-outline': IoGridOutline,
  search: IoSearch,
  'search-outline': IoSearchOutline,
  cart: IoCart,
  'cart-outline': IoCartOutline,
  person: IoPerson,
  'person-outline': IoPersonOutline,
  'chevron-back': IoChevronBack,
  'chevron-forward': IoChevronForward,
  'chevron-down': IoChevronDown,
  'image-outline': IoImageOutline,
  'checkmark-circle': IoCheckmarkCircle,
  checkmark: IoCheckmark,
  'close-circle': IoCloseCircle,
  close: IoClose,
  storefront: IoStorefront,
  'folder-outline': IoFolderOpenOutline,
  'cube-outline': IoCubeOutline,
  'information-circle': IoInformationCircleOutline,
  'business-outline': IoBusinessOutline,
  business: IoBusinessOutline,
  camera: IoCamera,
  'location-outline': IoLocationOutline,
  'lock-closed-outline': IoLockClosedOutline,
  'receipt-outline': IoReceiptOutline,
  'log-out-outline': IoLogOutOutline,
  'trash-outline': IoTrashOutline,
  options: IoEllipsisHorizontalOutline,
  'options-outline': IoEllipsisHorizontalOutline,
  megaphone: IoMegaphoneOutline,
  pricetag: IoPricetagOutline,
  'refresh-circle': IoRefreshCircleOutline,
  'card-outline': IoCardOutline,
  'calendar-outline': IoCalendarOutline,
};

interface IconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  color?: string;
  className?: string;
}

export default function Icon({ name, size = 24, color = 'currentColor', className }: IconProps) {
  const Component = iconMap[name as string];
  if (!Component) return null;
  return (
    <Component
      size={size}
      color={color}
      className={className}
      style={{ flexShrink: 0, color }}
    />
  );
}
