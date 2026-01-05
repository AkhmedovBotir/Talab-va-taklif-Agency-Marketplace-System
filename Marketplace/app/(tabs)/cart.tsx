import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CartItem } from '../../services/api';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { cart, isLoading, refreshCart, updateCartItem, removeFromCart, clearCart } = useCart();
  const { unreadCount } = useNotification();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  }, [refreshCart]);

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }

    if (newQuantity > item.product.quantity) {
      Alert.alert('Xatolik', `Mavjud miqdor: ${item.product.quantity}. Siz ${newQuantity} ta so'rayapsiz`);
      return;
    }

    try {
      await updateCartItem(item.product._id, newQuantity);
    } catch (error) {
      // Error is already shown in context
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'O\'chirish',
      `${item.product.name} korzinkadan o'chirilsinmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(item.product._id);
            } catch (error) {
              // Error is already shown in context
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (!cart || cart.items.length === 0) {
      return;
    }

    Alert.alert(
      'Korzinkani tozalash',
      'Barcha mahsulotlar korzinkadan o\'chirilsinmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tozalash',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
            } catch (error) {
              // Error is already shown in context
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header
          title="Korzinka"
          onNotificationPress={handleNotificationPress}
          unreadCount={unreadCount}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Korzinkaga qo'shish uchun tizimga kiring</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !cart) {
    return (
      <View style={styles.container}>
        <Header
          title="Korzinka"
          onNotificationPress={handleNotificationPress}
          unreadCount={unreadCount}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          title="Korzinka"
          onNotificationPress={handleNotificationPress}
          unreadCount={unreadCount}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Korzinka bo'sh</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.shopButtonText}>Xarid qilishni boshlash</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => {
    const imageUri = item.product.images && item.product.images.length > 0
      ? item.product.images[0]
      : undefined;

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={styles.itemImageContainer}
          onPress={() => router.push(`/product/${item.product._id}` as any)}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.itemContent}>
          <TouchableOpacity
            onPress={() => router.push(`/product/${item.product._id}` as any)}
            style={styles.itemHeader}
          >
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveItem(item)}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color="#999" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.itemPriceContainer}>
            <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
            {item.product.originalPrice > item.product.price && (
              <Text style={styles.itemOriginalPrice}>
                {formatPrice(item.product.originalPrice)}
              </Text>
            )}
          </View>
          <Text style={styles.availableQuantity}>
            Mavjud: {item.product.quantity}
          </Text>

          <View style={styles.itemQuantityContainer}>
            <Text style={styles.quantityLabel}>Miqdor:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={item.quantity <= 1 ? '#ccc' : '#007AFF'}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item, item.quantity + 1)}
                disabled={item.quantity >= item.product.quantity}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={item.quantity >= item.product.quantity ? '#ccc' : '#007AFF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Korzinka"
        rightButton={
          cart.items.length > 0 ? (
            <TouchableOpacity
              style={styles.headerClearButton}
              onPress={handleClearCart}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          )
        }
      />

      <FlatList
        data={cart.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Summary Bar */}
      <View
        style={[
          styles.summaryBar,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Jami mahsulotlar:</Text>
            <Text style={styles.summaryValue}>{cart.totalItems} ta</Text>
          </View>
          {cart.totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chegirma:</Text>
              <Text style={styles.discountValue}>
                -{formatPrice(cart.totalDiscount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Umumiy:</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.totalPrice)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout' as any)}
        >
          <Text style={styles.checkoutButtonText}>Buyurtma berish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerClearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shopButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemOriginalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  availableQuantity: {
    fontSize: 12,
    color: 'red',
  },
  summaryBar: {
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
  summaryContent: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
