'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Loader2, AlertCircle, IndianRupee, Cpu, PhoneCall, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMyOrganizations, useCreateMyOrganization, useUpdateMyOrganization, useDeleteMyOrganization } from '@/hooks/use-admin-organizations';
import { OrganizationForm } from '@/components/common/OrganizationForm';

export default function AdminMyOrganizationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useMyOrganizations({ page, limit });
  const createMutation = useCreateMyOrganization();
  const updateMutation = useUpdateMyOrganization();
  const deleteMutation = useDeleteMyOrganization();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<any | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<any | null>(null);
  const [formError, setFormError] = useState('');

  const orgs = data?.data || [];
  const meta = data?.meta;

  const handleCreate = async (formData: any) => {
    setFormError('');
    try {
      await createMutation.mutateAsync(formData);
      setCreateOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editOrg) return;
    setFormError('');
    try {
      await updateMutation.mutateAsync({ id: editOrg._id, data: formData });
      setEditOrg(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    try {
      await deleteMutation.mutateAsync(deleteOrg._id);
      setDeleteOrg(null);
    } catch (err: any) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            My Organizations
          </h1>
          <p className="text-slate-400">Manage your organizations, billing, and AI agents.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Organization
        </Button>
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
          ) : orgs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>No organizations found. Create one to get started.</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Organization
              </Button>
            </div>
          ) : (
            <>
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
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.map((org: any) => (
                      <TableRow key={org._id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell
                          className="text-slate-300 font-medium cursor-pointer"
                          onClick={() => window.location.href = `/admin/my-organizations/${org._id}`}
                        >
                          {org.name}
                        </TableCell>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditOrg(org); }}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteOrg(org); }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <span className="text-sm text-slate-500">
                    Showing {(meta.page - 1) * limit + 1}-{Math.min(meta.page * limit, meta.total)} of {meta.total}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Create Organization</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new organization. You will be set as the owner.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <OrganizationForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOrg} onOpenChange={(open) => { if (!open) setEditOrg(null); }}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Organization</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update organization details for {editOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {editOrg && (
            <OrganizationForm
              mode="edit"
              initialData={editOrg}
              onSubmit={handleUpdate}
              onCancel={() => setEditOrg(null)}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrg} onOpenChange={(open) => { if (!open) setDeleteOrg(null); }}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Organization</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete <span className="text-white font-medium">{deleteOrg?.name}</span>? This action cannot be undone. All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
