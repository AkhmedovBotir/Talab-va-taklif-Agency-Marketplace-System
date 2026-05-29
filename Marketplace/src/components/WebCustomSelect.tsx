import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export type WebSelectOption<T extends string | number> = {
  value: T;
  label: string;
  /** Tanlangan qiymat va ro‘yxatda asosiy matndan keyin kichikroq shriftda */
  description?: string;
};

type WebCustomSelectProps<T extends string | number> = {
  label: string;
  value: T | null;
  options: WebSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: T | null) => void;
  nullLabel?: string;
  /** `false` bo‘lsa «Barchasi» qatori chiqmaydi (masalan checkout manzili) */
  showNullOption?: boolean;
};

export function WebCustomSelect<T extends string | number>({
  label,
  value,
  options,
  placeholder = 'Tanlang',
  disabled = false,
  onChange,
  nullLabel = 'Barchasi',
  showNullOption = true,
}: WebCustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOpt = value === null ? undefined : options.find((o) => o.value === value);
  const selectedLabel =
    value === null
      ? showNullOption
        ? nullLabel
        : placeholder
      : (selectedOpt?.label ?? placeholder);
  const selectedDescription =
    value !== null && selectedOpt?.description?.trim() ? selectedOpt.description.trim() : undefined;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const cap = window.innerWidth >= 1024 ? 420 : 280;
    const maxH = Math.min(cap, window.innerHeight - r.bottom - 12);
    setMenuStyle({
      position: 'fixed',
      left: r.left,
      top: r.bottom + 6,
      width: r.width,
      maxHeight: maxH,
      zIndex: 200,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      const menus = document.querySelectorAll('[data-web-select-menu]');
      for (const m of menus) {
        if (m.contains(t)) return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const menu =
    open && !disabled
      ? createPortal(
          <ul
            data-web-select-menu
            className="overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-xl"
            style={menuStyle}
            role="listbox"
          >
            {showNullOption ? (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === null}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold transition hover:bg-orange-50',
                    value === null && 'bg-orange-50/60 text-orange-600'
                  )}
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  {nullLabel}
                  {value === null ? <Check size={16} className="text-orange-500" /> : null}
                </button>
              </li>
            ) : null}
            {options.map((o) => {
              const desc = o.description?.trim();
              return (
                <li key={String(o.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === o.value}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-gray-50',
                      value === o.value && 'bg-orange-50/80'
                    )}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm font-bold leading-snug text-gray-800',
                          value === o.value && 'text-orange-800'
                        )}
                      >
                        {o.label}
                      </span>
                      {desc ? (
                        <span className="mt-0.5 block line-clamp-3 text-[11px] font-medium leading-relaxed text-gray-500">
                          {desc}
                        </span>
                      ) : null}
                    </span>
                    {value === o.value ? (
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-orange-500" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'flex min-h-12 w-full items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm font-bold transition hover:border-gray-300 hover:bg-white',
          disabled && 'cursor-not-allowed opacity-50',
          open && 'border-orange-300 bg-white ring-2 ring-orange-500/20'
        )}
      >
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate leading-snug', value === null && 'text-gray-400')}>{selectedLabel}</span>
          {selectedDescription ? (
            <span className="mt-0.5 block line-clamp-3 text-left text-[11px] font-medium leading-relaxed text-gray-500">
              {selectedDescription}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={18}
          className={cn('mt-1 flex-shrink-0 text-gray-400 transition', open && 'rotate-180')}
        />
      </button>
      {menu}
    </div>
  );
}
