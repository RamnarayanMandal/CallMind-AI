'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, AlertCircle, IndianRupee, Cpu, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMyOrganizations } from '@/hooks/use-admin-organizations';

export default function AdminMyOrganizationsPage() {
  const { data: orgs, isLoading, isError, error } = useMyOrganizations();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            My Organizations
          </h1>
          <p className="text-slate-400">View your organizations with billing and AI agent details.</p>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load organizations: {(error as Error)?.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading organizations...
            </div>
          ) : !orgs || orgs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">Organization</TableHead>
                    <TableHead className="text-slate-400">Plan</TableHead>
                    <TableHead className="text-slate-400 text-right">Minutes Used</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <span className="flex items-center justify-end gap-1"><Cpu className="w-3 h-3" /> AI Cost</span>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <span className="flex items-center justify-end gap-1"><PhoneCall className="w-3 h-3" /> Call Cost</span>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      <span className="flex items-center justify-end gap-1"><IndianRupee className="w-3 h-3" /> Total</span>
                    </TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org: any) => (
                    <TableRow key={org._id} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/admin/my-organizations/${org._id}`}>
                      <TableCell className="text-slate-300 font-medium">{org.name}</TableCell>
                      <TableCell className="text-slate-400">{org.planName}</TableCell>
                      <TableCell className="text-right text-slate-300">{org.minutesUsed.toLocaleString()} / {org.minutesLimit >= 999999 ? '∞' : org.minutesLimit.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-purple-400">₹{org.aiCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-blue-400">₹{org.callCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-white">₹{org.totalCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'success' : 'secondary'} className="rounded-md capitalize">
                          {org.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
