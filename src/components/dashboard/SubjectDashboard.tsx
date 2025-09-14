import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
    BookOpen,
    Target,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    AlertCircle,
    Clock,
    Brain,
    Zap,
    Award
} from 'lucide-react';

interface Subject {
    subject_name: string;
    total_concepts: number;
    mastered_concepts: number;
    mastery_percentage: number;
    chapters: {
        [key: string]: {
            concepts: Array<{
                concept_name: string;
                mastery_score: number;
                status: string;
                last_practiced?: string;
                attempts_count: number;
            }>;
        };
    };
}

interface SubjectDashboardProps {
    subjects: Subject[];
    weaknessData?: any;
    progressData?: any;
}

export const SubjectDashboard: React.FC<SubjectDashboardProps> = ({
    subjects = [],
    weaknessData,
    progressData
}) => {
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null); const getSubjectColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        if (percentage >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getConceptStatusIcon = (status: string, score: number) => {
        if (status === 'mastered' || score >= 80) {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (score >= 60) {
            return <Target className="h-4 w-4 text-yellow-600" />;
        } else {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        }
    };

    const getConceptBackgroundColor = (status: string, score: number) => {
        // Use dark backgrounds with good contrast
        return 'bg-gray-800 hover:bg-gray-700 border border-gray-600';
    };

    const getConceptTextColor = (status: string, score: number) => {
        // Use light text colors for good contrast against dark background
        return 'text-gray-100';
    };

    const getConceptStatusColor = (status: string, score: number) => {
        if (status === 'mastered' || score >= 80) return 'bg-green-100 text-green-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const formatLastPracticed = (dateString?: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="glass-effect">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                                <p className="text-xl font-bold">{subjects.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-green-100">
                                <Target className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Concepts</p>
                                <p className="text-xl font-bold">
                                    {subjects.reduce((sum, subject) => sum + subject.total_concepts, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Mastered</p>
                                <p className="text-xl font-bold">
                                    {subjects.reduce((sum, subject) => sum + subject.mastered_concepts, 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-yellow-100">
                                <Brain className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Overall Progress</p>
                                <p className="text-xl font-bold">
                                    {Math.round(
                                        subjects.reduce((sum, subject) => sum + subject.mastery_percentage, 0) /
                                        Math.max(subjects.length, 1)
                                    )}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subjects Grid - 4 cards per row on large screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {subjects.map((subject, index) => (
                    <Dialog key={index}>
                        <DialogTrigger asChild>
                            <Card className="glass-effect cursor-pointer hover:shadow-lg transition-all duration-200 group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                            {subject.subject_name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-xs">
                                            {subject.total_concepts} concepts
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-medium">{Math.round(subject.mastery_percentage)}%</span>
                                                </div>
                                                {/* If chapter breakdown missing, use total_concepts to show progress */}
                                                <Progress
                                                    value={subject.mastery_percentage}
                                                    className="h-2"
                                                />
                                            </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-muted-foreground">
                                                    {subject.mastered_concepts} mastered
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Target className="h-4 w-4 text-orange-600" />
                                                <span className="text-muted-foreground">
                                                    {subject.total_concepts - subject.mastered_concepts} remaining
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Status */}
                                        <div className="flex items-center justify-between">
                                            <div className={`w-3 h-3 rounded-full ${getSubjectColor(subject.mastery_percentage)}`}></div>
                                            <Button variant="ghost" size="sm" className="h-8">
                                                View Details →
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>

                        {/* Subject Details Modal */}
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                    <BookOpen className="h-5 w-5" />
                                    <span>{subject.subject_name} - Detailed Progress</span>
                                </DialogTitle>
                                <DialogDescription>
                                    View detailed progress and concept breakdown for {subject.subject_name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Subject Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {subject.total_concepts}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Concepts</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {subject.mastered_concepts}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Mastered</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {Math.round(subject.mastery_percentage)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Overall Progress</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Chapters and Concepts */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                                        <Brain className="h-5 w-5" />
                                        <span>Concepts by Chapter</span>
                                    </h3>

                                    {Object.keys(subject.chapters || {}).length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground">No chapter breakdown available for this subject yet.</div>
                                    ) : (
                                        Object.entries(subject.chapters || {}).map(([chapterName, chapterData]) => {
                                            return (
                                                <Card key={chapterName} className="border-l-4 border-l-primary">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base">{chapterName}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid gap-3">
                                                            {(chapterData.concepts || []).map((concept, conceptIndex) => (
                                                                <div
                                                                    key={conceptIndex}
                                                                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${getConceptBackgroundColor(concept.status, concept.mastery_score)}`}
                                                                >
                                                                    <div className="flex items-center space-x-3">
                                                                        {getConceptStatusIcon(concept.status, concept.mastery_score)}
                                                                        <div>
                                                                            <div className={`font-medium ${getConceptTextColor(concept.status, concept.mastery_score)}`}>
                                                                                {concept.concept_name || 'Unnamed Concept'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-400">
                                                                                {concept.attempts_count || 0} attempts • Last: {formatLastPracticed(concept.last_practiced)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-3">
                                                                        <Badge
                                                                            className={getConceptStatusColor(concept.status, concept.mastery_score)}
                                                                        >
                                                                            {Math.round(concept.mastery_score || 0)}%
                                                                        </Badge>
                                                                        <div className="w-20">
                                                                            <Progress value={concept.mastery_score || 0} className="h-2" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Weak Areas for this Subject */}
                                {weaknessData?.weak_concepts?.filter((weak: any) =>
                                    weak.subject_name === subject.subject_name
                                ).length > 0 && (
                                        <Card className="border-l-4 border-l-red-500">
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center space-x-2">
                                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                                    <span>Areas Needing Attention</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {weaknessData.weak_concepts
                                                        .filter((weak: any) => weak.subject_name === subject.subject_name)
                                                        .map((weak: any, index: number) => (
                                                            <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800 border border-gray-600">
                                                                <span className="font-medium text-gray-100">{weak.concept_name}</span>
                                                                <Badge variant="destructive">
                                                                    {Math.round(weak.mastery_level)}% mastery
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>

            {/* No Subjects State */}
            {subjects.length === 0 && (
                <Card className="glass-effect">
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Subjects Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start learning to see your subjects and progress here.
                        </p>
                        <Button>
                            Start Learning
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
