import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { createElement, useRef } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  MAX_PRODUCT_IMAGES,
  ProductImageDraft,
  ProductImageUpload,
  assetToProductImageUpload,
  fileToProductImageUpload,
  nextImageDraftKey,
  validateImageUpload,
} from '../utils/productImages';
import { ShowSnackbarOptions } from './AppSnackbar';

type FeedbackFn = (message: string, options?: ShowSnackbarOptions) => void;

type Props = {
  drafts: ProductImageDraft[];
  onChange: (drafts: ProductImageDraft[]) => void;
  maxImages?: number;
  minImages?: number;
  disabled?: boolean;
  hint?: string;
  onFeedback: FeedbackFn;
};

export function ProductImagesField({
  drafts,
  onChange,
  maxImages = MAX_PRODUCT_IMAGES,
  minImages = 1,
  disabled = false,
  hint,
  onFeedback,
}: Props) {
  const webInputRef = useRef<HTMLInputElement | null>(null);

  const addUploads = (uploads: ProductImageUpload[]) => {
    if (uploads.length === 0) return;

    const slotsLeft = maxImages - drafts.length;
    if (slotsLeft <= 0) {
      onFeedback(`Maksimal ${maxImages} ta rasm qo‘shish mumkin.`, {
        title: 'Cheklov',
        variant: 'error',
      });
      return;
    }

    const accepted: ProductImageDraft[] = [];
    for (const upload of uploads.slice(0, slotsLeft)) {
      const err = validateImageUpload(upload);
      if (err) {
        onFeedback(err, { title: 'Rasm xato', variant: 'error' });
        continue;
      }
      accepted.push({
        key: nextImageDraftKey(),
        previewUri: upload.uri,
        upload,
      });
    }

    if (accepted.length === 0) return;
    onChange([...drafts, ...accepted]);
  };

  const pickNative = async () => {
    if (disabled) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        onFeedback('Galereyadan rasm tanlash uchun ruxsat bering.', {
          title: 'Ruxsat kerak',
          variant: 'error',
        });
        return;
      }

      const slotsLeft = maxImages - drafts.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: slotsLeft > 1,
        selectionLimit: slotsLeft,
        quality: 0.85,
        base64: false,
      });

      if (result.canceled || !result.assets?.length) return;
      addUploads(result.assets.map(assetToProductImageUpload));
    } catch (error: unknown) {
      const err = error as { message?: string };
      onFeedback(err.message || 'Rasm tanlashda xatolik.', {
        title: 'Xatolik',
        variant: 'error',
      });
    }
  };

  const pickWeb = () => {
    if (disabled) return;
    webInputRef.current?.click();
  };

  const onWebFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    addUploads(Array.from(files).map(fileToProductImageUpload));
    event.target.value = '';
  };

  const removeAt = (index: number) => {
    if (disabled) return;
    if (drafts.length <= minImages) {
      onFeedback(`Kamida ${minImages} ta rasm qolishi kerak.`, {
        title: 'O‘chirib bo‘lmaydi',
        variant: 'error',
      });
      return;
    }
    onChange(drafts.filter((_, i) => i !== index));
  };

  const canAdd = drafts.length < maxImages && !disabled;

  return (
    <View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Text style={styles.counter}>
        {drafts.length} / {maxImages} ta rasm
      </Text>
      <View style={styles.imagesContainer}>
        {drafts.map((draft, index) => (
          <View key={draft.key} style={styles.imageWrapper}>
            <Image source={{ uri: draft.previewUri }} style={styles.previewImage} />
            {!disabled ? (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeAt(index)}
                accessibilityLabel="Rasmni o‘chirish"
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            ) : null}
            {draft.remote ? (
              <View style={styles.remoteBadge}>
                <Text style={styles.remoteBadgeText}>Saqlangan</Text>
              </View>
            ) : null}
          </View>
        ))}
        {canAdd ? (
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={Platform.OS === 'web' ? pickWeb : pickNative}
          >
            <Ionicons name="add" size={32} color="#007AFF" />
            <Text style={styles.addImageText}>Rasm qo‘shish</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {Platform.OS === 'web'
        ? createElement('input', {
            ref: webInputRef,
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp,image/gif',
            multiple: maxImages - drafts.length > 1,
            style: { display: 'none' },
            onChange: onWebFiles,
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  counter: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'visible',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  remoteBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  remoteBadgeText: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textAlign: 'center',
  },
});
