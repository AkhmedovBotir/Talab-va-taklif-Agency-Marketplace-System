import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, className }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${(disabled || loading) ? styles.disabled : ''} ${className || ''}`}
      onClick={onPress}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.spinner} /> : title}
    </button>
  );
}
