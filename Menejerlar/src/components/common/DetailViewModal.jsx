export default function DetailViewModal({
  title,
  isOpen,
  onClose,
  fields = [],
  children,
  footer,
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 id="detail-modal-title" className="text-xl font-bold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Yopish"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4">
            {fields.length > 0 && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ label, value, fullWidth }) => (
                  <div
                    key={label}
                    className={fullWidth ? 'sm:col-span-2' : ''}
                  >
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {label}
                    </dt>
                    <dd className="text-sm text-gray-900 break-words">{value ?? '-'}</dd>
                  </div>
                ))}
              </dl>
            )}
            {children}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end shrink-0">
            {footer || (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Yopish
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
