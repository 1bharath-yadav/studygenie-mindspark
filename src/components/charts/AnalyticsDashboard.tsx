import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardChart } from './DashboardChart';
import { WeeklyTrendsChart } from './WeeklyTrendsChart';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Target,
    BookOpen,
    Trophy,
    Brain,
    Zap
} from 'lucide-react';

interface AnalyticsDashboardProps {
    dashboardData?: any;
    progressData?: any;
    weeklyTrends?: any[];
    weaknessData?: any;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    dashboardData,
    progressData,
    weeklyTrends = [],
    weaknessData
}) => {
    // Extract data from the correct structure
    const analyticsData = dashboardData?.data || {};

    // Format time spent to human readable format
    const formatTime = (minutes: number) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const stats = [
        {
            title: 'Study Time',
            value: formatTime(analyticsData?.time_spent || 0),
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Quizzes Completed',
            value: analyticsData?.quiz_count || 0,
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Study Streak',
            value: `${analyticsData?.study_streak || 0} days`,
            icon: Trophy,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Average Score',
            value: `${Math.round(analyticsData?.quiz_accuracy || 0)}%`,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    const progressChartData = progressData?.subjects?.map((subject: any) => ({
        name: subject.subject,
        value: subject.progress,
        color: subject.color || '#8884d8'
    })) || [];

    const weakAreasData = weaknessData?.weak_concepts?.map((concept: any) => ({
        name: concept.concept_name,
        value: concept.mastery_level,
        subject: concept.subject_name
    })) || [];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="glass-effect">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-effect">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {analyticsData?.total_activities || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Study Sessions</div>
                    </CardContent>
                </Card>
                <Card className="glass-effect">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {analyticsData?.concepts_mastered || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Concepts Mastered</div>
                    </CardContent>
                </Card>
                <Card className="glass-effect">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {Math.round((analyticsData?.quiz_accuracy || 0))}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                    </CardContent>
                </Card>
                <Card className="glass-effect">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {analyticsData?.study_streak || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Day Streak</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Overview */}
                {progressChartData.length > 0 && (
                    <Card className="glass-effect">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <BookOpen className="h-5 w-5" />
                                <span>Subject Progress</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DashboardChart
                                data={progressChartData}
                                type="pie"
                                title=""
                                height={250}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Weekly Trends */}
                {weeklyTrends.length > 0 && (
                    <Card className="glass-effect">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5" />
                                <span>Weekly Trends</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WeeklyTrendsChart data={weeklyTrends} />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Weak Areas */}
            {weakAreasData.length > 0 && (
                <Card className="glass-effect">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="h-5 w-5" />
                            <span>Areas for Improvement</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {weakAreasData.slice(0, 5).map((area: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                            <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{area.name}</p>
                                            <p className="text-sm text-muted-foreground">{area.subject}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={area.value < 40 ? 'destructive' : area.value < 70 ? 'secondary' : 'default'}>
                                            {area.value}% mastery
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {weaknessData?.recommended_actions && weaknessData.recommended_actions.length > 0 && (
                <Card className="glass-effect">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5" />
                            <span>Recommended Actions</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {weaknessData.recommended_actions.map((action: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-full mt-1">
                                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                                    </div>
                                    <p className="text-sm">{action}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
