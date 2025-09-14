import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useRecentSessions, useDeleteSession, useGetSession } from '@/hooks/useApi';

const RecentSessions: React.FC = () => {
    const { data: sessions, isLoading } = useRecentSessions();
    const deleteMutation = useDeleteSession();
    const navigate = useNavigate();

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading sessions...</p>;
    if (!sessions || sessions.length === 0) return <p className="text-sm text-muted-foreground">No recent sessions</p>;

    return (
        <div className="space-y-3">
            {sessions.map((s: any) => (
                <div key={s.session_id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                        <div className="font-medium">{s.session_name || s.subject_name || 'Untitled Session'}</div>
                        <div className="text-xs text-muted-foreground">{new Date(s.updated_at || s.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                            onClick={async () => {
                                try {
                                    const res = await apiClient.get<any>(`/api/v1/session/${s.session_id}`);
                                    // prefer full history when present
                                    const history = res.history && Array.isArray(res.history) && res.history.length ? res.history : (res.llm_response ? [res.llm_response] : []);
                                    if (history && history.length) {
                                        // store the full history in session storage so the study UI can continue the session
                                        sessionStorage.setItem('studygenie_learning_content', JSON.stringify(history[history.length - 1]));
                                        sessionStorage.setItem('studygenie_session_history', JSON.stringify(history));
                                        sessionStorage.setItem('studygenie_session_id', s.session_id);
                                    }
                                    navigate('/');
                                } catch (e) {
                                    console.error(e);
                                    alert('Failed to load session');
                                }
                            }}
                        >
                            Continue
                        </button>
                        <button
                            className="px-3 py-1 bg-red-600 text-white rounded"
                            onClick={() => {
                                if (!confirm('Delete this session? This action cannot be undone.')) return;
                                deleteMutation.mutate(s.session_id);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentSessions;
