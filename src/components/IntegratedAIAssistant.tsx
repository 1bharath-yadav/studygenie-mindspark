import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';
import { useProcessFiles } from '@/hooks/useApi';
import {
    Upload,
    File,
    X,
    Send,
    Loader2,
    FileText,
    Image as ImageIcon,
    FileImage,
    BookOpen,
    Layers,
    Shuffle
} from 'lucide-react';

// runtime-safe icon loader: try to load react-icons/gi at runtime, fall back to an inline SVG
const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
    // Try to require the package at runtime (works in CommonJS if present), otherwise render fallback
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ri = require('react-icons/gi');
        const Comp = ri?.GiSettingsKnobs;
        if (Comp) return <Comp {...props} />;
    } catch (e) {
        // noop - fall through to fallback
    }

    // Simple fallback SVG (three knobs) with inheritable size/color
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="3" y="3" width="2" height="12" rx="1" fill="currentColor" />
            <rect x="10" y="1" width="2" height="16" rx="1" fill="currentColor" />
            <rect x="17" y="6" width="2" height="11" rx="1" fill="currentColor" />
            <circle cx="13" cy="7" r="1.2" fill="currentColor" />
        </svg>
    );
};

// Markdown rendering libs
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
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
    const [autoScroll, setAutoScroll] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(false);
    // Default to false so opening the assistant via the chat bubble does not
    // show the centered fresh-session UI. Only explicit 'open-assistant' or
    // 'clear-session' will set a true fresh-session state.
    const [isFirstSession, setIsFirstSession] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false); // Track animation state
    
    // Persisted chat key is either session-specific (preferred) or falls back to student id
    // We store messages in localStorage so a user can refresh and restore the chat for the session.
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toolsContainerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();
    const processFilesMutation = useProcessFiles();
    const isProcessing = processFilesMutation.status === 'pending';
    const [isStreaming, setIsStreaming] = useState(false);

    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return ImageIcon;
        if (fileType === 'application/pdf') return FileText;
        return File;
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const maxHeight = 200;
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        }
    }, []);

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

                // First try to restore from localStorage session key (fast, offline)
                const rawSession = sessionIdToUse ? localStorage.getItem(sessionKey) : null;
                if (rawSession) {
                    const parsed = JSON.parse(rawSession);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setChatMessages(parsed);
                        hasExistingMessages = true;
                        setIsFirstSession(false);
                        return;
                    }
                }

                // If we have a server session id, try fetching canonical session from backend
                if (sessionIdToUse) {
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
                                setChatMessages(msgs);
                                hasExistingMessages = true;
                                setIsFirstSession(false);
                            }
                            // Deliver study materials to parent for rendering on home page
                            if (data && data.study_materials && onContentGenerated) {
                                onContentGenerated(data.study_materials);
                            }
                            return;
                        }
                    } catch (e) {
                        // ignore and fall back to localStorage/student-key
                        console.debug('Failed to fetch session from API, falling back to localStorage', e);
                    }
                }

                // Fallback: if only student-keyed messages exist in localStorage, migrate them to session key
                const rawStudent = localStorage.getItem(studentKey);
                if (rawStudent) {
                    const parsed = JSON.parse(rawStudent);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        if (sessionIdToUse) {
                            try { localStorage.setItem(sessionKey, rawStudent); } catch {}
                        }
                        setChatMessages(parsed);
                        hasExistingMessages = true;
                        setIsFirstSession(false);
                    }
                }

                // If no existing messages found, this is truly a fresh session
                if (!hasExistingMessages) {
                    setIsFirstSession(true);
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

    // Auto-scroll the chat messages container when new messages arrive
    useEffect(() => {
        if (!autoScroll) return;
        const el = messagesRef.current;
        if (!el) return;
        // scroll to bottom smoothly
        try {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch (e) {
            el.scrollTop = el.scrollHeight;
        }
    }, [chatMessages, autoScroll]);

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

    // popup position state
    const [popupPos, setPopupPos] = useState<{ left: number; top: number } | null>(null);
    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // position popup slightly above and to the left of the assistant container
        setPopupPos({ left: Math.max(8, rect.left - 8), top: Math.max(8, rect.top - 48) });
    }, [uploadedFiles.length, isFirstSession, isAnimating]);

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

        // If user requested structured outputs (flashcards/quiz/match) or uploaded files,
        // hide the compact assistant immediately — we're switching to a material-generation flow.
        try {
            if ((selectedContentTypes && selectedContentTypes.length > 0) || uploadedFiles.length > 0) {
                try { window.dispatchEvent(new CustomEvent('studygenie:hide-assistant')); } catch (e) {}
            }
        } catch (e) {}

            // Start animation if this is the first session. We first enable the
            // transitional classes (isAnimating), then in the next tick switch
            // the container from centered -> bottom (isFirstSession=false) so
            // the CSS transition runs. After the transition duration we clear
            // the animation flag.
            if (isFirstSession) {
                setIsAnimating(true);
                // give React a tick to apply isAnimating classes
                await new Promise(resolve => setTimeout(resolve, 50));
                setIsFirstSession(false);
                // wait for the visual transition to finish (match duration in classes)
                await new Promise(resolve => setTimeout(resolve, 700));
                setIsAnimating(false);
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

            // Attach session_id if present in sessionStorage so server can append to history
            const storedSessionId = sessionStorage.getItem('studygenie_session_id');
            const additionalData: Record<string, any> = {
                student_id: studentId,
                user_query: userQuery,
            };
            if (storedSessionId) additionalData.session_id = storedSessionId;
            if (selectedContentTypes && selectedContentTypes.length > 0) additionalData.selected_content_types = selectedContentTypes;

            // If user did not select any structured outputs and there are no files,
            // use the streaming chat endpoint for a regular chat experience.
            let result: any = null;
            if ((!selectedContentTypes || selectedContentTypes.length === 0) && uploadedFiles.length === 0) {
                // Call streaming endpoint
                setIsStreaming(true);
                const form = new FormData();
                form.append('user_prompt', userQuery);
                const sessionIdToSend = sessionId ?? sessionStorage.getItem('studygenie_session_id');
                if (sessionIdToSend) form.append('session_id', sessionIdToSend);

                const authToken = localStorage.getItem('authToken');
                const headers: Record<string,string> = {};
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const resp = await fetch('/api/v1/llm/chat-stream', {
                    method: 'POST',
                    body: form,
                    headers,
                });

                if (!resp.ok) throw new Error('Chat stream request failed');

                // Prepare chat state: add user's message and an empty assistant message ready to stream into
                const userMsgId = Math.random().toString(36).slice(2, 9);
                const assistantMsgId = Math.random().toString(36).slice(2, 9);
                setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userQuery }, { id: assistantMsgId, role: 'assistant', text: '', streaming: true }]);

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

                // Persist session id if backend created one
                const returnedSessionId = finalOutput?.session_id || finalOutput?.sessionId || null;
                if (returnedSessionId) {
                    try {
                        sessionStorage.setItem('studygenie_session_id', returnedSessionId);
                    } catch (e) {}
                }

                // Notify parent with final output
                if (onContentGenerated) onContentGenerated(finalOutput || null);
                result = { session_id: finalOutput?.session_id || null, llm_response: finalOutput || null };
            } else {
                result = await processFilesMutation.mutateAsync({
                    files: uploadedFiles.map(f => f.file),
                    data: additionalData,
                });

                // If backend returned a session id in the non-streaming path, persist it
                const returnedSid = result?.session_id || result?.sessionId || result?.llm_response?.session_id || null;
                if (returnedSid) {
                    try { sessionStorage.setItem('studygenie_session_id', returnedSid); } catch (e) {}
                }
                if (onContentGenerated) onContentGenerated(result?.llm_response || result || null);
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
        } finally {
            // ensure mutation state is reset (react-query handles isLoading)
        }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isProcessing && !isAnimating) handleSubmit();
        }
    }, [disabled, isProcessing, isAnimating, handleSubmit]);

    const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
    }, []);

    // Determine the container classes and styles based on session state
    const getContainerClasses = () => {
        if (isFirstSession) {
            // show centered prompt without an animated transition
            return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-2xl bg-background border rounded-lg p-6 z-50 space-y-4";
        } else if (isAnimating) {
            // treat animating as the same visual state without CSS animation classes
            return "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-2xl bg-background border rounded-lg p-6 z-50 space-y-4";
        } else {
            // center horizontally at the bottom and occupy ~60% of the viewport width
            return "fixed bottom-4 left-1/2 -translate-x-1/2 w-[60vw] max-w-[80vw] bg-background border rounded-lg p-4 z-50 space-y-4";
        }
    };

    const getContainerStyle = () => {
        if (isFirstSession || isAnimating) {
            return {};
        } else {
            return { maxHeight: 'calc(100vh - 48px)' };
        }
    };

    return (
        <>
        <div
            ref={containerRef}
            className={getContainerClasses()}
            style={getContainerStyle()}
        >
            {/* Welcome message removed per request */}

            

            {/* Chat messages panel - only show if not first session and has messages */}
            {!isFirstSession && chatMessages.length > 0 && (
                <div
                    ref={messagesRef}
                    className="overflow-y-auto overflow-x-hidden border rounded p-3 bg-muted/5"
                    style={{ maxHeight: 'calc(50vh)' }}
                >
                            {/** Render messages as user->assistant pairs when possible so we can attach actions per pair */}
                            {(() => {
                                const nodes: React.ReactNode[] = [];
                                for (let i = 0; i < chatMessages.length; i++) {
                                    const m = chatMessages[i];
                                    if (m.role === 'user') {
                                        const assistant = chatMessages[i + 1] && chatMessages[i + 1].role === 'assistant' ? chatMessages[i + 1] : null;
                                        const key = m.id + (assistant ? '_' + assistant.id : '');
                                        nodes.push(
                                            <div key={key} className="mb-4">
                                                <div className="text-right">
                                                    <div className="inline-block p-3 rounded-lg bg-accent/90 text-accent-foreground max-w-[85%] ml-auto text-sm">
                                                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                                                    </div>
                                                </div>

                                                {assistant ? (
                                                    <div className="mt-2 flex items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="inline-block p-3 rounded-lg bg-surface text-sm max-w-full break-words">
                                                                <div className="max-w-full break-words overflow-hidden prose text-sm">
                                                                    <LLMOutputRenderer text={assistant.text} isStreamFinished={!assistant.streaming} />
                                                                </div>
                                                                {assistant.streaming ? <div className="text-xs text-muted-foreground mt-1">• streaming</div> : null}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button
                                                                className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200"
                                                                onClick={async () => {
                                                                    try {
                                                                        await navigator.clipboard.writeText(assistant.text || '');
                                                                    } catch {}
                                                                }}
                                                            >
                                                                Copy
                                                            </button>
                                                            <button
                                                                className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200"
                                                                onClick={() => void handleSubmit(m.text)}
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                        if (assistant) i++; // skip next as we rendered it
                                    } else if (m.role === 'assistant') {
                                        // orphan assistant message (no preceding user) - render normally with actions
                                        nodes.push(
                                            <div key={m.id} className="mb-3 text-left">
                                                <div className="inline-block p-3 rounded-lg bg-surface text-sm max-w-full break-words">
                                                    <div className="max-w-full break-words overflow-hidden prose text-sm">
                                                        <LLMOutputRenderer text={m.text} isStreamFinished={!m.streaming} />
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex gap-2">
                                                    <button className="text-xs px-2 py-1 rounded bg-neutral-100" onClick={async () => { try { await navigator.clipboard.writeText(m.text || ''); } catch {} }}>Copy</button>
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return nodes;
                            })()}
                </div>
            )}

            {/* Prompt and buttons */}
            <div className="flex items-end space-x-2">
                <div className="flex-1 min-w-0 flex items-end space-x-2">
                {/* File picker button - hide during animation */}
                {!isAnimating && (
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
                )}
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
                {!isAnimating && (
                    <div className="relative">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setToolsOpen(v => !v)}
                            disabled={disabled || isProcessing}
                            className="h-10 w-10 p-0 flex-shrink-0"
                            aria-label="Tools"
                        >
                            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        {toolsOpen && (
                            <div ref={toolsContainerRef} className="absolute right-0 bottom-full mb-2 w-48 bg-background border rounded p-2 shadow-lg z-50 text-left">
                                {/* small arrow pointing to the button */}
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
                            </div>
                        )}
                    </div>
                )}

                {/* Prompt textarea */}
                <Textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isFirstSession ? "Ask me anything or upload files..." : "Type your message..."}
                    className={`flex-1 self-end resize-none overflow-y-auto text-sm px-3 py-2 bg-transparent placeholder:text-muted-foreground !border-0 !outline-none !ring-0 focus:ring-0 focus-visible:ring-0 shadow-none max-h-[200px]`}
                    style={{ background: 'transparent', color: 'hsl(var(--foreground))' }}
                    disabled={disabled || isProcessing || isAnimating}
                    rows={1}
                />
                </div>

                {/* Send icon button */}
                <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={(!prompt.trim() && uploadedFiles.length === 0) || disabled || isProcessing || isStreaming || isAnimating}
                    variant="ghost"
                    size="icon"
                    className="self-end rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center p-0"
                    aria-label="Send"
                >
                    {(isProcessing || isStreaming || isAnimating) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>

        {/* Floating uploaded-files popup positioned outside the prompt geometry */}
        {uploadedFiles.length > 0 && popupPos && (
            <div style={{ position: 'fixed', left: popupPos.left, top: popupPos.top, zIndex: 60 }}>
                <div className="bg-background border rounded shadow-lg p-2 space-y-2 w-64">
                    {uploadedFiles.map(f => {
                        const IconComponent = getFileIcon(f.type);
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