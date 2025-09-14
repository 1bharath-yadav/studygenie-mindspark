import React, { useState } from 'react';
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
    LogOut
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

    const menuItems = [
        { id: 'home', label: 'Study Interface', icon: Home, path: '/' },
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, path: '/recommendations' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics' },
        { id: 'learning-history', label: 'Learning History', icon: BookOpen, path: '/sessions' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
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

    return (
        <div className="min-h-screen bg-background">
            {/* Header with Navigation */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="w-full px-4 lg:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Hamburger Menu */}
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80">
                                    <SheetHeader>
                                        <SheetTitle className="text-left">StudyGenie</SheetTitle>
                                    </SheetHeader>
                                    <div className="py-4">
                                        <nav className="space-y-2">
                                            {menuItems.map((item) => (
                                                <Button
                                                    key={item.id}
                                                    variant={location.pathname === item.path ? "default" : "ghost"}
                                                    className="w-full justify-start"
                                                    onClick={() => handleNavigation(item.path)}
                                                >
                                                    <item.icon className="h-4 w-4 mr-2" />
                                                    {item.label}
                                                </Button>
                                            ))}
                                        </nav>

                                        {/* User Section */}
                                        {currentUser && (
                                            <div className="mt-8 pt-4 border-t border-border">
                                                <div className="flex items-center space-x-3 mb-4 px-2">
                                                    <div className="p-2 bg-primary rounded-full">
                                                        <User className="h-4 w-4 text-primary-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{currentUser.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                    onClick={handleLogout}
                                                >
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    Logout
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Page Title */}
                            {IconComponent && (
                                <div className="p-2 bg-primary rounded-lg">
                                    <IconComponent className="h-6 w-6 text-primary-foreground" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                                {subtitle && (
                                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-2">
                            <StudyTimer />
                            <ThemeToggle />
                            {currentUser && (
                                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Full Width */}
            <main className="w-full">
                {children}
            </main>
        </div>
    );
};
