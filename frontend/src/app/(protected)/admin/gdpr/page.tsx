'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield, Download, Trash2, Loader2, AlertCircle, Check, Clock, FileText, UserX, Database
} from 'lucide-react';
import { apiClient } from '@/lib/axios-client';
import { toast } from 'sonner';

export default function AdminGDPRPage() {
  const queryClient = useQueryClient();
  const [dataRetentionDays, setDataRetentionDays] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  const [exportUserId, setExportUserId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['gdpr-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/gdpr-settings');
      return response.data;
    },
  });

  const handleSaveRetention = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/admin/gdpr-settings', { dataRetentionDays });
      toast.success('Data retention policy updated');
      queryClient.invalidateQueries({ queryKey: ['gdpr-settings'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update retention policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportUserData = async () => {
    if (!exportUserId.trim()) return;
    setIsExporting(true);
    try {
      const response = await apiClient.post('/admin/gdpr/export', { userId: exportUserId.trim() }, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${exportUserId.trim()}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('User data export downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to export user data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteUserData = async () => {
    if (!deleteUserId.trim()) return;
    if (confirmDelete !== deleteUserId.trim()) {
      toast.error('User ID confirmation does not match');
      return;
    }
    setIsDeleting(true);
    try {
      await apiClient.post('/admin/gdpr/delete', { userId: deleteUserId.trim() });
      toast.success('User data deletion request submitted');
      setDeleteUserId('');
      setConfirmDelete('');
      queryClient.invalidateQueries({ queryKey: ['gdpr-settings'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete user data');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            GDPR & Data Privacy
          </h1>
          <p className="text-slate-400">Manage data retention, user data exports, and right to erasure requests.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 mr-1" /> Compliant
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Data Retention Policy</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Automatically delete call recordings, transcripts, and analytics after the specified period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Retention Period (Days)</Label>
              <Input
                type="number"
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                min={1}
                max={730}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Min: 1 day, Max: 730 days (2 years)</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Auto-delete old recordings</span>
                <Badge variant="outline" className="text-slate-400 border-slate-700">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Purge transcripts after retention</span>
                <Badge variant="outline" className="text-slate-400 border-slate-700">Enabled</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveRetention} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Retention Policy
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-white">User Data Export</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Export all data associated with a user (GDPR Article 20 - Right to Data Portability).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">User ID</Label>
              <Input
                value={exportUserId}
                onChange={(e) => setExportUserId(e.target.value)}
                placeholder="Enter the user's MongoDB ObjectId"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <Button onClick={handleExportUserData} disabled={isExporting || !exportUserId.trim()}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Export User Data
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-400" />
              <CardTitle className="text-white">Right to Erasure (GDPR Article 17)</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Permanently delete all data associated with a user. This action is irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-slate-300">User ID</Label>
                <Input
                  value={deleteUserId}
                  onChange={(e) => setDeleteUserId(e.target.value)}
                  placeholder="User MongoDB ObjectId"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Confirm User ID</Label>
                <Input
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="Re-enter the User ID to confirm"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="destructive"
                  onClick={handleDeleteUserData}
                  disabled={isDeleting || !deleteUserId.trim() || confirmDelete !== deleteUserId.trim()}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete All User Data
                </Button>
              </div>
            </div>
            <Alert variant="destructive" className="bg-red-950/30 border-red-900/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-red-300">
                This will permanently delete all calls, recordings, transcripts, analytics, and personal data associated with this user. This action cannot be undone.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}