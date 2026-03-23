import { useEffect, useState, useRef } from 'react';
import Icon from './Icon';

interface ImageCarouselProps {
  images: string[];
  height?: number;
}

export default function ImageCarousel({ images, height = 400 }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div
        className="productCarousel"
        style={{ height }}
      >
        <div className="productCarouselPlaceholder">
          <Icon name="image-outline" size={64} color="#ccc" />
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="productCarousel" style={{ height }}>
        <img
          src={images[0]}
          alt=""
          className="productCarouselImage"
          style={{ height }}
        />
      </div>
    );
  }

  const goPrev = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="productCarousel" style={{ height }}>
      <img
        src={images[index]}
        alt=""
        className="productCarouselImage"
        style={{ height }}
      />
      <button
        type="button"
        className="productCarouselArrow productCarouselArrowLeft"
        onClick={goPrev}
        aria-label="Oldingi rasm"
      >
        <Icon name="chevron-back" size={20} color="#111827" />
      </button>
      <button
        type="button"
        className="productCarouselArrow productCarouselArrowRight"
        onClick={goNext}
        aria-label="Keyingi rasm"
      >
        <Icon name="chevron-forward" size={20} color="#111827" />
      </button>
      <div className="productCarouselDots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={
              i === index
                ? 'productCarouselDot productCarouselDotActive'
                : 'productCarouselDot'
            }
            onClick={() => setIndex(i)}
            aria-label={`Rasm ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

