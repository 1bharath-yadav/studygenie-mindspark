// Base types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: string;
}

export interface ErrorResponse {
    detail: string;
    type?: string;
}

// Authentication types
export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    grade_level?: string;
    learning_preferences?: string[];
    bio?: string;
    created_at: string;
    updated_at: string;
}

export interface UserProfileUpdate {
    name?: string;
    grade_level?: string;
    learning_preferences?: string[];
    bio?: string;
}

export interface AuthTokens {
    access_token: string;
    token_type: string;
    expires_in?: number;
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
    flashcards: Record<string, FlashcardData>;
    quiz: Record<string, QuizData>;
    summary: string;
    learning_objectives: string[];
    estimated_study_time?: number;
    difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced';
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
    name: string;
    service: 'gemini' | 'openai' | 'anthropic';
    created_at: string;
    last_used?: string;
    is_active: boolean;
}

export interface CreateApiKeyRequest {
    name: string;
    service: 'gemini' | 'openai' | 'anthropic';
    key: string;
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
