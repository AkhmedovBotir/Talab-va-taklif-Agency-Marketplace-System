import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { Button } from '@/components/Button';
import { vacancyApi, Vacancy, Question, Answer } from '@/services/vacancyApi';
import { QuestionInput } from '@/components/QuestionInput';

export default function ApplyVacancyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadVacancy();
    }
  }, [id]);

  const loadVacancy = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await vacancyApi.getVacancyById(id);
      setVacancy(data);
      
      // Check if already applied
      if (data.applicationStatus) {
        Alert.alert(
          'Ogohlantirish',
          'Siz bu vakansiyaga allaqachon topshirgansiz',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Vakansiyani yuklashda xatolik');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!vacancy) return false;
    
    const newErrors: Record<string, string> = {};
    
    vacancy.questions.forEach((question, index) => {
      const questionId = index.toString();
      const answer = answers[questionId];
      
      if (question.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
        newErrors[questionId] = 'Javob berilishi shart';
        return;
      }
      
      if (answer !== undefined && answer !== null && answer !== '') {
        // Validate based on type
        if (question.type === 'email' && answer) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(answer as string)) {
            newErrors[questionId] = 'Noto\'g\'ri email format';
          }
        }
        
        if (question.type === 'phone' && answer) {
          const phoneRegex = /^\+998\d{9}$/;
          if (!phoneRegex.test(answer as string)) {
            newErrors[questionId] = 'Noto\'g\'ri telefon format';
          }
        }
        
        if (question.type === 'number' && answer) {
          if (isNaN(Number(answer))) {
            newErrors[questionId] = 'Raqam kiriting';
          }
        }
        
        if ((question.type === 'select' || question.type === 'radio') && answer) {
          if (!question.options.includes(answer as string)) {
            newErrors[questionId] = 'Noto\'g\'ri variant tanlandi';
          }
        }
        
        if (question.type === 'checkbox' && Array.isArray(answer)) {
          const invalidOptions = answer.filter((opt) => !question.options.includes(opt));
          if (invalidOptions.length > 0) {
            newErrors[questionId] = 'Noto\'g\'ri variantlar tanlandi';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!vacancy || !id) return;
    
    if (!validate()) {
      Alert.alert('Xatolik', 'Barcha maydonlarni to\'g\'ri to\'ldiring');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray: Answer[] = vacancy.questions.map((question, index) => ({
        questionId: index.toString(),
        answer: answers[index.toString()] || '',
      }));

      await vacancyApi.applyToVacancy(id, answersArray);
      
      Alert.alert(
        'Muvaffaqiyatli',
        'Vakansiyaga muvaffaqiyatli topshirildi',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/vacancies/${id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Topshirishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  if (loading || !vacancy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>{vacancy.name}</Text>
          <Text style={styles.subtitle}>
            Barcha savollarga javob bering
          </Text>
        </View>

        <View style={styles.questionsContainer}>
          {vacancy.questions.map((question, index) => {
            const questionId = index.toString();
            return (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {question.question}
                  {question.required && <Text style={styles.required}> *</Text>}
                </Text>
                <QuestionInput
                  question={question}
                  value={answers[questionId]}
                  onChange={(answer) => handleAnswerChange(questionId, answer)}
                  error={errors[questionId]}
                />
              </View>
            );
          })}
        </View>

        <Button
          title="Topshirish"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  questionsContainer: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  required: {
    color: '#EF4444',
  },
  submitButton: {
    marginTop: 24,
  },
});




