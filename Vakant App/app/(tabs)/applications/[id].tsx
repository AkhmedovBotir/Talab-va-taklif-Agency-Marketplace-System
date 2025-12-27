import { DeltaRenderer } from '@/components/DeltaRenderer';
import { Answer, Application, EvaluationItem, FinalDecision, InterviewStage, vacancyApi } from '@/services/vacancyApi';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

type TabType = 'vacancy' | 'application' | 'result';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('vacancy');

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  const loadApplication = async (isRefresh: boolean = false) => {
    if (!id) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
    setLoading(true);
    }
    try {
      const data = await vacancyApi.getApplicationById(id);
      setApplication(data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Arizani yuklashda xatolik');
      if (!isRefresh) {
      router.back();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadApplication(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'reviewed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'reviewed':
        return 'Ko\'rib chiqilmoqda';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return status;
    }
  };

  const renderAnswer = (answer: Answer, index: number) => {
    let answerValue: any = answer.answer;
    
    if (Array.isArray(answerValue)) {
      answerValue = answerValue.join(', ');
    } else if (typeof answerValue === 'object' && answerValue !== null) {
      answerValue = JSON.stringify(answerValue);
    } else if (typeof answerValue === 'number') {
      answerValue = answerValue.toString();
    } else if (!answerValue) {
      answerValue = 'Javob berilmagan';
    }

    return (
      <View key={index} style={styles.answerCard}>
        <Text style={styles.questionText}>
          {answer.question || `Savol ${index + 1}`}
        </Text>
        <Text style={styles.answerText}>{answerValue}</Text>
      </View>
    );
  };

  if (loading || !application) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const vacancy = typeof application.vacancy === 'object' 
    ? application.vacancy 
    : null;
  const applicant = typeof application.applicant === 'object'
    ? application.applicant
    : null;

  if (!vacancy) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ma'lumotlar topilmadi</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ariza batafsil</Text>
        <View style={{ width: 32 }} />
      </View>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vacancy' && styles.tabActive]}
          onPress={() => setActiveTab('vacancy')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'vacancy' && styles.tabTextActive,
            ]}
          >
            Vakansiya haqida
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'application' && styles.tabActive]}
          onPress={() => setActiveTab('application')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'application' && styles.tabTextActive,
            ]}
          >
            Mening arizam
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'result' && styles.tabActive]}
          onPress={() => setActiveTab('result')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'result' && styles.tabTextActive,
            ]}
          >
            Natija
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'vacancy' ? (
          <VacancyTabContent vacancy={vacancy} application={application} getStatusColor={getStatusColor} getStatusText={getStatusText} />
        ) : activeTab === 'application' ? (
          <ApplicationTabContent
            application={application}
            applicant={applicant}
            renderAnswer={renderAnswer}
          />
        ) : (
          <ResultTabContent
            application={application}
            applicationId={application._id}
          />
        )}
      </ScrollView>
    </View>
  );
}

// Vacancy Tab Content Component
interface VacancyTabContentProps {
  vacancy: any;
  application: Application;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

function VacancyTabContent({
  vacancy,
  application,
  getStatusColor,
  getStatusText,
}: VacancyTabContentProps) {
  return (
    <>
      {/* Vacancy Info Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{vacancy.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeText}>
                  {vacancy.target === 'agent' ? 'Agent' : 'Punkt'}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>
                  {vacancy.type === 'fulltime' ? 'To\'liq' : 'Yarim'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {vacancy.experience && (
            <View style={styles.infoItem}>
              <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{vacancy.experience}</Text>
            </View>
          )}
          {vacancy.salary && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{vacancy.salary}</Text>
            </View>
          )}
          {(vacancy.minAge || vacancy.maxAge) && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {vacancy.minAge && vacancy.maxAge
                  ? `${vacancy.minAge}-${vacancy.maxAge} yosh`
                  : vacancy.minAge
                  ? `${vacancy.minAge}+ yosh`
                  : `${vacancy.maxAge}- yosh`}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Ariza holati:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(application.status) },
            ]}
          >
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {getStatusText(application.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Vacancy Details */}
      {vacancy.description && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tavsif</Text>
          <DeltaRenderer delta={vacancy.description} />
        </View>
      )}

      {vacancy.responsibilities && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vazifalar</Text>
          <DeltaRenderer delta={vacancy.responsibilities} />
        </View>
      )}

      {vacancy.preferences && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Talablar</Text>
          <DeltaRenderer delta={vacancy.preferences} />
        </View>
      )}

      {vacancy.skills && vacancy.skills.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ko'nikmalar</Text>
          <View style={styles.skillsContainer}>
            {vacancy.skills.map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

// Application Tab Content Component
interface ApplicationTabContentProps {
  application: Application;
  applicant: any;
  renderAnswer: (answer: Answer, index: number) => React.ReactNode;
}

function ApplicationTabContent({
  application,
  applicant,
  renderAnswer,
}: ApplicationTabContentProps) {
  return (
    <>
      {/* Applicant Info */}
      {applicant && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nomzod ma'lumotlari</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {applicant.firstName} {applicant.lastName}
              </Text>
            </View>
            {applicant.phone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{applicant.phone}</Text>
              </View>
            )}
            {applicant.birthDate && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  {new Date(applicant.birthDate).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
            {applicant.gender && (
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  {applicant.gender === 'male' ? 'Erkak' : 'Ayol'}
                </Text>
              </View>
            )}
            {applicant.region && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{applicant.region}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Answers Section */}
      {application.answers && application.answers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Javoblar</Text>
          {application.answers.map((answer, index) =>
            renderAnswer(answer, index)
          )}
        </View>
      )}

      {/* Application Date */}
      <View style={styles.card}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <View style={styles.dateContent}>
            <Text style={styles.dateLabel}>Topshirilgan sana</Text>
            <Text style={styles.dateText}>
              {new Date(application.createdAt).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

// Result Tab Content Component
interface ResultTabContentProps {
  application: Application;
  applicationId: string;
}

function ResultTabContent({ application, applicationId }: ResultTabContentProps) {
  const [interviewStages, setInterviewStages] = useState<InterviewStage[]>([]);
  const [evaluations, setEvaluations] = useState<{
    adminEvaluation?: EvaluationItem[];
    interviewStages?: Array<{
      stageId: string;
      stageName: string;
      stageOrder: number;
      evaluation: EvaluationItem[];
    }>;
  }>({});
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<Application>(application);

  useEffect(() => {
    loadResultData();
  }, [applicationId]);

  const loadResultData = async () => {
    try {
      setLoading(true);
      
      // Load full application data (includes all stages and decisions)
      const fullApplication = await vacancyApi.getApplicationById(applicationId);
      setApplicationData(fullApplication);
      
      // Load interview stages
      try {
        const stages = await vacancyApi.getInterviewStages(applicationId);
        setInterviewStages(stages);
      } catch (error) {
        console.error('Error loading interview stages:', error);
      }
      
      // Load evaluations
      try {
        const evaluationData = await vacancyApi.getEvaluations(applicationId);
        setEvaluations(evaluationData);
      } catch (error) {
        console.error('Error loading evaluations:', error);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToFinalDecision = async () => {
    try {
      await vacancyApi.respondToFinalDecision(applicationId);
      Alert.alert('Muvaffaqiyat', 'Javobingiz qabul qilindi');
      loadResultData();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Javob berishda xatolik');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Use interview stages from application data or loaded stages
  const sortedStages = applicationData.interviewStages
    ? [...applicationData.interviewStages].sort((a, b) => a.stageOrder - b.stageOrder)
    : [...interviewStages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <>
      {/* Roadmap Container */}
      <View style={styles.card}>
        <View style={styles.roadmapHeader}>
          <Ionicons name="time-outline" size={24} color="#2563EB" />
          <Text style={styles.sectionTitle}>Ariza jarayoni</Text>
        </View>
        
        <View style={styles.roadmapContainer}>
          {/* Step 1: Application Submitted */}
          <RoadmapStep
          stepNumber={1}
          title="Ariza topshirildi"
          status="completed"
          date={applicationData.createdAt}
          description="Sizning arizangiz muvaffaqiyatli qabul qilindi"
          isLast={
            !(applicationData.adminEvaluation && applicationData.adminEvaluation.length > 0) &&
            sortedStages.length === 0 &&
            !applicationData.finalDecision
          }
        />

        {/* Step 2: Admin Evaluation */}
        {applicationData.adminEvaluation && applicationData.adminEvaluation.length > 0 && (
          <>
            <RoadmapStep
              stepNumber={2}
              title="Admin baholashi"
              status={applicationData.adminDecision === 'accepted' ? 'completed' : applicationData.adminDecision === 'rejected' ? 'rejected' : 'in_progress'}
              date={applicationData.adminDecidedAt}
              description={applicationData.adminNotes || 'Admin tomonidan baholandi'}
              evaluations={applicationData.adminEvaluation}
              isLast={sortedStages.length === 0 && !applicationData.finalDecision}
            />
          </>
        )}

        {/* Interview Stages */}
        {sortedStages.map((stage, index) => (
          <RoadmapStep
            key={stage._id}
            stepNumber={2 + (applicationData.adminEvaluation ? 1 : 0) + index + 1}
            title={stage.stageName}
            status={
              stage.status === 'completed' && stage.result === 'passed'
                ? 'completed'
                : stage.status === 'completed' && stage.result === 'failed'
                ? 'rejected'
                : stage.status === 'in_progress'
                ? 'in_progress'
                : stage.status === 'cancelled'
                ? 'cancelled'
                : 'pending'
            }
            date={stage.interviewDate}
            interviewTime={stage.interviewTime}
            location={stage.location}
            interviewer={stage.interviewer}
            notes={stage.notes}
            evaluations={stage.evaluation}
            completedAt={stage.completedAt}
            isLast={index === sortedStages.length - 1 && !applicationData.finalDecision}
          />
        ))}

        {/* Final Decision */}
        {applicationData.finalDecision && (
          <RoadmapStep
            stepNumber={2 + (applicationData.adminEvaluation ? 1 : 0) + sortedStages.length + 1}
            title="Yakuniy qaror"
            status={
              applicationData.finalDecision.result === 'hired'
                ? 'completed'
                : applicationData.finalDecision.result === 'rejected'
                ? 'rejected'
                : 'pending'
            }
            date={applicationData.finalDecision.decidedAt}
            description={applicationData.finalDecision.reason}
            finalDecision={applicationData.finalDecision}
            onRespond={handleRespondToFinalDecision}
            isLast={true}
          />
        )}
        </View>
      </View>
    </>
  );
}

// Roadmap Step Component
interface RoadmapStepProps {
  stepNumber: number;
  title: string;
  status: 'completed' | 'pending' | 'in_progress' | 'rejected' | 'cancelled';
  date?: string;
  description?: string;
  interviewTime?: string;
  location?: string;
  interviewer?: string;
  notes?: string;
  evaluations?: EvaluationItem[];
  completedAt?: string;
  finalDecision?: FinalDecision;
  onRespond?: () => void;
  isLast?: boolean;
}

function RoadmapStep({
  stepNumber,
  title,
  status,
  date,
  description,
  interviewTime,
  location,
  interviewer,
  notes,
  evaluations,
  completedAt,
  finalDecision,
  onRespond,
  isLast = false,
}: RoadmapStepProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'in_progress':
        return '#F59E0B';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'in_progress':
        return 'time';
      case 'cancelled':
        return 'ban';
      default:
        return 'ellipse-outline';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Bajarildi';
      case 'rejected':
        return 'Bekor qilindi';
      case 'in_progress':
        return 'Jarayonda';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return 'Kutilmoqda';
    }
  };

  return (
    <View style={styles.roadmapStepWrapper}>
      {/* Timeline Line and Icon */}
      <View style={styles.roadmapTimeline}>
        <View style={[styles.stepIconContainer, { backgroundColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon() as any} size={20} color="#FFFFFF" />
        </View>
        {!isLast && (
          <View 
            style={[
              styles.timelineLine, 
              { 
                backgroundColor: status === 'completed' ? getStatusColor() : '#E5E7EB',
              }
            ]} 
          />
        )}
      </View>
      
      {/* Step Content Card */}
      <View style={styles.roadmapStepContent}>
        <View style={[styles.roadmapStepCard]}>
          <View style={styles.stepHeader}>
            <View style={styles.stepTitleSection}>
              <Text style={styles.stepTitle}>{title}</Text>
              <View style={[styles.stepStatusBadge, { backgroundColor: getStatusColor() + '15' }]}>
                <View style={[styles.stepStatusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.stepStatusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
            {date && (
              <View style={styles.stepDateContainer}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.stepDate}>
                  {new Date(date).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {interviewTime && `, ${interviewTime}`}
                </Text>
              </View>
            )}
          </View>

          {description && (
            <View style={styles.stepDescriptionContainer}>
              <Text style={styles.stepDescription}>{description}</Text>
            </View>
          )}

          {/* Interview Details */}
          {(location || interviewer) && (
            <View style={styles.stepDetails}>
              {location && (
                <View style={styles.stepDetailItem}>
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                  <Text style={styles.stepDetailText}>{location}</Text>
                </View>
              )}
              {interviewer && (
                <View style={styles.stepDetailItem}>
                  <Ionicons name="person-outline" size={18} color="#6B7280" />
                  <Text style={styles.stepDetailText}>{interviewer}</Text>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          {notes && (
            <View style={styles.stepNotes}>
              <View style={styles.stepNotesHeader}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <Text style={styles.stepNotesLabel}>Izoh</Text>
              </View>
              <Text style={styles.stepNotesText}>{notes}</Text>
            </View>
          )}

          {/* Evaluations */}
          {evaluations && evaluations.length > 0 && (
            <View style={styles.stepEvaluations}>
              <View style={styles.stepEvaluationsHeader}>
                <Ionicons name="star-outline" size={16} color="#6B7280" />
                <Text style={styles.stepEvaluationsTitle}>Baholashlar</Text>
              </View>
              <View style={styles.evaluationsGrid}>
                {evaluations.map((evaluationItem, index) => (
                  <View key={index} style={styles.evaluationItem}>
                    <Text style={styles.evaluationName}>{evaluationItem.name}</Text>
                    <View style={styles.evaluationScore}>
                      <Text style={styles.evaluationScoreText}>{evaluationItem.score}/10</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Final Decision Response Button */}
          {finalDecision &&
            finalDecision.result !== 'pending' &&
            finalDecision.responseStatus === 'waiting' &&
            onRespond && (
              <TouchableOpacity
                style={styles.respondButton}
                onPress={onRespond}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.respondButtonText}>Javob berish</Text>
              </TouchableOpacity>
            )}

          {/* Completed At */}
          {completedAt && (
            <View style={styles.stepCompletedAt}>
              <Ionicons name="checkmark-done-outline" size={14} color="#9CA3AF" />
              <Text style={styles.stepCompletedAtText}>
                Yakunlangan: {new Date(completedAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  badgeSecondary: {
    backgroundColor: '#F3E8FF',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoGrid: {
    gap: 12,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  roadmapContainer: {
    flex: 1,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  answerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  roadmapStepWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  roadmapTimeline: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  timelineLine: {
    width: 3,
    position: 'absolute',
    top: 44,
    left: '50%',
    marginLeft: -1.5,
    height: 100,
    minHeight: 30,
    borderRadius: 2,
  },
  roadmapStepContent: {
    flex: 1,
  },
  roadmapStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    flex: 1,
  },
  stepHeader: {
    marginBottom: 12,
  },
  stepTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  stepStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  stepStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepDescriptionContainer: {
    marginTop: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stepDetails: {
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stepDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDetailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  stepNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  stepNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  stepNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNotesText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  stepEvaluations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stepEvaluationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  stepEvaluationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  evaluationsGrid: {
    gap: 8,
  },
  evaluationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evaluationName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  evaluationScore: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  evaluationScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  respondButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  respondButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepCompletedAt: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stepCompletedAtText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
