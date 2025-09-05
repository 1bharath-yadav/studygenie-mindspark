import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuizComponent } from '@/components/study/QuizComponent';
import { MatchTheFollowing } from '@/components/study/MatchTheFollowing';
import { FlashcardViewer } from '@/components/study/FlashcardViewer';
import { IntegratedAIAssistant } from '@/components/IntegratedAIAssistant';
import { useApiKeys, useApiKeyStatus, useCurrentUser, useSaveLearningActivity } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import {
    BookOpen,
    Brain,
    Upload,
    Target,
    Clock,
    Zap,
    Settings,
    Home,
    Trash2
} from 'lucide-react';

interface NewStudyInterfaceProps {
    isAuthenticated?: boolean;
    hasApiKey?: boolean;
}

export const NewStudyInterface: React.FC<NewStudyInterfaceProps> = ({
    isAuthenticated = true,
    hasApiKey = true
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [learningContent, setLearningContent] = useState<any>(null);
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

    // Session storage key for persistence
    const LEARNING_CONTENT_KEY = 'studygenie_learning_content';
    const SELECTED_CONTENT_TYPES_KEY = 'studygenie_selected_content_types';

    // Load content from session storage on mount
    useEffect(() => {
        try {
            const savedContent = sessionStorage.getItem(LEARNING_CONTENT_KEY);
            const savedContentTypes = sessionStorage.getItem(SELECTED_CONTENT_TYPES_KEY);

            if (savedContent) {
                const parsedContent = JSON.parse(savedContent);
                console.log('📄 Restored learning content from session:', parsedContent);
                setLearningContent(parsedContent);
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
    const { data: apiKeys } = useApiKeys();
    const { data: apiKeyStatus } = useApiKeyStatus();
    const saveLearningActivityMutation = useSaveLearningActivity();

    const studentName = currentUser?.name || 'Student';
    const gradeLevel = currentUser?.grade_level || 'High School';

    // Use the dedicated status endpoint for better performance and accuracy
    const hasActiveApiKey = apiKeyStatus?.hasActiveApiKey ||
        (apiKeys && apiKeys.length > 0 && apiKeys.some(key => key.is_active));

    // Get student ID for analytics (use email as student ID since username doesn't exist)
    const studentId = currentUser?.email || 'demo-student';

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

        // Extract the actual learning content from the response and add metadata to it
        const learningData = content?.content || {};
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

        setLearningContent(actualContent);
        console.log('🎯 State updated, new learningContent should be:', actualContent);
    };

    // Function to clear session storage and reset content
    const clearSession = () => {
        try {
            sessionStorage.removeItem(LEARNING_CONTENT_KEY);
            sessionStorage.removeItem(SELECTED_CONTENT_TYPES_KEY);
            setLearningContent(null);
            setSelectedContentTypes([]);
            console.log('🗑️ Cleared session storage and reset content');
        } catch (error) {
            console.error('Error clearing session storage:', error);
        }
    };

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

    return (
        <AppLayout
            title="Study Interface"
            subtitle={`AI-powered learning companion • ${currentUser?.name || 'Welcome'}`}
            icon={Brain}
        >
            <div className="w-full px-4 lg:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full w-full">
                    {/* Left Panel - AI Assistant (35%) */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* API Key Warning */}
                        {!hasActiveApiKey && (
                            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                                <CardContent className="pt-6">
                                    <div className="flex items-center space-x-3">
                                        <Settings className="h-5 w-5 text-amber-600" />
                                        <div>
                                            <h3 className="font-semibold text-amber-800 dark:text-amber-200">API Key Required</h3>
                                            <p className="text-amber-700 dark:text-amber-300 text-sm">
                                                Please add an API key in settings to use AI features.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/settings')}
                                                className="mt-2"
                                            >
                                                Go to Settings
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Content Type Toggle Buttons */}
                        <Card className="glass-effect border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Content Type</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Select what you want to generate
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {contentTypes.map((type) => (
                                        <Button
                                            key={type.id}
                                            variant={selectedContentTypes.includes(type.id) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleContentType(type.id)}
                                            className="flex items-center space-x-1"
                                        >
                                            <type.icon className="h-3 w-3" />
                                            <span className="text-xs">{type.label}</span>
                                        </Button>
                                    ))}
                                </div>
                                {selectedContentTypes.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Selected: {selectedContentTypes.map(id =>
                                            contentTypes.find(t => t.id === id)?.label
                                        ).join(', ')}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Assistant with Integrated File Upload */}
                        <Card className="glass-effect border-border h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <span>AI Study Assistant</span>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Upload files and ask questions. Select content types above or type specific requests.
                                </p>
                            </CardHeader>
                            <CardContent className="h-full">
                                <IntegratedAIAssistant
                                    disabled={!hasActiveApiKey}
                                    onContentGenerated={handleContentGenerated}
                                    studentId={studentId}
                                    studentName={studentName}
                                    gradeLevel={gradeLevel}
                                    selectedContentTypes={selectedContentTypes}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Generated Content (65%) */}
                    <div className="lg:col-span-8 space-y-4">
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
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearSession}
                                                    className="text-xs"
                                                >
                                                    Clear Session
                                                </Button>
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
                            </div>
                        ) : (
                            <Card className="glass-effect border-border h-full flex items-center justify-center">
                                <CardContent className="text-center">
                                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Upload your study materials and ask for what you need:
                                    </p>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>• "Create flashcards from this content"</p>
                                        <p>• "Make a quiz about this topic"</p>
                                        <p>• "Generate a summary"</p>
                                        <p>• "Create match the following exercise"</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
