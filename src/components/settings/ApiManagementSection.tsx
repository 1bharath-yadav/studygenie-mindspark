import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  useApiKeys, useCreateApiKey, useDeleteApiKey,
  useLLMProviders, useModelPreferences,
  useModelsByProvider, useToggleModelActive, useSetActiveApiKey
} from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Plus, Trash2 } from 'lucide-react';
import type { ApiKeyCreate, LLMModel } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

const ApiManagementSection: React.FC = () => {
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const { data: apiKeys, isLoading: apiKeysLoading, refetch: refetchApiKeys } = useApiKeys({ enabled: isAuthenticated });
  const { data: providers, isLoading: providersLoading } = useLLMProviders();
  const { data: modelPreferences = [], isLoading: preferencesLoading } = useModelPreferences();
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const setActiveKeyMutation = useSetActiveApiKey();
  // model preference creation/default APIs removed — Active is the canonical control

  const [apiKeyForm, setApiKeyForm] = useState({ provider_id: '', api_key: '' });
  // Chat configuration selectors
  const [chatConfig, setChatConfig] = useState({ provider: '', model: '', api_key_id: '' });
  // Embedding configuration selectors
  const [embedConfig, setEmbedConfig] = useState({ provider: '', model: '', api_key_id: '' });

  const { data: chatModels = [], isLoading: chatModelsLoading } = useQuery<LLMModel[]>({
    queryKey: ['models', 'available', 'chat'],
    queryFn: () => apiClient.get('/api/v1/models/available/chat'),
  });

  const { data: embeddingModels = [], isLoading: embeddingModelsLoading } = useQuery<LLMModel[]>({
    queryKey: ['models', 'available', 'embedding'],
    queryFn: () => apiClient.get('/api/v1/models/available/embedding'),
  });

  // Local provider filters
  const [selectedChatProvider, setSelectedChatProvider] = useState<string>('');
  const [selectedEmbeddingProvider, setSelectedEmbeddingProvider] = useState<string>('');

  const { data: chatModelsByProvider = [], isLoading: chatByProvLoading } = useModelsByProvider(selectedChatProvider || '');
  const { data: embeddingModelsByProvider = [], isLoading: embeddingByProvLoading } = useModelsByProvider(selectedEmbeddingProvider || '');

  const toggleModelActive = useToggleModelActive();

  // Active per-use-case flags are provided on model objects (is_active_chat / is_active_embedding)

  // derive providers for which the user has API keys
  const providersWithKeys = React.useMemo(() => {
    const s = new Set<string>();
    (apiKeys || []).forEach((k: any) => {
      // backend may store provider_name or provider_id; add both when present
      if (k.provider_name) s.add(k.provider_name);
      if (k.provider_id) s.add(k.provider_id);
    });
    return s;
  }, [apiKeys]);

  const handleApiKeyCreate = async () => {
    if (!apiKeyForm.provider_id || !apiKeyForm.api_key) {
      toast({ title: "Missing information", description: "Provider and API key required.", variant: "destructive" });
      return;
    }
    try {
      const data: ApiKeyCreate = { provider_id: apiKeyForm.provider_id, api_key: apiKeyForm.api_key };
      await createApiKeyMutation.mutateAsync(data);
      setApiKeyForm({ provider_id: '', api_key: '' });
      refetchApiKeys();
      toast({ title: "API key added", description: "Key stored securely." });
    } catch (error) {
      // Better error handling for API responses
      const msg = (error && (error as any).message) ? (error as any).message : JSON.stringify(error);
      toast({ title: "Add failed", description: msg, variant: "destructive" });
    }
  };

  const handleApiKeyDelete = async (id: string) => {
    try {
      await deleteApiKeyMutation.mutateAsync(id);
      refetchApiKeys();
      toast({ title: "API key deleted", description: "Key removed." });
    } catch (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  // Default model concept removed; 'Activate' is now the canonical selection per use-case.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>API Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-background text-foreground">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <h3 className="font-medium flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Add API Key</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select id="provider" value={apiKeyForm.provider_id} onChange={e => setApiKeyForm(prev => ({ ...prev, provider_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" disabled={providersLoading}>
                <option value="">Select provider...</option>
                {providers?.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" type="password" value={apiKeyForm.api_key} onChange={e => setApiKeyForm(prev => ({ ...prev, api_key: e.target.value }))} />
            </div>
          </div>
          <Button onClick={handleApiKeyCreate} disabled={createApiKeyMutation.isPending}> {createApiKeyMutation.isPending ? 'Adding...' : 'Add Key'} </Button>
        </div>
        <Separator />
        <div className="space-y-3">
          <h3 className="font-medium">Your API Keys</h3>
          {apiKeysLoading ? <div>Loading keys...</div> : apiKeys?.length > 0 ? apiKeys.map(key => (
            <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{key.provider_display_name}</div>
                  <div className="text-sm text-muted-foreground">Created {new Date(key.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={key.is_active ? "default" : "secondary"}>{key.is_active ? "Active" : "Inactive"}</Badge>
                <Button size="sm" variant={key.is_active ? 'default' : 'outline'} onClick={() => setActiveKeyMutation.mutate(key.id)} disabled={(setActiveKeyMutation as any).isLoading || (setActiveKeyMutation as any).isPending}>
                  {key.is_active ? 'Active' : 'Set active'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleApiKeyDelete(key.id)} disabled={deleteApiKeyMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          )) : <div className="text-center py-8 text-muted-foreground"><Key className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No keys configured</p></div>}
        </div>
        <Separator />
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium flex items-center space-x-2"><Key className="h-5 w-5" /><span>Chat Model</span></h3>
            {preferencesLoading || chatModelsLoading ? (
              <div>Loading chat models...</div>
            ) : (
              <>
                {/* Configuration controls: provider selector (models shown below) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label htmlFor="chat-config-provider">Provider</Label>
                    <select id="chat-config-provider" value={chatConfig.provider} onChange={e => { setChatConfig(prev => ({ ...prev, provider: e.target.value, model: '' })); setSelectedChatProvider(e.target.value); }} className="mt-1 block w-full rounded-md border px-2 py-1 bg-background text-foreground">
                      <option value="">Select provider</option>
                      {providers?.map(p => {
                        const hasKey = providersWithKeys.has(p.id) || providersWithKeys.has(p.name);
                        return <option key={`chat-prov-${p.id}`} value={p.name || p.id} disabled={!hasKey}>{p.display_name}{!hasKey ? ' (no key uploaded)' : ''}</option>
                      })}
                    </select>
                  </div>
                </div>
                {Array.from(new Map((selectedChatProvider ? chatModelsByProvider : []).filter((m: any) => !m.supports_embedding).map((m: any) => [m.id, m])).values()).length > 0 ? Array.from(new Map((selectedChatProvider ? chatModelsByProvider : []).filter((m: any) => !m.supports_embedding).map((m: any) => [m.id, m])).values()).map(model => {
                      const providerDisplay = providers?.find(p => p.id === model.provider_id)?.display_name || providers?.find(p => p.name === model.provider_id)?.display_name || 'Unknown';
                  return (
                    <div key={`chat-model-${model.provider_id}-${model.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{model.display_name}</div>
                          <div className="text-sm text-muted-foreground">by {providerDisplay}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant={model.is_active_chat ? 'default' : 'outline'} onClick={() => toggleModelActive.mutate({ modelId: model.id, isActive: true, useCase: 'chat' })}>
                          {model.is_active_chat ? 'Active' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  );
                }) : <div>No available chat models</div>}
              </>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium flex items-center space-x-2"><Key className="h-5 w-5" /><span>Embedding Model</span></h3>
            {preferencesLoading || embeddingModelsLoading ? (
              <div>Loading embedding models...</div>
            ) : (
              <>
                {/* Embedding configuration controls */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-3">
                  <div>
                    <Label htmlFor="embed-config-provider">Provider</Label>
                    <select id="embed-config-provider" value={embedConfig.provider} onChange={e => { setEmbedConfig(prev => ({ ...prev, provider: e.target.value, model: '' })); setSelectedEmbeddingProvider(e.target.value); }} className="mt-1 block w-full rounded-md border px-2 py-1 bg-background text-foreground">
                      <option value="">Select provider</option>
                      {providers?.map(p => {
                        const hasKey = providersWithKeys.has(p.id) || providersWithKeys.has(p.name);
                        return <option key={`embed-prov-${p.id}`} value={p.name || p.id} disabled={!hasKey}>{p.display_name}{!hasKey ? ' (no key uploaded)' : ''}</option>
                      })}
                    </select>
                  </div>
                </div>
                {Array.from(new Map((selectedEmbeddingProvider ? embeddingModelsByProvider : []).filter((m: any) => m.supports_embedding).map((m: any) => [m.id, m])).values()).length > 0 ? Array.from(new Map((selectedEmbeddingProvider ? embeddingModelsByProvider : []).filter((m: any) => m.supports_embedding).map((m: any) => [m.id, m])).values()).map(model => {
                  const providerDisplay = providers?.find(p => p.id === model.provider_id)?.display_name || providers?.find(p => p.name === model.provider_id)?.display_name || 'Unknown';
                  return (
                    <div key={`embed-model-${model.provider_id}-${model.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{model.display_name}</div>
                          <div className="text-sm text-muted-foreground">by {providerDisplay}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant={model.is_active_embedding ? 'default' : 'outline'} onClick={() => toggleModelActive.mutate({ modelId: model.id, isActive: true, useCase: 'embedding' })}>
                          {model.is_active_embedding ? 'Active' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  );
                }) : <div>No available embedding models</div>}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiManagementSection;