import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useRecentSessions, useDeleteSession, useGetSession, useRenameSession } from '@/hooks/useApi';
import { MoreVertical, Edit3, Trash2 } from 'lucide-react';

const RecentSessions: React.FC = () => {
    const { data: sessions, isLoading } = useRecentSessions();
    const deleteMutation = useDeleteSession();
    const renameMutation = useRenameSession();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const navigate = useNavigate();

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading sessions...</p>;
    if (!sessions || sessions.length === 0) return <p className="text-sm text-muted-foreground">No recent sessions</p>;

    return (
        <div className="space-y-3">
            {openMenu && <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setOpenMenu(null)} />}
            {sessions.map((s: any) => (
                <div key={s.session_id} className="flex items-center justify-between p-2 border rounded bg-white/5">
                    <div>
                        <div className="font-medium text-sm truncate">{s.session_name || 'Untitled Session'}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(s.updated_at || s.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center space-x-2 relative">
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                            onClick={async () => {
                                try {
                                    const res = await apiClient.get<any>(`/api/v1/session/${s.session_id}`);
                                    // Build canonical history and chat messages
                                    const history = Array.isArray(res.history) ? res.history : (res.llm_response ? [res.llm_response] : []);

                                    // Persist chat messages to localStorage so the prompt box shows the conversation
                                    const chatMsgs = history.map((h: any, i: number) => ({
                                        id: `s_${i}_${Math.random().toString(36).slice(2,7)}`,
                                        role: h.role === 'user' ? 'user' : 'assistant',
                                        text: h.content ?? h.text ?? (typeof h === 'string' ? h : JSON.stringify(h))
                                    }));
                                    try { localStorage.setItem(`studygenie_chat_messages_${s.session_id}`, JSON.stringify(chatMsgs)); } catch (e) {}

                                    // Persist study materials and last-generated content for the study interface
                                    try { sessionStorage.setItem('studygenie_session_history', JSON.stringify(history)); } catch (e) {}
                                    try { sessionStorage.setItem('studygenie_session_id', s.session_id); } catch (e) {}
                                    // store last study material (if any) as studygenie_learning_content for immediate rendering
                                    const mats = Array.isArray(res.study_materials) ? res.study_materials : (res.llm_response ? [res.llm_response] : []);
                                    if (mats && mats.length) {
                                        try { sessionStorage.setItem('studygenie_learning_content', JSON.stringify(mats[mats.length - 1])); } catch (e) {}
                                        try { localStorage.setItem(`studygenie_study_materials_${s.session_id}`, JSON.stringify(mats)); } catch (e) {}
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

                        <button className="p-2 rounded text-gray-400 hover:bg-gray-800" onClick={() => setOpenMenu(openMenu === s.session_id ? null : s.session_id)} aria-label="More">
                            <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenu === s.session_id && (
                            <div className="absolute right-0 top-full mt-2 w-44 bg-card border rounded shadow z-40">
                                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => {
                                    const newName = prompt('Enter new session name', s.session_name || '');
                                    if (!newName) return;
                                    renameMutation.mutate({ sessionId: s.session_id, sessionName: newName }, {
                                        onSuccess: () => setOpenMenu(null),
                                        onError: () => alert('Failed to rename session')
                                    });
                                }}>
                                    <Edit3 className="h-4 w-4 text-muted-foreground" /> Rename
                                </button>
                                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => {
                                    if (!confirm('Delete this session? This action cannot be undone.')) return;
                                    deleteMutation.mutate(s.session_id);
                                    setOpenMenu(null);
                                }}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentSessions;
