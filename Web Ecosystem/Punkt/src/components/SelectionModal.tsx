import React from 'react';
import styles from './SelectionModal.module.css';

export interface SelectionItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface SelectionModalProps {
  open: boolean;
  title: string;
  items: SelectionItem[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function SelectionModal({ open, title, items, loading, onSelect, onClose }: SelectionModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{title}</h2>
        {loading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Ro'yxat bo'sh</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.itemBtn}
                  onClick={() => onSelect(item.id)}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
}
