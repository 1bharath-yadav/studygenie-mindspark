import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';
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
    Clock,
    ChevronRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Star,
    Award,
    CheckCircle2,
    ArrowRight,
    Mouse
} from 'lucide-react';
import { Mail, Linkedin } from 'lucide-react';

// Local media assets (bundle-resolved by Vite)
// Prefer modern, smaller WebP images when available. Fall back to the original PNGs if needed.
import img1 from '../../assets/1.webp';
import img2 from '../../assets/2.webp';
import img3 from '../../assets/3.webp';
import mainGif from '../../assets/main.gif';

const StudyGenieLanding = () => {
    // ...existing code... (assets imported at top-level)
    const [isLoading, setIsLoading] = useState(true);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [hoveredElement, setHoveredElement] = useState(null);
    const [videoStates, setVideoStates] = useState({
        video1: { playing: false, muted: true },
        video2: { playing: false, muted: true }
    });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const demoRef = useRef(null);
    const [demoVisible, setDemoVisible] = useState(false);

    // Media assets (imported so the bundler resolves their final URLs)
    const mediaAssets = {
        images: [
            // @ts-ignore
            img1,
            // @ts-ignore
            img2,
            // @ts-ignore
            img3
        ],
        gifs: [
            // @ts-ignore
            mainGif
        ]
    };

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Learning",
            description: "Advanced AI creates personalized study materials tailored to your learning style and pace.",
            color: "from-blue-400 to-purple-600"
        },
        {
            icon: FileText,
            title: "Smart Content Generation",
            description: "Upload any document and get instant flashcards, quizzes, and summaries generated automatically.",
            color: "from-green-400 to-blue-600"
        },
        {
            icon: MessageSquare,
            title: "Interactive AI Tutor",
            description: "Chat with your personal AI tutor for explanations, clarifications, and study guidance.",
            color: "from-purple-400 to-pink-600"
        },
        {
            icon: BarChart3,
            title: "Progress Tracking",
            description: "Detailed analytics and insights to track your learning progress and identify improvement areas.",
            color: "from-orange-400 to-red-600"
        },
        {
            icon: Target,
            title: "Adaptive Learning",
            description: "Dynamic difficulty adjustment based on your performance and learning patterns.",
            color: "from-teal-400 to-blue-600"
        },
        {
            icon: Clock,
            title: "Study Scheduling",
            description: "Smart scheduling recommendations to optimize your study sessions and retention.",
            color: "from-indigo-400 to-purple-600"
        }
    ];

    const testimonials = [
        {
            name: "M sunkiah",
            role: "sleep",
            content: "The worst site i ever seen!",
            rating: -Infinity,
            avatar: "👩‍⚕️"
        },
        {
            name: "Mike Chen",
            role: "Computer Science Student",
            content: "The AI tutor is incredible. It's like having a personal teacher available 24/7.",
            rating: 5,
            avatar: "👨‍💻"
        },
        {
            name: "Emily Rodriguez",
            role: "Law Student",
            content: "Creating study materials from my textbooks has never been easier. Highly recommended!",
            rating: 5,
            avatar: "👩‍⚖️"
        }
    ];

    const stats = [
        { value: "0", label: "Active Students", icon: Users },
        { value: "0%", label: "Success Rate", icon: TrendingUp },
        { value: "—", label: "AI Support", icon: MessageSquare },
        { value: "0", label: "Universities", icon: Award }
    ];

    // Loading simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e) => {
            setCursorPos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Force page to dark theme for this landing page
    useEffect(() => {
        try {
            document.documentElement.classList.add('dark');
        } catch (e) {}
        return () => {
            try { document.documentElement.classList.remove('dark'); } catch (e) {}
        };
    }, []);

    // Scroll progress
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            setScrollProgress(scrollPercent);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Demo section visibility observer for fade-up animation
    useEffect(() => {
        if (!demoRef.current) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setDemoVisible(true);
            });
        }, { threshold: 0.25 });
        obs.observe(demoRef.current);
        return () => obs.disconnect();
    }, [demoRef]);
    // ...existing code...

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    const handleVideoToggle = (videoId) => {
        setVideoStates(prev => ({
            ...prev,
            [videoId]: {
                ...prev[videoId],
                playing: !prev[videoId].playing
            }
        }));
    };

    const handleMuteToggle = (videoId) => {
        setVideoStates(prev => ({
            ...prev,
            [videoId]: {
                ...prev[videoId],
                muted: !prev[videoId].muted
            }
        }));
    };

    const { login } = useAuth();

    const handleGetStarted = async () => {
        // Direct the user to the backend login redirect endpoint so the flow is explicit
        try {
            window.location.href = `${API_BASE_URL}${API_ENDPOINTS.auth.login}`;
        } catch (e) {
            // Fallback: call context-based login
            if (typeof login === 'function') await login();
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-[#C6DBF0] via-[#CFE8EF] to-white flex items-center justify-center">
                <div className="text-center space-y-6">
                    {/* Spinner removed — using animated horizontal loader below */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[#3E4C5E]">StudyGenie</h2>
                        <p className="text-[#3E4C5E]/70">Loading your AI-powered learning experience...</p>
                    </div>
                    <div className="landing-loader">
                        <div className="indeterminate" aria-hidden="true" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#C6DBF0] via-[#CFE8EF] to-white relative overflow-x-hidden">
            {/* Custom cursor emitter: small rectangular emitter with tiny blue sprinkles */}
            <div className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2" style={{ left: cursorPos.x, top: cursorPos.y }}>
                <div className={`relative transition-transform duration-300 ${hoveredElement ? 'scale-125' : ''}`}>
                    <div className="cursor-emitter w-1.5 h-3 relative">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className={`sprinkle sprinkle-${i + 1}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Scroll Progress */}
            <div className="fixed top-0 left-0 w-full h-1 bg-white/30 z-40">
                <div 
                    className="h-full bg-gradient-to-r from-[#3E4C5E] to-blue-600 transition-all duration-200"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Floating bubbles - randomized non-linear placement */}
            <div className="fixed inset-0 pointer-events-none z-10">
                {Array.from({ length: 10 }).map((_, i) => {
                    const left = Math.floor(Math.random() * 90) + '%';
                    const top = Math.floor(Math.random() * 80) + '%';
                    const size = `${6 + (i % 4) * 3}px`;
                    const delay = `${i * 0.4}s`;
                    const duration = `${4 + (i % 5)}s`;
                    return (
                        <div key={i} className="absolute opacity-20 animate-bob" style={{ left, top, width: size, height: size, animationDelay: delay, animationDuration: duration }}>
                            <div className="w-full h-full bg-white/6 rounded-full blur-sm" />
                        </div>
                    );
                })}
            </div>

            {/* Navigation */}
            <nav className="fixed top-4 left-0 right-0 px-4 z-30">
                <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 shadow-lg">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-gradient-to-r from-[#3E4C5E] to-blue-600 rounded-full">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-[#3E4C5E]">StudyGenie</span>
                        </div>
                        <div className="hidden lg:flex items-center space-x-4 text-sm">
                            <a href="#features" className="text-[#3E4C5E]/70 hover:text-[#3E4C5E] transition-colors">Features</a>
                            <a href="#demo" className="text-[#3E4C5E]/70 hover:text-[#3E4C5E] transition-colors">Demo</a>
                            <a href="#testimonials" className="text-[#3E4C5E]/70 hover:text-[#3E4C5E] transition-colors">Reviews</a>
                        </div>
                        <div className="ml-auto lg:hidden flex items-center">
                            {/* Mobile hamburger placeholder */}
                            <button className="p-2 rounded-md bg-white/10 text-white">Menu</button>
                        </div>
                        <button 
                            className="bg-gradient-to-r from-[#3E4C5E] to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            onClick={() => void handleGetStarted()}
                            onMouseEnter={() => setHoveredElement('nav-cta')}
                            onMouseLeave={() => setHoveredElement(null)}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6">
                <div className="text-center space-y-8 max-w-6xl mx-auto">
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="inline-flex items-center bg-white/60 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm">
                            <Sparkles className="h-4 w-4 text-[#3E4C5E] mr-2 animate-pulse" />
                            <span className="text-[#3E4C5E] font-medium">AI-Powered Study Revolution</span>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl font-black">
                            <span className="bg-gradient-to-r from-[#3E4C5E] via-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Study
                            </span>
                            <span className="text-[#3E4C5E]">Genie</span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-[#3E4C5E]/80 max-w-3xl mx-auto leading-relaxed">
                            Transform any content into personalized learning materials with the power of AI. 
                            <span className="block mt-2 font-semibold">Learn faster. Retain more. Achieve excellence.</span>
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button 
                            className="group bg-gradient-to-r from-[#3E4C5E] to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
                            onClick={() => void handleGetStarted()}
                            onMouseEnter={() => setHoveredElement('hero-cta')}
                            onMouseLeave={() => setHoveredElement(null)}
                        >
                            <Brain className="h-5 w-5 mr-2 group-hover:animate-spin" />
                            Start Learning
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                        {stats.map((stat, index) => (
                            <div 
                                key={index}
                                className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/60 transition-all duration-300 transform hover:scale-105"
                                onMouseEnter={() => setHoveredElement(`stat-${index}`)}
                                onMouseLeave={() => setHoveredElement(null)}
                            >
                                <stat.icon className="h-8 w-8 text-[#3E4C5E] mx-auto mb-2" />
                                <div className="text-2xl font-bold text-[#3E4C5E]">{stat.value}</div>
                                <div className="text-sm text-[#3E4C5E]/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hero Background Animation */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-1/3 right-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" ref={featuresRef} className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-6 mb-20">
                        <h2 className="text-4xl md:text-6xl font-bold text-[#3E4C5E]">
                            Powerful Features for 
                            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Smarter Learning
                            </span>
                        </h2>
                        <p className="text-xl text-[#3E4C5E]/70 max-w-3xl mx-auto">
                            Discover how StudyGenie revolutionizes your learning experience with cutting-edge AI technology
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="group bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/80 transition-all duration-500 transform hover:scale-105 hover:shadow-xl"
                                onMouseEnter={() => setHoveredElement(`feature-${index}`)}
                                onMouseLeave={() => setHoveredElement(null)}
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-4 bg-gradient-to-r ${feature.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                                            <feature.icon className="h-8 w-8 text-white" />
                                        </div>
                                        <ChevronRight className="h-6 w-6 text-[#3E4C5E]/40 group-hover:text-[#3E4C5E] group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-bold text-[#3E4C5E] mb-3 group-hover:text-blue-600 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-[#3E4C5E]/70 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/20">
                                    <div className="flex items-center text-sm text-[#3E4C5E]/60 group-hover:text-[#3E4C5E] transition-colors">
                                        <span>Learn more</span>
                                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className="py-24 px-6 bg-gradient-to-r from-[#C6DBF0]/50 to-[#CFE8EF]/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-6 mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#3E4C5E]">See StudyGenie in Action</h2>
                        <p className="text-xl text-[#3E4C5E]/70">Experience the power of AI-driven learning</p>
                    </div>

                    <div ref={demoRef} className={`max-w-6xl mx-auto grid gap-8 ${demoVisible ? 'animate-slide-up' : 'opacity-0'}`}>
                        <div className="mx-auto w-full md:w-4/5 lg:w-3/5">
                            <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-2 border border-white/20 overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center">
                                    <img src={mediaAssets.gifs[0]} alt="Platform demo" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6">
                                {mediaAssets.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className="aspect-square bg-gradient-to-br from-[#C6DBF0] to-[#CFE8EF] rounded-xl border border-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                                        onMouseEnter={() => setHoveredElement(`image-${index}`)}
                                        onMouseLeave={() => setHoveredElement(null)}
                                    >
                                        <div className="text-center space-y-2">
                                            <div className="w-8 h-8 bg-[#3E4C5E] rounded-lg flex items-center justify-center mx-auto">
                                                <FileText className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="text-xs text-[#3E4C5E]/70">Preview {index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-6 mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#3E4C5E]">What Students Say</h2>
                        <p className="text-xl text-[#3E4C5E]/70">Join thousands of successful learners</p>
                    </div>

                    <div className="relative">
                        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 max-w-4xl mx-auto">
                            <div className="text-center space-y-6">
                                <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                                
                                <div className="flex justify-center space-x-1 mb-4">
                                    {(() => {
                                        const raw = testimonials[currentTestimonial]?.rating;
                                        const n = Number.isFinite(raw) ? Math.max(0, Math.min(5, Math.floor(raw as number))) : 0;
                                        return [...Array(n)].map((_, i) => (
                                            <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                                        ));
                                    })()}
                                </div>
                                
                                <blockquote className="text-xl md:text-2xl text-[#3E4C5E] italic leading-relaxed">
                                    "{testimonials[currentTestimonial].content}"
                                </blockquote>
                                
                                <div className="space-y-1">
                                    <div className="font-bold text-[#3E4C5E] text-lg">
                                        {testimonials[currentTestimonial].name}
                                    </div>
                                    <div className="text-[#3E4C5E]/70">
                                        {testimonials[currentTestimonial].role}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Navigation */}
                        <div className="flex justify-center space-x-2 mt-8">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        index === currentTestimonial 
                                            ? 'bg-[#3E4C5E] w-6' 
                                            : 'bg-[#3E4C5E]/30 hover:bg-[#3E4C5E]/50'
                                    }`}
                                    onClick={() => setCurrentTestimonial(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-gradient-to-r from-[#3E4C5E] to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse animation-delay-2000"></div>
                </div>
                
                <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-6xl font-bold text-white">
                            Ready to Transform Your Learning?
                        </h2>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                            We're launching StudyGenie in early access — join our pilot to help shape the product.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            className="group bg-white text-[#3E4C5E] px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center"
                            onClick={() => void handleGetStarted()}
                            onMouseEnter={() => setHoveredElement('final-cta')}
                            onMouseLeave={() => setHoveredElement(null)}
                        >
                            <Sparkles className="h-6 w-6 mr-3 group-hover:animate-spin" />
                            Start Your Free Trial
                            <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                            className="group border-2 border-white/30 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 flex items-center"
                            onMouseEnter={() => setHoveredElement('contact-cta')}
                            onMouseLeave={() => setHoveredElement(null)}
                        >
                            <MessageSquare className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                            Talk to Expert
                        </button>
                    </div>

                    <div className="pt-8 space-y-4">
                        <div className="flex flex-wrap justify-center items-center gap-6 text-white/80">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-5 w-5 text-green-300" />
                                <span className="text-sm">No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-5 w-5 text-green-300" />
                                <span className="text-sm">14-day free trial</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-5 w-5 text-green-300" />
                                <span className="text-sm">Cancel anytime</span>
                            </div>
                        </div>

                        <div className="text-white/60 text-sm">
                            Pilot program: currently available to early users
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#3E4C5E] text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-xl">StudyGenie</div>
                                    <div className="text-xs text-white/60">AI-Powered Learning</div>
                                </div>
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">
                                Transforming education through intelligent AI technology. 
                                Learn smarter, not harder.
                            </p>
                            <div className="flex space-x-4">
                                <a
                                    href="https://www.linkedin.com/in/bharathyadav44"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                    onMouseEnter={() => setHoveredElement('social-linkedin')}
                                    onMouseLeave={() => setHoveredElement(null)}
                                >
                                    <Linkedin className="h-4 w-4 text-white/90" />
                                </a>

                                <a
                                    href="mailto:bharath.yadav9014@gmail.com"
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                    onMouseEnter={() => setHoveredElement('social-mail')}
                                    onMouseLeave={() => setHoveredElement(null)}
                                >
                                    <Mail className="h-4 w-4 text-white/90" />
                                </a>
                            </div>
                        </div>

                        {/* Product */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Product</h3>
                            <div className="space-y-2 text-sm text-white/70">
                                {['Features', 'Pricing', 'API', 'Integrations', 'Updates'].map((item) => (
                                    <div 
                                        key={item}
                                        className="hover:text-white transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredElement(`footer-${item}`)}
                                        onMouseLeave={() => setHoveredElement(null)}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Support */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Support</h3>
                            <div className="space-y-2 text-sm text-white/70">
                                {['Help Center', 'Community', 'Tutorials', 'Contact Us', 'Status'].map((item) => (
                                    <div 
                                        key={item}
                                        className="hover:text-white transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredElement(`support-${item}`)}
                                        onMouseLeave={() => setHoveredElement(null)}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Company</h3>
                            <div className="space-y-2 text-sm text-white/70">
                                {['About', 'Careers', 'Press', 'Legal', 'Privacy'].map((item) => (
                                    <div 
                                        key={item}
                                        className="hover:text-white transition-colors cursor-pointer"
                                        onMouseEnter={() => setHoveredElement(`company-${item}`)}
                                        onMouseLeave={() => setHoveredElement(null)}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-white/10 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="text-white/60 text-sm">
                                © 2025 StudyGenie. All rights reserved.
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-white/60">
                                <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                                <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                                <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }

                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out;
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }

                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3E4C5E, #60a5fa);
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #2d3748, #3b82f6);
                }

                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }

                /* Do not hide the default cursor globally — keep native cursor for accessibility */
                /* Interactive elements explicitly get pointer cursor where appropriate */
                button, a, [role="button"] {
                    cursor: pointer !important;
                }
            `}</style>
        </div>
    );
};

export default StudyGenieLanding;