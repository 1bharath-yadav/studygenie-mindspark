import { NewStudyInterface } from '@/components/NewStudyInterface';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKeys } from '@/hooks/useApi';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Only fetch API keys if user is authenticated
  const { data: apiKeys } = useApiKeys({ enabled: isAuthenticated });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Check if user has API keys configured
  const hasApiKey = apiKeys && apiKeys.length > 0;

  // Show the new study interface if authenticated
  return <NewStudyInterface isAuthenticated={isAuthenticated} hasApiKey={hasApiKey} />;
};

export default Index;
