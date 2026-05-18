'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useAdminAnalytics } from '@/hooks/useAdmin';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-500"></div>
          Aggregating platform analytics...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertDescription>Failed to load real-time database analytics.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <PieChartIcon className="w-8 h-8 text-blue-500" />
            Platform Analytics
          </h1>
          <p className="text-slate-400">Database-driven usage metrics, user growth, and minute consumption.</p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-1.5 flex items-center gap-2">
          DB Connected
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Total Minutes Consumed</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{data.totalMinutesUsed.toLocaleString()} min</div>
            <p className="text-xs text-slate-500">Total across all active subscriptions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {data.userGrowth.reduce((acc: number, curr: any) => acc + curr.users, 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Registered on platform</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-white">Historical User Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {data.userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Not enough data points yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
