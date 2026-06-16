'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCallHistory } from '@/hooks/use-call-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, PhoneCall, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  completed: 'success',
  failed: 'destructive',
  'in-progress': 'warning',
  pending: 'secondary',
  'no-answer': 'secondary',
  cancelled: 'secondary',
};

const outcomeColors: Record<string, string> = {
  interested: 'text-green-400',
  'not-interested': 'text-red-400',
  'follow-up': 'text-blue-400',
  'no-answer': 'text-yellow-400',
  unknown: 'text-slate-400',
};

function formatDuration(seconds: number): string {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function CallHistoryPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useCallHistory(user?.organizationId || '', page, limit);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <PhoneCall className="w-8 h-8 text-blue-500" />
            Call History
          </h1>
          <p className="text-slate-400">View all calls made by your AI agents.</p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load call history.</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading calls...
            </div>
          ) : !data?.data?.length ? (
            <div className="text-center py-12 text-slate-500">
              <PhoneCall className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No calls found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="pb-3 font-medium">Phone Number</th>
                    <th className="pb-3 font-medium">Agent</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Outcome</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((call: any) => (
                    <tr
                      key={call._id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/call-history/${call._id}`}
                    >
                      <td className="py-3 text-white font-mono">{call.phoneNumber}</td>
                      <td className="py-3 text-slate-300">{call.agentId?.name || 'N/A'}</td>
                      <td className="py-3 text-slate-300">{formatDuration(call.durationSeconds)}</td>
                      <td className="py-3">
                        <span className={`capitalize ${outcomeColors[call.outcome] || 'text-slate-400'}`}>
                          {call.outcome?.replace('-', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={statusColors[call.status] || 'secondary'} className="rounded-md capitalize">
                          {call.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-400 text-xs">
                        {format(new Date(call.createdAt), 'dd MMM yyyy, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="text-slate-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (data.meta.totalPages || 1)}
                  onClick={() => setPage(p => p + 1)}
                  className="text-slate-400"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
