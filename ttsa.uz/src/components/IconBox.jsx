export function IconBox({ children, className = '' }) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 ${className}`}
    >
      {children}
    </span>
  )
}
