const ICON_SRC = '/icon.png'

export function BrandLogo({ className = 'h-10 w-10', size = 40 }) {
  return (
    <img
      src={ICON_SRC}
      alt="TTSA"
      className={`shrink-0 rounded-full object-contain ${className}`}
      width={size}
      height={size}
      decoding="async"
    />
  )
}
