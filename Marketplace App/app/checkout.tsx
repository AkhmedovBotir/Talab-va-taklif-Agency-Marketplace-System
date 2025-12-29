import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import RegionPicker from '../components/ui/RegionPicker';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import apiService, { Region } from '../services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user, logout } = useAuth();
  const { cart, refreshCart } = useCart();
  const { showSuccess, showError } = useSnackbar();

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [formData, setFormData] = useState({
    paymentMethod: 'cash' as 'cash',
    deliveryViloyat: '',
    deliveryViloyatId: '',
    deliveryTuman: '',
    deliveryTumanId: '',
    deliveryMfy: '',
    deliveryMfyId: '',
    deliveryNote: '',
    phoneNumber: user?.phone || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user?.phone) {
      setFormData((prev) => ({ ...prev, phoneNumber: user.phone }));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        deliveryViloyat: profile.viloyat?.name || '',
        deliveryViloyatId: profile.viloyat?._id || '',
        deliveryTuman: profile.tuman?.name || '',
        deliveryTumanId: profile.tuman?._id || '',
        deliveryMfy: profile.mfy?.name || '',
        deliveryMfyId: profile.mfy?._id || '',
      }));
    }
  }, [profile]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const response = await apiService.getProfile(token);
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Only check cart on initial load, not after order creation
    if (!orderCreated && (!cart || cart.items.length === 0)) {
      showError('Korzinka bo\'sh');
      setTimeout(() => router.back(), 1500);
    }
  }, [cart, orderCreated]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Use profile address if formData is empty
    const viloyatId = formData.deliveryViloyatId || profile?.viloyat?._id || '';
    const tumanId = formData.deliveryTumanId || profile?.tuman?._id || '';
    const mfyId = formData.deliveryMfyId || profile?.mfy?._id || '';

    console.log('Viloyat ID', viloyatId);
    console.log('Tuman ID', tumanId);
    console.log('MFY ID', mfyId);

    if (!viloyatId) {
      newErrors.deliveryViloyat = 'Viloyat tanlanishi shart';
    }

    if (formData.deliveryNote && formData.deliveryNote.length > 1000) {
      newErrors.deliveryNote = 'Eslatma 1000 ta belgidan oshmasligi kerak';
    }

    setErrors(newErrors);
    
    console.log('Validatsiya xatosi', newErrors);

    
    return Object.keys(newErrors).length === 0;
  };

  console.log('Errors', errors);

  const handleCreateOrder = async () => {
    console.log('handleCreateOrder called');
    console.log('Token:', token ? 'exists' : 'missing');
    console.log('Cart:', cart ? 'exists' : 'missing');

    if (!token || !cart) {
      console.log('Missing token or cart');
      return;
    }

    const isValid = validateForm();
    console.log('Validation result:', isValid);
    if (!isValid) {
      console.log('Validation failed');
      // Scroll to first error
      return;
    }

    console.log('Starting order creation...');

    try {
      setLoading(true);
      
      // Use profile address if formData is empty
      const viloyatId = formData.deliveryViloyatId || profile?.viloyat?._id || '';
      const tumanId = formData.deliveryTumanId || profile?.tuman?._id || '';
      const mfyId = formData.deliveryMfyId || profile?.mfy?._id || '';

      const orderData: any = {
        paymentMethod: formData.paymentMethod,
        deliveryViloyat: viloyatId,
        deliveryNote: formData.deliveryNote.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        clearCart: true,
      };

      if (tumanId) {
        orderData.deliveryTuman = tumanId;
      }
      if (mfyId) {
        orderData.deliveryMfy = mfyId;
      }

      console.log('Order Data:', JSON.stringify(orderData, null, 2));

      const response = await apiService.createOrder(orderData, token);

      console.log('Order Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        setOrderCreated(true);
        await refreshCart();
        showSuccess('Buyurtma muvaffaqiyatli yaratildi', 2000, {
          label: 'Ko\'rish',
          onPress: () => {
            router.replace(`/order/${response.data._id}` as any);
          },
        });
        setTimeout(() => {
          router.replace(`/order/${response.data._id}` as any);
        }, 2000);
      } else {
        console.error('Order creation failed:', response);
        showError(response.message || 'Buyurtma yaratishda xatolik yuz berdi');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // 401 error is handled globally in API service and layout
      // Just show error message
      showError(error.message || 'Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (!orderCreated && (!cart || cart.items.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtma berish</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Korzinka bo'sh</Text>
        </View>
      </View>
    );
  }

  // Show loading if order was created and we're navigating
  if (orderCreated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtma berish</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Buyurtma yaratilmoqda...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma berish</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma ma'lumotlari</Text>
          <View style={styles.summaryCard}>
            {cart?.items.map((item) => (
              <View key={item.product._id} style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <Text style={styles.summaryItemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.summaryItemQuantity}>
                    {item.quantity} ta × {formatPrice(item.product.price)}
                  </Text>
                </View>
                <Text style={styles.summaryItemPrice}>
                  {formatPrice(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>Jami:</Text>
              <Text style={styles.summaryTotalValue}>
                {formatPrice(cart?.totalPrice || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To'lov usuli</Text>
          <View style={styles.paymentMethod}>
            <Ionicons
              name="cash-outline"
              size={24}
              color="#007AFF"
            />
            <Text style={styles.paymentMethodText}>
              Naqd pul
            </Text>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
          <RegionPicker
            label="Viloyat"
            value={formData.deliveryViloyatId}
            displayValue={formData.deliveryViloyat}
            type="region"
            onSelect={(region: Region) => {
              setFormData({
                ...formData,
                deliveryViloyat: region.name,
                deliveryViloyatId: region._id,
                deliveryTuman: '',
                deliveryTumanId: '',
                deliveryMfy: '',
                deliveryMfyId: '',
              });
              if (errors.deliveryViloyat) {
                setErrors({ ...errors, deliveryViloyat: '' });
              }
            }}
            error={errors.deliveryViloyat}
          />

          <RegionPicker
            label="Tuman (ixtiyoriy)"
            value={formData.deliveryTumanId}
            displayValue={formData.deliveryTuman}
            type="district"
            parentId={formData.deliveryViloyatId}
            onSelect={(region: Region) => {
              setFormData({
                ...formData,
                deliveryTuman: region.name,
                deliveryTumanId: region._id,
                deliveryMfy: '',
                deliveryMfyId: '',
              });
            }}
            disabled={!formData.deliveryViloyatId}
          />

          <RegionPicker
            label="MFY (ixtiyoriy)"
            value={formData.deliveryMfyId}
            displayValue={formData.deliveryMfy}
            type="mfy"
            parentId={formData.deliveryTumanId}
            onSelect={(region: Region) => {
              setFormData({
                ...formData,
                deliveryMfy: region.name,
                deliveryMfyId: region._id,
              });
            }}
            disabled={!formData.deliveryTumanId}
          />
        </View>

        {/* Delivery Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qo'shimcha eslatma (ixtiyoriy)</Text>
          <Input
            label="Eslatma"
            value={formData.deliveryNote}
            onChangeText={(text) => {
              setFormData({ ...formData, deliveryNote: text });
              if (errors.deliveryNote) {
                setErrors({ ...errors, deliveryNote: '' });
              }
            }}
            error={errors.deliveryNote}
            placeholder="Masalan: Uy eshigiga qo'ng'iroq qiling"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Telefon raqami</Text>
          <Input
            label="Telefon"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            placeholder="+998901234567"
            keyboardType="phone-pad"
          />
          <Text style={styles.helperText}>
            Agar kiritmasangiz, profil telefon raqamingiz ishlatiladi
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomBarLabel}>Umumiy summa</Text>
            <Text style={styles.bottomBarValue}>
              {formatPrice(cart?.totalPrice || 0)}
            </Text>
          </View>
          <Button
            title="Buyurtma berish"
            onPress={handleCreateOrder}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  summaryItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summaryItemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e5e7',
    marginVertical: 12,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bottomBarValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    flex: 1,
    marginLeft: 16,
    maxWidth: 200,
  },
});

