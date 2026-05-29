import { formatUzPhoneLocal, parsePhoneInput } from '../utils/phone';

export default function PhoneInput({ id = 'phone', value, onChange, disabled, className = '' }) {
  const handleChange = (e) => {
    const digits = parsePhoneInput(e.target.value);
    onChange(formatUzPhoneLocal(digits));
  };

  return (
    <div
      className={`flex rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition ${disabled ? 'opacity-50 bg-gray-50' : ''} ${className}`}
    >
      <span className="inline-flex items-center px-4 py-3 bg-gray-100 border-r border-gray-300 text-gray-800 font-semibold text-sm shrink-0 select-none">
        +998
      </span>
      <input
        type="tel"
        id={id}
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        onChange={handleChange}
        placeholder="90 123 45 67"
        disabled={disabled}
        className="flex-1 min-w-0 px-4 py-3 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
      />
    </div>
  );
}
