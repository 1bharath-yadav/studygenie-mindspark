// Base types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: string;
    success?: boolean;
}

export interface ErrorResponse {
    detail: string;
    type?: string;
}

// Authentication types (updated for Supabase JWT)
export interface User {
    id: string;
    email: string;
    name?: string;
    full_name?: string;
    picture?: string;
    grade_level?: string;
    learning_preferences?: string[];
    bio?: string;
    created_at: string;
    updated_at: string;
    // Supabase user fields
    aud?: string;
    exp?: number;
    iat?: number;
    iss?: string;
    sub?: string;
    role?: string;
    session_id?: string;
}

export interface UserProfileUpdate {
    name?: string;
    full_name?: string;
    grade_level?: string;
    learning_preferences?: string[];
    bio?: string;
}

export interface AuthTokens {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    user?: User;
}

export interface SupabaseAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    user: User;
}

export interface AuthCredentials {
    email: string;
    password: string;
}

export interface SignUpData extends AuthCredentials {
    name?: string;
    full_name?: string;
}

export interface AuthenticatedUserInfo {
    user: User;
    jwt: string;
}

export interface ApiKeyCreate {
    name: string;
    provider_id: string;
    api_key: string;
}
// Student types
export interface Student {
    id: string;
    name: string;
    email: string;
    grade_level?: string;
    learning_preferences?: string[];
    created_at: string;
    updated_at: string;
}

export interface StudentProgress {
    student_id: string;
    subject: string;
    topic: string;
    completion_percentage: number;
    quiz_scores: number[];
    flashcard_mastery: Record<string, number>;
    time_spent: number;
    last_activity: string;
}

// Learning content types
export interface FlashcardData {
    question: string;
    answer: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizData {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface LearningContent {
    flashcards?: FlashcardData[] | Record<string, FlashcardData>;
    quiz?: QuizData[] | Record<string, QuizData>;
    match_the_following?: any;
    summary?: string;
    learning_objectives?: string[];
    estimated_study_time?: number;
    difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced';
    metadata?: {
        subject_name?: string;
        chapter_name?: string;
        concept_name?: string;
        difficulty_level?: string;
        estimated_study_time?: string;
    };
}

// File processing types
export interface ProcessFilesRequest {
    student_id?: string;
    user_query?: string;
    student_name?: string;
    grade_level?: string;
    learning_objectives?: string[];
    difficulty_preference?: 'Easy' | 'Medium' | 'Hard';
}

export interface ProcessFilesResponse {
    task_id: string;
    status: 'processing' | 'completed' | 'failed';
    content?: LearningContent;
    error?: string;
    metadata?: Record<string, any>;
    subject_name?: string;
    chapter_name?: string;
    concept_name?: string;
    difficulty_level?: string;
    estimated_study_time?: string;
}

// Chat types
export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: string;
    context?: string;
    type?: 'text' | 'suggestion' | 'explanation';
}

export interface ChatRequest {
    message: string;
    context?: string;
    student_id?: string;
    conversation_history?: ChatMessage[];
}

export interface ChatResponse {
    message: string;
    suggestions?: string[];
    resources?: {
        title: string;
        url: string;
        type: 'article' | 'video' | 'practice';
    }[];
}

// API Key types
export interface ApiKey {
    id: string;
    provider: string;
    name: string;
    encrypted_key: string;
    created_at: string;
    updated_at: string;
}

// Analytics types (comprehensive new analytics system)
export interface DashboardAnalytics {
    student_id: string;
    period_days: number;
    overall_mastery_percentage: number;
    total_study_time: number;
    concepts_learned: number;
    quiz_accuracy: number;
    study_streak: number;
    subjects_summary: SubjectSummary[];
    recent_activities: RecentActivity[];
    performance_trend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
}

export interface SubjectSummary {
    subject_name: string;
    mastery_percentage: number;
    concepts_total: number;
    concepts_mastered: number;
    time_spent: number;
    quiz_accuracy: number;
    last_studied: string;
}

export interface SubjectAnalytics {
    student_id: string;
    period_days: number;
    subjects_summary: SubjectSummary[];
    subjects_detail: Record<string, DetailedSubjectAnalytics>;
    overall_stats: {
        total_subjects: number;
        total_concepts: number;
        total_mastered: number;
        average_mastery: number;
        total_time_spent: number;
        most_studied_subject: string | null;
        best_performing_subject: string | null;
    };
}

export interface DetailedSubjectAnalytics {
    mastery_percentage: number;
    total_concepts: number;
    mastered_concepts: number;
    time_spent: number;
    quiz_accuracy: number;
    concepts: ConceptProgress[];
}

export interface ConceptProgress {
    concept_name: string;
    chapter_name: string;
    mastery_score: number;
    total_attempts: number;
    correct_answers: number;
    total_questions: number;
    last_practiced: string;
}

export interface WeeklyTrends {
    weekly_progress: WeeklyProgressData[];
    trend: 'improving' | 'declining' | 'stable';
    improvement_rate: number;
}

export interface WeeklyProgressData {
    week: string;
    average_score: number;
    concepts_learned: number;
    time_spent: number;
    quiz_accuracy: number;
}

export interface Achievement {
    title: string;
    icon: string;
    color: string;
    points: number;
}

export interface AchievementsData {
    achievements: Achievement[];
    total_points: number;
    badges_earned: number;
}

export interface WeaknessAnalysis {
    weak_concepts: WeakConcept[];
    weak_subjects: WeakSubject[];
    improvement_areas: ImprovementArea[];
    needs_attention: number;
    priority_actions: ImprovementArea[];
    overall_weakness_score: number;
}

export interface WeakConcept {
    concept_name: string;
    subject_name: string;
    chapter_name: string;
    mastery_score: number;
    total_attempts: number;
    accuracy: number;
}

export interface WeakSubject {
    subject_name: string;
    mastery_percentage: number;
    quiz_accuracy: number;
    concepts_total: number;
    concepts_mastered: number;
    time_spent: number;
}

export interface ImprovementArea {
    type: 'subject' | 'concept_group';
    subject: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    metrics?: Record<string, number>;
    weak_concepts_count?: number;
    average_mastery?: number;
}

export interface StudyPatterns {
    daily_study_time: number;
    peak_study_hours: number[];
    consistency_score: number;
    preferred_study_duration: number;
    break_patterns: {
        frequency: string;
        duration: number;
    };
    learning_velocity: {
        concepts_per_hour: number;
        retention_rate: number;
    };
    study_habits: {
        morning_study: number;
        evening_study: number;
        weekend_study: number;
        consistency: number;
    };
    performance_trends: {
        improving_subjects: string[];
        declining_subjects: string[];
        stable_subjects: string[];
    };
}

export interface RecentActivity {
    type: 'study' | 'quiz' | 'review';
    subject: string;
    concept?: string;
    duration: number;
    score?: number;
    timestamp: string;
}

// API Key types (updated for new provider system)
export interface ApiKeyData {
    id: string;
    provider_id: string;
    provider_name: string;
    key_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiKeyCreate {
    provider_id: string;
    api_key: string;
    // Note: key_name not supported by database schema
}

export interface ApiKeyResponse {
    id: string;
    provider_id: string;
    provider_name: string;
    provider_display_name: string;
    is_active: boolean;
    is_default: boolean;
    student_id: string;
    created_at: string;
}

export interface ProviderStatus {
    provider: string;
    has_api_key: boolean;
}

export interface LLMProvider {
    id: string;
    name: string;
    display_name: string;
    base_url?: string;
    is_active: boolean;
    models: LLMModel[];
    capabilities: string[];
}

export interface LLMModel {
    id: string;
    model_name: string;
    display_name: string;
    model_type: string;
    context_length: number;
    supports_function_calling: boolean;
    max_tokens: number;
    features: Record<string, any>;
    provider_id: string;
    is_active: boolean;
}

// Model preference types
export interface ModelPreference {
    id: string;
    student_id: string;
    model_id: string;
    use_for_chat: boolean;
    use_for_embedding: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    // Joined model information
    model?: LLMModel;
}

export interface ModelPreferenceCreate {
    model_id: string;
    use_for_chat?: boolean;
    use_for_embedding?: boolean;
    is_default?: boolean;
}

export interface ModelPreferenceUpdate {
    use_for_chat?: boolean;
    use_for_embedding?: boolean;
    is_default?: boolean;
}

// Progress tracking types
export interface StudySession {
    id: string;
    student_id: string;
    subject: string;
    topic: string;
    duration: number;
    activities: {
        flashcards_reviewed: number;
        quiz_questions_answered: number;
        correct_answers: number;
    };
    started_at: string;
    completed_at?: string;
}

export interface ProgressMetrics {
    total_study_time: number;
    subjects_studied: number;
    topics_mastered: number;
    average_quiz_score: number;
    streak_days: number;
    weekly_progress: {
        week: string;
        hours_studied: number;
        topics_completed: number;
    }[];
}

// File upload types
export interface UploadedFile {
    id: string;
    filename: string;
    size: number;
    type: string;
    uploaded_at: string;
    processed: boolean;
}

// Health check type
export interface HealthCheck {
    status: string;
    message: string;
    timestamp?: string;
}
