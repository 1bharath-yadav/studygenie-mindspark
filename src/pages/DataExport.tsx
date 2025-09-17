import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import DataExportSection from '@/components/settings/DataExportSection';
import { IoCloudDownloadOutline } from 'react-icons/io5';

const DataExportPage: React.FC = () => {
  return (
    <AppLayout title="Export Data" subtitle="Download or delete your persisted data" icon={IoCloudDownloadOutline}>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">Export Data</h1>
        <DataExportSection />
      </div>
    </AppLayout>
  );
};

export default DataExportPage;
