import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Index.module.css';

export function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else {
      navigate('/orders', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <p className={styles.text}>Yuklanmoqda...</p>
    </div>
  );
}
