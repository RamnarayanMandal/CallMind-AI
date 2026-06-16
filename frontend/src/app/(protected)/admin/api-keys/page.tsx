'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key, Plus, Copy, Trash2, RefreshCw, AlertCircle, Loader2, Eye, EyeOff, Check
} from 'lucide-react';
import { apiClient } from '@/lib/axios-client';

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  keyPreview: string;
  scopes: string[];
  rateLimit: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminApiKeysPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [isCreating, setIsCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.get('/api-keys');
      return response.data as ApiKey[];
    },
  });

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const response = await apiClient.post('/api-keys', {
        name: newKeyName.trim(),
        scopes: newKeyScopes,
        rateLimit: newKeyRateLimit,
      });
      setRevealedKey(response.data.key);
      setShowCreate(false);
      setNewKeyName('');
      setNewKeyScopes(['read']);
      setNewKeyRateLimit(60);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    } catch (err) {
      console.error('Failed to create API key', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/api-keys/${keyId}`);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    } catch (err) {
      console.error('Failed to delete API key', err);
    }
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Key className="w-8 h-8 text-emerald-500" />
            API Keys
          </h1>
          <p className="text-slate-400">Manage API keys for programmatic access to the platform.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Key
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create New API Key</CardTitle>
            <CardDescription className="text-slate-400">The full key will be shown once after creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Key Name</Label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Integration"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Scopes</Label>
              <Select value={newKeyScopes[0]} onValueChange={(v) => setNewKeyScopes([v])}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="read_write">Read & Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Rate Limit (requests per minute)</Label>
              <Input
                type="number"
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                min={1}
                max={10000}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Key
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {revealedKey && (
        <Alert className="bg-emerald-950/50 border-emerald-800 text-emerald-200">
          <Check className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>API key created: <code className="bg-emerald-900/50 px-2 py-0.5 rounded font-mono text-sm">{revealedKey}</code></span>
            <Button size="sm" variant="outline" onClick={() => handleCopy(revealedKey, 'revealed')}>
              {copiedId === 'revealed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading API keys...
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Key className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No API keys created yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {data.map((apiKey) => (
                <div key={apiKey._id} className="flex items-center justify-between p-4 hover:bg-slate-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{apiKey.name}</span>
                      <Badge variant={apiKey.isActive ? 'success' : 'secondary'} className="rounded-md">
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-slate-400 border-slate-700">
                        {apiKey.scopes.join(', ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <code className="text-xs bg-slate-800 px-2 py-0.5 rounded">{apiKey.keyPreview}...</code>
                      <span>{apiKey.rateLimit} req/min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(apiKey.key, apiKey._id)}>
                      {copiedId === apiKey._id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(apiKey._id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}