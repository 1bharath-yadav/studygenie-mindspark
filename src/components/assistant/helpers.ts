import { API_BASE_URL } from '@/lib/api';

export const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const buildFormForChat = (opts: {
    userPrompt?: string;
    userQuery?: string;
    uploadedFiles?: Array<{ file: File; name: string }>;
    sessionId?: string | null;
    selectedContentTypes?: string[] | null;
}) => {
    const { userPrompt, userQuery, uploadedFiles = [], sessionId, selectedContentTypes } = opts;
    const form = new FormData();
    if (userPrompt) form.append('user_prompt', userPrompt);
    if (userQuery) form.append('user_query', userQuery);
    if (sessionId) form.append('session_id', sessionId);
    if (selectedContentTypes && selectedContentTypes.length > 0) form.append('selected_content_types', JSON.stringify(selectedContentTypes));
    for (const f of uploadedFiles) form.append('files', f.file, f.name);
    return form;
};

export const saveActivity = async (activityType: string, payload: any, authToken?: string | null) => {
    try {
        const body = {
            activity_type: activityType,
            payload: payload || {},
            score: null,
            time_spent_seconds: null,
        } as any;

        const headers: Record<string,string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const resp = await fetch(`${API_BASE_URL}/api/v1/analytics/activity`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            console.debug('Failed to save activity', resp.status, txt);
        }
    } catch (e) {
        console.debug('saveActivity error', e);
    }
};

export const getFileIcon = (fileType: string, icons: any) => {
    if (fileType.startsWith('image/')) return icons.ImageIcon;
    if (fileType === 'application/pdf') return icons.FileText;
    return icons.File;
};
