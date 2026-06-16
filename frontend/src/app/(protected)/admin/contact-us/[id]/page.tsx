'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AgentSelector } from '@/components/admin/AgentSelector';
import {
  Loader2, AlertCircle, User, Mail, Phone, MessageSquare,
  Bot, PhoneCall, CheckCircle, ArrowLeft, Send,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { contactService } from '@/services/contact.service';
import { useAuth } from '@/hooks/useAuth';

export default function AdminContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [calling, setCalling] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [error, setError] = useState('');

  const { data: contact, isLoading, isError } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactService.getById(id),
    enabled: !!id,
  });

  const { data: agentsData } = useQuery({
    queryKey: ['admin-agents', user?.organizationId],
    queryFn: () => import('@/services/agent.service').then(m => m.agentService.getAll(user?.organizationId || '')),
    enabled: !!user?.organizationId,
  });

  const agentList = agentsData as any;
  const agents = agentList?.data?.data || agentList?.data || [];

  const handleTriggerCall = async () => {
    if (!selectedAgentId) return;
    setCalling(true);
    setError('');
    try {
      await contactService.triggerCall(id, selectedAgentId);
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to trigger call');
    } finally {
      setCalling(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!responseText.trim()) return;
    setSavingResponse(true);
    setError('');
    try {
      await contactService.updateResponse(id, responseText);
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save response');
    } finally {
      setSavingResponse(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading contact details...
        </div>
      </div>
    );
  }

  if (isError || !contact) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load contact.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const callRecord = contact.callId;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <MessageSquare className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{contact.subject}</h1>
            <p className="text-slate-400 mt-1">from {contact.name} · {format(new Date(contact.createdAt), 'dd MMM yyyy, h:mm a')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={contact.status === 'new' ? 'secondary' : contact.status === 'contacted' ? 'warning' : 'success'} className="rounded-md capitalize text-sm px-3 py-1">
            {contact.status}
          </Badge>
          <Link href="/admin/contact-us">
            <Button variant="outline" className="text-slate-400"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contact Information */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Contact Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Name</p>
              <p className="text-white font-medium">{contact.name}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
              <p className="text-white font-medium truncate">{contact.email}</p>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
              <p className="text-white font-medium">{contact.phone}</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-950 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Message</p>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Call Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-white">AI Call</CardTitle>
            <CardDescription className="text-slate-400 ml-auto">
              {callRecord ? `Call status: ${callRecord.status}` : 'Not yet called'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!callRecord ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Select AI Agent to call the contact</label>
                <AgentSelector
                  agents={agents}
                  loading={!agentsData}
                  value={selectedAgentId}
                  onChange={setSelectedAgentId}
                  disabled={calling}
                />
              </div>
              <Button
                onClick={handleTriggerCall}
                disabled={!selectedAgentId || calling}
                className="flex items-center gap-2"
              >
                {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                {calling ? 'Scheduling Call...' : 'Trigger AI Call (within 24h)'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge variant={callRecord.status === 'completed' ? 'success' : callRecord.status === 'failed' ? 'destructive' : 'secondary'} className="rounded-md capitalize">
                    {callRecord.status}
                  </Badge>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Outcome</p>
                  <p className="text-white font-medium capitalize">{callRecord.outcome || 'Pending'}</p>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-white font-medium">{callRecord.durationSeconds ? `${Math.round(callRecord.durationSeconds / 60)} min` : '-'}</p>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Agent</p>
                  <p className="text-white font-medium">{contact.assignedAgentId?.name || 'N/A'}</p>
                </div>
              </div>
              {callRecord.recordingUrl && (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Recording</p>
                  <audio controls className="w-full" src={callRecord.recordingUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Response */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-white">Response</CardTitle>
            {contact.response && (
              <CardDescription className="text-slate-400 ml-auto">
                Responded {format(new Date(contact.respondedAt), 'dd MMM yyyy, h:mm a')}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contact.response ? (
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{contact.response}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder="Write your response to the contact..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <Button onClick={handleSaveResponse} disabled={!responseText.trim() || savingResponse} className="flex items-center gap-2">
                {savingResponse ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {savingResponse ? 'Saving...' : 'Send Response'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
