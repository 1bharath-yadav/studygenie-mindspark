import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressChart } from '@/components/charts/ProgressChart';
import { QuizComponent } from '@/components/study/QuizComponent';
import { FlashcardViewer } from '@/components/study/FlashcardViewer';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { IntegratedAIAssistant } from '@/components/IntegratedAIAssistant';
import { useApiKeys, useApiKeyStatus, useCurrentUser, useDashboardAnalytics, useProgressAnalytics, useAchievements } from '@/hooks/useApi';
import {
  Send,
  BookOpen,
  Brain,
  Upload,
  BarChart3,
  Target,
  Trophy,
  Clock,
  Zap,
  Settings,
  User
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface StudyInterfaceProps {
  isAuthenticated?: boolean;
  hasApiKey?: boolean;
}

export const StudyInterface: React.FC<StudyInterfaceProps> = ({
  isAuthenticated = true,
  hasApiKey = true
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [learningContent, setLearningContent] = useState<any>(null);

  // Get real data from APIs
  const { data: currentUser } = useCurrentUser();
  const { data: apiKeys } = useApiKeys();
  const { data: apiKeyStatus } = useApiKeyStatus();

  const studentName = currentUser?.name || 'Student';
  const gradeLevel = currentUser?.grade_level || 'High School';

  // Use the dedicated status endpoint for better performance and accuracy
  const hasActiveApiKey = apiKeyStatus?.hasActiveApiKey ||
    (apiKeys && apiKeys.length > 0 && apiKeys.some(key => key.is_active));

  // Get student ID for analytics (use email as student ID since username doesn't exist)
  const studentId = currentUser?.email || 'demo-student';

  // Get real analytics data
  const { data: dashboardData } = useDashboardAnalytics(studentId);
  const { data: progressAnalytics } = useProgressAnalytics(studentId);
  const { data: achievementsData } = useAchievements(studentId);

  // Use real data from API - no fallback to fake subjects
  const progressData = (progressAnalytics as any)?.subjects || [];

  const achievements = (achievementsData as any)?.achievements || [
    { title: 'Getting Started', icon: 'Trophy', color: 'text-warning' },
    { title: 'First Steps', icon: 'Target', color: 'text-primary' },
    { title: 'Keep Learning', icon: 'Zap', color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">StudyGenie</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Learning Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{currentUser.name}</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-none px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
          {/* Left Panel - Prompt Interface (33%) */}
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

            {/* AI Assistant with Integrated File Upload */}
            <Card className="glass-effect border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                  <Brain className="h-4 w-4 text-primary" />
                  <span>AI Study Assistant</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">Upload files and ask questions to get personalized study materials</p>
              </CardHeader>
              <CardContent>
                <IntegratedAIAssistant
                  disabled={!hasActiveApiKey}
                  onContentGenerated={setLearningContent}
                  studentId={studentId}
                  studentName={studentName}
                  gradeLevel={gradeLevel}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-auto py-2 flex-col space-y-1 text-xs">
                  <Target className="h-3 w-3" />
                  <span>Quiz</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2 flex-col space-y-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  <span>Summary</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2 flex-col space-y-1 text-xs">
                  <Brain className="h-3 w-3" />
                  <span>Cards</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2 flex-col space-y-1 text-xs">
                  <Zap className="h-3 w-3" />
                  <span>Tutor</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Content Visualization (67%) */}
          <div className="lg:col-span-8 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted border-border">
                <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="quiz" className="text-sm">Quiz</TabsTrigger>
                <TabsTrigger value="flashcards" className="text-sm">Flashcards</TabsTrigger>
                <TabsTrigger value="chat" className="text-sm">AI Tutor</TabsTrigger>
                <TabsTrigger value="progress" className="text-sm">Analytics</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="glass-effect border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary rounded-lg">
                          <Clock className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Study Time</p>
                          <p className="text-sm font-semibold">{(dashboardData as any)?.study_time || '0h 0m'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-accent rounded-lg">
                          <Target className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quizzes</p>
                          <p className="text-sm font-semibold">{(dashboardData as any)?.quizzes_completed || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-success rounded-lg">
                          <Trophy className="h-4 w-4 text-success-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Streak</p>
                          <p className="text-sm font-semibold">{(dashboardData as any)?.study_streak || '0 Days'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary rounded-lg">
                          <BarChart3 className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                          <p className="text-sm font-semibold">{(dashboardData as any)?.average_score || '0%'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="glass-effect border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>Subject Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {progressData.length > 0 ? (
                        progressData.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{item.subject}</span>
                              <span className="text-muted-foreground">{item.progress}%</span>
                            </div>
                            <Progress value={item.progress} className="h-1.5" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Upload study materials to see your progress
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Trophy className="h-4 w-4 text-success" />
                        <span>Recent Achievements</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {achievements.map((achievement, index) => {
                        const IconComponent = achievement.icon === 'Trophy' ? Trophy :
                          achievement.icon === 'Target' ? Target : Zap;
                        return (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                            <IconComponent className={`h-4 w-4 ${achievement.color}`} />
                            <span className="text-sm font-medium">{achievement.title}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Progress Chart */}
                <Card className="glass-effect border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Learning Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart progressData={progressData} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz Tab */}
              <TabsContent value="quiz">
                <QuizComponent
                  quizData={learningContent?.quiz}
                  disabled={!learningContent}
                />
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards">
                <FlashcardViewer
                  flashcards={learningContent?.flashcards}
                  disabled={!learningContent}
                />
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat">
                <ChatInterface />
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress">
                <Card className="glass-effect border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Detailed Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart detailed progressData={progressData} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};