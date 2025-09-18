import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import apiClient, { API_BASE_URL } from '@/lib/api';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { useProcessFiles } from '@/hooks/useApi';
import { allowedTypes, formatFileSize, buildFormForChat, saveActivity, getFileIcon } from './assistant/helpers';
import {
    Upload,
    File,
    X,
    Loader2,
    FileText,
    Image as ImageIcon,
    FileImage,
    BookOpen,
    Layers,
    Shuffle,
    Copy,
    Edit2,
    RefreshCw
} from 'lucide-react';
import { TbArrowUp } from 'react-icons/tb';
import { VscSettings } from 'react-icons/vsc';




import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { LLMOutputRenderer } from './llm-ui/LLMOutputRenderer';

interface IntegratedAIAssistantProps {
    disabled?: boolean;
    onContentGenerated?: (content: any) => void;
    studentId?: string;
    studentName?: string;
    gradeLevel?: string;
    sessionId?: string | null;
}

interface UploadedFile {
    file: File;
    id: string;
    name: string;
    size: string;
    type: string;
    preview?: string; // object URL for image previews
}

export const IntegratedAIAssistant: React.FC<IntegratedAIAssistantProps> = ({
    disabled = false,
    onContentGenerated,
    studentId = 'demo-student',
    studentName = 'Student',
    gradeLevel = 'High School',
    sessionId = null,
}) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; streaming?: boolean }>>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1); // -1 means current editing buffer
    const [autoScroll, setAutoScroll] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);
    // Compute initial 'first session' synchronously from localStorage so that when the
    // component is mounted (e.g., reopened) it doesn't start centered and then flip
    // to bottom after async restore completes. If there are persisted messages we
    // default to non-first session so the prompt renders bottom-aligned immediately.
    const computeInitialFirst = () => {
        try {
            const sid = sessionId ?? (typeof window !== 'undefined' ? sessionStorage.getItem('studygenie_session_id') : null);
            const sessionKey = `studygenie_chat_messages_${sid || ''}`;
            const studentKey = `studygenie_chat_messages_${studentId}`;
            const rawSession = sid ? localStorage.getItem(sessionKey) : null;
            if (rawSession) {
                const parsed = JSON.parse(rawSession);
                if (Array.isArray(parsed) && parsed.length > 0) return false; // has messages -> not first
            }
            const rawStudent = localStorage.getItem(studentKey);
            if (rawStudent) {
                const parsed = JSON.parse(rawStudent);
                if (Array.isArray(parsed) && parsed.length > 0) return false; // has messages -> not first
            }
        } catch (e) {
            // ignore - fall back to first session
        }
        return true;
    };
    const [isFirstSession, setIsFirstSession] = useState<boolean>(computeInitialFirst);
    const [isAnimating, setIsAnimating] = useState(false); // Track animation state
    
    // Persisted chat key is either session-specific (preferred) or falls back to student id
    // We store messages in localStorage so a user can refresh and restore the chat for the session.
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toolsContainerRef = useRef<HTMLDivElement | null>(null);
    const toolsToggleRef = useRef<HTMLDivElement | null>(null);
    const [toolsPopupStyle, setToolsPopupStyle] = useState<React.CSSProperties | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const userInteractedRef = useRef(false);
    const forceCenterRef = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();
    const processFilesMutation = useProcessFiles();
    const { theme } = useTheme();
    const isProcessing = processFilesMutation.status === 'pending';
    const [isStreaming, setIsStreaming] = useState(false);

    // helper utilities imported from ./assistant/helpers

    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const maxHeight = 200;
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        }
    }, []);

    // Prompt history persistence key (session-scoped when possible, otherwise per-student)
    const getPromptHistoryKey = () => {
        try {
            const sid = sessionId ?? (typeof window !== 'undefined' ? sessionStorage.getItem('studygenie_session_id') : null);
            return `studygenie_prompt_history_${sid || studentId}`;
        } catch (e) { return `studygenie_prompt_history_${studentId}`; }
    };

    // Restore prompt history from localStorage
    useEffect(() => {
        try {
            const key = getPromptHistoryKey();
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setPromptHistory(parsed);
            }
        } catch (e) {
            // ignore
        }
    }, [studentId, sessionId]);

    useEffect(() => {
        adjustTextareaHeight();
    }, [prompt, adjustTextareaHeight]);

    // Restore chat messages from localStorage on mount and determine if this is a fresh session
    useEffect(() => {
        const restore = async () => {
            try {
                const sessionIdToUse = sessionId ?? sessionStorage.getItem('studygenie_session_id');
                const sessionKey = `studygenie_chat_messages_${sessionIdToUse || ''}`;
                const studentKey = `studygenie_chat_messages_${studentId}`;
                let hasExistingMessages = false;
                let restoredMessages: Array<any> | null = null;
                let contentGenerated: any = null;

                // First try to restore from localStorage session key (fast, offline)
                const rawSession = sessionIdToUse ? localStorage.getItem(sessionKey) : null;
                if (rawSession) {
                    try {
                        const parsed = JSON.parse(rawSession);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            restoredMessages = parsed;
                            hasExistingMessages = true;
                        }
                    } catch (e) {
                        // ignore malformed
                    }
                }

                // If we have a server session id and still no messages, try fetching canonical session from backend
                if (!hasExistingMessages && sessionIdToUse) {
                    try {
                        // Use shared apiClient so Authorization header is included when available
                        const { apiClient } = await import('@/lib/api');
                        const data = await apiClient.get<any>(`/api/v1/session/${sessionIdToUse}`);
                        if (data) {
                            const history = Array.isArray(data.history) ? data.history : (data.llm_response && Array.isArray([data.llm_response]) ? [data.llm_response] : []);
                            if (history && Array.isArray(history) && history.length > 0) {
                                const msgs = history.map((h: any, i: number) => ({
                                    id: `s_${i}_${Math.random().toString(36).slice(2,7)}`,
                                    role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                                    text: String(h.content ?? h.text ?? (typeof h === 'string' ? h : JSON.stringify(h)))
                                }));
                                restoredMessages = msgs;
                                hasExistingMessages = true;
                            }
                            // Deliver study materials to parent for rendering on home page
                            if (data && data.study_materials) {
                                contentGenerated = data.study_materials;
                            }
                        }
                    } catch (e) {
                        // ignore and fall back to localStorage/student-key
                        console.debug('Failed to fetch session from API, falling back to localStorage', e);
                    }
                }

                // Fallback: if only student-keyed messages exist in localStorage, migrate them to session key
                if (!hasExistingMessages) {
                    const rawStudent = localStorage.getItem(studentKey);
                    if (rawStudent) {
                        try {
                            const parsed = JSON.parse(rawStudent);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                restoredMessages = parsed;
                                hasExistingMessages = true;
                                if (sessionIdToUse) {
                                    try { localStorage.setItem(sessionKey, rawStudent); } catch {}
                                }
                            }
                        } catch (e) {
                            // ignore malformed
                        }
                    }
                }

                // Apply restored state once to avoid intermediate toggles that race with user interactions.
                // If the user interacted (focused/clicked) while restore was running, avoid flipping the
                // 'first session' layout state to prevent a visual jump.
                if (restoredMessages) {
                    setChatMessages(restoredMessages);
                }
                if (contentGenerated && onContentGenerated) {
                    onContentGenerated(contentGenerated);
                }
                // If user explicitly forced center (via clear/open), preserve that state.
                if (forceCenterRef.current) {
                    setIsFirstSession(true);
                } else {
                    const shouldSetFirst = !hasExistingMessages && !userInteractedRef.current;
                    if (shouldSetFirst) {
                        setIsFirstSession(true);
                    } else {
                        // Only explicitly clear first-session when we deterministically know there are messages
                        // and the user hasn't already interacted. This prevents mid-click layout flips.
                        setIsFirstSession(false);
                    }
                }
            } catch (e) {
                console.warn('Failed to restore chat messages from storage or server', e);
                setIsFirstSession(true);
            }
        };
        restore();
    }, [studentId, sessionId, onContentGenerated]);

    // Clear local UI state when the app requests a session clear (from AppLayout + button)
    useEffect(() => {
        const onClear = () => {
            setPrompt('');
            setUploadedFiles([]);
            setSelectedContentTypes([]);
            setChatMessages([]);
            // Force centered fresh-session UI until the user interacts
            forceCenterRef.current = true;
            setIsFirstSession(true);
            setIsAnimating(false);
            if (onContentGenerated) onContentGenerated(null);
            try {
                // also clear persisted session storage for current session
                const sid = sessionId ?? sessionStorage.getItem('studygenie_session_id');
                // remove any session-scoped persisted messages
                if (sid) localStorage.removeItem(`studygenie_chat_messages_${sid}`);
                // also remove any student-scoped persisted messages to ensure a truly fresh session
                try { localStorage.removeItem(`studygenie_chat_messages_${studentId}`); } catch (e) {}
                // clear the stored session id so restore logic won't pick it up
                try { sessionStorage.removeItem('studygenie_session_id'); } catch (e) {}
            } catch (e) {}
            // focus the textarea after a short delay so the centered UI receives focus
            try {
                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 100);
            } catch (e) {}
        };

        window.addEventListener('studygenie:clear-session', onClear as EventListener);
        window.addEventListener('studygenie:open-assistant', onClear as EventListener);
        return () => {
            window.removeEventListener('studygenie:clear-session', onClear as EventListener);
            window.removeEventListener('studygenie:open-assistant', onClear as EventListener);
        };
    }, [sessionId, onContentGenerated, studentId]);

    // No early listener — onClear effect above handles open/clear behavior.

    // Auto-scroll the chat messages container when new messages arrive
    useEffect(() => {
        if (!autoScroll) return;
        const container = containerRef.current;
        if (!container) return;
        // scroll the outer container to the bottom smoothly
        try {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } catch (e) {
            container.scrollTop = container.scrollHeight;
        }
    }, [chatMessages, autoScroll]);

    // (wheel forwarding removed to restore natural scrolling behavior)


    // Persist chat messages to localStorage whenever they change.
    useEffect(() => {
        try {
            const sessionIdToUse = sessionId ?? sessionStorage.getItem('studygenie_session_id');
            const key = `studygenie_chat_messages_${sessionIdToUse || studentId}`;
            localStorage.setItem(key, JSON.stringify(chatMessages || []));
        } catch (e) {
            console.warn('Failed to persist chat messages to localStorage', e);
        }
    }, [chatMessages, studentId]);

    // Close the tools popup when clicking outside or pressing Escape
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!toolsOpen) return;
            const container = toolsContainerRef.current;
            if (!container) return;
            if (!container.contains(e.target as Node)) setToolsOpen(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setToolsOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [toolsOpen]);

    // Position the tools popup in a fixed portal so it can escape clipping.
    useLayoutEffect(() => {
        if (!toolsOpen || !toolsToggleRef.current) {
            setToolsPopupStyle(null);
            return;
        }

        const updatePosition = () => {
            const btn = toolsToggleRef.current as HTMLElement;
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const popupWidth = 192; // fallback width

            // Horizontal clamp: keep popup inside viewport with a small margin
            const left = Math.min(Math.max(8, rect.right - popupWidth), window.innerWidth - popupWidth - 8);

            const applyTopForHeight = (popupHeight: number) => {
                // Prefer placing above the button; clamp to top=8 if not enough space
                let computedTop = rect.top - 8 - popupHeight;
                if (computedTop < 8) computedTop = 8;
                setToolsPopupStyle({ position: 'fixed', left: `${left}px`, top: `${computedTop}px` });
            };

            // If the popup has already been rendered, measure it directly
            if (toolsContainerRef.current) {
                const pr = toolsContainerRef.current.getBoundingClientRect();
                applyTopForHeight(pr.height || 200);
                return;
            }

            // Otherwise, schedule a measurement on the next animation frame after it renders
            requestAnimationFrame(() => {
                if (toolsContainerRef.current) {
                    const pr = toolsContainerRef.current.getBoundingClientRect();
                    applyTopForHeight(pr.height || 200);
                } else {
                    // final fallback: use an estimated height
                    applyTopForHeight(200);
                }
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, { passive: true });
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [toolsOpen]);

    const handleFiles = useCallback((files: File[]) => {
        const validFiles = files.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not a supported file type.`,
                    variant: "destructive",
                });
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast({
                    title: "File too large",
                    description: `${file.name} is larger than 10MB.`,
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });

        const newFiles: UploadedFile[] = validFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
    }, [toast]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
            // Reset input
            e.target.value = '';
        }
    }, [handleFiles]);

    const removeFile = (id: string) => {
        setUploadedFiles(prev => {
            const toRemove = prev.find(p => p.id === id);
            if (toRemove?.preview) {
                try { URL.revokeObjectURL(toRemove.preview); } catch (e) {}
            }
            return prev.filter(file => file.id !== id);
        });
    };

    // cleanup previews when component unmounts
    useEffect(() => {
        return () => {
            for (const f of uploadedFiles) {
                if (f.preview) {
                    try { URL.revokeObjectURL(f.preview); } catch (e) {}
                }
            }
        };
    }, [uploadedFiles]);

    // Ensure messages area has enough bottom padding so per-message absolute
    // action icons don't overlap the prompt. Recompute when textarea height or
    // window size changes.
    useEffect(() => {
        const adjustPadding = () => {
            const msgs = messagesRef.current;
            const ta = textareaRef.current;
            if (!msgs) return;
            const taHeight = ta ? ta.offsetHeight : 48;
            const controlRow = 40; // approximate height of control row/buttons
            const extra = 12; // breathing room
            msgs.style.paddingBottom = `${taHeight + controlRow + extra}px`;
        };

        adjustPadding();
        const ro = new ResizeObserver(() => adjustPadding());
        if (textareaRef.current) ro.observe(textareaRef.current);
        window.addEventListener('resize', adjustPadding);
        return () => {
            try { ro.disconnect(); } catch (e) {}
            window.removeEventListener('resize', adjustPadding);
        };
    }, [prompt]);

    // Listen for code-edit events from CodeBlock so we can load code into the prompt for editing
    useEffect(() => {
        const onEdit = (ev: Event) => {
            try {
                const e = ev as CustomEvent<Record<string, any>>;
                const code = String(e.detail?.code ?? '');
                setPrompt(code);
                setTimeout(() => textareaRef.current?.focus(), 20);
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('studygenie:edit-code', onEdit as EventListener);
        return () => window.removeEventListener('studygenie:edit-code', onEdit as EventListener);
    }, []);

    // mark that the user interacted so restore logic won't flip layout mid-interaction
    useEffect(() => {
        const t = textareaRef.current;
        if (!t) return;
    const onPointerDown = () => { userInteractedRef.current = true; forceCenterRef.current = false; };
    const onFocus = () => { userInteractedRef.current = true; forceCenterRef.current = false; };
        t.addEventListener('pointerdown', onPointerDown);
        t.addEventListener('focus', onFocus);
        return () => {
            t.removeEventListener('pointerdown', onPointerDown);
            t.removeEventListener('focus', onFocus);
        };
    }, []);


    const handleSubmit = async (overridePrompt?: string) => {
        const usedPrompt = (overridePrompt ?? prompt).trim();
        if (!usedPrompt && uploadedFiles.length === 0) {
            toast({
                title: "Nothing to process",
                description: "Please enter a question or upload files to analyze.",
                variant: "destructive",
            });
            return;
        }

        // If user requested structured outputs (flashcards/quiz/match), start the
        // global processing indicator and hide the compact assistant. For file-only
        // chat flows we keep the assistant open and use local streaming indicators.
        const emitProcessingStart = () => {
            try { window.dispatchEvent(new CustomEvent('studygenie:processing-start')); } catch (e) {}
        };
        const emitProcessingEnd = () => {
            try { window.dispatchEvent(new CustomEvent('studygenie:processing-end')); } catch (e) {}
        };

        // Track whether we started the global processing indicator so we only
        // emit the matching 'end' event when appropriate.
        let globalProcessingStarted = false;
        try {
            // Save prompt to history immediately so we have a record even if the LLM call fails.
            try {
                if (usedPrompt) {
                    setPromptHistory(prev => {
                        // Avoid duplicate consecutive entries
                        const last = prev[0] ?? null;
                        if (last === usedPrompt) return prev;
                        const next = [usedPrompt, ...prev].slice(0, 50); // keep recent 50
                        try { localStorage.setItem(getPromptHistoryKey(), JSON.stringify(next)); } catch (e) {}
                        return next;
                    });
                    setHistoryIndex(-1);
                }
            } catch (e) {
                // ignore history failures
            }
            if (selectedContentTypes && selectedContentTypes.length > 0) {
                emitProcessingStart();
                globalProcessingStarted = true;
                try { window.dispatchEvent(new CustomEvent('studygenie:hide-assistant')); } catch (e) {}
            }
        } catch (e) {}

            // Start animation if this is the first session. We first enable the
            // transitional classes (isAnimating), then in the next tick switch
            // the container from centered -> bottom (isFirstSession=false) so
            // the CSS transition runs. After the transition duration we clear
            // the animation flag.
            // If this was marked as a first session, disable the 'first session' state
            // and skip any animated transition. We want the prompt box to appear
            // immediately in its bottom-aligned position on all devices.
            if (isFirstSession) {
                setIsFirstSession(false);
            }

        try {
            // Build the user query with selected content types
            let userQuery = usedPrompt || 'Please analyze these files and create study materials';

            // Only consider known/allowed content types. This prevents unexpected values
            // (e.g. stale session values or malformed IDs) from being added to the LLM prompt.
            const ALLOWED_CONTENT_TYPES = ['flashcards', 'quiz', 'match_the_following'];
            const filtered = selectedContentTypes.filter(t => ALLOWED_CONTENT_TYPES.includes(t));

            if (filtered.length > 0) {
                const mapped = filtered.map(type => {
                    switch (type) {
                        case 'flashcards': return 'flashcards';
                        case 'quiz': return 'quiz questions';
                        case 'match_the_following': return 'match the following exercise';
                        default: return type;
                    }
                });

                // Build a natural language list: "A", "A and B", "A, B and C"
                const listString = mapped.length === 1
                    ? mapped[0]
                    : mapped.length === 2
                        ? `${mapped[0]} and ${mapped[1]}`
                        : `${mapped.slice(0, -1).join(', ')} and ${mapped[mapped.length - 1]}`;

                userQuery += `. Please specifically create: ${listString}.`;
            }

            console.log('Sending user query:', userQuery); // Debug log

            // Persist the user's message into the chat immediately so it remains
            // visible and is saved to localStorage even if the LLM request fails.
            try {
                const userMsgId = Math.random().toString(36).slice(2, 9);
                setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userQuery }]);
            } catch (e) {
                // ignore persistence failures
                console.warn('Failed to add user message to chat state', e);
            }

            // Attach session_id if present in sessionStorage so server can append to history
            const storedSessionId = sessionStorage.getItem('studygenie_session_id');
            const additionalData: Record<string, any> = {
                student_id: studentId,
                user_query: userQuery,
            };
            if (storedSessionId) additionalData.session_id = storedSessionId;
            if (selectedContentTypes && selectedContentTypes.length > 0) additionalData.selected_content_types = selectedContentTypes;

            // If user did not select any structured outputs, use the streaming chat endpoint for a regular chat experience.
            // This includes the case where files were uploaded but content types are OFF: those should go to chat-stream.
            let result: any = null;
            if (!selectedContentTypes || selectedContentTypes.length === 0) {
                // Call streaming chat endpoint. Include files in the form if present.
                setIsStreaming(true);
                const form = new FormData();
                form.append('user_prompt', userQuery);
                const sessionIdToSend = sessionId ?? sessionStorage.getItem('studygenie_session_id');
                if (sessionIdToSend) form.append('session_id', sessionIdToSend);

                // Append files if any
                for (const f of uploadedFiles) form.append('files', f.file, f.name);

                const authToken = localStorage.getItem('authToken');
                const headers: Record<string,string> = {};
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const resp = await fetch(`${API_BASE_URL}/api/v1/llm/chat-stream`, {
                    method: 'POST',
                    body: form,
                    headers,
                });

                if (!resp.ok) {
                    let txt = '';
                    try { txt = await resp.text(); } catch (e) {}
                    console.error('chat-stream non-ok response', resp.status, txt);
                    throw new Error('Chat stream request failed: ' + txt);
                }

                // Prepare chat state: add an empty assistant message ready to stream into.
                // The user's message was already added above so avoid duplicating it here.
                const assistantMsgId = Math.random().toString(36).slice(2, 9);
                setChatMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', streaming: true }]);

                let finalOutput: any = null;

                const reader = resp.body?.getReader();
                if (!reader) throw new Error('Streaming not supported');

                const decoder = new TextDecoder();
                let buf = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buf += decoder.decode(value, { stream: true });
                        const lines = buf.split('\n');
                        buf = lines.pop() || '';
                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const obj = JSON.parse(line);
                                if (obj.type === 'delta') {
                                    // Append delta to the streaming assistant message, but avoid repeating
                                    // large duplicated chunks by detecting overlap between the
                                    // existing assistant text and the incoming delta.
                                    const deltaText = obj.text || '';
                                    if (deltaText) {
                                        setChatMessages(prev => prev.map(m => {
                                            if (m.id !== assistantMsgId) return m;
                                            const existing = m.text || '';

                                            // If the incoming delta is already present, skip it
                                            if (existing.includes(deltaText)) return { ...m };

                                            // Find longest overlap where a suffix of `existing` matches a prefix of `deltaText`.
                                            const maxOverlap = Math.min(existing.length, deltaText.length);
                                            let overlap = 0;
                                            for (let k = maxOverlap; k > 0; k--) {
                                                if (existing.endsWith(deltaText.slice(0, k))) {
                                                    overlap = k;
                                                    break;
                                                }
                                            }

                                            const appendPart = deltaText.slice(overlap);
                                            return { ...m, text: existing + appendPart };
                                        }));
                                    }
                                } else if (obj.type === 'final') {
                                    finalOutput = obj.output;
                                    const finalText = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput, null, 2);
                                    // Replace assistant message with final text and mark not streaming
                                    setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: finalText, streaming: false } : m));
                                } else if (obj.type === 'error') {
                                    throw new Error(obj.error || 'Unknown streaming error');
                                }
                            } catch (e) {
                                console.warn('Failed to parse stream line', e, line);
                            }
                        }
                    }
                } finally {
                    // ensure assistant streaming flag is cleared in case of early exit
                    setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m));
                }

                // Clear streaming indicator
                setIsStreaming(false);
                if (globalProcessingStarted) emitProcessingEnd();

                // Persist session id if backend created one
                const returnedSessionId = finalOutput?.session_id || finalOutput?.sessionId || null;
                if (returnedSessionId) {
                    try {
                        sessionStorage.setItem('studygenie_session_id', returnedSessionId);
                    } catch (e) {}
                }

                // Notify parent with final output
                if (onContentGenerated) onContentGenerated(finalOutput || null);
                // Fire-and-forget: save activity for analytics
                try { void saveActivity('chat_response', finalOutput || { prompt: userQuery }); } catch (e) {}
                result = { session_id: finalOutput?.session_id || null, llm_response: finalOutput || null };
                } else {
                    // If structured content selected, use streaming NDJSON endpoint so frontend can incrementally render
                    // Note: files alone (without selected content types) should NOT force structured streaming; they'll go to chat-stream instead.
                    if (selectedContentTypes && selectedContentTypes.length > 0) {
                    setIsStreaming(true);

                    // Prepare formdata including files
                    const form = new FormData();
                    form.append('user_query', userQuery);
                    const sessionIdToSend = sessionId ?? sessionStorage.getItem('studygenie_session_id');
                    if (sessionIdToSend) form.append('session_id', sessionIdToSend);
                    // session_name is optional and not provided from this component
                    if (selectedContentTypes && selectedContentTypes.length > 0) form.append('selected_content_types', JSON.stringify(selectedContentTypes));
                    // append files (include filename) and log details to help debug server I/O issues
                    try {
                        console.debug('Uploading files:', uploadedFiles.map(f => ({ name: f.name, size: f.file.size, type: f.type })));
                    } catch (e) {}
                    for (const f of uploadedFiles) form.append('files', f.file, f.name);

                    const authToken = localStorage.getItem('authToken');
                    const headers: Record<string,string> = {};
                    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                    const resp = await fetch(`${API_BASE_URL}/api/v1/llm/stream-structured-content`, {
                        method: 'POST',
                        body: form,
                        headers,
                    });

                    if (!resp.ok) {
                        let txt = '';
                        try { txt = await resp.text(); } catch (e) {}
                        console.error('stream-structured-content non-ok response', resp.status, txt);
                        throw new Error('Stream request failed: ' + txt);
                    }

                    // Create an empty assistant message that we'll stream into. The
                    // user's message was already appended above so we only add the
                    // assistant placeholder here.
                    const assistantMsgId = Math.random().toString(36).slice(2, 9);
                    setChatMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', streaming: true }]);

                    const reader = resp.body?.getReader();
                    if (!reader) throw new Error('Streaming not supported');

                    const decoder = new TextDecoder();
                    let buf = '';
                    let finalOutput: any = null;

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            buf += decoder.decode(value, { stream: true });
                            // NDJSON: split by newline and handle each JSON object
                            const lines = buf.split('\n');
                            buf = lines.pop() || '';
                            for (const line of lines) {
                                if (!line.trim()) continue;
                                try {
                                    const obj = JSON.parse(line);
                                    // Handle known statuses
                                    if (obj.status === 'streaming' && (obj.data || obj.text)) {
                                        // Prefer short textual delta when provided by the server to avoid
                                        // appending large JSON dumps to the streaming UI.
                                        const deltaText = (typeof obj.text === 'string' && obj.text) ? obj.text : (typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data));
                                        // Append intelligently to avoid duplication
                                        setChatMessages(prev => prev.map(m => {
                                            if (m.id !== assistantMsgId) return m;
                                            const existing = m.text || '';
                                            // simple overlap protection
                                            if (existing.endsWith(deltaText)) return m;
                                            return { ...m, text: existing + deltaText };
                                        }));
                                    } else if (obj.status === 'complete' && obj.data) {
                                        finalOutput = obj.data;
                                        const finalText = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput, null, 2);
                                        setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: finalText, streaming: false } : m));
                                    } else if (obj.status === 'persisted') {
                                        // Backend persisted session info
                                        const sid = obj.session_id || null;
                                        if (sid) {
                                            try { sessionStorage.setItem('studygenie_session_id', sid); } catch (e) {}
                                        }
                                    } else if (obj.status === 'error') {
                                        // Backend reported a processing error for this session
                                        console.error('Stream reported error:', obj.error, obj);
                                        try {
                                            toast({ title: 'Processing error', description: String(obj.error || 'Unknown error'), variant: 'destructive' });
                                        } catch (e) {}
                                        // set finalOutput to null and exit the streaming loop gracefully
                                        finalOutput = null;
                                        // break outer while loop by setting buf to '' and clearing lines
                                        buf = '';
                                        lines.length = 0;
                                        // force exit
                                        throw new Error(String(obj.error || 'Unknown error from stream'));
                                    } else if (obj.status === 'files_saved' || obj.status === 'processing_started' || obj.status === 'cleanup_complete') {
                                        // ignore small lifecycle notifications or optionally show a toast
                                    } else {
                                        // unknown object - append as debug text
                                        const asText = JSON.stringify(obj);
                                        setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: (m.text || '') + '\n' + asText } : m));
                                    }
                                } catch (e) {
                                    console.warn('Failed to parse NDJSON line', e, line);
                                }
                            }
                        }
                    } finally {
                        setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m));
                        setIsStreaming(false);
                        if (globalProcessingStarted) emitProcessingEnd();
                    }

                    if (finalOutput && onContentGenerated) onContentGenerated(finalOutput);
                    // Fire-and-forget: save structured content activity
                    try { void saveActivity('structured_content', finalOutput || { prompt: userQuery, types: selectedContentTypes }); } catch (e) {}
                    result = { session_id: finalOutput?.session_id || null, llm_response: finalOutput || null };
                } else {
                    // fallback to existing non-streaming mutation for small flows
                    try {
                        console.debug('Uploading files (non-stream):', uploadedFiles.map(f => ({ name: f.name, size: f.file.size, type: f.type })));
                    } catch (e) {}
                    result = await processFilesMutation.mutateAsync({
                        files: uploadedFiles.map(f => f.file),
                        data: additionalData,
                    });
                    const returnedSid = result?.session_id || result?.sessionId || result?.llm_response?.session_id || null;
                    if (returnedSid) {
                        try { sessionStorage.setItem('studygenie_session_id', returnedSid); } catch (e) {}
                    }
                    if (onContentGenerated) onContentGenerated(result?.llm_response || result || null);
                    // Fire-and-forget: save activity for non-stream fallback
                    try { void saveActivity('file_processing', result?.llm_response || result || { prompt: userQuery }); } catch (e) {}
                }
            }

            console.log('📤 Received result from API:', result);

            // Clear form after successful submission
                setPrompt('');
            setUploadedFiles([]);

        } catch (error) {
            console.error('Error processing files:', error);
            toast({
                title: "Error",
                description: "Failed to process your files. Please try again.",
                variant: "destructive",
            });
            // even on error we already saved the prompt above; ensure UI clears any streaming flags
        } finally {
            // ensure mutation state is reset (react-query handles isLoading)
            // emit processing-end only if we previously started global processing
            try { if (globalProcessingStarted) window.dispatchEvent(new CustomEvent('studygenie:processing-end')); } catch (e) {}
        }
    };

    // Persist a generated activity to the backend analytics service (non-blocking)
    const saveActivity = async (activityType: string, payload: any, score?: number | null, timeSpentSeconds?: number | null) => {
        try {
            const body = {
                activity_type: activityType,
                payload: payload || {},
                score: score ?? null,
                time_spent_seconds: timeSpentSeconds ?? null,
            } as any;

            const authToken = localStorage.getItem('authToken');
            const headers: Record<string,string> = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

            const resp = await fetch(`${API_BASE_URL}/api/v1/analytics/activity`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!resp.ok) {
                // ignore failures for now but log for debugging
                const txt = await resp.text().catch(() => '');
                console.debug('Failed to save activity', resp.status, txt);
            }
        } catch (e) {
            console.debug('saveActivity error', e);
        }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Provide prompt-history navigation with ArrowUp / ArrowDown when the caret is at the start/end
        const ta = textareaRef.current;
        const caretAtStart = ta ? (ta.selectionStart === 0 && ta.selectionEnd === 0) : false;
        const caretAtEnd = ta ? (ta.selectionStart === ta.value.length && ta.selectionEnd === ta.value.length) : false;

        if (e.key === 'ArrowUp' && caretAtStart) {
            e.preventDefault();
            if (promptHistory.length === 0) return;
            setHistoryIndex(prev => {
                const nextIdx = prev < 0 ? 0 : Math.min(prev + 1, promptHistory.length - 1);
                const item = promptHistory[nextIdx] ?? '';
                setPrompt(item);
                // place caret at end
                requestAnimationFrame(() => { textareaRef.current?.setSelectionRange(item.length, item.length); });
                return nextIdx;
            });
            return;
        }

        if (e.key === 'ArrowDown' && caretAtEnd) {
            e.preventDefault();
            if (promptHistory.length === 0) return;
            setHistoryIndex(prev => {
                if (prev <= 0) {
                    // back to live editing buffer
                    setPrompt('');
                    return -1;
                }
                const nextIdx = prev - 1;
                const item = promptHistory[nextIdx] ?? '';
                setPrompt(item);
                requestAnimationFrame(() => { textareaRef.current?.setSelectionRange(item.length, item.length); });
                return nextIdx;
            });
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isProcessing && !isAnimating) handleSubmit();
        }
    }, [disabled, isProcessing, isAnimating, handleSubmit, promptHistory]);

    const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        setHistoryIndex(-1);
    }, []);

    // Action handlers: copy, edit (load into prompt), retry
    const handleCopyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: 'Copied', description: 'Message copied to clipboard.' });
        } catch (e) {
            toast({ title: 'Copy failed', description: 'Unable to copy to clipboard.', variant: 'destructive' });
        }
    };

    const handleEditText = (text: string) => {
        setPrompt(text);
        textareaRef.current?.focus();
    };

    const handleRetry = (promptText: string) => {
        // populate prompt and submit
        setPrompt(promptText || '');
        setTimeout(() => void handleSubmit(promptText), 20);
    };

    // Use centered container for the very first session (fresh state). For all
    // other cases render the assistant as a bottom-aligned prompt. No animations
    // are used; the switch is immediate so focus and typing are reliable.
    const getContainerClasses = () => {
        if (isFirstSession) {
            // centered view: add horizontal padding so content isn't flush to container edges
            return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-2xl bg-background rounded-lg px-4 py-2 z-50 space-y-0";
        }
        // bottom-aligned: container grows upward from the bottom (enlarges from bottom to top)
        // use flex-col and zero vertical padding; make the container itself scrollable
        return "fixed bottom-4 left-1/2 -translate-x-1/2 w-[70vw] max-w-3xl bg-background rounded-lg px-4 py-0 z-50 flex flex-col space-y-0 overflow-y-auto";
    };

    const getContainerStyle = () => {
        if (isFirstSession) {
            return { backgroundColor: theme === 'light' ? '#DAFFEF' : '#191A1A', border: theme === 'light' ? '1px solid #c7dccf' : '1px solid #3a3a3a', fontSize: 'calc(1rem + 1px)' };
        } else {
            // limit how large the assistant grows so it leaves visible page chrome
            // increased top inset keeps the assistant lower on the page
            return { maxHeight: 'calc(107vh - 160px)', backgroundColor: theme === 'light' ? '#DAFFEF' : '#191A1A', border: theme === 'light' ? '1px solid #c7dccf' : '1px solid #3a3a3a', fontSize: 'calc(1rem + 1px)' };
        }
    };

    // NOTE: do not hide the assistant immediately when selecting content types.
    // The assistant should remain visible so the user can confirm/submit their choices.
    // Hiding and processing will occur when the user submits (see handleSubmit).

    return (
        <>
        <div
            ref={containerRef}
            className={getContainerClasses()}
            style={getContainerStyle()}
        >
            {/* Welcome message removed per request */}

            

            {/* Chat messages panel - only show if not first session and has messages */}
            {!isFirstSession && (
                <div className="w-full flex-1 flex flex-col min-h-0">
                    <div
                        ref={messagesRef}
                        className="relative overflow-x-hidden flex-1"
                        style={{ padding: 0, marginBottom: 0 }}
                    >
            {chatMessages.map((m, i) => (
                <div key={m.id} className={`mb-0 group relative ${m.role === 'user' ? 'text-right' : 'text-left'}`}> 
                            <div className="inline-block p-0 bg-transparent text-sm max-w-full break-words">
                                {m.role === 'assistant' ? (
                                    <div className="max-w-full break-words overflow-hidden prose text-sm">
                                        <LLMOutputRenderer text={m.text} isStreamFinished={!m.streaming} />
                                        {m.streaming ? <div className="text-xs text-muted-foreground mt-1">• streaming</div> : null}
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                                )}
                            </div>
                            {/* Action icons shown on hover as a row beneath the message so they do not overlap the prompt */}
                            <div className={`mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto ${m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                                <div className="flex items-center space-x-1">
                                    {m.role === 'user' ? (
                                        <>
                                            <button className="p-0.5 rounded hover:bg-neutral-800" title="Copy" onClick={() => void handleCopyText(m.text)}>
                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                            <button className="p-0.5 rounded hover:bg-neutral-800" title="Edit" onClick={() => handleEditText(m.text)}>
                                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="p-0.5 rounded hover:bg-neutral-800" title="Edit" onClick={() => handleEditText(m.text)}>
                                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                            <button className="p-0.5 rounded hover:bg-neutral-800" title="Retry" onClick={() => handleRetry(m.text)}>
                                                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* fade overlay removed per user request so messages sit flush against the prompt */}
                    </div>
                </div>
            )}



            {/* Prompt (textarea) above, controls (buttons) below */}
        <div className="flex flex-col w-full">
            <div className="min-w-0 px-2 py-0">
                    <Textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={handlePromptChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isFirstSession ? (disabled ? "Enter your prompt (set API key to enable processing)..." : "Ask me anything or upload files...") : (disabled ? "Enter your message (API key required to process)" : "Type your message...")}
                        className={`w-full resize-none overflow-y-auto text-sm px-2 py-1 bg-transparent placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 shadow-none max-h-[120px] min-h-[36px] leading-snug`}
                        style={{
                            background: theme === 'light' ? '#DAFFEF' : 'transparent',
                            color: 'hsl(var(--foreground))',
                            boxShadow: 'none',
                            outline: 'none',
                            borderColor: 'transparent',
                            border: theme === 'light' ? '1px solid #c7dccf' : '1px solid #191A1A',
                            borderRadius: '6px',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none'
                        }}
                        disabled={isProcessing || isAnimating}
                        rows={2}
                    />
                </div>

                <div className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-2">
                        {/* File picker button - hide during animation */}
                        {!isAnimating && (
                            <>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={disabled || isProcessing}
                                    className="h-10 w-10 p-0 flex-shrink-0"
                                >
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    disabled={disabled || isProcessing}
                                />

                                {/* Tools toggle - hide during animation */}
                                <div className="relative" ref={toolsToggleRef}>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setToolsOpen(v => !v)}
                                            disabled={disabled || isProcessing}
                                            className="h-10 w-10 p-0 flex-shrink-0"
                                            aria-label="Tools"
                                        >
                                            <VscSettings className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                        {/* Render the tools popup in a fixed portal so it can escape container clipping */}
                                        {toolsOpen && toolsToggleRef.current && createPortal(
                                            <div
                                                ref={toolsContainerRef}
                                                style={toolsPopupStyle || undefined}
                                                className="bg-background border rounded p-2 shadow-lg z-50 text-left w-48"
                                            >
                                                <div className="absolute right-3 -bottom-2 w-3 h-3 bg-background rotate-45 border-l border-t" />
                                                <ToggleGroup
                                                    type="multiple"
                                                    value={selectedContentTypes}
                                                    onValueChange={setSelectedContentTypes}
                                                    className="flex flex-col space-y-2 items-start"
                                                >
                                                    <ToggleGroupItem value="quiz" disabled={disabled || isProcessing} className="w-full justify-start px-3 py-3 text-left">
                                                        <BookOpen className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                                                        Quiz
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem value="flashcards" disabled={disabled || isProcessing} className="w-full justify-start px-3 py-3 text-left">
                                                        <Layers className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                                                        Flashcards
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem value="match_the_following" disabled={disabled || isProcessing} className="w-full justify-start px-3 py-3 text-left">
                                                        <Shuffle className="h-4 w-4 mr-2 inline-block text-muted-foreground" />
                                                        Match the Following
                                                    </ToggleGroupItem>
                                                </ToggleGroup>
                                            </div>,
                                            document.body
                                        )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Send icon button */}
                    <div className="ml-2">
                        <Button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={(!prompt.trim() && uploadedFiles.length === 0) || disabled || isProcessing || isStreaming || isAnimating}
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center p-0"
                            aria-label="Send"
                        >
                            {(isProcessing || isStreaming || isAnimating) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <TbArrowUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        {/* Floating uploaded-files popup positioned outside the prompt geometry */}
        {uploadedFiles.length > 0 && (
            <div style={{ position: 'fixed', left: 16, top: 16, zIndex: 60 }}>
                <div className="bg-background border rounded shadow-lg p-2 space-y-2 w-64">
                    {uploadedFiles.map(f => {
                        const IconComponent = getFileIcon(f.type, { ImageIcon, FileText, File });
                        return (
                            <div key={f.id} className="flex items-center justify-start space-x-2">
                                {f.preview ? (
                                    <img src={f.preview} alt={f.name} className="h-8 w-8 object-cover rounded" />
                                ) : (
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="text-sm truncate">{f.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        </>
    );
};