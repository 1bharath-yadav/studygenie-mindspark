import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuizComponent } from '@/components/study/QuizComponent';
import { MatchTheFollowing } from '@/components/study/MatchTheFollowing';
import { FlashcardViewer } from '@/components/study/FlashcardViewer';
import { IntegratedAIAssistant } from '@/components/IntegratedAIAssistant';
import { useApiKeys, useApiKeyStatus, useCurrentUser, useStudent, useSaveLearningActivity } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useApi';
import {
    BookOpen,
    Brain,
    Upload,
    Target,
    Clock,
    Zap,
    Settings,
    Home,
    Trash2,
    MessageCircle,
    X as XIcon,
} from 'lucide-react';
// AnalyticsPanel moved to the dedicated Analytics page to avoid showing analytics on the study interface

interface NewStudyInterfaceProps {
    isAuthenticated?: boolean;
    hasApiKey?: boolean;
}

export const NewStudyInterface: React.FC<NewStudyInterfaceProps> = ({
    isAuthenticated = true,
    hasApiKey = true
}) => {
    const [assistantOpen, setAssistantOpen] = useState<boolean>(false);
    const hideTimeoutRef = useRef<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const [learningContent, setLearningContent] = useState<any>(null);
    const [sessionHistory, setSessionHistory] = useState<any[]>([]);
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('studygenie_session_id'));

    // Session storage key for persistence
    const LEARNING_CONTENT_KEY = 'studygenie_learning_content';
    const SELECTED_CONTENT_TYPES_KEY = 'studygenie_selected_content_types';

    // Load content from session storage on mount
    useEffect(() => {
        try {
            const savedContent = sessionStorage.getItem(LEARNING_CONTENT_KEY);
            const savedContentTypes = sessionStorage.getItem(SELECTED_CONTENT_TYPES_KEY);
            const savedHistory = sessionStorage.getItem('studygenie_session_history');

            if (savedContent) {
                const parsedContent = JSON.parse(savedContent);
                console.log('📄 Restored learning content from session:', parsedContent);
                setLearningContent(parsedContent);
            }

            if (savedHistory) {
                try {
                    const parsedHistory = JSON.parse(savedHistory);
                    if (Array.isArray(parsedHistory)) setSessionHistory(parsedHistory);
                } catch (e) {
                    console.error('Failed to parse saved session history:', e);
                }
            }

            if (savedContentTypes) {
                const parsedContentTypes = JSON.parse(savedContentTypes);
                console.log('📄 Restored selected content types from session:', parsedContentTypes);
                setSelectedContentTypes(parsedContentTypes);
            }
        } catch (error) {
            console.error('Error loading from session storage:', error);
        }
    }, []);

        // Handle deep-link/session filters created by Subjects page
        useEffect(() => {
            try {
                const rawFilters = sessionStorage.getItem('studygenie_session_filters');
                if (!rawFilters) return;
                const filters = JSON.parse(rawFilters);
                // Remove the filters once consumed
                sessionStorage.removeItem('studygenie_session_filters');

                // If there's already a session id, keep using it; otherwise create a new one
                let sid = sessionStorage.getItem('studygenie_session_id');
                if (!sid) {
                    sid = `s_${Math.random().toString(36).slice(2, 9)}`;
                    sessionStorage.setItem('studygenie_session_id', sid);
                    setSessionId(sid);
                }

                // Create minimal learning content metadata so the study interface can show context
                const meta = {
                    subject_name: filters.subject?.subject_name || filters.subject?.name || null,
                    subject_id: filters.subject?.subject_id || null,
                    chapter_name: filters.chapter?.chapter_name || null,
                    chapter_id: filters.chapter?.chapter_id || null,
                    concept_name: filters.concept?.concept_name || null,
                    concept_id: filters.concept?.concept_id || null,
                };

                const initialContent = {
                    metadata: meta,
                    summary: `Session initialized for ${meta.subject_name || 'selected subject'}${meta.chapter_name ? ' • ' + meta.chapter_name : ''}${meta.concept_name ? ' • ' + meta.concept_name : ''}`,
                } as any;

                setLearningContent(initialContent);
                try { sessionStorage.setItem('studygenie_learning_content', JSON.stringify(initialContent)); } catch (e) {}

                // Open assistant so the student can continue or ask the assistant to generate materials
                setAssistantOpen(true);
            } catch (e) {
                console.error('Failed to process session filters:', e);
            }
        }, []);

    // Save content to session storage whenever it changes
    useEffect(() => {
        if (learningContent) {
            try {
                sessionStorage.setItem(LEARNING_CONTENT_KEY, JSON.stringify(learningContent));
                console.log('💾 Saved learning content to session storage');
            } catch (error) {
                console.error('Error saving learning content to session storage:', error);
            }
        }
    }, [learningContent]);

    // Save selected content types to session storage whenever they change
    useEffect(() => {
        try {
            sessionStorage.setItem(SELECTED_CONTENT_TYPES_KEY, JSON.stringify(selectedContentTypes));
            console.log('💾 Saved selected content types to session storage');
        } catch (error) {
            console.error('Error saving content types to session storage:', error);
        }
    }, [selectedContentTypes]);

    // Content type options
    const contentTypes = [
        { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
        { id: 'quiz', label: 'Quiz', icon: Target },
        { id: 'match_the_following', label: 'Match the Following', icon: Zap }
    ];

    // Get real data from APIs
    const { data: currentUser } = useCurrentUser();
    const { data: currentStudent } = useStudent();
    const { data: apiKeys } = useApiKeys();
    // pass empty provider to avoid TypeScript missing-argument error; the hook will be a no-op
    const { data: apiKeyStatus } = useApiKeyStatus('');
    const saveLearningActivityMutation = useSaveLearningActivity();
    const { data: subjectsData, isLoading: subjectsLoading } = useSubjects();

    const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

    const studentName = currentUser?.name || 'Student';
    const gradeLevel = currentUser?.grade_level || 'High School';

    // Use the dedicated status endpoint for better performance and accuracy
    const hasActiveApiKey = (apiKeyStatus && (apiKeyStatus as any).hasActiveApiKey) ||
        (apiKeys && apiKeys.length > 0 && apiKeys.some((key: any) => key.is_active));

    // Use canonical student_id from the server. Do NOT fall back to email/local values.
    // If student_id is missing, we won't attempt to save learning activity to avoid 403/duplicate calls.
    const studentId = currentStudent?.student_id ?? undefined;

    const toggleContentType = (typeId: string) => {
        setSelectedContentTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };

    const handleContentGenerated = (content: any) => {
        console.log('🎯 handleContentGenerated called with:', content);
        console.log('🎯 Content type:', typeof content);
        console.log('🎯 Content keys:', content ? Object.keys(content) : 'null/undefined');
        console.log('🎯 Content metadata:', content?.metadata);

        // Extract the actual learning content from the response and add metadata to it.
        // Some providers return the useful fields directly on the top-level `content` object
        // while others return them under a nested `content` key. Prefer nested `content`
        // when present, otherwise fall back to the top-level object so we don't drop
        // fields like flashcards/quiz/summary when the API returns them directly.
        // Prefer a non-empty nested `content` object. If `content.content` is present
        // but empty ({}), fall back to top-level fields so we don't discard flashcards/quiz.
        const nestedContent = content?.content;
        const hasNestedContent = nestedContent && Object.keys(nestedContent).length > 0;
        const hasTopLevelLearningKeys = !!(content && (content.flashcards || content.quiz || content.summary || content.match_the_following || content.learning_objectives));

        const learningData = hasNestedContent ? nestedContent : (hasTopLevelLearningKeys ? content : {});
        console.log('🎯 Extracted learning data:', learningData);
        console.log('🎯 Learning data keys:', learningData ? Object.keys(learningData) : 'null/undefined');

        // Add metadata to the learning content
        const actualContent = {
            ...learningData,
            metadata: {
                subject_name: content?.subject_name || content?.metadata?.subject_name,
                chapter_name: content?.chapter_name || content?.metadata?.chapter_name,
                concept_name: content?.concept_name || content?.metadata?.concept_name,
                difficulty_level: content?.difficulty_level || content?.metadata?.difficulty_level,
                estimated_study_time: content?.estimated_study_time || content?.metadata?.estimated_study_time
            }
        };

        // Attach session id if present in the LLM response so we can restore chat sessions
        const extractedSessionId = content?.session_id || content?.metadata?.session_id || content?.sessionId || null;
        if (extractedSessionId) {
            // persist session id to sessionStorage and include on saved content
            try {
                sessionStorage.setItem('studygenie_session_id', extractedSessionId);
                setSessionId(extractedSessionId);
            } catch (e) {
                console.warn('Failed to persist session id', e);
            }
            (actualContent as any).session_id = extractedSessionId;
        }

        console.log('🎯 Final actualContent with metadata:', actualContent);
        console.log('🎯 Metadata values:', {
            subject: actualContent?.metadata?.subject_name,
            chapter: actualContent?.metadata?.chapter_name,
            concept: actualContent?.metadata?.concept_name
        });
        console.log('🎯 Flashcards type:', typeof actualContent?.flashcards);
        console.log('🎯 Flashcards is array:', Array.isArray(actualContent?.flashcards));
        console.log('🎯 Flashcards value:', actualContent?.flashcards);

        // Handle flashcards - convert object to array if needed
        if (actualContent?.flashcards && !Array.isArray(actualContent.flashcards)) {
            console.log('🔧 Converting flashcards object to array');
            // If flashcards is an object, convert it to an array
            actualContent.flashcards = Object.values(actualContent.flashcards);
        }

        // Handle quiz - convert object to array if needed  
        if (actualContent?.quiz && !Array.isArray(actualContent.quiz)) {
            console.log('🔧 Converting quiz object to array');
            actualContent.quiz = Object.values(actualContent.quiz);
        }

        // Handle match_the_following - ensure it's preserved as object
        if (actualContent?.match_the_following && typeof actualContent.match_the_following === 'object') {
            console.log('🔧 Preserving match_the_following object structure');
            // match_the_following should remain as object with columnA, columnB, mappings
        }

        console.log('🎯 After conversion - Has flashcards:', actualContent?.flashcards?.length || 0);
        console.log('🎯 After conversion - Has quiz:', actualContent?.quiz?.length || 0);
        console.log('🎯 After conversion - Has match_the_following:', !!actualContent?.match_the_following);
        console.log('🎯 Match the following content:', actualContent?.match_the_following);
        console.log('🎯 Has summary:', !!actualContent?.summary);

        // --- Normalization pass -------------------------------------------------
        // Normalize flashcards to a consistent shape the UI expects:
        // { question, answer, difficulty, key_concepts }
        if (actualContent?.flashcards) {
            // Ensure array
            if (!Array.isArray(actualContent.flashcards)) {
                actualContent.flashcards = Object.values(actualContent.flashcards);
            }

            actualContent.flashcards = actualContent.flashcards.map((card: any, idx: number) => {
                const q = card.question || card.prompt || card.q || card.question_text || card.key_concepts || `Question ${idx + 1}`;
                const a = card.answer || card.explanation || card.correct_answer || card.a || '';
                const difficulty = card.difficulty || card.level || 'Medium';
                const key_concepts = card.key_concepts || card.subject || card.topic || card.label || '';
                return {
                    // keep original fields when available for debugging
                    ...card,
                    question: q,
                    answer: a,
                    difficulty,
                    key_concepts
                };
            });
        }

        // Normalize quiz items to include question, options (if available), correct_answer, explanation
        if (actualContent?.quiz) {
            if (!Array.isArray(actualContent.quiz)) {
                actualContent.quiz = Object.values(actualContent.quiz);
            }

            actualContent.quiz = actualContent.quiz.map((item: any, idx: number) => ({
                ...item,
                question: item.question || item.prompt || item.q || `Question ${idx + 1}`,
                options: item.options || item.choices || item.answers || item.options_list || [],
                correct_answer: item.correct_answer || item.correct || item.answer || null,
                explanation: item.explanation || item.expl || item.answer_explanation || ''
            }));
        }

        // If no explicit selected content types were restored from session, auto-select ones present
        try {
            const autoSelected: string[] = [];
            if (actualContent?.flashcards && actualContent.flashcards.length > 0) autoSelected.push('flashcards');
            if (actualContent?.quiz && actualContent.quiz.length > 0) autoSelected.push('quiz');
            if (actualContent?.match_the_following) autoSelected.push('match_the_following');
            if (actualContent?.learning_objectives && actualContent.learning_objectives.length > 0) {
                // don't add a UI toggle for objectives, but keep for completeness
            }

            if (autoSelected.length > 0 && selectedContentTypes.length === 0) {
                console.log('🔧 Auto-selecting content types based on returned content:', autoSelected);
                setSelectedContentTypes(autoSelected);
            }
        } catch (e) {
            console.error('Error auto-selecting content types:', e);
        }

        // Determine whether the LLM produced useful learning content. If not, do not
        // overwrite the current `learningContent` shown on the main page.
        const hasUsefulContent = !!(
            (actualContent?.flashcards && actualContent.flashcards.length > 0) ||
            (actualContent?.quiz && actualContent.quiz.length > 0) ||
            actualContent?.summary ||
            actualContent?.match_the_following ||
            (actualContent?.learning_objectives && actualContent.learning_objectives.length > 0)
        );

        if (!hasUsefulContent) {
            // Don't overwrite existing main content if the generated response isn't useful.
            console.log('No useful learning content returned from LLM; ignoring update.');
            return;
        }

        // Persist to session history: if a session history exists, append; otherwise create new
        try {
            const sessionId = sessionStorage.getItem('studygenie_session_id');
            const rawHistory = sessionStorage.getItem('studygenie_session_history');
            const existingHistory = rawHistory ? JSON.parse(rawHistory) : [];

            // Append the new actualContent to history
            existingHistory.push(actualContent);

            // Store updated history and latest content
            sessionStorage.setItem('studygenie_session_history', JSON.stringify(existingHistory));
            sessionStorage.setItem('studygenie_learning_content', JSON.stringify(actualContent));
            if (sessionId) sessionStorage.setItem('studygenie_session_id', sessionId);

            // Update local state so UI shows appended history
            setSessionHistory(existingHistory);
        } catch (e) {
            console.error('Error updating session history in sessionStorage:', e);
        }

        setLearningContent(actualContent);

        // Auto-hide the assistant when useful content is generated
        // clear any existing timeout
        if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = window.setTimeout(() => {
            setAssistantOpen(false);
            hideTimeoutRef.current = null;
        }, 1500);
        console.log('🎯 State updated, new learningContent should be:', actualContent);
    };

    const openSubjectDetail = (subject: any) => {
        setSelectedSubject(subject);
    };

    const closeSubjectDetail = () => setSelectedSubject(null);

    const handleContinueSession = (subject: any, chapter?: any, concept?: any) => {
        // For now, navigate to sessions page and potentially pass filters via state
        navigate('/sessions');
        closeSubjectDetail();
    };

    // Clear pending timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, []);

    // Function to clear session storage and reset content
    const clearSession = () => {
        try {
            const sid = sessionStorage.getItem('studygenie_session_id') || sessionId;

            sessionStorage.removeItem(LEARNING_CONTENT_KEY);
            sessionStorage.removeItem(SELECTED_CONTENT_TYPES_KEY);
            sessionStorage.removeItem('studygenie_session_id');
            sessionStorage.removeItem('studygenie_session_history');

            // remove per-session localStorage keys if present
            if (sid) {
                try { localStorage.removeItem(`studygenie_chat_messages_${sid}`); } catch (e) {}
                try { localStorage.removeItem(`studygenie_study_materials_${sid}`); } catch (e) {}
            }

            setLearningContent(null);
            setSessionHistory([]);
            setSelectedContentTypes([]);
            setSessionId(null);
            console.log('🗑️ Cleared session storage and reset content');
        } catch (error) {
            console.error('Error clearing session storage:', error);
        }
    };

    // Listen for global clear-session events (dispatched by AppLayout when + is pressed)
    useEffect(() => {
        const handler = () => clearSession();
        window.addEventListener('studygenie:clear-session', handler as EventListener);
        return () => window.removeEventListener('studygenie:clear-session', handler as EventListener);
    }, [sessionId]);

    // Listen for explicit request to open the assistant (dispatched by AppLayout when + is pressed)
    useEffect(() => {
        const onOpenAssistant = () => {
            // ensure any hide timeout is cleared and show the assistant UI
            if (hideTimeoutRef.current) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
            setAssistantOpen(true);
        };
        window.addEventListener('studygenie:open-assistant', onOpenAssistant as EventListener);
        return () => window.removeEventListener('studygenie:open-assistant', onOpenAssistant as EventListener);
    }, []);

    // Hide assistant immediately when a material-generation request is submitted
    useEffect(() => {
        const onHide = () => setAssistantOpen(false);
        window.addEventListener('studygenie:hide-assistant', onHide as EventListener);
        return () => window.removeEventListener('studygenie:hide-assistant', onHide as EventListener);
    }, []);

    // Handle quiz completion and save progress
    const handleQuizComplete = (results: {
        score: number;
        totalQuestions: number;
        timeSpent: number;
        difficulty: string;
    }) => {
        if (!studentId || !learningContent) return;

        // Debug: Log the metadata being used
        console.log('📊 Saving quiz activity with metadata:', {
            subject: learningContent.metadata?.subject_name,
            chapter: learningContent.metadata?.chapter_name,
            concept: learningContent.metadata?.concept_name,
            fullMetadata: learningContent.metadata
        });

        const activityData = {
            subject_name: learningContent.metadata?.subject_name || 'Study Session',
            chapter_name: learningContent.metadata?.chapter_name || 'Practice Chapter',
            concept_name: learningContent.metadata?.concept_name || 'Quiz Practice',
            activity_type: 'quiz_attempt' as const,
            correct_answers: results.score,
            total_questions: results.totalQuestions,
            time_spent: results.timeSpent,
            difficulty_level: (results.difficulty?.charAt(0).toUpperCase() + results.difficulty?.slice(1).toLowerCase()) as 'Easy' | 'Medium' | 'Hard'
        };

        saveLearningActivityMutation.mutate(
            { studentId, activityData },
            {
                onSuccess: () => {
                    toast({
                        title: "Progress Saved!",
                        description: `Quiz completed: ${results.score}/${results.totalQuestions} correct answers.`,
                    });
                },
                onError: (error) => {
                    console.error('Error saving quiz progress:', error);
                    toast({
                        title: "Progress Not Saved",
                        description: "There was an error saving your quiz progress.",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    // Handle flashcard session completion and save progress
    const handleFlashcardComplete = (results: {
        totalCards: number;
        masteredCards: number;
        timeSpent: number;
        difficulty: string;
    }) => {
        if (!studentId || !learningContent) return;

        // Debug: Log the metadata being used
        console.log('📊 Saving flashcard activity with metadata:', {
            subject: learningContent.metadata?.subject_name,
            chapter: learningContent.metadata?.chapter_name,
            concept: learningContent.metadata?.concept_name,
            fullMetadata: learningContent.metadata
        });

        const activityData = {
            subject_name: learningContent.metadata?.subject_name || 'Study Session',
            chapter_name: learningContent.metadata?.chapter_name || 'Practice Chapter',
            concept_name: learningContent.metadata?.concept_name || 'Flashcard Practice',
            activity_type: 'flashcard_practice' as const,
            correct_answers: results.masteredCards,
            total_questions: results.totalCards,
            time_spent: results.timeSpent,
            difficulty_level: (results.difficulty?.charAt(0).toUpperCase() + results.difficulty?.slice(1).toLowerCase()) as 'Easy' | 'Medium' | 'Hard'
        };

        saveLearningActivityMutation.mutate(
            { studentId, activityData },
            {
                onSuccess: () => {
                    toast({
                        title: "Progress Saved!",
                        description: `Flashcard session completed: ${results.masteredCards}/${results.totalCards} cards mastered.`,
                    });
                },
                onError: (error) => {
                    console.error('Error saving flashcard progress:', error);
                    toast({
                        title: "Progress Not Saved",
                        description: "There was an error saving your flashcard progress.",
                        variant: "destructive",
                    });
                }
            }
        );
    };

    return (<>
        <AppLayout
            title="Study Interface"
            subtitle={`AI-powered learning companion • ${currentUser?.name || 'Welcome'}`}
            icon={Brain}
        >
            <div className="w-full px-4 lg:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full w-full">
                    {/* Right Panel - Generated Content (full width) */}
                    <div className={`lg:col-span-12 space-y-4`}>
                        {/* Subjects are now shown on the dedicated Subjects page. */}
                        {learningContent ? (
                            <div className="space-y-4">
                                {/* Content Header */}
                                <Card className="glass-effect border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold">Generated Study Material</CardTitle>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline">
                                                    {learningContent.metadata?.subject_name || 'Study Material'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {learningContent.metadata && (
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p><strong>Chapter:</strong> {learningContent.metadata.chapter_name}</p>
                                                <p><strong>Concept:</strong> {learningContent.metadata.concept_name}</p>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="secondary">
                                                        {learningContent.metadata.difficulty_level}
                                                    </Badge>
                                                    {learningContent.metadata.estimated_study_time && (
                                                        <Badge variant="outline">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {learningContent.metadata.estimated_study_time}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardHeader>
                                </Card>

                                {/* Summary */}
                                {learningContent.summary && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-relaxed">{learningContent.summary}</p>
                                        </CardContent>
                                    </Card>
                                )}
                                {/* Analytics panel removed from study interface (moved to /analytics) */}

                                {/* Learning Objectives */}
                                {learningContent.learning_objectives && learningContent.learning_objectives.length > 0 && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Learning Objectives</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {learningContent.learning_objectives.map((objective: string, index: number) => (
                                                    <li key={index} className="flex items-start space-x-2 text-sm">
                                                        <Target className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                                                        <span>{objective}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Flashcards */}
                                {learningContent.flashcards && learningContent.flashcards.length > 0 && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Flashcards ({learningContent.flashcards.length})</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <FlashcardViewer
                                                flashcards={learningContent.flashcards}
                                                onSessionComplete={handleFlashcardComplete}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Quiz */}
                                {learningContent.quiz && learningContent.quiz.length > 0 && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Quiz ({learningContent.quiz.length} questions)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <QuizComponent
                                                quizData={learningContent.quiz}
                                                onQuizComplete={handleQuizComplete}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Match the Following */}
                                {learningContent.match_the_following && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Match the Following</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <MatchTheFollowing data={learningContent.match_the_following} />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Session History Panel */}
                                {sessionHistory && sessionHistory.length > 0 && (
                                    <Card className="glass-effect border-border">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base font-semibold">Session History</CardTitle>
                                                <div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs mr-2"
                                                        onClick={() => {
                                                            // Clear stored history
                                                            sessionStorage.removeItem('studygenie_session_history');
                                                            setSessionHistory([]);
                                                            toast({ title: 'Session history cleared' });
                                                        }}
                                                    >
                                                        Clear History
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {sessionHistory.map((item: any, idx: number) => (
                                                    <li key={idx} className="flex items-center justify-between p-2 border rounded">
                                                        <div className="text-sm">
                                                            <div className="font-medium">{item.metadata?.subject_name || item.metadata?.chapter_name || `Item ${idx + 1}`}</div>
                                                            <div className="text-xs text-muted-foreground">{item.summary ? item.summary.substring(0, 80) : 'No summary available'}</div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button size="sm" variant="default" onClick={() => {
                                                                // Load this item into main view
                                                                    setLearningContent(item);
                                                                    sessionStorage.setItem('studygenie_learning_content', JSON.stringify(item));
                                                                    const sid = item.session_id || item.metadata?.session_id || null;
                                                                    if (sid) {
                                                                        try {
                                                                            sessionStorage.setItem('studygenie_session_id', sid);
                                                                            setSessionId(sid);
                                                                        } catch (e) {}
                                                                    }
                                                            }}>
                                                                Load
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <Card className="glass-effect border-border h-full flex items-center justify-center">
                               
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>

        {/* Compact bottom prompt bar (re-using IntegratedAIAssistant) - shows only when assistantOpen */}
        {assistantOpen && (
          <IntegratedAIAssistant
              disabled={!hasActiveApiKey}
              onContentGenerated={handleContentGenerated}
                            studentId={studentId}
                            studentName={studentName}
                            gradeLevel={gradeLevel}
                            sessionId={sessionId}
          />
        )}

        {/* Gray round toggle button (bottom-right) to open/close assistant */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAssistantOpen(prev => !prev)}
            className="h-12 w-12 rounded-full bg-muted/20 border border-border/20 shadow-md"
            aria-label={assistantOpen ? 'Close assistant' : 'Open assistant'}
          >
            {assistantOpen ? <XIcon className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          </Button>
        </div>

    </>);
};
