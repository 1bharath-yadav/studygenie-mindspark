import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    selectedContentTypes?: string[];
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
    selectedContentTypes = []
}) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const processFilesMutation = useProcessFiles();

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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [handleFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
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

            if (selectedContentTypes.length > 0) {
                const contentTypeNames = selectedContentTypes.map(type => {
                    switch (type) {
                        case 'flashcards': return 'flashcards';
                        case 'quiz': return 'quiz questions';
                        case 'match_the_following': return 'match the following exercise';
                        default: return type;
                    }
                });
                userQuery += `. Please specifically create: ${contentTypeNames.join(', ')}.`;
            }

            console.log('Sending user query:', userQuery); // Debug log

            const result = await processFilesMutation.mutateAsync({
                files: uploadedFiles.map(f => f.file),
                data: {
                    student_id: studentId,
                    user_query: userQuery
                }
            });

            console.log('📤 Received result from API:', result);
            console.log('📤 Result type:', typeof result);
            console.log('📤 Result keys:', result ? Object.keys(result) : 'null/undefined');

            if (result && onContentGenerated) {
                console.log('📤 Calling onContentGenerated with result:', result);
                onContentGenerated(result);
                console.log('📤 onContentGenerated callback completed');
            } else {
                console.log('📤 NOT calling onContentGenerated - result:', !!result, 'callback:', !!onContentGenerated);
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
        }
    };

    const isProcessing = processFilesMutation.isPending;

    return (
        <div className="space-y-4">
            {/* Prompt input */}
            <div className="space-y-3">
                <Textarea
                    placeholder="Ask me anything about your study materials or upload files to get started. I can create quizzes, summaries, flashcards, and answer questions..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-y border-border focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={disabled || isProcessing}
                    rows={4}
                />

                {/* File upload area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/50 hover:bg-muted/70'
                        }`}
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">
                            {isDragging
                                ? 'Drop files here...'
                                : 'Drop files here or click to upload (PDF, Images, Documents)'
                            }
                        </span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={disabled || isProcessing}
                    />
                </div>
            </div>

            {/* Uploaded files display */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Uploaded Files:</p>
                    <div className="space-y-2">
                        {uploadedFiles.map((file) => {
                            const IconComponent = getFileIcon(file.type);
                            return (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
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

            {/* Submit button */}
            <Button
                onClick={handleSubmit}
                disabled={(!prompt.trim() && uploadedFiles.length === 0) || disabled || isProcessing}
                className="w-full"
                variant="default"
            >
                {isProcessing ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Analyze & Generate</span>
                    </div>
                )}
            </Button>
        </div>
    );
};
