
interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (newValue: string) => void;
  error?: string;
}

export default function PhoneInput({ label, value, onChange, error }: PhoneInputProps) {
  const digits = value.replace(/\D/g, '').slice(0, 9);

  const formatDigits = (d: string) => {
    if (!d) return '';
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  };

  const display = formatDigits(digits);

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div className="phoneInputGroup">
        <span className="phoneInputPrefix">+998</span>
        <input
          type="tel"
          className="phoneInputControl"
          value={display}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, '').slice(0, 9))
          }
          placeholder="90 000 00 00"
        />
      </div>
      {error && (
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--danger)' }}>{error}</div>
      )}
    </div>
  );
}

