'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check, Loader2, Trash2, Activity, PhoneCall, Clock, Download, Search, Play, Pause
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/axios-client';

interface CallWithRecording {
  _id: string;
  phoneNumber: string;
  recordingUrl?: string;
  recordingDuration?: number;
  status: string;
  createdAt: string;
  customer?: { name?: string };
}

export default function RecordingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recordings', user?.organizationId, currentPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.organizationId) params.append('organizationId', user.organizationId);
      params.append('limit', '10');
      params.append('page', currentPage.toString());
      params.append('search', searchTerm);
      params.append('hasRecording', 'true');
      const response = await apiClient.get(`/calls?${params.toString()}`);
      return response as any as { calls: CallWithRecording[]; total: number };
    },
    enabled: !!user?.organizationId,
  });

  const handlePlay = async (callId: string) => {
    if (playingId === callId) {
      setPlayingId(null);
      if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
      return;
    }
    try {
      const response = await apiClient.get(`/calls/${callId}/recording`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response as any);
      setAudioUrl(url);
      setPlayingId(callId);
    } catch (err) {
      console.error('Failed to load recording', err);
    }
  };

  const handleDownload = async (callId: string) => {
    try {
      const response = await apiClient.get(`/calls/${callId}/recording`, {
        responseType: 'blob',
      });
      const blob = response as any;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${callId}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download recording', err);
    }
  };

  const handleDelete = async (callId: string) => {
    if (!window.confirm('Delete this recording? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/calls/${callId}`);
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      console.error('Failed to delete recording', err);
    }
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const calls = (data as any)?.calls || [];
  const total = (data as any)?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Recordings</h1>
          <p className="text-muted-foreground mt-1">
            Listen to, download, and manage your call recordings.
          </p>
        </div>
        <div className="relative w-full md:w-72 mt-4 md:mt-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by phone number..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
      </div>

      {playingId && audioUrl && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <audio controls autoPlay className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PhoneCall className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recordings found</p>
              <p className="text-sm mt-1">Recordings appear here after calls are completed.</p>
            </div>
          ) : (
            <div className="divide-y">
              {calls.map((call: CallWithRecording) => (
                <div key={call._id} className="flex items-center justify-between p-4 hover:bg-accent/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <PhoneCall className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{call.phoneNumber}</span>
                      {call.customer?.name && (
                        <span className="text-sm text-muted-foreground">({call.customer.name})</span>
                      )}
                      <Badge variant={call.status === 'completed' ? 'success' : 'secondary'} className="capitalize rounded-md">
                        {call.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                      </span>
                      {call.recordingDuration && (
                        <span>{Math.round(call.recordingDuration / 60)} min {call.recordingDuration % 60} sec</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {call.recordingUrl && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handlePlay(call._id)}>
                          {playingId === call._id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(call._id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(call._id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}