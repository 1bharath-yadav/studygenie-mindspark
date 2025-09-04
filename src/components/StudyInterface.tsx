import React, { useState } from 'react';
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
import { 
  Send, 
  BookOpen, 
  Brain, 
  Upload, 
  BarChart3, 
  Target,
  Trophy,
  Clock,
  Zap
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
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setPrompt('');
  };

  // Sample data for demonstrations
  const progressData = [
    { subject: 'Mathematics', progress: 85, color: 'hsl(var(--primary))' },
    { subject: 'Physics', progress: 72, color: 'hsl(var(--secondary))' },
    { subject: 'Chemistry', progress: 68, color: 'hsl(var(--accent))' },
    { subject: 'Biology', progress: 91, color: 'hsl(var(--success))' },
  ];

  const achievements = [
    { title: '7-Day Streak', icon: Trophy, color: 'text-warning' },
    { title: 'Quiz Master', icon: Target, color: 'text-primary' },
    { title: 'Speed Learner', icon: Zap, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Theme Toggle */}
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
          {/* Left Panel - Prompt Interface (33%) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Status Cards */}
            <div className="glass-effect rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Authentication</span>
                  <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
                    {isAuthenticated ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Access</span>
                  <Badge variant={hasApiKey ? "default" : "secondary"} className="text-xs">
                    {hasApiKey ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <Card className="glass-effect border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                  <Upload className="h-4 w-4 text-primary" />
                  <span>Upload Study Materials</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploadZone disabled={!hasApiKey} />
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="glass-effect border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                  <Brain className="h-4 w-4 text-primary" />
                  <span>AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ask me anything about your study materials. I can create quizzes, summaries, flashcards, and answer questions..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={!hasApiKey}
                />
                <Button 
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim() || isProcessing || !hasApiKey}
                  className="w-full"
                  variant="default"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>
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
                          <p className="text-sm font-semibold">2h 35m</p>
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
                          <p className="text-sm font-semibold">12</p>
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
                          <p className="text-sm font-semibold">7 Days</p>
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
                          <p className="text-sm font-semibold">89%</p>
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
                      {progressData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.subject}</span>
                            <span className="text-muted-foreground">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-1.5" />
                        </div>
                      ))}
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
                      {achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                          <achievement.icon className={`h-4 w-4 ${achievement.color}`} />
                          <span className="text-sm font-medium">{achievement.title}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Progress Chart */}
                <Card className="glass-effect border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Learning Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz Tab */}
              <TabsContent value="quiz">
                <QuizComponent />
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards">
                <FlashcardViewer />
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
                    <ProgressChart detailed />
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