'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Building2, Users, IndianRupee, PhoneCall, Cpu, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  trialing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  past_due: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  expired: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  no_subscription: 'bg-slate-800/50 text-slate-500 border-slate-700',
};

export default function AdminOrganizationsPage() {
  const { data: orgs, isLoading, isError, error } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: () => adminService.getOrganizations(),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading organizations...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load organizations: {(error as Error)?.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            Organizations
          </h1>
          <p className="text-slate-400">View all organizations with billing details.</p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-4 py-1.5">
          {orgs?.length || 0} total
        </Badge>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Organization</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400 text-right">Users</TableHead>
                <TableHead className="text-slate-400 text-right">Minutes</TableHead>
                <TableHead className="text-slate-400 text-right">AI Cost</TableHead>
                <TableHead className="text-slate-400 text-right">Call Cost</TableHead>
                <TableHead className="text-slate-400 text-right">Total</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-slate-400 text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orgs || orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                orgs.map((org) => (
                  <TableRow key={org._id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{org.name}</span>
                        {org.ownerEmail && (
                          <span className="text-xs text-slate-500">{org.ownerEmail}</span>
                        )}
                        {org.industry && (
                          <span className="text-xs text-slate-600">{org.industry}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{org.planName}</TableCell>
                    <TableCell className="text-right text-slate-300">
                      <div className="flex items-center justify-end gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {org.usersCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      {org.minutesUsed.toLocaleString()} / {org.minutesLimit >= 999999 ? '∞' : org.minutesLimit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-purple-400">₹{org.aiCost.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-blue-400">₹{org.callCost.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white">
                      <div className="flex items-center justify-end gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                        ₹{org.totalCost.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[org.status] || STATUS_COLORS.no_subscription}`}>
                        {org.status === 'no_subscription' ? 'No Plan' : org.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(org.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/admin/organizations/${org._id}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}