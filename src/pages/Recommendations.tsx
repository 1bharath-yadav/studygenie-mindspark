import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUser, useStudentRecommendations } from '@/hooks/useApi';
import { Lightbulb, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';

const RecommendationsPage: React.FC = () => {
    const { data: currentUser } = useCurrentUser();
    const studentId = currentUser?.email || '';

    const { data: recommendationsData, isLoading, error, refetch } = useStudentRecommendations(studentId);

    if (!studentId) {
        return (
            <AppLayout title="Authentication Required" icon={Lightbulb}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                        <p className="text-muted-foreground">Please log in to view your recommendations.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const recommendations = (recommendationsData as any)?.recommendations || (recommendationsData as any) || [];

    const getRecommendationIcon = (type: string) => {
        switch (type) {
            case 'concept_review':
                return <AlertCircle className="h-5 w-5 text-orange-600" />;
            case 'maintenance_practice':
                return <CheckCircle className="h-5 w-5 text-blue-600" />;
            case 'continue_learning':
                return <ArrowRight className="h-5 w-5 text-green-600" />;
            default:
                return <Lightbulb className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getRecommendationColor = (type: string) => {
        switch (type) {
            case 'concept_review':
                return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
            case 'maintenance_practice':
                return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
            case 'continue_learning':
                return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
            default:
                return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
        }
    };

    return (
        <AppLayout
            title="Personalized Recommendations"
            subtitle={`AI-powered suggestions based on your learning progress • ${currentUser?.name || studentId}`}
            icon={Lightbulb}
        >
            <div className="w-full px-4 lg:px-6 py-6">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading your recommendations...</p>
                    </div>
                ) : error ? (
                    <Card className="glass-effect">
                        <CardContent className="text-center py-12">
                            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Recommendations Unavailable</h3>
                            <p className="text-muted-foreground mb-4">
                                There was an error loading your recommendations. Please try again.
                            </p>
                            <Button onClick={() => refetch()} className="mb-4">
                                Retry Loading
                            </Button>
                            <div className="text-sm space-y-2">
                                <p className="text-red-500">
                                    Error: {error?.message}
                                </p>
                                <p className="text-blue-500">
                                    Student ID: {studentId}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="glass-effect">
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        <div>
                                            <p className="text-sm font-medium">Total Recommendations</p>
                                            <p className="text-2xl font-bold">{recommendations.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="glass-effect">
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium">Pending</p>
                                            <p className="text-2xl font-bold">
                                                {recommendations.filter((r: any) => !r.is_completed).length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="glass-effect">
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium">Completed</p>
                                            <p className="text-2xl font-bold">
                                                {recommendations.filter((r: any) => r.is_completed).length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Refresh Button */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Your Recommendations</h2>
                            <Button onClick={() => refetch()} variant="outline" size="sm">
                                Refresh Recommendations
                            </Button>
                        </div>

                        {/* Recommendations List */}
                        <Card className="glass-effect">
                            <CardHeader>
                                <CardTitle>Personalized Learning Suggestions</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Based on your quiz performance and learning activities
                                </p>
                            </CardHeader>
                            <CardContent>
                                {recommendations.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendations.map((rec: any, index: number) => (
                                            <div
                                                key={rec.recommendation_id || index}
                                                className={`p-4 border rounded-lg transition-all hover:shadow-md ${rec.is_completed
                                                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                                                    : getRecommendationColor(rec.recommendation_type)
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            {rec.is_completed ? (
                                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                getRecommendationIcon(rec.recommendation_type)
                                                            )}
                                                            <h3 className="font-semibold text-lg">
                                                                {rec.title || rec.content || rec.recommendation_text || 'Study Recommendation'}
                                                            </h3>
                                                        </div>

                                                        <p className="text-muted-foreground mb-3">
                                                            {rec.description || rec.reason || 'Continue your learning journey'}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {rec.concept_name && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    📚 {rec.concept_name}
                                                                </Badge>
                                                            )}
                                                            {rec.recommendation_type && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    🔖 {rec.recommendation_type.replace('_', ' ')}
                                                                </Badge>
                                                            )}
                                                            {rec.difficulty_level && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    🎯 {rec.difficulty_level}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {rec.created_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Created: {new Date(rec.created_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end space-y-2">
                                                        {rec.priority_score && (
                                                            <Badge
                                                                variant={
                                                                    rec.priority_score >= 8 ? 'destructive' :
                                                                        rec.priority_score >= 5 ? 'default' : 'secondary'
                                                                }
                                                            >
                                                                Priority: {rec.priority_score}/10
                                                            </Badge>
                                                        )}

                                                        {!rec.is_completed && (
                                                            <Button size="sm" variant="outline">
                                                                Start Learning
                                                                <ArrowRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Take more quizzes and practice with flashcards to get personalized recommendations!
                                        </p>
                                        <div className="space-y-4">
                                            <Button onClick={() => refetch()}>
                                                Generate Recommendations
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default RecommendationsPage;
