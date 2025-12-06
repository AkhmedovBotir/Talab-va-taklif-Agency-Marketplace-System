import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { CommentTemplate, CreateReviewRequest } from '../services/api';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
  token: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  orderId,
  productId,
  productName,
  token,
  onSuccess,
}: ReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customComment, setCustomComment] = useState('');
  const [showCustomComment, setShowCustomComment] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTemplates();
      // Reset form
      setRating(0);
      setSelectedTemplateId(null);
      setCustomComment('');
      setShowCustomComment(false);
    }
  }, [visible]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getCommentTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Shablonlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      setShowCustomComment(false);
      setCustomComment('');
    } else {
      const template = templates.find(t => t._id === templateId);
      if (template?.text === 'Boshqa') {
        setShowCustomComment(true);
        setSelectedTemplateId(templateId);
      } else {
        setShowCustomComment(false);
        setCustomComment('');
        setSelectedTemplateId(templateId);
      }
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Xatolik', 'Iltimos, baholashni tanlang');
      return;
    }

    if (!selectedTemplateId && !customComment.trim()) {
      Alert.alert('Xatolik', 'Iltimos, shablon yoki kommentariya kiriting');
      return;
    }

    if (showCustomComment && !customComment.trim()) {
      Alert.alert('Xatolik', 'Iltimos, kommentariya kiriting');
      return;
    }

    try {
      setSubmitting(true);
      const reviewData: CreateReviewRequest = {
        orderId,
        productId,
        rating,
      };

      if (selectedTemplateId && !showCustomComment) {
        reviewData.commentTemplateId = selectedTemplateId;
      } else if (customComment.trim()) {
        reviewData.customComment = customComment.trim();
        reviewData.isPositive = rating >= 4;
      }

      const response = await api.createReview(reviewData, token);
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Baholash muvaffaqiyatli yuborildi');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Baholash yuborishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Baholash</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.productName}>{productName}</Text>

            {/* Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Baholash</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color={star <= rating ? '#FFD700' : '#ccc'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Templates */}
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
            ) : (
              <View style={styles.templatesSection}>
                <Text style={styles.sectionLabel}>Shablonlar</Text>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template._id}
                    style={[
                      styles.templateButton,
                      selectedTemplateId === template._id && styles.templateButtonSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template._id)}
                  >
                    <Text
                      style={[
                        styles.templateText,
                        selectedTemplateId === template._id && styles.templateTextSelected,
                      ]}
                    >
                      {template.text}
                    </Text>
                    {selectedTemplateId === template._id && (
                      <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Custom Comment */}
            {showCustomComment && (
              <View style={styles.commentSection}>
                <Text style={styles.sectionLabel}>Kommentariya</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Kommentariya kiriting..."
                  multiline
                  numberOfLines={4}
                  value={customComment}
                  onChangeText={setCustomComment}
                  textAlignVertical="top"
                />
                <Text style={styles.commentHint}>
                  {rating >= 4
                    ? 'Ijobiy fikr (admin ko\'rmaydi)'
                    : 'Salbiy fikr (admin ko\'radi va javob beradi)'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Yuborish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  ratingSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  templatesSection: {
    marginBottom: 24,
  },
  templateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  templateText: {
    fontSize: 16,
    color: '#333',
  },
  templateTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e5e5e7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  commentHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  loader: {
    marginVertical: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});




