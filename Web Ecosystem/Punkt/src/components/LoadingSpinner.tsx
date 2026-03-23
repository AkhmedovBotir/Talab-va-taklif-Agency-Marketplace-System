import React from 'react';
import styles from './LoadingSpinner.module.css';

export function LoadingSpinner() {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
    </div>
  );
}
