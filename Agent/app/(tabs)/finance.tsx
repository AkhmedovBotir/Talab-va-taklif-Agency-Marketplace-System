// Finance Screen - Agent Finance Management
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type {
  AgentRole,
  PaymentTransaction,
  FinanceSubmission,
  AgentDailyReport,
} from '../../types/api';

type TabType = 'report' | 'pending' | 'collected' | 'submissions' | 'statistics';

export default function FinanceScreen() {
  const { role, agent } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // MFY Agent States
  const [mfyReport, setMfyReport] = useState<AgentDailyReport | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentTransaction[]>([]);
  const [collectedTransactions, setCollectedTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Cache for order and user data
  const [ordersCache, setOrdersCache] = useState<Record<string, any>>({});
  const [usersCache, setUsersCache] = useState<Record<string, any>>({});

  // Tuman/Viloyat Agent States
  const [districtReport, setDistrictReport] = useState<any>(null);
  const [provinceReport, setProvinceReport] = useState<any>(null);
  const [submissions, setSubmissions] = useState<FinanceSubmission[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Statistics States
  const [statistics, setStatistics] = useState<any>(null);
  const [statStartDate, setStatStartDate] = useState<Date | null>(null);
  const [statEndDate, setStatEndDate] = useState<Date | null>(null);
  const [showStatDatePicker, setShowStatDatePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, role, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      if (role === 'mfy') {
        if (activeTab === 'report') {
          const response = await apiService.getMFYDailyReport(dateStr);
          if (response.success) {
            setMfyReport(response.report);
          }
        } else if (activeTab === 'pending') {
          const response = await apiService.getMFYPendingPayments();
          if (response.success) {
            setPendingPayments(response.transactions);
          }
        } else if (activeTab === 'collected') {
          // Get collected transactions from daily report
          // According to API docs, daily report contains transactions array
          const response = await apiService.getMFYDailyReport(dateStr);
          console.log('=== MFY Collected Transactions API Response ===');
          console.log('Full Response:', JSON.stringify(response, null, 2));
          
          if (response.success && response.report) {
            // Get transactions from report
            // According to API docs, transactions can be an array of transaction IDs or full objects
            const reportTransactions = response.report.transactions || [];
            console.log('Report Transactions:', JSON.stringify(reportTransactions, null, 2));
            console.log('Report Transactions Type:', Array.isArray(reportTransactions) ? 'array' : typeof reportTransactions);
            console.log('Report Transactions Length:', Array.isArray(reportTransactions) ? reportTransactions.length : 0);
            
            // Filter collected but not yet submitted to district transactions
            // According to API docs: status === 'collected' && currentHolder === 'mfy_agent' && not submitted to district
            const collected = reportTransactions.filter((t: any) => {
              // Handle both cases: transaction ID string or full transaction object
              if (typeof t === 'string') {
                // If it's just an ID, we can't filter it here, skip it
                console.log(`Transaction is just an ID: ${t}, skipping filter`);
                return false;
              }
              
              // It's a full transaction object
              const isCollected = t.status === 'collected';
              const isMfyHolder = t.currentHolder === 'mfy_agent';
              const notSubmitted = !t.submittedToDistrict || t.submittedToDistrict === null; // Not yet submitted to district
              
              console.log(`Transaction ${t._id}: status=${t.status}, currentHolder=${t.currentHolder}, submittedToDistrict=${t.submittedToDistrict}, isCollected=${isCollected}, isMfyHolder=${isMfyHolder}, notSubmitted=${notSubmitted}`);
              
              return isCollected && isMfyHolder && notSubmitted;
            });
            
            console.log('Filtered Collected Transactions:', JSON.stringify(collected, null, 2));
            console.log('Collected Count:', collected.length);
            
            // Transactions should already have order and user objects from API
            // But we'll enrich them if they're just IDs
            const enrichedTransactions = collected.map((t: PaymentTransaction) => {
              // If order is just an ID string, try to get from cache or keep as is
              let enrichedOrder = t.order;
              if (typeof t.order === 'string') {
                const cachedOrder = ordersCache[t.order];
                if (cachedOrder) {
                  enrichedOrder = cachedOrder;
                } else {
                  // Keep as string ID, will be handled in render
                  enrichedOrder = t.order;
                }
              }
              
              // If user is just an ID string, try to get from cache or keep as is
              let enrichedUser = t.user;
              if (typeof t.user === 'string') {
                const cachedUser = usersCache[t.user];
                if (cachedUser) {
                  enrichedUser = cachedUser;
                } else {
                  // Keep as string ID, will be handled in render
                  enrichedUser = t.user;
                }
              }
              
              return {
                ...t,
                order: enrichedOrder,
                user: enrichedUser,
              } as PaymentTransaction;
            });
            
            console.log('Enriched Transactions:', JSON.stringify(enrichedTransactions, null, 2));
            setCollectedTransactions(enrichedTransactions as any);
          } else {
            console.log('No transactions in response or response failed');
            setCollectedTransactions([]);
          }
        } else if (activeTab === 'statistics') {
          const params: any = {};
          if (statStartDate) params.startDate = statStartDate.toISOString().split('T')[0];
          if (statEndDate) params.endDate = statEndDate.toISOString().split('T')[0];
          const response = await apiService.getMFYStatistics(params);
          if (response.success) {
            setStatistics(response.statistics);
          }
        }
      } else if (role === 'tuman') {
        if (activeTab === 'report') {
          const response = await apiService.getDistrictReport(dateStr);
          if (response.success) {
            setDistrictReport(response.report);
          }
        } else if (activeTab === 'submissions') {
          const response = await apiService.getDistrictSubmissions('pending');
          if (response.success) {
            setSubmissions(response.submissions);
          }
        } else if (activeTab === 'collected') {
          // Load confirmed submissions for collected tab
          const confirmedResponse = await apiService.getDistrictSubmissions('confirmed');
          console.log('=== Tuman Collected Submissions API Response ===');
          console.log('Full Response:', JSON.stringify(confirmedResponse, null, 2));
          if (confirmedResponse.success) {
            console.log('Confirmed Submissions:', JSON.stringify(confirmedResponse.submissions, null, 2));
            console.log('Submissions Count:', confirmedResponse.submissions.length);
            
            // Process submissions and extract transactions
            confirmedResponse.submissions.forEach((submission: FinanceSubmission) => {
              console.log('Processing Submission:', JSON.stringify(submission, null, 2));
              if (Array.isArray(submission.transactions)) {
                submission.transactions.forEach((t: any) => {
                  console.log('Transaction in submission:', typeof t === 'string' ? t : JSON.stringify(t, null, 2));
                });
              }
            });
            
            // Store confirmed submissions, transactions will be extracted in render
            setSubmissions(confirmedResponse.submissions);
          } else {
            console.log('Failed to load confirmed submissions');
            setSubmissions([]);
          }
        } else if (activeTab === 'statistics') {
          const params: any = {};
          if (statStartDate) params.startDate = statStartDate.toISOString().split('T')[0];
          if (statEndDate) params.endDate = statEndDate.toISOString().split('T')[0];
          const response = await apiService.getDistrictStatistics(params);
          if (response.success) {
            setStatistics(response.statistics);
          }
        }
      } else if (role === 'viloyat') {
        if (activeTab === 'report') {
          const response = await apiService.getProvinceReport(dateStr);
          if (response.success) {
            setProvinceReport(response.report);
          }
        } else if (activeTab === 'submissions') {
          const response = await apiService.getProvinceSubmissions('pending');
          if (response.success) {
            setSubmissions(response.submissions);
          }
        } else if (activeTab === 'collected') {
          // Load confirmed submissions for collected tab
          const confirmedResponse = await apiService.getProvinceSubmissions('confirmed');
          console.log('=== Viloyat Collected Submissions API Response ===');
          console.log('Full Response:', JSON.stringify(confirmedResponse, null, 2));
          if (confirmedResponse.success) {
            console.log('Confirmed Submissions:', JSON.stringify(confirmedResponse.submissions, null, 2));
            console.log('Submissions Count:', confirmedResponse.submissions.length);
            
            // Process submissions and extract transactions
            confirmedResponse.submissions.forEach((submission: FinanceSubmission) => {
              console.log('Processing Submission:', JSON.stringify(submission, null, 2));
              if (Array.isArray(submission.transactions)) {
                submission.transactions.forEach((t: any) => {
                  console.log('Transaction in submission:', typeof t === 'string' ? t : JSON.stringify(t, null, 2));
                });
              }
            });
            
            // Store confirmed submissions, transactions will be extracted in render
            setSubmissions(confirmedResponse.submissions);
          } else {
            console.log('Failed to load confirmed submissions');
            setSubmissions([]);
          }
        } else if (activeTab === 'statistics') {
          const params: any = {};
          if (statStartDate) params.startDate = statStartDate.toISOString().split('T')[0];
          if (statEndDate) params.endDate = statEndDate.toISOString().split('T')[0];
          const response = await apiService.getProvinceStatistics(params);
          if (response.success) {
            setStatistics(response.statistics);
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCollectPayment = async (transactionId: string) => {
    Alert.alert(
      'To\'lovni qabul qilish',
      'Haqiqatan ham bu to\'lovni qabul qilmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            try {
              const response = await apiService.collectPayment(transactionId);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message);
                // Refresh pending payments and collected transactions
                loadData();
                // Switch to collected tab after successful collection
                if (role === 'mfy') {
                  setActiveTab('collected');
                }
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'To\'lovni qabul qilishda xatolik');
            }
          },
        },
      ]
    );
  };

  const handleSubmitToDistrict = async () => {
    if (selectedTransactions.length === 0) {
      Alert.alert('Xatolik', 'Kamida bitta transaksiya tanlanishi kerak');
      return;
    }

    Alert.alert(
      'Tuman agentga topshirish',
      `${selectedTransactions.length} ta transaksiyani tuman agentga topshirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Topshirish',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await apiService.submitToDistrict({
                transactionIds: selectedTransactions,
                notes: 'Kunlik topshiruv',
              });
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message);
                setSelectedTransactions([]);
                loadData();
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'Topshirishda xatolik');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmSubmission = async (submissionId: string) => {
    Alert.alert(
      'Topshiruvni tasdiqlash',
      'Haqiqatan ham bu topshiruvni tasdiqlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          onPress: async () => {
            setConfirming(submissionId);
            try {
              let response;
              if (role === 'tuman') {
                response = await apiService.confirmDistrictSubmission(submissionId);
              } else if (role === 'viloyat') {
                response = await apiService.confirmProvinceSubmission(submissionId);
              }
              if (response?.success) {
                Alert.alert('Muvaffaqiyatli', response.message);
                loadData();
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'Tasdiqlashda xatolik');
            } finally {
              setConfirming(null);
            }
          },
        },
      ]
    );
  };

  const handleSubmitToProvince = async (transactionIds: string[]) => {
    Alert.alert(
      'Viloyat agentga topshirish',
      `${transactionIds.length} ta transaksiyani viloyat agentga topshirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Topshirish',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await apiService.submitToProvince({
                transactionIds,
                notes: 'Kunlik topshiruv',
              });
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message);
                loadData();
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'Topshirishda xatolik');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitToFinance = async (transactionIds: string[]) => {
    Alert.alert(
      'Moliya bo\'limiga topshirish',
      `${transactionIds.length} ta transaksiyani moliya bo\'limiga topshirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Topshirish',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await apiService.submitToFinance({
                transactionIds,
                notes: 'Kunlik topshiruv',
              });
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message);
                loadData();
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'Topshirishda xatolik');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const toggleTransactionSelection = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(t => t !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('uz-UZ') + ' so\'m';
  };

  const getTabs = (): { key: TabType; label: string; icon: string }[] => {
    if (role === 'mfy') {
      return [
        { key: 'report', label: 'Kunlik hisobot', icon: 'document-text' },
        { key: 'pending', label: 'Kutilayotgan', icon: 'time' },
        { key: 'collected', label: 'Qabul qilingan', icon: 'checkmark-circle' },
        { key: 'statistics', label: 'Statistika', icon: 'stats-chart' },
      ];
    } else if (role === 'tuman' || role === 'viloyat') {
      return [
        { key: 'report', label: 'Hisobot', icon: 'document-text' },
        { key: 'submissions', label: 'Topshiruvlar', icon: 'send' },
        { key: 'collected', label: 'Qabul qilingan', icon: 'checkmark-circle' },
        { key: 'statistics', label: 'Statistika', icon: 'stats-chart' },
      ];
    }
    return [];
  };

  const renderMFYReport = () => {
    if (!mfyReport) return null;

    return (
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Kunlik hisobot</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Buyurtmalar</Text>
              <Text style={styles.summaryValue}>{mfyReport.ordersCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Jami summa</Text>
              <Text style={styles.summaryValue}>{formatCurrency(mfyReport.totalAmount)}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Qabul qilingan</Text>
              <Text style={[styles.summaryValue, styles.successText]}>{formatCurrency(mfyReport.collectedAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Topshirilgan</Text>
              <Text style={[styles.summaryValue, styles.infoText]}>{formatCurrency(mfyReport.submittedAmount)}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Naqd</Text>
              <Text style={styles.summaryValue}>{formatCurrency(mfyReport.cashAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Karta</Text>
              <Text style={styles.summaryValue}>{formatCurrency(mfyReport.cardAmount)}</Text>
            </View>
          </View>
          {mfyReport.pendingAmount > 0 && (
            <View style={styles.pendingBadge}>
              <Ionicons name="alert-circle" size={16} color="#FF9500" />
              <Text style={styles.pendingText}>Kutilayotgan: {formatCurrency(mfyReport.pendingAmount)}</Text>
            </View>
          )}
        </View>

        {mfyReport.transactions && mfyReport.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaksiyalar ({mfyReport.transactions.length})</Text>
            {mfyReport.transactions.map((transaction) => {
              const orderNumber = typeof transaction.order === 'object' && transaction.order && 'orderNumber' in transaction.order
                ? transaction.order.orderNumber
                : typeof transaction.order === 'string'
                ? ordersCache[transaction.order]?.orderNumber || 'N/A'
                : 'N/A';
              
              return (
                <View key={transaction._id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionOrder}>#{orderNumber}</Text>
                    <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionMethod}>
                      {transaction.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                    </Text>
                    <Text style={styles.transactionStatus}>{transaction.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPendingPayments = () => {
    const selectedPendingAmount = pendingPayments
      .filter(t => selectedTransactions.includes(t._id))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const handleSelectAllPending = () => {
      if (selectedTransactions.length === pendingPayments.length && pendingPayments.length > 0) {
        setSelectedTransactions([]);
      } else {
        setSelectedTransactions(pendingPayments.map(t => t._id));
      }
    };
    
    const isAllPendingSelected = selectedTransactions.length === pendingPayments.length && pendingPayments.length > 0;
    
    const handleCollectSelected = async () => {
      if (selectedTransactions.length === 0) {
        Alert.alert('Xatolik', 'Hech qanday to\'lov tanlanmagan');
        return;
      }
      
      Alert.alert(
        'To\'lovlarni qabul qilish',
        `${selectedTransactions.length} ta to'lovni qabul qilmoqchimisiz?`,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          {
            text: 'Qabul qilish',
            onPress: async () => {
              setSubmitting(true);
              try {
                // Collect all selected payments
                for (const transactionId of selectedTransactions) {
                  await apiService.collectPayment(transactionId);
                }
                Alert.alert('Muvaffaqiyat', 'Barcha to\'lovlar qabul qilindi');
                setSelectedTransactions([]);
                loadData();
              } catch (error: any) {
                Alert.alert('Xatolik', error.response?.data?.message || 'To\'lovlarni qabul qilishda xatolik');
              } finally {
                setSubmitting(false);
              }
            },
          },
        ]
      );
    };
    
    return (
      <View style={styles.content}>
        <View style={styles.headerActions}>
          <View style={styles.headerSummaryRow}>
            <Text style={styles.summaryInfo}>
              Tanlangan: {selectedTransactions.length} / {pendingPayments.length}
            </Text>
            {pendingPayments.length > 0 && (
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAllPending}
              >
                <Ionicons 
                  name={isAllPendingSelected ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.selectAllText}>
                  {isAllPendingSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {selectedTransactions.length > 0 && (
            <>
              <View style={styles.selectedAmountRow}>
                <Text style={styles.selectedAmountLabel}>Tanlangan summa:</Text>
                <Text style={styles.selectedAmountValue}>{formatCurrency(selectedPendingAmount)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleCollectSelected}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cash" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      Qabul qilish ({selectedTransactions.length} ta)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <FlatList
          data={pendingPayments}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const orderNumber = typeof item.order === 'object' && item.order && 'orderNumber' in item.order
              ? item.order.orderNumber
              : typeof item.order === 'string'
              ? ordersCache[item.order]?.orderNumber || 'N/A'
              : 'N/A';
            
            const userName = typeof item.user === 'object' && item.user && 'name' in item.user
              ? item.user.name
              : typeof item.user === 'string'
              ? (usersCache[item.user]?.name || ordersCache[typeof item.order === 'string' ? item.order : '']?.user?.name || 'Noma\'lum')
              : 'Noma\'lum';
            
            const userPhone = typeof item.user === 'object' && item.user && 'phone' in item.user
              ? item.user.phone
              : typeof item.user === 'string'
              ? (usersCache[item.user]?.phone || ordersCache[typeof item.order === 'string' ? item.order : '']?.user?.phone || '')
              : '';
            
            const isSelected = selectedTransactions.includes(item._id);
            
            return (
              <TouchableOpacity
                style={[
                  styles.paymentCard,
                  isSelected && styles.paymentCardSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedTransactions(prev => prev.filter(id => id !== item._id));
                  } else {
                    setSelectedTransactions(prev => [...prev, item._id]);
                  }
                }}
              >
                <View style={styles.paymentHeader}>
                  <View>
                    <Text style={styles.paymentOrder}>#{orderNumber}</Text>
                    <Text style={styles.paymentUser}>{userName}</Text>
                    <Text style={styles.paymentPhone}>{userPhone}</Text>
                  </View>
                  <View style={styles.paymentAmountContainer}>
                    <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </View>
                </View>
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={styles.collectButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCollectPayment(item._id);
                    }}
                  >
                    <Ionicons name="cash" size={16} color="#007AFF" />
                    <Text style={styles.collectButtonText}>Qabul qilish</Text>
                  </TouchableOpacity>
                  <Text style={styles.paymentMethod}>
                    {item.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Kutilayotgan to'lovlar yo'q</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderCollectedTransactions = () => {
    console.log('=== renderCollectedTransactions - Current State ===');
    console.log('Role:', role);
    console.log('Collected Transactions (MFY):', JSON.stringify(collectedTransactions, null, 2));
    console.log('Collected Transactions Count (MFY):', collectedTransactions.length);
    console.log('Submissions (Tuman/Viloyat):', JSON.stringify(submissions, null, 2));
    console.log('Selected Transactions:', selectedTransactions);
    console.log('Selected Transactions Count:', selectedTransactions.length);
    
    // MFY specific debug
    if (role === 'mfy') {
      console.log('=== MFY Agent Debug ===');
      console.log('collectedTransactions.length:', collectedTransactions.length);
      console.log('selectedTransactions.length:', selectedTransactions.length);
      console.log('Should show submit button:', selectedTransactions.length > 0);
      collectedTransactions.forEach((t, index) => {
        console.log(`Transaction ${index}:`, {
          id: t._id,
          amount: t.amount,
          order: typeof t.order === 'string' ? t.order : t.order?._id,
          user: typeof t.user === 'string' ? t.user : t.user?._id,
          status: t.status,
          currentHolder: t.currentHolder,
        });
      });
    }
    
    // For Tuman/Viloyat agents, get transaction IDs from confirmed submissions
    // But only include transactions that haven't been submitted to next level yet
    const confirmedSubmissions = submissions.filter(s => s.status === 'confirmed');
    console.log('Confirmed Submissions (filtered):', JSON.stringify(confirmedSubmissions, null, 2));
    
    // Collect all available transactions (both submitted and not submitted)
    const allAvailableTransactions: Array<{ id: string; amount: number; submitted: boolean }> = [];
    const transactionIds: string[] = [];
    let totalAmount = 0;
    let totalTransactionsCount = 0;
    let submittedAmount = 0;
    let submittedCount = 0;
    let notSubmittedAmount = 0;
    let notSubmittedCount = 0;
    
    confirmedSubmissions.forEach(submission => {
      console.log('Processing Submission:', JSON.stringify(submission, null, 2));
      if (Array.isArray(submission.transactions)) {
        submission.transactions.forEach(t => {
          console.log('Transaction item:', typeof t === 'string' ? t : JSON.stringify(t, null, 2));
          
          if (typeof t === 'string') {
            // If it's just an ID, we can't check status, so include it
            allAvailableTransactions.push({ id: t, amount: 0, submitted: false });
            transactionIds.push(t);
          } else if (t && typeof t === 'object' && t._id) {
            const amount = t.amount || 0;
            let canSubmit = false;
            let isSubmitted = false;
            
            // Check if transaction can be submitted to next level
            if (role === 'tuman') {
              // For tuman agent: only include if not yet submitted to province
              // currentHolder should be 'district_agent' and submittedToProvince should be null
              canSubmit = t.currentHolder === 'district_agent' && !t.submittedToProvince;
              isSubmitted = !!t.submittedToProvince;
              console.log(`Transaction ${t._id} - currentHolder: ${t.currentHolder}, submittedToProvince: ${t.submittedToProvince}, canSubmit: ${canSubmit}`);
            } else if (role === 'viloyat') {
              // For viloyat agent: only include if not yet submitted to finance
              // currentHolder should be 'province_agent' and submittedToFinance should be null
              canSubmit = t.currentHolder === 'province_agent' && !t.submittedToFinance;
              isSubmitted = !!t.submittedToFinance;
              console.log(`Transaction ${t._id} - currentHolder: ${t.currentHolder}, submittedToFinance: ${t.submittedToFinance}, canSubmit: ${canSubmit}`);
            } else {
              // Fallback: include all
              canSubmit = true;
            }
            
            allAvailableTransactions.push({ id: t._id, amount, submitted: isSubmitted });
            
            if (canSubmit) {
              transactionIds.push(t._id);
              notSubmittedAmount += amount;
              notSubmittedCount += 1;
            } else {
              submittedAmount += amount;
              submittedCount += 1;
            }
            
            totalAmount += amount;
            totalTransactionsCount += 1;
          }
        });
      } else {
        // If transactions is not an array, calculate from submission totals
        totalAmount += submission.amount;
        totalTransactionsCount += submission.transactionsCount;
        // Assume all are not submitted if we can't check
        notSubmittedAmount += submission.amount;
        notSubmittedCount += submission.transactionsCount;
      }
    });
    
    console.log('Extracted Transaction IDs (filtered):', transactionIds);
    console.log('Total Amount (filtered):', totalAmount);
    console.log('Total Transactions Count (filtered):', totalTransactionsCount);
    console.log('Submitted Amount:', submittedAmount, 'Count:', submittedCount);
    console.log('Not Submitted Amount:', notSubmittedAmount, 'Count:', notSubmittedCount);

    // For MFY agent, calculate selected amount
    const selectedAmount = collectedTransactions
      .filter(t => selectedTransactions.includes(t._id))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // For Tuman/Viloyat agents, calculate selected amount from available transactions
    const selectedAmountTumanViloyat = allAvailableTransactions
      .filter(t => selectedTransactions.includes(t.id) && !t.submitted)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const finalSelectedAmount = role === 'mfy' ? selectedAmount : selectedAmountTumanViloyat;
    
    console.log('Selected Amount:', finalSelectedAmount);

    const handleSelectAll = () => {
      if (role === 'mfy') {
        if (selectedTransactions.length === collectedTransactions.length) {
          setSelectedTransactions([]);
        } else {
          setSelectedTransactions(collectedTransactions.map(t => t._id));
        }
      } else if (role === 'tuman' || role === 'viloyat') {
        // For tuman/viloyat: select all not-submitted transactions
        const notSubmittedIds = allAvailableTransactions
          .filter(t => !t.submitted)
          .map(t => t.id);
        
        if (selectedTransactions.length === notSubmittedIds.length && notSubmittedIds.length > 0) {
          setSelectedTransactions([]);
        } else {
          setSelectedTransactions(notSubmittedIds);
        }
      }
    };

    const isAllSelected = role === 'mfy' 
      ? selectedTransactions.length === collectedTransactions.length && collectedTransactions.length > 0
      : (role === 'tuman' || role === 'viloyat')
      ? selectedTransactions.length === notSubmittedCount && notSubmittedCount > 0
      : false;

    return (
      <View style={styles.content}>
        <View style={styles.headerActions}>
          {/* Summary row showing selected/submitted count */}
          <View style={styles.headerSummaryRow}>
            <Text style={styles.summaryInfo}>
              {role === 'mfy' 
                ? `Tanlangan: ${selectedTransactions.length} / ${collectedTransactions.length}`
                : `Tanlangan: ${selectedTransactions.length} / ${notSubmittedCount} (Jami: ${totalTransactionsCount})`}
            </Text>
            {(role === 'mfy' && collectedTransactions.length > 0) || 
             ((role === 'tuman' || role === 'viloyat') && notSubmittedCount > 0) ? (
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Ionicons 
                  name={isAllSelected ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.selectAllText}>
                  {isAllSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Summary amounts for Tuman/Viloyat */}
          {(role === 'tuman' || role === 'viloyat') && totalTransactionsCount > 0 && (
            <View style={styles.amountSummaryContainer}>
              <View style={styles.amountSummaryRow}>
                <Text style={styles.amountSummaryLabel}>Topshirilmagan:</Text>
                <Text style={[styles.amountSummaryValue, { color: '#FF9500' }]}>
                  {formatCurrency(notSubmittedAmount)} ({notSubmittedCount} ta)
                </Text>
              </View>
              {submittedCount > 0 && (
                <View style={styles.amountSummaryRow}>
                  <Text style={styles.amountSummaryLabel}>Topshirilgan:</Text>
                  <Text style={[styles.amountSummaryValue, { color: '#34C759' }]}>
                    {formatCurrency(submittedAmount)} ({submittedCount} ta)
                  </Text>
                </View>
              )}
              <View style={[styles.amountSummaryRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#eee' }]}>
                <Text style={[styles.amountSummaryLabel, { fontWeight: 'bold' }]}>Jami:</Text>
                <Text style={[styles.amountSummaryValue, { fontWeight: 'bold', color: '#007AFF' }]}>
                  {formatCurrency(totalAmount)} ({totalTransactionsCount} ta)
                </Text>
              </View>
            </View>
          )}
          
          {selectedTransactions.length > 0 && (
            <View style={styles.selectedAmountRow}>
              <Text style={styles.selectedAmountLabel}>Tanlangan summa:</Text>
              <Text style={styles.selectedAmountValue}>{formatCurrency(finalSelectedAmount)}</Text>
            </View>
          )}

          {(() => {
            const shouldShowMFY = role === 'mfy' && selectedTransactions.length > 0;
            const shouldShowTumanViloyat = (role === 'tuman' || role === 'viloyat') && transactionIds.length > 0;
            const shouldShow = shouldShowMFY || shouldShowTumanViloyat;
            
            console.log('=== Submit Button Visibility Check ===');
            console.log('Role:', role);
            console.log('shouldShowMFY:', shouldShowMFY);
            console.log('shouldShowTumanViloyat:', shouldShowTumanViloyat);
            console.log('shouldShow:', shouldShow);
            console.log('selectedTransactions.length:', selectedTransactions.length);
            console.log('transactionIds.length:', transactionIds.length);
            
            return shouldShow ? (
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={() => {
                  console.log('Submit button pressed');
                  if (role === 'mfy') {
                    console.log('Calling handleSubmitToDistrict with selectedTransactions:', selectedTransactions);
                    handleSubmitToDistrict();
                  } else if (role === 'tuman') {
                    console.log('Calling handleSubmitToProvince with transactionIds:', transactionIds);
                    handleSubmitToProvince(transactionIds);
                  } else if (role === 'viloyat') {
                    console.log('Calling handleSubmitToFinance with transactionIds:', transactionIds);
                    handleSubmitToFinance(transactionIds);
                  }
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      {role === 'mfy' 
                        ? `Tuman agentga topshirish (${selectedTransactions.length} ta)`
                        : role === 'tuman'
                        ? `Viloyat agentga topshirish (${transactionIds.length} ta)`
                        : `Moliya bo'limiga topshirish (${transactionIds.length} ta)`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null;
          })()}
        </View>

        {role === 'mfy' ? (
          <FlatList
            data={collectedTransactions}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.paymentCard,
                  selectedTransactions.includes(item._id) && styles.paymentCardSelected,
                ]}
                onPress={() => toggleTransactionSelection(item._id)}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentOrder}>
                      {(() => {
                        if (typeof item.order === 'object' && item.order && 'orderNumber' in item.order) {
                          return `#${item.order.orderNumber}`;
                        }
                        if (typeof item.order === 'string') {
                          const cachedOrder = ordersCache[item.order];
                          if (cachedOrder?.orderNumber) {
                            return `#${cachedOrder.orderNumber}`;
                          }
                          return `Order: ${item.order.substring(0, 8)}...`;
                        }
                        return 'N/A';
                      })()}
                    </Text>
                    <Text style={styles.paymentUser}>
                      {(() => {
                        if (typeof item.user === 'object' && item.user && 'name' in item.user) {
                          return item.user.name;
                        }
                        if (typeof item.user === 'string') {
                          const cachedUser = usersCache[item.user];
                          if (cachedUser?.name) {
                            return cachedUser.name;
                          }
                          // Try to get from order cache
                          const orderId = typeof item.order === 'string' ? item.order : item.order?._id;
                          const cachedOrder = orderId ? ordersCache[orderId] : null;
                          if (cachedOrder?.user?.name) {
                            return cachedOrder.user.name;
                          }
                          return 'Noma\'lum';
                        }
                        return 'Noma\'lum';
                      })()}
                    </Text>
                    <Text style={styles.paymentPhone}>
                      {(() => {
                        if (typeof item.user === 'object' && item.user && 'phone' in item.user) {
                          return item.user.phone;
                        }
                        if (typeof item.user === 'string') {
                          const cachedUser = usersCache[item.user];
                          if (cachedUser?.phone) {
                            return cachedUser.phone;
                          }
                          // Try to get from order cache
                          const orderId = typeof item.order === 'string' ? item.order : item.order?._id;
                          const cachedOrder = orderId ? ordersCache[orderId] : null;
                          if (cachedOrder?.user?.phone) {
                            return cachedOrder.user.phone;
                          }
                          return '';
                        }
                        return '';
                      })()}
                    </Text>
                  </View>
                  <View style={styles.paymentAmountContainer}>
                    <Text style={styles.paymentAmount}>{formatCurrency(item.amount || 0)}</Text>
                    {selectedTransactions.includes(item._id) && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </View>
                </View>
                <View style={styles.paymentActions}>
                  <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={[styles.statusText, { color: '#2E7D32' }]}>Qabul qilingan</Text>
                  </View>
                  <Text style={styles.paymentMethod}>
                    {item.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                  </Text>
                </View>
                {item.collectedAt && (
                  <Text style={styles.collectedDate}>
                    Qabul qilingan: {new Date(item.collectedAt).toLocaleString('uz-UZ')}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Qabul qilingan to'lovlar yo'q</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={confirmedSubmissions}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              transactionIds.length > 0 ? (
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryHeaderText}>
                    Topshirish mumkin: {totalTransactionsCount} ta transaksiya, {formatCurrency(totalAmount)}
                  </Text>
                </View>
              ) : confirmedSubmissions.length > 0 ? (
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryHeaderText}>
                    Barcha tasdiqlangan: {confirmedSubmissions.reduce((sum, s) => sum + s.transactionsCount, 0)} ta transaksiya
                  </Text>
                  <Text style={[styles.summaryHeaderText, { color: '#FF9500', marginTop: 4 }]}>
                    Topshirish mumkin: {totalTransactionsCount} ta transaksiya
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              // Get all transactions from this submission
              const allTransactions = Array.isArray(item.transactions) ? item.transactions : [];
              
              // Separate submitted and not submitted transactions
              const notSubmittedTransactions = allTransactions.filter((t: any) => {
                if (typeof t === 'string') return transactionIds.includes(t);
                if (t && typeof t === 'object' && t._id) {
                  if (role === 'tuman') {
                    return t.currentHolder === 'district_agent' && !t.submittedToProvince;
                  } else if (role === 'viloyat') {
                    return t.currentHolder === 'province_agent' && !t.submittedToFinance;
                  }
                  return transactionIds.includes(t._id);
                }
                return false;
              });
              
              const submittedTransactions = allTransactions.filter((t: any) => {
                if (typeof t === 'string') return !transactionIds.includes(t);
                if (t && typeof t === 'object' && t._id) {
                  if (role === 'tuman') {
                    return t.submittedToProvince;
                  } else if (role === 'viloyat') {
                    return t.submittedToFinance;
                  }
                  return !transactionIds.includes(t._id);
                }
                return false;
              });
              
              const availableCount = notSubmittedTransactions.length;
              const availableAmount = notSubmittedTransactions.reduce((sum: number, t: any) => {
                if (typeof t === 'object' && t.amount) return sum + t.amount;
                return sum;
              }, 0);
              
              const submittedCount = submittedTransactions.length;
              const submittedAmountFromItem = submittedTransactions.reduce((sum: number, t: any) => {
                if (typeof t === 'object' && t.amount) return sum + t.amount;
                return sum;
              }, 0);
              
              // Get selected count from this submission
              const selectedFromThisSubmission = notSubmittedTransactions.filter((t: any) => {
                const id = typeof t === 'string' ? t : (t?._id);
                return id && selectedTransactions.includes(id);
              }).length;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.submissionCard,
                    selectedFromThisSubmission > 0 && styles.submissionCardSelected
                  ]}
                  onPress={() => {
                    // Toggle selection for all not-submitted transactions in this submission
                    const notSubmittedIds = notSubmittedTransactions.map((t: any) => 
                      typeof t === 'string' ? t : (t?._id)
                    ).filter(Boolean);
                    
                    const allSelected = notSubmittedIds.every((id: string) => 
                      selectedTransactions.includes(id)
                    );
                    
                    if (allSelected) {
                      // Deselect all
                      setSelectedTransactions(prev => 
                        prev.filter(id => !notSubmittedIds.includes(id))
                      );
                    } else {
                      // Select all
                      setSelectedTransactions(prev => {
                        const newIds = notSubmittedIds.filter((id: string) => !prev.includes(id));
                        return [...prev, ...newIds];
                      });
                    }
                  }}
                >
                  <View style={styles.submissionHeader}>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionAgent}>{item.fromAgent?.name || 'Noma\'lum'}</Text>
                      <Text style={styles.submissionPhone}>{item.fromAgent?.phone || ''}</Text>
                      <Text style={styles.submissionDate}>
                        {new Date(item.submissionDate).toLocaleString('uz-UZ')}
                      </Text>
                    </View>
                    <View style={styles.submissionHeaderRight}>
                      <View style={[styles.statusBadge, { backgroundColor: '#34C759' }]}>
                        <Text style={styles.statusText}>Tasdiqlangan</Text>
                      </View>
                      {selectedFromThisSubmission > 0 && (
                        <Ionicons name="checkmark-circle" size={24} color="#34C759" style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </View>
                  <View style={styles.submissionDetails}>
                    <View style={styles.submissionAmountRow}>
                      <Text style={styles.submissionAmount}>{formatCurrency(item.amount)}</Text>
                      <Text style={styles.submissionCount}>{item.transactionsCount} ta transaksiya</Text>
                    </View>
                    
                    {availableCount > 0 && (
                      <View style={styles.transactionStatusRow}>
                        <View style={[styles.statusIndicator, { backgroundColor: '#FF9500' }]}>
                          <Text style={styles.statusIndicatorText}>
                            Topshirilmagan: {availableCount} ta ({formatCurrency(availableAmount)})
                          </Text>
                        </View>
                        {selectedFromThisSubmission > 0 && (
                          <Text style={[styles.selectedCountText, { color: '#007AFF' }]}>
                            Tanlangan: {selectedFromThisSubmission}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {submittedCount > 0 && (
                      <View style={styles.transactionStatusRow}>
                        <View style={[styles.statusIndicator, { backgroundColor: '#E8F5E9' }]}>
                          <Text style={[styles.statusIndicatorText, { color: '#2E7D32' }]}>
                            Topshirilgan: {submittedCount} ta ({formatCurrency(submittedAmountFromItem)})
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMethodLabel}>Naqd: {formatCurrency(item.cashAmount)}</Text>
                      <Text style={styles.paymentMethodLabel}>Karta: {formatCurrency(item.cardAmount)}</Text>
                    </View>
                    {item.confirmedAt && (
                      <Text style={styles.confirmedDate}>
                        Tasdiqlangan: {new Date(item.confirmedAt).toLocaleString('uz-UZ')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Tasdiqlangan topshiruvlar yo'q</Text>
              </View>
            }
          />
        )}
      </View>
    );
  };

  const renderDistrictReport = () => {
    if (!districtReport) return null;

    return (
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tuman hisoboti</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Topshiruvlar</Text>
              <Text style={styles.summaryValue}>{districtReport.submissionsCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Qabul qilingan</Text>
              <Text style={[styles.summaryValue, styles.successText]}>{formatCurrency(districtReport.totalReceived)}</Text>
            </View>
          </View>
          {districtReport.pendingAmount > 0 && (
            <View style={styles.pendingBadge}>
              <Ionicons name="alert-circle" size={16} color="#FF9500" />
              <Text style={styles.pendingText}>Kutilayotgan: {formatCurrency(districtReport.pendingAmount)}</Text>
            </View>
          )}
        </View>

        {districtReport.submissions && districtReport.submissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MFY agentlardan kelgan topshiruvlar</Text>
            {districtReport.submissions.map((submission: FinanceSubmission) => (
              <View key={submission._id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View>
                    <Text style={styles.submissionAgent}>{submission.fromAgent.name}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(submission.submissionDate).toLocaleString('uz-UZ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
                  </View>
                </View>
                <Text style={styles.submissionAmount}>{formatCurrency(submission.amount)}</Text>
                <Text style={styles.submissionCount}>{submission.transactionsCount} ta transaksiya</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderProvinceReport = () => {
    if (!provinceReport) return null;

    return (
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Viloyat hisoboti</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Topshiruvlar</Text>
              <Text style={styles.summaryValue}>{provinceReport.submissionsCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Qabul qilingan</Text>
              <Text style={[styles.summaryValue, styles.successText]}>{formatCurrency(provinceReport.totalReceived)}</Text>
            </View>
          </View>
          {provinceReport.pendingAmount > 0 && (
            <View style={styles.pendingBadge}>
              <Ionicons name="alert-circle" size={16} color="#FF9500" />
              <Text style={styles.pendingText}>Kutilayotgan: {formatCurrency(provinceReport.pendingAmount)}</Text>
            </View>
          )}
        </View>

        {provinceReport.submissions && provinceReport.submissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tuman agentlardan kelgan topshiruvlar</Text>
            {provinceReport.submissions.map((submission: FinanceSubmission) => (
              <View key={submission._id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View>
                    <Text style={styles.submissionAgent}>{submission.fromAgent.name}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(submission.submissionDate).toLocaleString('uz-UZ')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
                  </View>
                </View>
                <Text style={styles.submissionAmount}>{formatCurrency(submission.amount)}</Text>
                <Text style={styles.submissionCount}>{submission.transactionsCount} ta transaksiya</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSubmissions = () => {
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const selectedSubmissionsAmount = pendingSubmissions
      .filter(s => selectedTransactions.includes(s._id))
      .reduce((sum, s) => sum + s.amount, 0);
    
    const handleSelectAllSubmissions = () => {
      if (selectedTransactions.length === pendingSubmissions.length && pendingSubmissions.length > 0) {
        setSelectedTransactions([]);
      } else {
        setSelectedTransactions(pendingSubmissions.map(s => s._id));
      }
    };
    
    const isAllSubmissionsSelected = selectedTransactions.length === pendingSubmissions.length && pendingSubmissions.length > 0;
    
    const handleConfirmSelected = async () => {
      if (selectedTransactions.length === 0) {
        Alert.alert('Xatolik', 'Hech qanday topshiruv tanlanmagan');
        return;
      }
      
      Alert.alert(
        'Topshiruvlarni tasdiqlash',
        `${selectedTransactions.length} ta topshiruvni tasdiqlashni xohlaysizmi?`,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          {
            text: 'Tasdiqlash',
            onPress: async () => {
              setSubmitting(true);
              try {
                // Confirm all selected submissions
                for (const submissionId of selectedTransactions) {
                  if (role === 'tuman') {
                    await apiService.confirmDistrictSubmission(submissionId);
                  } else if (role === 'viloyat') {
                    await apiService.confirmProvinceSubmission(submissionId);
                  }
                }
                Alert.alert('Muvaffaqiyat', 'Barcha topshiruvlar tasdiqlandi');
                setSelectedTransactions([]);
                loadData();
              } catch (error: any) {
                Alert.alert('Xatolik', error.response?.data?.message || 'Topshiruvlarni tasdiqlashda xatolik');
              } finally {
                setSubmitting(false);
              }
            },
          },
        ]
      );
    };
    
    return (
      <View style={styles.content}>
        <View style={styles.headerActions}>
          <View style={styles.headerSummaryRow}>
            <Text style={styles.summaryInfo}>
              Tanlangan: {selectedTransactions.length} / {pendingSubmissions.length}
            </Text>
            {pendingSubmissions.length > 0 && (
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAllSubmissions}
              >
                <Ionicons 
                  name={isAllSubmissionsSelected ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={styles.selectAllText}>
                  {isAllSubmissionsSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {selectedTransactions.length > 0 && (
            <>
              <View style={styles.selectedAmountRow}>
                <Text style={styles.selectedAmountLabel}>Tanlangan summa:</Text>
                <Text style={styles.selectedAmountValue}>{formatCurrency(selectedSubmissionsAmount)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleConfirmSelected}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      Tasdiqlash ({selectedTransactions.length} ta)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <FlatList
          data={submissions}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isSelected = item.status === 'pending' && selectedTransactions.includes(item._id);
            
            return (
              <TouchableOpacity
                style={[
                  styles.submissionCard,
                  isSelected && styles.submissionCardSelected,
                ]}
                onPress={() => {
                  if (item.status === 'pending') {
                    if (isSelected) {
                      setSelectedTransactions(prev => prev.filter(id => id !== item._id));
                    } else {
                      setSelectedTransactions(prev => [...prev, item._id]);
                    }
                  }
                }}
              >
                <View style={styles.submissionHeader}>
                  <View>
                    <Text style={styles.submissionAgent}>{item.fromAgent?.name || 'Noma\'lum'}</Text>
                    <Text style={styles.submissionPhone}>{item.fromAgent?.phone || ''}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(item.submissionDate).toLocaleString('uz-UZ')}
                    </Text>
                  </View>
                  <View style={styles.submissionHeaderRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                </View>
                <View style={styles.submissionDetails}>
                  <Text style={styles.submissionAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.submissionCount}>{item.transactionsCount} ta transaksiya</Text>
                  <View style={styles.paymentMethodRow}>
                    <Text style={styles.paymentMethodLabel}>Naqd: {formatCurrency(item.cashAmount)}</Text>
                    <Text style={styles.paymentMethodLabel}>Karta: {formatCurrency(item.cardAmount)}</Text>
                  </View>
                </View>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.confirmButton, confirming === item._id && styles.confirmButtonDisabled]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleConfirmSubmission(item._id);
                    }}
                    disabled={confirming === item._id}
                  >
                    {confirming === item._id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Tasdiqlash</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Topshiruvlar yo'q</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderStatistics = () => {
    if (!statistics) {
      return (
        <View style={styles.content}>
          <View style={styles.dateRangeSelector}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStatDatePicker('start')}
            >
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {statStartDate ? formatDate(statStartDate) : 'Boshlanish sanasi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStatDatePicker('end')}
            >
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {statEndDate ? formatDate(statEndDate) : 'Tugash sanasi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loadButton}
              onPress={loadData}
            >
              <Text style={styles.loadButtonText}>Yuklash</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.dateRangeSelector}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStatDatePicker('start')}
          >
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {statStartDate ? formatDate(statStartDate) : 'Boshlanish sanasi'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStatDatePicker('end')}
          >
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {statEndDate ? formatDate(statEndDate) : 'Tugash sanasi'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loadButton}
            onPress={loadData}
          >
            <Text style={styles.loadButtonText}>Yuklash</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Statistika</Text>
          {statistics.period && (
            <Text style={styles.periodText}>
              {formatDate(new Date(statistics.period.startDate))} - {formatDate(new Date(statistics.period.endDate))}
            </Text>
          )}
          
          {role === 'mfy' && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Jami buyurtmalar</Text>
                  <Text style={styles.summaryValue}>{statistics.totalOrders}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Jami summa</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(statistics.totalAmount)}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Qabul qilingan</Text>
                  <Text style={[styles.summaryValue, styles.successText]}>{formatCurrency(statistics.collectedAmount)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Topshirilgan</Text>
                  <Text style={[styles.summaryValue, styles.infoText]}>{formatCurrency(statistics.submittedAmount)}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Naqd</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(statistics.cashAmount)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Karta</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(statistics.cardAmount)}</Text>
                </View>
              </View>
            </>
          )}

          {(role === 'tuman' || role === 'viloyat') && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Topshiruvlar</Text>
                  <Text style={styles.summaryValue}>{statistics.submissionsCount}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Qabul qilingan</Text>
                  <Text style={[styles.summaryValue, styles.successText]}>{formatCurrency(statistics.totalReceived)}</Text>
                </View>
              </View>
              {statistics.pendingAmount > 0 && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="alert-circle" size={16} color="#FF9500" />
                  <Text style={styles.pendingText}>Kutilayotgan: {formatCurrency(statistics.pendingAmount)}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlangan',
      rejected: 'Rad etilgan',
      collected: 'Qabul qilingan',
      submitted: 'Topshirilgan',
    };
    return statusMap[status] || status;
  };

  const renderContent = () => {
    if (loading && activeTab === 'report') {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    switch (activeTab) {
      case 'report':
        if (role === 'mfy') return renderMFYReport();
        if (role === 'tuman') return renderDistrictReport();
        if (role === 'viloyat') return renderProvinceReport();
        return null;
      case 'pending':
        if (role === 'mfy') return renderPendingPayments();
        return null;
      case 'collected':
        return renderCollectedTransactions();
      case 'submissions':
        if (role === 'tuman' || role === 'viloyat') return renderSubmissions();
        return null;
      case 'statistics':
        return renderStatistics();
      default:
        return null;
    }
  };

  if (!role || (role !== 'mfy' && role !== 'tuman' && role !== 'viloyat')) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Bu sahifa faqat agentlar uchun</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          {getTabs().map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconContainer, activeTab === tab.key && styles.tabIconContainerActive]}>
                <Ionicons
                  name={tab.icon as any}
                  size={22}
                  color={activeTab === tab.key ? '#007AFF' : '#999'}
                />
              </View>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Statistics Date Pickers */}
      {showStatDatePicker && (
        <DateTimePicker
          value={showStatDatePicker === 'start' ? (statStartDate || new Date()) : (statEndDate || new Date())}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStatDatePicker(null);
            if (date) {
              if (showStatDatePicker === 'start') {
                setStatStartDate(date);
              } else {
                setStatEndDate(date);
              }
            }
          }}
          maximumDate={new Date()}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 12,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    position: 'relative',
    minHeight: 60,
  },
  tabActive: {
    backgroundColor: '#F0F8FF',
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  tabIconContainerActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  dateSelector: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dateRangeSelector: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  loadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  periodText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  successText: {
    color: '#34C759',
  },
  infoText: {
    color: '#007AFF',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionOrder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionMethod: {
    fontSize: 12,
    color: '#666',
  },
  transactionStatus: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  headerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  selectedAmountLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedAmountValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  summaryHeader: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryHeaderText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentOrder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentUser: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  paymentPhone: {
    fontSize: 12,
    color: '#666',
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  collectButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paymentMethodLabel: {
    fontSize: 12,
    color: '#666',
  },
  submissionCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionInfo: {
    flex: 1,
  },
  submissionCardSelected: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  submissionAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9500',
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  amountSummaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  amountSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountSummaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  amountSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  collectedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submissionAgent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  submissionPhone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    color: '#999',
  },
  submissionDetails: {
    marginBottom: 12,
  },
  submissionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  submissionCount: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

