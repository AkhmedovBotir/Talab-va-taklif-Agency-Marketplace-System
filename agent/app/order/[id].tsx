// Buyurtma batafsil — GET /agents/me/orders/{id}, yetkazish — POST .../deliver
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { apiService } from '../../services/api';
import type { AgentMeOrderDetail, AgentMeOrderLineItem } from '../../types/api';
import {
  canAgentDeclarePaymentToPunkt,
  canAgentDeliverOrder,
  formatAgentOrderDateTime,
  isAgentOrderTimestampSet,
} from '../../utils/agentMeOrder';
import { getApiErrorMessage } from '../../utils/apiError';

const WEB_MAX_WIDTH = 820;

function marketplaceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Kutilmoqda (jarayonda)',
    delivered: 'Yetkazib berilgan',
    cancelled: 'Bekor qilingan',
  };
  return map[status] || status;
}

function addressModeLabel(mode?: string): string {
  const map: Record<string, string> = {
    default: "Asosiy saqlangan manzil",
    delivery_area: "Foydalanuvchining tanlangan saqlangan manzili",
    extra: "Matnli (qo'lda kiritilgan) manzil",
  };
  if (!mode) return '—';
  return map[mode] || mode;
}

function marketplaceStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'delivered':
      return '#34C759';
    case 'cancelled':
      return '#FF3B30';
    default:
      return '#999';
  }
}

function lineLabel(item: AgentMeOrderLineItem): string {
  const n = item.product_name ?? item.name;
  return typeof n === 'string' && n.trim() ? n : 'Mahsulot';
}

function lineUnitPrice(item: AgentMeOrderLineItem): number {
  const u = item.unit_price ?? item.price;
  return typeof u === 'number' ? u : 0;
}

function lineTotal(item: AgentMeOrderLineItem): number {
  if (typeof item.line_total === 'number') return item.line_total;
  return lineUnitPrice(item) * (item.quantity || 0);
}

function getCustomerName(order: AgentMeOrderDetail): string | null {
  const raw = order as AgentMeOrderDetail & {
    customer_name?: string;
    user_name?: string;
    first_name?: string;
    last_name?: string;
    user?: { first_name?: string; last_name?: string; name?: string };
  };

  const fromDirect = raw.customer_name ?? raw.user_name;
  if (typeof fromDirect === 'string' && fromDirect.trim()) return fromDirect.trim();

  const userName = raw.user?.name;
  if (typeof userName === 'string' && userName.trim()) return userName.trim();

  const first = raw.user?.first_name ?? raw.first_name ?? '';
  const last = raw.user?.last_name ?? raw.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || null;
}

function getCustomerPhone(order: AgentMeOrderDetail): string | null {
  const raw = order as AgentMeOrderDetail & {
    user_phone?: string;
    contact_phones?: string[];
    phone_number?: string;
    phone?: string;
    user?: { phone?: string };
  };
  const fromContacts = Array.isArray(raw.contact_phones)
    ? raw.contact_phones.find((p) => typeof p === 'string' && p.trim())
    : undefined;
  const phone =
    raw.user_phone ??
    fromContacts ??
    raw.extra_phone ??
    raw.phone_number ??
    raw.phone ??
    raw.user?.phone;
  return typeof phone === 'string' && phone.trim() ? phone.trim() : null;
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellWidth = isWeb ? Math.min(WEB_MAX_WIDTH, Math.max(320, windowWidth - 40)) : undefined;
  const itemsMultiCol = isWeb && windowWidth >= 700;

  const [order, setOrder] = useState<AgentMeOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [declaringPayment, setDeclaringPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [snapRegionName, setSnapRegionName] = useState<string | null>(null);
  const [snapDistrictName, setSnapDistrictName] = useState<string | null>(null);
  const [marketplaceUserName, setMarketplaceUserName] = useState<string | null>(null);
  const router = useRouter();
  const { showSnackbar, showConfirm } = useSnackbar();

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiService.getMyOrderById(String(id));
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
      }
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Buyurtmani yuklashda xatolik');
      showSnackbar(msg, { variant: 'error' });
      setTimeout(() => router.back(), 1800);
    } finally {
      setLoading(false);
    }
  }, [id, router, showSnackbar]);

  useEffect(() => {
    setLoading(true);
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const resolveSnapNames = async () => {
      if (!order) return;

      try {
        let regionName: string | null = null;
        let districtName: string | null = null;

        if (order.snap_region_id != null) {
          const regions = await apiService.getNoAuthRegions();
          regionName = regions.find((x) => x.id === order.snap_region_id)?.name ?? null;
        }
        if (order.snap_district_id != null) {
          const districts = await apiService.getNoAuthDistricts(order.snap_region_id);
          districtName = districts.find((x) => x.id === order.snap_district_id)?.name ?? null;
        }

        setSnapRegionName(regionName);
        setSnapDistrictName(districtName);
      } catch {
        setSnapRegionName(null);
        setSnapDistrictName(null);
      }
    };

    resolveSnapNames();
  }, [order]);

  useEffect(() => {
    const resolveMarketplaceUser = async () => {
      if (!order?.user_id) {
        setMarketplaceUserName(null);
        return;
      }
      try {
        const user = await apiService.findNoAuthMarketplaceUserById(order.user_id);
        if (!user) {
          setMarketplaceUserName(null);
          return;
        }
        const full = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
        setMarketplaceUserName(full || null);
      } catch {
        setMarketplaceUserName(null);
      }
    };

    resolveMarketplaceUser();
  }, [order?.user_id]);

  const handleDeclarePayment = async () => {
    if (!id || !order) return;
    const ok = await showConfirm({
      title: "Punktda to'lov",
      message:
        "Naqd yoki hisob orqali punktda to'laganingizdan keyin e'lon qilasiz. Davom etasizmi?",
      confirmText: "E'lon qilish",
      cancelText: 'Bekor qilish',
    });
    if (!ok) return;

    setDeclaringPayment(true);
    try {
      const { message } = await apiService.declareMyOrderPaymentToPunkt(String(id));
      showSnackbar(message, { variant: 'success' });
      await loadOrder();
    } catch (error: unknown) {
      showSnackbar(getApiErrorMessage(error, "To'lov e'lonida xatolik"), { variant: 'error' });
    } finally {
      setDeclaringPayment(false);
    }
  };

  const handleDeliver = async () => {
    if (!id || !order) return;
    const ok = await showConfirm({
      title: 'Yetkazib berildi',
      message: 'Buyurtma mijozga yetkazilganini tasdiqlaysizmi?',
      confirmText: 'Ha, yetkazildi',
      cancelText: 'Bekor qilish',
    });
    if (!ok) return;

    setDelivering(true);
    try {
      const { message } = await apiService.deliverMyOrder(String(id));
      showSnackbar(message, { variant: 'success' });
      await loadOrder();
    } catch (error: unknown) {
      showSnackbar(getApiErrorMessage(error, 'Yetkazishni belgilashda xatolik'), { variant: 'error' });
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Buyurtma topilmadi</Text>
      </View>
    );
  }

  const canDeclarePayment = canAgentDeclarePaymentToPunkt(order);
  const canDeliver = canAgentDeliverOrder(order);
  const customerName = marketplaceUserName ?? getCustomerName(order);
  const customerPhone = getCustomerPhone(order);
  const pendingWaitingPunktChain =
    order.marketplace_status === 'pending' &&
    isAgentOrderTimestampSet(order.agent_declared_payment_to_punkt_at) &&
    !canDeliver;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: `Buyurtma #${order.id}`,
          headerShown: true,
          headerBackTitle: 'Orqaga',
        }}
      />
      <View style={styles.pageOuter}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && shellWidth ? { alignItems: 'center' as const, paddingBottom: 48 } : { paddingBottom: 48 },
          ]}
        >
          <View style={[styles.shell, shellWidth ? { width: shellWidth, maxWidth: '100%' as const } : styles.shellFlex]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.orderTitle}>#{order.id}</Text>
                <Text style={styles.date}>
                  {new Date(order.created_at).toLocaleString('uz-UZ')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: marketplaceStatusColor(order.marketplace_status) }]}>
                <Text style={styles.statusText}>{marketplaceStatusLabel(order.marketplace_status)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summa</Text>
              <View style={styles.infoCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Jami</Text>
                  <Text style={styles.summaryStrong}>
                    {`${(order.total_amount || 0).toLocaleString()} so'm`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mahsulotlar</Text>
                  <Text style={styles.summaryValue}>{order.items_count} ta</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {order.marketplace_status === 'pending' ? 'Punkt zanjiri' : 'Punkt zanjiri (yakunlangan holat)'}
              </Text>
              <View style={styles.infoCard}>
                  <View style={styles.chainRow}>
                    <Text style={styles.chainLabel}>{"Agent to'lov e'loni"}</Text>
                    <Text style={styles.chainValue}>
                      {formatAgentOrderDateTime(order.agent_declared_payment_to_punkt_at)}
                    </Text>
                  </View>
                  <View style={styles.chainRow}>
                    <Text style={styles.chainLabel}>{"Punkt to'lovni tasdiqladi"}</Text>
                    <Text style={styles.chainValue}>
                      {formatAgentOrderDateTime(order.punkt_confirmed_agent_payment_at)}
                    </Text>
                  </View>
                  <View style={styles.chainRow}>
                    <Text style={styles.chainLabel}>{"To'lovdan keyingi yetkazish (punkt)"}</Text>
                    <Text style={styles.chainValue}>
                      {formatAgentOrderDateTime(order.punkt_post_payment_delivered_at)}
                    </Text>
                  </View>
                  <View style={[styles.chainRow, styles.chainRowLast]}>
                    <Text style={styles.chainLabel}>Kontragentlarga qolgan qism topshirildi</Text>
                    <Text style={styles.chainValue}>
                      {formatAgentOrderDateTime(order.punkt_contragent_remainder_handed_over_at)}
                    </Text>
                  </View>
                </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yetkazib berish</Text>
              <View style={styles.infoCard}>
                {(customerName || order.user_id != null) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoValue}>
                      Foydalanuvchi: {customerName ?? `#${order.user_id}`}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#007AFF" />
                  <Text style={styles.infoValue}>
                    {order.snap_area_name || order.primary_custom_address || '—'}
                  </Text>
                </View>
                {order.primary_custom_address ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoValue}>{order.primary_custom_address}</Text>
                  </View>
                ) : null}
                {(order.snap_region_id != null || order.snap_district_id != null) && (
                  <Text style={styles.metaMuted}>
                    Viloyat: {snapRegionName ?? `#${order.snap_region_id ?? '—'}`} · Tuman:{' '}
                    {snapDistrictName ?? `#${order.snap_district_id ?? '—'}`}
                    {order.routing_district_id != null ? ` · Marshrut tuman: ${order.routing_district_id}` : ''}
                  </Text>
                )}
                {customerPhone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoValue}>{customerPhone}</Text>
                  </View>
                ) : null}
                {order.address_note ? (
                  <Text style={styles.note}>{order.address_note}</Text>
                ) : null}
                {order.address_mode ? (
                  <Text style={styles.metaMuted}>Manzil rejimi: {addressModeLabel(order.address_mode)}</Text>
                ) : null}
                {order.assigned_punkt_id != null && (
                  <Text style={styles.metaMuted}>Punkt ID: {order.assigned_punkt_id}</Text>
                )}
                {order.assigned_punkt?.name ? (
                  <Text style={styles.metaMuted}>
                    {`Punkt: ${order.assigned_punkt.name}${order.assigned_punkt.phone ? ` (${order.assigned_punkt.phone})` : ''}`}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qatorlar</Text>
              <View style={itemsMultiCol ? styles.itemsGrid : undefined}>
                {items.length === 0 ? (
                  <Text style={styles.metaMuted}>{"Mahsulot qatorlari yo'q"}</Text>
                ) : (
                  items.map((item, index) => (
                    <View
                      key={index}
                      style={[styles.itemCard, itemsMultiCol && styles.itemCardGrid]}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{lineLabel(item)}</Text>
                        <Text style={styles.itemQty}>×{item.quantity}</Text>
                      </View>
                      <View style={styles.itemFooter}>
                        <Text style={styles.itemMuted}>
                          {`Birlik: ${lineUnitPrice(item).toLocaleString()} so'm`}
                        </Text>
                        <Text style={styles.itemTotal}>
                          {`${lineTotal(item).toLocaleString()} so'm`}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {canDeclarePayment && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.paymentDeclareButton, declaringPayment && styles.buttonDisabled]}
                  onPress={handleDeclarePayment}
                  disabled={declaringPayment}
                  accessibilityRole="button"
                >
                  {declaringPayment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.touchableRow}>
                      <Ionicons name="wallet-outline" size={22} color="#fff" />
                      <Text style={styles.paymentDeclareButtonText}>
                        {"Punktda to'lovni e'lon qilish"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.actionHint}>
                  {
                    "Avvalo punktda naqd yoki hisob orqali to'lang, keyin shu tugmani bosing — punkt zanjiri boshlanadi."
                  }
                </Text>
              </View>
            )}

            {pendingWaitingPunktChain && (
              <View style={styles.bannerInfo}>
                <Ionicons name="time-outline" size={22} color="#E65100" />
                <Text style={styles.bannerInfoText}>
                  {
                    "Punkt to'lovni tasdiqlaydi va to'lovdan keyingi yetkazish bosqichini yakunlaydi. Shu bosqich tugagach «Yetkazib berildi» ochiladi."
                  }
                </Text>
              </View>
            )}

            {canDeliver && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.deliverButton, delivering && styles.buttonDisabled]}
                  onPress={handleDeliver}
                  disabled={delivering}
                  accessibilityRole="button"
                >
                  {delivering ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.touchableRow}>
                      <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
                      <Text style={styles.deliverButtonText}>Yetkazib berildi</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!canDeliver && order.marketplace_status === 'delivered' && (
              <View style={styles.bannerOk}>
                <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
                <Text style={styles.bannerOkText}>Buyurtma yetkazilgan deb belgilangan.</Text>
              </View>
            )}

            {!canDeliver && order.marketplace_status === 'cancelled' && (
              <View style={styles.bannerWarn}>
                <Ionicons name="close-circle" size={22} color="#C62828" />
                <Text style={styles.bannerWarnText}>
                  {"Buyurtma bekor qilingan — to'lov e'loni va yetkazish mumkin emas."}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pageOuter: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  shell: {},
  shellFlex: {
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  orderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 200,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  note: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  metaMuted: {
    fontSize: 13,
    color: '#888',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  summaryStrong: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemCardGrid: {
    width: '48%',
    minWidth: 260,
    flexGrow: 1,
    marginBottom: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemQty: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemMuted: {
    fontSize: 13,
    color: '#888',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  itemKpi: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
  },
  actionContainer: {
    padding: 16,
    marginTop: 8,
  },
  touchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  paymentDeclareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  paymentDeclareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  chainRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chainRowLast: {
    borderBottomWidth: 0,
  },
  chainLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  chainValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  bannerInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    lineHeight: 20,
  },
  deliverButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  bannerOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  bannerOkText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  bannerWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  bannerWarnText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    fontWeight: '500',
  },
});
