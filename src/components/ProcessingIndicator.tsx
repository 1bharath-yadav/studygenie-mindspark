import React, { useEffect, useState } from 'react';

const ProcessingIndicator: React.FC = () => {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const onStart = () => setProcessing(true);
    const onEnd = () => setProcessing(false);
    window.addEventListener('studygenie:processing-start', onStart as EventListener);
    window.addEventListener('studygenie:processing-end', onEnd as EventListener);
    return () => {
      window.removeEventListener('studygenie:processing-start', onStart as EventListener);
      window.removeEventListener('studygenie:processing-end', onEnd as EventListener);
    };
  }, []);

  if (!processing) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center space-x-2 bg-white/90 dark:bg-slate-900/90 border rounded-full px-3 py-1 shadow">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
        <div className="text-sm text-muted-foreground">Generating study materials…</div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
