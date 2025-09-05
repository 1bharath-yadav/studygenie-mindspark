import React, { useState } from 'react';
import { AnalyticsDashboard } from '@/components/charts/AnalyticsDashboard';
import { SubjectDashboard } from '@/components/dashboard/SubjectDashboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser, useDashboardAnalytics, useProgressAnalytics, useWeaknessAnalysis, useWeeklyTrends } from '@/hooks/useApi';
import { BarChart3, TrendingUp, BookOpen, Target } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('subjects');
    const { data: currentUser } = useCurrentUser();
    const studentId = currentUser?.email || '';

    const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardAnalytics(studentId);
    const { data: progressAnalytics, isLoading: progressLoading, error: progressError } = useProgressAnalytics(studentId);
    const { data: weeklyTrendsData, isLoading: trendsLoading, error: trendsError } = useWeeklyTrends(studentId);
    const { data: weaknessData, isLoading: weaknessLoading, error: weaknessError } = useWeaknessAnalysis(studentId);

    if (!studentId) {
        return (
            <AppLayout title="Authentication Required" icon={BarChart3}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isLoading = dashboardLoading || progressLoading || trendsLoading || weaknessLoading;
    const hasError = dashboardError || progressError || trendsError || weaknessError;

    // Extract subjects data from dashboard analytics
    const dashboardDataTyped = dashboardData as any;
    const subjectsData = dashboardDataTyped?.data?.subjects_analytics ?
        Object.entries(dashboardDataTyped.data.subjects_analytics).map(([subjectName, data]: [string, any]) => ({
            subject_name: subjectName,
            total_concepts: data.total_concepts || 0,
            mastered_concepts: data.mastered_concepts || 0,
            mastery_percentage: data.mastery_percentage || 0,
            chapters: data.chapters || {}
        })) : []; return (
            <AppLayout
                title="Learning Dashboard"
                subtitle={`Track your progress and insights • ${currentUser?.name}`}
                icon={BarChart3}
            >
                <div className="w-full px-4 lg:px-6 py-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
                        </div>
                    ) : hasError ? (
                        <Card className="glass-effect">
                            <CardContent className="text-center py-12">
                                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
                                <p className="text-muted-foreground mb-4">
                                    {dashboardError?.message || progressError?.message || trendsError?.message || weaknessError?.message || 'Please try again later'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="subjects" className="flex items-center space-x-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>My Subjects</span>
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Analytics</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="subjects" className="space-y-6">
                                <SubjectDashboard
                                    subjects={subjectsData}
                                    weaknessData={weaknessData}
                                    progressData={progressAnalytics}
                                />
                            </TabsContent>

                            <TabsContent value="analytics" className="space-y-6">
                                <AnalyticsDashboard
                                    dashboardData={dashboardData}
                                    progressData={progressAnalytics}
                                    weeklyTrends={Array.isArray(weeklyTrendsData) ? weeklyTrendsData : []}
                                    weaknessData={weaknessData}
                                />
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </AppLayout>
        );
};

export default DashboardPage;
