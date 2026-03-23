import { Link } from 'react-router-dom';
import { IoBusiness, IoCall, IoLocation, IoCheckmarkCircle, IoDocumentText, IoNotifications, IoSettings, IoChevronForward } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { contragent } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.welcomeCard}>
          <h2 className={styles.welcomeText}>Xush kelibsiz!</h2>
          <p className={styles.companyName}>{contragent?.name || 'Kontragent'}</p>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <IoBusiness size={24} color="#007AFF" />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>INN</span>
              <span className={styles.infoValue}>{contragent?.inn || '-'}</span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <IoCall size={24} color="#007AFF" />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Telefon</span>
              <span className={styles.infoValue}>{contragent?.phone || '-'}</span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <IoLocation size={24} color="#007AFF" />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Manzil</span>
              <span className={styles.infoValue}>
                {contragent?.viloyat?.name || '-'}
                {contragent?.tuman?.name ? `, ${contragent.tuman.name}` : ''}
                {contragent?.mfy?.name ? `, ${contragent.mfy.name}` : ''}
              </span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <IoCheckmarkCircle size={24} color="#34C759" />
            <div className={styles.infoContent}>
              <span className={styles.infoLabel}>Holat</span>
              <span className={styles.infoValue}>
                {contragent?.status === 'active' ? 'Faol' : contragent?.status || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actionsCard}>
          <h3 className={styles.sectionTitle}>Tezkor amallar</h3>
          <Link to="/buyurtmalar" className={styles.actionButton}>
            <IoDocumentText size={24} color="#007AFF" />
            <span className={styles.actionButtonText}>Buyurtmalar</span>
            <IoChevronForward size={20} color="#8E8E93" />
          </Link>
          <Link to="/habarlar" className={styles.actionButton}>
            <IoNotifications size={24} color="#007AFF" />
            <span className={styles.actionButtonText}>Habarlar</span>
            <IoChevronForward size={20} color="#8E8E93" />
          </Link>
          <Link to="/profile" className={styles.actionButton}>
            <IoSettings size={24} color="#007AFF" />
            <span className={styles.actionButtonText}>Profil</span>
            <IoChevronForward size={20} color="#8E8E93" />
          </Link>
        </div>
      </div>
    </div>
  );
}
