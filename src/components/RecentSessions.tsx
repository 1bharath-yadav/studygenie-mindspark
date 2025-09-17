import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useRecentSessions, useDeleteSession, useGetSession, useRenameSession } from '@/hooks/useApi';
import { MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const RecentSessions: React.FC = () => {
    const { data: sessions, isLoading } = useRecentSessions();
    const deleteMutation = useDeleteSession();
    const renameMutation = useRenameSession();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const { toast } = useToast();

    // rename dialog
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<any | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // delete confirm
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
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
                        <Button
                            variant="graphite"
                            size="sm"
                            className="px-3 py-1"
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
                        </Button>

                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 rounded text-gray-400 hover:bg-gray-800" aria-label="More">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => {
                                        setRenameTarget(s);
                                        setRenameValue(s.session_name || '');
                                        setRenameOpen(true);
                                        setOpenMenu(null);
                                    }}>
                                        <Edit3 className="h-4 w-4 text-muted-foreground mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { setDeleteTarget(s); setDeleteOpen(true); setOpenMenu(null); }} className="text-destructive">
                                        <Trash2 className="h-4 w-4 text-muted-foreground mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            ))}

            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Session</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <Input value={renameValue} onChange={(e: any) => setRenameValue(e.target.value)} placeholder="Session name" />
                        <div className="mt-4 flex justify-end space-x-2">
                            <Button size="sm" onClick={() => setRenameOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={() => {
                                if (!renameTarget) return;
                                renameMutation.mutate({ sessionId: renameTarget.session_id, sessionName: renameValue }, {
                                    onSuccess: () => { toast({ title: 'Renamed' }); setRenameOpen(false); },
                                    onError: () => toast({ title: 'Rename failed', variant: 'destructive' })
                                });
                            }}>Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Session</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <div className="text-sm text-muted-foreground">Are you sure you want to delete this session? This action cannot be undone.</div>
                        <div className="mt-4 flex justify-end space-x-2">
                            <Button size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                                if (!deleteTarget) return;
                                deleteMutation.mutate(deleteTarget.session_id, {
                                    onSuccess: () => { toast({ title: 'Deleted' }); setDeleteOpen(false); },
                                    onError: () => toast({ title: 'Delete failed', variant: 'destructive' })
                                });
                            }}>Delete</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RecentSessions;
