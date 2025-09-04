import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthCheck } from '@/hooks/useApi';
import {
    Brain,
    BookOpen,
    Zap,
    Target,
    TrendingUp,
    Users,
    Shield,
    Sparkles,
    FileText,
    MessageSquare,
    BarChart3,
    Clock
} from 'lucide-react';

const LandingPage = () => {
    const { login } = useAuth();
    const { data: healthData, isLoading: healthLoading } = useHealthCheck();

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Learning",
            description: "Advanced AI creates personalized study materials tailored to your learning style and pace."
        },
        {
            icon: FileText,
            title: "Smart Content Generation",
            description: "Upload any document and get instant flashcards, quizzes, and summaries generated automatically."
        },
        {
            icon: MessageSquare,
            title: "Interactive AI Tutor",
            description: "Chat with your personal AI tutor for explanations, clarifications, and study guidance."
        },
        {
            icon: BarChart3,
            title: "Progress Tracking",
            description: "Detailed analytics and insights to track your learning progress and identify improvement areas."
        },
        {
            icon: Target,
            title: "Adaptive Learning",
            description: "Dynamic difficulty adjustment based on your performance and learning patterns."
        },
        {
            icon: Clock,
            title: "Study Scheduling",
            description: "Smart scheduling recommendations to optimize your study sessions and retention."
        }
    ];

    const benefits = [
        "Personalized learning experience",
        "Instant content generation from any material",
        "24/7 AI tutoring support",
        "Comprehensive progress analytics",
        "Multi-format study materials",
        "Adaptive difficulty levels"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Brain className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">StudyGenie</h1>
                            <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {!healthLoading && healthData && (
                            <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
                                {healthData.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
                            </Badge>
                        )}
                        <Button onClick={login} size="lg" className="relative overflow-hidden group">
                            <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                            Sign In with Google
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-16 pb-24">
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <div className="space-y-4">
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            🚀 AI-Powered Study Platform
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            StudyGenie
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                            Transform any content into personalized learning materials with the power of AI
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button onClick={login} size="lg" className="text-lg px-8 py-6">
                            <Brain className="h-5 w-5 mr-2" />
                            Start Learning Now
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                            <BookOpen className="h-5 w-5 mr-2" />
                            Learn More
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-center">
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">10K+</div>
                            <div className="text-sm text-muted-foreground">Study Materials</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">95%</div>
                            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">24/7</div>
                            <div className="text-sm text-muted-foreground">AI Support</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">100+</div>
                            <div className="text-sm text-muted-foreground">Subjects</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-24">
                <div className="text-center space-y-6 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Powerful Features for Smarter Learning</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Discover how StudyGenie revolutionizes your learning experience with cutting-edge AI technology
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors group">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-4 py-24 bg-muted/20">
                <div className="text-center space-y-6 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">How StudyGenie Works</h2>
                    <p className="text-lg text-muted-foreground">
                        Three simple steps to transform your learning experience
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                            <span className="text-2xl font-bold text-primary-foreground">1</span>
                        </div>
                        <h3 className="text-xl font-semibold">Upload Content</h3>
                        <p className="text-muted-foreground">
                            Upload any document, PDF, or text content you want to study
                        </p>
                    </div>

                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                            <span className="text-2xl font-bold text-primary-foreground">2</span>
                        </div>
                        <h3 className="text-xl font-semibold">AI Processing</h3>
                        <p className="text-muted-foreground">
                            Our AI analyzes and generates personalized study materials instantly
                        </p>
                    </div>

                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                            <span className="text-2xl font-bold text-primary-foreground">3</span>
                        </div>
                        <h3 className="text-xl font-semibold">Start Learning</h3>
                        <p className="text-muted-foreground">
                            Access flashcards, quizzes, and get AI tutoring support
                        </p>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="container mx-auto px-4 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Why Choose StudyGenie?
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Experience the future of personalized learning with our advanced AI-powered platform.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                        <Zap className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                    <span className="text-sm">{benefit}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={login} size="lg" className="mt-6">
                            <Users className="h-5 w-5 mr-2" />
                            Join StudyGenie Today
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <Card className="p-6 border-2 border-primary/20">
                            <div className="flex items-center space-x-3 mb-4">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-semibold">Boost Learning Efficiency</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Students report 60% faster learning and 85% better retention rates using StudyGenie.
                            </p>
                        </Card>

                        <Card className="p-6 border-2 border-primary/20">
                            <div className="flex items-center space-x-3 mb-4">
                                <Shield className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-semibold">Secure & Private</h3>
                            </div>
                            <p className="text-muted-foreground">
                                Your data is encrypted and secure. We prioritize your privacy and never share your content.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-24">
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Ready to Transform Your Learning?
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Join thousands of students already using StudyGenie to achieve their academic goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={login} size="lg" className="text-lg px-8 py-6">
                            <Sparkles className="h-5 w-5 mr-2" />
                            Get Started Free
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Contact Support
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-muted/30">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-2">
                            <Brain className="h-5 w-5 text-primary" />
                            <span className="font-semibold">StudyGenie</span>
                            <span className="text-muted-foreground">© 2025 All rights reserved</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                            <span>Support</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
