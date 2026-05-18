'use client';

import React from 'react';
import { useAdminSubscriptions } from '@/hooks/useAdmin';
import { SubscriptionTable } from '@/components/admin/SubscriptionTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSubscriptionsPage() {
  const { data: subscriptions, isLoading, isError, error } = useAdminSubscriptions();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-blue-500" />
            Billing & Subscriptions
          </h1>
          <p className="text-slate-400">Manage organization subscriptions, refunds, and Razorpay billing cycles.</p>
        </div>
        <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            Loading billing records...
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load subscriptions: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && subscriptions && (
        <SubscriptionTable data={subscriptions} />
      )}
    </div>
  );
}
