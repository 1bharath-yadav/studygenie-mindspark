import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">we are saving your progresssssss</h2>
          <p className="text-sm text-muted-foreground text-center">This page is not ready yet — we're saving your progress and will add the analytics page soon.</p>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analytics;
