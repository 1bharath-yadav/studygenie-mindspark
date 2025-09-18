import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import RecentSessions from '@/components/RecentSessions';
import { TrendingUp } from 'lucide-react';

const SessionsPage: React.FC = () => {
    return (
        <AppLayout title="Learning History" subtitle="Your recent learning sessions" icon={TrendingUp}>
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-6 py-6">
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">Below are your recent learning sessions. Use Continue to load a session into the study interface or Delete to remove it.</div>
                    <RecentSessions />
                </div>
            </div>
        </AppLayout>
    );
};

export default SessionsPage;
