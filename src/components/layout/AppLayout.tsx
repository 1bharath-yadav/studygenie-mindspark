import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { StudyTimer } from '@/components/StudyTimer';
import { useCurrentUser } from '@/hooks/useApi';
import {
    Menu,
    BookOpen,
    BarChart3,
    Target,
    Home,
    Lightbulb,
    TrendingUp,
    Settings,
    User,
    LogOut,
    Plus
} from 'lucide-react';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    icon?: React.ComponentType<any>;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    title = "StudyGenie",
    subtitle,
    icon: IconComponent
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: currentUser } = useCurrentUser();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement | null>(null);
    const openTimerRef = React.useRef<number | null>(null);

    const menuItems = [
        { id: 'home', label: 'Study Interface', icon: Home, path: '/' },
        { id: 'learning-history', label: 'Learning History', icon: BookOpen, path: '/sessions' }
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        // Add logout logic here
        navigate('/');
        setIsMenuOpen(false);
    };

    const createNewSession = () => {
        try {
            const prev = sessionStorage.getItem('studygenie_session_id');
            // remove persisted chat messages and study materials for the current session
            if (prev) {
                try { localStorage.removeItem(`studygenie_chat_messages_${prev}`); } catch (e) {}
                try { localStorage.removeItem(`studygenie_study_materials_${prev}`); } catch (e) {}
            }
            // notify any components to clear their in-memory state (prompt box, uploaded files, home content)
            try { window.dispatchEvent(new CustomEvent('studygenie:clear-session')); } catch (e) {}
            // also clear session-level storage keys
            try {
                sessionStorage.removeItem('studygenie_session_id');
                sessionStorage.removeItem('studygenie_learning_content');
                sessionStorage.removeItem('studygenie_session_history');
            } catch (e) {}
            // navigate home so the UI resets, then dispatch open-assistant after a short delay
            navigate('/');
            setTimeout(() => {
                try { window.dispatchEvent(new CustomEvent('studygenie:open-assistant')); } catch (e) {}
            }, 120);
            setIsMenuOpen(false);
        } catch (e) {
            console.warn('Failed to create new session', e);
        }
    };

    // Auto-open the left menu when the pointer moves to the far left edge (small debounce)
    React.useEffect(() => {
        const EDGE_THRESHOLD = 8; // px from left edge
        const OPEN_DELAY = 150; // ms user must hover at edge

        const onPointerMove = (e: PointerEvent) => {
            try {
                const x = e.clientX;
                if (x <= EDGE_THRESHOLD && !isMenuOpen) {
                    if (openTimerRef.current == null) {
                        openTimerRef.current = window.setTimeout(() => {
                            setIsMenuOpen(true);
                            openTimerRef.current = null;
                        }, OPEN_DELAY) as unknown as number;
                    }
                } else {
                    // moved away from edge: cancel pending open
                    if (openTimerRef.current != null) {
                        window.clearTimeout(openTimerRef.current);
                        openTimerRef.current = null;
                    }
                }
            } catch (err) {
                // swallow
            }
        };

        window.addEventListener('pointermove', onPointerMove);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            if (openTimerRef.current != null) {
                window.clearTimeout(openTimerRef.current);
                openTimerRef.current = null;
            }
        };
    }, [isMenuOpen]);

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!profileOpen) return;
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [profileOpen]);

    return (
        <div className="min-h-screen bg-background">
            {/* Floating menu trigger (replaces top navigation) */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="fixed left-4 top-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 flex flex-col p-4">
                    <SheetHeader>
                        <SheetTitle className="text-left">Take more breathe</SheetTitle>
                    </SheetHeader>

                    <div className="py-4 flex-1 overflow-auto">
                        {/* slightly reduced left padding so items sit closer to the edge */}
                        <nav className="space-y-2 pl-0">
                            {menuItems.map((item) => (
                                <Button
                                    key={item.id}
                                    size="sm"
                                    variant={location.pathname === item.path ? "default" : "ghost"}
                                    className="w-full justify-start px-1"
                                    onClick={() => handleNavigation(item.path)}
                                >
                                    <item.icon className="h-4 w-4 mr-1" />
                                    {item.label}
                                </Button>
                            ))}
                        </nav>
                    </div>

                    {/* Profile button fixed at bottom inside the sheet; removes logout */}
                    {currentUser && (
                        <div className="mt-2 pt-4 border-t border-border">
                            <div ref={profileRef} className="relative">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start p-2"
                                    onClick={() => setProfileOpen(v => !v)}
                                >
                                    <div className="flex items-center space-x-3 w-full px-2">
                                        <div className="p-2 bg-primary rounded-full">
                                            <User className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="font-medium text-sm truncate">{currentUser.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                        </div>
                                    </div>
                                </Button>

                                {profileOpen && (
                                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-card border rounded shadow-lg p-2 z-50">
                                        <hr className="my-2 border-border" />
                                        <button className="w-full flex items-center gap-2 px-2 py-2 hover:bg-accent rounded" onClick={() => { navigate('/settings'); setIsMenuOpen(false); setProfileOpen(false); }}>
                                            <Settings className="h-4 w-4" />
                                            <span className="text-sm">Settings</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* New session button (top-right) */}
            {/* Theme toggle - keep always visible so users can switch modes quickly */}
            <div className="fixed right-16 top-4 z-40">
                <ThemeToggle />
            </div>

            {/* New session button (top-right) */}
            <Button variant="ghost" size="sm" className="fixed right-4 top-4 z-40" onClick={createNewSession} aria-label="Create new session">
                <Plus className="h-5 w-5" />
            </Button>

            {/* Main Content - Full Width; add top padding so fixed controls don't overlap content */}
            <main className="w-full pt-6">
                {children}
            </main>
        </div>
    );
};
