'use client';

import React from 'react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { UserTable } from '@/components/admin/UserTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, error } = useAdminUsers();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">Manage all platform users, assign roles, and monitor activity.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            Loading user database...
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && users && (
        <UserTable data={users} />
      )}
    </div>
  );
}
