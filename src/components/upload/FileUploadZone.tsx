import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProcessFiles } from '@/hooks/useApi';
import type { LearningContent } from '@/types/api';
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileImage,
  FileIcon
} from 'lucide-react';

interface FileUploadZoneProps {
  disabled?: boolean;
  onFilesUploaded?: (files: File[]) => void;
  onContentGenerated?: (content: LearningContent) => void;
  studentName?: string;
  gradeLevel?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  preview?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  disabled = false,
  onFilesUploaded,
  onContentGenerated,
  studentName,
  gradeLevel
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const processFilesMutation = useProcessFiles();

  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-destructive" />;
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-primary" />;
    if (fileType.includes('text')) return <File className="h-8 w-8 text-secondary" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-8 w-8 text-accent" />;
    return <FileIcon className="h-8 w-8 text-muted-foreground" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('text')) return 'Text';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word Doc';
    return 'File';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = async (uploadedFile: UploadedFile) => {
    try {
      // Start processing
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, progress: 10 }
            : f
        )
      );

      const result = await processFilesMutation.mutateAsync({
        files: [uploadedFile.file],
        data: {
          student_name: studentName,
          grade_level: gradeLevel,
        }
      });

      // Update progress during processing
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, progress: 100, status: 'completed' }
            : f
        )
      );

      // If content was generated, call the callback
      if (result.content && onContentGenerated) {
        // Log the original result from backend
        console.log('🔄 FileUploadZone received result from backend:', result);
        console.log('🔄 Backend metadata fields:', {
          subject_name: result.subject_name,
          chapter_name: result.chapter_name,
          concept_name: result.concept_name,
          difficulty_level: result.difficulty_level,
          estimated_study_time: result.estimated_study_time
        });

        // Combine content with metadata
        const contentWithMetadata: LearningContent = {
          ...result.content,
          metadata: {
            subject_name: result.subject_name,
            chapter_name: result.chapter_name,
            concept_name: result.concept_name,
            difficulty_level: result.difficulty_level,
            estimated_study_time: result.estimated_study_time
          }
        };

        console.log('🔄 FileUploadZone sending to frontend:', contentWithMetadata);
        console.log('🔄 Metadata being sent:', contentWithMetadata.metadata);
        onContentGenerated(contentWithMetadata);
      }

      toast({
        title: "File processed successfully!",
        description: "Study materials have been generated from your uploaded file.",
      });

    } catch (error) {
      // Mark as error
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error' }
            : f
        )
      );

      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive",
      });
    }
  };

  const handleFiles = async (files: FileList) => {
    if (disabled) return;

    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (!error) {
        validFiles.push(file);
        const preview = await generatePreview(file);
        const uploadedFile: UploadedFile = {
          file,
          id: `${Date.now()}-${i}`,
          progress: 0,
          status: 'uploading',
          preview
        };
        newUploadedFiles.push(uploadedFile);
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

    // Process uploaded files
    newUploadedFiles.forEach(uploadedFile => {
      processFiles(uploadedFile);
    });

    onFilesUploaded?.(validFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${isDragging
          ? 'border-primary bg-primary/5 scale-101'
          : disabled
            ? 'border-muted bg-muted/5 opacity-50'
            : 'border-muted-foreground/20 hover:border-primary/50'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Compact upload area: smaller padding and a single full-width button */}
        <CardContent className="p-4">
          <div className="flex flex-col items-stretch space-y-3">
            <div className="flex items-center space-x-3">
              <Upload className={`h-5 w-5 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <h3 className="text-sm font-medium">
                  {isDragging ? 'Drop files here' : 'Upload study materials'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {disabled ? 'Please configure your API key to upload files' : 'Drag & drop files or use the button below'}
                </p>
              </div>
            </div>

            {!disabled && (
              <>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="w-full py-2"
                >
                  Choose files to upload
                </Button>

                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </>
            )}

            <div className="text-xs text-muted-foreground">
              Supported: PDF, TXT, DOC, DOCX, JPG, PNG (max 10MB each)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Uploaded Files ({uploadedFiles.length})
          </h4>

          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="glass-effect border-0">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted/20">
                        {getFileIcon(uploadedFile.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium truncate">
                          {uploadedFile.file.name}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(uploadedFile.file.type)}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        {uploadedFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {uploadedFile.status === 'completed' && (
                          <Check className="h-4 w-4 text-success" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(uploadedFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                        <span>
                          {uploadedFile.status === 'uploading' && `${uploadedFile.progress}%`}
                          {uploadedFile.status === 'completed' && 'Completed'}
                          {uploadedFile.status === 'error' && 'Error'}
                        </span>
                      </div>

                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="h-1" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};