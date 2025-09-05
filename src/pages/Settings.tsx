import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    useApiKeys,
    useCreateApiKey,
    useDeleteApiKey,
    useHealthCheck,
    useCurrentUser,
    useUpdateUserProfile,
    useDeleteUserProfile
} from '@/hooks/useApi';
import {
    Settings,
    Key,
    User,
    Globe,
    Shield,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    Clock,
    Server
} from 'lucide-react';
import type { CreateApiKeyRequest } from '@/types/api';

const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    // API hooks
    const { data: apiKeys, isLoading: apiKeysLoading, refetch: refetchApiKeys } = useApiKeys();
    const { data: healthData, isLoading: healthLoading } = useHealthCheck();
    const { data: currentUser } = useCurrentUser();
    const createApiKeyMutation = useCreateApiKey();
    const deleteApiKeyMutation = useDeleteApiKey();
    const updateProfileMutation = useUpdateUserProfile();
    const deleteProfileMutation = useDeleteUserProfile();

    // Form states
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        gradeLevel: '',
        learningPreferences: '',
        bio: ''
    });

    const [apiKeyForm, setApiKeyForm] = useState({
        name: '',
        service: 'gemini' as 'gemini' | 'openai' | 'anthropic',
        key: ''
    });

    const [showApiKey, setShowApiKey] = useState<string | null>(null);
    const [isFirstTime, setIsFirstTime] = useState(false);

    // Initialize profile form with user data
    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                gradeLevel: currentUser.grade_level || '',
                learningPreferences: currentUser.learning_preferences?.join(', ') || '',
                bio: currentUser.bio || ''
            });
        }
    }, [currentUser]);

    // Check if user needs to set up API keys (first time)
    useEffect(() => {
        if (apiKeys && apiKeys.length === 0 && !apiKeysLoading) {
            setIsFirstTime(true);
        }
    }, [apiKeys, apiKeysLoading]);

    const handleProfileUpdate = async () => {
        try {
            const updateData = {
                name: profileForm.name,
                grade_level: profileForm.gradeLevel,
                learning_preferences: profileForm.learningPreferences.split(',').map(p => p.trim()).filter(Boolean),
                bio: profileForm.bio
            };

            await updateProfileMutation.mutateAsync(updateData);

            toast({
                title: "Profile updated successfully",
                description: "Your profile information has been saved.",
            });
        } catch (error) {
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            });
        }
    };

    const handleApiKeyCreate = async () => {
        if (!apiKeyForm.name || !apiKeyForm.key) {
            toast({
                title: "Missing information",
                description: "Please provide both name and API key",
                variant: "destructive",
            });
            return;
        }

        try {
            await createApiKeyMutation.mutateAsync(apiKeyForm);
            setApiKeyForm({ name: '', service: 'gemini', key: '' });
            setIsFirstTime(false);
            refetchApiKeys();

            toast({
                title: "API key added successfully",
                description: "Your API key has been securely stored.",
            });
        } catch (error) {
            toast({
                title: "Failed to add API key",
                description: error instanceof Error ? error.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleApiKeyDelete = async (id: string) => {
        try {
            await deleteApiKeyMutation.mutateAsync(id);
            refetchApiKeys();

            toast({
                title: "API key deleted",
                description: "The API key has been removed from your account.",
            });
        } catch (error) {
            toast({
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Failed to delete API key",
                variant: "destructive",
            });
        }
    };

    const toggleApiKeyVisibility = (id: string) => {
        setShowApiKey(showApiKey === id ? null : id);
    };

    return (
        <AppLayout
            title="Settings"
            subtitle="Manage your profile and API configurations"
            icon={Settings}
        >
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Settings className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Settings</h1>
                            <p className="text-muted-foreground">Manage your profile and API configurations</p>
                        </div>
                    </div>

                    <Button variant="outline" onClick={logout}>
                        Sign Out
                    </Button>
                </div>

                {/* First time setup banner */}
                {isFirstTime && (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                <div>
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Setup Required</h3>
                                    <p className="text-amber-700 dark:text-amber-300">
                                        Welcome! Please add your AI service API key below to start using StudyGenie.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Profile Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="your@email.com"
                                    disabled={!!currentUser?.email}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gradeLevel">Grade Level</Label>
                                <Input
                                    id="gradeLevel"
                                    value={profileForm.gradeLevel}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, gradeLevel: e.target.value }))}
                                    placeholder="e.g., High School, College, Graduate"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="preferences">Learning Preferences</Label>
                                <Textarea
                                    id="preferences"
                                    value={profileForm.learningPreferences}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, learningPreferences: e.target.value }))}
                                    placeholder="e.g., Visual learner, Math, Science, History (comma-separated)"
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={profileForm.bio}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Tell us a bit about yourself..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            <Button
                                onClick={handleProfileUpdate}
                                disabled={updateProfileMutation.isPending}
                                className="w-full"
                            >
                                {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* System Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Server className="h-5 w-5" />
                                <span>System Status</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {/* Backend Health */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Backend Service</span>
                                    </div>
                                    {healthLoading ? (
                                        <Badge variant="secondary">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Checking...
                                        </Badge>
                                    ) : healthData?.status === 'healthy' ? (
                                        <Badge variant="default">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Online
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Offline
                                        </Badge>
                                    )}
                                </div>

                                {/* API Keys Status */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">AI Services</span>
                                    </div>
                                    {apiKeysLoading ? (
                                        <Badge variant="secondary">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Checking...
                                        </Badge>
                                    ) : (apiKeys && apiKeys.length > 0) ? (
                                        <Badge variant="default">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {apiKeys.length} Key{apiKeys.length !== 1 ? 's' : ''}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            No Keys
                                        </Badge>
                                    )}
                                </div>

                                {/* Authentication Status */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Authentication</span>
                                    </div>
                                    <Badge variant="default">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Authenticated
                                    </Badge>
                                </div>
                            </div>

                            {healthData && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Last checked: {new Date().toLocaleTimeString()}
                                    </p>
                                    {healthData.message && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {healthData.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* API Keys Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Key className="h-5 w-5" />
                            <span>API Keys</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Add New API Key */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <h3 className="font-medium flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Add New API Key</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKeyName">Name</Label>
                                    <Input
                                        id="apiKeyName"
                                        value={apiKeyForm.name}
                                        onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., My Gemini Key"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKeyService">Service</Label>
                                    <select
                                        id="apiKeyService"
                                        value={apiKeyForm.service}
                                        onChange={(e) => setApiKeyForm(prev => ({ ...prev, service: e.target.value as any }))}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="gemini">Google Gemini</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic Claude</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={apiKeyForm.key}
                                        onChange={(e) => setApiKeyForm(prev => ({ ...prev, key: e.target.value }))}
                                        placeholder="Enter your API key"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleApiKeyCreate}
                                disabled={createApiKeyMutation.isPending}
                                className="w-full md:w-auto"
                            >
                                {createApiKeyMutation.isPending ? 'Adding...' : 'Add API Key'}
                            </Button>
                        </div>

                        <Separator />

                        {/* Existing API Keys */}
                        <div className="space-y-3">
                            <h3 className="font-medium">Your API Keys</h3>

                            {apiKeysLoading ? (
                                <div className="text-center py-4">Loading API keys...</div>
                            ) : (apiKeys && apiKeys.length > 0) ? (
                                <div className="space-y-3">
                                    {apiKeys.map((apiKey) => (
                                        <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{apiKey.name}</div>
                                                    <div className="text-sm text-muted-foreground capitalize">
                                                        {apiKey.service} • Created {new Date(apiKey.created_at).toLocaleDateString()}
                                                    </div>
                                                    {apiKey.last_used && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Last used: {new Date(apiKey.last_used).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                                                    {apiKey.is_active ? "Active" : "Inactive"}
                                                </Badge>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleApiKeyVisibility(apiKey.id)}
                                                >
                                                    {showApiKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleApiKeyDelete(apiKey.id)}
                                                    disabled={deleteApiKeyMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No API keys configured</p>
                                    <p className="text-sm">Add an API key above to start using AI features</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default SettingsPage;
