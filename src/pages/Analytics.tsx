import React from 'react';
import { AnalyticsDashboard } from '@/components/charts/AnalyticsDashboard';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useDashboardAnalytics, useProgressAnalytics, useWeaknessAnalysis, useWeeklyTrends } from '@/hooks/useApi';
import { TrendingUp, BarChart3 } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
    const { data: currentUser } = useCurrentUser();
    const studentId = currentUser?.email || '';

    const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardAnalytics(studentId);
    const { data: progressAnalytics, isLoading: progressLoading, error: progressError } = useProgressAnalytics(studentId);
    const { data: weeklyTrendsData, isLoading: trendsLoading, error: trendsError } = useWeeklyTrends(studentId);
    const { data: weaknessData, isLoading: weaknessLoading, error: weaknessError } = useWeaknessAnalysis(studentId);

    if (!studentId) {
        return (
            <AppLayout title="Authentication Required" icon={TrendingUp}>
                <div className="w-full px-4 lg:px-6 py-6 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                        <p className="text-muted-foreground">Please log in to view your analytics.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isLoading = dashboardLoading || progressLoading || trendsLoading || weaknessLoading;
    const hasError = dashboardError || progressError || trendsError || weaknessError;

    return (
        <AppLayout
            title="Learning Analytics"
            subtitle={`Detailed insights and performance metrics • ${currentUser?.name}`}
            icon={TrendingUp}
        >
            <div className="w-full px-4 lg:px-6 py-6">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
                    </div>
                ) : hasError ? (
                    <Card className="glass-effect">
                        <CardContent className="text-center py-12">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
                            <p className="text-muted-foreground mb-4">
                                {dashboardError?.message || progressError?.message || trendsError?.message || weaknessError?.message || 'Please try again later'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Main Analytics Dashboard */}
                        <AnalyticsDashboard
                            dashboardData={dashboardData}
                            progressData={progressAnalytics}
                            weeklyTrends={Array.isArray(weeklyTrendsData) ? weeklyTrendsData : []}
                            weaknessData={weaknessData}
                        />

                        {/* Additional Detailed Charts */}
                        {progressAnalytics && Array.isArray(progressAnalytics) && progressAnalytics.length > 0 && (
                            <Card className="glass-effect">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <BarChart3 className="h-5 w-5" />
                                        <span>Detailed Progress Analysis</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ProgressChart progressData={progressAnalytics} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Performance Summary */}
                        {dashboardData && (
                            <Card className="glass-effect">
                                <CardHeader>
                                    <CardTitle>Performance Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">{(dashboardData as any)?.total_study_sessions || 0}</p>
                                            <p className="text-sm text-muted-foreground">Study Sessions</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">{(dashboardData as any)?.concepts_mastered || 0}</p>
                                            <p className="text-sm text-muted-foreground">Concepts Mastered</p>
                                        </div>
                                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {(dashboardData as any)?.average_score ? `${((dashboardData as any).average_score * 100).toFixed(1)}%` : '0%'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Average Score</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600">{(dashboardData as any)?.streak_days || 0}</p>
                                            <p className="text-sm text-muted-foreground">Day Streak</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default AnalyticsPage;
