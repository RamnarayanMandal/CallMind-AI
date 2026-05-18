'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, ShieldCheck, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-500" />
            Platform Settings
          </h1>
          <p className="text-slate-400">Configure global platform limits, webhook secrets, and external API keys.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <CardTitle>Global Security</CardTitle>
            </div>
            <CardDescription className="text-slate-400">Configure JWT and Rate Limiting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium">Strict Rate Limiting</p>
                <p className="text-xs text-slate-500">100 req / minute per IP</p>
              </div>
              <Button variant="outline" size="sm">Modify</Button>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium">JWT Expiry</p>
                <p className="text-xs text-slate-500">Currently set to 7 days</p>
              </div>
              <Button variant="outline" size="sm">Modify</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <CardTitle>API Gateways</CardTitle>
            </div>
            <CardDescription className="text-slate-400">External Provider Webhooks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium">Razorpay Webhook</p>
                <p className="text-xs text-emerald-500">Verified & Active</p>
              </div>
              <Button variant="outline" size="sm">Rotate Secret</Button>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <div>
                <p className="font-medium">Telnyx Webhook</p>
                <p className="text-xs text-emerald-500">Verified & Active</p>
              </div>
              <Button variant="outline" size="sm">Rotate Secret</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
