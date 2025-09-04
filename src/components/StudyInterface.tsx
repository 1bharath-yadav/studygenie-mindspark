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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-screen">
          {/* Left Panel - Prompt Interface (30%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="glass-effect rounded-xl p-6 animate-slide-up">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    StudyGenie
                  </h1>
                  <p className="text-sm text-muted-foreground">AI-Powered Learning</p>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex space-x-2">
                <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
                <Badge variant={hasApiKey ? "default" : "secondary"} className="text-xs">
                  {hasApiKey ? "API Key Active" : "No API Key"}
                </Badge>
              </div>
            </div>

            {/* File Upload */}
            <Card className="glass-effect border-0 animate-slide-up">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Upload Materials</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploadZone disabled={!hasApiKey} />
              </CardContent>
            </Card>

            {/* Prompt Interface */}
            <Card className="glass-effect border-0 animate-slide-up">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  <span>Ask StudyGenie</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What would you like to learn today? Ask questions, request summaries, or generate study materials..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none bg-muted/20 border-border/50 focus:border-primary/50 transition-smooth"
                  disabled={!hasApiKey}
                />
                <Button 
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim() || isProcessing || !hasApiKey}
                  className="w-full"
                  variant="default"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect border-0 animate-slide-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="sm" className="h-auto py-3 flex-col space-y-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Generate Quiz</span>
                </Button>
                <Button variant="secondary" size="sm" className="h-auto py-3 flex-col space-y-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs">Create Summary</span>
                </Button>
                <Button variant="secondary" size="sm" className="h-auto py-3 flex-col space-y-1">
                  <Brain className="h-4 w-4" />
                  <span className="text-xs">Flashcards</span>
                </Button>
                <Button variant="secondary" size="sm" className="h-auto py-3 flex-col space-y-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Smart Tutor</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Content Visualization (70%) */}
          <div className="lg:col-span-7 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted/20 backdrop-blur-sm">
                <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="quiz" className="text-xs sm:text-sm">Quiz</TabsTrigger>
                <TabsTrigger value="flashcards" className="text-xs sm:text-sm">Flashcards</TabsTrigger>
                <TabsTrigger value="chat" className="text-xs sm:text-sm">Tutor Chat</TabsTrigger>
                <TabsTrigger value="progress" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-effect border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-primary rounded-lg">
                          <Clock className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Study Time</p>
                          <p className="text-lg font-semibold">2h 35m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-secondary rounded-lg">
                          <Target className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quizzes</p>
                          <p className="text-lg font-semibold">12 Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-accent rounded-lg">
                          <Trophy className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Streak</p>
                          <p className="text-lg font-semibold">7 Days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-primary rounded-lg">
                          <BarChart3 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                          <p className="text-lg font-semibold">89%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-effect border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span>Subject Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {progressData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.subject}</span>
                            <span className="text-muted-foreground">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-accent" />
                        <span>Achievements</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20">
                          <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                          <span className="font-medium">{achievement.title}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Progress Chart */}
                <Card className="glass-effect border-0">
                  <CardHeader>
                    <CardTitle>Learning Progress Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz Tab */}
              <TabsContent value="quiz" className="animate-fade-in">
                <QuizComponent />
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards" className="animate-fade-in">
                <FlashcardViewer />
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="animate-fade-in">
                <ChatInterface />
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="animate-fade-in">
                <Card className="glass-effect border-0">
                  <CardHeader>
                    <CardTitle>Detailed Analytics</CardTitle>
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