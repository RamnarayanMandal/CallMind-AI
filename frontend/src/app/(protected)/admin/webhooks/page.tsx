'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Webhook, Plus, Trash2, RefreshCw, Loader2, AlertCircle, Check, Copy
} from 'lucide-react';
import { apiClient } from '@/lib/axios-client';
import { toast } from 'sonner';

const EVENTS = [
  { value: 'call.completed', label: 'Call Completed' },
  { value: 'call.recording.ready', label: 'Recording Ready' },
  { value: 'call.failed', label: 'Call Failed' },
  { value: 'subscription.created', label: 'Subscription Created' },
  { value: 'subscription.updated', label: 'Subscription Updated' },
  { value: 'subscription.cancelled', label: 'Subscription Cancelled' },
  { value: 'subscription.expired', label: 'Subscription Expired' },
  { value: 'user.created', label: 'User Created' },
  { value: 'ai.action.executed', label: 'AI Action Executed' },
];

interface WebhookEndpoint {
  _id: string;
  url: string;
  description: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
}

export default function AdminWebhooksPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['call.completed']);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await apiClient.get('/webhooks');
      return response.data as WebhookEndpoint[];
    },
  });

  const handleCreate = async () => {
    if (!newUrl.trim() || !newDescription.trim() || newEvents.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsCreating(true);
    try {
      const response = await apiClient.post('/webhooks', {
        url: newUrl.trim(),
        description: newDescription.trim(),
        events: newEvents,
      });
      toast.success('Webhook created');
      setShowSecret(response.data.secret);
      setShowCreate(false);
      setNewUrl('');
      setNewDescription('');
      setNewEvents(['call.completed']);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create webhook');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (webhookId: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/webhooks/${webhookId}`, { isActive });
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(isActive ? 'Webhook activated' : 'Webhook deactivated');
    } catch (err: any) {
      toast.error('Failed to update webhook');
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!window.confirm('Delete this webhook endpoint? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/webhooks/${webhookId}`);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    } catch (err: any) {
      toast.error('Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      await apiClient.post(`/webhooks/${webhookId}/test`);
      toast.success('Test event sent');
    } catch (err: any) {
      toast.error('Failed to send test event');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Webhook className="w-8 h-8 text-purple-500" />
            Webhooks
          </h1>
          <p className="text-slate-400">Configure webhook endpoints to receive real-time events.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Endpoint
        </Button>
      </div>

      {showCreate && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">New Webhook Endpoint</CardTitle>
            <CardDescription className="text-slate-400">Events will be sent to this URL via POST.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Payload URL</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Production notification service"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Events</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewEvents([...newEvents, event.value]);
                        } else {
                          setNewEvents(newEvents.filter((v) => v !== event.value));
                        }
                      }}
                      className="rounded border-slate-600"
                    />
                    {event.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Webhook
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSecret && (
        <Card className="bg-emerald-950/50 border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Webhook Secret</p>
                <code className="text-emerald-300 text-xs font-mono bg-emerald-900/50 px-2 py-0.5 rounded mt-1 block">
                  {showSecret}
                </code>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(showSecret);
                toast.success('Secret copied');
              }}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
            </div>
            <p className="text-emerald-400/70 text-xs mt-2">Save this secret - you won't see it again.</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading webhooks...
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Webhook className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No webhooks configured</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {data.map((wh) => (
                <div key={wh._id} className="p-4 hover:bg-slate-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{wh.description || 'Webhook'}</span>
                        <Badge variant={wh.isActive ? 'success' : 'secondary'} className="rounded-md">
                          {wh.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <code className="text-xs text-slate-400 font-mono mt-1 block truncate">{wh.url}</code>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {wh.events.map((evt) => (
                          <Badge key={evt} variant="outline" className="text-xs text-slate-400 border-slate-700">
                            {evt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={wh.isActive} onCheckedChange={(checked) => handleToggle(wh._id, checked)} />
                      <Button variant="ghost" size="sm" onClick={() => handleTest(wh._id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(wh._id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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