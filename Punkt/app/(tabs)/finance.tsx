import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { apiService, BalanceResponse, PaymentTransaction, TransactionsResponse } from '../services/api';

type TransactionType = 'all' | 'income' | 'expense';

export default function FinanceScreen() {
  const [balance, setBalance] = useState<BalanceResponse['data'] | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    type: TransactionType;
    category: string;
    startDate: string;
    endDate: string;
  }>({
    type: 'all',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateValue, setStartDateValue] = useState<Date | null>(null);
  const [endDateValue, setEndDateValue] = useState<Date | null>(null);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadBalance = useCallback(async () => {
    try {
      const response = await apiService.getBalance();
      setBalance(response.data);
    } catch (error: any) {
      console.error('Error loading balance:', error);
    }
  }, []);

  const loadTransactions = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (filters.type !== 'all') {
        params.type = filters.type;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response: TransactionsResponse = await apiService.getTransactions(params);
      
      if (reset) {
        setTransactions(response.data);
      } else {
        setTransactions((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filters]);

  const loadData = useCallback(async () => {
    await Promise.all([loadBalance(), loadTransactions(1, true)]);
    setPage(1);
  }, [loadBalance, loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData();
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage, false);
    }
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    setPage(1);
    loadTransactions(1, true);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: '',
      startDate: '',
      endDate: '',
    });
    setStartDateValue(null);
    setEndDateValue(null);
    setFilterModalVisible(false);
    setPage(1);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('uz-UZ') + ' so\'m';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('uz-UZ');
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDateValue(selectedDate);
      setFilters({ ...filters, startDate: formatDateForAPI(selectedDate) });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDateValue(selectedDate);
      setFilters({ ...filters, endDate: formatDateForAPI(selectedDate) });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      punkt_received_from_admin: 'Admindan olingan',
      admin_to_punkt: 'Admindan olingan',
      punkt_to_contragent_zaklad: 'Kontragentga zaklad',
      punkt_to_contragent_final_payment: 'Kontragentga qolgan asl narx',
      punkt_to_contragent_profit: 'Kontragentga sof foyda',
      punkt_received_from_agent: 'Agentdan olingan',
      agent_to_punkt: 'Agentdan olingan',
    };
    return labels[category] || category;
  };

  const renderTransaction = ({ item }: { item: PaymentTransaction }) => {
    // Determine if this is income for the punkt based on category and user types
    // If toUser is Punkt, it's income; if fromUser is Punkt, it's expense
    let isIncome = item.type === 'income';
    
    // Override based on category for punkt perspective
    if (item.category === 'admin_to_punkt' || item.category === 'punkt_received_from_admin') {
      isIncome = true; // Punkt receives from admin = income
    } else if (
      item.category === 'punkt_to_contragent_zaklad' ||
      item.category === 'punkt_to_contragent_final_payment' ||
      item.category === 'punkt_to_contragent_profit'
    ) {
      isIncome = false; // Punkt pays to contragent (zaklad, final payment, profit) = expense
    } else if (item.category === 'punkt_received_from_agent' || item.category === 'agent_to_punkt') {
      isIncome = true; // Punkt receives from agent = income
    } else if (item.toUser.userType === 'Punkt') {
      isIncome = true; // Money coming to punkt = income
    } else if (item.fromUser.userType === 'Punkt') {
      isIncome = false; // Money going from punkt = expense
    }
    
    const userName = isIncome 
      ? (typeof item.fromUser.userId === 'object' 
          ? item.fromUser.userId.name 
          : 'Noma\'lum')
      : (typeof item.toUser.userId === 'object'
          ? item.toUser.userId.name
          : 'Noma\'lum');

    return (
      <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
        <View style={styles.transactionContent}>
          <View style={[styles.typeIndicator, isIncome ? styles.incomeIndicator : styles.expenseIndicator]}>
            <Ionicons 
              name={isIncome ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color="#FFF" 
            />
          </View>
          <View style={styles.transactionInfo}>
            <View style={styles.transactionHeaderRow}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description || 'Tranzaksiya'}
              </Text>
              <Text style={[
                styles.amountText,
                isIncome ? styles.incomeAmount : styles.expenseAmount
              ]}>
                {isIncome ? '+' : '-'} {formatPrice(item.amount)}
              </Text>
            </View>
            
            <View style={styles.transactionMeta}>
              <View style={styles.transactionMetaRow}>
                <Ionicons name="pricetag-outline" size={12} color="#8E8E93" />
                <Text style={styles.transactionCategory}>{getCategoryLabel(item.category)}</Text>
              </View>
              {item.order && (
                <View style={styles.transactionMetaRow}>
                  <Ionicons name="document-text-outline" size={12} color="#8E8E93" />
                  <Text style={styles.transactionOrder}>
                    #{item.order.orderNumber}
                  </Text>
                </View>
              )}
              {item.zakladPercentage && (
                <View style={styles.transactionMetaRow}>
                  <Ionicons name="calculator-outline" size={12} color="#8E8E93" />
                  <Text style={styles.transactionZaklad}>
                    Zaklad: {item.zakladPercentage}%
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.transactionFooter}>
              <View style={styles.transactionUserRow}>
                <Ionicons 
                  name={isIncome ? 'person-outline' : 'person-add-outline'} 
                  size={12} 
                  color="#8E8E93" 
                />
                <Text style={styles.transactionUser}>
                  {isIncome ? 'Dan' : 'Ga'}: {userName}
                </Text>
              </View>
              <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Balance Summary */}
      {balance && (
        <View style={styles.balanceSection}>
          <View style={styles.balanceMainCard}>
            <View style={styles.balanceMainHeader}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.balanceMainLabel}>Joriy balans</Text>
            </View>
            <Text style={[
              styles.balanceMainAmount,
              balance.balance >= 0 ? styles.balancePositive : styles.balanceNegative
            ]}>
              {formatPrice(balance.balance)}
            </Text>
            {(balance.qarz > 0 || balance.haq > 0) && (
              <View style={styles.balanceDetailsRow}>
                {balance.qarz > 0 && (
                  <View style={styles.balanceDetailItem}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.balanceDetailLabel}>Qarz:</Text>
                    <Text style={styles.balanceDetailQarz}>{formatPrice(balance.qarz)}</Text>
                  </View>
                )}
                {balance.haq > 0 && (
                  <View style={styles.balanceDetailItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.balanceDetailLabel}>Haq:</Text>
                    <Text style={styles.balanceDetailHaq}>{formatPrice(balance.haq)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          
          <View style={styles.balanceStatsContainer}>
            <View style={[styles.balanceStatCard, styles.incomeCard]}>
              <View style={styles.balanceStatIconContainer}>
                <Ionicons name="arrow-down-circle" size={20} color="#34C759" />
              </View>
              <View style={styles.balanceStatContent}>
                <Text style={styles.balanceStatLabel}>Kirim</Text>
                <Text style={styles.balanceStatIncome}>{formatPrice(balance.totalIncome)}</Text>
              </View>
            </View>
            
            <View style={[styles.balanceStatCard, styles.expenseCard]}>
              <View style={styles.balanceStatIconContainer}>
                <Ionicons name="arrow-up-circle" size={20} color="#FF3B30" />
              </View>
              <View style={styles.balanceStatContent}>
                <Text style={styles.balanceStatLabel}>Chiqim</Text>
                <Text style={styles.balanceStatExpense}>{formatPrice(balance.totalExpense)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Tranzaksiyalar topilmadi</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrlar</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tranzaksiya turi</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      filters.type === 'all' && styles.typeButtonActive
                    ]}
                    onPress={() => setFilters({ ...filters, type: 'all' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      filters.type === 'all' && styles.typeButtonTextActive
                    ]}>
                      Barchasi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      filters.type === 'income' && styles.typeButtonActive
                    ]}
                    onPress={() => setFilters({ ...filters, type: 'income' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      filters.type === 'income' && styles.typeButtonTextActive
                    ]}>
                      Kirim
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      filters.type === 'expense' && styles.typeButtonActive
                    ]}
                    onPress={() => setFilters({ ...filters, type: 'expense' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      filters.type === 'expense' && styles.typeButtonTextActive
                    ]}>
                      Chiqim
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Kategoriya</Text>
                <Input
                  placeholder="Kategoriya"
                  value={filters.category}
                  onChangeText={(text) => setFilters({ ...filters, category: text })}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Boshlanish sanasi</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.dateInput}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={[
                    styles.dateInputText,
                    !startDateValue && styles.dateInputPlaceholder
                  ]}>
                    {startDateValue ? formatDisplayDate(startDateValue) : 'Sanani tanlang'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tugash sanasi</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  style={styles.dateInput}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={[
                    styles.dateInputText,
                    !endDateValue && styles.dateInputPlaceholder
                  ]}>
                    {endDateValue ? formatDisplayDate(endDateValue) : 'Sanani tanlang'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* iOS Date Pickers inside Modal */}
              {Platform.OS === 'ios' && showStartDatePicker && (
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.iosDatePickerHeader}>
                    <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                      <Text style={styles.iosDatePickerButton}>Bekor</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosDatePickerTitle}>Boshlanish sanasi</Text>
                    <TouchableOpacity onPress={() => {
                      if (startDateValue) {
                        setFilters({ ...filters, startDate: formatDateForAPI(startDateValue) });
                      }
                      setShowStartDatePicker(false);
                    }}>
                      <Text style={[styles.iosDatePickerButton, styles.iosDatePickerButtonPrimary]}>Tanlash</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startDateValue || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleStartDateChange}
                    maximumDate={endDateValue || new Date()}
                  />
                </View>
              )}
              {Platform.OS === 'ios' && showEndDatePicker && (
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.iosDatePickerHeader}>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                      <Text style={styles.iosDatePickerButton}>Bekor</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosDatePickerTitle}>Tugash sanasi</Text>
                    <TouchableOpacity onPress={() => {
                      if (endDateValue) {
                        setFilters({ ...filters, endDate: formatDateForAPI(endDateValue) });
                      }
                      setShowEndDatePicker(false);
                    }}>
                      <Text style={[styles.iosDatePickerButton, styles.iosDatePickerButtonPrimary]}>Tanlash</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={endDateValue || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleEndDateChange}
                    minimumDate={startDateValue || undefined}
                    maximumDate={new Date()}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Tozalash"
                onPress={clearFilters}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Qo'llash"
                onPress={applyFilters}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Android Date Pickers */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={startDateValue || new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          maximumDate={endDateValue || new Date()}
        />
      )}
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={endDateValue || new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDateValue || undefined}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  balanceSection: {
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  balanceMainCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  balanceMainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  balanceMainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceMainAmount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  balancePositive: {
    color: '#34C759',
  },
  balanceNegative: {
    color: '#FF3B30',
  },
  balanceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 16,
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  balanceDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  balanceDetailQarz: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  balanceDetailHaq: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  balanceStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceStatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  incomeCard: {
    borderColor: '#E8F5E9',
    backgroundColor: '#F1F8F4',
  },
  expenseCard: {
    borderColor: '#FFEBEE',
    backgroundColor: '#FFF5F5',
  },
  balanceStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  balanceStatContent: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  balanceStatIncome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  balanceStatExpense: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  incomeIndicator: {
    backgroundColor: '#34C759',
  },
  expenseIndicator: {
    backgroundColor: '#FF3B30',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  transactionMeta: {
    marginBottom: 10,
    gap: 6,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  transactionOrder: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  transactionZaklad: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  transactionUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionUser: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 11,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  incomeAmount: {
    color: '#34C759',
  },
  expenseAmount: {
    color: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    padding: 16,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    gap: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  dateInputPlaceholder: {
    color: '#999',
  },
  iosDatePickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iosDatePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  iosDatePickerButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  iosDatePickerButtonPrimary: {
    fontWeight: '600',
  },
});
