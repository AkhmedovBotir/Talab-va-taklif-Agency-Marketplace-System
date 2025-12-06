import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../services/api';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const imageUri = product.images && product.images.length > 0 
    ? product.images[0] 
    : undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color="#ccc" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Miqdor:</Text>
            <Text style={styles.infoValue}>
              {product.quantity} {product.unit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kod:</Text>
            <Text style={styles.infoValue}>{product.productCode}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => onPress(product)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={16} color="#333" />
            <Text style={styles.detailButtonText}>Batafsil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => onAddToCart(product)}
            activeOpacity={0.7}
          >
            <Ionicons name="cart" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '48%',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    minHeight: 40,
  },
  priceContainer: {
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cartButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

