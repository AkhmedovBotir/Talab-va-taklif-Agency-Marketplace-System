import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoWalletOutline, IoArrowDownCircle, IoArrowUpCircle, IoFilter } from 'react-icons/io5';
import { apiService } from '../services/api';
import { DatePickerField } from '../components/DatePickerField';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type {
  PaymentTransaction,
  PaymentBalanceResponse,
  OrderForPayment,
  GetPaymentTransactionsParams,
} from '../types/api';
import styles from './Finance.module.css';

type TabType = 'transactions' | 'payments';

export function Finance() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [ordersForPayment, setOrdersForPayment] = useState<OrderForPayment[]>([]);
  const [balance, setBalance] = useState<PaymentBalanceResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertState, setAlertState] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [payConfirm, setPayConfirm] = useState<{ orderId: string; message: string } | null>(null);
  const navigate = useNavigate();

  const loadBalance = useCallback(async () => {
    try {
      const res = await apiService.getPaymentBalance();
      if (res.success) setBalance(res.data);
    } catch {}
  }, []);

  const loadTransactions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: GetPaymentTransactionsParams = {
        page,
        limit: 50,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      };
      const res = await apiService.getPaymentTransactions(params);
      if (res.success) {
        setTransactions(res.data || []);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.page || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const loadOrdersForPayment = useCallback(async () => {
    try {
      const res = await apiService.getOrdersForPayment();
      if (res.success) setOrdersForPayment(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions();
    else loadOrdersForPayment();
  }, [activeTab, loadTransactions, loadOrdersForPayment]);

  const handlePayToPunkt = (orderId: string) => {
    const order = ordersForPayment.find((o) => o._id === orderId);
    if (!order) return;
    setPayConfirm({
      orderId,
      message: `Punktga ${(order.totalPrice || 0).toLocaleString()} so'm to'lov qilmoqchimisiz?`,
    });
  };

  const doPayToPunkt = async () => {
    if (!payConfirm) return;
    const { orderId } = payConfirm;
    setPayConfirm(null);
    try {
      const res = await apiService.payToPunkt(orderId);
      if (res.success) {
        setAlertState({ open: true, message: res.message || "To'lov muvaffaqiyatli" });
        loadOrdersForPayment();
        loadBalance();
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setAlertState({ open: true, message: ax.response?.data?.message || "To'lovda xatolik" });
    }
  };

  const applyFilter = () => {
    setShowFilter(false);
    loadTransactions(1);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Moliya</h1>
      </header>

      {balance && (
        <div className={styles.balanceRow}>
          <div className={`${styles.balanceCard} ${styles.income}`}>
            <div className={styles.balanceHeader}>
              <IoArrowDownCircle size={20} color="#34C759" />
              <span className={styles.balanceLabel}>Kirim</span>
            </div>
            <div className={styles.balanceAmount} style={{ color: '#34C759' }}>
              {(balance.totalIncome ?? 0).toLocaleString()} so'm
            </div>
          </div>
          <div className={`${styles.balanceCard} ${styles.expense}`}>
            <div className={styles.balanceHeader}>
              <IoArrowUpCircle size={20} color="#FF3B30" />
              <span className={styles.balanceLabel}>Chiqim</span>
            </div>
            <div className={styles.balanceAmount} style={{ color: '#FF3B30' }}>
              {(balance.totalExpense ?? 0).toLocaleString()} so'm
            </div>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          type="button"
          className={activeTab === 'transactions' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setActiveTab('transactions')}
        >
          Tranzaksiyalar
        </button>
        <button
          type="button"
          className={activeTab === 'payments' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setActiveTab('payments')}
        >
          To'lovlar
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          <div className={styles.filterBar}>
            <button
              type="button"
              className={styles.filterBtn}
              onClick={() => setShowFilter(!showFilter)}
            >
              <IoFilter size={18} />
              Filtr
              {(startDate || endDate) && <span className={styles.filterDot} />}
            </button>
          </div>
          {showFilter && (
            <div className={styles.filterModal}>
              <p className={styles.filterLabel}>Sana oralig'i</p>
              <div className={styles.filterDates}>
                <DatePickerField value={startDate} onChange={setStartDate} />
                <DatePickerField value={endDate} onChange={setEndDate} min={startDate || undefined} max={new Date()} />
              </div>
              <div className={styles.filterActions}>
                <button type="button" className={styles.clearFilterBtn} onClick={() => { setStartDate(null); setEndDate(null); setShowFilter(false); }}>
                  Tozalash
                </button>
                <button type="button" className={styles.applyFilterBtn} onClick={applyFilter}>
                  Qo'llash
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <div className={styles.list}>
          {loading ? (
            <div className={styles.loading}>Yuklanmoqda...</div>
          ) : transactions.length === 0 ? (
            <div className={styles.empty}>Tranzaksiyalar yo'q</div>
          ) : (
            transactions.map((t) => (
              <div key={t._id} className={styles.transactionRow}>
                <div className={styles.transactionIcon} style={{ background: t.type === 'income' ? '#E8F5E9' : '#FFEBEE' }}>
                  {t.type === 'income' ? <IoArrowDownCircle size={24} color="#34C759" /> : <IoArrowUpCircle size={24} color="#FF3B30" />}
                </div>
                <div className={styles.transactionBody}>
                  <div className={styles.transactionDesc}>{t.description}</div>
                  <div className={styles.transactionDate}>{new Date(t.createdAt).toLocaleString('uz-UZ')}</div>
                </div>
                <div className={styles.transactionAmount} style={{ color: t.type === 'income' ? '#34C759' : '#FF3B30' }}>
                  {t.type === 'income' ? '+' : '-'}{(t.amount || 0).toLocaleString()} so'm
                </div>
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn} disabled={currentPage === 1} onClick={() => loadTransactions(currentPage - 1)}>Oldingi</button>
              <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
              <button type="button" className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => loadTransactions(currentPage + 1)}>Keyingi</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className={styles.list}>
          {ordersForPayment.length === 0 ? (
            <div className={styles.empty}>To'lov qilish kerak bo'lgan buyurtmalar yo'q</div>
          ) : (
            ordersForPayment.map((o) => (
              <div key={o._id} className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <span className={styles.paymentOrderNum}>#{o.orderNumber}</span>
                  <span className={styles.paymentSum}>{(o.totalPrice || 0).toLocaleString()} so'm</span>
                </div>
                <p className={styles.paymentUser}>{o.user?.name || o.user?.phone}</p>
                <button type="button" className={styles.payBtn} onClick={() => handlePayToPunkt(o._id)}>
                  Punktga to'lov
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <AlertModal
        open={alertState.open}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
      />
      {payConfirm && (
        <ConfirmModal
          open={!!payConfirm}
          message={payConfirm.message}
          onConfirm={doPayToPunkt}
          onCancel={() => setPayConfirm(null)}
        />
      )}
    </div>
  );
}
