import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Toggle } from '@/components/ui/toggle';
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
    FileImage
} from 'lucide-react';

interface IntegratedAIAssistantProps {
    disabled?: boolean;
    onContentGenerated?: (content: any) => void;
    studentId?: string;
    studentName?: string;
    gradeLevel?: string;
}

interface UploadedFile {
    file: File;
    id: string;
    name: string;
    size: string;
    type: string;
}

export const IntegratedAIAssistant: React.FC<IntegratedAIAssistantProps> = ({
    disabled = false,
    onContentGenerated,
    studentId = 'demo-student',
    studentName = 'Student',
    gradeLevel = 'High School',
}) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();
    const processFilesMutation = useProcessFiles();
    const isProcessing = processFilesMutation.status === 'pending';

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
    };

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
            type: file.type
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
        setUploadedFiles(prev => prev.filter(file => file.id !== id));
    };

    const handleSubmit = async () => {
        if (!prompt.trim() && uploadedFiles.length === 0) {
            toast({
                title: "Nothing to process",
                description: "Please enter a question or upload files to analyze.",
                variant: "destructive",
            });
            return;
        }

        try {
            // Build the user query with selected content types
            let userQuery = prompt.trim() || 'Please analyze these files and create study materials';

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

            const result = await processFilesMutation.mutateAsync({
                files: uploadedFiles.map(f => f.file),
                data: additionalData,
            });

            console.log('📤 Received result from API:', result);

            if (result) {
                // Backend now returns { session_id, llm_response } when successful.
                const sessionId = (result as any).session_id || (result as any).data?.session_id || null;
                if (sessionId) {
                    sessionStorage.setItem('studygenie_session_id', sessionId);
                }

                // Compose the content payload for the parent component
                const payload = (result as any).llm_response || (result as any).data || result;
                if (onContentGenerated) onContentGenerated(payload);
            }

            // Clear form after successful submission
            setPrompt('');
            setUploadedFiles([]);
            toast({
                title: "Success!",
                description: "Your study materials have been generated.",
            });

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
            if (!disabled && !isProcessing) handleSubmit();
        }
    }, [disabled, isProcessing, handleSubmit]);

    const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
    }, []);

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[80vw] max-w-4xl bg-background border rounded-lg p-4 z-50 space-y-4 max-h-[300px] overflow-y-auto">
            {/* Top left: Content type toggles */}
            <div className="flex justify-start">
                <ToggleGroup 
                    type="multiple" 
                    value={selectedContentTypes} 
                    onValueChange={setSelectedContentTypes} 
                    className="flex-wrap gap-2"
                >
                    <Toggle value="quiz" disabled={disabled || isProcessing}>Quiz</Toggle>
                    <Toggle value="flashcards" disabled={disabled || isProcessing}>Flashcards</Toggle>
                    <Toggle value="match_the_following" disabled={disabled || isProcessing}>Match the Following</Toggle>
                </ToggleGroup>
            </div>

            {/* Uploaded files display */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Uploaded Files:</p>
                    <div className="space-y-2">
                        {uploadedFiles.map((file) => {
                            const IconComponent = getFileIcon(file.type);
                            return (
                                <div key={file.id} className="flex items-center justify-between p-2 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{file.size}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(file.id)}
                                        disabled={isProcessing}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Prompt and buttons */}
            <div className="flex items-center space-x-2">
                {/* File picker button */}
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

                {/* Prompt textarea */}
                <Textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything or upload files..."
                    className="flex-1 min-h-[44px] max-h-[200px] resize-none overflow-y-auto text-sm p-3 bg-transparent placeholder:text-muted-foreground !border-0 !outline-none !ring-0 focus:ring-0 focus-visible:ring-0 shadow-none"
                    style={{ background: 'transparent', color: 'hsl(var(--foreground))' }}
                    disabled={disabled || isProcessing}
                    rows={1}
                />

                {/* Send icon button (round) */}
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={(!prompt.trim() && uploadedFiles.length === 0) || disabled || isProcessing}
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center p-0"
                    aria-label="Send"
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
};