import Icon from './Icon';
import { Product } from '../../services/api';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCart?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  isInCart = false,
}: ProductCardProps) {
  const imageUri = product.images?.[0];

  return (
    <div
      className="productCard"
      onClick={() => onPress(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPress(product)}
    >
      {imageUri ? (
        <img src={imageUri} alt="" className="productCardImage" />
      ) : (
        <div className="productCardImagePlaceholder">
          <Icon name="image-outline" size={48} color="#ccc" />
        </div>
      )}
      <div className="productCardContent">
        <div className="productCardName">{product.name}</div>
        <div className="productCardPrice">{formatPrice(product.price)}</div>
        <div className="productCardQuantity">
          <Icon name="cube-outline" size={14} color="#666" />
          <span>
            {product.quantity} {product.unit}
          </span>
        </div>
        <button
          type="button"
          className={`productCardCartBtn ${isInCart ? 'productCardCartBtnActive' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isInCart) onAddToCart(product);
          }}
          disabled={isInCart}
        >
          {isInCart ? (
            <>
              <Icon name="checkmark-circle" size={20} color="#fff" />
              <span>Korzinkada</span>
            </>
          ) : (
            <>
              <Icon name="cart-outline" size={20} color="#fff" />
              <span>Korzinkaga</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
