import { API_VACANCY_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import { handleUnauthorized, isUnauthorizedError } from '@/utils/authUtils';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface DeltaFormat {
  ops?: any[];
  [key: string]: any;
}

export interface Question {
  question: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options: string[];
  placeholder: string;
}

export interface Vacancy {
  _id: string;
  name: string;
  target: 'agent' | 'punkt';
  type: 'parttime' | 'fulltime';
  experience: string;
  salary: string;
  description: DeltaFormat | null;
  responsibilities: DeltaFormat | null;
  preferences: DeltaFormat | null;
  skills: string[];
  minAge: number | null;
  maxAge: number | null;
  questions: Question[];
  applicationStatus?: 'pending' | 'reviewed' | 'accepted' | 'rejected' | null;
  isBookmarked?: boolean;
  applicationCount?: number;
  viewCount?: number;
  bookmarkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  question?: string;
  type?: string;
  answer: string | number | string[] | object;
}

export interface EvaluationItem {
  name: string;
  score: number;
}

export interface InterviewStage {
  _id: string;
  stageName: string;
  stageOrder: number;
  interviewDate?: string;
  interviewTime?: string;
  location?: string;
  interviewer?: string;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  result?: 'pending' | 'passed' | 'failed';
  evaluation?: EvaluationItem[];
  completedAt?: string;
}

export interface FinalDecision {
  result: 'pending' | 'hired' | 'rejected';
  reason?: string;
  responseStatus: 'waiting' | 'responded';
  respondedAt?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface Application {
  _id: string;
  vacancy: string | Vacancy;
  applicant: string | any;
  answers: Answer[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  adminDecision?: 'pending' | 'accepted' | 'rejected';
  adminEvaluation?: EvaluationItem[];
  adminNotes?: string;
  adminDecidedAt?: string;
  adminDecidedBy?: any;
  interviewStages?: InterviewStage[];
  finalDecision?: FinalDecision;
  createdAt: string;
  updatedAt: string;
}

interface VacancyListParams {
  target?: 'agent' | 'punkt';
  type?: 'parttime' | 'fulltime';
  search?: string;
  page?: number;
  limit?: number;
}

interface ApplicationListParams {
  status?: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  page?: number;
  limit?: number;
}

class VacancyApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_VACANCY_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check for 401 or unauthorized errors
        if (response.status === 401 || isUnauthorizedError(data, response)) {
          await handleUnauthorized();
          throw new Error(data.message || 'Avtorizatsiya talab qilinadi');
        }
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error: any) {
      console.error('Vacancy API Error:', error);
      
      // Check if error is unauthorized
      if (isUnauthorizedError(error)) {
        await handleUnauthorized();
        throw new Error('Avtorizatsiya talab qilinadi');
      }
      
      throw error;
    }
  }

  // Get vacancies
  async getVacancies(params?: VacancyListParams): Promise<{
    data: Vacancy[];
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.target) queryParams.append('target', params.target);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const response = await this.request<Vacancy[]>(
      `/vacancies${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );

    return {
      data: response.data || [],
      count: response.count || 0,
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 20,
      totalPages: response.totalPages || 1,
    };
  }

  // Get vacancy by ID
  async getVacancyById(id: string): Promise<Vacancy> {
    const response = await this.request<Vacancy>(`/vacancies/${id}`, {
      method: 'GET',
    });
    return response.data!;
  }

  // Track vacancy view
  async trackVacancyView(id: string): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_VACANCY_URL}/vacancies/${id}/view`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check for 401 or unauthorized errors
        if (response.status === 401 || isUnauthorizedError(data, response)) {
          await handleUnauthorized();
          throw new Error(data.message || 'Avtorizatsiya talab qilinadi');
        }
        throw new Error(data.message || 'An error occurred');
      }

      // API returns viewCount directly in response, not in data field
      return (data as any).viewCount || 0;
    } catch (error: any) {
      console.error('View tracking error:', error);
      
      // Check if error is unauthorized
      if (isUnauthorizedError(error)) {
        await handleUnauthorized();
        throw new Error('Avtorizatsiya talab qilinadi');
      }
      
      throw error;
    }
  }

  // Apply to vacancy
  async applyToVacancy(id: string, answers: Answer[]): Promise<Application> {
    const response = await this.request<Application>(`/vacancies/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return response.data!;
  }

  // Get applications
  async getApplications(params?: ApplicationListParams): Promise<{
    data: Application[];
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const response = await this.request<Application[]>(
      `/applications${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );

    return {
      data: response.data || [],
      count: response.count || 0,
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 20,
      totalPages: response.totalPages || 1,
    };
  }

  // Get application by ID
  async getApplicationById(id: string): Promise<Application> {
    const response = await this.request<Application>(`/applications/${id}`, {
      method: 'GET',
    });
    return response.data!;
  }

  // Get interview stages
  async getInterviewStages(id: string): Promise<InterviewStage[]> {
    const response = await this.request<{
      count: number;
      data: InterviewStage[];
    }>(`/applications/${id}/interview-stages`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Get evaluations
  async getEvaluations(id: string): Promise<{
    adminEvaluation?: EvaluationItem[];
    interviewStages?: Array<{
      stageId: string;
      stageName: string;
      stageOrder: number;
      evaluation: EvaluationItem[];
    }>;
  }> {
    const response = await this.request<{
      adminEvaluation?: EvaluationItem[];
      interviewStages?: Array<{
        stageId: string;
        stageName: string;
        stageOrder: number;
        evaluation: EvaluationItem[];
      }>;
    }>(`/applications/${id}/evaluations`, {
      method: 'GET',
    });
    return response.data || {};
  }

  // Respond to final decision
  async respondToFinalDecision(id: string): Promise<{ finalDecision: FinalDecision }> {
    const response = await this.request<{ finalDecision: FinalDecision }>(
      `/applications/${id}/final-decision/respond`,
      {
        method: 'POST',
      }
    );
    return response.data!;
  }

  // Bookmark/unbookmark vacancy
  async toggleBookmark(id: string): Promise<boolean> {
    const response = await this.request<{ isBookmarked: boolean }>(
      `/vacancies/${id}/bookmark`,
      { method: 'POST' }
    );
    // Some responses may return the flag either at root or inside data
    const isBookmarked =
      (response.data as any)?.isBookmarked ?? (response as any)?.isBookmarked;
    return Boolean(isBookmarked);
  }

  // Get bookmarks
  async getBookmarks(params?: { page?: number; limit?: number }): Promise<{
    data: Vacancy[];
    count: number;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const response = await this.request<Vacancy[]>(
      `/bookmarks${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );

    return {
      data: response.data || [],
      count: response.count || 0,
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 20,
      totalPages: response.totalPages || 1,
    };
  }
}

export const vacancyApi = new VacancyApiService();

