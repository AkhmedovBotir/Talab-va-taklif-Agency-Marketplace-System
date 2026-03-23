import React, { useEffect, useRef, useState } from 'react';

interface SmsCodeInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
}

export default function SmsCodeInput({
  length = 5,
  value,
  onChange,
  onComplete,
  error,
}: SmsCodeInputProps) {
  const [internalCode, setInternalCode] = useState('');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = value !== undefined ? value : internalCode;

  useEffect(() => {
    if (value !== undefined) return;
    setInternalCode('');
  }, [length]);

  const setCode = (next: string) => {
    const trimmed = next.replace(/\D/g, '').slice(0, length);
    if (value === undefined) {
      setInternalCode(trimmed);
    }
    if (onChange) onChange(trimmed);
    if (trimmed.length === length && onComplete) {
      onComplete(trimmed);
    }
  };

  const handleChange = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, '').slice(-1);
    const chars = code.split('');
    chars[index] = clean;
    const next = chars.join('');
    setCode(next);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="smsCodeInputRow">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`smsCodeBox ${error ? 'smsCodeBoxError' : ''}`}
            value={code[idx] || ''}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
          />
        ))}
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}

