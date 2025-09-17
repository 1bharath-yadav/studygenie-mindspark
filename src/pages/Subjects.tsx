import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubjects } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZE = 12;

const SubjectsPage: React.FC = () => {
  const { data: subjectsRaw = [], isLoading } = useSubjects();
  const subjects: any[] = Array.isArray(subjectsRaw) ? subjectsRaw : [];
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const navigate = useNavigate();

  const filtered: any[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s: any) => {
      const name = s.subject_info?.subject_name?.toLowerCase() || '';
      const chapters = (s.chapters || []).map((c: any) => c.chapter_name.toLowerCase()).join(' ');
      const concepts = (s.chapters || []).flatMap((c: any) => (c.concepts || []).map((x: any) => x.concept_name.toLowerCase())).join(' ');
      return name.includes(q) || chapters.includes(q) || concepts.includes(q);
    });
  }, [subjects, query]) as any[];

  // Show newest subjects first by reversing the filtered list
  const ordered = useMemo(() => {
    return [...(filtered || [])].reverse();
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil((ordered.length || 0) / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return ordered.slice(start, start + PAGE_SIZE);
  }, [ordered, page]);

  const openSubject = (s: any) => setSelected(s);

  const [menuOpen, setMenuOpen] = useState<Record<string, boolean>>({});

  const toggleMenu = (id: string) => {
    setMenuOpen(m => ({ ...m, [id]: !m[id] }));
  };

  const closeAllMenus = () => setMenuOpen({});

  const { toast } = useToast();

  const createSubject = async () => {
    const name = window.prompt('Enter a name for the new subject');
    if (!name) return;
    try {
      await apiClient.post('/api/v1/subjects', { subject_name: name });
      toast({ title: 'Subject created', description: name });
      // crude refresh to reload subjects list from server
      window.location.reload();
    } catch (e) {
      console.error('Failed to create subject', e);
      toast({ title: 'Failed to create subject', variant: 'destructive' });
    }
  };

  // rename dialog state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const openRename = (s: any) => {
    setRenameTarget(s);
    setRenameValue(s.subject_info.subject_name || '');
    setRenameOpen(true);
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    try {
      const endpoint = `/api/v1/subjects/${renameTarget.subject_info.subject_id}`;
      const payload = { subject_name: renameValue };
      // Mask token for local debug
      const tk = localStorage.getItem('authToken') || '';
      const masked = tk ? `${tk.slice(0,8)}...${tk.slice(-4)}` : '(no-token)';
      console.debug('PATCH', endpoint, payload, 'token=', masked);
      await apiClient.patch(endpoint, payload);
      toast({ title: 'Renamed', description: renameValue });
      setRenameOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast({ title: 'Rename failed', variant: 'destructive' });
    }
  };

  const openDelete = (s: any) => {
    setDeleteTarget(s);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoint = `/api/v1/subjects/${deleteTarget.subject_info.subject_id}`;
      const tk = localStorage.getItem('authToken') || '';
      const masked = tk ? `${tk.slice(0,8)}...${tk.slice(-4)}` : '(no-token)';
      console.debug('DELETE', endpoint, 'token=', masked);
      await apiClient.delete(endpoint);
      toast({ title: 'Deleted' });
      setDeleteOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const continueWith = async (subjectInfo: any, chapter?: any, concept?: any) => {
    // If the subject row stores a server session_id, prefer loading that session via API
    const sid = subjectInfo?.session_id;
    if (sid) {
      try {
        const res = await apiClient.get<any>(`/api/v1/session/${sid}`);
        const data = res;

        // Build canonical history and chat messages (same logic as RecentSessions)
        const history = Array.isArray(data.history) ? data.history : (data.llm_response ? [data.llm_response] : []);

        const chatMsgs = history.map((h: any, i: number) => ({
          id: `s_${i}_${Math.random().toString(36).slice(2,7)}`,
          role: h.role === 'user' ? 'user' : 'assistant',
          text: h.content ?? h.text ?? (typeof h === 'string' ? h : JSON.stringify(h))
        }));

        try { localStorage.setItem(`studygenie_chat_messages_${sid}`, JSON.stringify(chatMsgs)); } catch (e) {}

        try { sessionStorage.setItem('studygenie_session_history', JSON.stringify(history)); } catch (e) {}
        try { sessionStorage.setItem('studygenie_session_id', sid); } catch (e) {}

        const mats = Array.isArray(data.study_materials) ? data.study_materials : (data.llm_response ? [data.llm_response] : []);
        if (mats && mats.length) {
          try { sessionStorage.setItem('studygenie_learning_content', JSON.stringify(mats[mats.length - 1])); } catch (e) {}
          try { localStorage.setItem(`studygenie_study_materials_${sid}`, JSON.stringify(mats)); } catch (e) {}
        }

        // Navigate to study interface
        navigate('/');
        return;
      } catch (e) {
        console.warn('Failed to load session from server, falling back to filters', e);
        // fallback to filter behavior below
      }
    }

    // Store filters so the study interface can auto-create/restore a session
    const filters = {
      subject: subjectInfo,
      chapter: chapter || null,
      concept: concept || null,
    };
    try {
      sessionStorage.setItem('studygenie_session_filters', JSON.stringify(filters));
    } catch (e) {
      console.warn('Failed to persist session filters', e);
    }
    // Navigate to main Study Interface where filters will be processed
    navigate('/');
  };

  return (
    <AppLayout title="Subjects" subtitle="Browse your subjects and continue sessions" icon={BookOpen}>
      <div className="w-full px-4 lg:px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Input value={query} onChange={(e: any) => { setQuery(e.target.value); setPage(1); }} placeholder="Search subjects, chapters, concepts..." />
          <div className="ml-auto text-sm text-muted-foreground">{filtered?.length ?? 0} results</div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading subjects…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.isArray(paginated) && paginated.length > 0 ? (
                paginated.map((s: any) => (
                  <Card key={s.subject_info.subject_id} className="p-3 cursor-pointer hover:shadow relative" onClick={() => openSubject(s)}>
                    <CardHeader className="p-0 flex items-start justify-between">
                      <CardTitle className="text-base font-semibold">{s.subject_info.subject_name}</CardTitle>
                      <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button aria-label="Subject menu" className="text-sm px-2 py-1 rounded hover:bg-gray-100">⋮</button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => { openSubject(s); }}>{'View'}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { openRename(s); }}>{'Rename'}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { openDelete(s); }} className="text-destructive">{'Delete'}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 mt-2 text-sm text-muted-foreground">
                      <div>{s.subject_info.chapter_count} chapters • {s.subject_info.concept_count} concepts</div>
                      <div className="mt-3">
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); continueWith(s.subject_info); }}>Continue</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No subjects found.</div>
              )}
            </div>

            {/* Pagination controls */}
            <div className="mt-6 flex items-center justify-center space-x-3">
              <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
              <div className="text-sm text-muted-foreground">Page {page} of {pageCount}</div>
              <Button size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</Button>
            </div>

            {/* Subject detail modal */}
            {selected && (
              <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selected.subject_info.subject_name}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground mb-3">Chapters & Concepts</div>
                    <div className="space-y-3 max-h-[60vh] overflow-auto">
                      {selected.chapters && selected.chapters.map((ch: any) => (
                        <div key={ch.chapter_id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{ch.chapter_name}</div>
                            <div className="text-sm text-muted-foreground">{(ch.concepts || []).length} concepts</div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(ch.concepts || []).map((c: any) => (
                              <div key={c.concept_id} className="flex items-center justify-between p-2 bg-card rounded">
                                <div className="text-sm">{c.concept_name}</div>
                                <div>
                                  <Button size="sm" onClick={() => continueWith(selected.subject_info, ch, c)}>Continue</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Subject</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <Input value={renameValue} onChange={(e: any) => setRenameValue(e.target.value)} placeholder="Subject name" />
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button size="sm" onClick={() => setRenameOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={submitRename}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete confirm dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Subject</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">Are you sure you want to delete this subject? This action cannot be undone.</div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="destructive" onClick={confirmDelete}>Delete</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SubjectsPage;
