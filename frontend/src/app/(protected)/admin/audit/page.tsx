'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle, Clock, Activity, Download, Trash2, Shield, Filter,
  Loader2, Search, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { auditService } from '@/services/audit.service';

export default function AdminAuditLogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, resourceFilter, startDate, endDate, searchInput],
    queryFn: () => auditService.getAuditLogs({
      page,
      limit: 20,
      action: actionFilter || undefined,
      resourceType: resourceFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });

  const handleExport = async () => {
    try {
      const blob = await auditService.exportAuditLogs({
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            Audit Logs
          </h1>
          <p className="text-slate-400">Track all changes and access events across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="ghost" onClick={() => queryClient.invalidateQueries({ queryKey: ['audit-logs'] })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load audit logs: {(error as Error)?.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filters</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-48 bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder="Filter by resource..."
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                className="w-48 bg-slate-800 border-slate-700 text-white"
              />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-40 bg-slate-800 border-slate-700 text-white"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-40 bg-slate-800 border-slate-700 text-white"
              />
              {(actionFilter || resourceFilter || startDate || endDate) && (
                <Button variant="ghost" onClick={() => {
                  setActionFilter(''); setResourceFilter(''); setStartDate(''); setEndDate(''); setPage(1);
                }} className="text-slate-400">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading audit logs...
            </div>
          ) : data?.auditLogs?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">Timestamp</TableHead>
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Resource</TableHead>
                    <TableHead className="text-slate-400">Details</TableHead>
                    <TableHead className="text-slate-400">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.auditLogs?.map((log: any) => (
                    <TableRow key={log._id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {log.user?.email || log.userId || 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 capitalize">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <span className="font-mono text-xs">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="text-slate-500 text-xs ml-1">#{log.resourceId.slice(-6)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                        {log.description || log.details?.message || '-'}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs">{log.ip || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(data?.total ?? 0) > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <span className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, data?.total ?? 0)} of {data?.total ?? 0}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" disabled={page * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}