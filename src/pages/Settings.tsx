// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSection from '@/components/settings/ProfileSection';
import ApiManagementSection from '@/components/settings/ApiManagementSection';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  return (
    <AppLayout title="Settings" subtitle="Manage your profile and API configurations" icon={Settings}>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your profile and API configurations</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>Sign Out</Button>
        </div>
        <ProfileSection />
        <ApiManagementSection />
      </div>
    </AppLayout>
  );
};

export default SettingsPage;