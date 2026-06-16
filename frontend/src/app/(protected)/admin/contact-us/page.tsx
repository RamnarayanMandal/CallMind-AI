'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, AlertCircle, Search, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { contactService } from '@/services/contact.service';

const statusColors: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  new: 'secondary',
  contacted: 'warning',
  resolved: 'success',
  closed: 'default',
};

export default function AdminContactUsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['contacts', page, statusFilter, search],
    queryFn: () => contactService.getAll({ page, limit: 20, status: statusFilter || undefined, search: search || undefined }),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Contact Messages
          </h1>
          <p className="text-slate-400">Manage inquiries submitted through the contact form.</p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load contacts: {(error as Error)?.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input placeholder="Search name, email, subject..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-72 bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="flex gap-2">
              {['', 'new', 'contacted', 'resolved', 'closed'].map(s => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>
                  {s || 'All'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading contacts...
            </div>
          ) : data?.contacts?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No contact messages found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Subject</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.contacts?.map((contact: any) => (
                    <TableRow key={contact._id} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/admin/contact-us/${contact._id}`}>
                      <TableCell className="text-slate-300 font-medium">{contact.name}</TableCell>
                      <TableCell className="text-slate-400">{contact.email}</TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">{contact.subject}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[contact.status] || 'secondary'} className="rounded-md capitalize">
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm whitespace-nowrap">
                        {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(data?.total ?? 0) > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <span className="text-sm text-slate-500">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, data?.total ?? 0)} of {data?.total ?? 0}</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" disabled={page * 20 >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
