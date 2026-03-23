import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Order, Contragent } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { AlertModal, ConfirmModal } from '../components/Modal';
import { SelectionModal } from '../components/SelectionModal';
import styles from './OrderDetail.module.css';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed_by_punkt: 'Punkt tomonidan tasdiqlangan',
  requested_to_contragent: "Contragentga so'rov yuborilgan",
  accepted_by_contragent: 'Contragent tomonidan qabul qilingan',
  delivered_to_punkt: "Punktga yetkazilgan",
  assigned_to_agent: 'Agentga yuborilgan',
  confirmed_by_agent: 'Agent tomonidan tasdiqlangan',
  confirmed_by_customer: 'Mijoz tomonidan tasdiqlangan',
  cancelled: 'Bekor qilingan',
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'receive_contragent' | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success');

  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [selectionTitle, setSelectionTitle] = useState('');
  const [selectionItems, setSelectionItems] = useState<{ id: string; title: string; subtitle?: string }[]>([]);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [selectionType, setSelectionType] = useState<'contragent' | 'punkt' | 'agent'>('contragent');

  const [zakladModalOpen, setZakladModalOpen] = useState(false);
  const [zakladRequestId, setZakladRequestId] = useState<string | null>(null);
  const [zakladPercent, setZakladPercent] = useState(30);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiService.getOrderById(id);
      if (res.success && res.data) setOrder(res.data);
    } catch (e) {
      console.error(e);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const showAlert = (message: string, variant: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setAlertOpen(true);
  };

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn();
      showAlert(successMsg, 'success');
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!id) return;
    setConfirmOpen(false);
    setConfirmAction(null);
    setActionLoading(true);
    await runAction(() => apiService.confirmOrder(id), 'Buyurtma tasdiqlandi');
  };

  const handleReceiveFromContragent = async () => {
    if (!id) return;
    setConfirmOpen(false);
    setConfirmAction(null);
    setActionLoading(true);
    await runAction(() => apiService.receiveFromContragent(id), "Contragentdan qabul qilindi");
  };

  const handleConfirmClick = () => {
    setConfirmAction('confirm');
    setConfirmOpen(true);
  };

  const handleReceiveContragentClick = () => {
    setConfirmAction('receive_contragent');
    setConfirmOpen(true);
  };

  const confirmMessage =
    confirmAction === 'confirm'
      ? 'Buyurtmani tasdiqlashni xohlaysizmi?'
      : confirmAction === 'receive_contragent'
        ? "Contragentdan mahsulotni qabul qilishni xohlaysizmi?"
        : '';

  const handleConfirmModalConfirm = () => {
    if (confirmAction === 'confirm') handleConfirmOrder();
    else if (confirmAction === 'receive_contragent') handleReceiveFromContragent();
  };

  const openContragentSelection = async () => {
    if (!id) return;
    setSelectionType('contragent');
    setSelectionTitle("Contragentni tanlang");
    setSelectionModalOpen(true);
    setSelectionLoading(true);
    setSelectionItems([]);
    try {
      const res = await apiService.getOrderContragents(id);
      const list = res?.data?.contragents || [];
      const items = list.map((c: Contragent) => ({
        id: c._id,
        title: c.name,
        subtitle: [c.phone, c.inn].filter(Boolean).join(' · ') || undefined,
      }));
      setSelectionItems(items);
    } catch (e) {
      showAlert('Contragentlar ro\'yxati yuklanmadi', 'error');
      setSelectionModalOpen(false);
    } finally {
      setSelectionLoading(false);
    }
  };

  const openPunktSelection = async () => {
    if (!id) return;
    setSelectionType('punkt');
    setSelectionTitle("Punktni tanlang");
    setSelectionModalOpen(true);
    setSelectionLoading(true);
    setSelectionItems([]);
    try {
      const res = await apiService.getPunktsForSelection({
        viloyat: order?.deliveryViloyat?._id,
        tuman: order?.deliveryTuman?._id,
        limit: 50,
      });
      const list = (res as { data?: Array<{ _id: string; name: string; phone?: string; viloyat?: { name: string }; tuman?: { name: string } | null }> })?.data || [];
      const items = list.map((p) => ({
        id: p._id,
        title: p.name,
        subtitle: [p.phone, p.viloyat?.name, p.tuman?.name].filter(Boolean).join(' · ') || undefined,
      }));
      setSelectionItems(items);
    } catch (e) {
      showAlert('Punktlar ro\'yxati yuklanmadi', 'error');
      setSelectionModalOpen(false);
    } finally {
      setSelectionLoading(false);
    }
  };

  const openAgentSelection = async () => {
    if (!id) return;
    setSelectionType('agent');
    setSelectionTitle("Agentni tanlang");
    setSelectionModalOpen(true);
    setSelectionLoading(true);
    setSelectionItems([]);
    try {
      const res = await apiService.getAgentsForSelection({ limit: 50 });
      const list = (res as { data?: Array<{ _id: string; name: string; phone?: string }> })?.data || [];
      const items = list.map((a) => ({
        id: a._id,
        title: a.name,
        subtitle: a.phone || undefined,
      }));
      setSelectionItems(items);
    } catch (e) {
      showAlert('Agentlar ro\'yxati yuklanmadi', 'error');
      setSelectionModalOpen(false);
    } finally {
      setSelectionLoading(false);
    }
  };

  const handleSelectionSelect = async (selectedId: string) => {
    if (!id) return;
    setSelectionModalOpen(false);
    setActionLoading(true);
    try {
      if (selectionType === 'contragent') {
        await apiService.requestToContragent(id, { contragentId: selectedId });
        showAlert("Contragentga so'rov yuborildi", 'success');
      } else if (selectionType === 'punkt') {
        await apiService.requestToPunkt(id, { toPunktId: selectedId });
        showAlert("Punktga so'rov yuborildi", 'success');
      } else if (selectionType === 'agent') {
        await apiService.assignOrderToAgent(id, { agentId: selectedId });
        showAlert('Agentga yuborildi', 'success');
      }
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToPunktClick = async () => {
    if (!id) return;
    setSelectionType('punkt');
    setSelectionTitle("Yuboriladigan punktni tanlang");
    setSelectionModalOpen(true);
    setSelectionLoading(true);
    setSelectionItems([]);
    try {
      const res = await apiService.getPunktsForSelection({
        viloyat: order?.deliveryViloyat?._id,
        tuman: order?.deliveryTuman?._id,
        limit: 50,
      });
      const list = (res as { data?: Array<{ _id: string; name: string; phone?: string }> })?.data || [];
      setSelectionItems(list.map((p) => ({ id: p._id, title: p.name, subtitle: p.phone })));
    } catch (e) {
      showAlert('Punktlar ro\'yxati yuklanmadi', 'error');
      setSelectionModalOpen(false);
    } finally {
      setSelectionLoading(false);
    }
  };

  const handleSendToPunktSelect = async (toPunktId: string) => {
    if (!id) return;
    setSelectionModalOpen(false);
    setActionLoading(true);
    try {
      await apiService.sendToPunkt(id, { toPunktId });
      showAlert('Punktga yuborildi', 'success');
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayZakladOpen = (requestId: string) => {
    setZakladRequestId(requestId);
    setZakladPercent(30);
    setZakladModalOpen(true);
  };

  const handlePayZakladSubmit = async () => {
    if (!id || !zakladRequestId) return;
    setZakladModalOpen(false);
    setActionLoading(true);
    try {
      await apiService.payZaklad({
        orderId: id,
        contragentRequestId: zakladRequestId,
        zakladPercentage: zakladPercent,
      });
      showAlert('Zaklad to\'landi', 'success');
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
      setZakladRequestId(null);
    }
  };

  const handlePayFinal = async (contragentRequestId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiService.payFinalPayment({ orderId: id, contragentRequestId });
      showAlert('To\'liq to\'lov o\'tkazildi', 'success');
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayProfit = async (contragentRequestId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await apiService.payProfit({ orderId: id, contragentRequestId });
      showAlert('Haq to\'landi', 'success');
      loadOrder();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showAlert(ax.response?.data?.message || 'Xatolik', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
  const formatDate = (s: string) => new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading || !order) return <LoadingSpinner />;

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const productName = (item: Order['items'][0]) => {
    const p = item.product;
    if (typeof p === 'object' && p && 'name' in p) return p.name;
    return 'Mahsulot';
  };

  const contragentRequests = order.contragentRequests || [];
  const isConfirmSelection = selectionType === 'punkt' && selectionTitle.includes('Yuboriladigan');
  const onSelectionSelect = isConfirmSelection ? handleSendToPunktSelect : handleSelectionSelect;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ‹ Orqaga
        </button>
        <h1 className={styles.topTitle}>Buyurtma tafsilotlari</h1>
      </div>

      <div className={styles.header}>
        <span className={styles.orderNumber}>#{order.orderNumber}</span>
        <span className={styles.statusBadge}>{statusLabel}</span>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mijoz</h2>
        <div className={styles.card}>
          <div className={styles.row}><span className={styles.label}>Ism</span><span className={styles.value}>{order.user.name}</span></div>
          <div className={styles.row}><span className={styles.label}>Telefon</span><span className={styles.value}>{order.phoneNumber}</span></div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Manzil</h2>
        <div className={styles.card}>
          <div className={styles.row}><span className={styles.label}>Viloyat</span><span className={styles.value}>{order.deliveryViloyat.name}</span></div>
          {order.deliveryTuman && <div className={styles.row}><span className={styles.label}>Tuman</span><span className={styles.value}>{order.deliveryTuman.name}</span></div>}
          {order.deliveryNote && <div className={styles.row}><span className={styles.label}>Izoh</span><span className={styles.value}>{order.deliveryNote}</span></div>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mahsulotlar</h2>
        <div className={styles.card}>
          {order.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemName}>{productName(item)}</span>
              <span className={styles.itemQty}>Miqdor: {item.quantity} ta</span>
              <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Jami:</span>
            <span className={styles.totalPrice}>{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>To'lov</h2>
        <div className={styles.card}>
          <div className={styles.row}><span className={styles.label}>To'lov usuli</span><span className={styles.value}>{order.paymentMethod}</span></div>
          <div className={styles.row}><span className={styles.label}>To'lov holati</span><span className={styles.value}>{order.paymentStatus}</span></div>
        </div>
      </div>

      {contragentRequests.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contragent so'rovlari</h2>
          <div className={styles.card}>
            {contragentRequests.map((req) => {
              const contragent = typeof req.contragentId === 'object' ? req.contragentId : null;
              const reqId = req._id || '';
              return (
                <div key={reqId} className={styles.contragentReq}>
                  <div className={styles.row}>
                    <span className={styles.label}>{contragent?.name || 'Contragent'}</span>
                    <span className={styles.value}>{req.status}</span>
                  </div>
                  <div className={styles.reqActions}>
                    {req.status !== 'cancelled' && (
                      <>
                        <Button title="Zaklad to'lash" variant="outline" onPress={() => handlePayZakladOpen(reqId)} disabled={actionLoading} />
                        <Button title="To'liq to'lov" variant="outline" onPress={() => handlePayFinal(reqId)} disabled={actionLoading} />
                        <Button title="Haq to'lash" variant="outline" onPress={() => handlePayProfit(reqId)} disabled={actionLoading} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {order.status === 'pending' && (
          <Button title="Tasdiqlash" onPress={handleConfirmClick} loading={actionLoading} />
        )}

        {order.status === 'confirmed_by_punkt' && (
          <>
            <Button title="Contragentga so'rov yuborish" onPress={openContragentSelection} loading={actionLoading} />
            <Button title="Boshqa punktga so'rov yuborish" variant="outline" onPress={openPunktSelection} loading={actionLoading} />
          </>
        )}

        {order.status === 'accepted_by_contragent' && (
          <Button title="Contragentdan qabul qilish" onPress={handleReceiveContragentClick} loading={actionLoading} />
        )}

        {order.status === 'delivered_to_punkt' && (
          <>
            <Button title="Agentga yuborish" onPress={openAgentSelection} loading={actionLoading} />
            <Button title="Boshqa punktga yuborish" variant="outline" onPress={handleSendToPunktClick} loading={actionLoading} />
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Tasdiqlash"
        message={confirmMessage}
        confirmLabel="Ha"
        cancelLabel="Bekor qilish"
        onConfirm={handleConfirmModalConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
      <AlertModal open={alertOpen} variant={alertVariant} message={alertMessage} onClose={() => setAlertOpen(false)} />

      <SelectionModal
        open={selectionModalOpen}
        title={selectionTitle}
        items={selectionItems}
        loading={selectionLoading}
        onSelect={onSelectionSelect}
        onClose={() => setSelectionModalOpen(false)}
      />

      {zakladModalOpen && (
        <div className={styles.overlay} onClick={() => setZakladModalOpen(false)} role="presentation">
          <div className={styles.zakladDialog} onClick={(e) => e.stopPropagation()} role="dialog">
            <h2 className={styles.zakladTitle}>Zaklad foizi</h2>
            <input
              type="number"
              min={1}
              max={100}
              value={zakladPercent}
              onChange={(e) => setZakladPercent(Number(e.target.value) || 30)}
              className={styles.zakladInput}
            />
            <div className={styles.zakladActions}>
              <Button title="Bekor qilish" variant="outline" onPress={() => { setZakladModalOpen(false); setZakladRequestId(null); }} />
              <Button title="To'lash" onPress={handlePayZakladSubmit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
